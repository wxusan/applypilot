"""
Credential Vault — AES-256 encryption for storing email credentials.
Uses CREDENTIAL_ENCRYPTION_KEY env var (32-byte hex string).
Falls back to a derived key from SECRET_KEY if not set.
"""

import os
import base64
import hashlib
from cryptography.fernet import Fernet
from core.config import settings


def _get_fernet() -> Fernet:
    """Get or derive a Fernet key from environment."""
    raw_key = getattr(settings, 'CREDENTIAL_ENCRYPTION_KEY', None) or os.getenv('CREDENTIAL_ENCRYPTION_KEY')
    if raw_key:
        # Pad/truncate to 32 bytes, then base64url encode for Fernet
        key_bytes = raw_key.encode()[:32].ljust(32, b'0')
    else:
        # Derive from SECRET_KEY
        secret = getattr(settings, 'SECRET_KEY', 'applypilot-default-secret')
        key_bytes = hashlib.sha256(secret.encode()).digest()

    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt(plaintext: str) -> str:
    """Encrypt a plaintext string. Returns base64-encoded ciphertext."""
    if not plaintext:
        return ''
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a ciphertext string. Returns plaintext."""
    if not ciphertext:
        return ''
    try:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode()).decode()
    except Exception:
        return ''
