from app.seed import seed


def test_seed_is_repeatable_and_preserves_stock(client, engine):
    assert seed(engine) == 4
    products = client.get("/api/products").json()
    product = products[0]
    base = f"/api/products/{product['id']}"
    client.post(base + "/entries", json={"quantity": 9})
    before = client.get(base + "/stock").json()
    assert seed(engine) == 0
    assert client.get(base + "/stock").json() == before
    assert len(client.get("/api/products").json()) == 4
