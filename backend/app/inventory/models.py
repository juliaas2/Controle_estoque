from uuid import uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class AllocationColumns:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(String(40), default=utc_now)
    released_at: Mapped[str | None] = mapped_column(String(40), nullable=True)


class Reservation(AllocationColumns, Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("quantity > 0 AND quantity <= 1000000000"),
        Index("ix_reservations_product_active", "product_id", "released_at"),
    )
    request_id: Mapped[str] = mapped_column(String(80))


class Block(AllocationColumns, Base):
    __tablename__ = "blocks"
    __table_args__ = (
        CheckConstraint("quantity > 0 AND quantity <= 1000000000"),
        Index("ix_blocks_product_active", "product_id", "released_at"),
    )
    request_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    reason: Mapped[str] = mapped_column(String(240))
