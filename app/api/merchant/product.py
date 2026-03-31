from fastapi import APIRouter, Depends

from app.api.deps import get_product_sync_service, get_store_request_context
from app.core.context import RequestContext
from app.schemas.common import ResponseEnvelope
from app.schemas.integration import ProductSyncResponse, SourceProductSyncRead
from app.services.product_sync_service import ProductSyncService

router = APIRouter()


@router.post("/products/sync", response_model=ResponseEnvelope[ProductSyncResponse])
async def sync_products(
    context: RequestContext = Depends(get_store_request_context),
    service: ProductSyncService = Depends(get_product_sync_service),
) -> ResponseEnvelope[ProductSyncResponse]:
    return ResponseEnvelope.success(service.sync_for_store(context))


@router.get("/source-products", response_model=ResponseEnvelope[list[SourceProductSyncRead]])
async def list_source_products(
    context: RequestContext = Depends(get_store_request_context),
    service: ProductSyncService = Depends(get_product_sync_service),
) -> ResponseEnvelope[list[SourceProductSyncRead]]:
    return ResponseEnvelope.success(service.list_source_products_for_store(context))
