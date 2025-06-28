import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

# Adjust the import path based on how pytest discovers your app
# If running pytest from project root (where `backend` is a subdir):
from backend.main import app
from backend.models import schemas

# If services are initialized globally, they might attempt to connect.
# For isolated tests, you might want to mock them or use a test-specific app setup.

client = TestClient(app)

# Fixture to automatically manage service connections for tests if needed
# This is a simplified example. For real DB/Redis, you'd use test databases
# and clear them, or mock the services entirely.
@pytest.fixture(scope="module", autouse=True)
async def manage_services():
    # This attempts to use the actual services.
    # For more isolated unit/integration tests of API endpoints,
    # you'd typically mock out the agent/service calls.
    # For this example, we'll let them run but mock specific external calls if they happen.

    # Simulate app startup (connects services)
    # TestClient typically handles lifespan events if the app is configured correctly.
    # If not, you might need to trigger them manually or use app.router.startup()/shutdown()
    # For now, assuming TestClient handles it. If tests fail due to service connection,
    # this fixture would need to explicitly call startup/shutdown events or mock services.

    # This is an async fixture, so it needs pytest-asyncio if it does async work.
    # However, TestClient itself is synchronous, so direct async here is tricky
    # unless you run an event loop for this fixture.
    # Let's assume for now TestClient handles lifespan.

    yield # Test runs here

    # Simulate app shutdown (disconnects services)
    # await app.router.shutdown() # Example if manual shutdown needed

def test_read_root_health_check():
    """Tests the root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "SOS Nairobi Backend is running"}

@patch("backend.agents.intake_agent.IntakeAgent.handle_direct_request")
def test_submit_direct_request_success(mock_handle_direct_request):
    """
    Tests the /api/v1/request/direct endpoint for successful submission.
    Mocks the actual agent processing.
    """
    # Configure the mock to return a successful-like response from the agent
    mock_agent_response = schemas.NewHelpRequest(
        request_id="test-uuid-123",
        source="direct_app",
        request_type="Medical",
        location_text="Test Location",
        coordinates=schemas.Coordinates(lat=1.0, lng=1.0),
        original_content="Help needed",
        status="pending_processing" # Or whatever status agent sets initially
    )
    # Since handle_direct_request is async, the mock needs to be an AsyncMock
    # or return an awaitable if the FastAPI endpoint `await`s it.
    # If IntakeAgent.handle_direct_request is an `async def`, then mock should be AsyncMock.

    # Re-checking intake_agent.py, handle_direct_request is async.
    mock_handle_direct_request = AsyncMock(return_value=mock_agent_response)

    # Patch the global instance used by main.py
    with patch("backend.main.intake_agent.handle_direct_request", mock_handle_direct_request):
        request_payload = {
            "request_type": "Medical",
            "location_text": "Clinic near me",
            "original_content": "I need a doctor for a cut."
        }
        response = client.post("/api/v1/request/direct", json=request_payload)

    assert response.status_code == 200
    json_response = response.json()
    assert json_response["message"] == "Request received and is being processed by IntakeAgent."
    assert json_response["details"]["request_id"] == "test-uuid-123"
    assert json_response["details"]["status"] == "pending_processing"

    mock_handle_direct_request.assert_awaited_once()
    # You can also assert the payload received by the mock if needed:
    # called_payload = mock_handle_direct_request.call_args[0][0]
    # assert called_payload.request_type == "Medical"


@patch("backend.agents.intake_agent.IntakeAgent.handle_direct_request", new_callable=AsyncMock)
def test_submit_direct_request_agent_exception(mock_handle_direct_request):
    """
    Tests the /api/v1/request/direct endpoint when the agent throws an exception.
    """
    mock_handle_direct_request.side_effect = Exception("Agent processing failed")

    with patch("backend.main.intake_agent.handle_direct_request", mock_handle_direct_request):
        request_payload = {
            "request_type": "Legal",
            "location_text": "Downtown",
            "original_content": "Need legal advice."
        }
        response = client.post("/api/v1/request/direct", json=request_payload)

    assert response.status_code == 500
    json_response = response.json()
    assert "An internal error occurred" in json_response["detail"]
    # To be more precise: assert "Agent processing failed" in json_response["detail"]
    # This depends on how the FastAPI endpoint formats the error message.
    # Current main.py: detail=f"An internal error occurred: {str(e)}"
    assert "Agent processing failed" in json_response["detail"]


def test_submit_direct_request_invalid_payload():
    """Tests /api/v1/request/direct with an invalid payload (e.g., missing field)."""
    request_payload = {
        # "request_type": "Shelter", # Missing request_type
        "location_text": "Bus Station",
        "original_content": "Looking for shelter."
    }
    response = client.post("/api/v1/request/direct", json=request_payload)
    assert response.status_code == 422 # FastAPI's default for Pydantic validation errors
    json_response = response.json()
    assert "detail" in json_response
    # Example check for a specific missing field error
    found_missing_request_type = False
    for error in json_response["detail"]:
        if error["type"] == "missing" and "request_type" in error["loc"]:
            found_missing_request_type = True
            break
    assert found_missing_request_type, "Error detail should indicate 'request_type' is missing."


@patch("backend.agents.content_agent.ContentAgent.fetch_updates", new_callable=AsyncMock)
def test_get_real_time_updates_success(mock_fetch_updates):
    """Tests the /api/v1/content/updates endpoint successfully."""
    mock_updates_response = [
        schemas.Update(update_id="update1", title="Update 1", summary="Summary 1"),
        schemas.Update(update_id="update2", title="Update 2", summary="Summary 2", full_content="Full content here"),
    ]
    mock_fetch_updates.return_value = mock_updates_response

    with patch("backend.main.content_agent.fetch_updates", mock_fetch_updates):
        response = client.get("/api/v1/content/updates")

    assert response.status_code == 200
    json_response = response.json()
    assert len(json_response) == 2
    assert json_response[0]["title"] == "Update 1"
    assert json_response[1]["full_content"] == "Full content here"
    mock_fetch_updates.assert_awaited_once()

@patch("backend.agents.content_agent.ContentAgent.fetch_updates", new_callable=AsyncMock)
def test_get_real_time_updates_agent_exception(mock_fetch_updates):
    """Tests /api/v1/content/updates when the content agent raises an exception."""
    mock_fetch_updates.side_effect = Exception("DB connection error")

    with patch("backend.main.content_agent.fetch_updates", mock_fetch_updates):
        response = client.get("/api/v1/content/updates")

    assert response.status_code == 500
    json_response = response.json()
    assert "An internal error occurred while fetching updates" in json_response["detail"]
    assert "DB connection error" in json_response["detail"]


@patch("backend.agents.content_agent.ContentAgent.fetch_active_hotspots", new_callable=AsyncMock)
def test_get_map_hotspots_success(mock_fetch_hotspots):
    """Tests the /api/v1/map/hotspots endpoint successfully."""
    mock_hotspots_response = [
        schemas.MapHotspot(
            id="req1",
            coordinates=schemas.Coordinates(lat=-1.2, lng=36.8),
            request_type="Medical",
            timestamp=datetime.utcnow()
        ),
        schemas.MapHotspot(
            id="req2",
            coordinates=schemas.Coordinates(lat=-1.3, lng=36.9),
            request_type="Shelter",
            timestamp=datetime.utcnow()
        ),
    ]
    mock_fetch_hotspots.return_value = mock_hotspots_response

    # Patch the content_agent instance used by main.py
    with patch("backend.main.content_agent.fetch_active_hotspots", mock_fetch_hotspots):
        response = client.get("/api/v1/map/hotspots?limit=10")

    assert response.status_code == 200
    json_response = response.json()
    assert len(json_response) == 2
    assert json_response[0]["id"] == "req1"
    assert json_response[1]["request_type"] == "Shelter"

    # Assert that the mock was called with the limit parameter if your agent method accepts it
    mock_fetch_hotspots.assert_awaited_once_with(limit=10)


@patch("backend.agents.content_agent.ContentAgent.fetch_active_hotspots", new_callable=AsyncMock)
def test_get_map_hotspots_agent_exception(mock_fetch_hotspots):
    """Tests /api/v1/map/hotspots when the content agent raises an exception."""
    mock_fetch_hotspots.side_effect = Exception("Failed to query hotspots DB")

    with patch("backend.main.content_agent.fetch_active_hotspots", mock_fetch_hotspots):
        response = client.get("/api/v1/map/hotspots")

    assert response.status_code == 500
    json_response = response.json()
    assert "An internal error occurred while fetching map hotspots" in json_response["detail"]
    assert "Failed to query hotspots DB" in json_response["detail"]


# To run these tests:
# From project root: PYTHONPATH=. pytest backend/tests/test_main_api.py
# Ensure that the main FastAPI 'app' instance does not try to connect to
# real DB/Redis during import time if those services are not available in the test environment.
# Lifespan events are generally okay as TestClient can manage them.
# Need to import `datetime` for the new test cases.
from datetime import datetime
# The use of `patch` here helps isolate the API layer from the agent's internal logic for these tests.
# The `manage_services` fixture is a placeholder; true end-to-end tests would require a more
# sophisticated setup with test databases or fully mocked services.
# For `pytest-asyncio` to work, ensure it's installed and tests using async features are marked
# or run with an appropriate event loop policy if not using `@pytest.mark.asyncio`.
# Here, TestClient is sync, but the patched methods are async, so AsyncMock is crucial.

# --- Mock data for new tests ---
MOCK_DEMO_DATA = [
    {
        "name": "Resource Hub Data",
        "emergency_contacts": [{"name": "LSK", "number": "0800720434"}],
        "safety_tips": ["Stay hydrated"],
        "first_aid_basics": ["Check responsiveness"],
        "legal_rights": ["Right to assembly"]
    }
]

MOCK_RECORDS_DATA = [
    {"id": 1, "name": "Medical Supplies", "status": "Available", "quantity": 25, "location": "Nairobi CBD", "last_updated": "2 hours ago"},
    {"id": 2, "name": "Emergency Vehicles", "status": "In Use", "quantity": 8, "location": "Westlands", "last_updated": "15 min ago"}
]


# --- Fixture for mocking db_service.get_db ---
@pytest.fixture
def mock_db_service_with_data():
    """Mocks the database service to return predefined data for demodata and records."""
    mock_db = AsyncMock()

    # Mock for demodata collection
    mock_demodata_collection = AsyncMock()
    mock_demodata_cursor = AsyncMock()
    mock_demodata_cursor.to_list = AsyncMock(return_value=MOCK_DEMO_DATA)
    mock_demodata_collection.find = MagicMock(return_value=mock_demodata_cursor)

    # Mock for records collection
    mock_records_collection = AsyncMock()
    mock_records_cursor = AsyncMock()
    mock_records_cursor.to_list = AsyncMock(return_value=MOCK_RECORDS_DATA)
    mock_records_collection.find = MagicMock(return_value=mock_records_cursor)

    # Attach mock collections to the mock_db object
    mock_db.demodata = mock_demodata_collection
    mock_db.records = mock_records_collection

    return mock_db


# --- Tests for new endpoints ---

@patch("backend.main.db_service.get_db")
def test_get_demo_data_success(mock_get_db, test_client, mock_db_service_with_data):
    """Test the /api/demodata endpoint successfully."""
    mock_get_db.return_value = mock_db_service_with_data # Make get_db return our detailed mock

    response = test_client.get("/api/demodata")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(MOCK_DEMO_DATA)
    assert data[0]["name"] == MOCK_DEMO_DATA[0]["name"]
    assert data[0]["emergency_contacts"][0]["name"] == MOCK_DEMO_DATA[0]["emergency_contacts"][0]["name"]
    mock_get_db.assert_awaited_once() # Ensure get_db was called
    mock_db_service_with_data.demodata.find.assert_called_once_with({})


@patch("backend.main.db_service.get_db")
def test_get_demo_data_db_exception(mock_get_db, test_client):
    """Test /api/demodata when the database raises an exception."""
    mock_get_db.side_effect = Exception("Database connection error")

    response = test_client.get("/api/demodata")

    assert response.status_code == 500
    json_response = response.json()
    assert "Failed to fetch demo data" in json_response["detail"]
    # To be more precise, we can check for the original exception message if it's propagated
    # For now, the generic message is checked.
    mock_get_db.assert_awaited_once()


@patch("backend.main.db_service.get_db")
def test_get_records_success(mock_get_db, test_client, mock_db_service_with_data):
    """Test the /api/records endpoint successfully."""
    mock_get_db.return_value = mock_db_service_with_data

    response = test_client.get("/api/records")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(MOCK_RECORDS_DATA)
    assert data[0]["name"] == MOCK_RECORDS_DATA[0]["name"]
    assert data[1]["quantity"] == MOCK_RECORDS_DATA[1]["quantity"]
    mock_get_db.assert_awaited_once()
    mock_db_service_with_data.records.find.assert_called_once_with({})


@patch("backend.main.db_service.get_db")
def test_get_records_db_exception(mock_get_db, test_client):
    """Test /api/records when the database raises an exception."""
    mock_get_db.side_effect = Exception("DB query failed")

    response = test_client.get("/api/records")

    assert response.status_code == 500
    json_response = response.json()
    assert "Failed to fetch records" in json_response["detail"]
    mock_get_db.assert_awaited_once()

# Need to import MagicMock for the mock_db_service_with_data fixture
from unittest.mock import MagicMock
