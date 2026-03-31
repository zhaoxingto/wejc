from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.theme import StoreThemeRead


class ShopRead(BaseModel):
    id: int
    tenant_id: int
    shop_code: str
    name: str
    logo: str | None
    cover: str | None
    intro: str | None
    theme: StoreThemeRead | None = None
    status: str
    default_integration_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StoreResolveRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64)


class StoreResolveResponse(BaseModel):
    tenant_id: int
    shop_id: int
    shop_name: str
    logo: str | None
    store_context_token: str
