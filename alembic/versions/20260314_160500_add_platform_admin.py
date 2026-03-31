"""add platform admin

Revision ID: 20260314_160500
Revises: 20260312_123000
Create Date: 2026-03-14 16:05:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260314_160500"
down_revision: str | None = "20260312_123000"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "platform_admin",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_platform_admin")),
    )
    op.create_index("ix_platform_admin_username", "platform_admin", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_platform_admin_username", table_name="platform_admin")
    op.drop_table("platform_admin")
