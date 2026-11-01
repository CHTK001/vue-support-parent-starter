# pages/tunnel — 内网穿透隧道工作台

ngrok / Cloudflare Tunnel 两种 Provider 的 **UI 操作 + SSE 实时状态** 工作台页面，托管于监控管理应用（`vue-support-monitor-starter`）。

## 结构

```
pages/tunnel/
├── package.json          # workspace 包（@pages/tunnel）
├── tsconfig.json
├── src/index.ts          # 路由工厂 + API + 页面导出
├── src/api/
│   ├── types.ts          # TunnelProvider / TunnelRecord / TunnelView
│   └── tunnelApi.ts      # ngrok / cloudflared 两端 REST + 流 URL
├── src/routes/index.ts   # createTunnelRoutes()
└── src/views/
    ├── TunnelWorkbench.vue   # 工作台（表格 + 编辑抽屉 + SSE 实时流）
    ├── NgrokTunnelView.vue   # ngrok Provider
    └── CloudflaredTunnelView.vue  # Cloudflare Tunnel Provider
```

## 路由

`createTunnelRoutes()` 展开后得到一个分组 + 两个叶子：

| 路径 | 名称 | 说明 |
|------|------|------|
| `/grp-tunnel` | `GroupTunnel` | 内网穿透（分组导航，menu rank 15） |
| `/tunnels/ngrok` | `Tunnel_ngrok` | ngrok 隧道工作台（叶子，进入 `/workbench`） |
| `/tunnels/cloudflared` | `Tunnel_cloudflared` | Cloudflare Tunnel 隧道工作台（叶子，进入 `/workbench`） |

宿主（`apps/vue-support-monitor-starter/src/router/index.ts`）中一行 `...createTunnelRoutes()` 挂载，页面内TabPage 各自开关。

## API

所有接口是 `@repo/utils` 的 `http()` 链，`unwrapResult` 剥信封，鉴权由 `@repo/utils` 的 `http` 拦截器自动注入。

- 各页面用 `ngrokList / cloudflaredList` / `ngrokCreate / ngrokUpdate / ngrokDelete / ngrokStart / ngrokStop` 完成 CRUD，`ngrokStreamUrl()` / `cloudflaredStreamUrl()` 完成 SSE；
- `mode` 在 ngrok 侧是 `http` / `tcp` / `tls`，在云flare侧是 `quick` / `named`，`TunnelRecord.mode` 的联合类型覆盖了这两组。

## 实时状态（SSE）

工作台 `onMounted` 时发起 `http().get(api.value.streamUrl).sse({...})`，后端 `TunnelStatusStream`：

- 建立连接时立即推送当前完整快照；
- 之后每 **1.5 秒** 广播一次 `List<TunnelView>`（事件名 `tunnels`）；
- 启停操作的结果随下一次 tick 到达所有页签；
- 断线自动重连，离开页面（`onBeforeUnmount`）时关闭。

前端 `onMessage` 直接替换 `list` 列表并刷新选中的行，所以表格不用刷新就能看到状态**实时转动**。

## 配置持久化

后端不借助数据库：每个映射以 `<store-dir>/<id>.json` 落地磁盘，`plugin.ngolk.store-dir`（默认 `~/.chua/tunnel/ngrok`）与 `plugin.cloudflared.store-dir`（默认 `~/.chua/tunnel/cloudflared`）。`pages/tunnel` 读接口，`spring-support-<ngrok|cloudflared>-starter` 写 JSON。

关于自动启动：应用的 `plugin.<ngrok|cloudflared>.auto-start: false` 关掉该能力，页面手动启停。关于自动启动的配置见对应 Starter 的 README（ngrok 第 10 章 / cloudflared 第 9 章）。
