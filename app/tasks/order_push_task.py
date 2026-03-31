from app.services.order_push_service import OrderPushService


def run_order_push_tasks(service: OrderPushService) -> int:
    return service.execute_pending_tasks()
