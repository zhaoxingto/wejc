"""add platform alert case

Revision ID: 20260314_191500
Revises: 20260314_181500
Create Date: 2026-03-14 19:15:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260314_191500"
down_revision: str | None = "20260314_181500"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "platform_alert_case",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("resource_type", sa.String(length=64), nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("handled_by_admin_id", sa.BigInteger(), nullable=True),
        sa.Column("handled_by_username", sa.String(length=64), nullable=True),
        sa.Column("handled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["handled_by_admin_id"], ["platform_admin.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_platform_alert_case")),
    )
    op.create_index("ix_platform_alert_case_resource", "platform_alert_case", ["resource_type", "resource_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_platform_alert_case_resource", table_name="platform_alert_case")
    op.drop_table("platform_alert_case")
