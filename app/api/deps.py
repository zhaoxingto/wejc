from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.context import RequestContext, set_request_context
from app.core.db import get_db_session
from app.core.security import (
    PlatformAdminTokenManager,
    StoreContextTokenManager,
    get_platform_admin_token_manager,
    get_store_context_token_manager,
)
from app.repositories.product_repo import ProductRepository
from app.repositories.platform_repo import PlatformRepository
from app.repositories.platform_admin_repo import PlatformAdminRepository
from app.repositories.cart_repo import CartRepository
from app.repositories.customer_repo import CustomerRepository
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.shop_repo import ShopRepository
from app.repositories.tenant_repo import TenantRepository
from app.models.platform_admin import PlatformAdmin
from app.services.integration_service import IntegrationService
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.order_push_service import OrderPushService
from app.services.merchant_console_service import MerchantConsoleService
from app.services.product_service import ProductService
from app.services.platform_service import PlatformService
from app.services.platform_auth_service import PlatformAuthService
from app.services.product_sync_service import ProductSyncService
from app.services.shop_service import ShopService
from app.services.storefront_service import StorefrontService
from app.services.store_entry_service import StoreEntryService
from app.services.store_theme_service import StoreThemeService


def get_shop_repository(session: Session = Depends(get_db_session)) -> ShopRepository:
    return ShopRepository(session)


def get_tenant_repository(session: Session = Depends(get_db_session)) -> TenantRepository:
    return TenantRepository(session)


def get_store_entry_service(
    shop_repository: ShopRepository = Depends(get_shop_repository),
    tenant_repository: TenantRepository = Depends(get_tenant_repository),
    token_manager: StoreContextTokenManager = Depends(get_store_context_token_manager),
) -> StoreEntryService:
    return StoreEntryService(shop_repository, tenant_repository, token_manager)


def get_product_repository(session: Session = Depends(get_db_session)) -> ProductRepository:
    return ProductRepository(session)


def get_customer_repository(session: Session = Depends(get_db_session)) -> CustomerRepository:
    return CustomerRepository(session)


def get_cart_repository(session: Session = Depends(get_db_session)) -> CartRepository:
    return CartRepository(session)


def get_order_repository(session: Session = Depends(get_db_session)) -> OrderRepository:
    return OrderRepository(session)


def get_integration_repository(session: Session = Depends(get_db_session)) -> IntegrationRepository:
    return IntegrationRepository(session)


def get_platform_repository(session: Session = Depends(get_db_session)) -> PlatformRepository:
    return PlatformRepository(session)


def get_platform_admin_repository(session: Session = Depends(get_db_session)) -> PlatformAdminRepository:
    return PlatformAdminRepository(session)


def get_product_service(
    product_repository: ProductRepository = Depends(get_product_repository),
) -> ProductService:
    return ProductService(product_repository)


def get_cart_service(
    session: Session = Depends(get_db_session),
    cart_repository: CartRepository = Depends(get_cart_repository),
    customer_repository: CustomerRepository = Depends(get_customer_repository),
    product_repository: ProductRepository = Depends(get_product_repository),
) -> CartService:
    return CartService(session, cart_repository, customer_repository, product_repository)


def get_order_service(
    session: Session = Depends(get_db_session),
    customer_repository: CustomerRepository = Depends(get_customer_repository),
    product_repository: ProductRepository = Depends(get_product_repository),
    order_repository: OrderRepository = Depends(get_order_repository),
    integration_repository: IntegrationRepository = Depends(get_integration_repository),
) -> OrderService:
    return OrderService(session, customer_repository, product_repository, order_repository, integration_repository)


def get_integration_service() -> IntegrationService:
    return IntegrationService()


def get_order_push_service(
    session: Session = Depends(get_db_session),
    order_repository: OrderRepository = Depends(get_order_repository),
    integration_repository: IntegrationRepository = Depends(get_integration_repository),
    integration_service: IntegrationService = Depends(get_integration_service),
) -> OrderPushService:
    return OrderPushService(session, order_repository, integration_repository, integration_service)


def get_product_sync_service(
    session: Session = Depends(get_db_session),
    integration_repository: IntegrationRepository = Depends(get_integration_repository),
    product_repository: ProductRepository = Depends(get_product_repository),
    shop_repository: ShopRepository = Depends(get_shop_repository),
    integration_service: IntegrationService = Depends(get_integration_service),
) -> ProductSyncService:
    return ProductSyncService(
        session,
        integration_repository,
        product_repository,
        shop_repository,
        integration_service,
    )


def get_platform_service(
    session: Session = Depends(get_db_session),
    platform_repository: PlatformRepository = Depends(get_platform_repository),
    product_repository: ProductRepository = Depends(get_product_repository),
    shop_repository: ShopRepository = Depends(get_shop_repository),
    order_repository: OrderRepository = Depends(get_order_repository),
    order_push_service: OrderPushService = Depends(get_order_push_service),
) -> PlatformService:
    return PlatformService(
        session,
        platform_repository,
        product_repository,
        shop_repository,
        order_repository,
        order_push_service,
    )


def get_platform_auth_service(
    session: Session = Depends(get_db_session),
    platform_admin_repository: PlatformAdminRepository = Depends(get_platform_admin_repository),
    platform_repository: PlatformRepository = Depends(get_platform_repository),
    token_manager: PlatformAdminTokenManager = Depends(get_platform_admin_token_manager),
) -> PlatformAuthService:
    return PlatformAuthService(session, platform_admin_repository, platform_repository, token_manager)


def get_shop_service(
    shop_repository: ShopRepository = Depends(get_shop_repository),
) -> ShopService:
    return ShopService(shop_repository)


def get_storefront_service(
    shop_repository: ShopRepository = Depends(get_shop_repository),
) -> StorefrontService:
    return StorefrontService(shop_repository)


def get_store_theme_service(
    session: Session = Depends(get_db_session),
    shop_repository: ShopRepository = Depends(get_shop_repository),
) -> StoreThemeService:
    return StoreThemeService(session, shop_repository)


def get_merchant_console_service(
    session: Session = Depends(get_db_session),
    product_repository: ProductRepository = Depends(get_product_repository),
    integration_repository: IntegrationRepository = Depends(get_integration_repository),
    shop_repository: ShopRepository = Depends(get_shop_repository),
    integration_service: IntegrationService = Depends(get_integration_service),
) -> MerchantConsoleService:
    return MerchantConsoleService(
        session,
        product_repository,
        integration_repository,
        shop_repository,
        integration_service,
    )


def get_store_request_context(
    store_context_token: Annotated[str, Header(alias="X-Store-Context-Token")],
    token_manager: StoreContextTokenManager = Depends(get_store_context_token_manager),
    shop_service: ShopService = Depends(get_shop_service),
) -> RequestContext:
    context = token_manager.loads(store_context_token)
    shop_service.validate_store_context(context)
    set_request_context(context)
    return context


def get_platform_admin_claims(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    token_manager: PlatformAdminTokenManager = Depends(get_platform_admin_token_manager),
    auth_service: PlatformAuthService = Depends(get_platform_auth_service),
) -> dict[str, str | int]:
    from app.core.exceptions import PlatformUnauthorized

    if authorization is None or not authorization.startswith("Bearer "):
        raise PlatformUnauthorized()
    token = authorization.removeprefix("Bearer ").strip()
    claims = token_manager.loads(token)
    auth_service.authenticate_claims(claims)
    return claims


def get_current_platform_admin(
    claims: dict[str, str | int] = Depends(get_platform_admin_claims),
    auth_service: PlatformAuthService = Depends(get_platform_auth_service),
) -> PlatformAdmin:
    return auth_service.authenticate_claims(claims)
