from app.core.context import RequestContext
from app.core.exceptions import ShopInactive, ShopNotFound, TenantMismatch
from app.models.shop import Shop
from app.repositories.shop_repo import ShopRepository


class ShopService:
    def __init__(self, shop_repository: ShopRepository) -> None:
        self.shop_repository = shop_repository

    def validate_store_context(self, context: RequestContext) -> Shop:
        shop = self.shop_repository.get_by_context(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            shop_code=context.shop_code,
        )
        if shop is None:
            raise ShopNotFound()
        if shop.tenant_id != context.tenant_id:
            raise TenantMismatch()
        if shop.status != "active":
            raise ShopInactive()
        return shop
