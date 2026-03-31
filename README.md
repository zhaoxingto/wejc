# 渠道平台 AI 开发蓝图（完整版）

这是一套用于**规范 AI 系统性开发不跑偏**的完整指导文件包，适用于 GPT / Claude / Cursor / Copilot / Devin 等。

## 当前后端状态

当前仓库已经包含一套可运行的 FastAPI 后端骨架，覆盖：

- M1 基础骨架
- M2 店铺入口与 `store_context_token`
- M3 商品与 SKU 骨架、商品同步 API
- M4 购物车与订单主链路
- M5 ERP / 第三方推送任务、重试与重推
- M6 日志、Docker、部署脚本和文档

常用命令：

```bash
python -m pytest -q
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Windows 一键启动：

```powershell
.\scripts\start.bat
```

它会尝试自动完成：
- 启动 postgres / redis（如果本机可用 docker compose）
- 构建 `admin-web`
- 执行数据库迁移
- 灌入演示数据
- 启动后端服务

后台页面：

- 平台管理员控制台：`http://127.0.0.1:8000/admin`
- 规范版前端源码：`admin-web/`
- 前端单独开发：在 `admin-web/` 下运行 `npm install`、`npm run dev`
- 当前已支持：平台登录、租户管理、店铺管理、接入配置管理、分页搜索、来源商品发布、订单监管、推送任务重试与日志查看
- 默认平台管理员：`admin / admin123456`

本地演示数据：

```bash
python -m alembic upgrade head
python scripts/seed_demo_data.py
```

执行后可直接打开平台后台；如果需要验证商家上下文接口，演示店铺编码仍然是 `SHP8A92KD`。

更多说明：

- [API 文档](docs/API.md)
- [部署说明](docs/DEPLOYMENT.md)
- [测试说明](docs/TESTING.md)

手动部署入口：

```bash
chmod +x scripts/deploy_manual.sh
./scripts/deploy_manual.sh
```

## 使用顺序

1. 先把 `00_AI总规则手册.md` 发给 AI
2. 再把 `01_系统蓝图与边界.md` 发给 AI
3. 开始某个模块时，同时附上：
   - `02_架构与目录规范.md`
   - `03_数据库与领域模型规范.md`
   - `04_API与服务层规范.md`
4. 做具体模块时，对照：
   - `05_模块开发顺序与任务地图.md`
   - `06_AI任务模板与提示词库.md`
5. 做代码审查时使用：
   - `07_验收标准与自检清单.md`
   - `08_禁止事项与跑偏纠正手册.md`

## 文件清单

- `00_AI总规则手册.md`
- `01_系统蓝图与边界.md`
- `02_架构与目录规范.md`
- `03_数据库与领域模型规范.md`
- `04_API与服务层规范.md`
- `05_模块开发顺序与任务地图.md`
- `06_AI任务模板与提示词库.md`
- `07_验收标准与自检清单.md`
- `08_禁止事项与跑偏纠正手册.md`
- `09_页面蓝图与前后端协作规范.md`
- `10_ERP与第三方接入规范.md`
- `11_测试日志部署规范.md`
- `12_完整开发里程碑.md`

## 推荐用法

把下面这段作为每次给 AI 的开头：

```text
你现在是本项目的高级工程师。你必须严格遵守我提供的《渠道平台 AI 开发蓝图（完整版）》。
如果我的临时要求与蓝图冲突，先指出冲突，再给出兼容方案。
禁止脱离蓝图自由发挥。
所有输出都必须符合：
1. 多租户 tenant_id + shop_id
2. 私域渠道店铺入口 shop_code / scene
3. source_product + channel_product 双层商品模型
4. SKU 多属性多规格
5. 无支付，下单即生成订单
6. 订单异步推送 ERP / 第三方
7. API -> Service -> Repository/ORM -> DB 分层
8. 先设计后编码，先模型后接口，先测试后交付
```
