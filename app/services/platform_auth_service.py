from datetime import datetime, timezone
import time

from sqlalchemy.orm import Session

from app.core.exceptions import PlatformPasswordInvalid, PlatformUnauthorized
from app.core.security import PlatformAdminTokenManager, hash_password, verify_password
from app.models.platform_admin import PlatformAdmin
from app.models.platform_audit_log import PlatformAuditLog
from app.repositories.platform_admin_repo import PlatformAdminRepository
from app.repositories.platform_repo import PlatformRepository
from app.schemas.platform import PlatformLoginResponse


class PlatformAuthService:
    def __init__(
        self,
        session: Session,
        platform_admin_repository: PlatformAdminRepository,
        platform_repository: PlatformRepository,
        token_manager: PlatformAdminTokenManager,
    ) -> None:
        self.session = session
        self.platform_admin_repository = platform_admin_repository
        self.platform_repository = platform_repository
        self.token_manager = token_manager

    def login(self, username: str, password: str) -> PlatformLoginResponse:
        admin = self.platform_admin_repository.get_by_username(username)
        if admin is None or admin.status != "active":
            raise PlatformUnauthorized()
        if not verify_password(password, admin.password_hash):
            raise PlatformUnauthorized()

        admin.last_login_at = datetime.now(timezone.utc)
        self.session.commit()
        self._record_audit(
            admin,
            "admin.login",
            "platform_admin",
            admin.id,
            "平台管理员登录系统",
            {"username": admin.username},
        )
        return PlatformLoginResponse(
            access_token=self.token_manager.dumps(admin.id, admin.username),
            admin_id=admin.id,
            username=admin.username,
            display_name=admin.display_name,
        )

    def authenticate_claims(self, claims: dict[str, str | int]) -> PlatformAdmin:
        admin_id = claims.get("admin_id")
        if not isinstance(admin_id, int):
            raise PlatformUnauthorized()
        admin = self.platform_admin_repository.get_by_id(admin_id)
        if admin is None or admin.status != "active":
            raise PlatformUnauthorized()
        return admin

    def change_password(self, admin: PlatformAdmin, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, admin.password_hash):
            raise PlatformPasswordInvalid()
        admin.password_hash = hash_password(new_password)
        self.session.commit()
        self._record_audit(
            admin,
            "admin.change_password",
            "platform_admin",
            admin.id,
            "平台管理员修改密码",
            {"username": admin.username},
        )

    def _record_audit(
        self,
        admin: PlatformAdmin,
        action: str,
        resource_type: str,
        resource_id: int,
        summary: str,
        detail_json: dict | None,
    ) -> None:
        self.platform_repository.add_audit_log(
            PlatformAuditLog(
                id=time.time_ns(),
                admin_id=admin.id,
                admin_username=admin.username,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id),
                summary=summary,
                detail_json=detail_json,
            )
        )
        self.session.commit()
