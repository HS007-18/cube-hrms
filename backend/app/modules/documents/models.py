import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class DocumentCategory(str, enum.Enum):
    IDENTITY = "identity"
    ADDRESS = "address"
    EDUCATION = "education"
    EXPERIENCE = "experience"
    MEDICAL = "medical"
    BANK = "bank"
    TAX = "tax"
    CONTRACT = "contract"
    POLICY = "policy"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="uploaded", index=True
    )
    verified_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    verified_at: Mapped[datetime | None] = None
    rejection_reason: Mapped[str | None] = None
    expiry_date: Mapped[date | None] = None
    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )