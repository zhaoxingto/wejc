"""add platform audit log

Revision ID: 20260314_181500
Revises: 20260314_160500
Create Date: 2026-03-14 18:15:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260314_181500"
down_revision: str | None = "20260314_160500"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "platform_audit_log",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("admin_id", sa.BigInteger(), nullable=False),
        sa.Column("admin_username", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("resource_type", sa.String(length=64), nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=False),
        sa.Column("summary", sa.String(length=255), nullable=False),
        sa.Column("detail_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["platform_admin.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_platform_audit_log")),
    )
    op.create_index("ix_platform_audit_log_admin_id", "platform_audit_log", ["admin_id"], unique=False)
    op.create_index("ix_platform_audit_log_admin_created", "platform_audit_log", ["admin_id", "created_at"], unique=False)
    op.create_index("ix_platform_audit_log_resource", "platform_audit_log", ["resource_type", "resource_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_platform_audit_log_resource", table_name="platform_audit_log")
    op.drop_index("ix_platform_audit_log_admin_created", table_name="platform_audit_log")
    op.drop_index("ix_platform_audit_log_admin_id", table_name="platform_audit_log")
    op.drop_table("platform_audit_log")
