from fastapi import APIRouter

from app.schemas.common import ResponseEnvelope

router = APIRouter()


@router.get("/ping", response_model=ResponseEnvelope[dict[str, str]])
async def ping() -> ResponseEnvelope[dict[str, str]]:
    return ResponseEnvelope.success({"message": "pong"})
