import time
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    IntegrationNotFound,
    OrderPushTaskNotFound,
    ShopCodeAlreadyExists,
    ShopNotFound,
    SourceProductNotFound,
    TenantCodeAlreadyExists,
    TenantNotFound,
)
from app.core.store_theme import build_theme_storage
from app.models.integration import Integration
from app.models.platform_admin import PlatformAdmin
from app.models.platform_alert_case import PlatformAlertCase
from app.models.platform_audit_log import PlatformAuditLog
from app.models.product import ChannelProduct
from app.models.shop import Shop
from app.models.tenant import Tenant
from app.repositories.order_repo import OrderRepository
from app.repositories.platform_repo import PlatformRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.shop_repo import ShopRepository
from app.schemas.platform import (
    PlatformAlertHandleRequest,
    PlatformAlertRead,
    PlatformAlertSummaryRead,
    PlatformAuditLogRead,
    PlatformChannelProductRead,
    PlatformDashboardRead,
    PlatformIntegrationHealthRead,
    PlatformIntegrationRead,
    PlatformIntegrationWrite,
    PlatformOrderRead,
    PlatformPage,
    PlatformPublishSourceProductRequest,
    PlatformPushLogRead,
    PlatformPushTaskRead,
    PlatformShopRead,
    PlatformShopWrite,
    PlatformSourceProductRead,
    PlatformTenantRead,
    PlatformTenantWrite,
)
from app.services.order_push_service import OrderPushService


class PlatformService:
    def __init__(
        self,
        session: Session,
        platform_repository: PlatformRepository,
        product_repository: ProductRepository,
        shop_repository: ShopRepository,
        order_repository: OrderRepository,
        order_push_service: OrderPushService,
    ) -> None:
        self.session = session
        self.platform_repository = platform_repository
        self.product_repository = product_repository
        self.shop_repository = shop_repository
        self.order_repository = order_repository
        self.order_push_service = order_push_service

    def get_dashboard(self) -> PlatformDashboardRead:
        return PlatformDashboardRead(**self.platform_repository.get_dashboard())

    def list_tenants(self) -> list[PlatformTenantRead]:
        return [PlatformTenantRead(**row) for row in self.platform_repository.list_tenants()]

    def list_shops(self) -> list[PlatformShopRead]:
        return [PlatformShopRead(**row) for row in self.platform_repository.list_shops()]

    def list_integrations(self) -> list[PlatformIntegrationRead]:
        return [PlatformIntegrationRead(**row) for row in self.platform_repository.list_integrations()]

    def list_source_products(self) -> list[PlatformSourceProductRead]:
        return [PlatformSourceProductRead(**row) for row in self.platform_repository.list_source_products()]

    def list_orders(self) -> list[PlatformOrderRead]:
        return [PlatformOrderRead(**row) for row in self.platform_repository.list_orders()]

    def list_push_tasks(self) -> list[PlatformPushTaskRead]:
        return [PlatformPushTaskRead(**row) for row in self.platform_repository.list_push_tasks()]

    def list_push_logs(self) -> list[PlatformPushLogRead]:
        return [PlatformPushLogRead(**row) for row in self.platform_repository.list_push_logs()]

    def list_channel_products(self) -> list[PlatformChannelProductRead]:
        return [PlatformChannelProductRead(**row) for row in self.platform_repository.list_channel_products()]

    def list_audit_logs(self) -> list[PlatformAuditLogRead]:
        return [PlatformAuditLogRead(**row) for row in self.platform_repository.list_audit_logs()]

    def list_integration_health(self) -> list[PlatformIntegrationHealthRead]:
        rows = self.platform_repository.list_integration_health_rows()
        result: list[PlatformIntegrationHealthRead] = []
        for row in rows:
            push_log_count = int(row["push_log_count"] or 0)
            push_success_count = int(row["push_success_count"] or 0)
            push_failure_count = int(row["push_failure_count"] or 0)
            open_alert_count = int(row["open_alert_count"] or 0)
            has_demo_products = bool((row["config_json"] or {}).get("demo_products")) if isinstance(row["config_json"], dict) else False

            if row["status"] != "active":
                connectivity_status = "disabled"
                health_status = "disabled"
            elif row["api_base_url"] or has_demo_products:
                connectivity_status = "reachable"
                health_status = "critical" if open_alert_count > 0 or push_failure_count > 0 else "healthy"
            else:
                connectivity_status = "missing_config"
                health_status = "warning"

            push_success_rate = round((push_success_count / push_log_count) * 100, 2) if push_log_count else 100.0
            result.append(
                PlatformIntegrationHealthRead(
                    integration_id=row["integration_id"],
                    tenant_id=row["tenant_id"],
                    tenant_name=row["tenant_name"],
                    integration_name=row["integration_name"],
                    integration_type=row["integration_type"],
                    status=row["status"],
                    connectivity_status=connectivity_status,
                    health_status=health_status,
                    last_product_sync_at=row["last_product_sync_at"],
                    last_push_at=row["last_push_at"],
                    push_success_rate=push_success_rate,
                    open_alert_count=open_alert_count,
                )
            )
        return result

    def list_alerts(self) -> list[PlatformAlertRead]:
        alerts: list[PlatformAlertRead] = []

        for task in self.list_push_tasks():
            alerts.append(
                PlatformAlertRead(
                    id=f"push-task:{task.id}",
                    category="push_task",
                    severity="critical" if task.status == "retrying" else "warning",
                    tenant_name=task.tenant_name,
                    shop_name=task.shop_name,
                    title="推送任务重试中" if task.status == "retrying" else "推送任务待处理",
                    detail=task.last_error or f"订单 {task.order_no} 正在等待推送",
                    resource_type="order_push_task",
                    resource_id=str(task.id),
                    happened_at=task.updated_at,
                )
            )

        for log in self.list_push_logs():
            if log.success:
                continue
            alerts.append(
                PlatformAlertRead(
                    id=f"push-log:{log.id}",
                    category="push_log",
                    severity="critical",
                    tenant_name=log.tenant_name,
                    shop_name=log.shop_name,
                    title="推送日志失败",
                    detail=f"订单 {log.order_no} 的推送日志 {log.id} 执行失败",
                    resource_type="order_push_log",
                    resource_id=str(log.id),
                    happened_at=log.pushed_at or log.created_at,
                )
            )

        for product in self.list_source_products():
            if product.sync_status == "synced":
                continue
            alerts.append(
                PlatformAlertRead(
                    id=f"source-product:{product.id}",
                    category="product_sync",
                    severity="warning",
                    tenant_name=product.tenant_name,
                    shop_name=None,
                    title="源商品同步异常",
                    detail=f"{product.name} 的同步状态为 {product.sync_status}",
                    resource_type="source_product",
                    resource_id=str(product.id),
                    happened_at=product.last_sync_at or product.updated_at,
                )
            )

        for alert in alerts:
            alert_case = self.platform_repository.get_alert_case(alert.resource_type, alert.resource_id)
            if alert_case is None:
                continue
            alert.handling_status = alert_case.status
            alert.handling_note = alert_case.note
            alert.handled_by_username = alert_case.handled_by_username
            alert.handled_at = alert_case.handled_at

        alerts.sort(key=lambda item: (item.happened_at is not None, item.happened_at), reverse=True)
        return alerts

    def get_alert_summary(self) -> PlatformAlertSummaryRead:
        open_alerts = [item for item in self.list_alerts() if item.handling_status == "open"]
        return PlatformAlertSummaryRead(
            total=len(open_alerts),
            critical_count=sum(1 for item in open_alerts if item.severity == "critical"),
            warning_count=sum(1 for item in open_alerts if item.severity == "warning"),
            push_task_issue_count=sum(1 for item in open_alerts if item.category == "push_task"),
            push_log_failure_count=sum(1 for item in open_alerts if item.category == "push_log"),
            product_sync_issue_count=sum(1 for item in open_alerts if item.category == "product_sync"),
        )

    def list_channel_products_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(
            self.list_channel_products(),
            q,
            page,
            page_size,
            ["tenant_name", "shop_name", "title", "source_product_name", "status"],
        )

    def list_tenants_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(self.list_tenants(), q, page, page_size, ["tenant_code", "name", "contact_name", "mobile"])

    def list_shops_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(self.list_shops(), q, page, page_size, ["tenant_name", "shop_code", "name", "default_integration_name"])

    def list_integrations_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(self.list_integrations(), q, page, page_size, ["tenant_name", "name", "integration_type", "api_base_url"])

    def list_integration_health_page(
        self,
        q: str | None,
        page: int,
        page_size: int,
        tenant_id: int | None = None,
        status: str | None = None,
        connectivity_status: str | None = None,
        health_status: str | None = None,
    ) -> PlatformPage:
        items = self._filter_exact(
            self.list_integration_health(),
            tenant_id=tenant_id,
            status=status,
            connectivity_status=connectivity_status,
            health_status=health_status,
        )
        return self._paginate(
            items,
            q,
            page,
            page_size,
            [
                "tenant_name",
                "integration_name",
                "integration_type",
                "status",
                "connectivity_status",
                "health_status",
            ],
        )

    def list_source_products_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(self.list_source_products(), q, page, page_size, ["tenant_name", "integration_name", "source_product_id", "name", "source_type", "sync_status"])

    def list_orders_page(
        self,
        q: str | None,
        page: int,
        page_size: int,
        tenant_id: int | None = None,
        shop_id: int | None = None,
        status: str | None = None,
        push_status: str | None = None,
    ) -> PlatformPage:
        items = self._filter_exact(
            self.list_orders(),
            tenant_id=tenant_id,
            shop_id=shop_id,
            status=status,
            push_status=push_status,
        )
        return self._paginate(items, q, page, page_size, ["tenant_name", "shop_name", "order_no", "status", "push_status"])

    def list_push_tasks_page(
        self,
        q: str | None,
        page: int,
        page_size: int,
        tenant_id: int | None = None,
        shop_id: int | None = None,
        integration_id: int | None = None,
        status: str | None = None,
    ) -> PlatformPage:
        items = self._filter_exact(
            self.list_push_tasks(),
            tenant_id=tenant_id,
            shop_id=shop_id,
            integration_id=integration_id,
            status=status,
        )
        return self._paginate(items, q, page, page_size, ["tenant_name", "shop_name", "order_no", "integration_name", "last_error", "status"])

    def list_push_logs_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(self.list_push_logs(), q, page, page_size, ["tenant_name", "shop_name", "order_no"])

    def list_audit_logs_page(self, q: str | None, page: int, page_size: int) -> PlatformPage:
        return self._paginate(
            self.list_audit_logs(),
            q,
            page,
            page_size,
            ["admin_username", "action", "resource_type", "resource_id", "summary"],
        )

    def list_alerts_page(
        self,
        q: str | None,
        page: int,
        page_size: int,
        category: str | None = None,
        severity: str | None = None,
        handling_status: str | None = None,
    ) -> PlatformPage:
        items = self._filter_exact(
            self.list_alerts(),
            category=category,
            severity=severity,
            handling_status=handling_status,
        )
        return self._paginate(
            items,
            q,
            page,
            page_size,
            [
                "category",
                "severity",
                "tenant_name",
                "shop_name",
                "title",
                "detail",
                "resource_type",
                "resource_id",
                "handling_status",
                "handling_note",
                "handled_by_username",
            ],
        )

    def create_tenant(self, admin: PlatformAdmin, payload: PlatformTenantWrite) -> PlatformTenantRead:
        if self.platform_repository.get_tenant_by_code(payload.tenant_code) is not None:
            raise TenantCodeAlreadyExists()

        tenant = Tenant(
            id=self._next_id(),
            tenant_code=payload.tenant_code,
            name=payload.name,
            status=payload.status,
            contact_name=payload.contact_name,
            mobile=payload.mobile,
        )
        self.platform_repository.add_tenant(tenant)
        self.session.commit()
        self._record_audit(admin, "tenant.create", "tenant", tenant.id, f"新建租户：{tenant.name}", payload.model_dump())
        return self.list_tenants()[-1]

    def update_tenant(self, admin: PlatformAdmin, tenant_id: int, payload: PlatformTenantWrite) -> PlatformTenantRead:
        tenant = self.platform_repository.get_tenant_by_id(tenant_id)
        if tenant is None:
            raise TenantNotFound()

        existing = self.platform_repository.get_tenant_by_code(payload.tenant_code)
        if existing is not None and existing.id != tenant_id:
            raise TenantCodeAlreadyExists()

        tenant.tenant_code = payload.tenant_code
        tenant.name = payload.name
        tenant.status = payload.status
        tenant.contact_name = payload.contact_name
        tenant.mobile = payload.mobile
        self.session.commit()
        self._record_audit(admin, "tenant.update", "tenant", tenant.id, f"更新租户：{tenant.name}", payload.model_dump())
        return next(item for item in self.list_tenants() if item.id == tenant_id)

    def create_shop(self, admin: PlatformAdmin, payload: PlatformShopWrite) -> PlatformShopRead:
        if self.platform_repository.get_tenant_by_id(payload.tenant_id) is None:
            raise TenantNotFound()
        existing_shop = self.platform_repository.get_shop_by_code(payload.shop_code)
        if existing_shop is not None:
            raise ShopCodeAlreadyExists()
        if payload.default_integration_id is not None:
            integration = self.platform_repository.get_integration_by_id_any_status(payload.default_integration_id)
            if integration is None or integration.tenant_id != payload.tenant_id:
                raise IntegrationNotFound()

        shop = Shop(
            id=self._next_id(),
            tenant_id=payload.tenant_id,
            shop_code=payload.shop_code,
            name=payload.name,
            logo=payload.logo,
            cover=payload.cover,
            intro=payload.intro,
            theme_json=build_theme_storage(
                payload.theme_preset_key,
                payload.theme_colors.model_dump(exclude_none=True) if payload.theme_colors else None,
            ),
            status=payload.status,
            default_integration_id=payload.default_integration_id,
        )
        self.platform_repository.add_shop(shop)
        self.session.commit()
        self._record_audit(admin, "shop.create", "shop", shop.id, f"新建店铺：{shop.name}", payload.model_dump())
        return next(item for item in self.list_shops() if item.id == shop.id)

    def update_shop(self, admin: PlatformAdmin, shop_id: int, payload: PlatformShopWrite) -> PlatformShopRead:
        shop = self.platform_repository.get_shop_by_id(shop_id)
        if shop is None:
            raise ShopNotFound()
        if self.platform_repository.get_tenant_by_id(payload.tenant_id) is None:
            raise TenantNotFound()
        existing_shop = self.platform_repository.get_shop_by_code(payload.shop_code)
        if existing_shop is not None and existing_shop.id != shop_id:
            raise ShopCodeAlreadyExists()
        if payload.default_integration_id is not None:
            integration = self.platform_repository.get_integration_by_id_any_status(payload.default_integration_id)
            if integration is None or integration.tenant_id != payload.tenant_id:
                raise IntegrationNotFound()

        shop.tenant_id = payload.tenant_id
        shop.shop_code = payload.shop_code
        shop.name = payload.name
        shop.logo = payload.logo
        shop.cover = payload.cover
        shop.intro = payload.intro
        shop.theme_json = build_theme_storage(
            payload.theme_preset_key,
            payload.theme_colors.model_dump(exclude_none=True) if payload.theme_colors else None,
        )
        shop.status = payload.status
        shop.default_integration_id = payload.default_integration_id
        self.session.commit()
        self._record_audit(admin, "shop.update", "shop", shop.id, f"更新店铺：{shop.name}", payload.model_dump())
        return next(item for item in self.list_shops() if item.id == shop_id)

    def create_integration(self, admin: PlatformAdmin, payload: PlatformIntegrationWrite) -> PlatformIntegrationRead:
        if self.platform_repository.get_tenant_by_id(payload.tenant_id) is None:
            raise TenantNotFound()

        integration = Integration(
            id=self._next_id(),
            tenant_id=payload.tenant_id,
            name=payload.name,
            integration_type=payload.integration_type,
            api_base_url=payload.api_base_url,
            api_key=payload.api_key,
            api_secret=payload.api_secret,
            status=payload.status,
            product_sync_enabled=payload.product_sync_enabled,
            order_push_enabled=payload.order_push_enabled,
            config_json=payload.config_json,
        )
        self.platform_repository.add_integration(integration)
        self.session.commit()
        self._record_audit(admin, "integration.create", "integration", integration.id, f"新建接入配置：{integration.name}", payload.model_dump())
        return next(item for item in self.list_integrations() if item.id == integration.id)

    def update_integration(self, admin: PlatformAdmin, integration_id: int, payload: PlatformIntegrationWrite) -> PlatformIntegrationRead:
        integration = self.platform_repository.get_integration_by_id_any_status(integration_id)
        if integration is None:
            raise IntegrationNotFound()
        if self.platform_repository.get_tenant_by_id(payload.tenant_id) is None:
            raise TenantNotFound()

        integration.tenant_id = payload.tenant_id
        integration.name = payload.name
        integration.integration_type = payload.integration_type
        integration.api_base_url = payload.api_base_url
        integration.api_key = payload.api_key
        integration.api_secret = payload.api_secret
        integration.status = payload.status
        integration.product_sync_enabled = payload.product_sync_enabled
        integration.order_push_enabled = payload.order_push_enabled
        integration.config_json = payload.config_json
        self.session.commit()
        self._record_audit(admin, "integration.update", "integration", integration.id, f"更新接入配置：{integration.name}", payload.model_dump())
        return next(item for item in self.list_integrations() if item.id == integration_id)

    def publish_source_product(
        self,
        admin: PlatformAdmin,
        source_product_id: int,
        payload: PlatformPublishSourceProductRequest,
    ) -> PlatformChannelProductRead:
        source_product = self.product_repository.get_source_product_by_id(source_product_id)
        if source_product is None:
            raise SourceProductNotFound()
        shop = self.shop_repository.get_by_id(payload.shop_id)
        if shop is None or shop.tenant_id != source_product.tenant_id:
            raise ShopNotFound()

        channel_product = self.product_repository.get_channel_product_by_source_and_shop(source_product_id, payload.shop_id)
        if channel_product is None:
            channel_product = ChannelProduct(
                id=self._next_id(),
                tenant_id=source_product.tenant_id,
                shop_id=payload.shop_id,
                source_product_id=source_product.id,
                title=payload.title or source_product.name,
                subtitle=payload.subtitle,
                cover=None,
                album_json=None,
                category_id=None,
                status=payload.status,
                sort_no=0,
            )
            self.product_repository.add_channel_product(channel_product)
        else:
            channel_product.title = payload.title or source_product.name
            channel_product.subtitle = payload.subtitle
            channel_product.status = payload.status

        self.session.commit()
        self._record_audit(
            admin,
            "source_product.publish",
            "channel_product",
            channel_product.id,
            f"发布源商品 {source_product_id} 到店铺 {payload.shop_id}",
            payload.model_dump(),
        )
        return next(item for item in self.list_channel_products() if item.id == channel_product.id)

    def retry_push_task(self, admin: PlatformAdmin, task_id: int) -> PlatformPushTaskRead:
        task = self.order_repository.get_push_task_by_id(task_id)
        if task is None:
            raise OrderPushTaskNotFound()
        task.status = "pending"
        task.next_retry_at = None
        self.session.commit()
        self.order_push_service.execute_task(task)
        self._record_audit(
            admin,
            "push_task.retry",
            "order_push_task",
            task.id,
            f"重试推送任务：{task.id}",
            {"task_id": task.id, "order_id": task.order_id},
        )
        return next(item for item in self.list_push_tasks() if item.id == task_id)

    def handle_alert(
        self,
        admin: PlatformAdmin,
        resource_type: str,
        resource_id: str,
        payload: PlatformAlertHandleRequest,
    ) -> PlatformAlertRead:
        now = datetime.now(timezone.utc)
        alert_case = self.platform_repository.get_alert_case(resource_type, resource_id)
        if alert_case is None:
            alert_case = PlatformAlertCase(
                id=self._next_id(),
                resource_type=resource_type,
                resource_id=resource_id,
                category=self._infer_alert_category(resource_type),
                status=payload.status,
                note=payload.note,
                handled_by_admin_id=admin.id,
                handled_by_username=admin.username,
                handled_at=now,
            )
            self.platform_repository.add_alert_case(alert_case)
        else:
            alert_case.status = payload.status
            alert_case.note = payload.note
            alert_case.handled_by_admin_id = admin.id
            alert_case.handled_by_username = admin.username
            alert_case.handled_at = now
        self.session.commit()
        self._record_audit(
            admin,
            "alert.handle",
            resource_type,
            resource_id,
            f"处理告警：{resource_type}/{resource_id} -> {payload.status}",
            payload.model_dump(),
        )
        alert = next(item for item in self.list_alerts() if item.resource_type == resource_type and item.resource_id == resource_id)
        return alert

    @staticmethod
    def _infer_alert_category(resource_type: str) -> str:
        mapping = {
            "order_push_task": "push_task",
            "order_push_log": "push_log",
            "source_product": "product_sync",
        }
        return mapping.get(resource_type, "other")

    @staticmethod
    def _next_id() -> int:
        return time.time_ns()

    @staticmethod
    def _filter_exact(items: list, **filters: int | str | None) -> list:
        filtered_items = items
        for field, expected in filters.items():
            if expected is None or expected == "":
                continue
            filtered_items = [
                item
                for item in filtered_items
                if str(getattr(item, field, "") or "") == str(expected)
            ]
        return filtered_items

    @staticmethod
    def _paginate(items: list, q: str | None, page: int, page_size: int, fields: list[str]) -> PlatformPage:
        filtered_items = items
        if q:
            needle = q.lower()
            filtered_items = [
                item
                for item in items
                if any(needle in str(getattr(item, field, "") or "").lower() for field in fields)
            ]

        total = len(filtered_items)
        start = (page - 1) * page_size
        end = start + page_size
        return PlatformPage(items=filtered_items[start:end], total=total, page=page, page_size=page_size)

    def _record_audit(
        self,
        admin: PlatformAdmin,
        action: str,
        resource_type: str,
        resource_id: int | str,
        summary: str,
        detail_json: dict | None,
    ) -> None:
        audit_log = PlatformAuditLog(
            id=self._next_id(),
            admin_id=admin.id,
            admin_username=admin.username,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            summary=summary,
            detail_json=detail_json,
        )
        self.platform_repository.add_audit_log(audit_log)
        self.session.commit()
