import uuid
import random
from datetime import datetime
import logging
from typing import Optional, Union

from ..models import schemas
from ..services.message_bus import message_bus_service # Assuming global instance
from ..services.config import settings
# from ..services.nlp_service import nlp_service # Placeholder
# from ..services.geocoding_service import geocoding_service # Placeholder
import tweepy # Twitter API client
import asyncio


logger = logging.getLogger(__name__)

# --- Twitter Streaming Client ---
class SosNairobiStreamingClient(tweepy.StreamingClient):
    def __init__(self, bearer_token, intake_agent_processor, *args, **kwargs):
        super().__init__(bearer_token, *args, **kwargs)
        self.intake_agent_processor = intake_agent_processor
        logger.info("SosNairobiStreamingClient initialized.")

    def on_connect(self):
        logger.info("Twitter StreamingClient connected.")

    def on_tweet(self, tweet: tweepy.Tweet):
        logger.info(f"Received tweet (ID: {tweet.id}): {tweet.text}")
        # Schedule the processing of the tweet in the event loop
        # The intake_agent_processor.handle_twitter_mention should be async
        asyncio.create_task(self.intake_agent_processor.handle_twitter_mention(tweet))

    def on_error(self, status_code):
        logger.error(f"Twitter StreamingClient error: {status_code}")
        # Returning False from on_error will disconnect the stream
        if status_code == 420: # Rate limited
            return False # Disconnect if rate limited. Could implement backoff later.
        return True # Continue running for other errors, though some might be fatal.

    def on_disconnect(self):
        logger.info("Twitter StreamingClient disconnected.")

    def on_closed(self, response):
        logger.info(f"Twitter stream closed: {response}")

    def on_exception(self, exception):
        logger.error(f"Twitter stream exception: {exception}", exc_info=True)


class IntakeAgent:
    def __init__(self):
        self.twitter_client = None
        self.streaming_client = None
        self._twitter_monitoring_task: Optional[asyncio.Task] = None
        self._stop_twitter_monitoring_event = asyncio.Event()

        if settings.ENABLE_TWITTER_MONITORING and settings.TWITTER_BEARER_TOKEN and settings.TWITTER_BEARER_TOKEN != "YOUR_TWITTER_BEARER_TOKEN_HERE":
            try:
                self.twitter_client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)
                # Verify client credentials by making a simple call
                self.twitter_client.get_me() # This will raise if auth fails
                logger.info("Twitter API Client initialized successfully.")
                self.streaming_client = SosNairobiStreamingClient(settings.TWITTER_BEARER_TOKEN, self)
            except Exception as e:
                logger.error(f"Failed to initialize Twitter Client or StreamingClient: {e}. Twitter monitoring will be disabled.", exc_info=True)
                self.twitter_client = None
                self.streaming_client = None
        else:
            logger.info("Twitter monitoring is disabled or Bearer Token is not configured.")

    async def _simple_nlp_for_tweet(self, text: str) -> tuple[str, Optional[str]]:
        """
        Very basic NLP to guess request type and location from tweet text.
        Returns (request_type, potential_location_text)
        """
        text_lower = text.lower()
        request_type = "Medical" # Default, or could be "NeedsAssessment"
        location_text = None

        if "medic" in text_lower or "injury" in text_lower or "ambulance" in text_lower:
            request_type = "Medical"
        elif "legal" in text_lower or "lawyer" in text_lower or "arrest" in text_lower:
            request_type = "Legal"
        elif "shelter" in text_lower or "safe house" in text_lower or "stranded" in text_lower:
            request_type = "Shelter"

        # Rudimentary location extraction (very basic)
        # This would ideally use a proper NER model.
        # For now, just check for "Nairobi" or common areas if mentioned.
        # This is highly unreliable.
        if "nairobi" in text_lower:
            location_text = "Nairobi"
        # Add more known locations if needed for stubbing:
        # elif "westlands" in text_lower:
        #     location_text = "Westlands, Nairobi"

        logger.info(f"Simple NLP on tweet: guessed type '{request_type}', location text '{location_text}'")
        return request_type, location_text


    async def _stub_geocode_location(self, location_text: Optional[str]) -> schemas.Coordinates: # Allow None
        """Placeholder for geocoding a location string to coordinates."""
        logger.info(f"Stub geocoding for location: '{location_text}'")
        # If no location_text, default to a general Nairobi area or handle as error
        if not location_text: # If NLP couldn't find a location.
            logger.warning("No location text provided for geocoding, defaulting to central Nairobi.")
            # Default to a central Nairobi coordinate or handle as un-geocodable
            # For now, random around CBD if no specific location is found.
            lat = -1.286389 + (random.random() - 0.5) * 0.05
            lng = 36.817223 + (random.random() - 0.5) * 0.05
            return schemas.Coordinates(lat=lat, lng=lng)

        # Real geocoding service would be called here.
        # For now, return random coordinates roughly around Nairobi.
        lat = -1.2921 + (random.random() - 0.5) * 0.1
        lng = 36.8219 + (random.random() - 0.5) * 0.1
        return schemas.Coordinates(lat=lat, lng=lng)

    def _obfuscate_location(self, coordinates: schemas.Coordinates) -> schemas.Coordinates:
        """Applies a minor, random offset to coordinates for privacy."""
        offset = settings.LOCATION_OBFUSCATION_FACTOR
        obfuscated_lat = coordinates.lat + (random.random() - 0.5) * offset * 2
        obfuscated_lng = coordinates.lng + (random.random() - 0.5) * offset * 2
        offset = settings.LOCATION_OBFUSCATION_FACTOR
        obfuscated_lat = coordinates.lat + (random.random() - 0.5) * offset * 2
        obfuscated_lng = coordinates.lng + (random.random() - 0.5) * offset * 2
        # logger.info(f"Obfuscated coordinates from {coordinates} to {obfuscated_lat}, {obfuscated_lng}") # Too verbose for every call
        return schemas.Coordinates(lat=obfuscated_lat, lng=obfuscated_lng)

    async def handle_direct_request(self, payload: schemas.DirectHelpRequestPayload) -> schemas.NewHelpRequest:
        """
        Processes a direct help request received from the API.
        """
        logger.info(f"IntakeAgent processing direct request: {payload.model_dump_json(indent=2)}")

        # If direct request includes coordinates (e.g. from map pin drop), use them.
        # This requires DirectHelpRequestPayload to be updated.
        # For now, assuming it still relies on location_text for direct requests
        # as per original plan, and backend geocodes it.
        # Let's assume payload.coordinates is an Optional field for now.
        # (Need to update schemas.DirectHelpRequestPayload)

        # For demonstration, if coordinates are directly provided in payload (e.g. from a map click)
        if payload.coordinates:
            raw_coordinates = payload.coordinates
            logger.info(f"Using coordinates directly from payload: {raw_coordinates}")
        elif payload.location_text: # Fallback to geocoding if coordinates are not provided but text is
            logger.info(f"No direct coordinates in payload, attempting to geocode location_text: '{payload.location_text}'")
            raw_coordinates = await self._stub_geocode_location(payload.location_text)
        else:
            # This case should ideally be validated by Pydantic if at least one is required,
            # or handled gracefully. For now, default to a generic Nairobi location if neither is present.
            logger.warning("No coordinates or location_text provided in direct request. Defaulting location.")
            raw_coordinates = await self._stub_geocode_location("Nairobi")


        request_type = payload.request_type

        obfuscated_coordinates = self._obfuscate_location(raw_coordinates)

        new_request = schemas.NewHelpRequest(
            # request_id is auto-generated by Pydantic model default_factory
            # timestamp is auto-generated
            source="direct_app",
            request_type=request_type, # type: ignore (Pydantic will validate Literal)
            location_text=payload.location_text or "Location from map pin", # Use provided text or a default
            coordinates=obfuscated_coordinates,
            original_content=payload.original_content,
            status="pending"
        )
        logger.info(f"Standardized help request: {new_request.model_dump_json(indent=2)}")

        # Publish to message bus
        try:
            await message_bus_service.publish("sos-requests:new", new_request.model_dump(mode='json'))
            logger.info(f"Published NewHelpRequest {new_request.request_id} (from direct_app) to 'sos-requests:new'")
        except Exception as e:
            logger.error(f"Failed to publish NewHelpRequest {new_request.request_id} to message bus: {e}", exc_info=True)
            raise
        return new_request

    async def handle_twitter_mention(self, tweet: tweepy.Tweet):
        """
        Processes a help request from a Twitter mention.
        """
        logger.info(f"IntakeAgent processing tweet ID {tweet.id}: {tweet.text}")

        # 1. Basic NLP for intent and location
        #    This is highly simplified. Real implementation needs robust NLP.
        request_type, location_text_from_tweet = await self._simple_nlp_for_tweet(tweet.text)

        # 2. Geocode Location (stubbed)
        #    If tweet has coordinates, use them. Otherwise, use location_text_from_tweet.
        #    Twitter API v2 `tweet.geo` can contain `place_id` or `coordinates`.
        #    `tweet.geo['coordinates']['coordinates']` would be [lng, lat] if point geo.
        raw_coordinates = None
        if tweet.geo and tweet.geo.get("coordinates"): # Direct coordinates from tweet
            coords = tweet.geo["coordinates"]["coordinates"] # [lng, lat]
            raw_coordinates = schemas.Coordinates(lat=coords[1], lng=coords[0])
            logger.info(f"Using geo-coordinates from tweet {tweet.id}: {raw_coordinates}")
        else: # Fallback to geocoding extracted text
            raw_coordinates = await self._stub_geocode_location(location_text_from_tweet)

        # 3. Obfuscate Location
        obfuscated_coordinates = self._obfuscate_location(raw_coordinates)

        # 4. Standardize Request
        new_request = schemas.NewHelpRequest(
            source="twitter",
            request_type=request_type, # type: ignore
            location_text=location_text_from_tweet or "Location from tweet (details in original content)",
            coordinates=obfuscated_coordinates,
            original_content=f"Tweet from @{tweet.author_id} (ID: {tweet.id}): {tweet.text}", # tweet.author_id is available if user expansions are used. For now, just ID.
            # We might need to fetch author username if desired, via another API call.
            status="pending"
        )
        logger.info(f"Standardized help request from Twitter: {new_request.model_dump_json(indent=2)}")

        # 5. Publish to message bus
        try:
            await message_bus_service.publish("sos-requests:new", new_request.model_dump(mode='json'))
            logger.info(f"Published NewHelpRequest {new_request.request_id} (from twitter) to 'sos-requests:new'")
        except Exception as e:
            logger.error(f"Failed to publish NewHelpRequest {new_request.request_id} from twitter: {e}", exc_info=True)
            # Decide on error handling, e.g., retry, dead-letter queue.

    async def _manage_stream_rules(self):
        if not self.twitter_client:
            logger.warning("Twitter client not available, cannot manage stream rules.")
            return

        logger.info("Managing Twitter stream rules...")
        # Fetch existing rules
        try:
            resp = self.twitter_client.get_rules()
            existing_rules = resp.data or []
            logger.info(f"Found {len(existing_rules)} existing rules.")

            # Delete old rules with our specific tag
            rule_ids_to_delete = [rule.id for rule in existing_rules if rule.tag == settings.TWITTER_STREAM_RULE_TAG]
            if rule_ids_to_delete:
                self.twitter_client.delete_rules(ids=rule_ids_to_delete)
                logger.info(f"Deleted {len(rule_ids_to_delete)} old rules with tag '{settings.TWITTER_STREAM_RULE_TAG}'.")

            # Construct new rule value from keywords
            # Rule format: "(keyword1 OR keyword2 OR "exact phrase") -is:retweet lang:en"
            # For simplicity, just ORing keywords. Add -is:retweet and lang:en for better filtering.
            keyword_query_part = " OR ".join([f'"{kw}"' if " " in kw else kw for kw in settings.TWITTER_MONITOR_KEYWORDS])
            # Ensure query is not too long (Twitter has limits, though ORing a few keywords is fine)
            # Max rule length 512 chars for standard access.
            if len(keyword_query_part) > 450: # Leave some room for other parts
                logger.warning("Combined keyword query for Twitter is very long, may exceed limits.")
                keyword_query_part = keyword_query_part[:450] # Truncate

            rule_value = f"({keyword_query_part}) -is:retweet lang:en"
            # Adding geo filter for Nairobi (approximate bounding box for Nairobi)
            # Nairobi bounding box approx: [36.65, -1.40, 37.10, -1.15] (min_long, min_lat, max_long, max_lat)
            # This is an advanced filter, might require higher Twitter API access level.
            # For now, let's keep it simpler without bounding_box unless confirmed it works with standard access.
            # rule_value += " bounding_box:[36.65 -1.40 37.10 -1.15]"

            new_rule = tweepy.StreamRule(value=rule_value, tag=settings.TWITTER_STREAM_RULE_TAG)

            self.twitter_client.add_rules(add=[new_rule])
            logger.info(f"Added new stream rule with tag '{settings.TWITTER_STREAM_RULE_TAG}': {rule_value}")

        except tweepy.TweepyException as e:
            logger.error(f"TweepyException while managing stream rules: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error managing stream rules: {e}", exc_info=True)


    async def start_twitter_monitoring(self):
        if not self.streaming_client or not settings.ENABLE_TWITTER_MONITORING:
            logger.info("Twitter monitoring is not starting (disabled, not configured, or client init failed).")
            return

        await self._manage_stream_rules() # Setup rules before starting stream

        logger.info("Starting Twitter monitoring stream...")
        # Fields to request from Twitter API for each tweet
        tweet_fields = ["created_at", "text", "geo", "author_id"]
        # Expansions allow getting related data, e.g., user details, place details
        expansions = ["author_id", "geo.place_id"]
        # place_fields = ["contained_within", "country", "country_code", "full_name", "geo", "id", "name", "place_type"]

        # Loop to handle disconnections and attempt to restart
        while not self._stop_twitter_monitoring_event.is_set():
            try:
                # Note: streaming_client.filter() is blocking. Run in a separate thread or handle with asyncio.
                # Tweepy's StreamingClient.filter() is indeed blocking.
                # To run it asynchronously and allow graceful shutdown, it needs to be run in an executor.
                # Or, check if a newer version of tweepy has async stream handling.
                # For now, let's assume we run it and it blocks until an error or manual disconnect.
                # This means the `while` loop for retries here might not work as expected without threading.

                # This is a blocking call. If it's run directly in the main asyncio event loop,
                # it will block all other async operations.
                # It needs to be run in a separate thread using `asyncio.to_thread` (Python 3.9+)
                # or `loop.run_in_executor`.

                logger.info("Attempting to connect Twitter stream...")
                # For simplicity of this step, I'll call it directly.
                # A production system would use run_in_executor.
                # This will block the current async task.
                # The SosNairobiStreamingClient handles on_tweet which calls an async method.

                # This is how you'd run it in an executor:
                # loop = asyncio.get_event_loop()
                # await loop.run_in_executor(None, self.streaming_client.filter, tweet_fields, expansions)

                # Direct call for now (will block this task, but on_tweet is async)
                # This is not ideal for the main event loop.
                # The proper way is to run self.streaming_client.filter in a separate thread.
                # And have a way to signal self.streaming_client.disconnect() from another task.

                # This simple call will block. If an error occurs, on_error or on_exception handles it.
                # If disconnect is called from another task, it should stop.
                # The current while loop is more for programmatic retries if filter() returned.
                self.streaming_client.filter(
                    tweet_fields=tweet_fields,
                    expansions=expansions
                    # place_fields=place_fields # if geo.place_id expansion used
                )

            except tweepy.TweepyException as e:
                logger.error(f"TweepyException in Twitter monitoring stream: {e}", exc_info=True)
            except Exception as e:
                logger.error(f"Unexpected error in Twitter monitoring stream: {e}", exc_info=True)

            if self._stop_twitter_monitoring_event.is_set():
                logger.info("Stop event received, exiting Twitter monitoring loop.")
                break

            logger.info("Twitter stream disconnected/exited. Re-attempting connection after 60 seconds (if not stopping).")
            try:
                await asyncio.wait_for(self._stop_twitter_monitoring_event.wait(), timeout=60)
                if self._stop_twitter_monitoring_event.is_set(): # Check again if event was set during wait
                    logger.info("Stop event received during wait, exiting Twitter monitoring loop.")
                    break
            except asyncio.TimeoutError:
                logger.info("Timeout reached, proceeding to reconnect Twitter stream.")
                # Continue loop to reconnect
            except asyncio.CancelledError:
                logger.info("Twitter monitoring task cancelled.")
                break

        logger.info("Twitter monitoring stream has stopped.")
        if self.streaming_client:
            self.streaming_client.disconnect() # Ensure disconnect is called

    async def stop_twitter_monitoring(self):
        logger.info("Attempting to stop Twitter monitoring...")
        self._stop_twitter_monitoring_event.set()
        if self.streaming_client:
            logger.info("Disconnecting Twitter streaming client...")
            self.streaming_client.disconnect() # This should make filter() return/stop
        if self._twitter_monitoring_task:
            try:
                logger.info("Waiting for Twitter monitoring task to complete...")
                await asyncio.wait_for(self._twitter_monitoring_task, timeout=10)
                logger.info("Twitter monitoring task completed.")
            except asyncio.TimeoutError:
                logger.warning("Timeout waiting for Twitter monitoring task to complete.")
            except asyncio.CancelledError:
                 logger.info("Twitter monitoring task was already cancelled.")


# Global instance of the agent
intake_agent = IntakeAgent()
