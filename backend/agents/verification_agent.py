import logging
from datetime import datetime

from ..models import schemas
from ..services.database import db_service # Assuming global instance
from ..services.message_bus import message_bus_service # Assuming global instance

logger = logging.getLogger(__name__)

class VerificationAgent:
    def __init__(self):
        # Dependencies can be injected if a more complex DI system is used.
        pass

    async def handle_verification_request(self, payload: schemas.VolunteerVerificationPayload) -> schemas.GenericResponse:
        """
        Handles a volunteer's request to verify themselves using a code.
        Updates volunteer status in DB and publishes to message bus if successful.
        """
        logger.info(f"VerificationAgent processing request for code: {payload.verification_code}")

        # 1. Query Database for the verification code
        #    AGENTS.md implies looking up the code. We need a volunteer schema that stores this.
        #    Let's assume our `schemas.Volunteer` has `verification_code` and `phone_number` (or other unique ID).
        #    The `db_service.get_volunteer_by_verification_code` was a hypothetical example.
        #    Let's refine the DB interaction.

        db = await db_service.get_db()
        volunteer_data = await db["volunteers"].find_one(
            {"verification_code": payload.verification_code}
        )

        if not volunteer_data:
            logger.warning(f"Verification failed: No volunteer found with code {payload.verification_code}")
            return schemas.GenericResponse(success=False, message="Invalid or expired verification code.")

        # Convert raw BSON to Pydantic model. _id needs handling if it's an ObjectId.
        # For simplicity, assuming schemas.Volunteer can handle MongoDB's _id field if aliased.
        # Or, we can manually map fields.
        try:
            # Ensure _id is stringified if it's an ObjectId, or handled by Pydantic model
            if "_id" in volunteer_data and not isinstance(volunteer_data["_id"], str):
                volunteer_data["_id"] = str(volunteer_data["_id"])

            # Map other fields that might need conversion if not directly compatible
            # For example, if skills is a list of dicts in DB but list of strings in Pydantic

            volunteer = schemas.Volunteer(**volunteer_data)
        except Exception as e:
            logger.error(f"Error converting volunteer data for code {payload.verification_code}: {e}", exc_info=True)
            return schemas.GenericResponse(success=False, message="Error processing volunteer data.")


        if volunteer.is_verified:
            logger.info(f"Volunteer {volunteer.volunteer_id} (code: {payload.verification_code}) is already verified.")
            # Decide on behavior: re-send status, or just confirm. Let's confirm and send status.
            # Fall through to publish current status.

        # 2. Validate and Update
        if not volunteer.is_verified:
            logger.info(f"Verification successful for volunteer {volunteer.volunteer_id} (code: {payload.verification_code}). Updating status.")
            update_fields = {
                "is_verified": True,
                "status": "available", # Set to available upon verification
                "last_seen": datetime.utcnow() # Update last_seen
            }
            updated_count = await db["volunteers"].update_one(
                {"_id": volunteer_data["_id"]}, # Use original _id from DB lookup
                {"$set": update_fields}
            )

            if updated_count.modified_count == 0:
                logger.error(f"Failed to update volunteer status for {volunteer.volunteer_id} in DB.")
                # This might happen if the document was changed/deleted between find and update.
                return schemas.GenericResponse(success=False, message="Failed to update volunteer status in database.")

            volunteer.is_verified = True
            volunteer.status = "available"
            volunteer.last_seen = update_fields["last_seen"]
            logger.info(f"Volunteer {volunteer.volunteer_id} status updated to verified and available.")

        # 3. Publish VolunteerStatus to message bus
        volunteer_status_message = schemas.VolunteerStatus(
            volunteer_id=str(volunteer.volunteer_id), # Ensure it's a string
            timestamp=datetime.utcnow(),
            status=volunteer.status
        )

        try:
            await message_bus_service.publish("volunteer:status", volunteer_status_message.model_dump())
            logger.info(f"Published VolunteerStatus for {volunteer.volunteer_id} to 'volunteer:status': {volunteer_status_message.status}")
        except Exception as e:
            logger.error(f"Failed to publish VolunteerStatus for {volunteer.volunteer_id}: {e}", exc_info=True)
            # Non-critical for the verification itself, but important for system state.
            # Could add to a retry queue. For now, log and proceed with success response to user.
            # The API response should still reflect successful verification if DB update was okay.

        return schemas.GenericResponse(
            success=True,
            message="Volunteer successfully verified and status updated.",
            details=volunteer_status_message.model_dump()
        )

# Global instance
verification_agent = VerificationAgent()
