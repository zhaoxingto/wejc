from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.integration import Integration
from app.repositories.base import BaseRepository


class IntegrationRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_active_product_sync_integration(self, tenant_id: int | None) -> Integration | None:
        stmt = (
            select(Integration)
            .where(
                Integration.tenant_id == tenant_id,
                Integration.status == "active",
                Integration.product_sync_enabled.is_(True),
            )
            .order_by(Integration.id.asc())
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_active_order_push_integration(self, tenant_id: int | None) -> Integration | None:
        stmt = (
            select(Integration)
            .where(
                Integration.tenant_id == tenant_id,
                Integration.status == "active",
                Integration.order_push_enabled.is_(True),
            )
            .order_by(Integration.id.asc())
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_id(self, integration_id: int, tenant_id: int | None) -> Integration | None:
        stmt = select(Integration).where(
            Integration.id == integration_id,
            Integration.tenant_id == tenant_id,
            Integration.status == "active",
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_any_by_id(self, integration_id: int, tenant_id: int | None) -> Integration | None:
        stmt = select(Integration).where(
            Integration.id == integration_id,
            Integration.tenant_id == tenant_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_first_for_tenant(self, tenant_id: int | None) -> Integration | None:
        stmt = select(Integration).where(Integration.tenant_id == tenant_id).order_by(Integration.id.asc())
        return self.session.execute(stmt).scalar_one_or_none()
