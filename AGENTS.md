# AGENTS.md — vue-support-parent-starter

> **模块边界与依赖铁律：[`../规则.md`](../规则.md)（`D:\ch\project\规则.md`），动手前必须先读并遵守。违反 R1/R2 = S0 严重 bug。**
> 全局规则：`C:\Users\Administrator\.config\opencode\AGENTS.md`；源码编辑红线：`C:\Users\Administrator\.agents\GLOBAL-SOURCE-EDITING-RULES.md`。

## 本仓库定位

Vue3 Turbo monorepo（`apps/` + `packages/`）前端工程。

## 三条铁律（摘要，全文以 `规则.md` 为准）

1. **R1 禁止业务穿插**：前端不得实现后端业务规则；判重、级联、归属、校验等以后端为准，前端只做展示与交互。
2. **R2 禁止穿透**：只调用后端契约接口，不假设表结构、不绕过接口直连数据。
3. **R4 复用优先**：通用组件/工具先进 `packages/`，不在各 `apps/` 里复制一份。

## 应用装配入口（PC / 小程序统一）

- 唯一入口 `@repo/app` 的 `createContextApp`，新增 `platform`：`"web"`（缺省）/ `"wechat-miniapp"`。
- Web 分支 = `createVueApp`（vue-router / pinia / axios / localStorage）；小程序分支 = `@repo/app/wechat-miniapp`（uni storage / uni.request / token / `ctx.sse`），源码在 `turbo/app/src/wechat-miniapp`。
- 小程序上下文的出口是固定的：`storage` / `token` / `http`（只有 `request`）/ `sse`（只有 `stream` + `supported`）/ `unwrap`。**不做令牌续期**（无 refresh、无常驻定时器，401 直接清令牌回登录页）、**存储不加解密**（小程序沙箱本身隔离）；流式只能经 `ctx.sse`，业务层不得自己解析字节流或另开 `uni.request`。
- 重载收窄：`{ platform: "wechat-miniapp" }` 字面量 → `MpAppBuilder`，其余 → `VueAppBuilder`；PC 应用保持不写 `platform`。
- 平台差异用「接口 + 实现」表达：`turbo/app/src/platform/types.ts`（`AppPlatformAdapter`）+ `web.adapter.ts` / `wechat-miniapp.adapter.ts` + `registry.ts`（查表一行分发），入口不写 `if (platform === ...)`。新增平台 = 新增实现文件 + 注册一行。
- 小程序工程 `apps/vue-support-ai-miniapp-starter` 也只写 `import { createContextApp } from "@repo/app"`（与 PC 同一行）；构建期用 vite alias + tsconfig paths 把 `@repo/app` 解析到 `turbo/app/src/wechat-miniapp`，避开包根的 `virtual:uno.css` 等 Web 副作用，不新增 workspace 依赖链接。
- 业务服务层复用 `@pages/ai/src/services/modules/*.api.ts`（只依赖 `this: ApiContext`），**不要**再建 `pages/wechat-miniapp-core`；平台差异只允许落在传输适配（`_request` / SSE）。
- 小程序 UI 用 `wot-design-uni`，组件走 `pages.json` 的 easycom 通配符（`^wd-(.*)`）：模板里所有 `wd-*` 零 import 可用，按模板用量打包；**不要**用 `import.meta.glob` 收集全量组件（小程序编译器要求 `components` 静态可解析，glob 结果进不了 `usingComponents`）。需要严格校验某组件 props 时可单独局部 import，两者可共存。PC 用 `@repo/ui`；两端只共享设计令牌，**不要**把 `wd-*` 组件或 `@repo/ui` 组件互相搬。
- 小程序自建组件放 `src/components/<name>/<name>.vue`（同样由 easycom 自动登记，模板零 import）；AI 输出的富文本走 `src/utils/markdown.ts` 的轻量子集 AST + `markdown-body`/`md-inline` 渲染，**不要**引入产出 HTML 的 Markdown 库（`mp-weixin` 无 DOM，`v-html` 不可用）。
- **独立页面应用绕过 `@repo/app` 引导时必须自收首屏 loader**：createVite 共享模板注入的 `#app-loader`（`public/loader.js`，fixed 全屏、z-index 9999）平时由 `createVueApp` 的 `hideAppLoaderWhenReady` 收起；不走共享引导的裸 `createApp` 应用（如 `pages/logger`）若不自行「路由 ready → 双 rAF → `window.hideAppLoader()`」，遮罩会永久盖在页面上拦截一切点击（表现：应用功能全部正常，但浏览器自动化所有 click 因 "sys-loader-shell intercepts pointer events" 超时）。写法参照 `pages/ai/src/main.js`。

## 渠道管理口径（跨仓库硬约束）

- 渠道管理**整体**属于后端 `spring-support-account-starter`；页面只调用 account 提供的渠道管理 API（如 `/api/channels`、`/api/providers`）。
- 后端 ai-starter 只是 `FreeChatClient` 消费方，前端不得依赖 ai 侧的渠道实现细节。
- 模型数量、开关、连接等展示口径必须与「已开启渠道 × 已开启模型」一致，不得用前端兜底掩盖后端数据问题。

## 交付闸门

`pnpm build` / 类型检查通过；改动页面的关键控件必须真点验证（含删除类：点到确认框后取消）；写入类操作验证后必须还原数据。

## 提交

只提交自己的文件，避开其它会话的在途改动。

- **pathspec 只能隔离到文件粒度，隔离不了同文件内的他人 hunk**：若目标文件里混有其它会话的未提交改动，`git commit -F msg -- <path>` 会把整份工作区内容一起提交（真实事故：ScDataSourceView.vue 混入他会话 +182 行驱动库特性）。提交前先 `git diff --stat -- <path>` 核对改动量是否与自己的编辑一致；不一致时按「备份工作区文件 → `git checkout -- <path>` 回基线 → 只重放自己的修改 → 提交 → 复原备份」处理。
- 共享索引里可能残留他会话 `git add` 过的内容：裸 `git commit`（无 pathspec）会把整个索引一起提交；务必带显式 pathspec，并在提交后 `git show --stat HEAD` 复核文件清单。
