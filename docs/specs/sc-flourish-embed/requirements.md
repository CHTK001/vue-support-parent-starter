# ScFlourishEmbed 需求文档

## 背景

在 `packages/components-standalone/` 下新增独立组件 `ScFlourishEmbed`，集成 Flourish 数据可视化平台，遵循现有 standalone 组件规范（参考 ScEchartsMap3D、ScWebLLM）。

---

## 功能范围

### F1 — Public Embed 模式（核心）

通过 Flourish 官方 embed 脚本嵌入已发布的公开可视化。

- 接受 `visualisationId`（如 `"visualisation/12345"` 或纯数字 `12345`）
- 动态加载 `https://public.flourish.studio/resources/embed.js`（单例，避免重复加载）
- 渲染 `<div class="flourish-embed" data-src="visualisation/xxxxx">` 容器
- 支持 `width` / `height` 尺寸控制
- 支持 `ariaLabel` 无障碍标签

### F2 — Live API 模式（可选，按需启用）

通过 `Flourish.Live` 动态创建可视化，支持程序化数据注入。

- 接受 `apiKey`、`template`（如 `"@flourish/scatter"`）、`version`
- 接受 `data`、`bindings`、`state` 配置对象
- 暴露 `update(opts)` 方法供父组件调用
- 动态加载 `https://public.flourish.studio/resources/api.js`（单例）

### F3 — 生命周期管理

- 组件卸载时清理 Flourish 实例，避免内存泄漏
- 支持 `visualisationId` / `template` 变化时重新渲染

### F4 — 加载状态与错误处理

- 脚本加载中显示 loading 占位（骨架屏风格）
- 脚本加载失败显示错误提示
- 暴露 `@loaded` / `@error` 事件

### F5 — 响应式尺寸

- 默认宽度 100%，高度自适应（Flourish 默认行为）
- 支持固定高度 prop

---

## 验收标准

1. `packages/components-standalone/ScFlourishEmbed/` 目录存在，包含 `package.json`、`index.ts`、`index.vue`
2. `package.json` 命名为 `@repo/components/ScFlourishEmbed`，无外部 npm 依赖（Flourish 通过 CDN 加载）
3. Public embed 模式：传入 `visualisationId` 后正确渲染 Flourish 可视化
4. Live API 模式：传入 `apiKey + template + data` 后正确渲染
5. 组件卸载后无内存泄漏（Flourish 实例已销毁）
6. TypeScript 类型完整，无 `any` 滥用
7. 视觉质量：loading 骨架屏、错误状态均有精致样式，不出现空白区域
