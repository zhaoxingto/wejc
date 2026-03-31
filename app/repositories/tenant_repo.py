from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.repositories.base import BaseRepository


class TenantRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_by_id(self, tenant_id: int) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        return self.session.execute(stmt).scalar_one_or_none()
