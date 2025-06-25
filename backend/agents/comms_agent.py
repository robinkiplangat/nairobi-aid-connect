import logging
import uuid
import json
from datetime import datetime, timedelta
from typing import Optional

from ..models import schemas
from ..services.message_bus import message_bus_service
from ..services.config import settings
# We will use message_bus_service.redis_client directly for chat session storage for now.
# A dedicated ChatSessionService could be made later if complexity grows.

logger = logging.getLogger(__name__)

class CommsAgent:
    def __init__(self):
        logger.info("CommsAgent initialized.")
        # Active chat rooms and their participants could be managed here if not using FastAPI endpoint manager
        # self.active_rooms = {} # e.g., { "room_id": { "requester_ws": ws, "volunteer_ws": ws }}

    async def start_listening(self):
        """
        Subscribes to relevant topics on the message bus.
        """
        try:
            if not message_bus_service.redis_client or not message_bus_service.redis_client.is_connected():
                logger.error("CommsAgent: Message bus not connected. Cannot start listening.")
                await message_bus_service.connect()
                if not message_bus_service.redis_client or not message_bus_service.redis_client.is_connected():
                    logger.critical("CommsAgent: Failed to connect to message bus. Listener not started.")
                    return

            message_bus_service.subscribe("assignments:create", self.handle_new_assignment)
            logger.info("CommsAgent is now listening for 'assignments:create' topic.")
        except Exception as e:
            logger.error(f"CommsAgent failed to start listening: {e}", exc_info=True)

    async def handle_new_assignment(self, message: dict):
        """
        Callback for messages on the 'assignments:create' topic.
        Sets up a new chat room session.
        """
        try:
            assignment_data = schemas.MatchAssignment(**message)
            logger.info(f"CommsAgent received MatchAssignment: {assignment_data.assignment_id}")
        except Exception as e:
            logger.error(f"CommsAgent: Error parsing MatchAssignment message: {e} - Data: {message}", exc_info=True)
            return

        # 1. Create Chat Room Session
        chat_room_id = str(uuid.uuid4())

        # Session data to store (e.g., in Redis)
        # This data will be used by the WebSocket endpoint to authenticate users joining the room.
        chat_session_data = {
            "chat_room_id": chat_room_id,
            "assignment_id": assignment_data.assignment_id,
            "request_id": assignment_data.request_id, # From MatchAssignment schema
            "volunteer_id": assignment_data.volunteer_id, # From MatchAssignment schema
            "requester_token": assignment_data.requester_token,
            "volunteer_token": assignment_data.volunteer_token,
            "created_at": datetime.utcnow().isoformat()
        }

        session_key = f"chat_session:{chat_room_id}"
        session_ttl_seconds = int(timedelta(hours=settings.CHAT_SESSION_TTL_HOURS).total_seconds())

        try:
            if not message_bus_service.redis_client:
                logger.error("CommsAgent: Redis client not available for storing chat session.")
                return # Cannot proceed without Redis client

            await message_bus_service.redis_client.set(
                session_key,
                json.dumps(chat_session_data),
                ex=session_ttl_seconds # TTL for the session
            )
            logger.info(f"Chat session {chat_room_id} for assignment {assignment_data.assignment_id} stored in Redis with TTL {session_ttl_seconds}s.")
        except Exception as e:
            logger.error(f"CommsAgent: Failed to store chat session {chat_room_id} in Redis: {e}", exc_info=True)
            return # If session isn't stored, clients can't connect.

        # 2. Notify Clients by publishing ChatSessionEstablished
        chat_established_message = schemas.ChatSessionEstablished(
            chat_room_id=chat_room_id,
            assignment_id=assignment_data.assignment_id,
            requester_token=assignment_data.requester_token,
            volunteer_token=assignment_data.volunteer_token
            # timestamp is auto-generated
        )

        try:
            await message_bus_service.publish("system:notifications", chat_established_message.model_dump())
            logger.info(f"Published ChatSessionEstablished for room {chat_room_id} to 'system:notifications'.")
        except Exception as e:
            logger.error(f"CommsAgent: Failed to publish ChatSessionEstablished for room {chat_room_id}: {e}", exc_info=True)
            # If notification fails, clients won't know how to connect.
            # Consider cleanup of the stored Redis session or retry.


    # --- Methods for WebSocket endpoint to use (via Redis) ---
    # These could also be part of a separate ChatSessionService if preferred.

    @staticmethod
    async def get_chat_session(chat_room_id: str) -> Optional[dict]:
        """Retrieves chat session details from Redis."""
        if not message_bus_service.redis_client:
            logger.error("Redis client not available in CommsAgent.get_chat_session.")
            return None
        session_key = f"chat_session:{chat_room_id}"
        try:
            session_data_json = await message_bus_service.redis_client.get(session_key)
            if session_data_json:
                return json.loads(session_data_json)
            return None
        except Exception as e:
            logger.error(f"Error retrieving chat session {chat_room_id} from Redis: {e}", exc_info=True)
            return None

    @staticmethod
    async def validate_user_for_chat(chat_room_id: str, user_token: str) -> Optional[str]:
        """
        Validates if a user token is authorized for a given chat room.
        Returns 'requester' or 'volunteer' if valid, None otherwise.
        """
        session_data = await CommsAgent.get_chat_session(chat_room_id)
        if not session_data:
            return None

        if session_data.get("requester_token") == user_token:
            return "requester"
        if session_data.get("volunteer_token") == user_token:
            return "volunteer"
        return None

    # Note: Actual WebSocket connection handling and message relay will be in main.py's WebSocket endpoint.
    # The CommsAgent's primary role here is to initiate the session details upon assignment.

# Global instance
comms_agent = CommsAgent()
