from sqlalchemy import select
from sqlalchemy.orm import Session

from app.products.models import Product


def list_products(session: Session) -> list[Product]:
    return list(session.scalars(select(Product).order_by(Product.name, Product.id)))


def find_by_sku(session: Session, sku: str) -> Product | None:
    return session.scalar(select(Product).where(Product.sku == sku))


def get_product(session: Session, product_id: int) -> Product | None:
    return session.get(Product, product_id)


def add_product(session: Session, sku: str, name: str) -> Product:
    product = Product(sku=sku, name=name, total_quantity=0)
    session.add(product)
    session.flush()
    return product
