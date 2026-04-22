"""unifica tokens em token_temporario

Revision ID: c5eb814c19d0
Revises: a3f1c2d4e5b6
Create Date: 2026-04-22 15:11:10.101026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c5eb814c19d0'
down_revision: Union[str, Sequence[str], None] = 'a3f1c2d4e5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    tipotoken = sa.Enum('RECUPERACAO_SENHA', 'VERIFICACAO_EMAIL', name='tipotoken')
    tipotoken.create(op.get_bind(), checkfirst=True)
    op.drop_table('token_verificacao_email')

    # Adiciona nullable para permitir popular registros existentes
    op.add_column('token_recuperacao', sa.Column('tipo', tipotoken, nullable=True))

    # Todos os registros existentes são tokens de recuperação de senha
    op.execute("UPDATE token_recuperacao SET tipo = 'RECUPERACAO_SENHA' WHERE tipo IS NULL")

    # Torna obrigatória após popular
    op.alter_column('token_recuperacao', 'tipo', nullable=False)

    # Renomeia a tabela para refletir o uso unificado
    op.rename_table('token_recuperacao', 'token_temporario')


def downgrade() -> None:
    """Downgrade schema."""
    # Restaura o nome original da tabela
    op.rename_table('token_temporario', 'token_recuperacao')
    op.drop_column('token_recuperacao', 'tipo')
    sa.Enum(name='tipotoken').drop(op.get_bind(), checkfirst=True)
    op.create_table('token_verificacao_email',
    sa.Column('id_token', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('id_usuario', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('token_hash', sa.VARCHAR(length=64), autoincrement=False, nullable=False),
    sa.Column('expira_em', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
    sa.Column('usado', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('data_criacao', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id_usuario'], ['usuario.id_usuario'], name=op.f('token_verificacao_email_id_usuario_fkey')),
    sa.PrimaryKeyConstraint('id_token', name=op.f('token_verificacao_email_pkey'))
    )
    # ### end Alembic commands ###
