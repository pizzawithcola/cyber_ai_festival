# 🎟 排队系统接入方案（注册后自动入队）

> 记录时间：2026-09-08 ｜ 最后更新：2026-09-16 ｜ 状态：**已上线（production）**
> 归属：后端仓库 `cyber_ai_festival_be`（本文档放前端 doc 中心仅作追踪）
> 关联 ISSUES：`BE-04`

## 一、目标与背景

- 业务：新用户 **register** 后，由后端把用户信息 POST 给外部排队系统，系统自动把用户放进公共大屏队列（摊位排队场景）。
- 现实约束：
  1. 排队系统 host 在云上（`queue-system-e6780.web.app`）。初期（2026-09-08）本地直连不稳，**2026-09-16 复测本机可稳定直连**，故本文所有证据均可本机复现；线上仍是 AWS 孟买出口。
  2. 我方服务部署在 **AWS 孟买**，真实入队请求由孟买侧发起。

## 二、排队系统 API 契约（2026-09-16 对生产队列实测确认）

- **BASE URL**：`https://queue-system-e6780.web.app/api`
- **AUTH**：Header `X-API-Key: <qk_...>`（机密，不入库；走 env / Secret Manager）
- **FORMAT**：`application/json` ｜ **VERSION**：`v1`
- **我方队列**：`Qmu0wnldvywckwcp0fvm`（name `Arcade`，description `For CAC`，active=true）
- **大屏地址**：`https://queue-system-e6780.web.app/#queue/Qmu0wnldvywckwcp0fvm`

### 入队 POST
```
POST {BASE}/v1/queues/{queueId}/participants
Body:
  name        string  required  1–100   — 大屏公开显示；**不是**去重键
  externalId  string  optional  Max128  — 我方 user id，服务端按此去重
  email       string  optional          — 已不再是必填；保留仅为向后兼容
Response:
  201 = 新加入（alreadyInQueue=false）
  200 = 该 externalId 已在队里（alreadyInQueue=true，返回同一个 participantId）
  400 = {"error":"name_required"} / {"error":"name_too_long"}（超过 100 字符）

响应字段：participantId / state / name / position / rank / peopleAhead /
          totalInQueue / joinedAt / externalId / alreadyInQueue / queueBoardUrl
```

### 其它
```
GET    {BASE}/v1/queues                  # 列队列（含 totalInQueue）
GET    {BASE}/v1/queues/{queueId}        # 单队列状态；**不返回 participants**
DELETE {BASE}/v1/queues/{queueId}/participants/{participantId}   # 未公开文档，实测可用
```

> ⚠️ **没有任何“列出参与者”的公开路由**（`GET .../participants` → 404）。要拿 `participantId` 只有两条路：
> ① 从 POST 响应或后端日志里取；② 用同一 `externalId` 再 POST 一次，幂等响应会把 id 还给你。
>
> ⚠️ `position` 是单调递增的入队序号，**不是当前排位**；大屏应显示 `rank` / `peopleAhead`。

## 三、字段映射（已定稿）

| Queue 字段 | 来源 | 说明 |
|---|---|---|
| `name` | 用户 nickname | 截断到 100 字符；为空时兜底 `Player <id>`（服务端强制非空且不得超 100）|
| `externalId` | 我方 user id | **去重键**，天然唯一，不可能碰撞 |
| `email` | **不再发送** | 系统已改为可选；发它是多余的，且会涉及隐私 |

> ✅ 去重键从 `email` 改成 `externalId` 之后：
> - 不再需要“假邮箱”（`nickname@gmail.com`），也随之去掉了字符清洗、同名冲突这一整类问题；
> - 请求体里**再没有任何玩家邮箱**离开我方系统；
> - 同一 user 重复注册/重复调用是幂等的，绝不会在大屏上出现两次。

## 四、实测证据（2026-09-16，打生产队列，非 mock）

### 4.1 契约探测（httpx 直连）

| 用例 | 结果 | 结论 |
|---|---|---|
| POST **不带** `email` | **201** | email 已非必填 |
| POST 带 `email` | **201** | 向后兼容仍在 |
| 同 `externalId` 再 POST | **200** `alreadyInQueue=true`，**同一 participantId** | **去重键 = `externalId`** |
| 同 `name` 不同 `externalId` | **201** | `name` **不是**去重键，同名玩家不会互相吞掉 |
| `name` 含 `@`（`admin@admin.com`）| **201** | 旧版会 400 `email_invalid`，现已不是问题 |
| `name` 含空格 | **201** | 同上 |
| `name` 长度 50 / 100 / 200 / 500 | 201 / 201 / **400 name_too_long** / 400 | 上限就是 100，与代码截断值一致 |
| `name` 为空 / 缺失 | **400 name_required** | 必须兜底非空 |

### 4.2 服务层测试（`app/services/queue_service.py` → 真实队列）

| 用例 | 结果 |
|---|---|
| 新玩家入队 | ✅ enqueue=True，人数 +1 |
| 同一 user 重复入队 | ✅ enqueue=True，人数不变，服务端 `alreadyInQueue=true` |
| 同名不同 user | ✅ 各自占位，人数 +1 |
| 空昵称 | ✅ 兜底 `Player <id>` 后入队 |
| 300 字符昵称 | ✅ 截断到 100 后入队 |
| 邮箱形态昵称 | ✅ 原样入队 |
| `QUEUE_ENABLED=false` | ✅ 返回 False，不发请求，队列不变 |
| 测试数据清理 | ✅ 人数还原 |

### 4.3 线上端到端（部署后，走真实 ALB）

| 步骤 | 结果 |
|---|---|
| `POST /users/` 注册测试用户 | HTTP 200，`id=191`，`nickname=Qe2e70411P_001` |
| 后台任务入队（约 2s 内）| `totalInQueue` 1 → 2 |
| 线上日志格式 | `Queue: user 191 (Qe2e70411P_001) -> HTTP 201 (id=..., rank=2, ahead=1, already=False, total=2)`（旧格式 `joined as ...@gmail.com` 已 0 条）|
| 重复提交同 `externalId` | HTTP 200 `alreadyInQueue=true`，人数不变 |
| 大屏数据源（Firebase RTDB `members.json`）| 只读无需鉴权，可见 `{"name":"...","position":N,"source":"api"}` |
| 清理（删测试用户 + 删 participant）| 人数还原为 1 |

> 判据说明：空名 / 超长名 / 旧邮箱校验的失败全都表现为 HTTP 400，会被 `enqueue_user` 转成 `False`；
> 因此“返回 True + 人数 +1”本身就证明了兜底与截断生效。
> 测试脚本 `/tmp/queue_service_test2.py`（临时文件，不入库），**10/10 通过**。

## 五、后端实现（已上线）

`app/services/queue_service.py`：

- **触发点**：`POST /users/` 注册成功后 `background_tasks.add_task(enqueue_user, user.id, user.nickname)`，**不阻塞注册**。
- **请求体**：`{"name": <nickname 截断 100>, "externalId": "<user id>"}`，**不带 email**。
- **健壮性**：
  - `enqueue_user` **永不抛异常**，任何失败只记日志，注册照常成功；
  - 4xx = 永久失败不重试（`name_required` / `name_too_long` / key 错）；网络 / 5xx 重试 3 次（1s、2s 退避）；
  - 去重交给服务端：重复提交幂等，不会产生第二条。
- **日志埋点**：`Queue: user <id> (<name>) -> HTTP <code> (id=..., rank=..., ahead=..., already=..., total=...)`。

配置（env / `infra/cloudformation.yml` + `fixed-task-def.json`）：

| 变量 | 值 |
|---|---|
| `QUEUE_ENABLED` | `true` |
| `QUEUE_BASE_URL` | `https://queue-system-e6780.web.app/api` |
| `QUEUE_QUEUE_ID` | `Qmu0wnldvywckwcp0fvm` |
| `QUEUE_API_KEY` | Secrets Manager `cyber-ai-festival/queue-api-key` |
| `QUEUE_TIMEOUT_SECONDS` | `10` |

## 六、前端行为

注册成功后（`src/components/sharedPages/RegisterPage.tsx`）：

1. 新标签页打开排队大屏 `VITE_QUEUE_BOARD_URL`（默认 `https://queue-system-e6780.web.app/#queue/Qmu0wnldvywckwcp0fvm`）；
2. 若被浏览器拦截，页面提供 `▶ OPEN QUEUE SCREEN` 手动按钮兜底；
3. 昵称使用响应式字号（`nicknameFontSize()`），长昵称不再溢出。

## 七、遗留风险 / 注意事项

1. **入队失败是静默的**：注册永远成功，玩家可能没进队。目前只能靠 CloudWatch 里的
   `Queue rejected` / `Queue: could not enrol` 发现。若现场要求绝对可靠，需加重试队列或管理端补偿按钮。
2. **没有公开的参与者查询接口**：大屏是否显示正确只能看大屏本身 + `totalInQueue`；
   排查时用「同 externalId 再 POST」取回 `participantId`。
   - 💡 **最快的现场排查手段**：大屏本质是 Firebase RTDB，**只读无需鉴权**，直接看
     `https://queue-system-e6780-default-rtdb.firebaseio.com/queues/Qmu0wnldvywckwcp0fvm/members.json`
     就能看到大屏真正渲染的成员（字段 `name` / `position` / `joinedAt` / `source`，`source:"api"` 即我方 API 入队）。
     `nextPosition.json` 是下一个入队序号。
3. `DELETE` 路由未在文档中出现，**随时可能变更**；仅用于测试清理，不写进业务流程。
4. CloudFront 会把 API 的 404 伪装成 200（SPA fallback），排查时别被状态码骗到。

## 八、待办

- [x] 澄清 key↔queue 归属 → 队列 `Qmu0wnldvywckwcp0fvm`
- [x] 确认去重方案 → `externalId`（email 已可不传）
- [x] curl 冒烟（201/200）
- [x] 后端接入代码上线
- [ ] 现场真机：注册一名真实玩家 → 大屏应立刻出现该昵称（线上已用测试用户验到入队 + RTDB 数据落地，仅差现场目视）
- [ ] 与排队系统方确认 `DELETE` 路由是否正式支持（仅影响测试手段）

## 九、历史记录（已解决的问题，留档）

| 问题 | 结论 |
|---|---|
| 2026-09-08 `GET /v1/queues` 返回空数组，`Qm9x4k2ptu8` 404 | 文档里的 id 只是示例；真实队列为 `Qmu0wnldvywckwcp0fvm` |
| 旧版 `email` 必填且严格校验（含空格 / `@` 直接 400 `email_invalid`） | 新版已改为可选，我方也不再发送 |
| 担心“按 email 去重 → 全员同邮箱只有 1 人能入队” | 去重键已换成 `externalId`，该陷阱彻底消失 |
| 担心“同名玩家被静默去重” | 实测同名不同 `externalId` 各自入队，无此风险 |
