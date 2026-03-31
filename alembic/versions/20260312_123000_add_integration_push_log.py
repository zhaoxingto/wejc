"""add integration and push log tables

Revision ID: 20260312_123000
Revises: 20260312_113000
Create Date: 2026-03-12 12:30:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260312_123000"
down_revision = "20260312_113000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "integration",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("integration_type", sa.String(length=32), nullable=False),
        sa.Column("api_base_url", sa.String(length=1024), nullable=True),
        sa.Column("api_key", sa.String(length=255), nullable=True),
        sa.Column("api_secret", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("product_sync_enabled", sa.Boolean(), nullable=False),
        sa.Column("order_push_enabled", sa.Boolean(), nullable=False),
        sa.Column("config_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_integration_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_integration")),
    )
    op.create_index(op.f("ix_integration_tenant_id"), "integration", ["tenant_id"], unique=False)
    op.create_index("ix_integration_tenant_status", "integration", ["tenant_id", "status"], unique=False)

    op.create_table(
        "order_push_log",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tenant_id", sa.BigInteger(), nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("request_json", sa.JSON(), nullable=True),
        sa.Column("response_json", sa.JSON(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("pushed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["channel_order.id"], name=op.f("fk_order_push_log_order_id_channel_order")),
        sa.ForeignKeyConstraint(["task_id"], ["order_push_task.id"], name=op.f("fk_order_push_log_task_id_order_push_task")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"], name=op.f("fk_order_push_log_tenant_id_tenant")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_push_log")),
    )
    op.create_index(op.f("ix_order_push_log_tenant_id"), "order_push_log", ["tenant_id"], unique=False)
    op.create_index("ix_order_push_log_task_id", "order_push_log", ["task_id"], unique=False)

    op.alter_column(
        "order_push_task",
        "next_retry_at",
        existing_type=sa.String(length=64),
        type_=sa.DateTime(timezone=True),
        postgresql_using="NULLIF(next_retry_at, '')::timestamptz",
    )


def downgrade() -> None:
    op.alter_column(
        "order_push_task",
        "next_retry_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.String(length=64),
        postgresql_using="next_retry_at::text",
    )
    op.drop_index("ix_order_push_log_task_id", table_name="order_push_log")
    op.drop_index(op.f("ix_order_push_log_tenant_id"), table_name="order_push_log")
    op.drop_table("order_push_log")
    op.drop_index("ix_integration_tenant_status", table_name="integration")
    op.drop_index(op.f("ix_integration_tenant_id"), table_name="integration")
    op.drop_table("integration")
