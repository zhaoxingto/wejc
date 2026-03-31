from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.bootstrap import (
    ChannelOrder,
    ChannelOrderItem,
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


def seed_demo_data() -> None:
    session = SessionLocal()
    try:
        tenant = session.execute(select(Tenant).where(Tenant.id == 1001)).scalar_one_or_none()
        if tenant is None:
            tenant = Tenant(
                id=1001,
                tenant_code="tenant_demo",
                name="Demo Tenant",
                status="active",
                contact_name="Alice",
                mobile="13800000000",
            )
            session.add(tenant)
            session.flush()

        integration = session.execute(select(Integration).where(Integration.id == 9001)).scalar_one_or_none()
        if integration is None:
            integration = Integration(
                id=9001,
                tenant_id=1001,
                name="Demo ERP",
                integration_type="erp",
                api_base_url=None,
                api_key="demo-key",
                api_secret="demo-secret",
                status="active",
                product_sync_enabled=True,
                order_push_enabled=True,
                config_json={
                    "demo_products": [
                        {
                            "source_product_id": "ERP-DEMO-1001",
                            "name": "阿拉比卡拼配咖啡豆",
                            "description": "本地演示商品，同步后会落到 source_product",
                            "sku_mode": "multiple",
                        },
                        {
                            "source_product_id": "ERP-DEMO-1002",
                            "name": "冷萃挂耳礼盒",
                            "description": "第二个演示商品，用来验证多条同步",
                            "sku_mode": "single",
                        },
                    ]
                },
            )
            session.add(integration)
            session.flush()
        else:
            integration.product_sync_enabled = True
            integration.status = "active"
            integration.config_json = integration.config_json or {
                "demo_products": [
                    {
                        "source_product_id": "ERP-DEMO-1001",
                        "name": "阿拉比卡拼配咖啡豆",
                        "description": "本地演示商品，同步后会落到 source_product",
                        "sku_mode": "multiple",
                    }
                ]
            }

        shop = session.execute(select(Shop).where(Shop.id == 2001)).scalar_one_or_none()
        if shop is None:
            shop = Shop(
                id=2001,
                tenant_id=1001,
                shop_code="SHP8A92KD",
                name="A商家订货店",
                logo="https://example.com/logo.png",
                cover="https://example.com/cover.png",
                intro="可直接用于后台演示的本地店铺",
                status="active",
                default_integration_id=9001,
            )
            session.add(shop)
            session.flush()
        else:
            shop.default_integration_id = 9001
            shop.status = "active"

        customer = session.execute(select(Customer).where(Customer.id == 8001)).scalar_one_or_none()
        if customer is None:
            customer = Customer(
                id=8001,
                tenant_id=1001,
                shop_id=2001,
                openid="openid-demo",
                unionid=None,
                nickname="演示客户",
                avatar=None,
                mobile="13900000000",
            )
            session.add(customer)
            session.flush()

        source_product = session.execute(select(SourceProduct).where(SourceProduct.id == 3001)).scalar_one_or_none()
        if source_product is None:
            source_product = SourceProduct(
                id=3001,
                tenant_id=1001,
                integration_id=9001,
                source_type="erp",
                source_product_id="ERP-3001",
                sku_mode="multiple",
                name="精品拼配咖啡豆",
                description="预置来源商品",
                raw_data_json={"origin": "seed"},
                sync_status="synced",
                last_sync_at=datetime.now(timezone.utc),
            )
            session.add(source_product)
            session.flush()

        channel_product = session.execute(select(ChannelProduct).where(ChannelProduct.id == 4001)).scalar_one_or_none()
        if channel_product is None:
            channel_product = ChannelProduct(
                id=4001,
                tenant_id=1001,
                shop_id=2001,
                source_product_id=3001,
                title="精品拼配咖啡豆",
                subtitle="后台演示商品",
                cover="https://example.com/product.png",
                album_json=["https://example.com/product.png"],
                category_id=None,
                status="active",
                sort_no=1,
            )
            session.add(channel_product)
            session.flush()

        spec = session.execute(select(ProductSpec).where(ProductSpec.id == 5001)).scalar_one_or_none()
        if spec is None:
            spec = ProductSpec(
                id=5001,
                tenant_id=1001,
                shop_id=2001,
                product_id=4001,
                name="规格",
                sort_no=1,
            )
            session.add(spec)
            session.flush()

        spec_value_small = session.execute(select(ProductSpecValue).where(ProductSpecValue.id == 6001)).scalar_one_or_none()
        if spec_value_small is None:
            spec_value_small = ProductSpecValue(
                id=6001,
                tenant_id=1001,
                shop_id=2001,
                spec_id=5001,
                value="250g",
                sort_no=1,
            )
            session.add(spec_value_small)
            session.flush()

        spec_value_large = session.execute(select(ProductSpecValue).where(ProductSpecValue.id == 6002)).scalar_one_or_none()
        if spec_value_large is None:
            spec_value_large = ProductSpecValue(
                id=6002,
                tenant_id=1001,
                shop_id=2001,
                spec_id=5001,
                value="500g",
                sort_no=2,
            )
            session.add(spec_value_large)
            session.flush()

        sku_small = session.execute(select(ProductSku).where(ProductSku.id == 7001)).scalar_one_or_none()
        if sku_small is None:
            sku_small = ProductSku(
                id=7001,
                tenant_id=1001,
                shop_id=2001,
                product_id=4001,
                sku_code="SKU-250G",
                spec_value_ids_json=[6001],
                price=59.90,
                market_price=69.90,
                stock=120,
                status="active",
            )
            session.add(sku_small)
            session.flush()

        sku_large = session.execute(select(ProductSku).where(ProductSku.id == 7002)).scalar_one_or_none()
        if sku_large is None:
            sku_large = ProductSku(
                id=7002,
                tenant_id=1001,
                shop_id=2001,
                product_id=4001,
                sku_code="SKU-500G",
                spec_value_ids_json=[6002],
                price=99.90,
                market_price=119.90,
                stock=80,
                status="active",
            )
            session.add(sku_large)
            session.flush()

        order = session.execute(select(ChannelOrder).where(ChannelOrder.id == 11001)).scalar_one_or_none()
        if order is None:
            order = ChannelOrder(
                id=11001,
                tenant_id=1001,
                shop_id=2001,
                customer_id=8001,
                order_no="ORD-DEMO-1001",
                status="created",
                push_status="pending",
                total_amount=Decimal("59.90"),
                remark="演示订单",
                address_json={"name": "张三", "mobile": "13800000000", "detail": "上海市测试路 88 号"},
            )
            session.add(order)
            session.flush()

        order_item = session.execute(select(ChannelOrderItem).where(ChannelOrderItem.id == 12001)).scalar_one_or_none()
        if order_item is None:
            order_item = ChannelOrderItem(
                id=12001,
                tenant_id=1001,
                shop_id=2001,
                order_id=11001,
                product_id=4001,
                sku_id=7001,
                product_title="精品拼配咖啡豆",
                sku_text="6001",
                price=Decimal("59.90"),
                qty=1,
                amount=Decimal("59.90"),
            )
            session.add(order_item)
            session.flush()

        push_task = session.execute(select(OrderPushTask).where(OrderPushTask.id == 13001)).scalar_one_or_none()
        if push_task is None:
            push_task = OrderPushTask(
                id=13001,
                tenant_id=1001,
                shop_id=2001,
                order_id=11001,
                integration_id=9001,
                push_type="order_create",
                status="pending",
                retry_count=0,
                next_retry_at=None,
                last_error=None,
                request_json={"order_no": "ORD-DEMO-1001"},
                response_json=None,
            )
            session.add(push_task)

        platform_admin = session.execute(select(PlatformAdmin).where(PlatformAdmin.username == "admin")).scalar_one_or_none()
        if platform_admin is None:
            platform_admin = PlatformAdmin(
                id=15001,
                username="admin",
                password_hash=hash_password("admin123456"),
                display_name="Platform Admin",
                status="active",
            )
            session.add(platform_admin)

        session.commit()
        print("Demo data seeded.")
        print("shop_code: SHP8A92KD")
        print("admin: http://127.0.0.1:8000/admin")
        print("platform_admin: admin / admin123456")
    finally:
        session.close()


if __name__ == "__main__":
    seed_demo_data()
