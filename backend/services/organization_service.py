# backend/services/organization_service.py
from typing import Optional, Tuple
import uuid
import hashlib # For API key hashing (not passwords)
from pymongo import MongoClient

from models import schemas, database_models
from services.database import db_service
# Placeholder for password hashing utilities, will be added to security.py
from services.security import get_password_hash, verify_password

class OrganizationService:
    async def create_organization(self, org_create_data: schemas.OrganizationCreate) -> Optional[database_models.MongoOrganization]:
        """
        Creates a new organization.
        """
        existing_org = await self.get_organization_by_name(org_create_data.name)
        if existing_org:
            # Or raise an HTTPException if called from an API context
            print(f"Organization with name {org_create_data.name} already exists.")
            return None

        org_id = str(uuid.uuid4())
        organization = database_models.MongoOrganization(
            organization_id=org_id, # Explicitly set our defined ID
            **org_create_data.model_dump(by_alias=True) # by_alias=True to use 'type' for 'organization_type'
        )

        created_org = await db_service.add_document("organizations", organization.model_dump(by_alias=True))
        if created_org:
            # Return the full MongoOrganization model after fetching it, as add_document might just return ID or basic dict
            return await self.get_organization_by_id(organization.organization_id)
        return None

    async def get_organization_by_id(self, org_id: str) -> Optional[database_models.MongoOrganization]:
        """
        Retrieves an organization by its ID.
        """
        org_data = await db_service.get_document_by_field("organizations", "organization_id", org_id)
        if org_data:
            return database_models.MongoOrganization(**org_data)
        return None

    async def get_organization_by_name(self, name: str) -> Optional[database_models.MongoOrganization]:
        """
        Retrieves an organization by its name.
        """
        org_data = await db_service.get_document_by_field("organizations", "name", name)
        if org_data:
            return database_models.MongoOrganization(**org_data)
        return None

    async def create_organization_user(
        self,
        user_create_data: schemas.OrganizationUserCreate,
        organization_id: str # Ensure organization_id is provided
    ) -> Optional[database_models.MongoOrganizationUser]:
        """
        Creates a new user associated with an organization.
        """
        existing_user = await self.get_organization_user_by_email(user_create_data.email)
        if existing_user:
            print(f"User with email {user_create_data.email} already exists.")
            return None

        hashed_password = get_password_hash(user_create_data.password)
        user_id = str(uuid.uuid4())

        org_user = database_models.MongoOrganizationUser(
            user_id=user_id,
            organization_id=organization_id,
            email=user_create_data.email,
            full_name=user_create_data.full_name,
            hashed_password=hashed_password,
            role=user_create_data.role, # Role from create payload
            is_active=True # Active by default
        )

        created_user_doc = await db_service.add_document("organization_users", org_user.model_dump(by_alias=True))
        if created_user_doc:
            return await self.get_organization_user_by_id(user_id)
        return None

    async def get_organization_user_by_email(self, email: str) -> Optional[database_models.MongoOrganizationUser]:
        """
        Retrieves an organization user by their email.
        """
        user_data = await db_service.get_document_by_field("organization_users", "email", email)
        if user_data:
            return database_models.MongoOrganizationUser(**user_data)
        return None

    async def get_organization_user_by_id(self, user_id: str) -> Optional[database_models.MongoOrganizationUser]:
        """
        Retrieves an organization user by their ID.
        """
        user_data = await db_service.get_document_by_field("organization_users", "user_id", user_id)
        if user_data:
            return database_models.MongoOrganizationUser(**user_data)
        return None

    async def verify_organization_user_credentials(self, email: str, password: str) -> Optional[database_models.MongoOrganizationUser]:
        """
        Verifies organization user credentials. Returns the user if valid, else None.
        """
        user = await self.get_organization_user_by_email(email)
        if not user:
            return None
        if not user.is_active: # Optional: check if user is active
             return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def _generate_api_key_value(self) -> Tuple[str, str]:
        """Generates a new API key and its hash."""
        key = uuid.uuid4().hex # Simple UUID hex string for the key
        hashed_key = hashlib.sha256(key.encode()).hexdigest()
        return key, hashed_key

    async def generate_api_key_for_organization(
        self,
        api_key_create_data: schemas.OrganizationApiKeyCreate
    ) -> Optional[Tuple[database_models.MongoOrganizationApiKey, str]]: # Returns (API Key DB Object, Raw API Key String)
        """
        Generates and stores an API key for an organization.
        Returns the DB object and the raw key (the raw key should only be shown once).
        """
        org = await self.get_organization_by_id(api_key_create_data.organization_id)
        if not org:
            print(f"Organization {api_key_create_data.organization_id} not found.")
            return None

        raw_key, hashed_key = self._generate_api_key_value()
        api_key_id = str(uuid.uuid4())

        api_key_doc = database_models.MongoOrganizationApiKey(
            api_key_id=api_key_id,
            api_key=raw_key, # This will NOT be stored in DB, only hashed_key
            hashed_key=hashed_key,
            organization_id=api_key_create_data.organization_id,
            key_name=api_key_create_data.key_name,
            permissions=api_key_create_data.permissions or [],
            is_active=True
        )

        # Prepare document for DB: exclude the raw 'api_key'
        db_doc_data = api_key_doc.model_dump(exclude={"api_key"}, by_alias=True)

        created_api_key = await db_service.add_document("organization_api_keys", db_doc_data)
        if created_api_key:
            # Fetch the created document to return the full model (without raw key)
            db_object = await self.get_api_key_object_by_id(api_key_id)
            if db_object:
                 return db_object, raw_key # Return the DB model and the raw key
        return None

    async def get_api_key_object_by_id(self, api_key_id: str) -> Optional[database_models.MongoOrganizationApiKey]:
        key_data = await db_service.get_document_by_field("organization_api_keys", "api_key_id", api_key_id)
        if key_data:
            return database_models.MongoOrganizationApiKey(**key_data)
        return None

    async def get_organization_user_by_api_key(self, api_key_value: str) -> Optional[database_models.MongoOrganizationUser]:
        """
        Retrieves an organization and associated (dummy) user by a raw API key value.
        For simplicity, this might return the first admin user of the organization tied to the API key.
        A more robust system might link API keys to specific users or define service accounts.
        """
        hashed_key_to_find = hashlib.sha256(api_key_value.encode()).hexdigest()
        api_key_data = await db_service.get_document_by_field("organization_api_keys", "hashed_key", hashed_key_to_find)

        if not api_key_data:
            return None

        key_model = database_models.MongoOrganizationApiKey(**api_key_data)
        if not key_model.is_active:
            return None # Key is inactive

        # Update last_used_at (optional, can be done in a background task or if critical)
        # await db_service.update_document("organization_api_keys", key_model.api_key_id, {"last_used_at": datetime.utcnow()})

        # For now, let's assume an API key grants access on behalf of the organization.
        # We might not have a specific "user" for an API key.
        # Let's fetch the first admin user of that organization as a representative.
        # This is a simplification.
        users_in_org = await db_service.get_documents_by_field("organization_users", "organization_id", key_model.organization_id)
        if users_in_org:
            for u_data in users_in_org:
                user = database_models.MongoOrganizationUser(**u_data)
                if user.role == "admin" and user.is_active:
                    return user # Return the first active admin found
        return None # Or perhaps a "service user" representation

# Instantiate the service
organization_service = OrganizationService()
