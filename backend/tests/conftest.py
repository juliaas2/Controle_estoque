import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import Settings
from app.main import create_app


@pytest.fixture
def app(tmp_path):
    return create_app(Settings(database_path=tmp_path / "test.db", busy_timeout_ms=2000))


@pytest.fixture
def client(app):
    with TestClient(app) as client:
        yield client


@pytest.fixture
def engine(client, app):
    return app.state.engine


@pytest.fixture
def session(engine):
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def product(client):
    result = client.post("/api/products", json={"sku": "PROD-001", "name": "Caderno"})
    assert result.status_code == 201
    return result.json()


@pytest.fixture
def stocked_product(client, product):
    assert client.post(f"/api/products/{product['id']}/entries", json={"quantity": 100}).status_code == 200
    return product
