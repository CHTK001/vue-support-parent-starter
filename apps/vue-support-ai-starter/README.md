# vue-support-ai-starter

AI 控制台**独立应用部署壳**。真实业务代码全部在 [`pages/ai`](../../pages/ai)（包名 `@pages/ai`），本应用只提供启动装配（`src/main.js` 深导入 `@pages/ai/main.js`）与部署资产（`dist/app.example.yaml`），不能作为前端 root 直接开发页面。

对应后端：AI 网关（默认 `http://127.0.0.1:8787`，接口前缀 `/v2`）。

## 功能

- AI 会话（多会话、流式输出、上下文、附件）
- 模型管理（供应商模板库 / 渠道模型目录 / 健康探测，唯一模型真相源）
- AI 对话设置分区 + 悬浮 AI 助手（经 `@repo/theme` 注册表注入；webllm 本地推理由 `@repo/web-llm` 提供）
- MCP / Agents / Skills 管理页
- 用量统计、生图页、世界沙盒等

## 技术栈

Vue 3 + TypeScript + Vite（共享 `turbo/vite/createVite.ts`）、Element Plus、Pinia、Vue Router、tiptap（富文本）、echarts、marked + katex + highlight.js（Markdown 渲染）。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/ai": "workspace:*",        // AI 控制台全部业务页
  "@pages/cdp": "workspace:*",
  "@pages/channel": "workspace:*",
  "@pages/filesystem": "workspace:*",
  "@repo/web-llm": "workspace:*",    // （声明在 @pages/ai 侧）webllm 本地推理
  "@repo/theme": "workspace:*",      // koi 主题（登录 / 布局 / 配置抽屉）
  "@repo/core": "workspace:*",       // 路由 / 守卫 / http 管线
  "@repo/config": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*"
}
```

## 开发启动

```bash
cd apps/vue-support-ai-starter
pnpm dev          # 端口 15689，/v2 与 /api 代理到 AI_API_TARGET（默认 http://127.0.0.1:8787）
```

注意：dev 代理只转发 `/v2`、`/api`、`/static`，不转发 `/v1`。后端 OpenAI 兼容入口是 `/v2/v1/chat/completions`。

## 目录结构

```
src/
├── main.js     # 启动装配（深导入 @pages/ai/main.js，含 createApp / 路由守卫 / i18n）
└── types/      # 部署壳类型
dist/
└── app.example.yaml   # 部署侧 app.yaml 样例（aiChat 等配置）
```

## 与宿主的关系

宿主（system / eduai）复用 AI 业务页时**不要**引本应用的整壳：走 `@pages/ai/menu.ts`（菜单嵌入）或 `@pages/ai/embed.ts`（桥接宿主 i18n / http 上下文），避免把 element-plus / tailwind 全局样式拖进宿主。
