# SOS Nairobi - Backend

This directory contains the Python backend for the SOS Nairobi platform, built using FastAPI. It features a multi-agent system designed to handle help requests, manage volunteers, facilitate communication, and monitor social media for distress signals.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Prerequisites

*   Python 3.9+
*   MongoDB instance (running locally or accessible)
*   Redis instance (running locally or accessible)

## Setup Instructions

1.  **Clone the Repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Navigate to Backend Directory**:
    ```bash
    cd backend
    ```

3.  **Create a Python Virtual Environment**:
    It's highly recommended to use a virtual environment to manage dependencies.
    ```bash
    python -m venv .venv
    ```

4.  **Activate the Virtual Environment**:
    *   On macOS and Linux:
        ```bash
        source .venv/bin/activate
        ```
    *   On Windows:
        ```bash
        .\.venv\Scripts\activate
        ```

5.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The backend uses environment variables for configuration, managed via a `.env` file in the `backend/` directory. Create a file named `.env` by copying the example below and customize the values as needed.

**`backend/.env` example:**

```env
# MongoDB Configuration
MONGODB_URI="mongodb://localhost:27017/"
MONGODB_DATABASE_NAME="sos_nairobi_db"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password # Uncomment and set if your Redis is password-protected
# REDIS_DB=0

# Twitter API Configuration (Required for Twitter Monitoring)
# Create an app on the Twitter Developer Portal to get a Bearer Token.
# See: https://developer.twitter.com/en/docs/authentication/oauth-2-0/bearer-tokens
ENABLE_TWITTER_MONITORING=False # Set to True to enable Twitter stream monitoring
TWITTER_BEARER_TOKEN="YOUR_TWITTER_BEARER_TOKEN_HERE" # Replace with your actual token

# Other API Keys (Placeholders - for future NLP/Geocoding services)
# GOOGLE_API_KEY=""

# Agent Specific Settings (Defaults are in services/config.py)
# LOCATION_OBFUSCATION_FACTOR=0.001
# VOLUNTEER_MATCH_RADIUS_KM=5.0
# CHAT_SESSION_TTL_HOURS=24

# General App Settings
APP_ENV="development" # "development", "staging", "production"
DEBUG_MODE=True
```

**Key Environment Variables:**

*   `MONGODB_URI`: Connection string for your MongoDB instance.
*   `MONGODB_DATABASE_NAME`: The name of the database to use.
*   `REDIS_HOST`: Hostname for your Redis instance.
*   `REDIS_PORT`: Port for your Redis instance.
*   `REDIS_PASSWORD`: (Optional) Password for Redis.
*   `ENABLE_TWITTER_MONITORING`: `True` or `False`. Enables the IntakeAgent to listen to Twitter streams.
*   `TWITTER_BEARER_TOKEN`: Your Twitter API v2 Bearer Token (required if `ENABLE_TWITTER_MONITORING` is `True`).
*   `TWITTER_MONITOR_KEYWORDS`: (Configured in `backend/services/config.py` - can be overridden via environment if Pydantic model is adjusted) Keywords for Twitter stream.
*   `DEBUG_MODE`: `True` for development (enables more verbose logging, etc.).

## Running the Application

Once setup and configuration are complete, you can run the FastAPI application using Uvicorn.

From the **project root directory** (the one containing the `backend` folder):

```bash
PYTHONPATH=. uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or, from the `backend` directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reloading when code changes, which is useful for development.
The application will typically be available at `http://localhost:8000`.

## API Endpoints

The backend provides several API endpoints. Once the server is running, you can access interactive API documentation at:

*   **Swagger UI**: `http://localhost:8000/docs`
*   **ReDoc**: `http://localhost:8000/redoc`

**Key Endpoints Include:**

*   `GET /`: Health check.
*   `POST /api/v1/request/direct`: Submit a direct help request.
*   `POST /api/v1/volunteer/verify`: Verify a volunteer's registration.
*   `GET /api/v1/content/updates`: Fetch real-time updates.
*   `GET /api/v1/content/resources`: Fetch resources from the Resource Hub.
*   `GET /api/v1/map/hotspots`: Fetch active help requests for map display.
*   `WS /ws/chat/{chat_room_id}/{user_token}`: WebSocket endpoint for real-time chat between matched users and volunteers.

## Testing

Tests are written using `pytest`. To run the tests:

1.  Ensure your virtual environment is activated and dependencies (including `pytest` and `pytest-asyncio`) are installed.
2.  From the **project root directory**:
    ```bash
    PYTHONPATH=. pytest backend/tests
    ```
    Or, from the `backend` directory:
    ```bash
    pytest tests
    ```

This will discover and run all tests located in the `backend/tests` directory.

## Project Structure

```
backend/
├── agents/               # Contains individual agent logic (Intake, Verification, Dispatcher, Comms, Content)
│   ├── __init__.py
│   ├── intake_agent.py
│   └── ...
├── models/               # Pydantic models for data validation and schemas
│   ├── __init__.py
│   └── schemas.py
├── services/             # Shared services (Database, Message Bus, Config, external API clients)
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   └── message_bus.py
├── tests/                # Unit and integration tests
│   ├── __init__.py
│   ├── agents/
│   ├── models/
│   └── test_main_api.py
├── .env.example          # (You should create .env from this)
├── .gitignore
├── main.py               # FastAPI application entry point, API routes
├── README.md             # This file
└── requirements.txt      # Python dependencies
```

This provides a foundational guide to understanding, setting up, and running the backend system.
