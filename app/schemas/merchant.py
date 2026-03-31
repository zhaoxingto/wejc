from datetime import datetime

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MerchantPushLogRead(BaseModel):
    id: int
    task_id: int
    order_id: int
    success: bool
    pushed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MerchantChannelProductRead(BaseModel):
    id: int
    source_product_id: int | None
    source_product_name: str | None
    title: str
    subtitle: str | None
    cover: str | None
    status: str
    sort_no: int
    sku_count: int


class MerchantSpecValueRead(BaseModel):
    id: int
    value: str
    sort_no: int


class MerchantSpecRead(BaseModel):
    id: int
    name: str
    sort_no: int
    values: list[MerchantSpecValueRead]


class MerchantChannelProductDetailRead(MerchantChannelProductRead):
    album_json: list | None
    category_id: int | None
    source_product_description: str | None
    specs: list[MerchantSpecRead]


class MerchantChannelProductUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    cover: str | None = Field(default=None, max_length=1024)
    status: str | None = Field(default=None, max_length=32)
    sort_no: int | None = None
    album_json: list | None = None
    category_id: int | None = None


class MerchantSkuRead(BaseModel):
    id: int
    product_id: int
    sku_code: str
    spec_text: str
    spec_value_ids_json: list[int]
    price: Decimal
    market_price: Decimal | None
    stock: int
    status: str


class MerchantSkuUpdateRequest(BaseModel):
    sku_code: str | None = Field(default=None, max_length=128)
    spec_value_ids_json: list[int] | None = None
    price: Decimal | None = None
    market_price: Decimal | None = None
    stock: int | None = None
    status: str | None = Field(default=None, max_length=32)


class MerchantSkuCreateRequest(BaseModel):
    sku_code: str = Field(max_length=128)
    spec_value_ids_json: list[int] = Field(default_factory=list)
    price: Decimal
    market_price: Decimal | None = None
    stock: int = 0
    status: str = Field(default="active", max_length=32)


class MerchantIntegrationRead(BaseModel):
    id: int
    name: str
    integration_type: str
    status: str
    product_sync_enabled: bool
    order_push_enabled: bool
    api_base_url: str | None
    api_key: str | None
    has_api_secret: bool
    config_json: dict | None


class MerchantIntegrationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    integration_type: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
    product_sync_enabled: bool | None = None
    order_push_enabled: bool | None = None
    api_base_url: str | None = Field(default=None, max_length=1024)
    api_key: str | None = Field(default=None, max_length=255)
    api_secret: str | None = Field(default=None, max_length=255)
    config_json: dict | None = None


class MerchantIntegrationTestRead(BaseModel):
    reachable: bool
    message: str
    request_url: str | None
    sample_count: int
