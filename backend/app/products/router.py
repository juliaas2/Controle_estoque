from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.products import repository, service
from app.products.schemas import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["Produtos"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[ProductRead])
def list_products(session: SessionDep):
    return repository.list_products(session)


@router.post("", response_model=ProductRead, status_code=201)
def create_product(data: ProductCreate, session: SessionDep):
    return service.create_product(session, data)
