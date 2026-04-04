"""
Retry utility for OpenAI API calls.

Wraps async functions with exponential backoff and jitter.
Handles rate-limit (429), server errors (500/502/503), and transient timeouts.

Usage:
    from core.retry import with_retry

    response = await with_retry(
        client.chat.completions.create,
        model=settings.AI_MODEL_FAST,
        messages=[...],
    )

    # Or as a decorator:
    @retry_openai
    async def call_openai():
        return await client.chat.completions.create(...)
"""

import asyncio
import logging
import random
from functools import wraps
from typing import Callable, TypeVar, Any

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Default retry config
_MAX_ATTEMPTS = 3
_BASE_DELAY = 1.0    # seconds
_MAX_DELAY = 30.0    # seconds cap
_JITTER = 0.3        # ±30% random jitter

# OpenAI error types that are worth retrying
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def _should_retry(exc: Exception) -> bool:
    """Return True if this exception is transient and worth retrying."""
    exc_str = str(exc).lower()

    # openai library raises these as typed exceptions
    try:
        from openai import RateLimitError, APIStatusError, APIConnectionError, APITimeoutError
        if isinstance(exc, (RateLimitError, APIConnectionError, APITimeoutError)):
            return True
        if isinstance(exc, APIStatusError) and exc.status_code in _RETRYABLE_STATUS_CODES:
            return True
    except ImportError:
        pass

    # Fallback: check string representation
    retryable_keywords = ["rate limit", "rate_limit", "429", "503", "502", "timeout", "connection"]
    return any(k in exc_str for k in retryable_keywords)


async def with_retry(
    fn: Callable,
    *args: Any,
    max_attempts: int = _MAX_ATTEMPTS,
    base_delay: float = _BASE_DELAY,
    **kwargs: Any,
) -> Any:
    """
    Call `fn(*args, **kwargs)` with automatic retry on transient errors.

    Args:
        fn: Async callable to invoke.
        *args: Positional arguments for fn.
        max_attempts: Total number of attempts (default 3).
        base_delay: Initial delay in seconds; doubles each retry.
        **kwargs: Keyword arguments for fn.

    Returns:
        The return value of fn on success.

    Raises:
        The last exception if all attempts are exhausted.
    """
    last_exc: Exception = RuntimeError("No attempts made")

    for attempt in range(1, max_attempts + 1):
        try:
            return await fn(*args, **kwargs)

        except Exception as exc:
            last_exc = exc

            if attempt == max_attempts:
                logger.error(
                    f"[retry] All {max_attempts} attempts failed for {fn.__name__ if hasattr(fn, '__name__') else fn}: {exc}"
                )
                raise

            if not _should_retry(exc):
                logger.warning(f"[retry] Non-retryable error in {fn.__name__ if hasattr(fn, '__name__') else fn}: {exc}")
                raise

            delay = min(base_delay * (2 ** (attempt - 1)), _MAX_DELAY)
            jitter = delay * _JITTER * (random.random() * 2 - 1)
            wait = max(0.1, delay + jitter)

            logger.warning(
                f"[retry] Attempt {attempt}/{max_attempts} failed: {exc}. "
                f"Retrying in {wait:.1f}s..."
            )
            await asyncio.sleep(wait)

    raise last_exc


def retry_openai(fn: Callable) -> Callable:
    """
    Decorator version of with_retry for OpenAI calls.

    Usage:
        @retry_openai
        async def generate_text():
            return await client.chat.completions.create(...)
    """
    @wraps(fn)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        return await with_retry(fn, *args, **kwargs)
    return wrapper
