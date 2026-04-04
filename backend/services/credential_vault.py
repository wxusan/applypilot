"""
Credential Vault — AES-256 encryption for storing email credentials.
Uses ENCRYPTION_KEY env var (must be set — no fallback allowed).

KEY FORMAT:
  Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  Store the output as ENCRYPTION_KEY in your .env file.

SECURITY NOTE:
  There is intentionally NO fallback key. If ENCRYPTION_KEY is not configured,
  the server will refuse to start. This prevents credentials from being silently
  encrypted with a predictable key that could be guessed or brute-forced.
"""

import os
import base64
from cryptography.fernet import Fernet
from core.config import settings


def _get_fernet() -> Fernet:
    """Load the Fernet encryption key from settings. Fails loudly if not set."""
    raw_key = getattr(settings, 'ENCRYPTION_KEY', None) or os.getenv('ENCRYPTION_KEY')

    if not raw_key:
        raise RuntimeError(
            "ENCRYPTION_KEY environment variable is not set. "
            "The server cannot start without a valid encryption key for credential storage. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )

    # Support both raw Fernet keys (44 chars, already base64url) and
    # plain strings that need to be padded to 32 bytes.
    key_bytes = raw_key.strip().encode()
    if len(key_bytes) == 44:
        # Looks like a valid Fernet key already (base64url-encoded 32 bytes)
        fernet_key = key_bytes
    else:
        # Pad/truncate to 32 bytes and base64url-encode
        padded = key_bytes[:32].ljust(32, b'0')
        fernet_key = base64.urlsafe_b64encode(padded)

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
