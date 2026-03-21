"""
Unit tests: core/encryption.py
Tests encrypt/decrypt round-trip, edge cases, and key rotation.
"""

import pytest
from unittest.mock import patch
from cryptography.fernet import Fernet


# ── Generate a valid Fernet key once for all tests in this module ─────────────
TEST_KEY = Fernet.generate_key().decode()


@pytest.fixture(autouse=True)
def patch_encryption_key():
    """Ensure all tests use a known valid key."""
    with patch("core.config.settings") as mock_settings:
        mock_settings.ENCRYPTION_KEY = TEST_KEY
        yield mock_settings


# ── Import after env is set ───────────────────────────────────────────────────
from core.encryption import encrypt, decrypt, rotate_key  # noqa: E402


class TestEncrypt:
    def test_returns_string(self):
        result = encrypt("hello")
        assert isinstance(result, str)

    def test_ciphertext_differs_from_plaintext(self):
        result = encrypt("my-password")
        assert result != "my-password"

    def test_empty_string_returns_empty(self):
        assert encrypt("") == ""

    def test_unicode_encoded(self):
        result = encrypt("пароль123")
        assert result != ""
        assert isinstance(result, str)

    def test_long_string(self):
        long_text = "x" * 10_000
        result = encrypt(long_text)
        assert len(result) > 0


class TestDecrypt:
    def test_round_trip(self):
        plaintext = "super-secret-portal-password"
        assert decrypt(encrypt(plaintext)) == plaintext

    def test_empty_ciphertext_returns_empty(self):
        assert decrypt("") == ""

    def test_unicode_round_trip(self):
        text = "пароль123 🔐"
        assert decrypt(encrypt(text)) == text

    def test_invalid_token_raises_value_error(self):
        with pytest.raises(ValueError, match="Failed to decrypt"):
            decrypt("not-valid-ciphertext")

    def test_tampered_ciphertext_raises(self):
        ciphertext = encrypt("original")
        tampered = ciphertext[:-4] + "XXXX"
        with pytest.raises(ValueError):
            decrypt(tampered)


class TestRotateKey:
    def test_rotated_decrypts_with_new_key(self):
        original_key = TEST_KEY
        new_key = Fernet.generate_key().decode()
        ciphertext = encrypt("rotate-me")

        with patch("core.config.settings") as s:
            s.ENCRYPTION_KEY = original_key
            rotated = rotate_key(ciphertext, new_key)

        # Rotated value should decrypt with the new key
        new_fernet = Fernet(new_key.encode())
        assert new_fernet.decrypt(rotated.encode()).decode() == "rotate-me"

    def test_old_key_cant_decrypt_rotated(self):
        new_key = Fernet.generate_key().decode()
        ciphertext = encrypt("rotate-me")
        rotated = rotate_key(ciphertext, new_key)

        # Trying to decrypt rotated value with the original key should fail
        with pytest.raises(ValueError):
            decrypt(rotated)
