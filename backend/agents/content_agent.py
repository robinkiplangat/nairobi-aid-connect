import logging
from typing import List, Optional

from models import schemas
from services.database import db_service # Assuming global instance

logger = logging.getLogger(__name__)

class ContentAgent:
    def __init__(self):
        logger.info("ContentAgent initialized.")
        # This agent is stateless for now, relying on db_service for all data.

    async def fetch_active_hotspots(self, limit: int = 200) -> List[schemas.MapHotspot]:
        """
        Fetches active help requests suitable for map hotspot visualization.
        Active requests are those with status 'pending' or 'pending_manual_assignment'.
        """
        logger.info(f"ContentAgent fetching active hotspots with limit={limit}.")
        try:
            db = await db_service.get_db()
            # Define what constitutes an "active" request for map display
            active_statuses = ["pending", "pending_manual_assignment"]

            # Query for active requests, sorted by timestamp descending to get recent ones if limit is hit
            hotspots_data_cursor = db["help_requests"].find(
                {"status": {"$in": active_statuses}}
            ).sort("timestamp", -1).limit(limit) # pymongo uses -1 for descending

            hotspots = []
            async for req_data in hotspots_data_cursor:
                # Ensure _id is stringified if it's an ObjectId from MongoDB
                # request_id should already be a string from our NewHelpRequest model
                # id_field = str(req_data["_id"]) if "_id" in req_data else req_data.get("request_id")
                # Our NewHelpRequest uses 'request_id' as the primary string ID.

                try:
                    hotspot = schemas.MapHotspot(
                        id=req_data["request_id"], # This is the UUID string
                        coordinates=schemas.Coordinates(**req_data["coordinates"]), # Assuming coordinates is a dict
                        request_type=req_data["request_type"],
                        timestamp=req_data["timestamp"]
                    )
                    hotspots.append(hotspot)
                except Exception as e_parse:
                    logger.error(f"Error parsing help request data into MapHotspot: {e_parse} - Data: {req_data}", exc_info=True)
                    continue # Skip this request if it can't be parsed

            logger.info(f"Fetched {len(hotspots)} active hotspots for map display.")
            return hotspots
        except Exception as e:
            logger.error(f"ContentAgent: Error fetching active hotspots from database: {e}", exc_info=True)
            raise


    async def fetch_updates(self, limit: int = 20, skip: int = 0) -> List[schemas.Update]:
        """
        Fetches a list of real-time updates from the database.
        """
        logger.info(f"ContentAgent fetching updates with limit={limit}, skip={skip}.")
        try:
            # The db_service.get_updates method should handle sorting by timestamp descending.
            # Let's ensure that method in db_service is implemented or refined.
            # For now, assuming it exists and returns List[schemas.Update].

            # db_service.find_documents already supports limit and skip.
            # We need to ensure it sorts by timestamp.
            # Modifying the call to db_service.find_documents to include sorting.

            db = await db_service.get_db()
            # MongoDB sort: [("field_name", pymongo.DESCENDING)] or [("field_name", -1)]
            # motor uses the same syntax.
            updates_data = await db["updates"].find({}).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)

            parsed_updates = []
            for upd_data in updates_data:
                if "_id" in upd_data and not isinstance(upd_data["_id"], str):
                    upd_data["_id"] = str(upd_data["_id"]) # Ensure _id is string
                parsed_updates.append(schemas.Update(**upd_data))

            logger.info(f"Fetched {len(parsed_updates)} updates from database.")
            return parsed_updates
        except Exception as e:
            logger.error(f"ContentAgent: Error fetching updates from database: {e}", exc_info=True)
            # Depending on desired behavior, could return empty list or raise an error
            # to be caught by the API endpoint. Raising allows FastAPI to return a 500.
            raise # Re-raise the exception

    async def fetch_resources(self, category: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[schemas.Resource]:
        """
        Fetches a list of resources from the Resource Hub, optionally filtered by category.
        """
        logger.info(f"ContentAgent fetching resources with category='{category}', limit={limit}, skip={skip}.")
        try:
            query = {}
            if category:
                query["category"] = category

            # Assuming resources should also be sorted, e.g., by title or last_updated
            db = await db_service.get_db()
            resources_data = await db["resources"].find(query).sort("title", 1).skip(skip).limit(limit).to_list(length=limit) # Sort by title ascending

            parsed_resources = []
            for res_data in resources_data:
                if "_id" in res_data and not isinstance(res_data["_id"], str):
                    res_data["_id"] = str(res_data["_id"]) # Ensure _id is string
                parsed_resources.append(schemas.Resource(**res_data))

            logger.info(f"Fetched {len(parsed_resources)} resources from database.")
            return parsed_resources
        except Exception as e:
            logger.error(f"ContentAgent: Error fetching resources from database: {e}", exc_info=True)
            raise # Re-raise the exception

# Global instance
content_agent = ContentAgent()
