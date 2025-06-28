from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List
from datetime import datetime
import uuid
from bson import ObjectId
from .schemas import (
    Coordinates, NewHelpRequest, Volunteer, VolunteerStatus,
    MatchAssignment, ChatSessionEstablished, Resource, Update, MapHotspot,
    Organization, OrganizationUser, OrganizationApiKey,
    DemoData, Records
)

# MongoDB ObjectId wrapper for Pydantic v2
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# MongoDB Models with ObjectId support
class MongoHelpRequest(NewHelpRequest):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoVolunteer(Volunteer):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoMatchAssignment(MatchAssignment):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoChatSession(ChatSessionEstablished):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoResource(Resource):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoUpdate(Update):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoMapHotspot(MapHotspot):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# --- Organization MongoDB Models ---

class MongoOrganization(Organization):
    # The 'id' field from Pydantic schema will be '_id' in MongoDB.
    # We use PyObjectId for '_id' to ensure it's a MongoDB ObjectId.
    # The alias in the Pydantic schema 'Organization' (id: str = Field(default_factory=..., alias="id"))
    # might conflict if we also try to alias '_id' to 'id' here.
    # It's generally better to have the Pydantic model define 'id' as the string representation
    # and the Mongo model use '_id' as PyObjectId.
    # For this model, Organization already defines 'organization_id' as the primary string ID.
    # We can add '_id' for MongoDB's internal usage.
    mongo_db_id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True, # Allows using '_id' as 'mongo_db_id'
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoOrganizationUser(OrganizationUser):
    mongo_db_id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoOrganizationApiKey(OrganizationApiKey):
    mongo_db_id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoDemoData(DemoData):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class MongoRecords(Records):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# MongoDB Collection Indexes Configuration
MONGODB_INDEXES = {
    "organizations": [
        {
            "keys": [("name", 1)],
            "name": "organization_name_index",
            "unique": True
        },
        {
            "keys": [("organization_type", 1)], # Schema uses 'type' as alias
            "name": "organization_type_index"
        },
        {
            "keys": [("is_verified", 1)],
            "name": "organization_is_verified_index"
        }
    ],
    "organization_users": [
        {
            "keys": [("email", 1)],
            "name": "org_user_email_index",
            "unique": True
        },
        {
            "keys": [("organization_id", 1)],
            "name": "org_user_organization_id_index"
        },
        {
            "keys": [("role", 1)],
            "name": "org_user_role_index"
        }
    ],
    "organization_api_keys": [
        {
            "keys": [("hashed_key", 1)], # For looking up by actual API key
            "name": "org_api_key_hashed_key_index",
            "unique": True,
            "sparse": True # Since not all documents might have it initially if created differently
        },
        {
            "keys": [("organization_id", 1)],
            "name": "org_api_key_organization_id_index"
        }
    ],
    "help_requests": [
        {
            "keys": [("status", 1)],
            "name": "status_index"
        },
        {
            "keys": [("timestamp", -1)],
            "name": "timestamp_desc_index"
        },
        {
            "keys": [("request_type", 1)],
            "name": "request_type_index"
        },
        {
            "keys": [("coordinates", "2dsphere")],
            "name": "location_2dsphere_index"
        }
    ],
    "volunteers": [
        {
            "keys": [("verification_code", 1)],
            "name": "verification_code_index",
            "unique": True,
            "sparse": True
        },
        {
            "keys": [("is_verified", 1)],
            "name": "is_verified_index"
        },
        {
            "keys": [("status", 1)],
            "name": "status_index"
        },
        {
            "keys": [("skills", 1)],
            "name": "skills_index"
        },
        {
            "keys": [("current_location", "2dsphere")],
            "name": "location_2dsphere_index"
        }
    ],
    "match_assignments": [
        {
            "keys": [("request_id", 1)],
            "name": "request_id_index"
        },
        {
            "keys": [("volunteer_id", 1)],
            "name": "volunteer_id_index"
        },
        {
            "keys": [("timestamp", -1)],
            "name": "timestamp_desc_index"
        }
    ],
    "chat_sessions": [
        {
            "keys": [("chat_room_id", 1)],
            "name": "chat_room_id_index",
            "unique": True
        },
        {
            "keys": [("assignment_id", 1)],
            "name": "assignment_id_index"
        },
        {
            "keys": [("timestamp", -1)],
            "name": "timestamp_desc_index"
        }
    ],
    "resources": [
        {
            "keys": [("category", 1)],
            "name": "category_index"
        },
        {
            "keys": [("last_updated", -1)],
            "name": "last_updated_desc_index"
        }
    ],
    "updates": [
        {
            "keys": [("timestamp", -1)],
            "name": "timestamp_desc_index"
        },
        {
            "keys": [("source", 1)],
            "name": "source_index"
        }
    ],
    "map_hotspots": [
        {
            "keys": [("coordinates", "2dsphere")],
            "name": "location_2dsphere_index"
        },
        {
            "keys": [("timestamp", -1)],
            "name": "timestamp_desc_index"
        },
        {
            "keys": [("request_type", 1)],
            "name": "request_type_index"
        }
    ],
    "demodata": [
        {
            "keys": [("name", 1)],
            "name": "demodata_name_index",
            "unique": True
        }
    ],
    "records": [
        {
            "keys": [("name", 1)],
            "name": "records_name_index",
            "unique": True
        }
    ]
}

# Redis Key Patterns and TTL Configuration
REDIS_CONFIG = {
    "keys": {
        "chat_session": "chat:{chat_room_id}",
        "volunteer_status": "volunteer:status:{volunteer_id}",
        "active_requests": "requests:active",
        "volunteer_location": "volunteer:location:{volunteer_id}",
        "request_hotspots": "map:hotspots",
        "verification_codes": "verification:{code}",
        "rate_limits": "rate_limit:{ip}",
        "session_tokens": "session:{token}"
    },
    "ttl": {
        "chat_session": 86400,  # 24 hours
        "volunteer_status": 3600,  # 1 hour
        "active_requests": 300,  # 5 minutes
        "volunteer_location": 1800,  # 30 minutes
        "request_hotspots": 600,  # 10 minutes
        "verification_codes": 3600,  # 1 hour
        "rate_limits": 60,  # 1 minute
        "session_tokens": 86400  # 24 hours
    }
} 