"""
Shared error response helpers.
All API errors use the format: {"error": str, "detail": str | list | None}
This file is the single source of truth for error response shape.
"""

from fastapi import HTTPException
from fastapi.responses import JSONResponse


def error_response(message: str, detail=None, status_code: int = 400) -> JSONResponse:
    """Return a standardised JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "detail": detail},
    )


def not_found(entity: str = "Resource") -> HTTPException:
    return HTTPException(status_code=404, detail=f"{entity} not found")


def forbidden(msg: str = "Not authorized") -> HTTPException:
    return HTTPException(status_code=403, detail=msg)


def bad_request(msg: str) -> HTTPException:
    return HTTPException(status_code=400, detail=msg)


def server_error(msg: str = "Internal server error") -> HTTPException:
    return HTTPException(status_code=500, detail=msg)
