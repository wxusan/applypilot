"""
Shared slowapi rate-limiter instance.

Import `limiter` from here in any router that needs `@limiter.limit(...)`.
The app registers `app.state.limiter = limiter` in main.py so slowapi can
intercept exceeded limits and return 429 responses automatically.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
