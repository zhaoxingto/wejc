from fastapi import APIRouter

from app.api.customer.cart import router as customer_cart_router
from app.api.customer.order import router as customer_order_router
from app.api.platform.admin import router as platform_admin_router
from app.api.platform.auth import router as platform_auth_router
from app.api.integration.product import router as integration_product_router
from app.api.integration.push import router as integration_push_router
from app.api.merchant.order import router as merchant_order_router
from app.api.merchant.console import router as merchant_console_router
from app.api.merchant.product import router as merchant_product_router
from app.api.merchant.push import router as merchant_push_router
from app.api.merchant.theme import router as merchant_theme_router
from app.api.platform.health import router as platform_health_router
from app.api.store.entry import router as store_entry_router
from app.api.store.home import router as store_home_router
from app.api.store.product import router as store_product_router

api_router = APIRouter()
api_router.include_router(platform_health_router, prefix="/platform", tags=["platform"])
api_router.include_router(platform_auth_router, prefix="/platform", tags=["platform"])
api_router.include_router(platform_admin_router, prefix="/platform", tags=["platform"])
api_router.include_router(customer_cart_router, prefix="/customer", tags=["customer"])
api_router.include_router(customer_order_router, prefix="/customer", tags=["customer"])
api_router.include_router(merchant_order_router, prefix="/merchant", tags=["merchant"])
api_router.include_router(merchant_console_router, prefix="/merchant", tags=["merchant"])
api_router.include_router(merchant_product_router, prefix="/merchant", tags=["merchant"])
api_router.include_router(merchant_push_router, prefix="/merchant", tags=["merchant"])
api_router.include_router(merchant_theme_router, prefix="/merchant", tags=["merchant"])
api_router.include_router(integration_product_router, prefix="/integration", tags=["integration"])
api_router.include_router(integration_push_router, prefix="/integration", tags=["integration"])
api_router.include_router(store_entry_router, prefix="/store", tags=["store"])
api_router.include_router(store_home_router, prefix="/store", tags=["store"])
api_router.include_router(store_product_router, prefix="/store", tags=["store"])
