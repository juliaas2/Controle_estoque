import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_create_normalizes_and_starts_at_zero(client):
    response = client.post("/api/products", json={"sku": " papel-01 ", "name": " Papel A4 "})
    assert response.status_code == 201
    assert response.json()["sku"] == "PAPEL-01"
    assert response.json()["name"] == "Papel A4"
    assert response.json()["total_quantity"] == 0
    assert len(client.get("/api/products").json()) == 1


def test_duplicate_sku_is_case_insensitive(client, product):
    response = client.post("/api/products", json={"sku": product["sku"].lower(), "name": "Outro"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "duplicate_sku"


@pytest.mark.parametrize(
    "payload",
    [
        {"sku": "", "name": "Produto"},
        {"sku": "A A", "name": "Produto"},
        {"sku": "SKU", "name": "  "},
        {"sku": "SKU", "name": "X", "total_quantity": 10},
    ],
)
def test_invalid_product(client, payload):
    assert client.post("/api/products", json=payload).status_code == 422


def test_persistence_after_restart(tmp_path):
    settings = Settings(database_path=tmp_path / "persistent.db")
    with TestClient(create_app(settings)) as first:
        product = first.post("/api/products", json={"sku": "PERSIST", "name": "Persistente"}).json()
        first.post(f"/api/products/{product['id']}/entries", json={"quantity": 10})
        reservation = first.post(
            f"/api/products/{product['id']}/reservations", json={"quantity": 3, "request_id": "P-1"}
        ).json()
    with TestClient(create_app(settings)) as second:
        stock = second.get(f"/api/products/{product['id']}/stock").json()
        assert stock["available_quantity"] == 7
        assert second.get(f"/api/reservations/{reservation['id']}").status_code == 200
