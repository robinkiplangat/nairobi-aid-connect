from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List
from datetime import datetime
import uuid
from bson import ObjectId
from .schemas import Coordinates, NewHelpRequest, Volunteer, VolunteerStatus, MatchAssignment, ChatSessionEstablished, Resource, Update, MapHotspot

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

# MongoDB Collection Indexes Configuration
MONGODB_INDEXES = {
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