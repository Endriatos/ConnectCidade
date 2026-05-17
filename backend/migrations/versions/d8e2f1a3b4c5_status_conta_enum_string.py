"""status_conta enum string

Revision ID: d8e2f1a3b4c5
Revises: c5eb814c19d0
Create Date: 2026-05-17 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d8e2f1a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c5eb814c19d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_STATUS_MAP_UP = {
    0: "PENDENTE",
    1: "ATIVO",
    2: "BLOQUEADO",
}
_STATUS_MAP_DOWN = {v: k for k, v in _STATUS_MAP_UP.items()}


def upgrade() -> None:
    statusconta = sa.Enum("PENDENTE", "ATIVO", "BLOQUEADO", name="statusconta")
    statusconta.create(op.get_bind(), checkfirst=True)

    op.add_column("usuario", sa.Column("status_conta_tmp", statusconta, nullable=True))

    for old, new in _STATUS_MAP_UP.items():
        op.execute(
            sa.text("UPDATE usuario SET status_conta_tmp = :novo WHERE status_conta = :antigo").bindparams(
                novo=new, antigo=old
            )
        )

    op.execute(sa.text("UPDATE usuario SET status_conta_tmp = 'ATIVO' WHERE status_conta_tmp IS NULL"))

    op.drop_column("usuario", "status_conta")
    op.alter_column(
        "usuario",
        "status_conta_tmp",
        new_column_name="status_conta",
        nullable=False,
        server_default="ATIVO",
    )


def downgrade() -> None:
    op.add_column("usuario", sa.Column("status_conta_tmp", sa.Integer(), nullable=True))

    for old, new in _STATUS_MAP_DOWN.items():
        op.execute(
            sa.text("UPDATE usuario SET status_conta_tmp = :novo WHERE status_conta::text = :antigo").bindparams(
                novo=new, antigo=old
            )
        )

    op.execute(sa.text("UPDATE usuario SET status_conta_tmp = 1 WHERE status_conta_tmp IS NULL"))

    op.drop_column("usuario", "status_conta")
    op.alter_column(
        "usuario",
        "status_conta_tmp",
        new_column_name="status_conta",
        nullable=False,
        server_default="1",
    )

    sa.Enum(name="statusconta").drop(op.get_bind(), checkfirst=True)
