import secrets
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import logging
from services.config import settings

logger = logging.getLogger(__name__)

class SecureTokenManager:
    """Secure token management for volunteer authentication."""
    
    def __init__(self):
        self.active_tokens: Dict[str, Dict] = {}  # token_hash -> token_data
        self.volunteer_tokens: Dict[str, str] = {}  # volunteer_id -> token_hash
    
    def generate_volunteer_token(self, volunteer_id: str) -> str:
        """
        Generate a cryptographically secure token for a volunteer.
        
        Args:
            volunteer_id: The volunteer's ID
            
        Returns:
            The generated token string
        """
        try:
            # Generate cryptographically secure token
            token = secrets.token_urlsafe(32)
            
            # Calculate expiration time
            expiry = datetime.utcnow() + timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES)
            
            # Hash token before storing (never store plain tokens)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Store token data
            token_data = {
                'volunteer_id': volunteer_id,
                'expires_at': expiry,
                'created_at': datetime.utcnow(),
                'last_used': datetime.utcnow()
            }
            
            # Remove any existing token for this volunteer
            if volunteer_id in self.volunteer_tokens:
                old_token_hash = self.volunteer_tokens[volunteer_id]
                if old_token_hash in self.active_tokens:
                    del self.active_tokens[old_token_hash]
            
            # Store new token
            self.active_tokens[token_hash] = token_data
            self.volunteer_tokens[volunteer_id] = token_hash
            
            logger.info(f"Generated new token for volunteer {volunteer_id}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate token for volunteer {volunteer_id}: {e}")
            raise
    
    def validate_token(self, token: str) -> Optional[str]:
        """
        Validate a token and return the volunteer ID if valid.
        
        Args:
            token: The token to validate
            
        Returns:
            Volunteer ID if token is valid, None otherwise
        """
        try:
            # Hash the provided token
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Check if token exists and is not expired
            if token_hash in self.active_tokens:
                token_data = self.active_tokens[token_hash]
                
                # Check expiration
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"Token expired for volunteer {token_data['volunteer_id']}")
                    self._remove_token(token_hash)
                    return None
                
                # Update last used timestamp
                token_data['last_used'] = datetime.utcnow()
                
                logger.debug(f"Token validated for volunteer {token_data['volunteer_id']}")
                return token_data['volunteer_id']
            
            return None
            
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return None
    
    def refresh_token(self, token: str) -> Optional[str]:
        """
        Refresh a token by extending its expiration time.
        
        Args:
            token: The token to refresh
            
        Returns:
            New token if refresh successful, None otherwise
        """
        try:
            volunteer_id = self.validate_token(token)
            if volunteer_id:
                # Generate new token
                new_token = self.generate_volunteer_token(volunteer_id)
                logger.info(f"Token refreshed for volunteer {volunteer_id}")
                return new_token
            
            return None
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    def revoke_token(self, token: str) -> bool:
        """
        Revoke a token.
        
        Args:
            token: The token to revoke
            
        Returns:
            True if token was revoked, False otherwise
        """
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            return self._remove_token(token_hash)
            
        except Exception as e:
            logger.error(f"Error revoking token: {e}")
            return False
    
    def revoke_volunteer_tokens(self, volunteer_id: str) -> bool:
        """
        Revoke all tokens for a specific volunteer.
        
        Args:
            volunteer_id: The volunteer's ID
            
        Returns:
            True if tokens were revoked, False otherwise
        """
        try:
            if volunteer_id in self.volunteer_tokens:
                token_hash = self.volunteer_tokens[volunteer_id]
                self._remove_token(token_hash)
                logger.info(f"All tokens revoked for volunteer {volunteer_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error revoking tokens for volunteer {volunteer_id}: {e}")
            return False
    
    def _remove_token(self, token_hash: str) -> bool:
        """
        Remove a token from storage.
        
        Args:
            token_hash: The hash of the token to remove
            
        Returns:
            True if token was removed, False otherwise
        """
        try:
            if token_hash in self.active_tokens:
                token_data = self.active_tokens[token_hash]
                volunteer_id = token_data['volunteer_id']
                
                # Remove from both storage locations
                del self.active_tokens[token_hash]
                if volunteer_id in self.volunteer_tokens:
                    del self.volunteer_tokens[volunteer_id]
                
                logger.debug(f"Token removed for volunteer {volunteer_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error removing token: {e}")
            return False
    
    def cleanup_expired_tokens(self) -> int:
        """
        Clean up expired tokens from storage.
        
        Returns:
            Number of tokens removed
        """
        try:
            current_time = datetime.utcnow()
            expired_tokens = []
            
            for token_hash, token_data in self.active_tokens.items():
                if current_time > token_data['expires_at']:
                    expired_tokens.append(token_hash)
            
            for token_hash in expired_tokens:
                self._remove_token(token_hash)
            
            if expired_tokens:
                logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")
            
            return len(expired_tokens)
            
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
            return 0
    
    def get_token_info(self, token: str) -> Optional[Dict]:
        """
        Get information about a token without validating it.
        
        Args:
            token: The token to get info for
            
        Returns:
            Token information dict, or None if token not found
        """
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            if token_hash in self.active_tokens:
                token_data = self.active_tokens[token_hash].copy()
                # Don't return sensitive information
                token_data.pop('volunteer_id', None)
                return token_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting token info: {e}")
            return None
    
    def get_active_token_count(self) -> int:
        """
        Get the number of active tokens.
        
        Returns:
            Number of active tokens
        """
        return len(self.active_tokens)

# Global token manager instance
token_manager = SecureTokenManager()

def get_token_manager() -> SecureTokenManager:
    """Get the global token manager instance."""
    return token_manager 