from fastapi import APIRouter, Depends

from app.api.deps import get_store_request_context, get_store_theme_service
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.theme import StoreThemePresetRead, StoreThemeRead, StoreThemeUpdateRequest
from app.services.store_theme_service import StoreThemeService

router = APIRouter()


@router.get("/storefront-theme", response_model=ResponseEnvelope[StoreThemeRead])
async def get_storefront_theme(
    context: RequestContext = Depends(get_store_request_context),
    service: StoreThemeService = Depends(get_store_theme_service),
) -> ResponseEnvelope[StoreThemeRead]:
    return ResponseEnvelope.success(service.get_theme(context))


@router.get("/storefront-theme/presets", response_model=ResponseEnvelope[list[StoreThemePresetRead]])
async def list_storefront_theme_presets(
    service: StoreThemeService = Depends(get_store_theme_service),
) -> ResponseEnvelope[list[StoreThemePresetRead]]:
    return ResponseEnvelope.success(service.list_presets())


@router.put("/storefront-theme", response_model=ResponseEnvelope[StoreThemeRead])
async def update_storefront_theme(
    payload: StoreThemeUpdateRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: StoreThemeService = Depends(get_store_theme_service),
) -> ResponseEnvelope[StoreThemeRead]:
    return ResponseEnvelope.success(service.update_theme(context, payload))
