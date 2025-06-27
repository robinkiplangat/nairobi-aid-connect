from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
from services.config import settings
from models import schemas # Relative import from parent package
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    async def connect_to_mongo(self):
        logger.info("Connecting to MongoDB...")
        if not self.client: # Ensure client is only created once
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            try:
                # The ismaster command is cheap and does not require auth.
                await self.client.admin.command('ismaster')
                logger.info("MongoDB connection successful.")
                self.db = self.client[settings.MONGODB_DATABASE_NAME]
            except ConnectionFailure:
                logger.error("MongoDB connection failed. Server not available.")
                self.client = None # Reset client on failure
                raise ConnectionFailure("Failed to connect to MongoDB.")
            except Exception as e:
                logger.error(f"An error occurred during MongoDB connection: {e}")
                self.client = None
                raise

    async def close_mongo_connection(self):
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed.")

    async def get_db(self) -> AsyncIOMotorDatabase:
        if not self.db or not self.client:
            await self.connect_to_mongo()
        if not self.db: # Should not happen if connect_to_mongo succeeded without error
             raise ConnectionFailure("Database not initialized. Connection might have failed silently or was closed.")
        return self.db

    # --- Generic CRUD Operations (Examples) ---
    # These can be expanded or made more specific for each collection/model

    async def insert_document(self, collection_name: str, document_data: dict) -> str:
        """Inserts a single document and returns its ID."""
        db = await self.get_db()
        result = await db[collection_name].insert_one(document_data)
        return str(result.inserted_id)

    async def find_document_by_id(self, collection_name: str, document_id: str) -> Optional[dict]:
        """Finds a document by its string ID (assuming it's a string representation of ObjectId or a custom string ID)."""
        from bson import ObjectId # Import here to avoid top-level dependency if not always used
        db = await self.get_db()
        try:
            obj_id = ObjectId(document_id)
            return await db[collection_name].find_one({"_id": obj_id})
        except Exception: # Invalid ID format or other error
            return await db[collection_name].find_one({"id": document_id}) # Fallback for custom string IDs

    async def find_documents(self, collection_name: str, query: dict, limit: int = 0, skip: int = 0) -> List[dict]:
        """Finds multiple documents matching a query."""
        db = await self.get_db()
        cursor = db[collection_name].find(query)
        if skip > 0:
            cursor = cursor.skip(skip)
        if limit > 0:
            cursor = cursor.limit(limit)
        return await cursor.to_list(length=limit if limit > 0 else None)

    async def update_document_by_id(self, collection_name: str, document_id: str, update_data: dict) -> bool:
        """Updates a document by its ID. Returns True if update was successful (matched at least one doc)."""
        from bson import ObjectId
        db = await self.get_db()
        try:
            obj_id = ObjectId(document_id)
            query = {"_id": obj_id}
        except Exception:
            query = {"id": document_id}

        result = await db[collection_name].update_one(query, {"$set": update_data})
        return result.matched_count > 0

    async def delete_document_by_id(self, collection_name: str, document_id: str) -> bool:
        """Deletes a document by its ID. Returns True if deletion was successful."""
        from bson import ObjectId
        db = await self.get_db()
        try:
            obj_id = ObjectId(document_id)
            query = {"_id": obj_id}
        except Exception:
            query = {"id": document_id}
        result = await db[collection_name].delete_one(query)
        return result.deleted_count > 0

    # --- Additional methods needed by organization_service.py ---
    
    async def add_document(self, collection_name: str, document_data: dict) -> Optional[str]:
        """Adds a document and returns the document ID if successful."""
        try:
            doc_id = await self.insert_document(collection_name, document_data)
            return doc_id
        except Exception as e:
            logger.error(f"Error adding document to {collection_name}: {e}")
            return None

    async def get_document_by_field(self, collection_name: str, field_name: str, field_value: Any) -> Optional[dict]:
        """Finds a document by a specific field value."""
        db = await self.get_db()
        try:
            return await db[collection_name].find_one({field_name: field_value})
        except Exception as e:
            logger.error(f"Error getting document from {collection_name} by {field_name}: {e}")
            return None

    async def get_documents_by_field(self, collection_name: str, field_name: str, field_value: Any) -> List[dict]:
        """Finds multiple documents by a specific field value."""
        db = await self.get_db()
        try:
            cursor = db[collection_name].find({field_name: field_value})
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting documents from {collection_name} by {field_name}: {e}")
            return []

    async def update_document(self, collection_name: str, document_id: str, update_data: dict) -> bool:
        """Updates a document by its ID. Returns True if update was successful."""
        return await self.update_document_by_id(collection_name, document_id, update_data)

    # --- Application Specific Database Operations (Examples - to be expanded by agents) ---

    async def get_volunteer_by_verification_code(self, code: str) -> Optional[schemas.Volunteer]:
        db = await self.get_db()
        volunteer_data = await db["volunteers"].find_one({"verification_code": code, "is_verified": False})
        if volunteer_data:
            return schemas.Volunteer(**volunteer_data)
        return None

    async def update_volunteer_status(self, volunteer_id: str, status: schemas.VolunteerStatus) -> bool:
        # Assuming volunteer_id is the string representation of MongoDB's _id
        return await self.update_document_by_id("volunteers", volunteer_id, status.model_dump())

    async def save_help_request(self, request: schemas.NewHelpRequest) -> str:
        return await self.insert_document("help_requests", request.model_dump())

    async def get_active_help_requests(self) -> List[schemas.NewHelpRequest]:
        requests_data = await self.find_documents("help_requests", {"status": "pending"}) # Or other active statuses
        return [schemas.NewHelpRequest(**req) for req in requests_data]

    async def get_resources(self, category: Optional[str] = None) -> List[schemas.Resource]:
        query = {}
        if category:
            query["category"] = category
        resources_data = await self.find_documents("resources", query)
        return [schemas.Resource(**res) for res in resources_data]

    async def get_updates(self, limit: int = 20) -> List[schemas.Update]:
        updates_data = await self.find_documents("updates", {}, limit=limit) # Add sorting by timestamp desc
        return [schemas.Update(**upd) for upd in updates_data]

    # Geospatial query example (requires a 2dsphere index on the location field in MongoDB)
    # Example: db.volunteers.createIndex({ "current_location.coordinates": "2dsphere" })
    async def find_nearby_volunteers(self, coordinates: schemas.Coordinates, radius_km: float, skills: List[str]) -> List[schemas.Volunteer]:
        db = await self.get_db()
        # MongoDB's $nearSphere expects distance in radians if using legacy coordinates,
        # or meters if using GeoJSON Point.
        # For GeoJSON Point and $nearSphere with $maxDistance in meters:
        # Radius in meters
        radius_meters = radius_km * 1000
        query = {
            "current_location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [coordinates.lng, coordinates.lat] # GeoJSON is [lng, lat]
                    },
                    "$maxDistance": radius_meters
                }
            },
            "is_verified": True,
            "status": "available",
            "skills": {"$in": skills} # Volunteer must have at least one of the required skills
        }
        volunteers_data = await self.find_documents("volunteers", query)
        return [schemas.Volunteer(**vol) for vol in volunteers_data]


# Global instance, can be managed with FastAPI lifespan events
db_service = DatabaseService()

# FastAPI lifespan event handlers (to be added in main.py)
# @app.on_event("startup")
# async def startup_db_client():
#     await db_service.connect_to_mongo()

# @app.on_event("shutdown")
# async def shutdown_db_client():
#     await db_service.close_mongo_connection()

# Example usage (typically in an agent or another service):
# async def some_function():
#     await db_service.connect_to_mongo() # Ensure connected
#     volunteer = await db_service.get_volunteer_by_verification_code("some_code")
#     if volunteer:
#         print(f"Found volunteer: {volunteer.name}")
#     await db_service.close_mongo_connection() # Or manage connection globally
