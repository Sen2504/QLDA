"""merge multiple heads

Revision ID: e0d5aa036e45
Revises: 5607dcd88c5a, 7795a5e8d2da
Create Date: 2025-10-06 11:51:04.945279

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e0d5aa036e45'
down_revision = ('5607dcd88c5a', '7795a5e8d2da')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
