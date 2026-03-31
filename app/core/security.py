import base64
import hashlib
import hmac
import json
import secrets

from app.core.config import get_settings
from app.core.context import RequestContext
from app.core.exceptions import InvalidStoreContextToken, PlatformUnauthorized


class StoreContextTokenManager:
    def __init__(self, secret_key: str) -> None:
        self.secret_key = secret_key.encode("utf-8")

    def dumps(self, context: RequestContext) -> str:
        payload = {
            "tenant_id": context.tenant_id,
            "shop_id": context.shop_id,
            "shop_code": context.shop_code,
        }
        payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        payload_token = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
        signature = hmac.new(self.secret_key, payload_token.encode("utf-8"), hashlib.sha256).digest()
        signature_token = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
        return f"{payload_token}.{signature_token}"

    def loads(self, token: str) -> RequestContext:
        try:
            payload_token, signature_token = token.split(".", maxsplit=1)
        except ValueError as exc:
            raise InvalidStoreContextToken() from exc

        expected_signature = hmac.new(
            self.secret_key,
            payload_token.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        expected_signature_token = base64.urlsafe_b64encode(expected_signature).decode("utf-8").rstrip("=")
        if not hmac.compare_digest(signature_token, expected_signature_token):
            raise InvalidStoreContextToken()

        padding = "=" * (-len(payload_token) % 4)
        try:
            payload = json.loads(base64.urlsafe_b64decode(f"{payload_token}{padding}").decode("utf-8"))
        except (ValueError, json.JSONDecodeError) as exc:
            raise InvalidStoreContextToken() from exc

        return RequestContext(
            tenant_id=payload.get("tenant_id"),
            shop_id=payload.get("shop_id"),
            shop_code=payload.get("shop_code"),
            store_context_token=token,
        )


def get_store_context_token_manager() -> StoreContextTokenManager:
    settings = get_settings()
    return StoreContextTokenManager(settings.secret_key)


class PlatformAdminTokenManager:
    def __init__(self, secret_key: str) -> None:
        self.secret_key = secret_key.encode("utf-8")

    def dumps(self, admin_id: int, username: str) -> str:
        payload = {"role": "platform_admin", "admin_id": admin_id, "username": username}
        payload_token = base64.urlsafe_b64encode(
            json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        ).decode("utf-8").rstrip("=")
        signature = hmac.new(self.secret_key, payload_token.encode("utf-8"), hashlib.sha256).digest()
        signature_token = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
        return f"{payload_token}.{signature_token}"

    def loads(self, token: str) -> dict[str, str | int]:
        try:
            payload_token, signature_token = token.split(".", maxsplit=1)
        except ValueError as exc:
            raise PlatformUnauthorized() from exc

        expected_signature = hmac.new(self.secret_key, payload_token.encode("utf-8"), hashlib.sha256).digest()
        expected_signature_token = base64.urlsafe_b64encode(expected_signature).decode("utf-8").rstrip("=")
        if not hmac.compare_digest(signature_token, expected_signature_token):
            raise PlatformUnauthorized()

        padding = "=" * (-len(payload_token) % 4)
        try:
            payload = json.loads(base64.urlsafe_b64decode(f"{payload_token}{padding}").decode("utf-8"))
        except (ValueError, json.JSONDecodeError) as exc:
            raise PlatformUnauthorized() from exc

        if payload.get("role") != "platform_admin":
            raise PlatformUnauthorized()
        return payload


def get_platform_admin_token_manager() -> PlatformAdminTokenManager:
    settings = get_settings()
    return PlatformAdminTokenManager(settings.secret_key)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, expected = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()
    return hmac.compare_digest(actual, expected)
