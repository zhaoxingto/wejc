import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from app.core.logging import get_logger, to_log_json

logger = get_logger("app.audit")


async def audit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

    logger.info(
        to_log_json(
            {
                "event": "request_completed",
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client": request.client.host if request.client else None,
            }
        )
    )
    return response
