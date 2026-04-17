"""status_conta e token_verificacao_email

Revision ID: a3f1c2d4e5b6
Revises: 5d836cb73f09
Create Date: 2026-04-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f1c2d4e5b6'
down_revision: Union[str, Sequence[str], None] = '5d836cb73f09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('usuario', sa.Column('status_conta', sa.Integer(), nullable=False, server_default='1'))
    op.drop_column('usuario', 'status_ativo')

    op.create_table(
        'token_verificacao_email',
        sa.Column('id_token', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('id_usuario', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expira_em', sa.DateTime(timezone=True), nullable=False),
        sa.Column('usado', sa.Boolean(), nullable=False),
        sa.Column('data_criacao', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['id_usuario'], ['usuario.id_usuario']),
        sa.PrimaryKeyConstraint('id_token'),
    )


def downgrade() -> None:
    op.drop_table('token_verificacao_email')
    op.add_column('usuario', sa.Column('status_ativo', sa.Boolean(), nullable=False, server_default='true'))
    op.drop_column('usuario', 'status_conta')
