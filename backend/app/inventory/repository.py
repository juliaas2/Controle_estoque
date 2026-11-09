from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.inventory.models import Block, Reservation
from app.inventory.schemas import StockRead
from app.products.models import Product


def stock_snapshot(session: Session, product_id: int) -> StockRead | None:
    # Separate scalar subqueries avoid multiplying totals across two one-to-many joins.
    reserved = (
        select(func.coalesce(func.sum(Reservation.quantity), 0))
        .where(Reservation.product_id == product_id, Reservation.released_at.is_(None))
        .scalar_subquery()
    )
    blocked = (
        select(func.coalesce(func.sum(Block.quantity), 0))
        .where(Block.product_id == product_id, Block.released_at.is_(None))
        .scalar_subquery()
    )
    row = session.execute(
        select(Product.total_quantity, reserved, blocked).where(Product.id == product_id)
    ).one_or_none()
    if row is None:
        return None
    total, reserved_quantity, blocked_quantity = row
    return StockRead(
        product_id=product_id,
        total_quantity=total,
        available_quantity=total - reserved_quantity - blocked_quantity,
        reserved_quantity=reserved_quantity,
        blocked_quantity=blocked_quantity,
    )


def add_allocation(session: Session, model, **values):
    allocation = model(**values)
    session.add(allocation)
    session.flush()
    return allocation


def get_allocation(session: Session, model, allocation_id: str):
    return session.get(model, allocation_id)


def list_allocations(session: Session, model, product_id: int, active: bool | None = None):
    query = select(model).where(model.product_id == product_id)
    if active is not None:
        query = query.where(model.released_at.is_(None) if active else model.released_at.is_not(None))
    return list(session.scalars(query.order_by(model.created_at.desc(), model.id)))
