import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize the encryption service.
        
        Args:
            encryption_key: Base64-encoded encryption key. If None, will try to get from environment.
        """
        self.cipher = None
        self._initialize_cipher(encryption_key)
    
    def _initialize_cipher(self, encryption_key: Optional[str] = None):
        """Initialize the Fernet cipher with the provided or environment key."""
        try:
            # Get key from parameter or environment
            key_str = encryption_key or os.getenv('ENCRYPTION_KEY')
            
            if not key_str:
                logger.warning("No encryption key provided. Encryption service will be disabled.")
                return
            
            # Ensure key is properly formatted (32 bytes, base64 encoded)
            if len(key_str) < 32:
                # Pad with zeros if too short
                key_str = key_str.ljust(32, '0')
            elif len(key_str) > 32:
                # Truncate if too long
                key_str = key_str[:32]
            
            # Convert to base64
            key_bytes = key_str.encode('utf-8')
            key_b64 = base64.urlsafe_b64encode(key_bytes)
            
            # Create Fernet cipher
            self.cipher = Fernet(key_b64)
            logger.info("Encryption service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {e}")
            self.cipher = None
    
    def encrypt_data(self, data: str) -> Optional[str]:
        """
        Encrypt sensitive data.
        
        Args:
            data: String data to encrypt
            
        Returns:
            Base64-encoded encrypted data, or None if encryption failed
        """
        if not self.cipher or not data:
            return data
        
        try:
            encrypted_bytes = self.cipher.encrypt(data.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to encrypt data: {e}")
            return None
    
    def decrypt_data(self, encrypted_data: str) -> Optional[str]:
        """
        Decrypt sensitive data.
        
        Args:
            encrypted_data: Base64-encoded encrypted data
            
        Returns:
            Decrypted data, or None if decryption failed
        """
        if not self.cipher or not encrypted_data:
            return encrypted_data
        
        try:
            # Check if data is already encrypted (base64 format)
            try:
                encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
                decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
                return decrypted_bytes.decode('utf-8')
            except Exception:
                # If decryption fails, assume data is not encrypted
                return encrypted_data
                
        except Exception as e:
            logger.error(f"Failed to decrypt data: {e}")
            return None
    
    def encrypt_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Encrypt a phone number for storage.
        
        Args:
            phone_number: Phone number to encrypt
            
        Returns:
            Encrypted phone number, or original if encryption failed
        """
        if not phone_number:
            return phone_number
        
        encrypted = self.encrypt_data(phone_number)
        return encrypted if encrypted else phone_number
    
    def decrypt_phone_number(self, encrypted_phone: str) -> Optional[str]:
        """
        Decrypt a phone number for use.
        
        Args:
            encrypted_phone: Encrypted phone number
            
        Returns:
            Decrypted phone number, or original if decryption failed
        """
        if not encrypted_phone:
            return encrypted_phone
        
        decrypted = self.decrypt_data(encrypted_phone)
        return decrypted if decrypted else encrypted_phone
    
    def encrypt_personal_info(self, info: str) -> Optional[str]:
        """
        Encrypt personal information.
        
        Args:
            info: Personal information to encrypt
            
        Returns:
            Encrypted information, or original if encryption failed
        """
        if not info:
            return info
        
        encrypted = self.encrypt_data(info)
        return encrypted if encrypted else info
    
    def decrypt_personal_info(self, encrypted_info: str) -> Optional[str]:
        """
        Decrypt personal information.
        
        Args:
            encrypted_info: Encrypted personal information
            
        Returns:
            Decrypted information, or original if decryption failed
        """
        if not encrypted_info:
            return encrypted_info
        
        decrypted = self.decrypt_data(encrypted_info)
        return decrypted if decrypted else encrypted_info
    
    def is_encrypted(self, data: str) -> bool:
        """
        Check if data appears to be encrypted.
        
        Args:
            data: Data to check
            
        Returns:
            True if data appears to be encrypted, False otherwise
        """
        if not data:
            return False
        
        try:
            # Try to decode as base64
            base64.urlsafe_b64decode(data.encode('utf-8'))
            return True
        except Exception:
            return False

# Global encryption service instance
encryption_service = EncryptionService()

def get_encryption_service() -> EncryptionService:
    """Get the global encryption service instance."""
    return encryption_service 