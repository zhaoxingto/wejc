from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartAddRequest(BaseModel):
    customer_id: int
    product_id: int
    sku_id: int
    qty: int = Field(ge=1)


class CartRead(BaseModel):
    id: int
    customer_id: int
    product_id: int
    sku_id: int
    qty: int

    model_config = ConfigDict(from_attributes=True)


class CreateOrderItemRequest(BaseModel):
    product_id: int
    sku_id: int
    qty: int = Field(ge=1)


class CreateOrderRequest(BaseModel):
    customer_id: int
    items: list[CreateOrderItemRequest]
    remark: str | None = None
    address_json: dict | None = None


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    sku_id: int
    product_title: str
    sku_text: str
    price: Decimal
    qty: int
    amount: Decimal
    created_at: datetime


class OrderRead(BaseModel):
    id: int
    customer_id: int
    order_no: str
    status: str
    push_status: str
    total_amount: Decimal
    remark: str | None
    address_json: dict | None
    created_at: datetime
    items: list[OrderItemRead]
