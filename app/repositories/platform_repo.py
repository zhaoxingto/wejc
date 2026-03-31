from datetime import datetime, timedelta, timezone

from sqlalchemy import String, case, func, select
from sqlalchemy.orm import Session

from app.models.customer import ChannelOrder, ChannelOrderItem, OrderPushTask
from app.models.integration import Integration, OrderPushLog
from app.models.platform_alert_case import PlatformAlertCase
from app.models.platform_audit_log import PlatformAuditLog
from app.models.product import ChannelProduct, SourceProduct
from app.models.shop import Shop
from app.models.tenant import Tenant
from app.repositories.base import BaseRepository


class PlatformRepository(BaseRepository):
    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def get_dashboard(self) -> dict:
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        trend_start = today_start - timedelta(days=6)

        pending_stmt = select(func.count()).select_from(OrderPushTask).where(OrderPushTask.status == "pending")
        retrying_stmt = select(func.count()).select_from(OrderPushTask).where(OrderPushTask.status == "retrying")
        push_success_stmt = select(func.count()).select_from(OrderPushLog).where(OrderPushLog.success.is_(True))
        push_failure_stmt = select(func.count()).select_from(OrderPushLog).where(OrderPushLog.success.is_(False))
        today_order_stmt = select(func.count()).select_from(ChannelOrder).where(ChannelOrder.created_at >= today_start)
        today_push_success_stmt = (
            select(func.count()).select_from(OrderPushLog).where(OrderPushLog.success.is_(True), OrderPushLog.created_at >= today_start)
        )
        today_push_failure_stmt = (
            select(func.count()).select_from(OrderPushLog).where(OrderPushLog.success.is_(False), OrderPushLog.created_at >= today_start)
        )

        order_trend_stmt = (
            select(
                func.date(ChannelOrder.created_at).label("day"),
                func.count(ChannelOrder.id).label("value"),
            )
            .where(ChannelOrder.created_at >= trend_start)
            .group_by(func.date(ChannelOrder.created_at))
            .order_by(func.date(ChannelOrder.created_at).asc())
        )
        push_trend_stmt = (
            select(
                func.date(OrderPushLog.created_at).label("day"),
                func.sum(case((OrderPushLog.success.is_(True), 1), else_=0)).label("success_count"),
                func.sum(case((OrderPushLog.success.is_(False), 1), else_=0)).label("failure_count"),
            )
            .where(OrderPushLog.created_at >= trend_start)
            .group_by(func.date(OrderPushLog.created_at))
            .order_by(func.date(OrderPushLog.created_at).asc())
        )
        alert_shop_value = (
            func.sum(case((OrderPushTask.status.in_(["pending", "retrying"]), 1), else_=0))
            + func.sum(case((OrderPushLog.success.is_(False), 1), else_=0))
        )
        top_alert_shops_stmt = (
            select(
                Shop.name.label("label"),
                alert_shop_value.label("value"),
            )
            .join(OrderPushTask, OrderPushTask.shop_id == Shop.id)
            .outerjoin(OrderPushLog, OrderPushLog.task_id == OrderPushTask.id)
            .group_by(Shop.id, Shop.name)
            .order_by(alert_shop_value.desc())
            .limit(5)
        )
        integration_failure_value = func.sum(case((OrderPushLog.success.is_(False), 1), else_=0))
        top_failing_integrations_stmt = (
            select(
                Integration.name.label("label"),
                integration_failure_value.label("value"),
            )
            .join(OrderPushTask, OrderPushTask.integration_id == Integration.id)
            .outerjoin(OrderPushLog, OrderPushLog.task_id == OrderPushTask.id)
            .group_by(Integration.id, Integration.name)
            .having(integration_failure_value > 0)
            .order_by(integration_failure_value.desc())
            .limit(5)
        )

        order_trend_rows = {str(row.day): row.value for row in self.session.execute(order_trend_stmt)}
        push_trend_rows = {
            str(row.day): {
                "success_count": int(row.success_count or 0),
                "failure_count": int(row.failure_count or 0),
            }
            for row in self.session.execute(push_trend_stmt)
        }
        daily_order_trend = []
        daily_push_trend = []
        for offset in range(7):
            day = today_start - timedelta(days=6 - offset)
            day_key = day.date().isoformat()
            daily_order_trend.append({"date": day_key, "value": int(order_trend_rows.get(day_key, 0))})
            push_values = push_trend_rows.get(day_key, {"success_count": 0, "failure_count": 0})
            daily_push_trend.append({"date": day_key, **push_values})

        top_alert_shops = [
            {"label": row.label, "value": int(row.value or 0)}
            for row in self.session.execute(top_alert_shops_stmt)
            if row.label and int(row.value or 0) > 0
        ]
        top_failing_integrations = [
            {"label": row.label, "value": int(row.value or 0)}
            for row in self.session.execute(top_failing_integrations_stmt)
            if row.label and int(row.value or 0) > 0
        ]

        unresolved_alert_count = (
            self.session.execute(pending_stmt).scalar_one()
            + self.session.execute(retrying_stmt).scalar_one()
            + self.session.execute(push_failure_stmt).scalar_one()
            + self.session.execute(select(func.count()).select_from(SourceProduct).where(SourceProduct.sync_status != "synced")).scalar_one()
        )

        return {
            "tenant_count": self.session.execute(select(func.count()).select_from(Tenant)).scalar_one(),
            "shop_count": self.session.execute(select(func.count()).select_from(Shop)).scalar_one(),
            "integration_count": self.session.execute(select(func.count()).select_from(Integration)).scalar_one(),
            "source_product_count": self.session.execute(select(func.count()).select_from(SourceProduct)).scalar_one(),
            "order_count": self.session.execute(select(func.count()).select_from(ChannelOrder)).scalar_one(),
            "pending_push_task_count": self.session.execute(pending_stmt).scalar_one(),
            "retrying_push_task_count": self.session.execute(retrying_stmt).scalar_one(),
            "push_success_log_count": self.session.execute(push_success_stmt).scalar_one(),
            "push_failure_log_count": self.session.execute(push_failure_stmt).scalar_one(),
            "today_order_count": self.session.execute(today_order_stmt).scalar_one(),
            "today_push_success_count": self.session.execute(today_push_success_stmt).scalar_one(),
            "today_push_failure_count": self.session.execute(today_push_failure_stmt).scalar_one(),
            "unresolved_alert_count": unresolved_alert_count,
            "daily_order_trend": daily_order_trend,
            "daily_push_trend": daily_push_trend,
            "top_alert_shops": top_alert_shops,
            "top_failing_integrations": top_failing_integrations,
        }

    def list_tenants(self) -> list[dict]:
        shop_count = (
            select(Shop.tenant_id.label("tenant_id"), func.count(Shop.id).label("shop_count"))
            .group_by(Shop.tenant_id)
            .subquery()
        )
        integration_count = (
            select(Integration.tenant_id.label("tenant_id"), func.count(Integration.id).label("integration_count"))
            .group_by(Integration.tenant_id)
            .subquery()
        )
        stmt = (
            select(
                Tenant.id,
                Tenant.tenant_code,
                Tenant.name,
                Tenant.status,
                Tenant.contact_name,
                Tenant.mobile,
                Tenant.created_at,
                Tenant.updated_at,
                func.coalesce(shop_count.c.shop_count, 0).label("shop_count"),
                func.coalesce(integration_count.c.integration_count, 0).label("integration_count"),
            )
            .outerjoin(shop_count, shop_count.c.tenant_id == Tenant.id)
            .outerjoin(integration_count, integration_count.c.tenant_id == Tenant.id)
            .order_by(Tenant.id.asc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_shops(self) -> list[dict]:
        default_integration = Integration.__table__.alias("default_integration")
        stmt = (
            select(
                Shop.id,
                Shop.tenant_id,
                Tenant.name.label("tenant_name"),
                Shop.shop_code,
                Shop.name,
                Shop.status,
                Shop.default_integration_id,
                default_integration.c.name.label("default_integration_name"),
                Shop.theme_json,
                Shop.created_at,
                Shop.updated_at,
            )
            .join(Tenant, Tenant.id == Shop.tenant_id)
            .outerjoin(default_integration, default_integration.c.id == Shop.default_integration_id)
            .order_by(Shop.id.asc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_integrations(self) -> list[dict]:
        stmt = (
            select(
                Integration.id,
                Integration.tenant_id,
                Tenant.name.label("tenant_name"),
                Integration.name,
                Integration.integration_type,
                Integration.status,
                Integration.product_sync_enabled,
                Integration.order_push_enabled,
                Integration.api_base_url,
                Integration.updated_at,
            )
            .join(Tenant, Tenant.id == Integration.tenant_id)
            .order_by(Integration.id.asc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_source_products(self) -> list[dict]:
        stmt = (
            select(
                SourceProduct.id,
                SourceProduct.tenant_id,
                Tenant.name.label("tenant_name"),
                SourceProduct.integration_id,
                Integration.name.label("integration_name"),
                SourceProduct.source_product_id,
                SourceProduct.source_type,
                SourceProduct.sku_mode,
                SourceProduct.name,
                SourceProduct.sync_status,
                SourceProduct.last_sync_at,
                SourceProduct.updated_at,
            )
            .join(Tenant, Tenant.id == SourceProduct.tenant_id)
            .outerjoin(Integration, Integration.id == SourceProduct.integration_id)
            .order_by(SourceProduct.updated_at.desc(), SourceProduct.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_orders(self) -> list[dict]:
        item_count = (
            select(ChannelOrderItem.order_id.label("order_id"), func.count(ChannelOrderItem.id).label("item_count"))
            .group_by(ChannelOrderItem.order_id)
            .subquery()
        )
        stmt = (
            select(
                ChannelOrder.id,
                ChannelOrder.tenant_id,
                Tenant.name.label("tenant_name"),
                ChannelOrder.shop_id,
                Shop.name.label("shop_name"),
                ChannelOrder.customer_id,
                ChannelOrder.order_no,
                ChannelOrder.status,
                ChannelOrder.push_status,
                ChannelOrder.total_amount,
                func.coalesce(item_count.c.item_count, 0).label("item_count"),
                ChannelOrder.created_at,
            )
            .join(Tenant, Tenant.id == ChannelOrder.tenant_id)
            .join(Shop, Shop.id == ChannelOrder.shop_id)
            .outerjoin(item_count, item_count.c.order_id == ChannelOrder.id)
            .order_by(ChannelOrder.created_at.desc(), ChannelOrder.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_push_tasks(self) -> list[dict]:
        stmt = (
            select(
                OrderPushTask.id,
                OrderPushTask.tenant_id,
                Tenant.name.label("tenant_name"),
                OrderPushTask.shop_id,
                Shop.name.label("shop_name"),
                OrderPushTask.order_id,
                ChannelOrder.order_no,
                OrderPushTask.integration_id,
                Integration.name.label("integration_name"),
                OrderPushTask.status,
                OrderPushTask.retry_count,
                OrderPushTask.next_retry_at,
                OrderPushTask.last_error,
                OrderPushTask.updated_at,
            )
            .join(Tenant, Tenant.id == OrderPushTask.tenant_id)
            .join(Shop, Shop.id == OrderPushTask.shop_id)
            .join(ChannelOrder, ChannelOrder.id == OrderPushTask.order_id)
            .outerjoin(Integration, Integration.id == OrderPushTask.integration_id)
            .order_by(
                case((OrderPushTask.status == "retrying", 0), (OrderPushTask.status == "pending", 1), else_=2),
                OrderPushTask.updated_at.desc(),
            )
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_push_logs(self) -> list[dict]:
        stmt = (
            select(
                OrderPushLog.id,
                OrderPushLog.tenant_id,
                Tenant.name.label("tenant_name"),
                OrderPushLog.shop_id,
                Shop.name.label("shop_name"),
                OrderPushLog.order_id,
                ChannelOrder.order_no,
                OrderPushLog.task_id,
                OrderPushLog.success,
                OrderPushLog.pushed_at,
                OrderPushLog.created_at,
            )
            .join(Tenant, Tenant.id == OrderPushLog.tenant_id)
            .join(Shop, Shop.id == OrderPushLog.shop_id)
            .join(ChannelOrder, ChannelOrder.id == OrderPushLog.order_id)
            .order_by(OrderPushLog.created_at.desc(), OrderPushLog.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_channel_products(self) -> list[dict]:
        stmt = (
            select(
                ChannelProduct.id,
                ChannelProduct.tenant_id,
                Tenant.name.label("tenant_name"),
                ChannelProduct.shop_id,
                Shop.name.label("shop_name"),
                ChannelProduct.source_product_id,
                SourceProduct.name.label("source_product_name"),
                ChannelProduct.title,
                ChannelProduct.subtitle,
                ChannelProduct.status,
                ChannelProduct.sort_no,
                ChannelProduct.updated_at,
            )
            .join(Tenant, Tenant.id == ChannelProduct.tenant_id)
            .join(Shop, Shop.id == ChannelProduct.shop_id)
            .outerjoin(SourceProduct, SourceProduct.id == ChannelProduct.source_product_id)
            .order_by(ChannelProduct.updated_at.desc(), ChannelProduct.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_integration_health_rows(self) -> list[dict]:
        latest_sync = (
            select(
                SourceProduct.integration_id.label("integration_id"),
                func.max(SourceProduct.last_sync_at).label("last_product_sync_at"),
            )
            .where(SourceProduct.integration_id.is_not(None))
            .group_by(SourceProduct.integration_id)
            .subquery()
        )
        push_log_stats = (
            select(
                OrderPushTask.integration_id.label("integration_id"),
                func.max(func.coalesce(OrderPushLog.pushed_at, OrderPushLog.created_at)).label("last_push_at"),
                func.count(OrderPushLog.id).label("push_log_count"),
                func.sum(case((OrderPushLog.success.is_(True), 1), else_=0)).label("push_success_count"),
                func.sum(case((OrderPushLog.success.is_(False), 1), else_=0)).label("push_failure_count"),
            )
            .join(OrderPushLog, OrderPushLog.task_id == OrderPushTask.id)
            .where(OrderPushTask.integration_id.is_not(None))
            .group_by(OrderPushTask.integration_id)
            .subquery()
        )
        open_alert_counts = (
            select(
                PlatformAlertCase.resource_id.label("resource_id"),
                PlatformAlertCase.resource_type.label("resource_type"),
            )
            .where(PlatformAlertCase.status == "open")
            .subquery()
        )
        push_task_alert_counts = (
            select(
                OrderPushTask.integration_id.label("integration_id"),
                func.count(OrderPushTask.id).label("open_alert_count"),
            )
            .outerjoin(
                open_alert_counts,
                (open_alert_counts.c.resource_type == "order_push_task")
                & (open_alert_counts.c.resource_id == func.cast(OrderPushTask.id, String)),
            )
            .where(
                OrderPushTask.integration_id.is_not(None),
                OrderPushTask.status.in_(["pending", "retrying"]),
                open_alert_counts.c.resource_id.is_(None),
            )
            .group_by(OrderPushTask.integration_id)
            .subquery()
        )
        stmt = (
            select(
                Integration.id.label("integration_id"),
                Integration.tenant_id,
                Tenant.name.label("tenant_name"),
                Integration.name.label("integration_name"),
                Integration.integration_type,
                Integration.status,
                Integration.api_base_url,
                Integration.config_json,
                latest_sync.c.last_product_sync_at,
                push_log_stats.c.last_push_at,
                func.coalesce(push_log_stats.c.push_log_count, 0).label("push_log_count"),
                func.coalesce(push_log_stats.c.push_success_count, 0).label("push_success_count"),
                func.coalesce(push_log_stats.c.push_failure_count, 0).label("push_failure_count"),
                func.coalesce(push_task_alert_counts.c.open_alert_count, 0).label("open_alert_count"),
            )
            .join(Tenant, Tenant.id == Integration.tenant_id)
            .outerjoin(latest_sync, latest_sync.c.integration_id == Integration.id)
            .outerjoin(push_log_stats, push_log_stats.c.integration_id == Integration.id)
            .outerjoin(push_task_alert_counts, push_task_alert_counts.c.integration_id == Integration.id)
            .order_by(Integration.updated_at.desc(), Integration.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def list_audit_logs(self) -> list[dict]:
        stmt = (
            select(
                PlatformAuditLog.id,
                PlatformAuditLog.admin_id,
                PlatformAuditLog.admin_username,
                PlatformAuditLog.action,
                PlatformAuditLog.resource_type,
                PlatformAuditLog.resource_id,
                PlatformAuditLog.summary,
                PlatformAuditLog.detail_json,
                PlatformAuditLog.created_at,
            )
            .order_by(PlatformAuditLog.created_at.desc(), PlatformAuditLog.id.desc())
        )
        return list(self.session.execute(stmt).mappings().all())

    def get_alert_case(self, resource_type: str, resource_id: str) -> PlatformAlertCase | None:
        stmt = select(PlatformAlertCase).where(
            PlatformAlertCase.resource_type == resource_type,
            PlatformAlertCase.resource_id == resource_id,
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_tenant_by_id(self, tenant_id: int) -> Tenant | None:
        return self.session.get(Tenant, tenant_id)

    def get_tenant_by_code(self, tenant_code: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.tenant_code == tenant_code)
        return self.session.execute(stmt).scalar_one_or_none()

    def add_tenant(self, tenant: Tenant) -> None:
        self.session.add(tenant)

    def get_shop_by_id(self, shop_id: int) -> Shop | None:
        return self.session.get(Shop, shop_id)

    def get_shop_by_code(self, shop_code: str) -> Shop | None:
        stmt = select(Shop).where(Shop.shop_code == shop_code)
        return self.session.execute(stmt).scalar_one_or_none()

    def add_shop(self, shop: Shop) -> None:
        self.session.add(shop)

    def get_integration_by_id_any_status(self, integration_id: int) -> Integration | None:
        return self.session.get(Integration, integration_id)

    def add_integration(self, integration: Integration) -> None:
        self.session.add(integration)

    def add_audit_log(self, audit_log: PlatformAuditLog) -> None:
        self.session.add(audit_log)

    def add_alert_case(self, alert_case: PlatformAlertCase) -> None:
        self.session.add(alert_case)
