"""add product domain tables

Revision ID: 20260312_101500
Revises: 20260312_091900
Create Date: 2026-03-12 10:15:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260312_101500"
down_revision = "20260312_091900"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "source_product",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("integration_id", sa.BigInteger(), nullable=True),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_product_id", sa.String(length=128), nullable=False),
        sa.Column("sku_mode", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("raw_data_json", sa.JSON(), nullable=True),
        sa.Column("sync_status", sa.String(length=32), nullable=False),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_source_product_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_source_product")),
    )
    op.create_index(op.f("ix_source_product_tenant_id"), "source_product", ["tenant_id"], unique=False)
    op.create_index(
        "ix_source_product_tenant_integration_source",
        "source_product",
        ["tenant_id", "integration_id", "source_product_id"],
        unique=False,
    )
    op.create_table(
        "channel_product",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("source_product_id", sa.BigInteger(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.String(length=255), nullable=True),
        sa.Column("cover", sa.String(length=1024), nullable=True),
        sa.Column("album_json", sa.JSON(), nullable=True),
        sa.Column("category_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("sort_no", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_channel_product_shop_id_shop")),
        sa.ForeignKeyConstraint(
            ["source_product_id"],
            ["source_product.id"],
            name=op.f("fk_channel_product_source_product_id_source_product"),
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_channel_product_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_channel_product")),
    )
    op.create_index(op.f("ix_channel_product_shop_id"), "channel_product", ["shop_id"], unique=False)
    op.create_index(op.f("ix_channel_product_tenant_id"), "channel_product", ["tenant_id"], unique=False)
    op.create_index(
        "ix_channel_product_tenant_shop_status",
        "channel_product",
        ["tenant_id", "shop_id", "status"],
        unique=False,
    )
    op.create_table(
        "product_spec",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("sort_no", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["channel_product.id"], name=op.f("fk_product_spec_product_id_channel_product")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_product_spec_shop_id_shop")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_product_spec_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_spec")),
    )
    op.create_index(op.f("ix_product_spec_shop_id"), "product_spec", ["shop_id"], unique=False)
    op.create_index(op.f("ix_product_spec_tenant_id"), "product_spec", ["tenant_id"], unique=False)
    op.create_index(
        "ix_product_spec_tenant_shop_product",
        "product_spec",
        ["tenant_id", "shop_id", "product_id"],
        unique=False,
    )
    op.create_table(
        "product_spec_value",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("spec_id", sa.BigInteger(), nullable=False),
        sa.Column("value", sa.String(length=64), nullable=False),
        sa.Column("sort_no", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_product_spec_value_shop_id_shop")),
        sa.ForeignKeyConstraint(["spec_id"], ["product_spec.id"], name=op.f("fk_product_spec_value_spec_id_product_spec")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_product_spec_value_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_spec_value")),
    )
    op.create_index(op.f("ix_product_spec_value_shop_id"), "product_spec_value", ["shop_id"], unique=False)
    op.create_index(op.f("ix_product_spec_value_tenant_id"), "product_spec_value", ["tenant_id"], unique=False)
    op.create_index("ix_product_spec_value_spec_id", "product_spec_value", ["spec_id"], unique=False)
    op.create_table(
        "product_sku",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("sku_code", sa.String(length=128), nullable=False),
        sa.Column("spec_value_ids_json", sa.JSON(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("market_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["channel_product.id"], name=op.f("fk_product_sku_product_id_channel_product")),
        sa.ForeignKeyConstraint(["shop_id"], ["shop.id"], name=op.f("fk_product_sku_shop_id_shop")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_product_sku_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_sku")),
    )
    op.create_index(op.f("ix_product_sku_shop_id"), "product_sku", ["shop_id"], unique=False)
    op.create_index(op.f("ix_product_sku_tenant_id"), "product_sku", ["tenant_id"], unique=False)
    op.create_index("ix_product_sku_sku_code", "product_sku", ["sku_code"], unique=False)
    op.create_index(
        "ix_product_sku_tenant_shop_product",
        "product_sku",
        ["tenant_id", "shop_id", "product_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_product_sku_tenant_shop_product", table_name="product_sku")
    op.drop_index("ix_product_sku_sku_code", table_name="product_sku")
    op.drop_index(op.f("ix_product_sku_tenant_id"), table_name="product_sku")
    op.drop_index(op.f("ix_product_sku_shop_id"), table_name="product_sku")
    op.drop_table("product_sku")
    op.drop_index("ix_product_spec_value_spec_id", table_name="product_spec_value")
    op.drop_index(op.f("ix_product_spec_value_tenant_id"), table_name="product_spec_value")
    op.drop_index(op.f("ix_product_spec_value_shop_id"), table_name="product_spec_value")
    op.drop_table("product_spec_value")
    op.drop_index("ix_product_spec_tenant_shop_product", table_name="product_spec")
    op.drop_index(op.f("ix_product_spec_tenant_id"), table_name="product_spec")
    op.drop_index(op.f("ix_product_spec_shop_id"), table_name="product_spec")
    op.drop_table("product_spec")
    op.drop_index("ix_channel_product_tenant_shop_status", table_name="channel_product")
    op.drop_index(op.f("ix_channel_product_tenant_id"), table_name="channel_product")
    op.drop_index(op.f("ix_channel_product_shop_id"), table_name="channel_product")
    op.drop_table("channel_product")
    op.drop_index("ix_source_product_tenant_integration_source", table_name="source_product")
    op.drop_index(op.f("ix_source_product_tenant_id"), table_name="source_product")
    op.drop_table("source_product")
