from fastapi import APIRouter, Depends

from app.api.deps import get_merchant_console_service, get_product_sync_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.integration import ProductSyncResponse
from app.schemas.merchant import MerchantChannelProductRead, MerchantPublishSourceProductRequest, MerchantSourceProductRead
from app.services.merchant_console_service import MerchantConsoleService
from app.services.product_sync_service import ProductSyncService

router = APIRouter()


@router.post("/products/sync", response_model=ResponseEnvelope[ProductSyncResponse])
async def sync_products(
    context: RequestContext = Depends(get_store_request_context),
    service: ProductSyncService = Depends(get_product_sync_service),
) -> ResponseEnvelope[ProductSyncResponse]:
    return ResponseEnvelope.success(service.sync_for_store(context))


@router.get("/source-products", response_model=ResponseEnvelope[list[MerchantSourceProductRead]])
async def list_source_products(
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[list[MerchantSourceProductRead]]:
    return ResponseEnvelope.success(service.list_source_products(context))


@router.post("/source-products/{source_product_id}/publish", response_model=ResponseEnvelope[MerchantChannelProductRead])
async def publish_source_product(
    source_product_id: int,
    payload: MerchantPublishSourceProductRequest,
    context: RequestContext = Depends(get_store_request_context),
    service: MerchantConsoleService = Depends(get_merchant_console_service),
) -> ResponseEnvelope[MerchantChannelProductRead]:
    return ResponseEnvelope.success(service.publish_source_product(context, source_product_id, payload))
