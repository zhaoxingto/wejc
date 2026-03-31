from contextvars import ContextVar

from pydantic import BaseModel


class RequestContext(BaseModel):
    tenant_id: int | None = None
    shop_id: int | None = None
    shop_code: str | None = None
    store_context_token: str | None = None


request_context: ContextVar[RequestContext] = ContextVar(
    "request_context",
    default=RequestContext(),
)


def get_request_context() -> RequestContext:
    return request_context.get()


def set_request_context(context: RequestContext) -> None:
    request_context.set(context)
