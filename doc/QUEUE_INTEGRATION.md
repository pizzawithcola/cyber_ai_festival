# 🎟 排队系统接入方案（注册后自动入队）

> 记录时间：2026-09-08 ｜ 状态：**shelved / blocked**（key 与 queue 归属待澄清）
> 归属：后端仓库 `cyber_ai_festival_be`（本文档放前端 doc 中心仅作追踪）
> 关联 ISSUES：`BE-04`

## 一、目标与背景

- 业务：新用户 **register** 后，由后端把用户信息 POST 给外部排队系统，系统自动把用户放进公共大屏队列（摊位排队场景）。
- 现实约束：
  1. 我方在国内，排队系统 hosted 在 claude 域，**本地无法可靠直连**（国内出口不稳；即便 VPN，也只影响本机）。
  2. 我方服务部署在 **AWS 孟买** → 部署后可由孟买侧调用该 API 做真实网络验证。

## 二、排队系统 API 契约（已确认部分）

- **BASE URL**：`https://queue-system-e6780.web.app/api`
- **AUTH**：Header `X-API-Key: <qk_...>`（key 属机密，不入库；走 env / Secret）
- **FORMAT**：`application/json`
- **VERSION**：`v1`

### 入队 POST
```
POST {BASE}/v1/queues/{queueId}/participants
Body:
  email       string  required  Max254 — 身份标识（服务端按此去重）
  name        string  required  1–100  — 大屏公开显示
  externalId  string  optional  Max128 — 我方用户 id，私有存储并回显
Response:
  201 = 新加入
  200 = 该 email 已在队里（幂等友好）
```

### 其它
```
GET {BASE}/v1/queues   # 列队列（文档示例：Qm9x4k2ptu8 / Friday Night Arcade / active）
```

## 三、字段映射（待定项已标 ⚠️）

| Queue 字段 | 来源 | 备注 |
|---|---|---|
| `name` | 用户 nickname | 已定 |
| `externalId` | 我方 user id | 已定 |
| `email` | ⚠️ 未最终定 | 候选：a) 统一 `"None"`；b) `nickname@gmail.com`（用户倾向，需注意合法字符清洗 + 同名去重）|

## 四、本地实测结果（2026-09-08）

| 测试 | 结果 | 结论 |
|---|---|---|
| `curl` ping `{BASE}` / 根路径 | **200**（~1.1s） | 域名/TLS/出口可达 |
| `GET /api/v1/queues`（带 key） | **200** `{"queues":[]}` | **key 鉴权通过，但名下无任何队列** |
| `POST /api/v1/queues/Qm9x4k2ptu8/participants` | **404** `{"error":"queue_not_found"}` | 该 queueId 不属于这把 key |

> 结论：认证链路 OK；`Qm9x4k2ptu8`（文档示例）对这把 key 不可见。文档里的 GET 响应很可能只是**示例**，或该队列挂在**另一把 key / 账号**下。

## 五、阻塞项（解决后才可继续）

1. **确定正确的 key↔queue 归属**：要么换能看见 `Qm9x4k2ptu8`（或真实 Friday Night Arcade）的 key；要么该 key 名下需先**创建队列**（若存在 `POST /v1/queues` 之类接口，需文档确认）。
2. **`email` 去重键方案拍板**（全统一 vs nickname 合成；合成需清洗非法字符、防同名）。
3. 若系统按 email 去重且全员用同一 email → **只有第 1 个用户能入队**，属设计陷阱，需规避。

## 六、开发方案（后端，待解阻后落地）

- **触发点**：后端注册成功回调（FastAPI），用 `BackgroundTasks`/httpx **异步** POST，不阻塞注册主流程。
- **参数**：`email`（按第五节定）、`name=nickname`、`externalId=user id`。
- **配置化**：`QUEUE_BASE_URL` / `QUEUE_QUEUE_ID` / `QUEUE_API_KEY` 全部 env（AWS 用 Secret Manager / ECS env），**key 绝不写代码**。
- **健壮性**：失败仅记日志 + 指数退避重试（有限次）；**绝不让排队失败回滚/阻断注册**；按 200=已存在做幂等（不重复 POST 已在队用户）。
- **⚠️ email 唯一性**：若去重键是 email，需保证每个真实用户 email 唯一，否则后排用户永不入队。

## 七、测试方案

1. **本地（国内）**：不直连真 API；用 mock 断言「注册→入队」的参数拼装、幂等、失败容忍逻辑。
2. **孟买连通性冒烟（先于业务）**：在部署机上裸 `curl` POST（真 key/真 payload）验证 egress + 鉴权 + 队列归属（最真实，先做这步）。
3. **端到端**：部署后注册测试用户 → 看后端日志 201/200 → 若文档有查询接口再确认在队。
4. **失败演练**：临时改错 URL，确认注册不受影响、错误有日志。

## 八、当前待办

- [ ] 澄清 key↔queue 归属（换 key 或建队列）
- [ ] 确认 email 去重方案
- [ ] 拿到正确 queueId 后，孟买 curl 冒烟（预期 201/200）
- [ ] 后端接入代码 + 本仓库方案评审
