# vue-support-ai-miniapp-starter

AI 控制台**微信小程序端**（uni-app + Vue3 + Vite）。业务范围：**登录 + AI 会话（对话）**，与 PC 端 `apps/vue-support-ai-starter` 复用**同一套后端 `/v2` 接口**、同一账号体系，会话数据互通。

本工程与 PC 端**共用同一个入口、同一行 import**：

```ts
import { createContextApp } from "@repo/app";
```

平台由 `platform: "wechat-miniapp"` 指定（缺省 `"web"` 即 PC 行为）。装配语义（storage → token → http → unwrap → 注入上下文）与 PC 完全一致，底层传输换成 `uni.request` / uni storage，**不引入** `@repo/core` 的浏览器链路（axios、vue-router、localStorage、Worker、wasm）。

## 与 PC 端的差异边界

| 能力 | PC（`platform: "web"`，缺省） | 小程序（`platform: "wechat-miniapp"`） |
|---|---|---|
| import 行 | `@repo/app` | `@repo/app`（**同一行**，本工程 alias 到小程序实现） |
| 实现 | `createVueApp` | `createMpApp`（`turbo/app/src/wechat-miniapp`） |
| 存储 | `localStorage` + AES 加密 | uni storage（小程序沙箱，按小程序隔离，不加前缀、不加密） |
| 传输 | axios（含拦截器 / SSE） | `uni.request`（普通请求）+ `ctx.sse`（`enableChunked` 流式） |
| 路由 | vue-router | `pages.json`（uni 原生页面栈） |
| 令牌 | `@repo/core` TokenManager | 同签名非续期子集：只读写、不 refresh、不常驻定时器 |
| 解包 | `code === "00000"` → data | 同口径（兼容 `"0"` / `"200"`） |
| UI | `@repo/ui`（element-plus 系） | `wot-design-uni`（uni 原生标签，easycom 通配符） |

### UI 组件库：wot-design-uni

- **只换组件，不换 Vue**：`wot-design-uni@1.14.0` 的 `dependencies` 为空，只有 `peerDependencies: { vue: ">=3.2.47" }`，用的是宿主同一个 Vue（本工程 `3.4.21`，uni-app 锁定），不会打包出第二份 Vue。
- **不能给 PC 用**：它的模板是 `view` / `button` + `open-type` / `hover-class`，源码里 19 处直接调 `uni.*`（`navigateTo`、`createSelectorQuery`、`getSystemInfoSync`…），必须有 uni 运行时和 uni 编译器。PC 端继续用 `@repo/ui`；两端共享的是**设计令牌**（配色、圆角、间距）而不是组件。
- **通配符：全部 `wd-*` 零 import 可用**。`pages.json` 里一条 easycom：

  ```json
  "easycom": {
    "autoscan": true,
    "custom": { "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue" }
  }
  ```

  模板直接写 `<wd-input>` / `<wd-button>` / `<wd-calendar>`…… 任何 `wd-*` 都行，页面里不用 import、不用写 `components`。**按需打包**：只有模板里真正出现的组件才进产物（实测：模板加一个未 import 的 `<wd-divider>`，构建自动补上 `usingComponents.wd-divider`；删掉后产物里就消失，dist 仍是 11 个组件 / 0.19 MB）。
- **`import.meta.glob` 收全量不行**：uni 的小程序编译器要求 `components` 能在编译期静态解析到文件路径。用 `import.meta.glob(".../wd-*/wd-*.vue", { eager: true })` 生成运行时对象再 `components: WdComponents`，编译结果 `usingComponents: {}`（实测），页面标签解析不出来。所以通配符只能走 easycom 这条编译期通路。
- 浮层（`useToast` / `useMessage`）是 `provide/inject` 模型：页面 `setup()` 里取一次，模板里挂一个 `<wd-toast />` / `<wd-message-box />` 作为宿主。
- **类型**：easycom 标签没有全局声明时，`vue-tsc` 不报错（实测 EXIT=0），代价是这些标签的 props 不做类型校验。某个页面想对某个组件严格校验 props，就在该页额外 `import WdInput from "wot-design-uni/components/wd-input/wd-input.vue"` 并注册——局部导入与 easycom 可共存，局部优先；不要引库的 `global.d.ts`（它会把整库 104 个组件拉进类型程序，其中 `useUpload.ts` 在严格模式下有已知错误）。

## 目录结构

```
src/
├── main.ts               # uni-app 入口：createContextApp({ platform: "wechat-miniapp", ... }).mountApp()
├── App.vue               # 应用壳
├── pages.json            # 页面路由（login / chat）+ easycom 通配符注册全部 wd-*
├── manifest.json         # 小程序 manifest（mp-weixin.appid = wx0eccb54367ca6165）
├── config.ts             # BASE_URL / 超时 / clientId 存储 key
├── api/
│   ├── http.ts           # 业务唯一出口：拼 /v2 前缀 + 统一超时；传输/令牌/401/解包全在框架上下文
│   ├── auth.ts           # POST /v2/auth/login
│   ├── character.ts      # GET /v2/roles（挑选默认角色）
│   ├── session.ts        # 会话 / 历史消息 / 停止生成
│   └── chat.ts           # POST /v2/chat/stream（SSE 分块）+ /v2/chat/send（降级）
└── pages/
    ├── login/index.vue   # 账号密码登录
    └── chat/index.vue    # 会话：消息列表、流式渲染、会话切换、停止生成
```

> 非组件代码取上下文用 `getMpAppContext()`（由 `@repo/app` 导出），组件内仍用 `inject("mpContext")`，两者是同一个对象。
>
> **单一出入口**：页面不直接调 `ctx.http` / `ctx.sse`，普通请求统一走 `src/api/http.ts`（拼 `/v2` + 统一超时 + `unwrap`），流式统一走 `src/api/chat.ts`（`ctx.sse` 的事件语义封装）；令牌读写也只经 `http.ts` 的 `getToken/setToken/clearToken`。

`@repo/app` 通过 `vite.config.ts` 的 alias + `tsconfig.json` 的 `paths` 指向仓库内源码
（`turbo/app/src/wechat-miniapp`），**不改 import 行、只换实现**：
因为包根 `turbo/app/src/index.ts` 有 `import "virtual:uno.css"` 这类 Web 副作用，
小程序构建没有 UnoCSS 插件，也不该吃 element-plus / vue-router。
同时不走 `node_modules`：本工程依赖集独立（uni-app 锁定 `3.0.0-alpha` 系列），
避免为一处 workspace 链接重装整仓依赖、动到其他会话在途的 `pnpm-lock.yaml`。

## 快速开始

```bash
# 在仓库根目录（vue-support-parent-starter）安装依赖（含本工程）
pnpm install

# 开发构建 → 产物 dist/dev/mp-weixin
pnpm --filter vue-support-ai-miniapp-starter dev:mp-weixin

# 生产构建 → 产物 dist/build/mp-weixin
pnpm --filter vue-support-ai-miniapp-starter build:mp-weixin
```

用**微信开发者工具**导入**本工程根目录**（`apps/vue-support-ai-miniapp-starter`）即可预览：
根目录的 `project.config.json` 已用 `miniprogramRoot: "dist/dev/mp-weixin/"` 指向开发产物，
发布时把该值改为 `dist/build/mp-weixin/`（或直接导入产物目录）。

## 后端地址配置

- 改 `src/config.ts` 的 `BASE_URL`，默认 `http://127.0.0.1:8787`，与 PC 端 `AI_API_TARGET` 指向同一后端。
- 所有接口直连 `BASE_URL + /v2`，不经代理。
- 开发者工具调试 `http://127.0.0.1` 时，需在「详情 → 本地设置」勾选**「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**；真机预览需改为局域网/公网可达地址，且正式环境必须是 HTTPS + 已配置的合法域名。

## 登录说明

- 账号密码登录：`POST /v2/auth/login`，body `{ username, password }`。
- 成功响应（信封 `{code:"00000", data, msg}`）：`data = { accessToken, tokenType, user }`。
- token 存本地 Storage，后续请求带 `Authorization: Bearer <accessToken>`；收到 401 自动清除并跳回登录页。
- 账号与 PC 端完全同源，无需单独注册。

## 对话与流式

- 发消息走 `POST /v2/chat/stream`（SSE），请求体与 PC 端 `ChatStreamService` 同构：`{ sessionId, userMessage: { content }, stream: true, chatRequestId, regenerationMode: null, ... }`。
- 小程序无 `EventSource`/`fetch`，流式能力由框架的 `ctx.sse` 提供（`uni.request` 的 `enableChunked` + `onChunkReceived`），内置增量 UTF-8 解码（处理中文被切块的边界）、SSE 分帧、心跳忽略与 `data: [DONE]` 收尾；应用层只处理 `onMessage` / `onDone` / `onError` 语义，不再自己解析字节流。
- 事件类型对齐 PC 端：`think`（思考）、`text`（正文增量）、`tool_call`、`finish`、`turn_end` 等。
- 新建会话需先 `GET /v2/roles` 挑默认角色（优先 `general-assistant`/名称含「通用」，否则取第一个），再 `POST /v2/sessions`。
- 环境不支持分块响应时自动降级：`POST /v2/chat/send`（fire-and-forget）+ 轮询历史消息渲染结果。
- 停止生成：`POST /v2/chat/stream/:sessionId/stop`，同时中断本地流。

## 注意事项

- `manifest.json` 的 `mp-weixin.appid` 已填入 `wx0eccb54367ca6165`（重建后同步到产物 `project.config.json`）；AppSecret 不入库、不进源码。
- 工程未提供 `build` 脚本（避免被根 `turbo run build` 拉起），小程序构建请用 `build:mp-weixin`。
- 未提供 H5 目标（仓库 `.gitignore` 忽略 `apps/*/index.html`，而 uni H5 工程必须有该文件）；如需 H5 可自行补 `index.html` 并加回 `dev:h5`/`build:h5` 脚本。
- H5 直连后端会被 CORS 拦截（后端对带 `Origin` 的请求返回 403），小程序原生请求不带 `Origin`，不受影响；H5 方案需另配代理。

## 验证记录（2026-11-19）

| 项 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npx vue-tsc --noEmit` | EXIT=0 |
| 小程序构建 | `npx uni build -p mp-weixin` | DONE Build complete |
| 产物组件 | 扫 `dist/build/mp-weixin/` | 只含模板实际用到的 `wd-*`（11 个 / 0.19 MB），每页 `usingComponents` 与之对应 |
| 通配符验证 | 模板加未 import 的 `<wd-divider>` 后构建 | `usingComponents` 自动多出 `wd-divider`；删掉后产物里消失 |
| glob 方案验证 | `import.meta.glob(...eager)` + `components: WdComponents` | `usingComponents: {}`，**不可用**（小程序编译器要求静态可解析） |
| 产物依赖检查 | 扫 `dist/build/mp-weixin/**/*.js` | 无 element-plus / vue-router / axios / createVueApp |
| 适配层单测 | Node 模拟 uni 运行时（storage TTL / token / http 401 / SSE 跨块中文 / unwrap / mountApp） | 48/48 PASS |
| 清理后校验 | 令牌无 refresh、存储无加密、`MpHttp` 只有 `request`、SSE 只在 `ctx.sse` | 单测断言通过（`token` 无 refresh 键、`Object.keys(http)===["request"]`） |
| 真实链路 | 经 `createMpApp` 直连 `127.0.0.1:8787` | 登录 / roles(113) / sessions / 错误密码 全通过 |
