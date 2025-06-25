import logging
import asyncio # For potential background tasks or refined caching
from datetime import datetime

from ..models import schemas
from ..services.database import db_service
from ..services.message_bus import message_bus_service
from ..services.config import settings

logger = logging.getLogger(__name__)

class DispatcherAgent:
    def __init__(self):
        # Cache for available volunteers: Dict[str, schemas.Volunteer]
        # self.available_volunteers_cache: dict[str, schemas.Volunteer] = {}
        # For simplicity in this iteration, we will primarily rely on DB queries.
        # The cache can be added as an optimization.
        logger.info("DispatcherAgent initialized.")

    async def start_listening(self):
        """
        Subscribes to relevant topics on the message bus.
        This should be called after the message bus service is connected.
        """
        try:
            # Ensure message_bus_service is connected (or handle gracefully)
            if not message_bus_service.redis_client or not message_bus_service.redis_client.is_connected():
                logger.error("DispatcherAgent: Message bus not connected. Cannot start listening.")
                # Optionally, retry connection or raise an error that can be handled during startup
                await message_bus_service.connect() # Attempt to connect if not already
                if not message_bus_service.redis_client or not message_bus_service.redis_client.is_connected():
                     logger.critical("DispatcherAgent: Failed to connect to message bus. Listener not started.")
                     return # Critical failure, cannot proceed

            message_bus_service.subscribe("sos-requests:new", self.handle_new_help_request)
            message_bus_service.subscribe("volunteer:status", self.handle_volunteer_status_update)
            logger.info("DispatcherAgent is now listening for 'sos-requests:new' and 'volunteer:status' topics.")
        except Exception as e:
            logger.error(f"DispatcherAgent failed to start listening: {e}", exc_info=True)
            # This is a critical failure for the agent's operation.

    async def handle_new_help_request(self, message: dict):
        """
        Callback for messages on the 'sos-requests:new' topic.
        Processes a NewHelpRequest, finds a volunteer, and creates an assignment.
        """
        try:
            request_data = schemas.NewHelpRequest(**message)
            logger.info(f"DispatcherAgent received NewHelpRequest: {request_data.request_id}")
        except Exception as e:
            logger.error(f"DispatcherAgent: Error parsing NewHelpRequest message: {e} - Data: {message}", exc_info=True)
            return

        # 1. Store Request in MongoDB
        try:
            # The `NewHelpRequest` model has `request_id` and `timestamp` auto-generated.
            # The status is also part of the model, defaulting to 'pending'.
            await db_service.insert_document("help_requests", request_data.model_dump())
            logger.info(f"NewHelpRequest {request_data.request_id} stored in 'help_requests' collection.")
        except Exception as e:
            logger.error(f"DispatcherAgent: Failed to store NewHelpRequest {request_data.request_id}: {e}", exc_info=True)
            # If DB store fails, we might not want to proceed with assignment.
            # Or, implement a retry mechanism / dead-letter queue.
            return

        # 2. Find Available, Verified, Skilled Volunteers Nearby
        try:
            logger.info(f"Searching for volunteers for request {request_data.request_id} (type: {request_data.request_type}) at {request_data.coordinates}")
            # AGENTS.md: "skills matching the request_type"
            # Our Volunteer schema has a list of skills. request_type is a single skill.
            required_skills = [request_data.request_type] # Assuming request_type is one of "Medical", "Legal", "Shelter"

            nearby_volunteers = await db_service.find_nearby_volunteers(
                coordinates=request_data.coordinates,
                radius_km=settings.VOLUNTEER_MATCH_RADIUS_KM,
                skills=required_skills
            )
        except Exception as e:
            logger.error(f"DispatcherAgent: Error finding nearby volunteers for {request_data.request_id}: {e}", exc_info=True)
            return

        if not nearby_volunteers:
            logger.warning(f"No suitable volunteers found for request {request_data.request_id}. Flagging for manual review (simulated).")
            # TODO: Implement actual flagging for manual review (e.g., update request status in DB)
            await db_service.update_document_by_id(
                "help_requests",
                request_data.request_id,
                {"status": "pending_manual_assignment", "status_updated_at": datetime.utcnow()}
            )
            return

        # 3. Select Best Match (e.g., closest one - find_nearby_volunteers might already sort by distance)
        # For now, picking the first one from the list. MongoDB's $nearSphere sorts by distance.
        selected_volunteer = nearby_volunteers[0]
        logger.info(f"Selected volunteer {selected_volunteer.volunteer_id} for request {request_data.request_id}.")

        # 4. Create Assignment: Update volunteer status and publish MatchAssignment
        try:
            # Update volunteer's status to 'busy' in DB
            # Ensure volunteer_id is a string for Pydantic model and DB operations
            volunteer_id_str = str(selected_volunteer.volunteer_id)

            update_success = await db_service.update_document_by_id(
                "volunteers",
                volunteer_id_str,
                {"status": "busy", "last_assigned_request_id": request_data.request_id, "status_updated_at": datetime.utcnow()}
            )
            if not update_success:
                logger.error(f"Failed to update status to 'busy' for volunteer {volunteer_id_str}. Volunteer might have been updated by another process. Aborting assignment.")
                # Potentially re-queue the request or try another volunteer.
                return

            # Create MatchAssignment object
            match_assignment = schemas.MatchAssignment(
                # assignment_id is auto-generated
                request_id=request_data.request_id,
                volunteer_id=volunteer_id_str
                # requester_token and volunteer_token are auto-generated
            )

            # Publish MatchAssignment to 'assignments:create' topic
            await message_bus_service.publish("assignments:create", match_assignment.model_dump())
            logger.info(f"Published MatchAssignment {match_assignment.assignment_id} for request {request_data.request_id} and volunteer {volunteer_id_str} to 'assignments:create'.")

            # Update help_request status to 'assigned'
            await db_service.update_document_by_id(
                "help_requests",
                request_data.request_id,
                {"status": "assigned", "assigned_volunteer_id": volunteer_id_str, "assignment_id": match_assignment.assignment_id, "status_updated_at": datetime.utcnow()}
            )
            logger.info(f"HelpRequest {request_data.request_id} status updated to 'assigned'.")

        except Exception as e:
            logger.error(f"DispatcherAgent: Error creating assignment for request {request_data.request_id}: {e}", exc_info=True)
            # Rollback or compensation logic might be needed here (e.g., set volunteer back to 'available' if assignment publish fails)
            # This is complex and depends on atomicity requirements.
            # For now, log the error.

    async def handle_volunteer_status_update(self, message: dict):
        """
        Callback for messages on the 'volunteer:status' topic.
        Updates the local cache of available volunteers (future enhancement).
        """
        try:
            status_data = schemas.VolunteerStatus(**message)
            logger.info(f"DispatcherAgent received VolunteerStatus update: Volunteer {status_data.volunteer_id} is now {status_data.status}.")

            # AGENTS.md: "maintain an up-to-date cache of available volunteers."
            # This is a simplified approach. A real cache would need careful management
            # (e.g., handling TTL, consistency with DB, loading initial state).

            # Example of simple cache update (if self.available_volunteers_cache was used):
            # if status_data.status == "available":
            #     # Fetch full volunteer details to cache, or ensure status message has enough info.
            #     # This might require another DB lookup if VolunteerStatus message is minimal.
            #     # For now, let's assume we'd need to fetch.
            #     volunteer_doc = await db_service.find_document_by_id("volunteers", status_data.volunteer_id)
            #     if volunteer_doc:
            #         # Ensure _id is stringified
            #         if "_id" in volunteer_doc and not isinstance(volunteer_doc["_id"], str):
            #             volunteer_doc["_id"] = str(volunteer_doc["_id"])
            #         try:
            #             self.available_volunteers_cache[status_data.volunteer_id] = schemas.Volunteer(**volunteer_doc)
            #             logger.debug(f"Volunteer {status_data.volunteer_id} added/updated in DispatcherAgent cache.")
            #         except Exception as e_parse:
            #             logger.error(f"Error parsing volunteer data for cache: {e_parse}")
            # elif status_data.volunteer_id in self.available_volunteers_cache:
            #     del self.available_volunteers_cache[status_data.volunteer_id]
            #     logger.debug(f"Volunteer {status_data.volunteer_id} removed from DispatcherAgent cache due to status {status_data.status}.")

        except Exception as e:
            logger.error(f"DispatcherAgent: Error processing VolunteerStatus message: {e} - Data: {message}", exc_info=True)

    # async def stop_listening(self):
    #     # This might not be strictly necessary if message_bus_service.disconnect()
    #     # handles unsubscription and task cancellation properly.
    #     logger.info("DispatcherAgent stopping listeners (simulated - actual stop handled by message_bus_service).")
    #     pass

    async def assign_specific_request(self, request_id: str, volunteer_id: str) -> dict:
        """
        Attempts to assign a specific request_id to a specific volunteer_id.
        This is typically called when a volunteer manually accepts a request from the map.
        Returns a dict with 'success': bool and 'message': str, 'details': Optional[dict].
        """
        logger.info(f"DispatcherAgent attempting to assign request {request_id} to volunteer {volunteer_id}.")

        db = await db_service.get_db()

        # 1. Fetch Request details
        request_data_raw = await db["help_requests"].find_one({"request_id": request_id})
        if not request_data_raw:
            logger.warning(f"assign_specific_request: Request {request_id} not found.")
            return {"success": False, "message": "Request not found."}

        try:
            request_data = schemas.NewHelpRequest(**request_data_raw)
        except Exception as e:
            logger.error(f"Error parsing request data for {request_id}: {e}", exc_info=True)
            return {"success": False, "message": "Error processing request data."}

        if request_data.status not in ["pending", "pending_manual_assignment"]:
            logger.warning(f"assign_specific_request: Request {request_id} is not in an assignable state (status: {request_data.status}).")
            return {"success": False, "message": f"Request is already {request_data.status}."}

        # 2. Fetch Volunteer details
        # Assuming volunteer_id is the string representation of MongoDB's _id or a specific 'volunteer_id' field
        # The VerificationAgent generates a session token based on volunteer.volunteer_id (which is a string)
        # So, we should query by that string ID.
        volunteer_data_raw = await db["volunteers"].find_one({"volunteer_id": volunteer_id})
        if not volunteer_data_raw:
            # Fallback if using MongoDB ObjectId as primary key and volunteer_id is that.
            # This depends on how volunteer_id is stored and queried consistently.
            # For now, assume volunteer_id is the queryable field.
            logger.warning(f"assign_specific_request: Volunteer {volunteer_id} not found.")
            return {"success": False, "message": "Volunteer not found."}

        try:
            if "_id" in volunteer_data_raw and not isinstance(volunteer_data_raw["_id"], str): # Ensure _id is string if it's used internally
                 volunteer_data_raw["_id"] = str(volunteer_data_raw["_id"])
            selected_volunteer = schemas.Volunteer(**volunteer_data_raw)
        except Exception as e:
            logger.error(f"Error parsing volunteer data for {volunteer_id}: {e}", exc_info=True)
            return {"success": False, "message": "Error processing volunteer data."}

        if not selected_volunteer.is_verified:
            logger.warning(f"assign_specific_request: Volunteer {volunteer_id} is not verified.")
            return {"success": False, "message": "Volunteer is not verified."}
        if selected_volunteer.status != "available":
            logger.warning(f"assign_specific_request: Volunteer {volunteer_id} is not available (status: {selected_volunteer.status}).")
            return {"success": False, "message": f"Volunteer is currently {selected_volunteer.status}."}

        # Check if volunteer has the required skill for the request
        if request_data.request_type not in selected_volunteer.skills:
            logger.warning(f"assign_specific_request: Volunteer {volunteer_id} (skills: {selected_volunteer.skills}) does not have required skill: {request_data.request_type}.")
            return {"success": False, "message": f"Volunteer does not have the required skill ({request_data.request_type})."}

        # 3. Create Assignment (similar to handle_new_help_request)
        try:
            volunteer_id_str = str(selected_volunteer.volunteer_id) # Should already be a string

            # Atomically update volunteer status if still available (prevent race conditions)
            # Using find_one_and_update to ensure atomicity
            updated_volunteer_doc = await db["volunteers"].find_one_and_update(
                {"volunteer_id": volunteer_id_str, "status": "available"},
                {"$set": {"status": "busy", "last_assigned_request_id": request_data.request_id, "status_updated_at": datetime.utcnow()}},
                return_document=True # Return the updated document
            )

            if not updated_volunteer_doc:
                logger.error(f"Failed to update status to 'busy' for volunteer {volunteer_id_str} (possibly became unavailable). Aborting assignment.")
                return {"success": False, "message": "Volunteer became unavailable before assignment."}


            match_assignment = schemas.MatchAssignment(
                request_id=request_data.request_id,
                volunteer_id=volunteer_id_str
            )
            await message_bus_service.publish("assignments:create", match_assignment.model_dump())
            logger.info(f"Published MatchAssignment {match_assignment.assignment_id} for request {request_data.request_id} and volunteer {volunteer_id_str} to 'assignments:create'.")

            await db["help_requests"].update_one(
                {"request_id": request_data.request_id},
                {"$set": {"status": "assigned", "assigned_volunteer_id": volunteer_id_str, "assignment_id": match_assignment.assignment_id, "status_updated_at": datetime.utcnow()}}
            )
            logger.info(f"HelpRequest {request_data.request_id} status updated to 'assigned' to volunteer {volunteer_id_str}.")

            return {
                "success": True,
                "message": "Request successfully assigned.",
                "details": match_assignment.model_dump()
            }

        except Exception as e:
            logger.error(f"DispatcherAgent: Error creating assignment for request {request_data.request_id} (manual accept): {e}", exc_info=True)
            # Potential rollback: if volunteer status was updated but publish/request update failed, set volunteer back to available.
            # This is complex; for now, just log.
            await db["volunteers"].update_one( # Attempt to revert volunteer status
                 {"volunteer_id": volunteer_id_str, "last_assigned_request_id": request_data.request_id},
                 {"$set": {"status": "available"}, "$unset": {"last_assigned_request_id": ""}}
            )
            return {"success": False, "message": "Internal error during assignment process."}


# Global instance
dispatcher_agent = DispatcherAgent()
