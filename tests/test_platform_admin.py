from datetime import datetime, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.models.bootstrap import Integration, OrderPushLog, OrderPushTask, PlatformAdmin, Shop, SourceProduct


def test_platform_auth_required(client, db_session) -> None:
    db_session.add(
        PlatformAdmin(
            id=15001,
            username="admin",
            password_hash=hash_password("admin123456"),
            display_name="Platform Admin",
            status="active",
        )
    )
    db_session.commit()

    response = client.post("/api/platform/auth/login", json={"username": "admin", "password": "admin123456"})
    assert response.status_code == 200
    assert response.json()["data"]["access_token"]

    unauthorized_response = client.get("/api/platform/dashboard")
    assert unauthorized_response.status_code == 401


def test_platform_change_password_success(client, db_session) -> None:
    db_session.add(
        PlatformAdmin(
            id=15001,
            username="admin",
            password_hash=hash_password("admin123456"),
            display_name="Platform Admin",
            status="active",
        )
    )
    db_session.commit()

    login_response = client.post("/api/platform/auth/login", json={"username": "admin", "password": "admin123456"})
    token = login_response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    change_response = client.post(
        "/api/platform/auth/change-password",
        headers=headers,
        json={"current_password": "admin123456", "new_password": "newpass123"},
    )
    assert change_response.status_code == 200
    assert change_response.json()["data"] is True

    old_login_response = client.post("/api/platform/auth/login", json={"username": "admin", "password": "admin123456"})
    assert old_login_response.status_code == 401

    new_login_response = client.post("/api/platform/auth/login", json={"username": "admin", "password": "newpass123"})
    assert new_login_response.status_code == 200
    assert new_login_response.json()["data"]["access_token"]


def test_platform_dashboard_and_lists_success(
    client,
    db_session,
    platform_auth_headers,
    store_context_token,
    seeded_shop,
    seeded_products,
    seeded_customer,
    seeded_integration,
) -> None:
    shop = db_session.execute(select(Shop).where(Shop.id == seeded_shop["shop_id"])).scalar_one()
    shop.default_integration_id = seeded_integration["integration_id"]
    integration = db_session.execute(select(Integration).where(Integration.id == seeded_integration["integration_id"])).scalar_one()
    integration.product_sync_enabled = True
    db_session.commit()

    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    log = OrderPushLog(
        id=14001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        task_id=task.id,
        order_id=task.order_id,
        request_json={"order_no": "demo"},
        response_json={"status": "ok"},
        success=True,
        pushed_at=datetime(2026, 3, 12, 12, 0, 0, tzinfo=timezone.utc),
    )
    db_session.add(log)
    db_session.commit()

    dashboard = client.get("/api/platform/dashboard", headers=platform_auth_headers)
    assert dashboard.status_code == 200
    dashboard_data = dashboard.json()["data"]
    assert dashboard_data["tenant_count"] == 1
    assert dashboard_data["shop_count"] == 1
    assert dashboard_data["integration_count"] == 1
    assert dashboard_data["source_product_count"] == 1
    assert dashboard_data["order_count"] == 1
    assert dashboard_data["pending_push_task_count"] == 1
    assert dashboard_data["push_success_log_count"] == 1
    assert dashboard_data["today_order_count"] == 1
    assert dashboard_data["today_push_success_count"] == 1
    assert dashboard_data["today_push_failure_count"] == 0
    assert dashboard_data["unresolved_alert_count"] >= 1
    assert len(dashboard_data["daily_order_trend"]) == 7
    assert len(dashboard_data["daily_push_trend"]) == 7

    tenants = client.get("/api/platform/tenants", headers=platform_auth_headers)
    assert tenants.status_code == 200
    assert tenants.json()["data"]["items"][0]["shop_count"] == 1
    assert tenants.json()["data"]["items"][0]["integration_count"] == 1

    shops = client.get("/api/platform/shops", headers=platform_auth_headers)
    assert shops.status_code == 200
    assert shops.json()["data"]["items"][0]["default_integration_name"] == "Default ERP"

    integrations = client.get("/api/platform/integrations", headers=platform_auth_headers)
    assert integrations.status_code == 200
    assert integrations.json()["data"]["items"][0]["tenant_name"] == "Demo Tenant"

    integration_health = client.get("/api/platform/integration-health", headers=platform_auth_headers)
    assert integration_health.status_code == 200
    assert integration_health.json()["data"]["items"][0]["integration_name"] == "Default ERP"
    integration_health_item = integration_health.json()["data"]["items"][0]
    filtered_health = client.get(
        f"/api/platform/integration-health?tenant_id={integration_health_item['tenant_id']}&health_status={integration_health_item['health_status']}",
        headers=platform_auth_headers,
    )
    assert filtered_health.status_code == 200
    assert filtered_health.json()["data"]["total"] == 1

    source_products = client.get("/api/platform/source-products", headers=platform_auth_headers)
    assert source_products.status_code == 200
    assert source_products.json()["data"]["items"][0]["tenant_name"] == "Demo Tenant"

    orders = client.get("/api/platform/orders", headers=platform_auth_headers)
    assert orders.status_code == 200
    assert orders.json()["data"]["items"][0]["shop_name"] is not None
    assert orders.json()["data"]["items"][0]["item_count"] == 1
    order_item = orders.json()["data"]["items"][0]
    filtered_orders = client.get(
        f"/api/platform/orders?tenant_id={order_item['tenant_id']}&shop_id={order_item['shop_id']}&status={order_item['status']}",
        headers=platform_auth_headers,
    )
    assert filtered_orders.status_code == 200
    assert filtered_orders.json()["data"]["total"] == 1

    push_tasks = client.get("/api/platform/push-tasks", headers=platform_auth_headers)
    assert push_tasks.status_code == 200
    assert push_tasks.json()["data"]["items"][0]["order_no"].startswith("ORD")
    push_task_item = push_tasks.json()["data"]["items"][0]
    filtered_tasks = client.get(
        f"/api/platform/push-tasks?tenant_id={push_task_item['tenant_id']}&shop_id={push_task_item['shop_id']}&status={push_task_item['status']}",
        headers=platform_auth_headers,
    )
    assert filtered_tasks.status_code == 200
    assert filtered_tasks.json()["data"]["total"] == 1

    push_logs = client.get("/api/platform/push-logs", headers=platform_auth_headers)
    assert push_logs.status_code == 200
    assert push_logs.json()["data"]["items"][0]["success"] is True

    filtered_tenants = client.get("/api/platform/tenants?q=demo&page=1&page_size=1", headers=platform_auth_headers)
    assert filtered_tenants.status_code == 200
    assert filtered_tenants.json()["data"]["total"] == 1
    assert len(filtered_tenants.json()["data"]["items"]) == 1


def test_platform_management_create_and_update_success(
    client,
    db_session,
    platform_auth_headers,
    seeded_shop,
    seeded_integration,
) -> None:
    create_tenant = client.post(
        "/api/platform/tenants",
        headers=platform_auth_headers,
        json={
            "tenant_code": "tenant_new",
            "name": "New Tenant",
            "status": "active",
            "contact_name": "Bob",
            "mobile": "13700000000",
        },
    )
    assert create_tenant.status_code == 200
    tenant_id = create_tenant.json()["data"]["id"]

    update_tenant = client.put(
        f"/api/platform/tenants/{tenant_id}",
        headers=platform_auth_headers,
        json={
            "tenant_code": "tenant_new_2",
            "name": "New Tenant 2",
            "status": "disabled",
            "contact_name": "Bobby",
            "mobile": "13600000000",
        },
    )
    assert update_tenant.status_code == 200
    assert update_tenant.json()["data"]["tenant_code"] == "tenant_new_2"

    create_shop = client.post(
        "/api/platform/shops",
        headers=platform_auth_headers,
        json={
            "tenant_id": seeded_shop["tenant_id"],
            "shop_code": "SHPNEW001",
            "name": "New Shop",
            "status": "active",
            "logo": None,
            "cover": None,
            "intro": "new shop",
            "default_integration_id": seeded_integration["integration_id"],
        },
    )
    assert create_shop.status_code == 200
    shop_id = create_shop.json()["data"]["id"]

    update_shop = client.put(
        f"/api/platform/shops/{shop_id}",
        headers=platform_auth_headers,
        json={
            "tenant_id": seeded_shop["tenant_id"],
            "shop_code": "SHPNEW002",
            "name": "Updated Shop",
            "status": "disabled",
            "logo": "https://example.com/shop-logo.png",
            "cover": None,
            "intro": "updated shop",
            "default_integration_id": seeded_integration["integration_id"],
        },
    )
    assert update_shop.status_code == 200
    assert update_shop.json()["data"]["shop_code"] == "SHPNEW002"

    create_integration = client.post(
        "/api/platform/integrations",
        headers=platform_auth_headers,
        json={
            "tenant_id": seeded_shop["tenant_id"],
            "name": "Sync ERP",
            "integration_type": "erp",
            "status": "active",
            "product_sync_enabled": True,
            "order_push_enabled": True,
            "api_base_url": "https://example.com/api",
            "api_key": "k",
            "api_secret": "s",
            "config_json": {"region": "cn"},
        },
    )
    assert create_integration.status_code == 200
    integration_id = create_integration.json()["data"]["id"]

    update_integration = client.put(
        f"/api/platform/integrations/{integration_id}",
        headers=platform_auth_headers,
        json={
            "tenant_id": seeded_shop["tenant_id"],
            "name": "Sync ERP 2",
            "integration_type": "third",
            "status": "disabled",
            "product_sync_enabled": False,
            "order_push_enabled": True,
            "api_base_url": "https://example.org/api",
            "api_key": "k2",
            "api_secret": "s2",
            "config_json": {"region": "us"},
        },
    )
    assert update_integration.status_code == 200
    assert update_integration.json()["data"]["name"] == "Sync ERP 2"


def test_platform_publish_and_retry_task_success(
    client,
    db_session,
    platform_auth_headers,
    store_context_token,
    seeded_shop,
    seeded_products,
    seeded_customer,
    seeded_integration,
) -> None:
    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    publish_response = client.post(
        f"/api/platform/source-products/{seeded_products['source_product_id']}/publish",
        headers=platform_auth_headers,
        json={"shop_id": seeded_shop["shop_id"], "title": "Published Product", "subtitle": "platform", "status": "active"},
    )
    assert publish_response.status_code == 200
    assert publish_response.json()["data"]["title"] == "Published Product"

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    retry_response = client.post(
        f"/api/platform/push-tasks/{task.id}/retry",
        headers=platform_auth_headers,
    )
    assert retry_response.status_code == 200
    assert retry_response.json()["data"]["status"] in {"success", "retrying"}

    audit_logs = client.get("/api/platform/audit-logs", headers=platform_auth_headers)
    assert audit_logs.status_code == 200
    actions = [item["action"] for item in audit_logs.json()["data"]["items"]]
    assert "source_product.publish" in actions
    assert "push_task.retry" in actions


def test_platform_alerts_and_audit_views_success(
    client,
    db_session,
    platform_auth_headers,
    store_context_token,
    seeded_shop,
    seeded_products,
    seeded_customer,
    seeded_integration,
) -> None:
    source_product = db_session.execute(select(SourceProduct).where(SourceProduct.id == seeded_products["source_product_id"])).scalar_one()
    source_product.sync_status = "failed"
    db_session.commit()

    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    task.status = "retrying"
    task.last_error = "ERP timeout"
    failed_log = OrderPushLog(
        id=14002,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        task_id=task.id,
        order_id=task.order_id,
        request_json={"order_no": "demo"},
        response_json={"message": "timeout"},
        success=False,
        pushed_at=datetime(2026, 3, 12, 12, 30, 0, tzinfo=timezone.utc),
    )
    db_session.add(failed_log)
    db_session.commit()

    summary_response = client.get("/api/platform/alerts/summary", headers=platform_auth_headers)
    assert summary_response.status_code == 200
    summary = summary_response.json()["data"]
    assert summary["critical_count"] >= 2
    assert summary["push_task_issue_count"] >= 1
    assert summary["push_log_failure_count"] >= 1
    assert summary["product_sync_issue_count"] >= 1

    alerts_response = client.get("/api/platform/alerts?q=failed", headers=platform_auth_headers)
    assert alerts_response.status_code == 200
    alerts = alerts_response.json()["data"]["items"]
    assert any(item["category"] == "product_sync" for item in alerts)

    filtered_alerts_response = client.get(
        "/api/platform/alerts?category=product_sync&handling_status=open",
        headers=platform_auth_headers,
    )
    assert filtered_alerts_response.status_code == 200
    filtered_alerts = filtered_alerts_response.json()["data"]["items"]
    assert len(filtered_alerts) >= 1
    assert all(item["category"] == "product_sync" for item in filtered_alerts)
    assert all(item["handling_status"] == "open" for item in filtered_alerts)

    audit_response = client.get("/api/platform/audit-logs?q=admin.login", headers=platform_auth_headers)
    assert audit_response.status_code == 200
    assert audit_response.json()["data"]["total"] >= 1


def test_platform_handle_alert_success(
    client,
    db_session,
    platform_auth_headers,
    store_context_token,
    seeded_shop,
    seeded_products,
    seeded_customer,
) -> None:
    client.post(
        "/api/customer/orders",
        headers={"X-Store-Context-Token": store_context_token},
        json={
            "customer_id": seeded_customer["customer_id"],
            "items": [{"product_id": seeded_products["product_id"], "sku_id": 7001, "qty": 1}],
        },
    )

    task = db_session.execute(select(OrderPushTask)).scalar_one()
    task.status = "retrying"
    task.last_error = "ERP timeout"
    db_session.commit()

    handle_response = client.post(
        f"/api/platform/alerts/order_push_task/{task.id}/handle",
        headers=platform_auth_headers,
        json={"status": "resolved", "note": "已人工确认并等待系统恢复"},
    )
    assert handle_response.status_code == 200
    handled_alert = handle_response.json()["data"]
    assert handled_alert["handling_status"] == "resolved"
    assert handled_alert["handling_note"] == "已人工确认并等待系统恢复"
    assert handled_alert["handled_by_username"] == "admin"

    summary_response = client.get("/api/platform/alerts/summary", headers=platform_auth_headers)
    assert summary_response.status_code == 200
    assert summary_response.json()["data"]["push_task_issue_count"] == 0

    filtered_alerts = client.get(
        "/api/platform/alerts?handling_status=resolved&category=push_task",
        headers=platform_auth_headers,
    )
    assert filtered_alerts.status_code == 200
    assert filtered_alerts.json()["data"]["total"] >= 1

    audit_logs = client.get("/api/platform/audit-logs?q=alert.handle", headers=platform_auth_headers)
    assert audit_logs.status_code == 200
    assert audit_logs.json()["data"]["total"] >= 1
