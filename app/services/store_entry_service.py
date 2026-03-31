from app.core.context import RequestContext
from app.core.exceptions import ShopInactive, ShopNotFound, TenantMismatch
from app.core.security import StoreContextTokenManager
from app.models.shop import Shop
from app.repositories.shop_repo import ShopRepository
from app.repositories.tenant_repo import TenantRepository
from app.schemas.shop import StoreResolveResponse


class StoreEntryService:
    def __init__(
        self,
        shop_repository: ShopRepository,
        tenant_repository: TenantRepository,
        token_manager: StoreContextTokenManager,
    ) -> None:
        self.shop_repository = shop_repository
        self.tenant_repository = tenant_repository
        self.token_manager = token_manager

    def resolve(self, code: str) -> StoreResolveResponse:
        shop = self.shop_repository.get_by_code(code)
        if shop is None:
            raise ShopNotFound()
        self._ensure_shop_is_active(shop)

        tenant = self.tenant_repository.get_by_id(shop.tenant_id)
        if tenant is None:
            raise TenantMismatch()

        context = RequestContext(
            tenant_id=tenant.id,
            shop_id=shop.id,
            shop_code=shop.shop_code,
        )
        token = self.token_manager.dumps(context)

        return StoreResolveResponse(
            tenant_id=tenant.id,
            shop_id=shop.id,
            shop_name=shop.name,
            logo=shop.logo,
            store_context_token=token,
        )

    @staticmethod
    def _ensure_shop_is_active(shop: Shop) -> None:
        if shop.status != "active":
            raise ShopInactive()
