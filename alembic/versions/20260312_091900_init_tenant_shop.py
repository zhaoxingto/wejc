"""init tenant and shop tables

Revision ID: 20260312_091900
Revises:
Create Date: 2026-03-12 09:19:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260312_091900"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenant",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("contact_name", sa.String(length=64), nullable=True),
        sa.Column("mobile", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tenant")),
        sa.UniqueConstraint("tenant_code", name=op.f("uq_tenant_tenant_code")),
    )
    op.create_table(
        "shop",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("logo", sa.String(length=1024), nullable=True),
        sa.Column("cover", sa.String(length=1024), nullable=True),
        sa.Column("intro", sa.String(length=2000), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("default_integration_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_shop_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_shop")),
        sa.UniqueConstraint("shop_code", name=op.f("uq_shop_shop_code")),
    )
    op.create_index(op.f("ix_shop_tenant_id"), "shop", ["tenant_id"], unique=False)
    op.create_index("ix_shop_tenant_id_shop_code", "shop", ["tenant_id", "shop_code"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_shop_tenant_id_shop_code", table_name="shop")
    op.drop_index(op.f("ix_shop_tenant_id"), table_name="shop")
    op.drop_table("shop")
    op.drop_table("tenant")
