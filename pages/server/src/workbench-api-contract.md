# 主机工作台 —— 后端接口约定（草案 v0.1）

> 本文档供 `spring-support-monitor-starter` Java 侧实现参考，前端已按此约定就位
> （`pages/server/src/views/ScHostWorkbench.vue` + `components/lab/*`）。
> 三个能力域：**Docker / Kubernetes 容器工作台**、**主机隧道 / 反向隧道**。
>
> 前缀与现有约定一致：
>
> - 容器 / 编排：挂在主机维度下 → `/ms/server/host/{hostId}/docker|kubernetes`
> - 隧道：挂主机维度下 → `/ms/server/host/{hostId}/tunnel`
> - 响应统一 `ReturnResult<T>`（`com.chua.common.support.lang.code.ReturnResult`），
>   成功 `code=0`；错误以 `msg` 透出，前端直接 message.error。
> - 默认走 `@Tag(name = "监控-主机工作台")`，`@RestController @RequestMapping`。

---

## 0. 通用约定

- **路径参数**：`hostId` 为 `Long`（与 `MsServerHost.id` 一致）。
- **鉴权**：复用现有 AuthFilter（与 `host/identity`、`sftp` 同一条链路）。
- **能力探测**：容器/编排接口统一先探能力；能力不存在时返回 `code=1, msg="主机未安装Docker"`
  或 `"未检测到Kubernetes集群"`，前端据此**隐藏功能入口**（见前端门控逻辑）。
- 所有写操作成功后建议返回完整视图对象（刷新一次即可，无需前端再查一遍）。

---

## 1. Docker / Kubernetes 工作台

### 1.1 能力探测

```
GET /ms/server/host/{hostId}/docker/capability
GET /ms/server/host/{hostId}/kubernetes/capability
```

返回：

```json
{
  "code": 0,
  "data": {
    "installed": true,
    "version": "27.3.1",
    "compose": true,          // docker 配套 compose 是否可用
    "runtime": "docker"       // docker / containerd / podman
  }
}
```

- `installed=false` 时前端隐藏该域入口。
- Kubernetes 侧字段：`apiVersion`、`serverVersion`、`nodes(总数/就绪数)`。

### 1.2 容器（Docker）

```
GET  /ms/server/host/{hostId}/docker/containers?all=true
GET  /ms/server/host/{hostId}/docker/containers/{containerId}
POST /ms/server/host/{hostId}/docker/containers/{containerId}/start
POST /ms/server/host/{hostId}/docker/containers/{containerId}/stop
POST /ms/server/host/{hostId}/docker/containers/{containerId}/restart
POST /ms/server/host/{hostId}/docker/containers/{containerId}/logs?tail=200&follow=false
POST /ms/server/host/{hostId}/docker/containers/{containerId}/exec
```

`containers` 列表项（前端卡片墙字段，卡片左上色条=运行态）：

```json
{
  "id": "3f2ab9c1d5e6",
  "name": "nginx-proxy",
  "image": "nginx:1.27-alpine",
  "state": "running",        // running / exited / paused / dead
  "status": "Up 42 days",
  "ports": "0.0.0.0:80->80/tcp, 443->443/tcp",
  "network": "proxy-net",
  "stats": { "cpuPct": "0.4", "mem": "18.2M", "memPct": "0.6" },
  "createdAt": "2026-09-13T08:12:00"
}
```

`exec` 请求体：`{ "cmd": ["/bin/bash"], "cols": 80, "rows": 24 }`，
建议返回可复用/可订阅的 **WebSocket** 端点
`/ws/ms/server/host/{hostId}/docker/exec?containerId=...`（复用 SSH PTY 桥的形态），
HTTP 版本仅做一次性命令输出（`docker exec` 非交互）。

### 1.3 镜像 / 网络 / 卷

```
GET /ms/server/host/{hostId}/docker/images
GET /ms/server/host/{hostId}/docker/networks
GET /ms/server/host/{hostId}/docker/volumes
POST /ms/server/host/{hostId}/docker/prune        // 清理悬空镜像/停用卷
```

### 1.4 Kubernetes

```
GET /ms/server/host/{hostId}/kubernetes/cluster       // 节点列表 + 版本 + 就绪
GET /ms/server/host/{hostId}/kubernetes/workloads?namespace=
GET /ms/server/host/{hostId}/kubernetes/namespaces
POST /ms/server/host/{hostId}/kubernetes/workloads/{name}/scale?replicas=3
POST /ms/server/host/{hostId}/kubernetes/workloads/{name}/restart
```

`workloads` 列表项（前端 K8s 工作负载卡字段）：

```json
{
  "name": "web-front",
  "kind": "Deployment",         // Deployment / StatefulSet / DaemonSet / Job
  "namespace": "frontend",
  "ready": "3/3",
  "image": "registry/front:v3",
  "restarts": 0,
  "age": "12d"
}
```

---

## 2. 隧道 / 反向隧道

语义（前端双向网关版式已按此建模）：

- **正向隧道（`FORWARD` / ssh -L）**：本机监听端口 → 经跳板 SSH → 目标主机端口。
- **反向隧道（`REVERSE` / ssh -R）**：跳板（远端）监听端口 → 回连本机服务端口。
- 隧道附着在「跳板主机」上（`hostId` = 跳板），`from` 与 `to` 的具体语义由 `direction` 决定。

### 2.1 列表（含状态）

```
GET /ms/server/host/{hostId}/tunnel
```

```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "开发库直连",
      "direction": "FORWARD",          // FORWARD / REVERSE
      "protocol": "TCP",               // TCP / HTTP / UDP
      "state": "RUNNING",              // RUNNING / STOPPED / FAILED
      "listenHost": "127.0.0.1",
      "listenPort": 3306,
      "targetHost": "10.0.2.15",
      "targetPort": 3306,
      "jumpHost": { "hostId": 7, "name": "web-01" },
      "identityId": 3,                 // 跳板登录身份（0/空=默认凭据）
      "rate": "2.1 MB/s",
      "createdAt": "2026-10-25T09:00:00"
    }
  ]
}
```

### 2.2 创建

```
POST /ms/server/host/{hostId}/tunnel
```

```json
{
  "name": "开发库直连",
  "direction": "FORWARD",
  "protocol": "TCP",
  "listenHost": "127.0.0.1",
  "listenPort": 3306,
  "targetHost": "10.0.2.15",
  "targetPort": 3306,
  "identityId": 3,
  "autoStart": true
}
```

- `direction=FORWARD`：`listenHost/listenPort` 为本机监听；`targetHost/targetPort` 为目标。
- `direction=REVERSE`：`listenHost/listenPort` 为跳板监听；`targetHost/targetPort` 为回流本机服务。
- 实现建议：进程模型（autossh / jsch port forwarding）托管与 `MsServerHost` 生命周期对齐，
  主机关停时清理隧道子进程。

### 2.3 启停 / 更新 / 删除

```
PUT    /ms/server/host/{hostId}/tunnel/{id}/state?state=RUNNING|STOPPED
PUT    /ms/server/host/{hostId}/tunnel/{id}
DELETE /ms/server/host/{hostId}/tunnel/{id}
```

### 2.4 命令生成（前端命令生成版式的数据源）

```
POST /ms/server/host/{hostId}/tunnel/ssh-command
```

入参同 2.2，返回：

```json
{
  "code": 0,
  "data": {
    "command": "ssh -fN -L 127.0.0.1:3306:10.0.2.15:3306 -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 deploy@web-01"
  }
}
```

---

## 3. 前端文件索引（已就位）

| 前端文件 | 内容 |
|---|---|
| `vue-support-parent-starter/pages/server/src/views/ScHostWorkbench.vue` | 工作台容器（分屏/Docker/隧道面板切换） |
| `vue-support-parent-starter/pages/server/src/components/lab/ScRealScreenWorkbench.vue` | 真实分屏终端（免费画布，真实 viewer） |
| `vue-support-parent-starter/pages/server/src/components/lab/ScDockerK8sWorkbench.vue` | Docker/K8s 卡片推进（mock，待接 1.x） |
| `vue-support-parent-starter/pages/server/src/components/lab/ScTunnelWorkbench.vue` | 隧道双向网关（mock，待接 2.x） |
| `vue-support-parent-starter/pages/server/src/views/AssetsView.vue` | 右键菜单 → 工作台/分屏/Docker/K8s/隧道 页签入口 |

## 4. 前端数据接入点（后端就绪后改这些）

- `pages/server/src/api/index.ts` 后追加
  `listDockerContainers(hostId)` / `toggleTunnel(hostId, id, state)` 等，前缀 `/ms/server/host/{id}/...`。
- `ScDockerK8sWorkbench.vue`：`CONTAINERS/K8S` 常量改为 `onMounted` 拉接口；
  失败统一落到 `installed=false` 空态（保留「未检测到服务」文案）。
- `ScTunnelWorkbench.vue`：`TUNNELS` 改为接口拉取；`toggleStatus` 调
  `PUT .../state`，成功后用返回值覆盖该条。

---

## 5. 终端指令通道（iframe 与渲染器之间）

终端画面是后端静态页 `/ssh-direct.html`（内嵌 xterm，直连
`/ws/ms/server/terminal/ssh`），**不在本机渲染**，所以"把片段敲进终端并执行"
要走跨窗口消息：

### 5.1 渲染器 → iframe（`TERMINAL_INPUT`）

前端 `ScSshDirectViewer` 暴露 `sendCommand(command)` / `sendCommands(commands[])`，
向 iframe 发 `postMessage`；iframe 页面（后端 `/ssh-direct.html` 的脚本）收到后
在 xterm 里键入并执行。

```js
// 前端发出（ScSshDirectViewer.sendCommand）
iframeEl.contentWindow.postMessage(
  { type: 'TERMINAL_INPUT', command: 'ls -la && git status' },
  '*',
)
```

iframe 页面收到后预期行为：
1. 把 `command` 的完整文本（含换行）键入 xterm（`xterm.buffer` 或后端 PTY
   的 stdin 写口）
2. 随即下发一个 **回车（`\r`）**，完成"双击 → 终端执行"
3. 若 xterm 未准备（session 未打开），推迟执行直到 session 打开

> 身份与密文由 `?x-oauth-token=` 接管；点击/下载入口的 `?hostId=...&identityId=...`
> 定位 session。密码/token 不能通过 message 字段透传。

### 5.2 iframe → 渲染器（`TERMINAL_ACK`，选填）

iframe 完成键入后回发 `{ type: 'TERMINAL_ACK', ... }`，前端不作面向用户的
二次消费（行为端点只负责按下那个回车），留给后端审计做日志回连。

### 5.3 协议注册

后端 `src/pages/ssh-direct.html` 的脚本需补齐
`window.addEventListener('message', ...)`；未实现时前端静默尝试，
`TerminalView.onSnippetCommand` 对 RDP/VNC 终端用 `message.warning`
提示手动粘贴。

---

## 6. 调度（SPI 按平台）

`/ms/server/host/{hostId}/schedule` 一组接口（右键菜单「调度信息」最终入口，
见 `AssetsView` 的 `tabKind: "schedule"`），SPI 的约束由各平台命令决定：

| 字段 | 说明 |
|---|---|
| `msScheduleName` | 规则名 |
| `expression` | cron |
| `command` | 在目标平台上执行的 shell 命令 |
| `platform` | `win | linux | mac`（空=全部），SPI 按平台切分执行器 |
| `remark` | 备注 |