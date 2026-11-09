from collections.abc import Generator
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Request
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session


class Base(DeclarativeBase):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_engine(path: Path, busy_timeout_ms: int = 5000) -> Engine:
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{path.resolve().as_posix()}",
        connect_args={"check_same_thread": False, "timeout": busy_timeout_ms / 1000},
    )

    @event.listens_for(engine, "connect")
    def configure_connection(connection, _record):
        # SQLAlchemy owns BEGIN; disable sqlite3's legacy implicit BEGIN.
        connection.isolation_level = None
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute(f"PRAGMA busy_timeout={int(busy_timeout_ms)}")
        cursor.close()

    @event.listens_for(engine, "begin")
    def begin_transaction(connection):
        # Write sessions request the lock BEFORE reading the available balance.
        mode = " IMMEDIATE" if connection.get_execution_options().get("sqlite_write") else ""
        connection.exec_driver_sql(f"BEGIN{mode}")

    return engine


def initialize_database(engine: Engine) -> None:
    from app.inventory import models as inventory_models  # noqa: F401
    from app.products import models as product_models  # noqa: F401

    Base.metadata.create_all(engine)


def get_session(request: Request) -> Generator[Session, None, None]:
    with Session(request.app.state.engine, expire_on_commit=False) as session:
        yield session


@contextmanager
def write_transaction(session: Session):
    if session.in_transaction():
        raise RuntimeError("A escrita deve começar antes de qualquer consulta na sessão.")
    try:
        session.connection(execution_options={"sqlite_write": True})
        yield
        session.commit()
    except Exception:
        session.rollback()
        raise
