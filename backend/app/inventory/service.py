from sqlalchemy.orm import Session

from app.database import utc_now, write_transaction
from app.exceptions import BusinessError, InsufficientStock, NotFound
from app.inventory import repository
from app.inventory.models import Block, Reservation
from app.inventory.schemas import (
    BlockCreate,
    BlockRead,
    QuantityInput,
    ReservationCreate,
    ReservationRead,
    StockRead,
)
from app.products.repository import get_product


def get_stock(session: Session, product_id: int) -> StockRead:
    stock = repository.stock_snapshot(session, product_id)
    if stock is None:
        raise NotFound("Produto")
    return stock


def require_available(stock: StockRead, quantity: int) -> None:
    if quantity > stock.available_quantity:
        raise InsufficientStock(stock.available_quantity)


def move_stock(session: Session, product_id: int, data: QuantityInput, *, entry: bool) -> StockRead:
    with write_transaction(session):
        stock = get_stock(session, product_id)
        if not entry:
            require_available(stock, data.quantity)
        new_total = stock.total_quantity + (data.quantity if entry else -data.quantity)
        if new_total > 1_000_000_000:
            raise BusinessError("stock_limit", "O estoque total não pode ultrapassar 1 bilhão de unidades.")
        product = get_product(session, product_id)
        product.total_quantity = new_total
        session.flush()
        result = get_stock(session, product_id)
    return result


def reserve(session: Session, product_id: int, data: ReservationCreate) -> ReservationRead:
    with write_transaction(session):
        require_available(get_stock(session, product_id), data.quantity)
        record = repository.add_allocation(session, Reservation, product_id=product_id, **data.model_dump())
        result = ReservationRead.model_validate(record)
    return result


def block(session: Session, product_id: int, data: BlockCreate) -> BlockRead:
    with write_transaction(session):
        require_available(get_stock(session, product_id), data.quantity)
        record = repository.add_allocation(session, Block, product_id=product_id, **data.model_dump())
        result = BlockRead.model_validate(record)
    return result


def get_allocation(session: Session, model, allocation_id: str):
    allocation = repository.get_allocation(session, model, allocation_id)
    if allocation is None:
        raise NotFound("Reserva" if model is Reservation else "Bloqueio")
    return allocation


def release(session: Session, model, allocation_id: str):
    schema = ReservationRead if model is Reservation else BlockRead
    with write_transaction(session):
        record = get_allocation(session, model, allocation_id)
        if record.released_at is None:
            record.released_at = utc_now()
            session.flush()
        result = schema.model_validate(record)
    return result


def list_allocations(session: Session, model, product_id: int, active: bool | None):
    if get_product(session, product_id) is None:
        raise NotFound("Produto")
    return repository.list_allocations(session, model, product_id, active)
