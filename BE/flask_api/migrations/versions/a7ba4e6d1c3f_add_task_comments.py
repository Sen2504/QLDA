"""add task comments table

Revision ID: a7ba4e6d1c3f
Revises: 40ff1067f822
Create Date: 2025-10-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a7ba4e6d1c3f"
down_revision = "40ff1067f822"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "task_comment",
        sa.Column("ID_COMMENT", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("ID_TASK", sa.Integer(), nullable=False),
        sa.Column("ID_USER", sa.Integer(), nullable=True),
        sa.Column("ID_TEAM", sa.Integer(), nullable=True),
        sa.Column("CONTENT", sa.Text(), nullable=False),
        sa.Column("CREATED_AT", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["ID_TASK"], ["task.ID_TASK"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ID_USER"], ["users.ID_USER"]),
        sa.ForeignKeyConstraint(["ID_TEAM"], ["team.ID_TEAM"]),
    )


def downgrade():
    op.drop_table("task_comment")
