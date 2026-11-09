import pytest


def test_complete_stock_lifecycle(client, stocked_product):
    base = f"/api/products/{stocked_product['id']}"
    reservation = client.post(base + "/reservations", json={"quantity": 20, "request_id": "P-1"}).json()
    block = client.post(base + "/blocks", json={"quantity": 10, "reason": "Inspeção"}).json()
    assert client.post(base + "/outputs", json={"quantity": 15}).status_code == 200
    stock = client.get(base + "/stock").json()
    assert stock == {
        "product_id": stocked_product["id"],
        "total_quantity": 85,
        "available_quantity": 55,
        "reserved_quantity": 20,
        "blocked_quantity": 10,
    }
    assert client.get(f"/api/reservations/{reservation['id']}").json()["request_id"] == "P-1"
    assert client.get(f"/api/blocks/{block['id']}").json()["reason"] == "Inspeção"
    for resource, record in [("reservations", reservation), ("blocks", block)]:
        response = client.post(f"/api/{resource}/{record['id']}/release")
        assert response.status_code == 200
        assert response.json()["released_at"] is not None
        repeated = client.post(f"/api/{resource}/{record['id']}/release")
        assert repeated.json() == response.json()
    stock = client.get(base + "/stock").json()
    assert stock["available_quantity"] == stock["total_quantity"] == 85


@pytest.mark.parametrize(
    "endpoint,extra",
    [
        ("entries", {}),
        ("outputs", {}),
        ("reservations", {"request_id": "P-1"}),
        ("blocks", {"reason": "Inspeção"}),
    ],
)
@pytest.mark.parametrize("quantity", [0, -1, 1.5, 1.0, True, "2", 1_000_000_001, None])
def test_strict_quantity_validation(client, stocked_product, endpoint, extra, quantity):
    response = client.post(
        f"/api/products/{stocked_product['id']}/{endpoint}", json={"quantity": quantity, **extra}
    )
    assert response.status_code == 422
    assert client.get(f"/api/products/{stocked_product['id']}/stock").json()["total_quantity"] == 100


@pytest.mark.parametrize(
    "endpoint,extra",
    [
        ("outputs", {}),
        ("reservations", {"request_id": "P-1"}),
        ("blocks", {"reason": "Inspeção"}),
    ],
)
def test_insufficient_stock_is_unchanged(client, stocked_product, endpoint, extra):
    base = f"/api/products/{stocked_product['id']}"
    before = client.get(base + "/stock").json()
    response = client.post(base + "/" + endpoint, json={"quantity": 101, **extra})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "insufficient_stock"
    assert client.get(base + "/stock").json() == before


def test_available_excludes_all_reservations_and_blocks(client, stocked_product):
    base = f"/api/products/{stocked_product['id']}"
    reservations = [
        client.post(base + "/reservations", json={"quantity": 20, "request_id": name}).json()
        for name in ["Pedido-A", "Pedido-B"]
    ]
    for _ in range(2):
        client.post(base + "/blocks", json={"quantity": 10, "reason": "Qualidade"})
    assert client.get(base + "/stock").json()["available_quantity"] == 40
    assert client.post(base + "/outputs", json={"quantity": 41}).status_code == 409
    client.post(f"/api/reservations/{reservations[0]['id']}/release")
    assert client.get(base + "/stock").json()["available_quantity"] == 60
    assert len(client.get(base + "/reservations?active=true").json()) == 1
    assert len(client.get(base + "/reservations?active=false").json()) == 1
    assert len(client.get(base + "/reservations").json()) == 2


def test_exact_available_can_be_consumed(client, stocked_product):
    base = f"/api/products/{stocked_product['id']}"
    client.post(base + "/reservations", json={"quantity": 20, "request_id": "P-1"})
    result = client.post(base + "/outputs", json={"quantity": 80})
    assert result.status_code == 200
    assert result.json()["available_quantity"] == 0
    assert result.json()["total_quantity"] == 20


@pytest.mark.parametrize(
    "path",
    [
        "/products/999/stock",
        "/products/999/reservations",
        "/products/999/blocks",
        "/reservations/00000000-0000-0000-0000-000000000000",
        "/blocks/00000000-0000-0000-0000-000000000000",
    ],
)
def test_unknown_resources(client, path):
    assert client.get("/api" + path).status_code == 404


def test_invalid_reservation_reference(client, product):
    response = client.post(
        f"/api/products/{product['id']}/reservations", json={"quantity": 1, "request_id": " "}
    )
    assert response.status_code == 422


def test_stock_limit(client, product):
    base = f"/api/products/{product['id']}"
    assert client.post(base + "/entries", json={"quantity": 1_000_000_000}).status_code == 200
    assert client.post(base + "/entries", json={"quantity": 1}).status_code == 409
    assert client.get(base + "/stock").json()["total_quantity"] == 1_000_000_000


def test_cors_and_health(client):
    response = client.options(
        "/api/products", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"}
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert client.get("/api/health").json() == {"status": "ok"}
