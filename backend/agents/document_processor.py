"""
Document Processor Agent — OCR extraction using GPT-4o Vision.
Triggered on every new document upload.
"""

import logging
import base64
from datetime import datetime

from openai import AsyncOpenAI
from core.db import get_service_client
from core.config import settings
from core.audit import write_audit_log
from services.storage import download_file_from_r2
from services.telegram_bot import send_message_to_agency_staff

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def process_document(doc_id: str, agency_id: str, triggered_by: str) -> None:
    """Main entry point: OCR a document and update its record."""
    db = get_service_client()

    doc = db.table("documents").select("*").eq("id", doc_id).single().execute()
    if not doc.data:
        logger.error(f"Document {doc_id} not found")
        return

    document = doc.data

    # Only process images and PDFs
    if document["mime_type"] not in {
        "image/jpeg", "image/png", "image/webp", "application/pdf"
    }:
        db.table("documents").update({"ocr_processed": True}).eq("id", doc_id).execute()
        return

    try:
        # Download from R2
        file_bytes = await download_file_from_r2(document["storage_path"])
        if not file_bytes:
            raise ValueError("Could not download file from storage")

        # OCR with GPT-4o Vision
        ocr_text = await _extract_text(file_bytes, document["mime_type"])
        doc_type = await _classify_document(ocr_text, document["file_name"])

        # Update document record
        db.table("documents").update({
            "ocr_text": ocr_text,
            "ocr_processed": True,
            "doc_type": doc_type if doc_type else document["doc_type"],
            "status": "reviewed",
        }).eq("id", doc_id).execute()

        await write_audit_log(
            agency_id=agency_id,
            user_id=triggered_by,
            student_id=document.get("student_id"),
            action="document.ocr_processed",
            entity_type="document",
            entity_id=doc_id,
            new_value={"doc_type": doc_type, "chars_extracted": len(ocr_text)},
        )

        # Notify staff
        await send_message_to_agency_staff(
            agency_id=agency_id,
            text=f"✅ Document processed: *{document['file_name']}* — {len(ocr_text)} characters extracted",
        )

        logger.info(f"Document {doc_id} processed: {len(ocr_text)} chars")

    except Exception as e:
        logger.error(f"Document processing failed for {doc_id}: {e}")
        db.table("documents").update({
            "ocr_processed": False,
            "rejection_reason": str(e),
        }).eq("id", doc_id).execute()

        await send_message_to_agency_staff(
            agency_id=agency_id,
            text=f"⚠️ Document processing failed: *{document['file_name']}* — {e}",
        )


async def _extract_text(file_bytes: bytes, mime_type: str) -> str:
    """Use GPT-4o Vision to extract text from document."""
    b64 = base64.b64encode(file_bytes).decode()
    data_url = f"data:{mime_type};base64,{b64}"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract ALL text from this document. "
                            "Return only the raw extracted text, preserving layout where possible. "
                            "Do not summarize or interpret."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url, "detail": "high"},
                    },
                ],
            }
        ],
        max_tokens=4000,
    )

    return response.choices[0].message.content.strip()


async def _classify_document(ocr_text: str, filename: str) -> str:
    """Classify the document type based on OCR text."""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document classifier for college applications. "
                    "Classify the document into one of: "
                    "transcript, test_score, recommendation_letter, passport, "
                    "financial_statement, essay, certificate, other. "
                    "Respond with only the category name."
                ),
            },
            {
                "role": "user",
                "content": f"Filename: {filename}\n\nText (first 500 chars): {ocr_text[:500]}",
            },
        ],
        temperature=0,
        max_tokens=20,
    )

    return response.choices[0].message.content.strip().lower()
