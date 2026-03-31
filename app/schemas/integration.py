from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SourceProductSyncRead(BaseModel):
    id: int
    integration_id: int | None
    source_product_id: str
    source_type: str
    sku_mode: str
    name: str
    description: str | None
    sync_status: str
    last_sync_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ProductPullRequest(BaseModel):
    tenant_id: int
    integration_id: int | None = None


class ProductSyncResponse(BaseModel):
    integration_id: int
    pulled_count: int
    created_count: int
    updated_count: int
    skipped_count: int
    source_products: list[SourceProductSyncRead]


class PushTaskExecuteResponse(BaseModel):
    processed: int


class OrderPushTaskRead(BaseModel):
    id: int
    order_id: int
    integration_id: int | None
    status: str
    retry_count: int
    next_retry_at: datetime | None
    last_error: str | None

    model_config = ConfigDict(from_attributes=True)
