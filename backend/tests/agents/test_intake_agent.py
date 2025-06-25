import pytest
from backend.agents.intake_agent import IntakeAgent
from backend.models.schemas import Coordinates
from backend.services.config import settings

# Instantiate the agent or use it as a class with static/utility methods if applicable
# For _obfuscate_location, it's a method of an instance.
intake_agent_instance = IntakeAgent()

def test_obfuscate_location():
    """
    Tests the _obfuscate_location method of the IntakeAgent.
    Ensures that coordinates are changed and within a plausible (though not strictly bounded) offset.
    """
    original_coords = Coordinates(lat=-1.2921, lng=36.8219)

    # Ensure the obfuscation factor is something other than zero for the test to be meaningful
    # If it can be zero, this test would need adjustment or to skip.
    # Forcing a non-zero value for testing purposes if settings could make it zero.
    original_factor = settings.LOCATION_OBFUSCATION_FACTOR
    if settings.LOCATION_OBFUSCATION_FACTOR == 0:
        settings.LOCATION_OBFUSCATION_FACTOR = 0.001 # Temporary change for test

    obfuscated_coords = intake_agent_instance._obfuscate_location(original_coords)

    assert obfuscated_coords.lat != original_coords.lat, "Latitude should be obfuscated (changed)"
    assert obfuscated_coords.lng != original_coords.lng, "Longitude should be obfuscated (changed)"

    # Check if the change is within a reasonable range based on the factor
    # The random factor is (random.random() - 0.5) * offset * 2, so max change is +/- offset
    # This is a loose check because of randomness.
    max_expected_diff = settings.LOCATION_OBFUSCATION_FACTOR

    lat_diff = abs(obfuscated_coords.lat - original_coords.lat)
    lng_diff = abs(obfuscated_coords.lng - original_coords.lng)

    # It's possible, though highly improbable with float precision, that random offset is exactly 0
    # or that original_coords + offset = original_coords due to floating point arithmetic.
    # A more robust test might run this multiple times or check bounds.
    # For this basic test, we assume non-zero factor means non-zero change most of the time.

    assert lat_diff <= max_expected_diff, f"Latitude obfuscation difference {lat_diff} exceeds max expected {max_expected_diff}"
    assert lng_diff <= max_expected_diff, f"Longitude obfuscation difference {lng_diff} exceeds max expected {max_expected_diff}"

    # Check that it's not *too* different (e.g. more than double the max_expected_diff, which shouldn't happen)
    # This is essentially the same as above given the formula.
    assert lat_diff < max_expected_diff * 1.0001, "Latitude obfuscation is too large" # allow for floating point
    assert lng_diff < max_expected_diff * 1.0001, "Longitude obfuscation is too large"

    # Restore original factor if changed
    settings.LOCATION_OBFUSCATION_FACTOR = original_factor


def test_obfuscate_location_zero_factor():
    """
    Tests that if LOCATION_OBFUSCATION_FACTOR is 0, coordinates are not changed.
    """
    original_coords = Coordinates(lat=-1.0, lng=36.0)

    original_factor = settings.LOCATION_OBFUSCATION_FACTOR
    settings.LOCATION_OBFUSCATION_FACTOR = 0.0 # Set factor to 0 for this test case

    obfuscated_coords = intake_agent_instance._obfuscate_location(original_coords)

    assert obfuscated_coords.lat == original_coords.lat, "Latitude should not change if factor is 0"
    assert obfuscated_coords.lng == original_coords.lng, "Longitude should not change if factor is 0"

    # Restore original factor
    settings.LOCATION_OBFUSCATION_FACTOR = original_factor

# To run tests:
# From the project root:
# PYTHONPATH=. pytest backend/tests
# or from backend directory:
# pytest tests
# Ensure .env file for settings is correctly picked up or settings have defaults.
# (The test modifies settings directly, which is okay for simple cases but might need
#  fixtures or context managers for more complex setting overrides in larger test suites)
