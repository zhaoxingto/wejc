import httpx

from app.core.config import get_settings
from app.models.integration import Integration


class IntegrationService:
    def __init__(self, timeout_seconds: float | None = None) -> None:
        settings = get_settings()
        self.timeout_seconds = timeout_seconds
        if self.timeout_seconds is None:
            self.timeout_seconds = settings.erp_timeout

    def push_order(self, integration: Integration, payload: dict) -> dict:
        if not integration.api_base_url:
            return {"status": "skipped", "reason": "missing api_base_url"}

        headers = {}
        if integration.api_key:
            headers["X-API-Key"] = integration.api_key

        response = httpx.post(
            f"{integration.api_base_url.rstrip('/')}/orders/push",
            json=payload,
            headers=headers,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        try:
            return response.json()
        except ValueError:
            return {"status": "ok", "raw_text": response.text}

    def pull_products(self, integration: Integration) -> dict | list:
        if not integration.api_base_url:
            if integration.config_json and isinstance(integration.config_json.get("demo_products"), list):
                return {"items": integration.config_json["demo_products"]}
            return {"items": []}

        headers = {}
        if integration.api_key:
            headers["X-API-Key"] = integration.api_key

        response = httpx.post(
            f"{integration.api_base_url.rstrip('/')}/products/pull",
            headers=headers,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        try:
            return response.json()
        except ValueError:
            return {"items": []}
