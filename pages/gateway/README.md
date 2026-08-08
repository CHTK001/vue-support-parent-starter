# @repo/gateway —— 远控网关前端共享包

本包提供 utils-support-gateway-server-starter 的远控前端组件。
**vue-support-gateway-starter**（apps 下）作为唯一入口应用。

## 主页面：3 步流程

`/remote` 路由由新版 `RemoteControl.vue` 提供。

```
步骤 1: ConnectionForm（key 模式 + custom 模式 tab）
   ↓ emit('authenticate', payload)
步骤 2: POST /api/connections/authenticate
   ↓ server 返回 { tunnelId, wsUrl }
步骤 3: 按 protocol 渲染对应 Viewer
   - VNC      → VncViewer（noVNC iframe）
   - SSH      → SshViewer（xterm.js + WS）
   - RDP      → RdpViewer（guacamole-common-js）
   - RustDesk → RustDeskViewer（占位）
```

## 导出清单

| 名称 | 类型 | 用途 |
|---|---|---|
| `RemoteControl` | Vue 组件 | 主页面（已挂在 `/remote` 路由） |
| `ConnectionForm` | Vue 组件 | 表单（key + custom 双模式） |
| `VncViewer` | Vue 组件 | VNC 客户端 |
| `SshViewer` | Vue 组件 | SSH 终端 |
| `RdpViewer` | Vue 组件 | RDP / VNC / SSH 经 guacd |
| `RustDeskViewer` | Vue 组件 | 占位 |
| `GatewayManage` | Vue 组件 | 网关管理（旧） |
| `ConferenceJoin` | Vue 组件 | 会议加入（旧） |
| `useGateway` | composable | 网关状态 |
| `useRemoteControl` | composable | 远控会话（旧） |
| `authenticate` | API | POST /api/connections/authenticate |
| `listKeys` | API | GET /api/connections/keys |
| `listProtocols` | API | GET /api/connections/list |
| `reportMetrics` | API | POST /api/connections/metrics |
| `AuthPayload` | 类型 | authenticate 请求体 |
| `AuthResponse` | 类型 | 鉴权响应（含 tunnelId, wsUrl） |
| `ProtocolInfo` | 类型 | 协议信息 |
| `AuthError` | 类 | 鉴权错误（含 status） |
| `gatewayRoutes` | 路由 | 路由表 |

## 旧版本（保留兼容）

- `views/remote/index.vue`：原侧边栏 + 右侧 Viewer 双栏布局，路由在 `/remote/legacy`
- `useRemoteControl` composable：旧会话管理
- 旧 Viewer：`DesktopViewer`, `SshTerminal`, `SshFileManager`, `ConferenceRoom`, `ConnectionSettings`

## 启动

```bash
# 1. 后端 gateway server（utils-support-gateway-server-starter）
java -jar target/remote-agent.jar

# 2. 前端 vite dev
pnpm dev --filter vue-support-gateway-starter
# 访问 http://localhost:7788/#/remote
```

## 后续

- Phase D: 联调测试（本地）
- Phase E: RustDesk 协议桥接实现

@author CH
@since 4.0.0.42