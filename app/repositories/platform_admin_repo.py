from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.platform_admin import PlatformAdmin
from app.repositories.base import BaseRepository


class PlatformAdminRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_by_id(self, admin_id: int) -> PlatformAdmin | None:
        stmt = select(PlatformAdmin).where(PlatformAdmin.id == admin_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_username(self, username: str) -> PlatformAdmin | None:
        stmt = select(PlatformAdmin).where(PlatformAdmin.username == username)
        return self.session.execute(stmt).scalar_one_or_none()

    def add(self, admin: PlatformAdmin) -> None:
        self.session.add(admin)
