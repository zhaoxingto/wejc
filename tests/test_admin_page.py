def test_admin_console_page_available(client) -> None:
    response = client.get("/admin")

    assert response.status_code == 200
    assert "WEJC Admin" in response.text
    assert "/admin/assets/" in response.text or "/admin/static/admin.js" in response.text


def test_merchant_admin_console_page_available(client) -> None:
    response = client.get("/merchant-admin")

    assert response.status_code == 200
    assert "WEJC 商家中台" in response.text
    assert "/merchant-admin/static/admin.js" in response.text
