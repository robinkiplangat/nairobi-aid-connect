from fastapi import FastAPI, HTTPException, Body
from typing import List
import uuid
from datetime import datetime
import logging # Added logging
import asyncio
import json

# Configure basic logging for the application
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from .models import schemas
# Agent and Service Instances
from .services.database import db_service
from .services.message_bus import message_bus_service
from .agents.intake_agent import intake_agent
from .agents.verification_agent import verification_agent
from .agents.dispatcher_agent import dispatcher_agent
from .agents.comms_agent import comms_agent, CommsAgent
from .agents.content_agent import content_agent # Import ContentAgent instance

app = FastAPI(
    title="SOS Nairobi Backend",
    description="Multi-agent system for coordinating emergency aid.",
    version="0.1.0"
)

# Lifespan events for service connections
@app.on_event("startup")
async def startup_event():
    """
    Connect to database and message bus on application startup.
    """
    logger.info("Application startup: Connecting to services...")
    try:
        await db_service.connect_to_mongo()
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB on startup: {e}", exc_info=True)
        # Depending on criticality, you might want to raise to prevent startup
        # For now, logging the error and allowing startup.
        # raise # Uncomment to make DB connection critical for startup

    try:
        await message_bus_service.connect()
        logger.info("Successfully connected to Message Bus (Redis).")
    except Exception as e:
        logger.error(f"Failed to connect to Message Bus on startup: {e}", exc_info=True)
        # raise # Uncomment to make Message Bus connection critical for startup

    # Start agent listeners that depend on message bus
    agent_listeners_started = True
    try:
        logger.info("Starting DispatcherAgent listeners...")
        await dispatcher_agent.start_listening()
        logger.info("DispatcherAgent listeners started.")
    except Exception as e:
        logger.error(f"Failed to start DispatcherAgent listeners: {e}", exc_info=True)
        agent_listeners_started = False # Mark as failed

    try:
        logger.info("Starting CommsAgent listeners...")
        await comms_agent.start_listening()
        logger.info("CommsAgent listeners started.")
    except Exception as e:
        logger.error(f"Failed to start CommsAgent listeners: {e}", exc_info=True)
        agent_listeners_started = False # Mark as failed

    if not agent_listeners_started:
        logger.warning("One or more agent listeners failed to start. System may not be fully operational.")
        # Decide if this is critical for startup, e.g., raise SystemExit

    # Start Twitter Monitoring (if enabled in config)
    # This runs in the background, so we create a task for it.
    # The IntakeAgent's start_twitter_monitoring method should handle its own lifecycle (loop, try/except, shutdown signal).
    if intake_agent.streaming_client: # Check if client was successfully initialized
        logger.info("Creating task for Twitter monitoring...")
        # Store the task if we need to explicitly cancel or await it on shutdown
        # For now, intake_agent.stop_twitter_monitoring() will be called.
        intake_agent._twitter_monitoring_task = asyncio.create_task(intake_agent.start_twitter_monitoring())
        logger.info("Twitter monitoring task created.")
    else:
        logger.info("Twitter monitoring not started (client not available).")

    logger.info("Application startup complete.")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Disconnect from database and message bus on application shutdown.
    """
    logger.info("Application shutdown: Disconnecting from services...")
    # Important to handle potential errors during disconnect as well

    # Stop Twitter monitoring first
    if intake_agent.streaming_client and intake_agent._twitter_monitoring_task:
        logger.info("Stopping Twitter monitoring...")
        await intake_agent.stop_twitter_monitoring()
        logger.info("Twitter monitoring stopped.")

    try:
        await message_bus_service.disconnect()
        logger.info("Successfully disconnected from Message Bus.")
    except Exception as e:
        logger.error(f"Error disconnecting from Message Bus: {e}", exc_info=True)

    try:
        await db_service.close_mongo_connection()
        logger.info("Successfully disconnected from MongoDB.")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {e}", exc_info=True)
    logger.info("Application shutdown complete.")


# Placeholder for other agent/service instances
# No more placeholders, all primary agents are now imported.


@app.get("/", tags=["Health Check"])
async def read_root():
    """Basic health check endpoint."""
    return {"status": "SOS Nairobi Backend is running"}

# --- IntakeAgent Endpoints ---
@app.post("/api/v1/request/direct",
          response_model=schemas.GenericResponse,
          summary="Submit a direct help request",
          tags=["Intake Agent"])
async def submit_direct_request(payload: schemas.DirectHelpRequestPayload = Body(...)):
    """
    Allows users to submit a help request directly through the application.
    The IntakeAgent will process this request.
    """
    logger.info(f"API /api/v1/request/direct received payload: {payload.model_dump_json(indent=2)}")
    try:
        # Delegate to the IntakeAgent's handler method
        new_request_details = await intake_agent.handle_direct_request(payload)
        logger.info(f"IntakeAgent processed request {new_request_details.request_id}, status: {new_request_details.status}")
        return schemas.GenericResponse(
            message="Request received and is being processed by IntakeAgent.",
            details={"request_id": new_request_details.request_id, "status": new_request_details.status}
        )
    except ConnectionError as e: # Specific error for service connection issues
        logger.error(f"Connection error processing request in /api/v1/request/direct: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Service temporarily unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unhandled error processing direct request in /api/v1/request/direct: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")


# --- VerificationAgent Endpoints ---
@app.post("/api/v1/volunteer/verify",
          response_model=schemas.GenericResponse,
          summary="Verify a volunteer using a verification code",
          tags=["Verification Agent"])
async def verify_volunteer(payload: schemas.VolunteerVerificationPayload = Body(...)):
    """
    Allows a volunteer to verify themselves using a code.
    The VerificationAgent will handle this.
    """
    logger.info(f"API /api/v1/volunteer/verify received payload: {payload.model_dump_json(indent=2)}")
    try:
        response = await verification_agent.handle_verification_request(payload)
        if not response.success:
            # Specific error messages from the agent can be passed through
            # For security, might want to generalize some messages (e.g., "Invalid code or error processing")
            raise HTTPException(status_code=400, detail=response.message)
        return response
    except HTTPException: # Re-raise HTTPExceptions directly if agent raises them
        raise
    except ConnectionError as e: # E.g., if message bus or DB is down
        logger.error(f"Connection error during volunteer verification: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Service temporarily unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unhandled error during volunteer verification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred during verification: {str(e)}")

# --- ContentAgent Endpoints ---
@app.get("/api/v1/content/updates",
         response_model=List[schemas.Update],
         summary="Get real-time updates",
         tags=["Content Agent"])
async def get_real_time_updates():
    """
    Provides a list of real-time updates (e.g., news, alerts).
    Managed by the ContentAgent.
    """
    logger.info("API /api/v1/content/updates received request.")
    try:
        # Optional query parameters for pagination could be added here (e.g., limit, skip)
        # For now, using agent's default limit/skip.
        updates = await content_agent.fetch_updates()
        return updates
    except Exception as e:
        logger.error(f"Error fetching updates via ContentAgent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred while fetching updates: {str(e)}")

@app.get("/api/v1/content/resources",
         response_model=List[schemas.Resource],
         summary="Get resources from the Resource Hub",
         tags=["Content Agent"])
async def get_resource_hub_content():
    """
    Provides a list of helpful resources (e.g., contact numbers, shelter locations).
    Managed by the ContentAgent.
    """
    logger.info("API /api/v1/content/resources received request.")
    # Optional query parameters for category, pagination can be added here.
    # Example: async def get_resource_hub_content(category: Optional[str] = None, limit: int = 50, skip: int = 0):
    try:
        resources = await content_agent.fetch_resources() # Add category, limit, skip if API supports
        return resources
    except Exception as e:
        logger.error(f"Error fetching resources via ContentAgent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred while fetching resources: {str(e)}")


# --- Map Hotspot Endpoint ---
@app.get("/api/v1/map/hotspots",
         response_model=List[schemas.MapHotspot],
         summary="Get active help request hotspots for map display",
         tags=["Map Data"])
async def get_map_hotspots(limit: int = 200): # Optional query param for limit
    """
    Provides a list of active, obfuscated help requests to be displayed as hotspots on a map.
    """
    logger.info(f"API /api/v1/map/hotspots received request with limit={limit}.")
    try:
        hotspots = await content_agent.fetch_active_hotspots(limit=limit)
        return hotspots
    except Exception as e:
        logger.error(f"Error fetching map hotspots: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred while fetching map hotspots: {str(e)}")


# Instructions to run (will be added to backend/README.md later):
# 1. Ensure you have Python 3.8+ and pip installed.
# 2. From the project root, create a virtual environment:
#    `python -m venv backend/.venv`
#    `source backend/.venv/bin/activate` (Linux/macOS) or `backend\\.venv\\Scripts\\activate` (Windows)
# 3. Install dependencies:
#    `pip install -r backend/requirements.txt`
# 4. Create a `.env` file in the `backend/` directory if you need to override default settings
#    (e.g., MONGODB_URI, REDIS_HOST). Example:
#    ```
#    MONGODB_URI="mongodb://localhost:27017/my_sos_db"
#    REDIS_HOST="my_redis_host"
#    ```
# 5. To run the FastAPI application (from the project root directory):
#    `PYTHONPATH=. uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
#    Or, from the `backend` directory:
#    `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
#    (The `PYTHONPATH=.` method from project root is generally recommended for consistency.)
#
# Access the API docs at http://localhost:8000/docs or http://localhost:8000/redoc
#
# Basic logging has been added. For production, consider more structured logging (e.g., JSON logs).


# --- WebSocket Chat Endpoint ---
from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List

# A simple in-memory manager for active WebSocket connections.
# For production, a more robust solution (e.g., Redis-based) would be needed for scalability.
class ConnectionManager:
    def __init__(self):
        # rooms: { "room_id": [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"WebSocket connected to room {room_id}. Total connections in room: {len(self.active_connections[room_id])}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]: # If room becomes empty
                del self.active_connections[room_id]
            logger.info(f"WebSocket disconnected from room {room_id}. Remaining connections: {len(self.active_connections.get(room_id, []))}")
        else:
            logger.warning(f"Attempted to disconnect WebSocket from non-existent room {room_id} or room already empty.")


    async def broadcast_to_room(self, message: str, room_id: str, sender: WebSocket):
        if room_id in self.active_connections:
            # Create a list of tasks for sending messages concurrently
            send_tasks = []
            for connection in self.active_connections[room_id]:
                if connection != sender: # Don't send back to the sender
                    send_tasks.append(connection.send_text(message))

            results = await asyncio.gather(*send_tasks, return_exceptions=True)
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    # Handle broken connections if necessary (e.g., remove them)
                    # This part needs more robust error handling for production
                    logger.error(f"Error broadcasting to a WebSocket in room {room_id}: {result}", exc_info=result)
                    # Potentially remove self.active_connections[room_id][i] (index needs careful handling)

manager = ConnectionManager()

@app.websocket("/ws/chat/{chat_room_id}/{user_token}")
async def websocket_endpoint(websocket: WebSocket, chat_room_id: str, user_token: str):
    logger.info(f"WebSocket connection attempt for room {chat_room_id} with token {user_token}")

    # 1. Authenticate user and token for the chat room
    user_role = await CommsAgent.validate_user_for_chat(chat_room_id, user_token)
    if not user_role:
        logger.warning(f"WebSocket authentication failed for room {chat_room_id}, token {user_token}. Closing connection.")
        await websocket.close(code=4001) # Custom close code for auth failure
        return

    logger.info(f"WebSocket authentication successful for room {chat_room_id}. User role: {user_role}")
    await manager.connect(websocket, chat_room_id)

    # Send a welcome message or connection confirmation
    await websocket.send_text(json.dumps({"type": "system", "message": f"Welcome {user_role}, you are connected to chat room {chat_room_id}."}))

    # Notify others in the room (if any) that a user has joined
    join_notification = json.dumps({"type": "system", "message": f"{user_role.capitalize()} has joined the chat."})
    await manager.broadcast_to_room(join_notification, chat_room_id, sender=websocket)

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received message in room {chat_room_id} from {user_role}: {data}")

            # Construct message to broadcast
            # For simplicity, client sends JSON string: {"type": "chat", "text": "Hello"}
            # Server adds sender info for clarity to other clients
            try:
                message_data = json.loads(data)
                if not isinstance(message_data, dict) or "text" not in message_data:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid message format. Send JSON with a 'text' field."}))
                    continue

                broadcast_message = json.dumps({
                    "type": "chat",
                    "sender": user_role, # "requester" or "volunteer"
                    "text": message_data["text"],
                    "timestamp": datetime.utcnow().isoformat()
                })
                await manager.broadcast_to_room(broadcast_message, chat_room_id, sender=websocket)
            except json.JSONDecodeError:
                logger.warning(f"Received non-JSON message in room {chat_room_id}: {data}")
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON format."}))
            except Exception as e:
                logger.error(f"Error processing/broadcasting message in room {chat_room_id}: {e}", exc_info=True)
                await websocket.send_text(json.dumps({"type": "error", "message": "Error processing your message."}))


    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {user_role} in room {chat_room_id}.")
        # Notify others in the room
        leave_notification = json.dumps({"type": "system", "message": f"{user_role.capitalize()} has left the chat."})
        await manager.broadcast_to_room(leave_notification, chat_room_id, sender=websocket) # sender won't receive
    except Exception as e:
        # Log other unexpected errors
        logger.error(f"Unexpected error in WebSocket endpoint for room {chat_room_id}: {e}", exc_info=True)
    finally:
        # Ensure client is removed from active connections on any exit
        manager.disconnect(websocket, chat_room_id)
        logger.info(f"Cleaned up WebSocket connection for room {chat_room_id}, user role {user_role}.")
