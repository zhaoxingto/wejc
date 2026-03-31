"""add shop theme

Revision ID: 20260315_103000
Revises: 20260314_191500
Create Date: 2026-03-15 10:30:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260315_103000"
down_revision: str | None = "20260314_191500"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("shop", sa.Column("theme_json", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("shop", "theme_json")
