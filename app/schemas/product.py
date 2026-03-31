from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class StoreProductListItem(BaseModel):
    id: int
    title: str
    subtitle: str | None
    cover: str | None
    status: str
    sort_no: int

    model_config = ConfigDict(from_attributes=True)


class ProductSpecValueRead(BaseModel):
    id: int
    value: str
    sort_no: int

    model_config = ConfigDict(from_attributes=True)


class ProductSpecRead(BaseModel):
    id: int
    name: str
    sort_no: int
    values: list[ProductSpecValueRead]

    model_config = ConfigDict(from_attributes=True)


class ProductSkuRead(BaseModel):
    id: int
    sku_code: str
    spec_value_ids_json: list[int]
    price: Decimal
    market_price: Decimal | None
    stock: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class StoreProductDetail(BaseModel):
    id: int
    tenant_id: int
    shop_id: int
    title: str
    subtitle: str | None
    cover: str | None
    album_json: list | None
    status: str
    sort_no: int
    specs: list[ProductSpecRead]
    skus: list[ProductSkuRead]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
