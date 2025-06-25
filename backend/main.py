from fastapi import FastAPI, HTTPException, Body
from typing import List, Dict, Optional # Added Dict, Optional
import uuid
from datetime import datetime
import logging
import asyncio
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from .models import schemas
from .services.database import db_service
from .services.message_bus import message_bus_service
from .agents.intake_agent import intake_agent
from .agents.verification_agent import verification_agent
from .agents.dispatcher_agent import dispatcher_agent
from .agents.comms_agent import comms_agent, CommsAgent # CommsAgent class for static methods
from .agents.content_agent import content_agent

app = FastAPI(
    title="SOS Nairobi Backend",
    description="Multi-agent system for coordinating emergency aid.",
    version="0.1.0"
)

# --- Notification WebSocket Manager ---
class NotificationSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        logger.info("NotificationSocketManager initialized.")

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket NOTIFICATION client connected. Total notification clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket NOTIFICATION client disconnected. Remaining: {len(self.active_connections)}")
        except ValueError:
            logger.warning("Attempted to disconnect a non-existent NOTIFICATION client.")

    async def broadcast(self, message: str):
        connections_to_remove = []
        for connection in list(self.active_connections): # Iterate over a copy
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting NOTIFICATION to a WebSocket client: {e}. Marking for removal.", exc_info=True)
                connections_to_remove.append(connection)

        for conn_to_remove in connections_to_remove:
            self.disconnect(conn_to_remove)

notification_manager = NotificationSocketManager()

# Background task to listen to Redis Pub/Sub for system_notifications
async def redis_notification_listener():
    logger.info("Starting Redis notification listener for 'system:notifications'...")
    await message_bus_service.connect()
    if not message_bus_service.redis_client:
        logger.critical("Redis client not available for notification listener. Task exiting.")
        return

    pubsub = message_bus_service.redis_client.pubsub()
    await pubsub.subscribe("system:notifications")
    logger.info("Subscribed to 'system:notifications' on Redis.")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message.get("type") == "message":
                data_str = message["data"]
                logger.info(f"Received system notification from Redis: {data_str}")
                try:
                    payload_to_broadcast = data_str.decode('utf-8') if isinstance(data_str, bytes) else data_str
                    await notification_manager.broadcast(payload_to_broadcast)
                except Exception as e:
                    logger.error(f"Error broadcasting system notification: {e}", exc_info=True)
            await asyncio.sleep(0.01)
    except asyncio.CancelledError:
        logger.info("Redis notification listener task cancelled.")
    except Exception as e:
        logger.error(f"Redis notification listener error: {e}", exc_info=True)
    finally:
        logger.info("Closing Redis PubSub for system:notifications.")
        if pubsub.subscribed: # Check if still subscribed before trying to unsubscribe
            try:
                await pubsub.unsubscribe("system:notifications")
            except Exception as e:
                logger.error(f"Error unsubscribing from system:notifications: {e}", exc_info=True)
        try:
            await pubsub.close() # Close the pubsub connection handler
        except Exception as e:
            logger.error(f"Error closing pubsub object: {e}", exc_info=True)


# Lifespan events
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup: Connecting to services...")
    try:
        await db_service.connect_to_mongo()
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB on startup: {e}", exc_info=True)

    try:
        await message_bus_service.connect()
        logger.info("Successfully connected to Message Bus (Redis).")
    except Exception as e:
        logger.error(f"Failed to connect to Message Bus on startup: {e}", exc_info=True)

    agent_listeners_started = True
    try:
        logger.info("Starting DispatcherAgent listeners...")
        await dispatcher_agent.start_listening()
    except Exception as e:
        logger.error(f"Failed to start DispatcherAgent listeners: {e}", exc_info=True); agent_listeners_started = False

    try:
        logger.info("Starting CommsAgent listeners...")
        await comms_agent.start_listening()
    except Exception as e:
        logger.error(f"Failed to start CommsAgent listeners: {e}", exc_info=True); agent_listeners_started = False

    if not agent_listeners_started: logger.warning("One or more agent listeners failed to start.")

    if intake_agent.streaming_client:
        logger.info("Creating task for Twitter monitoring...")
        intake_agent._twitter_monitoring_task = asyncio.create_task(intake_agent.start_twitter_monitoring())
    else:
        logger.info("Twitter monitoring not started (client not available).")

    app.state.redis_notification_listener_task = asyncio.create_task(redis_notification_listener())
    logger.info("Redis notification listener task created and started.")
    logger.info("Application startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown: Disconnecting from services...")
    if intake_agent.streaming_client and intake_agent._twitter_monitoring_task:
        logger.info("Stopping Twitter monitoring...")
        await intake_agent.stop_twitter_monitoring()

    if hasattr(app.state, "redis_notification_listener_task") and app.state.redis_notification_listener_task:
        logger.info("Stopping Redis notification listener task...")
        app.state.redis_notification_listener_task.cancel()
        try:
            await app.state.redis_notification_listener_task
        except asyncio.CancelledError:
            logger.info("Redis notification listener task successfully cancelled.")
        except Exception as e:
            logger.error(f"Error during Redis listener task shutdown: {e}", exc_info=True)
    try:
        await message_bus_service.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting Message Bus: {e}", exc_info=True)
    try:
        await db_service.close_mongo_connection()
    except Exception as e:
        logger.error(f"Error disconnecting MongoDB: {e}", exc_info=True)
    logger.info("Application shutdown complete.")

# API Endpoints
@app.get("/", tags=["Health Check"])
async def read_root(): return {"status": "SOS Nairobi Backend is running"}

@app.post("/api/v1/request/direct", response_model=schemas.GenericResponse, tags=["Intake Agent"])
async def submit_direct_request(payload: schemas.DirectHelpRequestPayload = Body(...)):
    logger.info(f"API /api/v1/request/direct received: {payload.model_dump_json(indent=2)}")
    try:
        details = await intake_agent.handle_direct_request(payload)
        return schemas.GenericResponse(message="Request received.", details={"request_id": details.request_id, "status": details.status})
    except Exception as e:
        logger.error(f"Error in /api/v1/request/direct: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Depends, Header # Ensure Depends and Header are imported

async def get_volunteer_from_token(authorization: Optional[str] = Header(None)) -> str:
    if authorization is None: raise HTTPException(status_code=401, detail="Auth header missing.")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer": raise HTTPException(status_code=401, detail="Invalid auth scheme.")
    token = parts[1]
    volunteer_id = await verification_agent.validate_session_token(token)
    if not volunteer_id: raise HTTPException(status_code=401, detail="Invalid/expired session token.")
    return volunteer_id

@app.post("/api/v1/volunteer/verify", response_model=schemas.GenericResponse, tags=["Verification Agent"])
async def verify_volunteer(payload: schemas.VolunteerVerificationPayload = Body(...)):
    logger.info(f"API /api/v1/volunteer/verify received: {payload.model_dump_json(indent=2)}")
    try:
        response = await verification_agent.handle_verification_request(payload)
        if not response.success: raise HTTPException(status_code=400, detail=response.message)
        return response
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /api/v1/volunteer/verify: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/request/{request_id}/accept", response_model=schemas.GenericResponse, tags=["Dispatcher Agent"])
async def accept_help_request(request_id: str, volunteer_id: str = Depends(get_volunteer_from_token)):
    logger.info(f"API /api/v1/request/{request_id}/accept from volunteer: {volunteer_id}")
    try:
        result = await dispatcher_agent.assign_specific_request(request_id=request_id, volunteer_id=volunteer_id)
        if not result.get("success"): raise HTTPException(status_code=400, detail=result.get("message", "Failed to accept."))
        return schemas.GenericResponse(success=True, message="Request accepted.", details=result.get("details"))
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error in /accept: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/content/updates", response_model=List[schemas.Update], tags=["Content Agent"])
async def get_real_time_updates():
    try: return await content_agent.fetch_updates()
    except Exception as e: logger.error(f"Error in /updates: {e}", exc_info=True); raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/content/resources", response_model=List[schemas.Resource], tags=["Content Agent"])
async def get_resource_hub_content():
    try: return await content_agent.fetch_resources()
    except Exception as e: logger.error(f"Error in /resources: {e}", exc_info=True); raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/map/hotspots", response_model=List[schemas.MapHotspot], tags=["Map Data"])
async def get_map_hotspots(limit: int = 200):
    try: return await content_agent.fetch_active_hotspots(limit=limit)
    except Exception as e: logger.error(f"Error in /hotspots: {e}", exc_info=True); raise HTTPException(status_code=500, detail=str(e))

# --- WebSocket Chat Endpoint ---
from fastapi import WebSocket, WebSocketDisconnect

class ChatConnectionManager:
    def __init__(self): self.active_connections: Dict[str, List[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections: self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"WS CHAT connected to room {room_id}. Total: {len(self.active_connections[room_id])}")
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            try: self.active_connections[room_id].remove(websocket)
            except ValueError: logger.warning(f"WS CHAT: remove non-existent ws from room {room_id}.")
            if not self.active_connections[room_id]: del self.active_connections[room_id]
            logger.info(f"WS CHAT disconnected from room {room_id}. Remaining: {len(self.active_connections.get(room_id, []))}")
    async def broadcast_to_room(self, message: str, room_id: str, sender: WebSocket):
        if room_id in self.active_connections:
            to_remove = []
            for conn in list(self.active_connections[room_id]):
                if conn == sender: continue
                try: await conn.send_text(message)
                except Exception as e: logger.error(f"Error sending to CHAT WS in room {room_id}: {e}", exc_info=True); to_remove.append(conn)
            for conn_rm in to_remove: self.disconnect(conn_rm, room_id)

chat_manager = ChatConnectionManager()

@app.websocket("/ws/chat/{chat_room_id}/{user_token}")
async def websocket_chat_endpoint(websocket: WebSocket, chat_room_id: str, user_token: str):
    logger.info(f"WS CHAT connection attempt for room {chat_room_id} with token {user_token}")
    user_role = await CommsAgent.validate_user_for_chat(chat_room_id, user_token)
    if not user_role:
        logger.warning(f"WS CHAT auth failed for room {chat_room_id}. Closing.")
        await websocket.close(code=4001); return

    await chat_manager.connect(websocket, chat_room_id)
    await websocket.send_text(json.dumps({"type": "system", "message": f"Welcome {user_role}, connected to chat room {chat_room_id}."}))
    await chat_manager.broadcast_to_room(json.dumps({"type": "system", "message": f"{user_role.capitalize()} has joined."}), chat_room_id, sender=websocket)

    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received CHAT msg in room {chat_room_id} from {user_role}: {data}")
            try:
                msg_data = json.loads(data)
                if not isinstance(msg_data, dict) or "text" not in msg_data:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid format."})); continue
                broadcast = json.dumps({"type": "chat", "sender": user_role, "text": msg_data["text"], "timestamp": datetime.utcnow().isoformat()})
                await chat_manager.broadcast_to_room(broadcast, chat_room_id, sender=websocket)
            except json.JSONDecodeError: await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON."}))
            except Exception as e: logger.error(f"Error processing CHAT msg: {e}", exc_info=True); await websocket.send_text(json.dumps({"type": "error", "message": "Processing error."}))
    except WebSocketDisconnect:
        logger.info(f"WS CHAT disconnected for {user_role} in room {chat_room_id}.")
        await chat_manager.broadcast_to_room(json.dumps({"type": "system", "message": f"{user_role.capitalize()} has left."}), chat_room_id, sender=websocket)
    except Exception as e:
        logger.error(f"Unexpected error in CHAT WS for room {chat_room_id}: {e}", exc_info=True)
    finally:
        chat_manager.disconnect(websocket, chat_room_id)
        logger.info(f"Cleaned up CHAT WS connection for room {chat_room_id}, user {user_role}.")

# --- Notification WebSocket Endpoint ---
@app.websocket("/ws/notifications")
async def websocket_notification_endpoint(websocket: WebSocket):
    await notification_manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps({"type": "system", "message": "Connected to notification service."}))
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received data on notification WS (ignoring): {data}")
    except WebSocketDisconnect:
        logger.info("Notification WS client disconnected.")
    except Exception as e:
        logger.error(f"Error in notification WS endpoint: {e}", exc_info=True)
    finally:
        notification_manager.disconnect(websocket)
        logger.info("Cleaned up notification WS connection.")
