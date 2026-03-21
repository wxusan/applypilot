"""
Cloudflare R2 storage service (S3-compatible).
"""

import logging
import boto3
from botocore.client import Config
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)

_r2_client = None


def _get_r2_client():
    global _r2_client
    if _r2_client is None:
        _r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _r2_client


async def upload_file_to_r2(path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to R2 and return the access URL.

    If R2_PUBLIC_URL is configured (e.g. your custom domain or r2.dev public URL),
    returns a stable public URL.  Otherwise generates a 7-day presigned URL so files
    are always accessible regardless of bucket visibility settings.
    """
    client = _get_r2_client()

    client.put_object(
        Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME,
        Key=path,
        Body=data,
        ContentType=content_type,
    )

    if settings.R2_PUBLIC_URL:
        # Custom domain / public bucket — stable URL, no expiry
        base = settings.R2_PUBLIC_URL.rstrip("/")
        return f"{base}/{path}"

    # No public domain configured — return a 7-day presigned URL
    return generate_presigned_url(path, expiry_seconds=7 * 24 * 3600)


async def upload_bytes_to_r2(path: str, data: bytes, content_type: str) -> str:
    return await upload_file_to_r2(path, data, content_type)


async def download_file_from_r2(path: str) -> Optional[bytes]:
    """Download a file from R2 by path."""
    client = _get_r2_client()

    try:
        response = client.get_object(
            Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME,
            Key=path,
        )
        return response["Body"].read()
    except Exception as e:
        logger.error(f"Failed to download {path} from R2: {e}")
        return None


async def delete_file_from_r2(path: str) -> None:
    """Delete a file from R2."""
    client = _get_r2_client()

    try:
        client.delete_object(
            Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME,
            Key=path,
        )
    except Exception as e:
        logger.error(f"Failed to delete {path} from R2: {e}")


def generate_presigned_url(path: str, expiry_seconds: int = 3600) -> str:
    """Generate a presigned URL for temporary access."""
    client = _get_r2_client()

    return client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.CLOUDFLARE_R2_BUCKET_NAME,
            "Key": path,
        },
        ExpiresIn=expiry_seconds,
    )
