from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str

    # Encryption
    ENCRYPTION_KEY: str

    # OpenAI
    OPENAI_API_KEY: str

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Cloudflare R2
    CLOUDFLARE_R2_ACCOUNT_ID: str
    CLOUDFLARE_R2_ACCESS_KEY_ID: str
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: str
    CLOUDFLARE_R2_BUCKET_NAME: str = "applypilot-docs"

    # Steel.dev
    STEEL_API_KEY: str = ""

    # Sentry
    SENTRY_DSN: str = ""

    # App
    DEBUG: bool = False
    DASHBOARD_URL: str = "https://app.applypilot.co"
    FRONTEND_URL: str = "https://app.applypilot.co"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://app.applypilot.co",
    ]

    # Cloudflare R2 public domain (set to your R2 custom domain or public bucket URL)
    # e.g. https://pub-xxxx.r2.dev  or  https://cdn.applypilot.co
    # Leave empty to use signed URLs instead of public links.
    R2_PUBLIC_URL: str = ""

    # Email (Resend)
    RESEND_API_KEY: str = ""
    GMAIL_USER: str = "nasux1222@gmail.com"  # used as reply-to address

    # Rate limits
    RATE_LIMIT_AGENCY: str = "1000/hour"
    RATE_LIMIT_USER: str = "200/hour"

    # Session
    SESSION_EXPIRE_HOURS: int = 8

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
