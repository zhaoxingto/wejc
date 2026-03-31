# 04 API与服务层规范

## 4.1 API 分层

建议按上下文分为：

- `/api/platform/*`
- `/api/merchant/*`
- `/api/store/*`
- `/api/customer/*`
- `/api/integration/*`

## 4.2 入口解析 API

### POST /api/store/resolve

作用：
- 根据 shop_code / scene 解析店铺
- 返回店铺基础信息
- 签发 store_context_token

请求：
```json
{
  "code": "SHP8A92KD"
}
```

返回：
```json
{
  "tenant_id": 1,
  "shop_id": 2,
  "shop_name": "A商家订货店",
  "logo": "https://...",
  "store_context_token": "..."
}
```

## 4.3 店铺前台 API

### 获取首页
`GET /api/store/home`

### 商品列表
`GET /api/store/products`

### 商品详情
`GET /api/store/products/{id}`

### 购物车添加
`POST /api/customer/cart/add`

### 创建订单
`POST /api/customer/orders`

### 订单列表
`GET /api/customer/orders`

## 4.4 商家后台 API

### 手动同步商品
`POST /api/merchant/products/sync`

### 渠道商品列表
`GET /api/merchant/channel-products`

### 渠道商品上下架
`POST /api/merchant/channel-products/{id}/publish`

### 订单列表
`GET /api/merchant/orders`

### 手动重推订单
`POST /api/merchant/orders/{id}/repush`

## 4.5 接入 API

### ERP 拉取商品
`POST /api/integration/products/pull`

### 订单推送回调
`POST /api/integration/orders/push`

## 4.6 Service 设计原则

每个核心领域必须有独立 service，例如：

- `StoreEntryService`
- `ProductService`
- `SkuService`
- `CartService`
- `OrderService`
- `OrderPushService`
- `IntegrationService`

## 4.7 创建订单服务铁律

创建订单必须做：
1. 校验店铺上下文
2. 校验商品存在且属于当前店铺
3. 校验 SKU 存在且属于该商品
4. 校验库存/可售状态
5. 生成订单
6. 生成订单明细快照
7. 创建推送任务

其中第 7 步只能是**创建任务记录**，不能直接调用外部 ERP。

## 4.8 错误处理规范

Service 必须抛出明确业务异常，例如：
- ShopNotFound
- ProductNotFound
- SkuNotFound
- TenantMismatch
- OrderPushFailed

API 层统一转换为标准响应结构。

## 4.9 响应结构建议

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

错误时：
```json
{
  "code": 4001,
  "message": "shop not found",
  "data": null
}
```