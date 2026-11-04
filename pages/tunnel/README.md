# pages/tunnel — 内网穿透隧道管理

把本机端口映射到公网的 **一个页面**。ngrok 与 Cloudflare Tunnel 不是两个功能，
而是后端同一个 SPI（`TunnelProvider`）的两个实现：页面上「新增映射」时选提供方，
其余接口一律按映射 `id` 操作。托管于监控管理应用（`vue-support-monitor-starter`）。

## 结构

```
pages/tunnel/
├── package.json          # workspace 包（@pages/tunnel）
├── tsconfig.json
├── src/index.ts          # 路由工厂 + API + 页面导出
├── src/api/
│   ├── types.ts          # TunnelRecord / TunnelView / TunnelProviderInfo
│   └── tunnelApi.ts      # 统一接口 /ms/tunnel（一套函数，不按提供方分叉）
├── src/routes/index.ts   # createTunnelRoutes()
└── src/views/
    └── TunnelPage.vue    # 唯一页面：ReTable 卡片列表 + 新增/编辑弹窗
```

## 路由

`createTunnelRoutes()` 展开后是「一个分组 + 一个叶子 + 两条历史重定向」：

| 路径 | 名称 | 说明 |
|------|------|------|
| `/grp-tunnel` | `GroupTunnel` | 内网穿透（菜单分组，rank 15） |
| `/tunnel` | `Tunnel` | 隧道列表（唯一菜单项，`keepAlive: true`） |
| `/tunnels/ngrok` | `TunnelNgrokLegacy` | 旧书签，隐藏（`showLink: false`）并重定向到 `/tunnel` |
| `/tunnels/cloudflared` | `TunnelCloudflaredLegacy` | 同上 |

宿主（`apps/vue-support-monitor-starter/src/router/index.ts`）中一行
`...createTunnelRoutes()` 挂载。`keep-alive` 按**组件名**登记，页面用
`defineOptions({ name: "TunnelPage" })` 固定，不依赖路由名。

## 界面

只有两件东西，刻意的：

- **卡片列表**：`ReTable` 的卡片布局（`layout="card"` + `layout-card.fields`），
  一张卡片 = 一条映射：名称、提供方、状态、模式、本地端口、域名、公网地址、最近错误，
  底部三个按钮（启动/停止、编辑、删除）；点击卡片本体直接进入编辑。
- **新增/编辑弹窗**：`ReDialog` 一张表单，**提供方下拉 + 模式下拉联动**（模式选项来自
  后端 `/ms/tunnel/providers`，页面不写死 ngrok/cloudflared），端口、域名、远程地址、
  Basic 认证、authtoken / Token 按提供方与模式条件显隐。

去掉的东西：SSE 实时流（改为操作后重新拉一次列表）、编辑抽屉、按提供方分页签。
这么做的前提是后端已把两个提供方收敛成一个控制器——一个提供方一个页面的时代，
页面里任何一处改动都要写两遍。

## API

全是 `@repo/utils` 的 `http()` 链，`unwrapResult` 剥信封，鉴权由 `http` 拦截器注入。
后端统一入口 `/ms/tunnel`：

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/ms/tunnel/providers` | 提供方清单（展示名、可用性、支持模式、能力） |
| GET | `/ms/tunnel?provider=` | 映射列表（不带参数 = 全部提供方） |
| GET | `/ms/tunnel/{id}` | 详情 |
| POST | `/ms/tunnel` | 新建（请求体 `provider` 决定归属） |
| PUT | `/ms/tunnel/{id}` | 更新（运行中会按新配置重启） |
| DELETE | `/ms/tunnel/{id}` | 删除 |
| POST | `/ms/tunnel/{id}/start` | 启动 |
| POST | `/ms/tunnel/{id}/stop` | 停止 |
| GET | `/ms/tunnel/stream` | SSE 实时状态（页面未订阅，留给需要推送的宿主） |

新增一种提供方时，只要后端引入对应 starter 并注册一个 `TunnelProvider` Bean，
本页面与 `tunnelApi.ts` 一行都不用改——下拉里自然多一项，模式选项跟着来。

## 配置持久化

后端不借助数据库：每个映射落地为 `<store-dir>/<id>.json`，默认
`~/.chua/tunnel/<provider>/`；`plugin.ngrok.store-dir` 与 `plugin.cloudflared.store-dir`
作为历史覆盖点被继续识别，升级后旧映射文件不需要人工搬迁。

页面默认关闭自动启动（`plugin.<provider>.auto-start: false`），靠卡片上的
「启动 / 停止」手动管理；需要随应用启动时，在弹窗里打开「自动启动」即可。
