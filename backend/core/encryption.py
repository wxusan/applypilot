"""
AES-256 Fernet encryption for sensitive credentials.

KEY MANAGEMENT:
- The key is loaded from the ENCRYPTION_KEY environment variable only.
- It is NEVER stored in the database, logged, or transmitted over the network.
- Credentials are decrypted in memory only during active agent jobs.
"""

from cryptography.fernet import Fernet, InvalidToken
from core.config import settings


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY.encode()
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    """Encrypt a plaintext string. Returns URL-safe base64 ciphertext."""
    if not plaintext:
        return ""
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a ciphertext string. Returns the original plaintext."""
    if not ciphertext:
        return ""
    f = _get_fernet()
    try:
        return f.decrypt(ciphertext.encode()).decode()
    except (InvalidToken, Exception) as e:
        raise ValueError(f"Failed to decrypt credential: {e}")


def rotate_key(ciphertext: str, new_key: str) -> str:
    """Re-encrypt a ciphertext under a new key (for key rotation)."""
    plaintext = decrypt(ciphertext)
    new_fernet = Fernet(new_key.encode())
    return new_fernet.encrypt(plaintext.encode()).decode()
