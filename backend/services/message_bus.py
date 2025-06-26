import asyncio
import redis.asyncio as redis
from redis.asyncio.client import PubSub
from redis.exceptions import RedisError
import json
from typing import Callable, Awaitable, Dict, Any, Optional
import logging

from services.config import settings

logger = logging.getLogger(__name__)

# Define a callback type for subscribers
MessageHandler = Callable[[Dict[Any, Any]], Awaitable[None]]

class MessageBusService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.pubsub: Optional[PubSub] = None
        self._stop_event = asyncio.Event()
        self._listener_tasks: list[asyncio.Task] = []

    async def connect(self):
        if self.redis_client:
            try:
                await self.redis_client.ping()
                logger.info("Redis client already connected.")
                return
            except Exception:
                logger.info("Redis client exists but not connected, reconnecting...")
                self.redis_client = None

        logger.info(f"Connecting to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT} DB: {settings.REDIS_DB}")
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                auto_close_connection_pool=False # Keep connection pool open
            )
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis.")
            self.pubsub = self.redis_client.pubsub(ignore_subscribe_messages=True)
            self._stop_event.clear()
        except RedisError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
            self.pubsub = None
            raise

    async def disconnect(self):
        logger.info("Disconnecting from Redis...")
        self._stop_event.set() # Signal listeners to stop

        if self._listener_tasks:
            logger.info(f"Waiting for {len(self._listener_tasks)} listener tasks to complete...")
            await asyncio.gather(*self._listener_tasks, return_exceptions=True)
            self._listener_tasks = []
            logger.info("All listener tasks completed.")

        if self.pubsub:
            try:
                await self.pubsub.close()
                logger.info("Redis PubSub connection closed.")
            except Exception as e:
                logger.error(f"Error closing PubSub: {e}")
            self.pubsub = None

        if self.redis_client:
            try:
                await self.redis_client.close() # Closes the connection pool
                logger.info("Redis client connection pool closed.")
            except Exception as e:
                logger.error(f"Error closing Redis client: {e}")
            self.redis_client = None


    async def publish(self, topic: str, message: Dict[Any, Any]):
        if not self.redis_client:
            logger.error("Cannot publish: Redis client is not connected.")
            raise ConnectionError("Message bus not connected. Cannot publish.")
        
        try:
            await self.redis_client.ping()
        except Exception:
            logger.error("Cannot publish: Redis client is not connected.")
            raise ConnectionError("Message bus not connected. Cannot publish.")

        try:
            message_json = json.dumps(message)
            await self.redis_client.publish(topic, message_json)
            logger.debug(f"Published to {topic}: {message_json}")
        except TypeError as e:
            logger.error(f"Failed to serialize message to JSON for topic {topic}: {e} - Message: {message}")
            raise
        except RedisError as e:
            logger.error(f"Redis error while publishing to {topic}: {e}")
            raise

    async def _message_handler_loop(self, topic: str, callback: MessageHandler):
        if not self.pubsub:
            logger.error(f"PubSub not initialized for topic {topic}. Cannot listen.")
            return

        logger.info(f"Starting listener for topic: {topic}")
        try:
            await self.pubsub.subscribe(topic)
            while not self._stop_event.is_set():
                try:
                    message = await asyncio.wait_for(self.pubsub.get_message(timeout=1.0), timeout=1.1)
                    if message and message["type"] == "message":
                        logger.debug(f"Received from {topic}: {message['data']}")
                        try:
                            data_dict = json.loads(message["data"])
                            await callback(data_dict)
                        except json.JSONDecodeError:
                            logger.error(f"Failed to decode JSON from {topic}: {message['data']}")
                        except Exception as e:
                            logger.error(f"Error processing message from {topic} in callback: {e}")
                    # Yield control to allow other tasks to run
                    await asyncio.sleep(0.01)
                except asyncio.TimeoutError:
                    # This is expected, just means no message within the timeout
                    continue
                except RedisError as e:
                    logger.error(f"Redis error while listening to {topic}: {e}. Attempting to re-subscribe.")
                    # Basic re-subscribe logic, could be more robust
                    await asyncio.sleep(5) # Wait before retrying
                    if not self._stop_event.is_set() and self.pubsub:
                        try:
                            await self.pubsub.subscribe(topic)
                        except Exception as re_e:
                            logger.error(f"Failed to re-subscribe to {topic}: {re_e}")
                            break # Exit loop if re-subscribe fails
                    else:
                        break # Exit if stopping or pubsub is gone
                except Exception as e:
                    logger.error(f"Unexpected error in listener for {topic}: {e}")
                    break # Exit loop on unexpected errors
        finally:
            if self.pubsub:
                try:
                    await self.pubsub.unsubscribe(topic)
                    logger.info(f"Unsubscribed from topic: {topic}")
                except Exception as e:
                    logger.error(f"Error unsubscribing from {topic}: {e}")
            logger.info(f"Listener for topic {topic} stopped.")


    def subscribe(self, topic: str, callback: MessageHandler):
        if not self.pubsub:
            logger.error("Cannot subscribe: PubSub is not initialized. Connect first.")
            raise ConnectionError("Message bus not connected. Cannot subscribe.")

        # Create and store a task for the listener loop
        task = asyncio.create_task(self._message_handler_loop(topic, callback))
        self._listener_tasks.append(task)
        logger.info(f"Subscription task created for topic: {topic}")


# Global instance, can be managed with FastAPI lifespan events
message_bus_service = MessageBusService()

# FastAPI lifespan event handlers (to be added in main.py)
# @app.on_event("startup")
# async def startup_message_bus_client():
#     await message_bus_service.connect()

# @app.on_event("shutdown")
# async def shutdown_message_bus_client():
#     await message_bus_service.disconnect()

# Example Usage:
# async def example_subscriber_callback(message: Dict[Any, Any]):
#     print(f"Callback received: {message}")

# async def main_example():
#     await message_bus_service.connect()
#     message_bus_service.subscribe("test-topic", example_subscriber_callback)

#     # Keep the main task alive to let subscriber run, or manage listeners explicitly
#     # For example, start publisher in another task
#     async def publisher_task():
#         count = 0
#         while count < 5:
#             await asyncio.sleep(2)
#             await message_bus_service.publish("test-topic", {"data": "hello world", "count": count})
#             count += 1
#         # After publishing, you might want to signal subscribers or disconnect
#         # For this example, we'll let the main loop handle shutdown.

#     pub_task = asyncio.create_task(publisher_task())
#     await pub_task # Wait for publisher to finish for this simple example

#     # In a real app, subscribers run indefinitely until shutdown.
#     # Here, we'll simulate a short run and then disconnect.
#     await asyncio.sleep(15) # Let subscriber run for a bit
#     await message_bus_service.disconnect()

# if __name__ == "__main__":
#     logging.basicConfig(level=logging.INFO)
#     asyncio.run(main_example())
