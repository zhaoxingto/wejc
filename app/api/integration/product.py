from fastapi import APIRouter, Depends

from app.api.deps import get_product_sync_service
from app.schemas.common import ResponseEnvelope
from app.schemas.integration import ProductPullRequest, ProductSyncResponse
from app.services.product_sync_service import ProductSyncService

router = APIRouter()


@router.post("/products/pull", response_model=ResponseEnvelope[ProductSyncResponse])
async def pull_products(
    payload: ProductPullRequest,
    service: ProductSyncService = Depends(get_product_sync_service),
) -> ResponseEnvelope[ProductSyncResponse]:
    return ResponseEnvelope.success(service.pull_by_integration(payload.tenant_id, payload.integration_id))
