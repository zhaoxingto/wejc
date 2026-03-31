from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseEnvelope(BaseModel, Generic[T]):
    code: int
    message: str
    data: T | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def success(cls, data: T | None = None, message: str = "ok") -> "ResponseEnvelope[T]":
        return cls(code=0, message=message, data=data)


class ErrorResponse(BaseModel):
    code: int
    message: str
    data: None = None
