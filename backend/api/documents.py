"""
Documents API — Phase 2.
Upload to Cloudflare R2, store path + url in documents table.
Full audit logging on every write. agency_id always from JWT.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, Query
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser
from services.storage import upload_file_to_r2, delete_file_from_r2

router = APIRouter(tags=["Documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Required document types for checklist
REQUIRED_DOC_TYPES = [
    "transcript",
    "test_score",
    "passport",
    "recommendation_letter",
    "financial_statement",
]


@router.get("/documents")
async def list_documents(
    student_id: Optional[str] = Query(None),
    application_id: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = (
        db.table("documents")
        .select(
            "id, student_id, application_id, doc_type, file_name, storage_url, "
            "file_size_bytes, mime_type, version, status, ocr_processed, "
            "rejection_reason, uploaded_at, created_at, "
            "uploaded_by_user:users!uploaded_by(full_name)"
        )
        .eq("agency_id", user.agency_id)  # ISOLATION
    )

    if student_id:
        query = query.eq("student_id", student_id)
    if application_id:
        query = query.eq("application_id", application_id)
    if doc_type:
        query = query.eq("doc_type", doc_type)

    result = query.order("created_at", desc=True).execute()
    return {"documents": result.data or []}


@router.get("/documents/checklist/{student_id}")
async def get_document_checklist(
    student_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """
    Returns a checklist of required document types with upload status.
    Green = uploaded, Red = missing.
    """
    db = get_service_client()

    # Verify student (ISOLATION)
    student = (
        db.table("students")
        .select("id")
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not student.data:
        raise HTTPException(404, "Student not found")

    # Fetch all documents for this student
    docs = (
        db.table("documents")
        .select("id, doc_type, file_name, status, storage_url, uploaded_at")
        .eq("student_id", student_id)
        .eq("agency_id", user.agency_id)
        .execute()
    )

    uploaded_by_type: dict[str, list] = {}
    for doc in docs.data or []:
        t = doc["doc_type"]
        if t not in uploaded_by_type:
            uploaded_by_type[t] = []
        uploaded_by_type[t].append(doc)

    checklist = []
    for doc_type in REQUIRED_DOC_TYPES:
        uploaded = uploaded_by_type.get(doc_type, [])
        checklist.append({
            "doc_type": doc_type,
            "label": doc_type.replace("_", " ").title(),
            "required": True,
            "uploaded": len(uploaded) > 0,
            "documents": uploaded,
        })

    # Also include any non-required uploaded doc types
    for doc_type, docs_list in uploaded_by_type.items():
        if doc_type not in REQUIRED_DOC_TYPES:
            checklist.append({
                "doc_type": doc_type,
                "label": doc_type.replace("_", " ").title(),
                "required": False,
                "uploaded": True,
                "documents": docs_list,
            })

    return {"checklist": checklist}


@router.post("/documents/upload", status_code=201)
async def upload_document(
    student_id: str = Form(...),
    doc_type: str = Form(...),
    name: Optional[str] = Form(None),
    application_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    request: Request = None,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    # Verify student belongs to agency (ISOLATION)
    student = (
        db.table("students")
        .select("id, full_name")
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not student.data:
        raise HTTPException(404, "Student not found")

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"File type not allowed: {content_type}. Allowed: PDF, JPG, PNG, DOCX")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 20 MB.")

    # Build R2 path: agency/student/type/filename
    safe_filename = file.filename.replace(" ", "_") if file.filename else "document"
    storage_path = f"{user.agency_id}/{student_id}/{doc_type}/{safe_filename}"

    storage_url = await upload_file_to_r2(
        path=storage_path,
        data=contents,
        content_type=content_type,
    )

    # Save record in documents table
    result = db.table("documents").insert({
        "agency_id": user.agency_id,  # ISOLATION
        "student_id": student_id,
        "application_id": application_id,
        "doc_type": doc_type,
        "file_name": name or safe_filename,
        "storage_path": storage_path,
        "storage_url": storage_url,
        "file_size_bytes": len(contents),
        "mime_type": content_type,
        "status": "uploaded",
        "ocr_processed": False,
        "uploaded_by": user.id,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to save document record")

    doc = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=student_id,
        action="document.uploaded",
        entity_type="document",
        entity_id=doc["id"],
        old_value=None,
        new_value={
            "file_name": doc["file_name"],
            "doc_type": doc_type,
            "size_bytes": len(contents),
            "storage_path": storage_path,
        },
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )

    # Trigger OCR processor asynchronously (fire-and-forget)
    import asyncio
    asyncio.create_task(_trigger_ocr(doc["id"], user.agency_id, user.id))

    return doc


async def _trigger_ocr(doc_id: str, agency_id: str, user_id: str) -> None:
    try:
        from agents.document_processor import process_document
        await process_document(doc_id=doc_id, agency_id=agency_id, triggered_by=user_id)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"OCR trigger failed for doc {doc_id}: {e}")


@router.patch("/documents/{document_id}/status")
async def update_document_status(
    document_id: str,
    status: str,
    rejection_reason: Optional[str] = None,
    request: Request = None,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("documents")
        .select("id, doc_type, file_name, status, student_id")
        .eq("id", document_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Document not found")

    payload = {
        "status": status,
        "reviewed_by": user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    if rejection_reason:
        payload["rejection_reason"] = rejection_reason

    result = (
        db.table("documents")
        .update(payload)
        .eq("id", document_id)
        .eq("agency_id", user.agency_id)
        .execute()
    )

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="document.status_updated",
        entity_type="document",
        entity_id=document_id,
        old_value={"status": existing.data["status"]},
        new_value={"status": status, "rejection_reason": rejection_reason},
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update document status")
    return result.data[0]


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("documents")
        .select("id, storage_path, file_name, doc_type, student_id")
        .eq("id", document_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Document not found")

    # Remove from R2
    await delete_file_from_r2(existing.data["storage_path"])

    # Remove record
    db.table("documents").delete().eq("id", document_id).eq(
        "agency_id", user.agency_id
    ).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="document.deleted",
        entity_type="document",
        entity_id=document_id,
        old_value={"file_name": existing.data["file_name"], "doc_type": existing.data["doc_type"]},
        new_value=None,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
