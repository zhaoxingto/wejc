from fastapi import APIRouter, Depends

from app.api.deps import get_current_platform_admin, get_platform_auth_service
from app.models.platform_admin import PlatformAdmin
from app.schemas.common import ResponseEnvelope
from app.schemas.platform import (
    PlatformChangePasswordRequest,
    PlatformLoginRequest,
    PlatformLoginResponse,
)
from app.services.platform_auth_service import PlatformAuthService

router = APIRouter()


@router.post("/auth/login", response_model=ResponseEnvelope[PlatformLoginResponse])
async def platform_login(
    payload: PlatformLoginRequest,
    service: PlatformAuthService = Depends(get_platform_auth_service),
) -> ResponseEnvelope[PlatformLoginResponse]:
    return ResponseEnvelope.success(service.login(payload.username, payload.password))


@router.post("/auth/change-password", response_model=ResponseEnvelope[bool])
async def platform_change_password(
    payload: PlatformChangePasswordRequest,
    current_admin: PlatformAdmin = Depends(get_current_platform_admin),
    service: PlatformAuthService = Depends(get_platform_auth_service),
) -> ResponseEnvelope[bool]:
    service.change_password(current_admin, payload.current_password, payload.new_password)
    return ResponseEnvelope.success(True)
