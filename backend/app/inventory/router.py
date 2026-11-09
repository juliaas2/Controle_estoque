from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.inventory import service
from app.inventory.models import Block, Reservation
from app.inventory.schemas import (
    BlockCreate,
    BlockRead,
    QuantityInput,
    ReservationCreate,
    ReservationRead,
    StockRead,
)

router = APIRouter(tags=["Estoque"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/products/{product_id}/stock", response_model=StockRead)
def get_stock(product_id: int, session: SessionDep):
    return service.get_stock(session, product_id)


@router.post("/products/{product_id}/entries", response_model=StockRead)
def entry(product_id: int, data: QuantityInput, session: SessionDep):
    return service.move_stock(session, product_id, data, entry=True)


@router.post("/products/{product_id}/outputs", response_model=StockRead)
def output(product_id: int, data: QuantityInput, session: SessionDep):
    return service.move_stock(session, product_id, data, entry=False)


@router.post("/products/{product_id}/reservations", response_model=ReservationRead, status_code=201)
def reserve(product_id: int, data: ReservationCreate, session: SessionDep):
    return service.reserve(session, product_id, data)


@router.get("/products/{product_id}/reservations", response_model=list[ReservationRead])
def list_reservations(product_id: int, session: SessionDep, active: bool | None = None):
    return service.list_allocations(session, Reservation, product_id, active)


@router.get("/reservations/{allocation_id}", response_model=ReservationRead)
def get_reservation(allocation_id: UUID, session: SessionDep):
    return service.get_allocation(session, Reservation, str(allocation_id))


@router.post("/reservations/{allocation_id}/release", response_model=ReservationRead)
def release_reservation(allocation_id: UUID, session: SessionDep):
    return service.release(session, Reservation, str(allocation_id))


@router.post("/products/{product_id}/blocks", response_model=BlockRead, status_code=201)
def block(product_id: int, data: BlockCreate, session: SessionDep):
    return service.block(session, product_id, data)


@router.get("/products/{product_id}/blocks", response_model=list[BlockRead])
def list_blocks(product_id: int, session: SessionDep, active: bool | None = None):
    return service.list_allocations(session, Block, product_id, active)


@router.get("/blocks/{allocation_id}", response_model=BlockRead)
def get_block(allocation_id: UUID, session: SessionDep):
    return service.get_allocation(session, Block, str(allocation_id))


@router.post("/blocks/{allocation_id}/release", response_model=BlockRead)
def release_block(allocation_id: UUID, session: SessionDep):
    return service.release(session, Block, str(allocation_id))
