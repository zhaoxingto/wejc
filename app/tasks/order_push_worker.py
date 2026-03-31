import time

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.repositories.integration_repo import IntegrationRepository
from app.repositories.order_repo import OrderRepository
from app.services.integration_service import IntegrationService
from app.services.order_push_service import OrderPushService


def run_forever() -> None:
    settings = get_settings()
    while True:
        session = SessionLocal()
        try:
            service = OrderPushService(
                session=session,
                order_repository=OrderRepository(session),
                integration_repository=IntegrationRepository(session),
                integration_service=IntegrationService(),
            )
            service.execute_pending_tasks()
        finally:
            session.close()

        time.sleep(settings.worker_poll_seconds)


if __name__ == "__main__":
    run_forever()
