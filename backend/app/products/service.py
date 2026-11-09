from sqlalchemy.orm import Session

from app.database import write_transaction
from app.exceptions import BusinessError
from app.products import repository
from app.products.schemas import ProductCreate, ProductRead


def create_product(session: Session, data: ProductCreate) -> ProductRead:
    with write_transaction(session):
        if repository.find_by_sku(session, data.sku):
            raise BusinessError("duplicate_sku", "Já existe um produto com esse SKU.")
        product = repository.add_product(session, data.sku, data.name)
        result = ProductRead.model_validate(product)
    return result
