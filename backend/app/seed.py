"""Optional demo data. Never deletes or changes existing products."""

from sqlalchemy.orm import Session

from app.config import Settings
from app.database import build_engine, initialize_database, write_transaction
from app.inventory.models import Block, Reservation
from app.inventory.repository import add_allocation
from app.products.repository import add_product, find_by_sku

DEMO_PRODUCTS = [
    ("CAD-001", "Caderno pontilhado", 240, 32, 8),
    ("CAN-002", "Caneta esferográfica", 580, 60, 20),
    ("PAP-003", "Papel A4 · 500 folhas", 120, 15, 5),
    ("ORG-004", "Organizador de mesa", 48, 6, 0),
]


def seed(engine) -> int:
    created = 0
    with Session(engine, expire_on_commit=False) as session, write_transaction(session):
        for sku, name, total, reserved, blocked in DEMO_PRODUCTS:
            if find_by_sku(session, sku):
                continue
            product = add_product(session, sku, name)
            product.total_quantity = total
            session.flush()
            add_allocation(
                session, Reservation, product_id=product.id, quantity=reserved, request_id=f"PEDIDO-{sku}"
            )
            if blocked:
                add_allocation(
                    session,
                    Block,
                    product_id=product.id,
                    quantity=blocked,
                    reason="Aguardando inspeção de qualidade",
                    request_id=None,
                )
            created += 1
    return created


if __name__ == "__main__":
    engine = build_engine(Settings().database_path)
    try:
        initialize_database(engine)
        print(f"{seed(engine)} produto(s) de demonstração criado(s).")
    finally:
        engine.dispose()
