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


# --- Organization Schemas ---

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    organization_type: Literal["NGO", "Government", "MedicalFacility", "CommunityGroup", "Other"] = Field(..., alias="type")
    contact_email: Optional[str] = Field(None, pattern=r"[^@]+@[^@]+\.[^@]+")
    contact_phone: Optional[str] = None
    capabilities: Optional[list[str]] = None # e.g., ["medical_staff", "transport", "shelter_space"]

    @validator('name', 'contact_email', 'contact_phone')
    def sanitize_string_fields(cls, v):
        if v is None:
            return v
        v = re.sub(r'<[^>]*>', '', v) # Basic tag stripping
        return v.strip()

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    organization_id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = False # Admin can verify organizations

    class Config:
        populate_by_name = True # Allows using 'id' and 'type' in code while db stores 'organization_id', 'organization_type'


class OrganizationUserRole(BaseModel):
    role: Literal["admin", "coordinator", "field_staff"] = "field_staff"
    # Potentially add specific permissions here later

class OrganizationUserBase(BaseModel):
    email: str = Field(..., pattern=r"[^@]+@[^@]+\.[^@]+")
    full_name: str = Field(..., min_length=2, max_length=100)

    @validator('email', 'full_name')
    def sanitize_user_fields(cls, v):
        v = re.sub(r'<[^>]*>', '', v)
        return v.strip()

class OrganizationUserCreate(OrganizationUserBase):
    password: str = Field(..., min_length=8)
    organization_id: Optional[str] = None # If creating user for an existing org
    # If creating a new org, this can be set after org is created.
    # For initial registration, org_id might be missing if it's a new org registration.
    # Role could be passed here, or set to 'admin' by default for the first user of an org.
    role: Literal["admin", "coordinator", "field_staff"] = "admin"


class OrganizationUser(OrganizationUserBase):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="id")
    organization_id: str
    hashed_password: str # Password will be stored hashed
    role: Literal["admin", "coordinator", "field_staff"] = "admin"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class OrganizationApiKeyBase(BaseModel):
    organization_id: str
    key_name: str = Field(..., min_length=3, max_length=50) # e.g., "ReportingIntegrationKey"
    permissions: Optional[list[str]] = None # e.g., ["read_cases", "create_resource_update"]

class OrganizationApiKeyCreate(OrganizationApiKeyBase):
    pass

class OrganizationApiKey(OrganizationApiKeyBase):
    api_key_id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="id")
    api_key: str # This will be the actual key, generated on creation
    hashed_key: str # Store a hash of the key for verification, not the key itself
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        populate_by_name = True

# --- API Payloads for Organization Auth ---

class PartnerLoginPayload(BaseModel):
    email: str
    password: str

class PartnerRegisterPayload(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=100)
    organization_type: Literal["NGO", "Government", "MedicalFacility", "CommunityGroup", "Other"]
    admin_email: str = Field(..., pattern=r"[^@]+@[^@]+\.[^@]+")
    admin_full_name: str = Field(..., min_length=2, max_length=100)
    admin_password: str = Field(..., min_length=8)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None # Could be email for organization users
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    role: Optional[str] = None


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

class ZoneStatus(BaseModel):
    name: str
    lat: float
    lng: float
    status: str
    intensity: float

class VolunteerVerificationRequest(BaseModel):
    verification_code: str
