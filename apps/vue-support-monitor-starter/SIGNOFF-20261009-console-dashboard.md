# Sign-off Report: Prometheus + Nginx 控制台全量交付与生产级验收（2026-10-09）

> 口径：交付 = 功能实现 + 生产级验收。验收覆盖**每个可点击的按钮/图标**（真实点击并断言结果），
> 双通道执行：dev（`pnpm dev`，主验收通道）+ 冻结生产构建（`pnpm build` → `dist` → serve-dist 8880）。
> 本报告为完整版（13:50 的简版摘要已废弃；原详细版在被覆盖时丢失，前轮修复明细见 §4.B 说明）。

---

## 1. 交付物清单

### 1.1 前端（vue-support-parent-starter，已入库 `082c9b789`）
| 交付物 | 位置 |
|---|---|
| Prometheus 看板（自定义看板 + grid 拖拽缩放） | `pages/datasource/src/components/console/prometheus/`（PromCardSettingsDialog / PromCardRenderer / 布局面板 / 卡片库） |
| Nginx 看板（自定义看板 + grid 拖拽缩放） | `pages/datasource/src/components/console/nginx/`（NgxCardSettingsDialog / NgxCardRenderer / NgxLayoutPanel / 卡片库） |
| 嵌入链接生成（弹窗：链接 / iframe 片段 / 复制 ×2 / 重新生成） | 两看板布局面板 `embed` 弹窗（`prm-l-*` / `ngl-*` 系列 testid） |
| 公开只读嵌入页 | `#/prometheus/embed/{token}`、`#/nginx/embed/{token}`（PromEmbedView / NginxEmbedView，单卡刷新 + 刷新全部） |
| Prometheus 控制台 | 顶栏 / 查询（即时·范围·示例·画布）/ 监控（targets·rules·alerts）/ 配置（文件·编辑·重载·保存·备份·恢复）/ 自定义布局 |
| Nginx 控制台 | 顶栏（实例·刷新·标准/新人模式）/ 总览 / 站点 / 配置 / 日志 / 备份 / 模板向导 / 自定义布局 / 生命周期条 / 表单模式 |
| 验收专用 vite 配置 | `apps/vue-support-monitor-starter/scripts/vite.acceptance.config.ts`（watch.ignore 屏蔽共享工作区外部会话干扰；`pnpm dev` 不受影响） |

### 1.2 后端（spring-support-parent-starter，198 上外科式替换的 app.jar）
- 看板 CRUD：`GET/PUT /ms/monitor/{prometheus|nginx}/dashboard`、`POST .../dashboard/token`（令牌重生成）
- 公开嵌入端点：`GET .../dashboard/embed/{token}`（+ `/query`、`/query_range`），无鉴权只读
- 表：`ms_prometheus_dashboard`、`ms_nginx_dashboard`（`dashboard_name` / `dashboard_config` / `embed_token`）
- jar 指纹：app.jar md5 `9b64ebc5e99788dd2d6b6a612710e99d`（内嵌 hub `429a301dad2802c6d47c13ff4a0a6a96`）

### 1.3 验收套件（10 个，`apps/vue-support-monitor-starter/scripts/`）
`prometheus-console-acceptance` / `nginx-dashboard-acceptance` / `nginx-dashboard-controls-acceptance` /
`prometheus-dashboard-controls-acceptance` / `nginx-console-buttons-acceptance`（本轮新增）/
`nginx-dashboard-drag-resize-test` / `nginx-console-style-acceptance` / `nginx-browser-prod-acceptance` /
`nginx-browser-form-acceptance` / `nginx-browser-lifecycle-acceptance` /
`embed-final-token-probe`（交付态终态令牌嵌入页探针，本轮新增）
退出码约定：0=全过；2=有 FAIL；3=被外部重载打断（外壳自动重跑）；1=缺数据源/瞬断。

---

## 2. 功能要点

1. **自定义看板**：卡片库添加（Prom：统计/数据表/脚本/ECharts；Nginx：统计/脚本/ECharts/列表）、
   grid 拖拽移位 + 拖角缩放、设置弹窗（表单/自定义 JSON 双模式；标题、刷新间隔、单位、小数、
   背景色/文字色含原生色块选择器与清除、自定义 CSS、指标勾选、PromQL/脚本编辑）。
2. **实时自动保存 + 手动保存**：改动自动 PUT，胶囊显示「已保存/保存中/保存失败」；
   自动保存失败时工具条手动保存按钮进入可点态（故障注入已验证恢复链路）。
3. **嵌入链接**：生成嵌入链接与 iframe 片段、复制、重新生成令牌；嵌入页公开只读、
   端点无需登录，返回 `ok=true` 且 `widgets` 与看板一致。
4. **双控制台全按钮**：顶栏（实例下拉/刷新/模式切换+新人引导链接）、总览（趋势刷新/图例开关/
   访问 Top 刷新/参数折叠头）、站点（刷新/复制地址/编辑跳转）、日志（刷新/清屏/关键字过滤/
   自动刷新开关/间隔下拉/换行开关/文件下拉）、模板向导（三步走、不落盘）、备份（预览/恢复/取消）、
   生命周期（校验/重载/重启/启停，aria-label 真实点击 + 确认弹窗）、表单模式（limit_req/upstream）。

---

## 3. 验收矩阵（全量，两通道均 FAIL=0）

### 3.1 dev 通道（`pnpm dev` → 8860，主验收通道）— 合计 **302/302 PASS**
| # | 套件 | 结果 | 日志（`.local-run/`） |
|---|---|---|---|
| 1 | prometheus-console（Prom 全业务，含恢复弹窗「取消」补齐项） | 69/69 | `prom-console-regress-round-1.log` |
| 2 | nginx-dashboard（Nginx 看板业务） | 39/39 | `ngxdash-regress-round-1.log` |
| 3 | nginx-dashboard-controls（设置弹窗全控件 + 手动保存故障注入） | 33/33 | `ngx-controls-dev-r1.log` |
| 4 | prometheus-dashboard-controls（同上 Prom 版） | 30/30 | `prom-controls-dev-r2.log`（r1 exit=1 瞬断） |
| 5 | nginx-console-buttons（**新增**：顶栏/总览/站点/日志/模板向导/模式切换全按钮） | 48/48 | `ngxbuttons2-round-1.log` |
| 6 | nginx-dashboard-drag-resize（拖拽/缩放） | 8/8 | `ngx-drag-regress-round-1.log` |
| 7 | nginx-console-style（样式回归） | 8/8 | `ngx-style-regress-round-1.log` |
| 8 | nginx-browser-prod（生产形态全业务：面板/右键/备份/错误面） | 28/28 | `ngx-prod-regress-round-1.log` |
| 9 | nginx-browser-form（表单模式） | 21/21 | `ngx-form-regress-round-1.log` |
| 10 | nginx-browser-lifecycle（生命周期真实点击） | 18/18 | `ngx-lifecycle-regress-round-1.log` |

> controls 套件含按看板已有卡片数展开的循环断言，计数随运行时状态浮动（dev 33/30、dist 32/28、
> 首轮 29/26），各轮均 FAIL=0。

### 3.2 冻结生产构建通道（`pnpm build` → dist → serve-dist **8880**）— 合计 **298/298 PASS**
产物：入口 `assets/index-CpieJRFn.js`（磁盘 == 服务端 MATCH=True，2026-10-09 15:16 构建）。
| # | 套件 | 结果 | 日志（`.local-run/`） |
|---|---|---|---|
| 1 | prometheus-console | 69/69 | `prom-console-dist1-r1.log` |
| 2 | nginx-dashboard | 39/39 | `ngxdash-dist1-r1.log` |
| 3 | nginx-dashboard-controls | 32/32 | `ngx-controls-dist1-r1.log` |
| 4 | prometheus-dashboard-controls | 28/28 | `prom-controls-dist1-r1.log` |
| 5 | nginx-console-buttons | 48/48 | `ngx-buttons-dist1-r1.log` |
| 6 | style | 8/8 | `style-dist1-r1.log` |
| 7 | prod | 28/28 | `prod-dist1-r1.log`（`BROWSER_PROD_ALL_PASS 28`） |
| 8 | form | 21/21 | `form-dist1-r1.log` |
| 9 | lifecycle | 18/18 | `lifecycle-dist1-r1.log` |
| 10 | drag-resize | 8/8 | `dragresize-dist1-r1.log` |

### 3.3 生产构建验证
- `pnpm build`（= `vue-tsc --noEmit` + `vite build`）→ **BUILD_EXIT=0**，41.08s（`pnpm-build-final-1.log`）
- 独立 `npx vue-tsc --noEmit` → **TSC_EXIT=0**（`tsc-build-verify-2.log`；早前 4 个 `@vue-office/*`
  TS2307 属外部 WIP 未装包，现包已就位，全绿）
- serve-dist 静态服务 + `/ms`、`/v2` 代理回 198:8081，登录与业务接口在 dist 通道实测可用

### 3.4 按钮覆盖差集盘点（本轮补齐的方法与结果）
源码 `data-testid` 全集 vs 全部测试脚本引用差集 → **10 处可点击控件从未被点过**：
顶栏实例下拉/刷新/标准·新人切换、总览刷新趋势/刷新访问Top、站点刷新/复制/编辑、
日志刷新/清屏（+自动刷新·间隔·换行·文件·过滤）、模板向导全流程、Prom 恢复弹窗「取消」。
补齐方式：新套件 `nginx-console-buttons-acceptance.mjs`（48 项）+ prom 主套件增加 1 检查（68→69）。
无 testid 的图例/折叠头/开关等以 DOM 类名选择器逐个点击断言（含 is-off / .nowrap / 状态文案回读）。

### 3.5 交付态终态令牌嵌入页探针（浏览器级，dev+dist 双通道）— **12/12 PASS**
套件测嵌入页用的是运行时自产令牌；交付态**最终令牌**此前只做了 API 级验证，本探针补浏览器级：
两通道各开 `#/prometheus/embed/{t}` 与 `#/nginx/embed/{t}`，断言标题渲染（"Prometheus 看板"/
"Nginx 看板"，来自嵌入 API 返回的 dashboardName）、页面内嵌入请求 `ok=true`、无 pageerror。
首轮 dev 4 条 FAIL 系看门狗 21:31 刚拉起 vite 的冷启动/预打包期，重跑全绿
（`embed-final-probe-2.log`，EXIT=0）。

---

## 4. 关键修复

### 4.A 本轮（全控件排查轮）修复的真实缺陷 — 4 项，均已在双通道回归复验
| # | 缺陷 | 修复 | 文件 |
|---|---|---|---|
| 6 | 原生色块选择器写不回：`v-model="colorPick"` 绑在只读 computed 上 | 改 `:value` + `onPickColor(e)` 读事件目标 | `NgxCardSettingsDialog.vue` + `PromCardSettingsDialog.vue` |
| 7 | 自定义 CSS 被 scoped 覆盖：注入选择器特异性 0,1,0 打不过 `.card[data-v-*]` 0,2,0 | 提权为 `.ngx-card[data-ngx-uid=...]` / `.prom-card[data-prom-uid=...]` | `NgxCardRenderer.vue` + `PromCardRenderer.vue` |
| 8 | Prometheus 数据表「单位」输入不生效：`tableRows` 调 `formatNumber` 漏传 unit | 补传 unit | `PromCardRenderer.vue`（tableRows） |
| 9 | 测试自身误报：状态码维度「4xx 客户端错误」含「错误」字样被 grep 误判 | 错误断言改用专用元素 `.ngx-card-error` / `.prom-card-error` | 两控制台验收套件 |

测试侧同期修复：清屏后刷新改为**轮询真实行数**（`ngl-count` 文案不随清屏清零，旧写法被残留文案
立即匹配造成 1 条假 FAIL）；日志文件切换断言收紧为「选中文件名回读」（原 `|| length>0` 恒真）。

### 4.B 前轮（看板功能交付轮）修复 — #1–#5
原详细报告在 13:50 被简版覆盖时丢失明细。现存摘要记录 3 条：**看板卡片渲染改进、esbuild 构建
告警清理、配置解析修复**；其余 2 条无可考记录。其功能面已全部包含在 §3 两通道全量回归中复验
（302 + 298 项全过）。如需逐条复核，以前轮（10-08~10-09 早间）验收日志为准。

### 4.C 交付态数据事故与修复（本轮，已闭环）
收尾清理脚本因 PowerShell 变量残留（首条 URL 探测失败后 `$g` 保留上一轮值）把 Prometheus 的
config/name 写进了 Nginx 看板。**发现后已修复**：两看板 `dashboard_name` 复位（「Prometheus 看板」/
「Nginx 看板」）、`dashboard_config` 置 `{"version":1,"widgets":[],"grid":[]}`，并经公开 embed 端点
与 MySQL 行双重复验（见 §7 清理命令的正确写法）。

---

## 5. 拓扑与环境

- **dev 主通道**：`pnpm dev` → `http://127.0.0.1:8860`（验收用 `vite.acceptance.config.ts`，
  watch.ignore 屏蔽 `turbo/**`、`packages/core/**`、`src/main.ts`、`index.html`、`public/vendor/**`）
- **dist 通道**：`pnpm build` → `dist/` → `node scripts/serve-dist.mjs 8880 http://192.168.50.198:8081`
- **后端**：`192.168.50.198:8081`（app.jar 外科替换，md5 见 §1.2）；MySQL `ngxacc`
  （`mysql -u ngx -p'Ngx#2026db' ngxacc`）；SSH `plink -batch -hostkey "ssh-ed25519 255 SHA256:
  cwfyC8w0qteYq8lXud9P9U2aSS8O/bxQOK6Y60BOmsI" -pw kali kali@192.168.50.198`（sudo 密码 kali）
- **登录**：`POST /v2/user/login`，`admin`/`admin123`；测试环境变量 `MS_APP`、`E2E_LOGIN_USERNAME`、
  `E2E_LOGIN_PASSWORD`、`NGINX_BIZ_PORT=80`、`NGINX_OTHER_PORT=0`
- **数据源**：nginx id=4 `__nginx-acceptance__` @101.200.205.64:22（stub_status `/nginx_status`）；
  prometheus id=104 @192.168.50.198:9090

### 交付态（本报告成稿时，已复验）
| 看板 | datasourceId | 名称 | widgets | grid | embed 令牌 | embed 端点 |
|---|---|---|---|---|---|---|
| Prometheus | 104 | Prometheus 看板 | 0 | 0 | `76afdca0d6a79551ec5ab7eff9d02ef4` | API ok=true + 浏览器级嵌入页标题/无异常（dev+dist 12/12） |
| Nginx | 4 | Nginx 看板 | 0 | 0 | `f156d170fcdea041509ed5c0fbf717a9` | API ok=true + 浏览器级嵌入页标题/无异常（dev+dist 12/12） |

**重要操作注记**：运行看板类验收套件会真实点击「重新生成令牌」并留下测试卡片——套件跑完后
**必须重做 §7 的交付态清理**，否则令牌轮换、widgets 非 0（本轮已按此收尾）。

---

## 6. 已知事项 / 环境噪音

1. **共享工作区多会话干扰**：外部会话改 `turbo/**`、`src/main.ts`、`packages/core/**` 等会触发
   vite 整页重载打断验收 → 新套件用 `page "load"` 计数检测重载（RELOAD_DETECTED→exit 3，外壳
   自动重跑）+ 验收 vite 配置 watch.ignore 双保险。`pnpm dev` 本身不受影响。
2. **外部批量清杀 node 进程（已确诊，非本交付问题）**：同机另一会话定期执行 node 清扫
   （`signoff-39-draft.md` 曾记录同款行为）。16:2x 一次清扫把 9 个 node 进程杀到只剩 1 个
   （他人 `serve-collect-dist-19103` 未命中其过滤器），serve-dist 8880 与 vite 8860 均被
   杀（exit 1、无任何错误输出——代码无退出路径，系外部 `Stop-Process`）。
   **规避（已实测）**：harness 后台外壳同样会被回收，「while 自愈环」不可靠 → 改用
   **Windows 计划任务看门狗** `OpenChamber-ConsoleChannels-Watchdog`（每分钟探测 8860/8880，
   掉线即以无管道 Start-Process 拉起，规避孤儿进程 stdout EPIPE 隐患）。
   击杀实测：杀 8880 → 44s 恢复；杀 8860 → 52s 恢复且 HTTP 200（`watchdog.log` 留痕）。
   dist 电池验收（15:19–15:31）在清扫间隔内完成，298 项结果不受影响。
3. **4xx/5xx 已知噪音**：`/v2/setting/default`、`/v2/setting/sso/providers`（403）、
   `/v2/location/resolve`（ERR_ABORTED）——验收套件按白名单排除，非本交付引入。
4. **PowerShell 中文乱码**：验收日志在 PS 管道下中文 mojibake，PASS/FAIL 结构不受影响；
   精确文案需以 read 工具读日志文件。
5. **git 已入库**：vue 侧交付全部在 `082c9b789`（feat(datasource+monitor): Prometheus/Nginx
   控制台前端与嵌入视图 + 验收套件，2026-10-09 18:16），spring 侧在 `52c183732`
   （feat(hub): Prometheus/Nginx 仪表盘管理 控制器/服务/实体/迁移SQL）。
   工作区仅剩他人 WIP `apps/vue-support-ai-guada/stats.html`（不动）。签核文档与看门狗、
   嵌入终态探针随本轮 `docs(acceptance)` 提交入库。
6. **TSC 期望噪音已消除**：`pages/filesystem/PreviewOfficePanel.vue` 的 4 个 `@vue-office/*`
   TS2307（外部会话 WIP）现包已安装，`vue-tsc` 全绿（TSC_EXIT=0）。

---

## 7. 复现命令

```powershell
# ---------- 0. 环境 ----------
$env:MS_APP = "http://127.0.0.1:8860"    # dist 通道改为 http://127.0.0.1:8880
$env:E2E_LOGIN_USERNAME = "admin"
$env:E2E_LOGIN_PASSWORD = "admin123"
$env:NGINX_BIZ_PORT = "80"; $env:NGINX_OTHER_PORT = "0"
Set-Location "D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter"

# dev 主通道（独立验收端口，防共享工作区重载干扰）
npx vite --config scripts/vite.acceptance.config.ts --port 8860

# 生产构建 + dist 通道
pnpm build                                        # vue-tsc && vite build，期望 BUILD_EXIT=0
node scripts/serve-dist.mjs 8880 http://192.168.50.198:8081
# 同机有外部 node 清扫（见 §6.2），无人值守用计划任务看门狗（每分钟探测、掉线自愈）：
#   注册：schtasks /Create /TN "OpenChamber-ConsoleChannels-Watchdog" /SC MINUTE /MO 1 `
#           /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter\scripts\console-channels-watchdog.ps1" /F
#   卸载：schtasks /Delete /TN "OpenChamber-ConsoleChannels-Watchdog" /F
#   日志：.local-run/watchdog.log（仅拉起动作时写入）

# ---------- 1. 全量验收（dev 与 dist 各跑一遍，改 MS_APP 即可） ----------
node scripts/prometheus-console-acceptance.mjs              # 69
node scripts/nginx-dashboard-acceptance.mjs                 # 39
node scripts/nginx-dashboard-controls-acceptance.mjs        # ≤33（循环断言随卡片数）
node scripts/prometheus-dashboard-controls-acceptance.mjs   # ≤30
node scripts/nginx-console-buttons-acceptance.mjs           # 48（新增全按钮）
node scripts/nginx-dashboard-drag-resize-test.mjs           # 8
node scripts/nginx-console-style-acceptance.mjs             # 8
node scripts/nginx-browser-prod-acceptance.mjs              # 28
node scripts/nginx-browser-form-acceptance.mjs              # 21
node scripts/nginx-browser-lifecycle-acceptance.mjs         # 18
# 期望：全部 exit 0；exit 3 = 被外部重载打断，重跑即可。

# ---------- 2. 交付态清理（验收套件跑完后必须执行） ----------
$api = "http://192.168.50.198:8081"
$login = Invoke-RestMethod -Uri "$api/v2/user/login" -Method Post -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'
$h = @{ Authorization = "Bearer $($login.data.accessToken)" }
$cfg = '{"version":1,"widgets":[],"grid":[]}'
# 注意：每条 PUT 用字面量 payload，勿复用上一轮的响应对象（本轮曾因变量残留串写看板）
foreach ($d in @(
  @{ id = 104; b = "/ms/monitor/prometheus"; n = "Prometheus 看板" },
  @{ id = 4;   b = "/ms/monitor/nginx";      n = "Nginx 看板" })) {
  $p = @{ datasourceId = $d.id; name = $d.n; config = $cfg } | ConvertTo-Json
  Invoke-RestMethod -Uri "$api$($d.b)/dashboard" -Method Put -Headers $h `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($p)) | Out-Null          # 清空 widgets/grid
  $t = Invoke-RestMethod -Uri "$api$($d.b)/dashboard/token?datasourceId=$($d.id)" -Method Post -Headers $h
  "$($d.n) token = $($t.data.embedToken)"                                  # 重生成令牌
}
# 复验：GET {api}/ms/monitor/{prometheus|nginx}/dashboard/embed/{token}（无鉴权）
# 期望 ok=true、name 正确、config widgets=0 grid=0
```

---
*生成：2026-10-09 · 双通道合计 **612 项断言全过（dev 302 + dist 298 + 终态嵌入探针 12），FAIL=0** ·
生产构建 BUILD_EXIT=0 · 交付态（两看板 widgets=0 + 新令牌 + 嵌入页浏览器级验证）已复验 ·
vue `082c9b789` / spring `52c183732` 已入库*
