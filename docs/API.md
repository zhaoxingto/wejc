# API Documentation

## OpenAPI

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/openapi.json`

## Core Endpoints

### Health

- `GET /health`

### Platform

- `GET /api/platform/ping`
- `POST /api/platform/auth/login`
- `POST /api/platform/auth/change-password`
- `GET /api/platform/dashboard`
- `GET /api/platform/alerts/summary`
- `GET /api/platform/alerts`
- `GET /api/platform/audit-logs`
- `GET /api/platform/tenants`
- `POST /api/platform/tenants`
- `PUT /api/platform/tenants/{tenant_id}`
- `GET /api/platform/shops`
- `POST /api/platform/shops`
- `PUT /api/platform/shops/{shop_id}`
- `GET /api/platform/integrations`
- `POST /api/platform/integrations`
- `PUT /api/platform/integrations/{integration_id}`
- `GET /api/platform/source-products`
- `POST /api/platform/source-products/{source_product_id}/publish`
- `GET /api/platform/channel-products`
- `GET /api/platform/orders`
- `GET /api/platform/push-tasks`
- `POST /api/platform/push-tasks/{task_id}/retry`
- `GET /api/platform/push-logs`

### Store

- `POST /api/store/resolve`
- `GET /api/store/home`
- `GET /api/store/products`
- `GET /api/store/products/{product_id}`

All store-facing endpoints except `/api/store/resolve` require header:

```text
X-Store-Context-Token: <token>
```

### Customer

- `POST /api/customer/cart/add`
- `POST /api/customer/orders`
- `GET /api/customer/orders?customer_id=<id>`

### Merchant

- `POST /api/merchant/products/sync`
- `GET /api/merchant/source-products`
- `GET /api/merchant/orders`
- `POST /api/merchant/orders/{order_id}/repush`

### Integration

- `POST /api/integration/products/pull`
- `POST /api/integration/orders/push`

## Product Sync Flow

```text
merchant triggers sync
-> resolve active integration
-> pull products from external system
-> upsert source_product
-> return sync summary
```

## Admin Console

- Admin page: `/admin`
- Static assets: `/admin/static/*`
- The page is now the platform administrator console and uses same-origin API requests.
- Platform APIs require login and a Bearer token from `/api/platform/auth/login`.
- Password changes use `/api/platform/auth/change-password` with `current_password` and `new_password`.
- Platform list endpoints support `q`, `page`, and `page_size`.
- Platform login now uses database-backed admin accounts with `username` and `password`.
- Platform anomaly supervision uses `/api/platform/alerts/summary` and `/api/platform/alerts`.
- Platform operation audit logs are available from `/api/platform/audit-logs`.

## Order Push Flow

```text
create order
-> create order_push_task
-> worker/api trigger executes push task
-> write order_push_log
-> mark success or retrying
```

## Response Envelope

Success:

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

Failure:

```json
{
  "code": 4001,
  "message": "shop not found",
  "data": null
}
```
