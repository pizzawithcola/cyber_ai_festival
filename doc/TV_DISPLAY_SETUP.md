# 📺 会议室三星电视常驻大屏方案（Leaderboard）

> 记录时间：2026-09-10 ｜ 状态：**方案已定，待实施/实测**
> 设备：**Samsung HG43AU800AUXUE**（`HG` = Hospitality 商用定制，43″，AU8000 平台 / Tizen）
> 用途：会议室电视**无人值守、全天候**显示游戏 Leaderboard（走电视自带系统的 Hospitality 模式，无机顶盒）
> 关联 ISSUES：见文末（如登记）

---

## 一、结论（先把路线说清楚）

- 展示 leaderboard **本身不需要"酒店模式"**；但要在**没有机顶盒**的情况下做到"**开机直达、常驻、防乱按**"，就得用这台机器自带的 **Hospitality / Standalone 模式**来配置。
- 该模式里有一个关键能力：**H.Browser Solution → URL Launcher**——可以把电视变成一个"按 URL 加载网页/应用"的终端。这正是我们要的口子。
- **网页本体无需为三星做特殊改造**；我们需要额外做的是"**TV 专用视图**"（全屏、大字号、自动刷新、隐藏交互）。

---

## 二、三星侧配置（已核实，来源见文末）

### 2.1 进入隐藏菜单（Standalone / Hospitality）
- 电视开机后，在遥控器上按：**`MUTE` → `1` → `1` → `9` → `OK`**
- 备用序列（型号/固件不同）：`Mute+1+1+9+Power`、`Mute+1+8+2+Power`、`Info+Settings+Mute+Power` 等
- 2023 后新款遥控：`+/-` → `上` → `下` → `确认`
- 菜单可能有 PIN，常见默认 `0000` / `1234`
- 进入后选择 **Hospitality mode → Standalone**

### 2.2 配置 URL 加载（核心）
在 Standalone 菜单里：
1. **H.Browser Solution** → **H.Browser Mode = ON**
2. **H.Browser Vendor** 会自动变成 **OTHER**
3. **URL Launcher Setting** → 填入我们的链接
   - ⚠️ 该链接需**实测**接受什么：① 纯网页 URL，或 ② 需托管的 Tizen 应用包（`.wgt`，可能需 Samsung 签名）
   - 参考：Uniguest 方案在同系列（AU800/Q60A）用 `https://setupmy.tv/tz6`；Nevron 方案用自家 IPTV 客户端 URL
4. 确认 **OK**，电视会"下载并安装"，随后可返回主菜单

### 2.3 24/7 常驻的必配项（Standalone 菜单内）
- `Menu OSD → Menu Display: OFF`（隐藏菜单提示）
- `Smart Services → Apps Editable`：按需（装应用时 ON，装完 OFF）
- `Network`：配置 WiFi/有线，`Network Status` 确认已联网
- `Virtual Standby → ON`（避免进入黑屏待机，保持画面常驻）
- （可选）`Cloning → Clone TV to USB` 把配置复制到同型号其它电视

### 2.4 常规菜单里的"防休眠/防干扰"项（主菜单）
- `Sound → Expert Settings → Sound Feedback: OFF`
- `General → Eco Solution / Power and Energy Saving`：全部 **OFF**
- `General → System Manager → Auto Protection Time: OFF`（关屏保）
- `General → External Device Manager → Anynet+ (HDMI-CEC): OFF`

### 2.5 有用的排查命令
- 查 Tizen 版本：遥控 `CONTENT` → 打开 WebBrowser → 访问 `https://j2i.net/apps/userAgent`
- 查 MAC：隐藏菜单 → `Network → Network Setup → Expert Settings → IPv6 Status`
- 注意：**H.Browser 若在 Tizen ≥ 4.0 的机器上不存在，说明该机型不支持此方案**

---

## 三、我方（前端）要做的：TV 专用视图

现状：已有 `/leaderboard`（`src/components/functional/LeaderboardPage.tsx`，含 **5s 自动轮播**，动态内容利于避免长期静止画面）。
计划：新增 **kiosk/TV 模式**（建议路由 `/tv`，内部复用 `LeaderboardPage`）：

- **16:9 全屏**：隐藏导航/返回按钮/页脚；`cursor: none`
- **大字号**：按 1080p 远程观看距离放大
- **自动全屏**：进入后尝试 `requestFullscreen()`，并保留"任意按键再尝试"兜底（Tizen 浏览器可能需用户手势）
- **自动刷新/自愈**：接口失败重试；`window.onerror` / 长时间无数据 → 定时 `location.reload()`
- **防休眠**：`Wake Lock API`（若支持）＋ 心跳微动；本项目已有 MatrixRain 动态背景，天然减少静态风险
- **URL**：`https://<CloudFront 域名>/tv.html`（**必须 HTTPS、公网可达**；相对路径 `/rankings/*` 已由 CloudFront 转发到后端）
  - `/tv.html` 是**电视专用静态页**（见第九节），专为老 Tizen 浏览器而做
  - `/tv` 是 SPA 内的 kiosk 路由，**只适合现代浏览器**（平板/新电视/电脑），旧电视打开会白屏

---

## 四、执行清单（可勾选）

**三星侧**
- [ ] 确认 H.Browser Solution 存在（Tizen ≥4 且菜单有该项）
- [ ] `MUTE-1-1-9-OK` 进隐藏菜单 → Hospitality = Standalone
- [ ] H.Browser Mode = ON（Vendor = OTHER）
- [ ] URL Launcher Setting 填我们的 URL（**填 `/tv.html`，不是 `/tv`**）
- [ ] Menu OSD OFF / Virtual Standby ON / 网络已连
- [ ] 主菜单：Eco 全关、Auto Protection Time OFF、Anynet+ OFF、Sound Feedback OFF
- [ ] 记录所有改动前的原值（便于回滚）

**我方**
- [ ] 新增 `/tv` kiosk 视图（全屏/大字号/隐藏交互/自愈）
- [ ] 确认 CloudFront 上 `/tv` 可访问（HTTPS）
- [ ] TV 上实测：URL Launcher 是否接受纯网页 URL
      - 若接受 → 完成
      - 若不接受（需签名应用包）→ 走第五节兜底

---

## 五、与「wgt 跳板 + sssp_config.xml」思路的结合

### 5.1 精神一致
两种做法本质相同：**让电视去我们服务器取一个"跳板"，跳板再把画面指向真实站点** → 真实站点零改动。

### 5.2 但平台不同，文件/协议不通用

| 项目 | SSSP 商用标牌（常见教程） | 本项目 HG43AU800A（Hospitality） |
|---|---|---|
| 入口 | 服务器托管 `sssp_config.xml`（+ `widgetlist.xml` 清单） | **H.Browser Mode ON → URL Launcher Setting**（填一个链接） |
| 载体 | `.wgt` 安装包 + 配置清单 | 只填 URL，电视自行"下载安装" |
| 适用机型 | QM/QB 等 Tizen signage 机型 | AU8000 平台的酒店定制机，**可能不认 `sssp_config.xml`** |

### 5.3 落地决策树（从简到繁）

1. **【首选】URL Launcher 直接填 `/tv` 网页 URL**
   - 若电视接受纯网页 URL → 直接通关，**无需 `.wgt`**，比跳板方案更简单。
2. **【若必须安装包】用跳板思路**
   - 服务器放一个极简 Tizen Web App（`index.html`：`location.href = '<leaderboard URL>'`），URL Launcher 指向它。
   - ⚠️ **卡点**：三星通常要求 `.wgt` 带 **Samsung 签名证书**（Seller Office / Partner 资质）；自签包可能装不上 → **必须实测**。
3. **【若签名受阻】**
   - 改用第三方已签名的 kiosk/URL 方案（Uniguest / setupmy.tv 类），或退回 HDMI 外接设备。

> ✅ "真实站点无需改动" 成立：最多加一个 `/tv` 视图，原站点结构/页面不动。

---

## 六、风险与兜底

| 风险 | 说明 | 兜底 |
|---|---|---|
| URL Launcher 只接受**签名的 Tizen 应用包** | 三星对零售机安装 app 常要求签名；纯网页 URL 可能被拒 | 托管自有 Tizen Web App（可能需 Samsung 签名/Partner 资质）；或改用第三方 kiosk 方案 |
| H.Browser 不存在 | Tizen ≥4 但机型不含该 Solution | 退回 HDMI 外接设备（盒子/迷你主机）当显示器 |
| 隐藏菜单被 PIN 锁 | 默认 `0000`/`1234`；被改过则需工程支持 | 联系 Samsung 商用支持 |
| 长期静态画面 | AU8000 是 **LED LCD**，无 OLED 烧屏问题，但官方手册仍提示避免静止画面 | 页面已有动态背景 + 轮播，天然规避 |
| 网络中断 | 内容拉不到 | `/tv` 视图做失败重试 + 自动 reload |

---

## 七、待确认

1. 电视当前是否"干净/可改"状态（是否被其它播控系统占用、是否有 PIN）
2. 电视能否长期联网（建议有线）
3. 是否需要同时支持多台同型号电视（→ 用 Cloning）
4. 是否接受"若需签名应用包则走第三方方案"的兜底

---

## 八、来源

- Uniguest / thecloudportal《Installation details - Samsung Tizen Hospitality TVs》（Standalone 菜单、Eco/屏保、Virtual Standby、URL Launcher、Cloning 步骤）
- Nevron KB《Samsung Smart TV TIZEN Setup》（`MUTE-1-1-9-OK`、H.Browser Mode ON、Vendor=OTHER、URL Launcher Setting、隐藏码与 Tizen 版本检查）
- VITEC ArtioView《Configure Samsung SmartTV models》（H.Browser / Apps Editable 常规流程）

---

## 九、电视专用静态页（方案 B，已实现）

### 9.1 为什么需要它

`HG43AU800AUXUE`（2021 AU8000 平台）是 **Tizen 6 ≈ Chromium 76**，而本项目的 SPA 是用 Vite 7 构建的，产物面向 **Chrome 107+**：

| 语法 | 线上产物中出现 | 需要浏览器 | Chromium 76 |
|---|---|---|---|
| `?.` 可选链 | 469 次 | Chrome 80+ | ❌ |
| `??` 空值合并 | 190 次 | Chrome 80+ | ❌ |
| `??=` 逻辑赋值 | 2 次 | Chrome 85+ | ❌ |
| `.at()` / `Object.hasOwn` | 各 1 次 | Chrome 92/93+ | ❌ 运行时报错 |

→ 电视打开 `/tv` 会**在 JS 解析阶段直接白屏**，但 HTTP 仍是 200，所以**服务端日志里看不到任何异常**（极易误判为“网络问题”）。
另：Tailwind 4 的 CSS 需要 Chrome 111+，在 Tizen 6 上布局也会崩。

### 9.2 方案内容

- 文件：`public/tv.html`（纯 **ES5** + 手写 CSS + `XMLHttpRequest`，零依赖、无构建步骤）
- 数据：同源 `GET /rankings/{type}?limit=10`，带 `X-API-Key`；每 30s 刷新全部榜单，每 20s 轮播一个榜单
- 自愈：失败保留上一次数据 + 显示 `Reconnecting…`；连续失败 6 次（约 3 分钟）自动 `location.reload()`
- 运维开关：`?t=game4` 可**固定单个榜单**不轮播
- 安全：`__API_KEY__` 占位符，由 GitHub Actions 在构建前用 `secrets.VITE_API_KEY` 替换（**真实 key 不入库**）

### 9.3 现场排查顺序（电视“连不上”时）

1. 电视自带 **WebBrowser** → 打开 `https://j2i.net/apps/userAgent`，先确认 **Tizen 版本**
2. 在 WebBrowser 里打开 `https://d24umo4oysfx97.cloudfront.net/tv.html`
   | 现象 | 结论 |
   |---|---|
   | 能显示榜单 | ✅ 页面没问题，故障在 URL Launcher 配置 |
   | 白屏 | 把 Tizen 版本反馈给开发（可能是更老的内核）|
   | 提示无法解析主机 | 网络/DNS 问题，与代码无关 |
3. CloudFront / ALB 的**访问日志目前未开启**，服务端查不到逐请求记录（如需实锤需先开启 CloudFront 标准日志 v2）
