import hashlib
import secrets
import re
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from services.config import settings

logger = logging.getLogger(__name__)

class SecurityService:
    """Security utilities and configurations for the application."""
    
    def __init__(self):
        self.security_headers = self._get_security_headers()
        self.allowed_origins = self._get_allowed_origins()
    
    def _get_security_headers(self) -> Dict[str, str]:
        """Get security headers configuration."""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' if settings.REQUIRE_HTTPS else '',
        }
    
    def _get_allowed_origins(self) -> list:
        """Get allowed origins for CORS."""
        if settings.APP_ENV == "production":
            return [
                "https://nairobi-aid-connect.vercel.app",
                "https://nairobi-aid-connect.vercel.app/",
            ]
        else:
            return [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:8080",
            ]
    
    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate phone number format.
        
        Args:
            phone: Phone number to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not phone:
            return False
        
        # Remove all non-digit characters except + for validation
        digits_only = re.sub(r'[^\d+]', '', phone)
        
        # Check length (minimum 10 digits)
        if len(digits_only) < 10:
            return False
        
        # Check format (allows +, digits, spaces, hyphens, parentheses)
        if not re.match(r'^\+?[\d\s\-\(\)]+$', phone):
            return False
        
        return True
    
    def sanitize_input(self, text: str, max_length: int = 1000) -> str:
        """
        Sanitize user input.
        
        Args:
            text: Text to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized text
        """
        if not text:
            return ""
        
        # Remove HTML/script tags
        text = re.sub(r'<[^>]*>', '', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Trim and limit length
        text = text.strip()
        if len(text) > max_length:
            text = text[:max_length]
        
        return text
    
    def obfuscate_location(self, lat: float, lng: float) -> tuple:
        """
        Obfuscate GPS coordinates for privacy.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Tuple of (obfuscated_lat, obfuscated_lng)
        """
        if not settings.ENABLE_LOCATION_ANONYMIZATION:
            return lat, lng
        
        # Add small random offset
        import random
        offset_factor = settings.LOCATION_OBFUSCATION_FACTOR
        
        lat_offset = (random.random() - 0.5) * offset_factor
        lng_offset = (random.random() - 0.5) * offset_factor
        
        obfuscated_lat = lat + lat_offset
        obfuscated_lng = lng + lng_offset
        
        # Ensure coordinates are within valid bounds
        obfuscated_lat = max(-90, min(90, obfuscated_lat))
        obfuscated_lng = max(-180, min(180, obfuscated_lng))
        
        return obfuscated_lat, obfuscated_lng
    
    def generate_secure_code(self, length: int = 6) -> str:
        """
        Generate a secure verification code.
        
        Args:
            length: Length of the code
            
        Returns:
            Secure alphanumeric code
        """
        # Use secrets for cryptographically secure random generation
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def hash_sensitive_data(self, data: str) -> str:
        """
        Hash sensitive data for storage.
        
        Args:
            data: Data to hash
            
        Returns:
            SHA-256 hash of the data
        """
        return hashlib.sha256(data.encode()).hexdigest()
    
    def validate_coordinates(self, lat: float, lng: float) -> bool:
        """
        Validate GPS coordinates.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            True if coordinates are valid, False otherwise
        """
        return -90 <= lat <= 90 and -180 <= lng <= 180
    
    def is_suspicious_request(self, request_data: Dict[str, Any]) -> bool:
        """
        Check if a request appears suspicious.
        
        Args:
            request_data: Request data to analyze
            
        Returns:
            True if suspicious, False otherwise
        """
        # Check for excessive content length
        if 'original_content' in request_data:
            content = request_data['original_content']
            if len(content) > 1000:
                logger.warning(f"Suspicious request: content too long ({len(content)} chars)")
                return True
        
        # Check for suspicious patterns in content
        if 'original_content' in request_data:
            content = request_data['original_content'].lower()
            suspicious_patterns = [
                'script', 'javascript:', 'onload=', 'onerror=',
                'eval(', 'document.cookie', 'window.location'
            ]
            
            for pattern in suspicious_patterns:
                if pattern in content:
                    logger.warning(f"Suspicious request: contains {pattern}")
                    return True
        
        # Check for rapid requests (would be caught by rate limiting)
        # This is just a basic check, rate limiting handles this better
        
        return False
    
    def log_security_event(self, event_type: str, details: Dict[str, Any], 
                          user_ip: Optional[str] = None, severity: str = "INFO"):
        """
        Log security events.
        
        Args:
            event_type: Type of security event
            details: Event details
            user_ip: User's IP address
            severity: Log severity level
        """
        if not settings.ENABLE_SECURITY_LOGGING:
            return
        
        log_message = f"Security Event: {event_type}"
        if user_ip:
            log_message += f" from {user_ip}"
        log_message += f" - {details}"
        
        if severity == "WARNING":
            logger.warning(log_message)
        elif severity == "ERROR":
            logger.error(log_message)
        else:
            logger.info(log_message)
    
    def get_rate_limit_config(self, endpoint: str) -> Dict[str, Any]:
        """
        Get rate limit configuration for an endpoint.
        
        Args:
            endpoint: API endpoint
            
        Returns:
            Rate limit configuration
        """
        base_config = {
            "requests_per_minute": settings.MAX_REQUESTS_PER_MINUTE,
            "burst_size": 5,
            "window_size": 60
        }
        
        # Endpoint-specific configurations
        endpoint_configs = {
            "/api/v1/volunteer/verify": {
                "requests_per_minute": 3,  # Stricter for verification
                "burst_size": 2,
                "window_size": 60
            },
            "/api/v1/request/direct": {
                "requests_per_minute": settings.MAX_REQUESTS_PER_MINUTE,
                "burst_size": 3,
                "window_size": 60
            }
        }
        
        return endpoint_configs.get(endpoint, base_config)
    
    def validate_request_origin(self, origin: str) -> bool:
        """
        Validate request origin for CORS.
        
        Args:
            origin: Request origin
            
        Returns:
            True if origin is allowed, False otherwise
        """
        if not origin:
            return False
        
        # Remove trailing slash for comparison
        origin = origin.rstrip('/')
        
        return origin in [o.rstrip('/') for o in self.allowed_origins]
    
    def get_content_security_policy(self) -> str:
        """
        Get Content Security Policy header value.
        
        Returns:
            CSP header value
        """
        if settings.APP_ENV == "production":
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://nairobi-aid-connect.onrender.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        else:
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' http://localhost:* https://nairobi-aid-connect.onrender.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )

# Global security service instance
security_service = SecurityService()

def get_security_service() -> SecurityService:
    """Get the global security service instance."""
    return security_service

# --- Password Hashing ---
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

# --- JWT Token Handling ---
from jose import JWTError, jwt
from models import schemas as app_schemas # To avoid circular import with main's schemas

# These should be in your .env file and loaded via settings
# For demonstration, using settings directly. Ensure they are set in your config.
JWT_SECRET_KEY = settings.JWT_SECRET_KEY # openssl rand -hex 32
JWT_ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a new JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str, credentials_exception: Exception) -> Optional[app_schemas.TokenData]:
    """
    Verifies an access token.
    Returns the token payload (TokenData) if valid, otherwise raises credentials_exception.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: Optional[str] = payload.get("sub") # 'sub' is standard for subject (username/email)
        user_id: Optional[str] = payload.get("user_id")
        organization_id: Optional[str] = payload.get("organization_id")
        role: Optional[str] = payload.get("role")

        if username is None and user_id is None : # At least one identifier must be present
            logger.warning(f"Token verification failed: username/user_id missing. Payload: {payload}")
            raise credentials_exception

        token_data = app_schemas.TokenData(
            username=username,
            user_id=user_id,
            organization_id=organization_id,
            role=role
        )
        return token_data
    except JWTError as e:
        logger.error(f"JWTError during token verification: {e}", exc_info=True)
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}", exc_info=True)
        raise credentials_exception