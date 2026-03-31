import os
from datetime import datetime, timezone

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.context import RequestContext
from app.core.db import Base, get_db_session
from app.core.security import get_store_context_token_manager, hash_password
from app.main import app
from app.models.bootstrap import (
    ChannelOrder,
    ChannelProduct,
    Customer,
    Integration,
    OrderPushTask,
    PlatformAdmin,
    ProductSku,
    ProductSpec,
    ProductSpecValue,
    Shop,
    SourceProduct,
    Tenant,
)


@pytest.fixture
def db_session() -> Session:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
    Base.metadata.create_all(bind=engine)

    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session: Session) -> TestClient:
    def override_get_db_session():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def platform_auth_headers(client: TestClient, db_session: Session) -> dict[str, str]:
    if db_session.get(PlatformAdmin, 15001) is None:
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
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seeded_shop(db_session: Session) -> dict[str, int | str]:
    tenant = Tenant(
        id=1001,
        tenant_code="tenant_demo",
        name="Demo Tenant",
        status="active",
        contact_name="Alice",
        mobile="13800000000",
    )
    shop = Shop(
        id=2001,
        tenant_id=tenant.id,
        shop_code="SHP8A92KD",
        name="A商家订货店",
        logo="https://example.com/logo.png",
        cover=None,
        intro="demo shop",
        status="active",
        default_integration_id=None,
    )
    db_session.add_all([tenant, shop])
    db_session.commit()

    return {"tenant_id": tenant.id, "shop_id": shop.id, "shop_code": shop.shop_code}


@pytest.fixture
def store_context_token(seeded_shop: dict[str, int | str]) -> str:
    manager = get_store_context_token_manager()
    return manager.dumps(
        RequestContext(
            tenant_id=seeded_shop["tenant_id"],
            shop_id=seeded_shop["shop_id"],
            shop_code=seeded_shop["shop_code"],
        )
    )


@pytest.fixture
def seeded_products(db_session: Session, seeded_shop: dict[str, int | str]) -> dict[str, int]:
    source_product = SourceProduct(
        id=3001,
        tenant_id=seeded_shop["tenant_id"],
        integration_id=None,
        source_type="erp",
        source_product_id="ERP-3001",
        sku_mode="multiple",
        name="精品咖啡豆",
        description="来自 ERP 的源商品",
        raw_data_json={"origin": "erp"},
        sync_status="synced",
        last_sync_at=datetime(2026, 3, 12, 10, 0, 0, tzinfo=timezone.utc),
    )
    channel_product = ChannelProduct(
        id=4001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        source_product_id=source_product.id,
        title="精品咖啡豆",
        subtitle="门店热销",
        cover="https://example.com/product.png",
        album_json=["https://example.com/product.png"],
        category_id=None,
        status="active",
        sort_no=1,
    )
    spec = ProductSpec(
        id=5001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        product_id=channel_product.id,
        name="规格",
        sort_no=1,
    )
    value_small = ProductSpecValue(
        id=6001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        spec_id=spec.id,
        value="250g",
        sort_no=1,
    )
    value_large = ProductSpecValue(
        id=6002,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        spec_id=spec.id,
        value="500g",
        sort_no=2,
    )
    sku_small = ProductSku(
        id=7001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        product_id=channel_product.id,
        sku_code="SKU-250G",
        spec_value_ids_json=[value_small.id],
        price=59.90,
        market_price=69.90,
        stock=120,
        status="active",
    )
    sku_large = ProductSku(
        id=7002,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        product_id=channel_product.id,
        sku_code="SKU-500G",
        spec_value_ids_json=[value_large.id],
        price=99.90,
        market_price=119.90,
        stock=80,
        status="active",
    )
    db_session.add_all([source_product, channel_product, spec, value_small, value_large, sku_small, sku_large])
    db_session.commit()
    return {"source_product_id": source_product.id, "product_id": channel_product.id}


@pytest.fixture
def seeded_customer(db_session: Session, seeded_shop: dict[str, int | str]) -> dict[str, int]:
    customer = Customer(
        id=8001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        openid="openid-demo",
        unionid=None,
        nickname="测试客户",
        avatar=None,
        mobile="13900000000",
    )
    db_session.add(customer)
    db_session.commit()
    return {"customer_id": customer.id}


@pytest.fixture
def seeded_integration(db_session: Session, seeded_shop: dict[str, int | str]) -> dict[str, int]:
    integration = Integration(
        id=9001,
        tenant_id=seeded_shop["tenant_id"],
        name="Default ERP",
        integration_type="erp",
        api_base_url="https://erp.example.com/api",
        api_key="demo-key",
        api_secret="demo-secret",
        status="active",
        product_sync_enabled=False,
        order_push_enabled=True,
        config_json=None,
    )
    db_session.add(integration)
    db_session.commit()
    return {"integration_id": integration.id}


@pytest.fixture
def seeded_order(
    db_session: Session,
    seeded_shop: dict[str, int | str],
    seeded_customer: dict[str, int],
    seeded_products: dict[str, int],
    seeded_integration: dict[str, int],
) -> dict[str, int]:
    order = ChannelOrder(
        id=11001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        customer_id=seeded_customer["customer_id"],
        order_no="ORD-DEMO-1001",
        status="created",
        push_status="pending",
        total_amount=159.8,
        remark=None,
        address_json={"receiver": "Demo User"},
    )
    push_task = OrderPushTask(
        id=13001,
        tenant_id=seeded_shop["tenant_id"],
        shop_id=seeded_shop["shop_id"],
        order_id=order.id,
        integration_id=seeded_integration["integration_id"],
        push_type="order_create",
        status="pending",
        retry_count=0,
        next_retry_at=None,
        last_error=None,
        request_json={"order_no": order.order_no},
        response_json=None,
    )
    db_session.add(order)
    db_session.flush()
    db_session.add(push_task)
    db_session.commit()
    return {"order_id": order.id, "push_task_id": push_task.id}
