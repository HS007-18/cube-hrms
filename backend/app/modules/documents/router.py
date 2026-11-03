from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from app.core.deps import AuthContext, require_roles, require_tenant_user
from app.modules.documents import service
from app.modules.documents.schemas import DocumentCreate, DocumentOut, DocumentUpdate

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    employee_id: int | None = Query(None),
    category: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    ctx: AuthContext = Depends(require_tenant_user),
):
    return await service.list_documents(
        ctx.session, ctx.tenant_id, ctx.user_id, employee_id, category, status_filter
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    employee_id: int = Form(...),
    category: str = Form(...),
    name: str = Form(...),
    expiry_date: str | None = Form(None),
    file: UploadFile = File(...),
    ctx: AuthContext = Depends(require_roles("hr_admin", "employee")),
):
    return await service.upload_document(
        ctx.session,
        ctx.tenant_id,
        ctx.user_id,
        employee_id,
        category,
        name,
        expiry_date,
        file,
    )


@router.patch("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: int,
    payload: DocumentUpdate,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    return await service.update_document(ctx.session, ctx.tenant_id, document_id, payload)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    ctx: AuthContext = Depends(require_roles("hr_admin")),
):
    await service.delete_document(ctx.session, ctx.tenant_id, document_id)