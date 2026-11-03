# Documents service
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.modules.documents.models import Document
from app.modules.documents.schemas import DocumentCreate, DocumentUpdate


async def list_documents(
    session,
    tenant_id: int,
    user_id: int,
    employee_id: int | None = None,
    category: str | None = None,
    status_filter: str | None = None,
) -> list[Document]:
    stmt = select(Document).where(Document.tenant_id == tenant_id)
    if employee_id:
        stmt = stmt.where(Document.employee_id == employee_id)
    if category:
        stmt = stmt.where(Document.category == category)
    if status_filter:
        stmt = stmt.where(Document.status == status_filter)
    
    # Employees can only see their own documents
    # HR admins can see all
    # This would need role check - simplified for now
    
    stmt = stmt.order_by(Document.created_at.desc())
    return (await session.execute(stmt)).scalars().all()


async def upload_document(
    session,
    tenant_id: int,
    user_id: int,
    employee_id: int,
    category: str,
    name: str,
    expiry_date: str | None,
    file,
) -> Document:
    # In production, this would upload to MinIO/S3
    # For now, just save metadata with a mock path
    file_content = await file.read()
    file_size = len(file_content)
    
    document = Document(
        tenant_id=tenant_id,
        employee_id=employee_id,
        category=category,
        name=name,
        file_path=f"/uploads/{tenant_id}/{employee_id}/{file.filename}",
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        original_filename=file.filename,
        status="uploaded",
        expiry_date=date.fromisoformat(expiry_date) if expiry_date else None,
        uploaded_by=user_id,
    )
    session.add(document)
    await session.flush()
    await session.refresh(document)
    return document


async def update_document(session, tenant_id: int, document_id: int, payload, user_id: int) -> Document:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.tenant_id == tenant_id,
    )
    document = (await session.execute(stmt)).scalar_one_or_none()
    if document is None:
        raise not_found("Document")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(document, key, value)
    document.updated_at = datetime.utcnow()
    await session.flush()
    await session.refresh(document)
    return document


async def delete_document(session, tenant_id: int, document_id: int) -> None:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.tenant_id == tenant_id,
    )
    document = (await session.execute(stmt)).scalar_one_or_none()
    if document is None:
        raise not_found("Document")
    await session.delete(document)