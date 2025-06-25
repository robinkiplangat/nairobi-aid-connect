### **Prompt: Build a Multi-Agent Backend for SOS Nairobi using Google ADK**

**Objective:**
Generate the complete Python backend codebase for the SOS Nairobi platform based on the following multi-agent system architecture. The system must be built using Google's Agent Development Kit (ADK), FastAPI for the API layer, and MongoDB as the database. The code should be modular, with each agent in its own file, and include all necessary data models and communication logic.

-----

### **1. High-Level System Architecture & Communication Backbone**

The system is composed of five distinct, specialized agents that communicate asynchronously via a message bus (e.g., Redis Pub/Sub, or a similar message queue). This decoupled architecture ensures that each agent can perform its task independently, enhancing scalability and resilience.

**Communication Flow (Pub/Sub Model):**

  * Agents publish messages to specific **topics** (channels).
  * Other agents subscribe to the topics relevant to their function to receive messages and trigger their processing logic.

**Core Topics:**

  * `sos-requests:new`: For publishing newly created and standardized help requests.
  * `assignments:create`: For publishing a confirmed match between a requester and a volunteer.
  * `volunteer:status`: For broadcasting changes in a volunteer's status (e.g., verified, available, busy).
  * `chat:establish`: For initiating the creation of a secure chat session.
  * `system:notifications`: A general topic for sending alerts or information to clients.

**(Visual Description for LLM)**
*Imagine a central message bus. The IntakeAgent pushes requests onto the bus. The DispatcherAgent pulls requests off, finds a volunteer, and pushes an assignment back onto the bus. The CommsAgent sees the assignment and creates a chat room, notifying the clients.*

-----

### **2. Detailed Agent Profiles & Specifications**

#### **Agent 1: The `IntakeAgent` (The Sentry)**

  * **Core Responsibility:** To be the single point of entry for all help requests, whether from direct user input via the app or from monitoring social media. It standardizes all incoming data into a consistent format.
  * **Primary Tools/APIs:**
      * Twitter API v2 (Filtered Stream Endpoint)
      * A Natural Language Processing (NLP) service (e.g., Google's Natural Language API) for entity and intent recognition.
      * A Geocoding service (e.g., Google Maps Geocoding API) to convert location text to coordinates.
  * **Input Triggers:**
    1.  An HTTP POST request to `/api/v1/request/direct` from the frontend application.
    2.  A new tweet from the Twitter Filtered Stream matching keywords like (`#SOSNairobi`, `medic needed Nairobi`, `protest injury Kenya`, etc.).
  * **Processing Logic & Key Tasks:**
    1.  **Receive Data:** Accept raw JSON from the app or a tweet object.
    2.  **Process with NLP:**
          * Identify intent: Is the request `Medical`, `Legal`, or `Shelter`?
          * Extract entities: Identify location names, landmarks, or street names mentioned in the text.
    3.  **Geocode Location:** Convert the extracted location text into latitude/longitude coordinates.
    4.  **Obfuscate Location:** Apply a minor, random offset to the coordinates to protect user privacy while keeping the pin in the general vicinity.
    5.  **Standardize Request:** Create a `NewHelpRequest` JSON object with a unique ID and a timestamp.
    6.  **Publish:** Publish the `NewHelpRequest` object to the `sos-requests:new` topic.
  * **Output Data Schema (`NewHelpRequest`):**
    ```json
    {
      "request_id": "uuid-v4-string",
      "timestamp": "iso-8601-datetime-string",
      "source": "direct_app" | "twitter",
      "request_type": "Medical" | "Legal" | "Shelter",
      "location_text": "Original text description of location",
      "coordinates": {
        "lat": -1.2884,
        "lng": 36.8235
      },
      "original_content": "Full text of the request or tweet"
    }
    ```

-----

#### **Agent 2: The `VerificationAgent` (The Gatekeeper)**

  * **Core Responsibility:** To handle the verification and status of all volunteers.
  * **Primary Tools/APIs:**
      * MongoDB Driver (for accessing the `volunteers` collection).
  * **Input Triggers:**
      * An HTTP POST request to `/api/v1/volunteer/verify` containing the volunteer's verification code.
  * **Processing Logic & Key Tasks:**
    1.  **Receive Code:** Get the verification code from the API request.
    2.  **Query Database:** Look up the code in the `volunteers` collection.
    3.  **Validate:**
          * If the code is valid, update the corresponding volunteer's document: set `is_verified` to `true` and `status` to `available`.
          * If invalid, return an authentication error.
    4.  **Publish Status:** On successful verification, publish a `VolunteerStatus` message to the `volunteer:status` topic.
  * **Output Data Schema (`VolunteerStatus`):**
    ```json
    {
      "volunteer_id": "db-object-id-string",
      "timestamp": "iso-8601-datetime-string",
      "status": "available" | "busy" | "offline"
    }
    ```

-----

#### **Agent 3: The `DispatcherAgent` (The Coordinator)**

  * **Core Responsibility:** To match incoming help requests with the best available and verified volunteer. This is the core logic engine of the system.
  * **Primary Tools/APIs:**
      * MongoDB Driver (for querying `volunteers` and `requests` collections).
      * Geospatial query functions (native to MongoDB).
  * **Input Triggers:**
      * Subscribes to the `sos-requests:new` topic.
      * Subscribes to the `volunteer:status` topic to maintain an up-to-date cache of available volunteers.
  * **Processing Logic & Key Tasks:**
    1.  **Receive Request:** Get a `NewHelpRequest` message.
    2.  **Store Request:** Save the request details to a `requests` collection in MongoDB.
    3.  **Find Volunteers:**
          * Perform a geospatial query on the `volunteers` collection to find all volunteers who are `verified`, `available`, and have the skills matching the `request_type`.
          * The query should find volunteers within a reasonable radius (e.g., 5km) of the request's coordinates.
    4.  **Select Best Match:**
          * From the list of potential volunteers, select the best candidate (e.g., the closest one).
          * If no volunteer is found, flag the request for manual review.
    5.  **Create Assignment:** Once a match is made:
          * Update the volunteer's status to `busy`.
          * Create a `MatchAssignment` object.
    6.  **Publish:** Publish the `MatchAssignment` object to the `assignments:create` topic.
  * **Output Data Schema (`MatchAssignment`):**
    ```json
    {
      "assignment_id": "uuid-v4-string",
      "request_id": "uuid-v4-string",
      "volunteer_id": "db-object-id-string",
      "requester_token": "secure-random-string",
      "volunteer_token": "secure-random-string"
    }
    ```

-----

#### **Agent 4: The `CommsAgent` (The Operator)**

  * **Core Responsibility:** To establish and manage secure, ephemeral communication channels (chat rooms) between matched requesters and volunteers.
  * **Primary Tools/APIs:**
      * WebSocket library/manager.
      * MongoDB or Redis for storing temporary chat session data.
  * **Input Triggers:**
      * Subscribes to the `assignments:create` topic.
  * **Processing Logic & Key Tasks:**
    1.  **Receive Assignment:** Get a `MatchAssignment` message.
    2.  **Create Chat Room:**
          * Generate a unique `chat_room_id`.
          * Store the session details (including `request_id`, `volunteer_id`, `requester_token`, `volunteer_token`) in a temporary data store (e.g., Redis with a 24-hour TTL).
    3.  **Establish WebSocket Endpoint:** Prepare the WebSocket server to handle connections for this `chat_room_id`.
    4.  **Notify Clients:** Publish a `ChatSessionEstablished` message to the `system:notifications` topic (or send it directly back to the clients via a dedicated WebSocket channel). The frontend will use this information to connect the correct users to the WebSocket.
    5.  **Relay Messages:** Securely relay messages between the two connected clients in the room.
    6.  **Terminate Session:** After the TTL expires, automatically delete all chat data.
  * **Output Data Schema (`ChatSessionEstablished`):**
    ```json
    {
      "chat_room_id": "unique-chat-room-id-string",
      "assignment_id": "uuid-v4-string",
      "requester_token": "secure-random-string",
      "volunteer_token": "secure-random-string"
    }
    ```

-----

#### **Agent 5: The `ContentAgent` (The Librarian)**

  * **Core Responsibility:** To serve the content for the "Real-Time Updates" feed and the "Resource Hub."
  * **Primary Tools/APIs:**
      * MongoDB Driver (for accessing `updates` and `resources` collections).
  * **Input Triggers:**
      * An HTTP GET request to `/api/v1/content/updates`.
      * An HTTP GET request to `/api/v1/content/resources`.
  * **Processing Logic & Key Tasks:**
    1.  **Receive Request:** Get the HTTP request for content.
    2.  **Query Database:** Fetch the relevant documents from the appropriate collection in MongoDB.
    3.  **Format and Return:** Format the data as a JSON array and return it in the HTTP response.
    <!-- end list -->
      * (This agent is simpler and doesn't heavily rely on the Pub/Sub model, acting more like a standard microservice. It ensures content management is separate from the core emergency response logic.)