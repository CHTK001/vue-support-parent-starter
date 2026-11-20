# vue-support-eduai-starter

教育 AI 平台前端。业务代码在 [`pages/eduai`](../../pages/eduai)（包名 `@pages/eduai`），并复用 `@pages/collect`（采集）；本应用是部署壳（`src/main.ts` 装配入口）。

## 功能

- 教育 AI 业务页（课件 / 练习 / 评测等，见 `@pages/eduai`）
- 富文本编辑（tiptap：starter-kit + image + placeholder + text-align）
- 采集模块复用（`@pages/collect`）

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Vue Router、tiptap、`@repo/languages`（i18n）。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/eduai": "workspace:*",       // 教育 AI 业务页
  "@pages/collect": "workspace:*",     // 采集复用
  "@repo/app": "workspace:*",
  "@repo/theme": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/languages": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*",
  "@tiptap/vue-3": "catalog:",
  "@tiptap/starter-kit": "catalog:",
  "@tiptap/extension-image": "catalog:",
  "@tiptap/extension-placeholder": "catalog:",
  "@tiptap/extension-text-align": "catalog:"
}
```

## 开发启动

```bash
cd apps/vue-support-eduai-starter
pnpm dev
pnpm build
```

## 验收口径

- 类型检查用 pages 级 tsconfig + 宿主 `vue-tsc`（eduai 类型检查口径，见 test/）。
- 部署为独立 jar + 独立端口（cancon 部署 tenant 版 monitor 口径，虚拟线程须关）。
