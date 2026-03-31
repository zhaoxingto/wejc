"""add order domain tables

Revision ID: 20260312_113000
Revises: 20260312_101500
Create Date: 2026-03-12 11:30:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260312_113000"
down_revision = "20260312_101500"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customer",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("openid", sa.String(length=128), nullable=True),
        sa.Column("unionid", sa.String(length=128), nullable=True),
        sa.Column("nickname", sa.String(length=128), nullable=True),
        sa.Column("avatar", sa.String(length=1024), nullable=True),
        sa.Column("mobile", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_customer_shop_id_shop")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_customer_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_customer")),
    )
    op.create_index(op.f("ix_customer_shop_id"), "customer", ["shop_id"], unique=False)
    op.create_index(op.f("ix_customer_tenant_id"), "customer", ["tenant_id"], unique=False)
    op.create_index("ix_customer_tenant_shop_openid", "customer", ["tenant_id", "shop_id", "openid"], unique=False)
    op.create_table(
        "cart",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("customer_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("sku_id", sa.BigInteger(), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer.id"], name=op.f("fk_cart_customer_id_customer")),
        sa.ForeignKeyConstraint(["product_id"], ["channel_product.id"], name=op.f("fk_cart_product_id_channel_product")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_cart_shop_id_shop")),
        sa.ForeignKeyConstraint(["sku_id"], ["product_sku.id"], name=op.f("fk_cart_sku_id_product_sku")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_cart_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cart")),
    )
    op.create_index(op.f("ix_cart_shop_id"), "cart", ["shop_id"], unique=False)
    op.create_index(op.f("ix_cart_tenant_id"), "cart", ["tenant_id"], unique=False)
    op.create_index("ix_cart_customer_sku", "cart", ["customer_id", "sku_id"], unique=False)
    op.create_index("ix_cart_tenant_shop_customer", "cart", ["tenant_id", "shop_id", "customer_id"], unique=False)
    op.create_table(
        "channel_order",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("customer_id", sa.BigInteger(), nullable=False),
        sa.Column("order_no", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("push_status", sa.String(length=32), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("remark", sa.String(length=500), nullable=True),
        sa.Column("address_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer.id"], name=op.f("fk_channel_order_customer_id_customer")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_channel_order_shop_id_shop")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_channel_order_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_channel_order")),
    )
    op.create_index(op.f("ix_channel_order_shop_id"), "channel_order", ["shop_id"], unique=False)
    op.create_index(op.f("ix_channel_order_tenant_id"), "channel_order", ["tenant_id"], unique=False)
    op.create_index("ix_channel_order_order_no", "channel_order", ["order_no"], unique=True)
    op.create_index(
        "ix_channel_order_tenant_shop_customer",
        "channel_order",
        ["tenant_id", "shop_id", "customer_id"],
        unique=False,
    )
    op.create_table(
        "channel_order_item",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("sku_id", sa.BigInteger(), nullable=False),
        sa.Column("product_title", sa.String(length=255), nullable=False),
        sa.Column("sku_text", sa.String(length=255), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["channel_order.id"], name=op.f("fk_channel_order_item_order_id_channel_order")),
        sa.ForeignKeyConstraint(["product_id"], ["channel_product.id"], name=op.f("fk_channel_order_item_product_id_channel_product")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_channel_order_item_shop_id_shop")),
        sa.ForeignKeyConstraint(["sku_id"], ["product_sku.id"], name=op.f("fk_channel_order_item_sku_id_product_sku")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_channel_order_item_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_channel_order_item")),
    )
    op.create_index(op.f("ix_channel_order_item_shop_id"), "channel_order_item", ["shop_id"], unique=False)
    op.create_index(op.f("ix_channel_order_item_tenant_id"), "channel_order_item", ["tenant_id"], unique=False)
    op.create_index("ix_channel_order_item_order_id", "channel_order_item", ["order_id"], unique=False)
    op.create_table(
        "order_push_task",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("integration_id", sa.BigInteger(), nullable=True),
        sa.Column("push_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("next_retry_at", sa.String(length=64), nullable=True),
        sa.Column("last_error", sa.String(length=1000), nullable=True),
        sa.Column("request_json", sa.JSON(), nullable=True),
        sa.Column("response_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["channel_order.id"], name=op.f("fk_order_push_task_order_id_channel_order")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_order_push_task_shop_id_shop")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_order_push_task_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_push_task")),
    )
    op.create_index(op.f("ix_order_push_task_shop_id"), "order_push_task", ["shop_id"], unique=False)
    op.create_index(op.f("ix_order_push_task_tenant_id"), "order_push_task", ["tenant_id"], unique=False)
    op.create_index("ix_order_push_task_status", "order_push_task", ["status"], unique=False)
    op.create_index(
        "ix_order_push_task_tenant_shop_order",
        "order_push_task",
        ["tenant_id", "shop_id", "order_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_order_push_task_tenant_shop_order", table_name="order_push_task")
    op.drop_index("ix_order_push_task_status", table_name="order_push_task")
    op.drop_index(op.f("ix_order_push_task_tenant_id"), table_name="order_push_task")
    op.drop_index(op.f("ix_order_push_task_shop_id"), table_name="order_push_task")
    op.drop_table("order_push_task")
    op.drop_index("ix_channel_order_item_order_id", table_name="channel_order_item")
    op.drop_index(op.f("ix_channel_order_item_tenant_id"), table_name="channel_order_item")
    op.drop_index(op.f("ix_channel_order_item_shop_id"), table_name="channel_order_item")
    op.drop_table("channel_order_item")
    op.drop_index("ix_channel_order_tenant_shop_customer", table_name="channel_order")
    op.drop_index("ix_channel_order_order_no", table_name="channel_order")
    op.drop_index(op.f("ix_channel_order_tenant_id"), table_name="channel_order")
    op.drop_index(op.f("ix_channel_order_shop_id"), table_name="channel_order")
    op.drop_table("channel_order")
    op.drop_index("ix_cart_tenant_shop_customer", table_name="cart")
    op.drop_index("ix_cart_customer_sku", table_name="cart")
    op.drop_index(op.f("ix_cart_tenant_id"), table_name="cart")
    op.drop_index(op.f("ix_cart_shop_id"), table_name="cart")
    op.drop_table("cart")
    op.drop_index("ix_customer_tenant_shop_openid", table_name="customer")
    op.drop_index(op.f("ix_customer_tenant_id"), table_name="customer")
    op.drop_index(op.f("ix_customer_shop_id"), table_name="customer")
    op.drop_table("customer")
