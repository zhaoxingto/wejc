from sqlalchemy.orm import Session

from app.core.context import RequestContext
from app.core.store_theme import build_theme_storage, list_theme_presets, normalize_theme
from app.repositories.shop_repo import ShopRepository
from app.schemas.theme import StoreThemePresetRead, StoreThemeRead, StoreThemeUpdateRequest


class StoreThemeService:
    def __init__(self, session: Session, shop_repository: ShopRepository) -> None:
        self.session = session
        self.shop_repository = shop_repository

    def get_theme(self, context: RequestContext) -> StoreThemeRead:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        return StoreThemeRead(**normalize_theme(shop.theme_json))

    def list_presets(self) -> list[StoreThemePresetRead]:
        return [StoreThemePresetRead(**item) for item in list_theme_presets()]

    def update_theme(self, context: RequestContext, payload: StoreThemeUpdateRequest) -> StoreThemeRead:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        colors = payload.colors.model_dump(exclude_none=True) if payload.colors else {}
        shop.theme_json = build_theme_storage(payload.preset_key, colors)
        self.session.commit()
        return StoreThemeRead(**normalize_theme(shop.theme_json))
