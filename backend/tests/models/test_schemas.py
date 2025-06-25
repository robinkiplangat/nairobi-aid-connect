import pytest
from pydantic import ValidationError
from datetime import datetime
import uuid

from backend.models.schemas import NewHelpRequest, Coordinates, DirectHelpRequestPayload

def test_new_help_request_creation_valid():
    """Tests successful creation of a NewHelpRequest with valid data."""
    coords = Coordinates(lat=-1.2921, lng=36.8219)
    request_data = {
        "source": "direct_app",
        "request_type": "Medical",
        "location_text": "Near Hilton Hotel",
        "coordinates": coords,
        "original_content": "Need medical assistance urgently near Hilton."
    }
    try:
        req = NewHelpRequest(**request_data)
        # Check auto-generated fields
        assert isinstance(req.request_id, str)
        assert uuid.UUID(req.request_id) # Ensure it's a valid UUID string
        assert isinstance(req.timestamp, datetime)
        assert req.status == "pending" # Default status

        # Check provided fields
        assert req.source == request_data["source"]
        assert req.request_type == request_data["request_type"]
        assert req.location_text == request_data["location_text"]
        assert req.coordinates == request_data["coordinates"]
        assert req.original_content == request_data["original_content"]

    except ValidationError as e:
        pytest.fail(f"NewHelpRequest creation failed with valid data: {e}")

def test_new_help_request_invalid_source():
    """Tests that NewHelpRequest raises ValidationError for an invalid 'source'."""
    coords = Coordinates(lat=-1.0, lng=36.0)
    with pytest.raises(ValidationError) as excinfo:
        NewHelpRequest(
            source="invalid_source", # Not "direct_app" or "twitter"
            request_type="Legal",
            location_text="City Hall",
            coordinates=coords,
            original_content="Legal help needed."
        )
    assert "Input should be 'direct_app' or 'twitter'" in str(excinfo.value) # Check specific error message part

def test_new_help_request_invalid_request_type():
    """Tests that NewHelpRequest raises ValidationError for an invalid 'request_type'."""
    coords = Coordinates(lat=-1.1, lng=36.1)
    with pytest.raises(ValidationError) as excinfo:
        NewHelpRequest(
            source="twitter",
            request_type="Food", # Not "Medical", "Legal", or "Shelter"
            location_text="KICC",
            coordinates=coords,
            original_content="Requesting food aid."
        )
    assert "Input should be 'Medical', 'Legal' or 'Shelter'" in str(excinfo.value)

def test_new_help_request_missing_fields():
    """Tests that NewHelpRequest raises ValidationError if required fields are missing."""
    with pytest.raises(ValidationError) as excinfo:
        NewHelpRequest(
            source="direct_app",
            # request_type is missing
            location_text="Test location",
            # coordinates are missing
            original_content="Test content"
        )
    # Check that multiple errors are reported for missing fields
    errors = excinfo.value.errors()
    missing_fields = {err['loc'][0] for err in errors if err['type'] == 'missing'}
    assert "request_type" in missing_fields
    assert "coordinates" in missing_fields


def test_direct_help_request_payload_valid():
    """Tests successful creation of DirectHelpRequestPayload."""
    payload_data = {
        "request_type": "Shelter",
        "location_text": "Uhuru Park",
        "original_content": "Need shelter for the night."
    }
    try:
        payload = DirectHelpRequestPayload(**payload_data)
        assert payload.request_type == payload_data["request_type"]
        assert payload.location_text == payload_data["location_text"]
        assert payload.original_content == payload_data["original_content"]
    except ValidationError as e:
        pytest.fail(f"DirectHelpRequestPayload creation failed with valid data: {e}")

def test_direct_help_request_payload_invalid_type():
    """Tests DirectHelpRequestPayload with invalid request_type."""
    payload_data = {
        "request_type": "InvalidType",
        "location_text": "Uhuru Park",
        "original_content": "Need shelter for the night."
    }
    with pytest.raises(ValidationError):
        DirectHelpRequestPayload(**payload_data)
addAttribute("backend/tests/models/__init__.py")
