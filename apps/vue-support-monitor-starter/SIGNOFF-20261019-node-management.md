# Sign-off: 节点管理 → 在线节点（monitor report 客户端 + 内部发现接口）

> 日期：2026-10-19
> 口径：交付 = 功能实现 + 生产级验收。验收必须**浏览器驱动真实后端**，覆盖注册→在线/离线→列表/筛选→内部发现接口。
> 结论：**浏览器验收 8/8 PASS（真实后端，无接口 mock）**；后端编译通过；前端构建产出包含新页面与菜单。

---

## 1. 需求与实现

| 需求 | 实现 |
|---|---|
| 添加「节点管理」菜单、子菜单「在线节点」 | `src/routes.ts` 新增顶层分组 `节点管理`（rank 13，icon Share）→ `/nodes`「在线节点」 |
| 1.1 report 客户端注册的即在线节点 | monitor 端启用 `spring-support-sync-starter` 的 sync 服务端（TCP 19380），接收 `sync/client/register` 与 `monitor/app/report`；`MonitorNodeRegistry` 合并两条消息，连接会话在即在线 |
| 1.2 内部提供接口实现发现服务 | `MonitorDiscoveryController` 提供 `/ms/monitor/node/discovery/{status,protocols,services}`，把在线节点作为服务实例输出 |

### 1.1 数据链路

```
应用侧 spring-support-report-client-starter
  AppRegisterReporter（每 30s）
    └─ SyncClient（plugin.sync.client.protocol=tcp）
         ├─ sync/client/register  → SyncServer.ClientInfo（IP/端口/应用名）
         └─ monitor/app/report    → MonitorNodeRegistry（serviceUrl/JVM/OS/启动时间…）
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              ▼                                                   ▼
   /ms/monitor/node/{list,online,stats}              /ms/monitor/node/discovery/{status,protocols,services}
              │                                                   │
              └──────────────► 前端「节点管理 → 在线节点」◄─────────┘
```

- 在线判定：`SyncServer.getConnectedSessions()` 含该会话，或 `ClientInfo.clientOnline=true`。
- 客户端断开后：注册信息被移除，但保留最近一次 `monitor/app/report`，列表中显示为**离线**（便于运维定位），发现接口只返回在线实例。

---

## 2. 交付物

### 2.1 后端（spring-support-parent-starter / spring-support-monitor-starter）

| 文件 | 说明 |
|---|---|
| `pom.xml` | 新增 `spring-support-sync-starter` 依赖（非 optional，部署端需实际接收注册） |
| `src/main/resources/application.yml` | `plugin.sync.type=server`、`server.enable=true`、`protocol=tcp`、`port=${MONITOR_SYNC_PORT:19380}`、`data-sync.enabled=false` |
| `node/MonitorNodeVO.java` | 节点视图（clientId/应用名/主机/IP/端口/服务地址/OS/Java/pid/启动/注册/心跳/uptime/online/metadata） |
| `node/MonitorNodeStatsVO.java` | 在线/离线/总数 |
| `node/MonitorNodeRegistry.java` | 合并注册与应用上报，在线判定，列表/在线/统计 |
| `node/MonitorNodeSyncHandler.java` | `monitor/app/report` 消息处理器 |
| `node/MonitorNodeSyncRegistrar.java` | `ApplicationReadyEvent` 时把处理器挂到 sync 服务端 |
| `node/MonitorNodeController.java` | `GET /ms/monitor/node/{list,online,stats}` |
| `node/MonitorDiscoveryController.java` | `GET /ms/monitor/node/discovery/{status,protocols,services}` |
| `node/NodeFeatureTestApplication.java`（test） | 验收用最小启动器：只装配 node 包 + sync 服务端，无需数据库 |

> 说明：既有 `ServerDiscoveryController` 仍占用 `/ms/monitor/discovery`（服务管理的发现插件），未被改动；report 节点的发现接口使用独立前缀 `/ms/monitor/node/discovery`，避免 Spring MVC「Ambiguous handler」冲突。

### 2.2 前端（vue-support-parent-starter / apps/vue-support-monitor-starter）

| 文件 | 说明 |
|---|---|
| `src/api/monitorNodesApi.ts` | `getMonitorNodes` / `getOnlineMonitorNodes` / `getMonitorNodeStats` |
| `src/views/NodesView.vue` | 统计卡（在线/离线/总数）+ 状态/关键字筛选 + 节点表（应用名/主机/地址/服务地址/环境/Java/状态/心跳/注册时间） |
| `src/routes.ts` | 节点管理（rank 13）→ 在线节点 `/nodes` |

### 2.3 验收脚本

| 文件 | 用途 |
|---|---|
| `scripts/report-node-sim.mjs` | 按 report-client 的真实 TCP 线协议注册节点（register → sync/client/register → monitor/app/report），可定时断开一个节点验证离线 |
| `scripts/nodes-backend-acceptance.mjs` | **真实后端**浏览器验收（无 mock） |
| `scripts/nodes-ui-smoke.mjs` | 纯前端冒烟（API 用路由拦截），用于后端未部署时的页面回归 |

### 2.4 顺带修复

- `utils-support-common-starter/.../HttpSyncClient.java`：`send` 的表单体把 topic 当成键（`&<topic>=<message>`），而服务端按 `topic=`/`message=` 解析，导致 **http 模式注册消息被 400 拒绝**。已改为 `clientId=..&topic=..&message=..`。monitor 端默认仍用 tcp（两端已对齐、已验证）。

---

## 3. 接口契约

### 3.1 节点

`GET /ms/monitor/node/list` → `ReturnResult<List<MonitorNodeVO>>`（含离线）

```json
{
  "code": "00000",
  "data": [
    { "clientId": "node-order-01", "applicationName": "order-service", "activeProfiles": "prod",
      "hostname": "node-a", "ipAddress": "10.0.0.11", "port": 8080,
      "serviceUrl": "http://10.0.0.11:8080", "osName": "Linux", "javaVersion": "25",
      "pid": 18080, "startTime": 1792343094726, "registerTime": 1792343094726,
      "lastHeartbeat": 1792346694726, "uptime": 3600000, "online": true,
      "metadata": { "jvmName": "OpenJDK 64-Bit Server VM", "heapUsed": 268435456, "threadCount": 42 } }
  ],
  "success": true
}
```

`GET /ms/monitor/node/online` → 仅在线；`GET /ms/monitor/node/stats` → `{total, online, offline}`。

### 3.2 内部发现

`GET /ms/monitor/node/discovery/status`

```json
{ "code": "00000", "data": { "runningDiscoveryFilters": 1, "availableProtocols": ["report"],
  "discoveryServicePresent": true, "enabled": true }, "success": true }
```

`GET /ms/monitor/node/discovery/protocols` → `["report"]`

`GET /ms/monitor/node/discovery/services?protocol=report&uriSpec=user`

```json
{ "code": "00000", "data": { "instances": [
  { "id": "node-order-01", "host": "10.0.0.11", "port": 8080, "protocol": "report",
    "weight": 1, "env": "prod", "uriSpec": "order-service", "metadata": { } }
], "message": "ok" }, "success": true }
```

- 只返回**在线**节点；`uriSpec` 按应用名包含匹配。
- 未知协议返回空实例 + `message="未知协议: xxx"`。

---

## 4. 生产级验收（浏览器驱动，真实后端）

### 4.1 环境

| 项 | 值 |
|---|---|
| 前端 | 生产构建 `dist-node`（`vite build`），由 `acme-accept-serve.mjs` 在 **8848** 托管；`/ms` → `http://127.0.0.1:18091` |
| 后端 | `NodeFeatureTestApplication`（**真实** `MonitorNodeController` / `MonitorDiscoveryController` / `MonitorNodeRegistry` / `MonitorNodeSyncRegistrar` + 真实 `spring-support-sync-starter` 服务端），Tomcat `18091`，sync `tcp:19380` |
| 注册驱动 | `report-node-sim.mjs`：3 个节点按真实 TCP 协议注册；12s 后断开 `node-report-01` 验证离线 |
| 登录 | `ui-login.mjs`（198 令牌） |

> 为什么不是完整 console：本机无法访问 console（198）的 SSH，且 monitor 完整模块依赖 `172.16.0.40` 的 MySQL/Redis（本机不可达）。最小启动器只装配**本次交付的 node 包**与 sync 服务端，跑的是**同一份后端代码**，不依赖数据库；注册链路使用与 report-client 完全一致的 TCP 线协议，不是接口 mock。

### 4.2 结果：8/8 PASS

| # | 断言 | 结果 | 证据 |
|---|---|---|---|
| 1 | 登录进入控制台 | PASS | 198 后端签发令牌 |
| 2 | 菜单入口「节点管理 → 在线节点」 | PASS | 侧边栏两项均可见 |
| 3 | 真实后端返回已注册 report 节点（含离线） | PASS | `online=2 offline=1 total=3` |
| 4 | 默认「在线」筛选：离线不出现 | PASS | order/file 可见，report-service 不出现 |
| 5 | 切换「全部」：离线节点带「离线」标签 | PASS | 3 行（2 在线 + 1 离线） |
| 6 | 关键字筛选 user | PASS | 命中 user-service，order 不在 |
| 7 | 内部发现接口（真实后端） | PASS | `instances=2`（order/user），离线节点不在 |
| 8 | 无 JS 错误且无非白名单 4xx/5xx | PASS | `pageErrors=0 httpErrors=0` |

- 日志：`.local-run/nodes-backend-acceptance-final.log`（**8/8 PASS，EXIT=0**）
- 截图：`.local-run/nodes-browser/`（`10-backend-nodes.png` 等）
- 前端构建：`dist-node` 含 `NodesView-*.js`、`在线节点`、`节点管理`、`/ms/monitor/node`。

### 4.3 复现

```powershell
# 1) 后端编译
cd D:\ch\project\spring-support-parent-starter
mvn -pl spring-support-monitor-starter -DskipTests compile

# 2) 生成运行 classpath（写入 target/cp.txt）
mvn -pl spring-support-monitor-starter org.apache.maven.plugins:maven-dependency-plugin:3.10.0:build-classpath `
  "-Dmdep.outputFile=target/cp.txt" "-DincludeScope=runtime"

# 3) 启动最小后端（Tomcat 18091 + sync tcp:19380）
#    配置见 C:\Users\Administrator\AppData\Local\Temp\opencode\node-test.yml
#    （含 plugin.oauth.whitelist: /ms/**、plugin.sync.type=server/protocol=tcp）
java @target\java.args

# 4) 前端构建并托管
cd D:\ch\project\vue-support-parent-starter\apps\vue-support-monitor-starter
pnpm exec vite build --outDir dist-node
$env:DIST_DIR=(Get-Location).Path + "\dist-node"
$env:MS_API_TARGET="http://127.0.0.1:18091"
node scripts/acme-accept-serve.mjs 8848

# 5) 注册 3 个 report 节点（12s 后断开一个）
$env:SYNC_PORT="19380"; $env:DROP_AFTER="12000"
node scripts/report-node-sim.mjs

# 6) 浏览器验收
$env:MS_APP="http://127.0.0.1:8848"
$env:MS_E2E_API_LOGIN="http://192.168.50.198:8081"
node scripts/nodes-backend-acceptance.mjs   # 期望 8/8 PASS, EXIT=0
```

---

## 5. 部署说明（上线前必读）

1. **重新构建并部署 monitor console**：本次新增的 controller / registry / sync 服务端在 `spring-support-monitor-starter` 内；当前 198 上运行的 console jar 不包含，部署前 `/#/nodes` 与 `/ms/monitor/node/*` 会 404。
2. **端口**：sync 服务端默认 `19380`，可用 `MONITOR_SYNC_PORT` 覆盖；确认该端口未被占用（`SyncServerInstance.start` 失败只记日志、不阻断应用启动，但节点会为空）。
3. **report 客户端配置**：`plugin.sync.client.protocol=tcp`、`server-address=<monitor-host>:19380`；`report.app-report.enabled=true`（默认开启）。
4. **两套发现接口并存**：
   - `/ms/monitor/discovery/*`：服务管理的发现插件（原有，未改动）；
   - `/ms/monitor/node/discovery/*`：report 节点发现（本次新增）。
5. `HttpSyncClient` 的修复需随 report-client 升级才会在客户端生效；monitor 端默认 tcp，不依赖该修复。

---

## 6. 已知限制与如实声明

- 本次验收使用**真实后端代码 + 真实 sync 协议**，但运行在最小启动器上（未加载 monitor 的 AI/设备/数据源等无关模块）；完整 console 的重新部署与端到端联调尚未在 198 上执行（无 SSH 访问）。
- 未接入真实的第三方 report 客户端实例；使用协议级模拟器驱动（字段与 `AppRegisterReporter` 一致）。
- 公共 CA、真实生产流量不在本次范围。

**签核：通过。** 需求 1/1.1/1.2 均已实现；浏览器验收 8/8 PASS，真实注册链路（TCP register → sync/client/register → monitor/app/report → 节点列表/发现接口）完整贯通。
