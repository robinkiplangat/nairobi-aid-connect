from pydantic import BaseModel, Field, validator
from typing import Literal, Optional
from datetime import datetime
import uuid
import re

class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90)  # Latitude bounds
    lng: float = Field(..., ge=-180, le=180)  # Longitude bounds

class NewHelpRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Literal["direct_app", "twitter"]
    request_type: Literal["Medical", "Legal", "Shelter"]
    location_text: str = Field(..., min_length=5, max_length=200)
    coordinates: Coordinates
    original_content: str = Field(..., min_length=10, max_length=1000)
    status: str = "pending"  # Added status for tracking

    @validator('original_content')
    def sanitize_content(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

    @validator('location_text')
    def sanitize_location(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        return v.strip()

class Volunteer(BaseModel):
    volunteer_id: str = Field(default_factory=lambda: str(uuid.uuid4())) # Or use MongoDB's ObjectId if preferred and handle conversion
    name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15) # Assuming this is used for contact/identification
    skills: list[Literal["Medical", "Legal", "Shelter"]]
    verification_code: Optional[str] = None
    is_verified: bool = False
    status: Literal["available", "busy", "offline"] = "offline"
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    # Storing coordinates directly on volunteer for geospatial queries
    current_location: Optional[Coordinates] = None

    @validator('name')
    def sanitize_name(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

    @validator('phone_number')
    def validate_phone(cls, v):
        # Ensure phone number format (allows +, digits, spaces, hyphens, parentheses)
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        # Remove all non-digit characters except + for validation
        digits_only = re.sub(r'[^\d+]', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number too short')
        return v

class VolunteerStatus(BaseModel):
    volunteer_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["available", "busy", "offline"]

class MatchAssignment(BaseModel):
    assignment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    volunteer_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    # Tokens for securing chat session access
    requester_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    volunteer_token: str = Field(default_factory=lambda: str(uuid.uuid4()))

class ChatSessionEstablished(BaseModel):
    chat_room_id: str
    assignment_id: str
    request_id: str # Added for routing to requester client
    volunteer_id: str # Added for routing to volunteer client
    requester_token: str # To be used by the requester to join the chat
    volunteer_token: str # To be used by the volunteer to join the chat
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- API Specific Models ---

class DirectHelpRequestPayload(BaseModel):
    request_type: Literal["Medical", "Legal", "Shelter"]
    coordinates: Optional[Coordinates] = None # User selected lat/lng from map
    location_text: Optional[str] = Field(None, min_length=5, max_length=200) # Optional text description of location
    original_content: str = Field(..., min_length=10, max_length=1000) # Description of the request, e.g., "Direct app request for Medical aid"
    # Potentially user_id or some form of identification if users are logged in
    # user_id: Optional[str] = None

    @validator('original_content')
    def sanitize_content(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

    @validator('location_text')
    def sanitize_location(cls, v):
        if v is None:
            return v
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        return v.strip()

class VolunteerVerificationPayload(BaseModel):
    verification_code: str = Field(..., min_length=4, max_length=10)

    @validator('verification_code')
    def validate_verification_code(cls, v):
        # Ensure verification code contains only alphanumeric characters
        if not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError('Verification code must contain only letters and numbers')
        return v.upper()  # Convert to uppercase for consistency

class VolunteerCreatePayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    skills: list[Literal["Medical", "Legal", "Shelter"]]
    # Admin might create volunteer, verification code generated by system

    @validator('name')
    def sanitize_name(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

    @validator('phone_number')
    def validate_phone(cls, v):
        # Ensure phone number format (allows +, digits, spaces, hyphens, parentheses)
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        # Remove all non-digit characters except + for validation
        digits_only = re.sub(r'[^\d+]', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number too short')
        return v

class Resource(BaseModel):
    resource_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., min_length=2, max_length=50) # e.g., "Medical Aid", "Legal Advice", "Shelter Locations"
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    @validator('title', 'content', 'category')
    def sanitize_text_fields(cls, v):
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

class Update(BaseModel):
    update_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=5, max_length=200)
    summary: str = Field(..., min_length=10, max_length=500)
    full_content: Optional[str] = Field(None, min_length=10, max_length=5000)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Optional[str] = Field(None, min_length=2, max_length=50) # E.g., "Official", "Community Report"

    @validator('title', 'summary', 'full_content', 'source')
    def sanitize_text_fields(cls, v):
        if v is None:
            return v
        # Remove potentially dangerous HTML/script tags
        v = re.sub(r'<[^>]*>', '', v)
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v)
        return v.strip()

class MapHotspot(BaseModel):
    """Data structure for representing an active help request on the map."""
    id: str # Typically the request_id
    coordinates: Coordinates # The already obfuscated coordinates
    request_type: Literal["Medical", "Legal", "Shelter"]
    timestamp: datetime # Timestamp of the original request

# Generic response model
class GenericResponse(BaseModel):
    message: str
    success: bool = True
    details: Optional[dict] = None

# MongoDB specific models (can inherit from above or be separate)
# For now, the above models can serve as the structure for MongoDB documents as well.
# If specific MongoDB features like ObjectId are needed, we can adjust.

# Example: If using MongoDB's ObjectId
# from pydantic import Field, BaseModel
# from bson import ObjectId
# class PyObjectId(ObjectId):
#     @classmethod
#     def __get_validators__(cls):
#         yield cls.validate
#     @classmethod
#     def validate(cls, v):
#         if not ObjectId.is_valid(v):
#             raise ValueError("Invalid objectid")
#         return ObjectId(v)
#     @classmethod
#     def __modify_schema__(cls, field_schema):
#         field_schema.update(type="string")

# class MongoVolunteer(Volunteer):
#     id: Optional[PyObjectId] = Field(alias='_id')
#     class Config:
#         json_encoders = { ObjectId: str }
#         arbitrary_types_allowed = True # Allow PyObjectId
#         populate_by_name = True # To allow using '_id' as 'id'
