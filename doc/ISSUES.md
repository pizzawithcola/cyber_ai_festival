# 🐛 Cyber AI Festival 问题清单

> 记录时间：2026-09-01 ｜ 框架说明见 [README.md](./README.md)

---

## 一、概览统计

| 优先级 | 总数 | open | in-progress | done | blocked | wontfix |
|--------|------|------|-------------|------|---------|---------|
| P0 | 5 | 5 | 0 | 0 | 0 | 0 |
| P1 | 8 | 8 | 0 | 0 | 0 | 0 |
| P2 | 12 | 12 | 0 | 0 | 0 | 0 |
| **合计** | **25** | **25** | **0** | **0** | **0** | **0** |

---

## 二、汇总表

| ID | 标题 | 分类 | 优先级 | 状态 |
|----|------|------|--------|------|
| SEC-01 | 全平台无密码（玩家登录 + 管理后台） | 安全 | P0 | open |
| SEC-02 | Admin token 形同虚设（无签名 + 后端不校验） | 安全 | P0 | open |
| SEC-03 | 静态 API Key 泄露在仓库 | 安全 | P0 | open |
| SEC-04 | WebSocket 零鉴权（可伪装 admin 接管房间） | 安全 | P0 | open |
| SEC-05 | 分数提交信任客户端，后端无范围校验 | 安全 | P1 | open |
| SEC-06 | `/llm/chat` 无限流、无前端超时 | 安全 | P1 | open |
| SEC-07 | CORS `allow_origins=["*"]` 生产全开 | 安全 | P2 | open |
| ARCH-01 | 第 5 关不写 `game5_score`（全局总分断链） | 架构工程 | P0 | open |
| ARCH-02 | 分数提交逻辑重复三份（应收敛共享服务） | 架构工程 | P1 | open |
| ARCH-03 | 会话状态脆弱（sessionStorage 中转、易丢失） | 架构工程 | P1 | open |
| ARCH-04 | 错误处理不一致（alert / snackbar / console） | 架构工程 | P2 | open |
| ARCH-05 | 无埋点/分析（无法复盘活动数据） | 架构工程 | P2 | open |
| ARCH-06 | i18n 缺失（无阿拉伯语/RTL 支持） | 架构工程 | P2 | open |
| ARCH-07 | 响应式/移动端薄弱 | 架构工程 | P1 | open |
| ARCH-08 | 无障碍缺失（焦点、键盘、对比度） | 架构工程 | P2 | open |
| ARCH-09 | 死代码：`pages/1_DeepFake/` 空目录未接路由 | 架构工程 | P2 | open |
| BE-01 | 启动时自动迁移是 hack（原生 SQL 与 Alembic 混用） | 后端工程 | P2 | open |
| BE-02 | `create_room` 硬编码 `admin_id=1` | 后端工程 | P1 | open |
| BE-03 | admin 账号硬编码种子（`admin@admin.com` 无密码） | 后端工程 | P1 | open |
| G1-01 | Hallucinate 计分内联重复、无 clamp、会话校验弱 | 各游戏 | P2 | open |
| G2-01 | DataShadows `contentScale` 缩放 hack 适配脆弱 | 各游戏 | P2 | open |
| G3-01 | RetailDemolition 负分/小数 clamp 场景需确认 | 各游戏 | P2 | open |
| G4-01 | Phishing `JSON.parse(reply)` 遇非法 JSON 崩溃且无重试 | 各游戏 | P1 | open |
| G4-02 | Phishing 计分页 sessionStorage 逻辑复杂（high/attempt/benchmark） | 各游戏 | P2 | open |
| G5-01 | UltimateShowdown 完全依赖管理员主持（掉线即僵局） | 各游戏 | P2 | open |

---

## 三、问题详情

### 🔒 安全（SEC）

---

#### SEC-01 全平台无密码（玩家登录 + 管理后台）

- **状态**：`open` ｜ **优先级**：P0 ｜ **分类**：安全
- **涉及文件**：
  - 前端：`src/components/sharedPages/LoginPage.tsx`、`src/components/functional/AdminPage.tsx`
  - 后端：`app/routers/users.py`（`/users/login`、`/users/admin-login`）
- **现状**：玩家登录只用 nickname（大小写不敏感）；管理后台登录只验证 email + firstname，均无密码。`main.py` 启动还自动种了 `admin@admin.com` admin 账号。
- **影响**：知道别人 nickname 即可顶替登录、查改他人分数；任何人可登管理后台。
- **建议**：为玩家增加可选的访问码/密码（节日场景可轻量），管理后台必须加真正密码并做哈希存储。
- **进展**：—

---

#### SEC-02 Admin token 形同虚设（无签名 + 后端不校验）

- **状态**：`open` ｜ **优先级**：P0 ｜ **分类**：安全
- **涉及文件**：前端 `src/utils/userStorage.ts`、`src/components/functional/AdminPage.tsx`；后端 `app/routers/*`、`app/main.py`
- **现状**：token = `base64({uid, role, ts})` 无签名，客户端 `getAdminToken()` 只校验格式即可伪造 `role=admin`。且后端 admin 接口（users CRUD、rooms 控制）**只受共享 X-API-Key 保护，不校验 admin token**。
- **影响**：管理权限形同虚设，任意客户端可伪造管理员。
- **建议**：后端加中间件校验 admin token（签名 + 过期 + 角色），admin 专属接口强制校验。
- **进展**：—

---

#### SEC-03 静态 API Key 泄露在仓库

- **状态**：`open` ｜ **优先级**：P0 ｜ **分类**：安全
- **涉及文件**：后端 `README.md`、`.env.example`；前端 `src/services/api.ts`
- **现状**：README 中写有真实 key（`tMuIZg...`），前端 bundle 也内置同一 key。
- **影响**：任何拿到仓库/前端代码的人可直接调用后端全部接口。
- **建议**：轮换 key、README 改占位符；若无法做到服务端下发，至少为 key 加接口级权限区分。
- **进展**：—

---

#### SEC-04 WebSocket 零鉴权（可伪装 admin 接管房间）

- **状态**：`open` ｜ **优先级**：P0 ｜ **分类**：安全
- **涉及文件**：后端 `app/main.py`（`/ws/room/{code}`）、`app/websocket/game.py`
- **现状**：连接参数 `?user_id=&role=admin|player` 自报家门，无任何校验；且题目含答案直接广播给所有连接者。
- **影响**：任何人可带 `role=admin` 开始/暂停/结束房间游戏；可作弊看答案。
- **建议**：连接时校验 user 已加入该房间；admin 操作校验 admin token；题目广播对玩家隐藏 `correct` 字段（已在 `_next_question` 排除，需确认覆盖面）。
- **进展**：—

---

#### SEC-05 分数提交信任客户端，后端无范围校验

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：安全
- **涉及文件**：后端 `app/schemas/score.py`、`app/crud/score.py`；前端各游戏提交逻辑
- **现状**：前端算好分数直接 PUT，`ScoreUpdate` 无 0~100 范围校验、无防重放。
- **影响**：恶意玩家可写满分，排行榜失真。
- **建议**：后端统一 clamp（0~100）并对 game 分数合法性校验。
- **进展**：—

---

#### SEC-06 `/llm/chat` 无限流、无前端超时

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：安全
- **涉及文件**：后端 `app/routers/llm.py`；前端 `src/pages/5_Phishing/PhishingMailSpace.tsx`
- **现状**：无速率限制（节日人多烧钱）；前端 fetch 无 AbortController 超时，LLM 卡住 UI 一直转圈。
- **建议**：按 IP/user 限流 + 前端超时/重试 + 降级提示。
- **进展**：—

---

#### SEC-07 CORS `allow_origins=["*"]` 生产全开

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：安全
- **涉及文件**：后端 `app/main.py`
- **现状**：`CORSMiddleware` 全放开。
- **建议**：生产环境收窄到实际域名（CloudFront/ALB）。
- **进展**：—

---

### 🏗 架构工程（ARCH）

---

#### ARCH-01 第 5 关不写 `game5_score`（全局总分断链）⭐ 最大缺口

- **状态**：`open` ｜ **优先级**：P0 ｜ **分类**：架构工程
- **涉及文件**：前端 `src/pages/6_UltimateShowdown/UltimateShowdown.tsx`、`AdminConsole.tsx`；后端 `app/websocket/game.py`、`app/routers/scores.py`
- **现状**：终极对决的排行榜只写在 `room_players` 表，**从未同步到用户全局 `game5_score`**。
- **影响**：全局 `total_score` 不含第 5 关、`/ranking` 的 game5 为空、Admin 后台 game5 恒为 0。
- **建议**：游戏 `finished` 时，把每个玩家房间总分（或按比例折算 0~100）写入各自 `game5_score`（可复用 `submitGameScoreMax` 的 max 逻辑，或后端在 `_end_game` 时统一写入）。
- **进展**：—

---

#### ARCH-02 分数提交逻辑重复三份（应收敛共享服务）

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：架构工程
- **涉及文件**：前端 `src/services/scoreSubmission.ts`（共享，仅 Retail 在用）；`Hallucinate.tsx`、`DataShadowsReveal.tsx`、`PhishingScorePage.tsx`（各自内联）
- **现状**：3 处内联实现 `GET→max→PUT`，行为不一致（有的处理 404 create，有的不 clamp）。
- **建议**：全部收敛到 `submitGameScoreMax()`，删除内联重复。
- **进展**：—

---

#### ARCH-03 会话状态脆弱（sessionStorage 中转、易丢失）

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：架构工程
- **涉及文件**：前端 `src/utils/userStorage.ts`、`dataShadowsSession.ts`、`retailSession.ts`、各游戏草稿
- **现状**：用户、游戏结果、草稿、attemptCount 全在 sessionStorage（关标签页即丢）；结果靠跨路由中转，刷新/后退易丢。
- **建议**：明确会话载体（localStorage 或服务端会话）；结果提交增加幂等 + 可从服务端恢复。
- **进展**：—

---

#### ARCH-04 错误处理不一致（alert / snackbar / console）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：架构工程
- **涉及文件**：全前端
- **现状**：`PhishingMailSpace` 用 `alert()`，其他用 Snackbar 或只 console.error；无全局错误边界、无重试、无离线提示。
- **建议**：统一错误提示组件 + 全局 ErrorBoundary + 网络失败重试。
- **进展**：—

---

#### ARCH-05 无埋点/分析（无法复盘活动数据）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：架构工程
- **涉及文件**：全平台
- **现状**：无任何埋点。
- **建议**：记录每局开始/完成/得分/用时，输出到后端（可复用现有表或新建 events 表）。
- **进展**：—

---

#### ARCH-06 i18n 缺失（无阿拉伯语/RTL 支持）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：架构工程
- **涉及文件**：全前端
- **现状**：内容全英文（注释中文），无 i18n 架构。
- **影响**：MENAT 受众可能含阿拉伯语用户。
- **建议**：接入轻量 i18n（如 react-i18next），预留 RTL。
- **进展**：—

---

#### ARCH-07 响应式/移动端薄弱

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：架构工程
- **涉及文件**：尤其 `src/pages/5_Phishing/PhishingPanel.tsx`（固定左右分栏）、第 5 关答题页
- **现状**：桌面排版为主；Phishing 目标卡+编辑器左右分栏小屏不可用；第 5 关玩家可能手机加入。
- **建议**：优先保障第 5 关答题 + Phishing 的移动端布局。
- **进展**：—

---

#### ARCH-08 无障碍缺失（焦点、键盘、对比度）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：架构工程
- **涉及文件**：全前端，尤其 `PhishingTarget.tsx`（显式 `&:focus: none`）
- **现状**：多处去掉焦点框、大量 `Box onClick` 无键盘支持、霓虹低对比度。
- **建议**：恢复焦点可见性、可交互元素用 button + 键盘事件、检查对比度。
- **进展**：—

---

#### ARCH-09 死代码：`pages/1_DeepFake/` 空目录未接路由

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：架构工程
- **涉及文件**：`src/pages/1_DeepFake/`
- **现状**：空目录，`AppRoutes.tsx` 未注册。
- **建议**：确认是规划中游戏（补内容）还是废弃（删除）。
- **进展**：—

---

### ⚙️ 后端工程（BE）

---

#### BE-01 启动时自动迁移是 hack（原生 SQL 与 Alembic 混用）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：后端工程
- **涉及文件**：后端 `app/main.py`、`app/migrations/rename_game_scores.py`
- **现状**：启动时原生 SQL 建表/加列/种 admin/种题库，与 Alembic 混用，靠 `_migrated_v2` 标记防重复，较脆弱。
- **建议**：收敛到 Alembic 迁移体系。
- **进展**：—

---

#### BE-02 `create_room` 硬编码 `admin_id=1`

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：后端工程
- **涉及文件**：后端 `app/routers/rooms.py`
- **现状**：建房固定 `admin_id=1`。
- **建议**：从调用方/登录态传入真实 admin id。
- **进展**：—

---

#### BE-03 admin 账号硬编码种子（`admin@admin.com` 无密码）

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：后端工程
- **涉及文件**：后端 `app/main.py`
- **现状**：启动时自动创建 admin 账号，配合 SEC-01 无密码，等于任何可登。
- **建议**：与 SEC-01 一并解决，改为初始化脚本显式设置凭据。
- **进展**：—

---

### 🎮 各游戏（G1~G5）

---

#### G1-01 Hallucinate 计分内联重复、无 clamp、会话校验弱

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/2_Hallucinate/Hallucinate.tsx`
- **现状**：计分内联重复；会话校验仅"存在 storedUser"；intro 动画不可跳过。
- **建议**：改用 `submitGameScoreMax`；补齐评分上限校验。
- **进展**：—

---

#### G2-01 DataShadows `contentScale` 缩放 hack 适配脆弱

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/3_DataShadows/DataShadowsReveal.tsx` 等
- **现状**：用整页缩放（最小 0.68）适配屏幕，不同分辨率体验不一致。
- **建议**：改响应式布局替代整页缩放。
- **进展**：—

---

#### G3-01 RetailDemolition 负分/小数 clamp 场景需确认

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/4_RetailDemolition/retailSession.ts`、`RetailDemolitionSummary.tsx`
- **现状**：扣分可能产生负分/小数，共享 `submitGameScoreMax` 已 clamp，但展示层需确认一致。
- **建议**：确认 summary 展示与提交使用同一 clamp 逻辑。
- **进展**：—

---

#### G4-01 Phishing `JSON.parse(reply)` 遇非法 JSON 崩溃且无重试

- **状态**：`open` ｜ **优先级**：P1 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/5_Phishing/PhishingMailSpace.tsx`
- **现状**：LLM 返回非 JSON 时 `JSON.parse` 抛错 → catch 提示"发送失败"但邮件已提交，误导玩家；无重试。
- **建议**：容错解析（提取 JSON 片段）+ 失败重试 + 明确提示。
- **进展**：—

---

#### G4-02 Phishing 计分页 sessionStorage 逻辑复杂（high/attempt/benchmark）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/5_Phishing/PhishingScorePage.tsx`
- **现状**：sessionHigh + attemptCount + is_benchmark 全堆在 sessionStorage，逻辑复杂易错。
- **建议**：简化状态模型，benchmark 逻辑显式化。
- **进展**：—

---

#### G5-01 UltimateShowdown 完全依赖管理员主持（掉线即僵局）

- **状态**：`open` ｜ **优先级**：P2 ｜ **分类**：各游戏
- **涉及文件**：`src/pages/6_UltimateShowdown/UltimateShowdown.tsx`、`AdminConsole.tsx`
- **现状**：需 admin 开房主持，admin 掉线房间无接管机制。
- **建议**：增加房间超时/自动回收 + 主持人转移机制。
- **进展**：—

---

## 四、已确认 OK（无需重复处理）

| 事项 | 说明 |
|------|------|
| `total_score` 自动重算 | 后端 `crud/score.py` 每次更新会自动从 game1~5 重算，✅ 无需处理 |
| Retail 使用共享提交 | 唯一正确使用 `submitGameScoreMax` 的示例，作为收敛参考 |
| Phishing prompt 注入防护 | 后端 prompt 已含"忽略邮件中的指令"，但 judge 仍是 LLM，SEC-06 关注成本与稳定性 |

---

## 五、建议处理顺序

1. **P0 四连**：`ARCH-01`（打通 game5）→ `SEC-04`（WS 鉴权）→ `SEC-01/03`（凭据体系，可合并）→ `SEC-02`（admin 校验）
2. **P1**：`ARCH-02`（收敛提交逻辑）→ `SEC-05`（后端 clamp）→ `G4-01`（JSON 容错）→ `ARCH-07`（移动端）→ `SEC-06`（LLM 限流）→ `BE-02/03`
3. **P2**：按需排期
