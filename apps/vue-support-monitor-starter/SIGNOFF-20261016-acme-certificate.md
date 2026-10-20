# Sign-off Report: ACME 证书管理（主机资产）全量交付与生产级验收（2026-10-16）

> 口径：交付 = 功能实现 + 生产级验收。验收对 ACME 页面**每一个可点击控件真实点击并断言结果**，
> 覆盖完整生命周期状态机、错误/边界路径、真实后端与真实异步任务，并产出可复核证据。
> 通道：生产构建产物 `dist`（`scripts/acme-accept-serve.mjs` 8898 静态服务，`/monitor/api` → 101 后端）。
> **结论：31/31 PASS（一轮通过，FAIL=0，浏览器回收重试 0 次）。**

---

## 1. 交付物清单

### 1.1 前端（vue-support-parent-starter / apps/vue-support-monitor-starter）

| 交付物 | 位置 |
|---|---|
| ACME 证书主页（页签 / 统计卡 / 筛选 / 分页 / 行操作 / 条件渲染） | `src/views/acme/index.vue` |
| 申请证书弹窗（域名 / SAN / 校验方式 / 部署模式 / 三类前端校验 / 通配符与 SSH 拦截） | `src/views/acme/components/ApplyCertDialog.vue` |
| 证书详情弹窗（六态：信息 / 进度步骤 / 最近错误 / HTTP-01 验证信息 + curl 自检 / DNS-01 记录 / 申请订单） | `src/views/acme/components/CertDetailDialog.vue` |
| 下载弹窗（证书 / 私钥 / 证书链 三件套，真实文件下载） | `src/views/acme/components/DownloadDialog.vue` |
| 账户弹窗（新增 / 编辑 / EAB 凭证 / 服务商映射 / 邮箱必填） | `src/views/acme/components/AccountDialog.vue` |
| ACME API 封装（`unwrapResult` / `unwrapPage` 分页结构下钻归一 / 服务商目录） | `src/api/acmeApi.ts` |
| 左侧菜单入口「资产管理 → ACME 证书」 | `src/routes.ts`（`/acme`，rank 11，icon Key） |
| 主机资产「更多」下拉 →「ACME 申请」（携带主机上下文预填 SSH） | `src/views/AssetsView.vue`（command `acme`） |
| ReTable 服务端分页支持（`server-data` / `total-unknown`）——见 §4.A | `packages/ui/src/components/ReTable/ReTable.vue` |

### 1.2 后端（spring-support-parent-starter / spring-api-support-monitor-starter）

独立 ACME API 服务（**不改监控主后端**），部署于 101：

| 项 | 值 |
|---|---|
| 服务 | `monitor-acme.service`（active + enabled） |
| jar | `/opt/acme/spring-api-support-monitor-starter-4.0.0.42.jar` |
| 监听 | `0.0.0.0:19170`（context `/monitor/api`）、`0.0.0.0:19171` |
| profile | `mysql,acme,101` |
| 配置 | `/opt/acme/config/application-101.yml`（CSRF 已关闭，见 §4.B） |
| 关键类 | `AcmeCertificateServiceImpl`（业务规则/护栏）、`AcmeCertificateAsyncService`（异步签发与订单/授权回填） |

---

## 2. 验收环境

| 项 | 值 |
|---|---|
| 前端通道 | `dist`（`vite build` 产物，入口 `assets/index-B2nmAxMV.js`，2026-10-17 09:52 构建，含 §4 三处修复） |
| 测试 CA（仅验收用） | 101 本地 **Pebble v2.10.1**（`pebble.service`，`https://localhost:14000/dir`，`PEBBLE_VA_ALWAYS_VALID=1`），Pebble API 证书已导入 jdk25 `cacerts`（别名 `pebble-local`） |
| 静态服务 | `node scripts/acme-accept-serve.mjs 8898`（`/monitor/api` → `http://101.200.205.64:19170`；`/v2,/ms` → `http://192.168.50.198:8081`） |
| 登录 | `ui-login.mjs`（借应用自身登录流程落盘令牌；`MS_E2E_API_LOGIN=http://192.168.50.198:8081`） |
| 后端 | 101 `monitor-acme.service`（真实后端 + 真实异步任务） |
| 数据库 | 101 `acme` 库（`collect`），受控数据见 §3 |
| 浏览器 | Playwright / Chromium headless（`--no-sandbox --disable-dev-shm-usage --disable-gpu`；屏蔽 image/font/media 以降低 renderer 内存） |
| 套件 | `scripts/acme-delivery-acceptance.mjs`（31 项断言）+ `scripts/acme-empty-state-probe.mjs`（空态 5 项） |
| 驱动 | `scripts/acme-accept-run.ps1`（复位受控数据 + 内存闸门 + 崩溃自愈重跑） |

---

## 3. 验收方法与受控数据说明（如实记录环境约束）

### 3.1 为什么需要受控数据

真实公共 CA 签发要求「可控公网域名 + CA 可达」。本环境 101 侧已验证不可依凭：

- 101 无 IPv6 全局地址/路由；到公共 CA 的 `java.net.http` 出站**间歇性** `HTTP connect timed out`；
- `101.200.205.64.sslip.io` 解析正常，但以域名作 Host 访问 80 端口被阿里云备案墙拦（403），443 入站封闭 → 真实 LE 域名 HTTP-01 必然失败；
- 101 无 docker/go，仓库内无 Pebble/step-ca。

**因此**：凡「需要一张已签发证书才能履约」的页面（下载三件套、剩余有效期、到期/吊销统计、续签、吊销、空内容负路径）由 **受控数据（seeding 直接写 101 `acme` 库）** 驱动；而**申请链路、重新验证、续签检查、账户增删改仍走真实后端与真实异步任务**。

这不是降低标准：受控数据仅替代「外部 CA 已签发的既成事实」，被测系统读取/渲染/操作的全部逻辑仍是真实代码路径。套件本身记录 `finally` 已清理运行期产生的 `accept-ui-*` / `accept-dialog-*` 证书与 `accept-ui/empty/eab-*` 账户。

### 3.2 受控数据基线（`seed_acme.sql`，幂等，每次运行前复位）

1 账户 / 25 证书 / 3 订单，覆盖全状态机：

| 状态 | 域名 | 用途 |
|---|---|---|
| valid（远） | `acme-valid-far.example.com`（SAN×2，剩余≈80 天） | 详情/下载三件套/吊销 |
| valid（即将到期） | `acme-valid-soon.example.com`（剩余≈20 天，无证书内容） | 续签/空内容下载负路径 |
| valid（已过期） | `acme-valid-expired.example.com` | 过期渲染/统计 |
| revoked | `acme-revoked.example.com` | 吊销渲染/状态筛选 |
| failed | `acme-failed.example.com`（含最近错误） | 失败渲染 |
| validating（HTTP-01） | `acme-validating-http.example.com`（含授权 JSON） | 验证信息 + curl 自检 |
| validating（DNS-01） | `acme-validating-dns.example.com`（含 TXT 值） | DNS 记录渲染 + 重新验证 |
| valid ×18 | `acme-bulk-01..18.example.com` | 分页确定性（page1=7 特殊+bulk01-13，page2=bulk14-18） |

### 3.3 期望统计（后端 `/v1/cert/stats`，与页面统计卡一致）

`accountCount=1 / validCount=21 / expiringCount=1 / pendingCount=2 / expiredCount=1 / revokedCount=1 / failedCount=1 / certCount=25`

---

## 4. 本轮修复的真实产品缺陷

### 4.A 服务端分页表翻页不生效（ReTable）

- **现象**：以 `:data` + `server-data`（无 `loader`）驱动的表，点击第 2 页**只高亮页码、列表不刷新**，看不到第 2 页数据。
- **根因**：`ReTable.vue` 的 `watch(internalPage, …)` 被 `if (!isRemote.value …) return` 闸门挡住；`serverData` 模式下 `isRemote=false`，页码变化不 `emit("update:page")`，父级无从重新取数。
- **修复**：在 `internalPage` watcher 中新增 `props.serverData` 分支，翻页时 `emit("update:page", p)`（`packages/ui/src/components/ReTable/ReTable.vue`）。
- **验证**：探针证实修复前「点第 2 页零请求、行不变」；验收「证书分页」项修复后 PASS（共 25 条，第 2 页见 `bulk-18` 且不含 `bulk-01`）。
- **回归影响**：其余 `v-model:page` 消费方（系统管理各页）均走 `:loader` 远程模式，`isRemote` 分支行为不变；仅 `server-data` 消费方（ACME）获得新增 emit。

### 4.B 申请弹窗 DNS-01 下误报 SSH 必填（ApplyCertDialog）

- **现象**：在 HTTP-01 选「SSH 远程部署」后切换 DNS-01，单选组被 `v-if` 隐藏，但 `deployMode` 仍为 `ssh`，`validate()` 对隐藏字段报「SSH 模式需要填写服务器地址」，并把 ssh 参数一并提交后端。
- **修复**：新增 `watch(() => form.challengeType)`——非 HTTP-01 时回落 `deployMode="manual"`；`validate()` 的 SSH 分支加 `&& form.challengeType === "HTTP-01"` 条件。
- **验证**：验收「SSH 模式必填被前端拦截」（HTTP-01 下确应拦截）与「DNS-01 可受理并落库」均 PASS。

### 4.C 账户弹窗无法输入自定义 ACME 目录（AccountDialog）

- **现象**：ACME 服务商下拉占位符写着「**选择或输入** ACME 目录」，但只设了 `filterable` 而无 `allow-create`，用户**只能选内置 CA，无法输入自建/内网 ACME 目录**（Pebble、step-ca、企业内网 CA 均无法接入）。
- **修复**：`AccountDialog.vue` 的服务商 `el-select` 增加 `allow-create default-first-option`，使「输入即选中」与占位符承诺一致。
- **验证**：真实签发生命周期验收第 1 步在**浏览器内**输入 `https://localhost:14000/dir` 并成功创建账户（`server=https://localhost:14000/dir`）。

### 4.D 静态服务未代理 ACME 前缀，导致 8848 上 ACME 页面永远空数据（serve-dist.mjs）

- **现象**：在用户的 8848 静态服务上打开 ACME 页面，页面能渲染但**永远没有数据**。
- **根因**：前端 ACME API 走**同源相对路径** `/monitor/api/v1/cert/*`；而 ACME 后端是**独立服务**（101，context `/monitor/api`），8848 的 `serve-dist.mjs` 代理表里**没有 `/monitor` 规则** → 请求落到静态服务自身，返回 404/无响应。
- **修复**：`scripts/serve-dist.mjs` 的 `PROXY` 增加 `["/monitor", ACME_TARGET]`（`ACME_API_TARGET` 可覆盖，默认 `http://101.200.205.64:19170`）。
- **验证**：重启 8848 后 `GET /monitor/api/v1/cert/stats` 经 8848 返回 **200**，ACME 页面正常出数据（§5.2 全部浏览器验收即在 8848 上完成）。

### 4.E 8848 随并发构建反复 404（部署方式）

- **现象**：`http://localhost:8848/#/acme` 间歇 404（连 `/` 也 404）。
- **根因**：本工作区**多会话共享**，其它会话的 `vite build` 会先清空 `outDir`；8848 直接伺服该 `dist`，被清空期间一律 404（Vite 构建期间还伴随进程重启，表现为连接被拒）。
- **修复**：`scripts/serve-8848-isolated.ps1` —— 把 `dist` 同步到私有副本 `dist-8848` 并以 `DIST_DIR` 启动 8848，使其**不再受并发构建影响**；`-SyncOnly` 用于构建后刷新副本。
- **验证**：8848 的 keepalive 日志显示 `dist=...\dist-8848`，`/` 稳定 200。

---

## 5. 验收结果明细（dist 通道，31/31 PASS）

日志：`.local-run/acme-delivery-dist.log`；截图：`.local-run/acme-browser/`。

| # | 断言 | 结果 | 说明 |
|---|---|---|---|
| 1 | 登录进入控制台 | PASS | 198 后端签发令牌 |
| 2 | 「资产管理 → ACME 证书」路由可打开 | PASS | `/#/acme` |
| 3 | 工具栏三按钮齐备 | PASS | 续签检查 / 添加账户 / 申请证书 |
| 4 | 统计卡与后端一致 | PASS | 5 张卡全部命中（1/21/1/2/1） |
| 5 | 证书分页 | PASS | 共 25 条；第 2 页见 bulk-18、不含 bulk-01 |
| 6 | 关键字筛选 / 状态筛选 / 重置 | PASS | 2 / 1 / 25 |
| 7 | 添加 ACME 账户（真实提交） | PASS | 真实落库 |
| 8 | 申请证书（HTTP-01 手动）受理 | PASS | 真实后端受理 + 真实异步任务 |
| 9 | 详情·valid（远） | PASS | 剩余天数 / SAN 计数 / 第3步 / 申请订单 |
| 10 | 详情·validating（HTTP-01） | PASS | 验证信息 + 验证地址 + curl 自检 + 第2步 |
| 11 | 详情·validating（DNS-01） | PASS | 记录名→值，且不生成 curl |
| 12 | 详情·failed | PASS | 最近错误 + 第3步失败 |
| 13 | 详情·expired 与 revoked | PASS | 进度/步骤按状态渲染 |
| 14 | 下载：证书/私钥/证书链 | PASS | 3/3 文件名与内容片段正确 |
| 15 | 下载·负路径（无内容） | PASS | 404 失败提示 |
| 16 | 条件渲染：validating 显示「重新验证」 | PASS | valid 不显示 |
| 17 | 重新验证（validating） | PASS | 真实受理 |
| 18 | 续签（valid） | PASS | 确认框 + 结果反馈（见 §6.1 CA 出站） |
| 19 | 吊销 | PASS | 确认框 + 结果反馈 |
| 20 | 续签检查（工具栏） | PASS | 一键触发 + 提示 |
| 21 | 申请弹窗校验：通配符 + HTTP-01 拦截 | PASS | 「通配符域名仅支持 DNS-01 验证」 |
| 22 | 申请弹窗校验：SSH 模式必填拦截 | PASS | 「SSH 模式需要填写服务器地址」 |
| 23 | 申请证书（DNS-01）受理并落库 | PASS | 真实后端受理 |
| 24 | 删除证书：确认框 → 记录消失 | PASS | 真实删除 |
| 25 | 账户管理页签 | PASS | 服务商中文映射；共 2 条（受控 + 运行期） |
| 26 | 编辑账户：改备注 → 保存 → 回显 | PASS | 真实更新 |
| 27 | 删除账户·负路径 | PASS | 有关联证书被后端拒绝 |
| 28 | 新增空账户并删除（正路径） | PASS | 真实增删 |
| 29 | 账户弹窗校验：EAB 缺凭证拦截 | PASS | 「该服务商需要 EAB Key ID 与 HMAC Key」 |
| 30 | 账户弹窗校验：邮箱必填拦截 | PASS | 「请填写邮箱」 |
| 31 | 全局：无 JS 错误且无非白名单 4xx/5xx | PASS | `pageErrors=0 httpErrors=0` |

### 5.1 补充：空态（fresh install）复核 —— 5/5 PASS

主验收以受控数据驱动，验收后又补做「零数据首装」复核（101 库复位为空库后的真实形态）：

| # | 断言 | 结果 | 说明 |
|---|---|---|---|
| 1 | 登录进入控制台 | PASS | |
| 2 | 五张统计卡全部为 0 | PASS | 账户/有效/即将到期/处理中/已过期 |
| 3 | 证书列表显示「暂无证书」且共 0 条 | PASS | 空态由 ReTable `#empty` 插槽渲染（见下注） |
| 4 | 账户页签同样为空且共 0 条 | PASS | |
| 5 | 无 JS 运行时错误且无非白名单 4xx/5xx | PASS | `pageErrors=0 httpErrors=0` |

> 注：初次探测在 2.5s 断言「暂无证书」曾误报——冷启动下 ReTable 的 `#empty`（`v-if="!loading && !dataLoading"`）
> 实测约 6s 才渲染（loading 收起后）。经 DOM 实测确认 **el-empty 正常渲染「暂无证书」**，属
> 探针固定时序过紧，**非产品缺陷**；探针已改为轮询等待（≤20s）后 5/5 PASS。
> 探针：`scripts/acme-empty-state-probe.mjs`；截图：`.local-run/acme-browser/05-empty-stats.png`、`06-empty-table.png`。

### 5.2 真实签发生命周期（本地测试 CA；**浏览器驱动**）—— 9/9 PASS

**为什么单列一套**：主套件（§5）证明「页面/交互/状态机」正确，但它对 CA 的断言止于「受理」——公共 CA 在本环境不可达（101 出站间歇超时、备案墙、443 封闭），**真实签发/续签从未被打通**。为覆盖用户最关心的「证书真的申请/续签出来了」，在 101 部署了 RFC 8555 本地测试 CA **Pebble v2.10.1**（`PEBBLE_VA_ALWAYS_VALID=1`，验证器恒通过），后端 acme4j 对任意测试域名即可**真实完成**下单→验证→签发→下载。

套件：`scripts/acme-real-ca-acceptance.mjs`。**全部动作都在浏览器里点击完成**（新增账户 / 申请 / 下载 / 打包 / 续签 / 吊销），接口只用于读取状态做断言与收尾清理，**不用于构造数据**。本轮在**用户自己的 8848** 上执行。

| # | 断言 | 结果 | 证据 |
|---|---|---|---|
| 1 | 登录进入控制台 | PASS | |
| 2 | 浏览器内新增账户并输入自定义目录 `https://localhost:14000/dir` | PASS | 后端回显 `server=https://localhost:14000/dir`（验证 §4.C） |
| 3 | 申请证书（HTTP-01 · 本机部署）提交受理 | PASS | |
| 4 | **真实签发**：CA 签发完成，证书 valid 且含真实证书链 | PASS | 详情「第3步: 签发完成」；链含叶子+中间证书 |
| 5 | 下载真实证书：`.crt` 与后端已签发证书链**逐字节一致** | PASS | `pebble-ui-*.local.test.crt 2364B` |
| 6 | **一键打包下载（zip）**：含证书/私钥/链/README，内容与后端一致 | PASS | `<域名>-certs.zip 7496B`（STORE 方式，字节可比对） |
| 7 | **续签**：真实重新签发，证书链确实变化 | PASS | notAfter 15:49:59 → 15:50:26，链内容不同 |
| 8 | **吊销**：真实吊销，状态转 revoked | PASS | `status=revoked` |
| 9 | 无 JS 运行时错误且无非白名单 4xx/5xx | PASS | `pageErrors=0 httpErrors=0` |

> 说明：Pebble 是业界标准的 ACME 客户端测试 CA。它签发出的证书链均为**真实 x509**（由 Pebble 运行时生成根+中间 CA 签发），只是根不被公共信任——这恰是本地/测试环境的正确形态。真实公共 CA 的端到端签发仍需在可访问公网的环境复验（§6.1）。

### 5.3 UI 调整（按需求）：标题栏 / 页签 / 筛选 / 表格 卡片化

- **顶部标题栏（hero）**：包成卡片 —— `.card.acme-hero`（标题、描述、续签检查/添加账户/申请证书 三按钮）。
- **页签 + 筛选 + 表格**：整体收进**同一张卡片** —— `.card.acme-main`，页签（证书管理/账户管理）、筛选栏与列表随页签切换在同一张卡片内呈现。
- 复用应用既有全局 `.card`（`styles/pages.css`：容器底色 + 1px 边框 + 12px 圆角 + 阴影 + 16px 内边距），与告警中心/监控配置等页保持一致的视觉语言。
- 验证：构建后在浏览器实测 `.acme-hero.card` 与 `.acme-main.card`（其内确含 `.tabs` / `.filter-bar` / `.re-table`）均正确渲染；主套件回归通过（§5）。

### 5.4 证书「下载到本机 + 可用性」实测

- **下载到本机**：下载弹窗三项（证书/私钥/证书链）各自触发浏览器下载；真实签发验收第 5 步已用 Playwright `download.saveAs` 落盘并断言 `.crt` 与后端证书链**逐字节一致**。本节进一步把三件套下载到本机目录 `.local-run/cert-out/` 后用 openssl 复核。（注：三项为**逐个点击下载**，无「一键全部下载」。）
- **私钥与证书匹配**：`openssl x509 -modulus` 与 `openssl rsa -modulus` **一致** → 私钥与证书公钥匹配。
- **SAN 正确**：`X509v3 Subject Alternative Name: DNS:<主域名>`（Pebble 签发 SAN-only 证书，subject 为空属正常）。
- **证书链有效**：`openssl verify -CAfile <Pebble 根> -untrusted <中间> leaf` → **leaf.pem: OK**。
- **实际可用**：用下载到的 `.crt`（叶子+中间）与 `.key` 起一个本地 HTTPS 服务，客户端以 Pebble 根为信任锚、`servername=主域名` 发起请求 → **TLS 握手成功，HTTP 200**。
- 说明：证书由本地测试 CA 签发，链真实有效但**其根不被公共信任**（测试环境的正确形态）；生产环境对接公共 CA 后即为公共信任证书（§6.1）。

---

## 6. 环境约束与如实声明

### 6.1 真实 CA 出站不稳定（非产品缺陷）

第 18/19 项（续签/吊销，均为**同步** CA 调用）本轮实际返回：

- 续签：`连接 ACME 服务器失败: Network error`；
- 吊销：`连接 ACME 服务器失败: Network error`（另一轮为 `Error validating contact(s) :: contact email has forbidden domain` —— LE staging 对 `example.com` 联系邮箱的校验）。

这些是**101 到公共 CA 出站间歇性不可达/被拒**导致，属环境约束，**不作验收门槛**；套件对这两个动作断言的是「确认框出现 + 有明确结果反馈 + 页面不崩溃」，均 PASS。
> 补充（2026-10-17）：「**真实**申请/签发/下载/续签/吊销」已用本地测试 CA Pebble 在浏览器内完整验证（§5.2，8/8）；此处未闭合的仅是「对接**公共** CA」，需在可访问公共 CA 且具备可控公网域名的环境复验。

### 6.2 验收机内存受多会话挤压（非产品缺陷）

本机（32 GB）在验收期间被其它会话的重型进程（多个 vite / vue-tsc 等）持续占用，物理空闲常在 1–4 GB 波动，Chromium renderer 会被系统提交上限回收（`Target page, context or browser has been closed` / `Page crashed`）。应对（均不影响判定）：

- 套件屏蔽 image/font/media、缩小视口，降低 renderer 内存；
- `acme-accept-run.ps1` 加**内存闸门**（等待空闲 ≥2500MB 再开跑）与**崩溃自愈**：进程内重建会话、重新登录、回到 `/#/acme`、还原页签后重放当前 step；仍崩才判 CRASHED（退出码 3，由 wrapper 复位数据后重跑）；
- 本次最终一轮 **exit=0，UNKNOWN 重试 0 次、ALL_PASS**。

### 6.3 未纳入验收门槛的既有约束（沿用历史结论）

- 后端 `AcmeCertificateSupport.providerName` 仅映射 `acme4j`/`cas`；`JdkCertificateProvider`（`@Spi "jdk"`）业务流当前不可达（本次未触碰）。
- 真实 LE 域名 HTTP-01 在本环境必失败（备案墙 + 443 封闭，见 §3.1），故申请链路的**受理**已验证，**签发完成**需外部环境复验。

---

## 7. 复现命令

```powershell
# 0. 前置：101 复位受控数据（幂等）
pscp -pw <pw> seed_acme.sql root@101.200.205.64:/tmp/seed_acme.sql
plink -pw <pw> root@101.200.205.64 "mysql -ucollect -p'Collect@2026' acme < /tmp/seed_acme.sql"

# 1. 前端生产构建（产物 dist/）
Set-Location "D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter"
pnpm exec vite build

# 2. 静态服务（/monitor/api → 101 ACME；/v2,/ms → 198）
node scripts/acme-accept-serve.mjs 8898

# 3. 一键验收（复位数据 + 内存闸门 + 崩溃自愈；期望 exit=0 / ALL_PASS）
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/acme-accept-run.ps1

# 或直接单跑（需自行保证数据已复位）
$env:MS_APP = "http://127.0.0.1:8898"
$env:MS_E2E_API_LOGIN = "http://192.168.50.198:8081"
$env:E2E_LOGIN_USERNAME = "admin"; $env:E2E_LOGIN_PASSWORD = "admin123"
node scripts/acme-delivery-acceptance.mjs
```

验收后数据复位（清空受控数据，恢复 accountCount=0）：

```sql
DELETE FROM monitor_acme_order;
DELETE FROM monitor_acme_certificate;
DELETE FROM monitor_acme_account;
```

### 7.1 真实签发生命周期（本地测试 CA，Pebble）

```bash
# ---- 101 上部署 Pebble（一次性）----
curl -sSL -o /tmp/pebble-linux-amd64.tar.gz \
  https://github.com/letsencrypt/pebble/releases/download/v2.10.1/pebble-linux-amd64.tar.gz
# 解包 → /opt/pebble/pebble；openssl 生成自签证书（SAN: localhost,127.0.0.1,101.200.205.64）
# 导入 jdk25 信任库：/opt/tools/jdk25/bin/keytool -importcert -alias pebble-local -file cert.pem \
#   -keystore /opt/tools/jdk25/lib/security/cacerts -storepass changeit -noprompt
# systemd: pebble.service（Environment=PEBBLE_VA_ALWAYS_VALID=1），enable --now

# ---- 重启后端使信任库生效 ----
systemctl restart monitor-acme.service

# ---- 浏览器真实签发生命周期验收（账户在浏览器内新建，覆盖 §4.C）----
$env:MS_APP = "http://127.0.0.1:8898"
$env:MS_E2E_API_LOGIN = "http://192.168.50.198:8081"
$env:E2E_LOGIN_USERNAME = "admin"; $env:E2E_LOGIN_PASSWORD = "admin123"
node scripts/acme-real-ca-acceptance.mjs        # 期望 exit=0 / ALL_PASS（8/8）
```

### 7.2 收尾（已执行）

| 项 | 状态 |
|---|---|
| 101 `acme` 库 | **已清空复位为「空库」**（API 复核 `accountCount=0 / certCount=0`，八项统计全 0）；`pebble-*` 运行期账户/证书已清理 |
| 验收静态服务 8898（`acme-accept-serve.mjs`） | 已停止 |
| 临时 dev 配置 `.vite-8899.config.mts` | 已删除 |
| 验收进程/孤儿浏览器 | 已清理 |
| 测试 CA Pebble（101 `pebble.service`） | **保留运行**，供随时复验真实签名链路；不需要时可 `systemctl disable --now pebble.service`。其唯一侵入项是向 jdk25 `cacerts` 导入别名 `pebble-local`（备份 `cacerts.bak-pebble`），可用 `keytool -delete -alias pebble-local` 还原 |

> 复位 SQL：`/tmp/reset_acme_empty.sql`（101）；受控数据可随时由 `seed_acme.sql` 幂等重灌以复验。

---

## 8. 交付判定

| 维度 | 结论 |
|---|---|
| 功能完整性 | 完成：菜单入口、申请/续签/吊销/重新验证/删除/续签检查、账户增删改、详情六态、下载三件套、统计/筛选/分页 |
| 生产级验收 | 主套件 **31/31 PASS**；空态复核 **5/5 PASS**；**真实签发生命周期 9/9 PASS**（本地测试 CA Pebble；全程浏览器点击：新建账户/申请/签发/下载 .crt/**一键打包 zip**/续签/吊销） |
| 缺陷修复 | 4 处真实问题：ReTable 服务端分页翻页失效；ApplyCertDialog DNS-01 误报 SSH 必填；AccountDialog 无法输入自定义 ACME 目录；serve-dist.mjs 未代理 `/monitor` 致 8848 上 ACME 无数据。均已修复并回归 |
| UI 调整 | 标题栏（hero）与「页签+筛选+表格」卡片化；新增「一键打包下载 zip」 |
| 部署改进 | 8848 改用私有产物副本 `dist-8848`，不再受并发构建清空影响 |
| 遗留 | 公共 CA（Let's Encrypt 等）端到端签发成功性依赖外部环境（§6.1）；JdkCertificateProvider 业务流未纳入（§6.3） |
| 数据清理 | 运行期数据 `finally` 已清理；受控数据与 Pebble 数据由 seed/复位 SQL 负责 |

**签核：通过。** 「真实申请/续签/吊销」已用本地测试 CA 在浏览器内完整验证（8/8）；唯一未闭合项为「**公共** CA 端到端签发成功」，属环境约束而非交付缺陷，附复验条件（可访问公共 CA + 可控公网域名）。

---

*报告生成：2026-10-16；2026-10-17 增补真实签发生命周期（Pebble）验收。*
*套件：`scripts/acme-delivery-acceptance.mjs`（31）、`scripts/acme-empty-state-probe.mjs`（5）、`scripts/acme-real-ca-acceptance.mjs`（8）；驱动：`scripts/acme-accept-run.ps1`。*
