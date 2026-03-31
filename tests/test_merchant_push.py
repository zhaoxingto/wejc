def test_list_merchant_push_logs(client, store_context_token, seeded_order) -> None:
    response = client.get(
        "/api/merchant/push-logs",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 0


def test_repush_order_then_has_push_log(client, store_context_token, seeded_order) -> None:
    response = client.post(
        f"/api/merchant/orders/{seeded_order['order_id']}/repush",
        headers={"X-Store-Context-Token": store_context_token},
    )

    assert response.status_code == 200

    log_response = client.get(
        "/api/merchant/push-logs",
        headers={"X-Store-Context-Token": store_context_token},
    )
    body = log_response.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["order_id"] == seeded_order["order_id"]
