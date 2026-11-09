from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import write_transaction
from app.main import create_app


def test_two_concurrent_reservations_only_one_succeeds(client, product):
    base = f"/api/products/{product['id']}"
    client.post(base + "/entries", json={"quantity": 10})
    barrier = Barrier(2)

    def reserve(request_id):
        barrier.wait(timeout=5)
        return client.post(base + "/reservations", json={"quantity": 7, "request_id": request_id}).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(reserve, ["A", "B"]))
    assert sorted(statuses) == [201, 409]
    stock = client.get(base + "/stock").json()
    assert stock["available_quantity"] == 3
    assert stock["reserved_quantity"] == 7


def test_concurrent_release_does_not_double_credit(client, stocked_product):
    base = f"/api/products/{stocked_product['id']}"
    reservation = client.post(base + "/reservations", json={"quantity": 40, "request_id": "A"}).json()
    barrier = Barrier(2)

    def release(_):
        barrier.wait(timeout=5)
        return client.post(f"/api/reservations/{reservation['id']}/release").json()

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(release, range(2)))
    assert responses[0] == responses[1]
    assert client.get(base + "/stock").json()["available_quantity"] == 100


def test_busy_database_returns_503_and_recovers(tmp_path):
    app = create_app(Settings(database_path=tmp_path / "busy.db", busy_timeout_ms=30))
    with TestClient(app) as client:
        product = client.post("/api/products", json={"sku": "BUSY", "name": "Ocupado"}).json()
        with Session(app.state.engine) as lock, write_transaction(lock):
            response = client.post(f"/api/products/{product['id']}/entries", json={"quantity": 1})
            assert response.status_code == 503
            assert response.headers["Retry-After"] == "1"
        assert client.get(f"/api/products/{product['id']}/stock").json()["total_quantity"] == 0
        assert client.post(f"/api/products/{product['id']}/entries", json={"quantity": 1}).status_code == 200
