from pydantic import BaseModel

from app.schemas.theme import StoreThemeRead


class StoreHomeResponse(BaseModel):
    tenant_id: int
    shop_id: int
    shop_code: str
    shop_name: str
    logo: str | None
    cover: str | None
    intro: str | None
    theme: StoreThemeRead
