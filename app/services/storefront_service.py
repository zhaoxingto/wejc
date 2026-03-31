from app.core.context import RequestContext
from app.core.store_theme import normalize_theme
from app.repositories.shop_repo import ShopRepository
from app.schemas.store import StoreHomeResponse


class StorefrontService:
    def __init__(self, shop_repository: ShopRepository) -> None:
        self.shop_repository = shop_repository

    def get_home(self, context: RequestContext) -> StoreHomeResponse:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        return StoreHomeResponse(
            tenant_id=shop.tenant_id,
            shop_id=shop.id,
            shop_code=shop.shop_code,
            shop_name=shop.name,
            logo=shop.logo,
            cover=shop.cover,
            intro=shop.intro,
            theme=normalize_theme(shop.theme_json),
        )
