from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (CheckConstraint("total_quantity >= 0 AND total_quantity <= 1000000000"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    total_quantity: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String(40), default=utc_now)
