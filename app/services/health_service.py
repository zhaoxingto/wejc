class HealthService:
    def ping(self) -> dict[str, str]:
        return {"message": "pong"}
