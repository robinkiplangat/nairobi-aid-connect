from pydantic_settings import BaseSettings
from functools import lru_cache # For caching settings
from typing import Optional, List

class Settings(BaseSettings):
    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017/"
    MONGODB_DATABASE_NAME: str = "sos_nairobi_db"

    # Redis Configuration (for Message Bus and potentially Caching/Chat Sessions)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_USERNAME: Optional[str] = "default"
    REDIS_PASSWORD: Optional[str] = None

    # API Keys for External Services (placeholders)
    TWITTER_BEARER_TOKEN: Optional[str] = "YOUR_TWITTER_BEARER_TOKEN_HERE" # Replace with actual token via .env
    GOOGLE_API_KEY: Optional[str] = None # For NLP, Geocoding, etc.

    # Twitter Stream Configuration
    # Rules are complex for v2, often managed via API. Storing keywords here for simple rule generation.
    # Example rule: "#SOSNairobi OR #KenyaDemocracy OR #NairobiProtest OR \"need medic\""
    # tweepy.StreamRule allows more complex rule objects.
    TWITTER_MONITOR_KEYWORDS: List[str] = [
        "#SOSNairobi", "SOS Nairobi",
        "#KenyaDemocracy",
        "#NairobiProtest", "Nairobi Protest",
        "need medic Nairobi", "medic needed Nairobi",
        "#SiriNiNumbers"
    ]
    # Define a tag for the stream rules for easy management (add/delete)
    TWITTER_STREAM_RULE_TAG: str = "sos-nairobi-default-rules"

    # Enhanced Security & Privacy Settings
    LOCATION_OBFUSCATION_FACTOR: float = 0.002  # Increased for better privacy
    LOCATION_PRECISION_DIGITS: int = 3  # Limit GPS precision
    ENABLE_LOCATION_ANONYMIZATION: bool = True
    DATA_RETENTION_DAYS: int = 30  # Auto-delete old data
    SESSION_TIMEOUT_MINUTES: int = 30
    MAX_REQUESTS_PER_MINUTE: int = 10
    REQUIRE_HTTPS: bool = True
    ENABLE_RATE_LIMITING: bool = True
    
    # Encryption Settings
    ENCRYPTION_KEY: Optional[str] = None  # Set via environment variable
    
    # Monitoring & Logging
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    ENABLE_SECURITY_LOGGING: bool = True

    # Agent Specific Settings
    VOLUNTEER_MATCH_RADIUS_KM: float = 5.0
    CHAT_SESSION_TTL_HOURS: int = 24
    VOLUNTEER_SESSION_TIMEOUT_HOURS: int = 4 # For volunteer HTTP session tokens

    # CORS Configuration
    CORS_ALLOWED_ORIGINS: Optional[str] = None  # Comma-separated list of allowed origins
    
    # General App Settings
    APP_ENV: str = "development" # "development", "staging", "production"
    DEBUG_MODE: bool = True
    ENABLE_TWITTER_MONITORING: bool = False # Feature flag for Twitter monitoring

    # JWT Settings for Partner Organization Authentication
    JWT_SECRET_KEY: str = "your-secret-key-for-jwt-please-change-in-env" # IMPORTANT: Override in .env
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours, adjust as needed

    class Config:
        # Load .env file if it exists
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore" # Ignore extra fields from .env

# Production-specific settings
class ProductionSettings(Settings):
    APP_ENV: str = "production"
    DEBUG_MODE: bool = False
    ENABLE_TWITTER_MONITORING: bool = True
    ENABLE_RATE_LIMITING: bool = True
    REQUIRE_HTTPS: bool = True
    ENABLE_SECURITY_LOGGING: bool = True
    LOG_LEVEL: str = "WARNING"

# Use lru_cache to load settings only once
@lru_cache()
def get_settings() -> Settings:
    env = Settings().APP_ENV
    if env == "production":
        return ProductionSettings()
    return Settings()

# Make settings easily accessible
settings = get_settings()

# Example usage:
if __name__ == "__main__":
    print("Current Settings:")
    print(f"MongoDB URI: {settings.MONGODB_URI}")
    print(f"Redis Host: {settings.REDIS_HOST}")
    print(f"Debug Mode: {settings.DEBUG_MODE}")
    print(f"App Environment: {settings.APP_ENV}")
    print(f"Location Obfuscation: {settings.LOCATION_OBFUSCATION_FACTOR}")
    print(f"Rate Limiting: {settings.ENABLE_RATE_LIMITING}")
    # To test with a .env file, create a file named ".env" in the same directory as this script
    # (or the root of where the app is run from, typically `backend/`)
    # Example .env content:
    # MONGODB_URI="mongodb://user:pass@customhost:27017/custom_db"
    # DEBUG_MODE=False
    # APP_ENV=production
    # ENCRYPTION_KEY=your-secure-encryption-key
    # SENTRY_DSN=your-sentry-dsn
    # CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://your-branch-deployment.vercel.app"
