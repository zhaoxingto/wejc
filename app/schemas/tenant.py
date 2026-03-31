from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TenantRead(BaseModel):
    id: int
    tenant_code: str
    name: str
    status: str
    contact_name: str | None
    mobile: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
