import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import write_transaction
from app.inventory import repository, service
from app.inventory.models import Reservation
from app.inventory.schemas import ReservationCreate
from app.products.models import Product


def test_failure_after_insert_rolls_back(engine, stocked_product, monkeypatch):
    original = repository.add_allocation

    def fail_after_flush(*args, **kwargs):
        original(*args, **kwargs)
        raise RuntimeError("Falha simulada após INSERT")

    monkeypatch.setattr(repository, "add_allocation", fail_after_flush)
    with Session(engine) as session, pytest.raises(RuntimeError, match="Falha simulada"):
        service.reserve(session, stocked_product["id"], ReservationCreate(quantity=30, request_id="P-1"))
    with Session(engine) as verification:
        assert verification.scalar(select(Reservation)) is None
        stock = service.get_stock(verification, stocked_product["id"])
        assert stock.available_quantity == stock.total_quantity == 100


def test_foreign_keys_are_enforced(session):
    with pytest.raises(IntegrityError), write_transaction(session):
        session.add(Reservation(product_id=999, quantity=1, request_id="P-1"))
        session.flush()


def test_database_rejects_negative_total(session):
    with pytest.raises(IntegrityError), write_transaction(session):
        session.add(Product(sku="INVALID", name="Inválido", total_quantity=-1))
        session.flush()


def test_write_must_start_before_read(session, stocked_product):
    service.get_stock(session, stocked_product["id"])
    with pytest.raises(RuntimeError, match="antes de qualquer consulta"):
        service.reserve(session, stocked_product["id"], ReservationCreate(quantity=1, request_id="P-1"))
