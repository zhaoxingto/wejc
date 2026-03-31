from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModelMixin


class Tenant(BaseModelMixin):
    __tablename__ = "tenant"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    contact_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(32), nullable=True)
