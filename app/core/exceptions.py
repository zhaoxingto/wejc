from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.schemas.common import ErrorResponse


class AppException(Exception):
    def __init__(self, code: int, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class TenantMismatch(AppException):
    def __init__(self) -> None:
        super().__init__(code=4003, message="tenant mismatch", status_code=status.HTTP_403_FORBIDDEN)


class ShopNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4001, message="shop not found", status_code=status.HTTP_404_NOT_FOUND)


class ShopInactive(AppException):
    def __init__(self) -> None:
        super().__init__(code=4002, message="shop inactive", status_code=status.HTTP_400_BAD_REQUEST)


class InvalidStoreContextToken(AppException):
    def __init__(self) -> None:
        super().__init__(code=4004, message="invalid store context token", status_code=status.HTTP_401_UNAUTHORIZED)


class ProductNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4005, message="product not found", status_code=status.HTTP_404_NOT_FOUND)


class SkuNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4006, message="sku not found", status_code=status.HTTP_404_NOT_FOUND)


class CustomerNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4007, message="customer not found", status_code=status.HTTP_404_NOT_FOUND)


class InsufficientStock(AppException):
    def __init__(self) -> None:
        super().__init__(code=4008, message="insufficient stock", status_code=status.HTTP_400_BAD_REQUEST)


class OrderPushTaskNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4009, message="order push task not found", status_code=status.HTTP_404_NOT_FOUND)


class IntegrationNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4010, message="integration not found", status_code=status.HTTP_404_NOT_FOUND)


class ProductSyncPayloadInvalid(AppException):
    def __init__(self) -> None:
        super().__init__(code=4011, message="product sync payload invalid", status_code=status.HTTP_400_BAD_REQUEST)


class TenantNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4012, message="tenant not found", status_code=status.HTTP_404_NOT_FOUND)


class TenantCodeAlreadyExists(AppException):
    def __init__(self) -> None:
        super().__init__(code=4013, message="tenant code already exists", status_code=status.HTTP_409_CONFLICT)


class ShopCodeAlreadyExists(AppException):
    def __init__(self) -> None:
        super().__init__(code=4014, message="shop code already exists", status_code=status.HTTP_409_CONFLICT)


class PlatformUnauthorized(AppException):
    def __init__(self) -> None:
        super().__init__(code=4015, message="platform unauthorized", status_code=status.HTTP_401_UNAUTHORIZED)


class SourceProductNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4016, message="source product not found", status_code=status.HTTP_404_NOT_FOUND)


class ChannelProductNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4017, message="channel product not found", status_code=status.HTTP_404_NOT_FOUND)


class PlatformAdminNotFound(AppException):
    def __init__(self) -> None:
        super().__init__(code=4018, message="platform admin not found", status_code=status.HTTP_404_NOT_FOUND)


class PlatformPasswordInvalid(AppException):
    def __init__(self) -> None:
        super().__init__(code=4019, message="current password invalid", status_code=status.HTTP_400_BAD_REQUEST)


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(code=exc.code, message=exc.message, data=None).model_dump(),
    )


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(code=5000, message="internal server error", data=None).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
