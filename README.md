# vue-support-parent-starter

Vue 3 + TypeScript + Vite 前端 monorepo（pnpm workspace + Turbo）。后端生态见 [`../spring-support-parent-starter`](../spring-support-parent-starter)。

## 仓库结构

```
vue-support-parent-starter/
├── apps/       # 可部署应用（宿主壳：组装 @pages/* 模块成完整站点）
├── pages/      # 业务页面模块（按领域切分，可被多个 app 复用，包名 @pages/*）
├── packages/   # 共享包（@repo/app、@repo/theme、@repo/ui、@repo/core、@repo/config …）
├── turbo/      # 构建编排（vite 共享配置 createVite、应用骨架 @repo/app、lint/tsconfig）
├── config/     # 共享工程配置
├── patches/    # pnpm patch
├── public/     # 跨应用共享静态资产（assets/models、loader.js 等）
├── docs/       # 设计与说明文档
├── test/       # 验收探针与 E2E 脚本（按 领域/需求 分目录）
└── scripts/    # 工程脚本
```

### packages 一览

| 包 | 职责 |
|---|---|
| `@repo/app` | 应用骨架：`createContextApp` 装配器（web / wechat-miniapp 双平台）、contributions 接线 |
| `@repo/theme` | koi 主题布局：登录、主布局、主题配置抽屉、home 仪表板、**注册表扩展点** |
| `@repo/ui` | 共享组件库（ReTable / ReSelect / ReDialog / ReChart …） |
| `@repo/core` | 核心逻辑：路由、守卫、http 管线、菜单解析、权限指令 |
| `@repo/config` | 应用配置（app.yaml 加载、类型、localStorage 持久化） |
| `@repo/pinia` | 共享状态（auth、user、router 等 store） |
| `@repo/languages` | i18n 语言包（zh / en 模块化合并） |
| `@repo/utils` | 纯工具（无框架依赖，最底层） |
| `@repo/assets` / `@repo/images` | 静态资产 |
| `@repo/monitor-cards` | 监控卡片贡献契约 |
| `@repo/auth-core` | 认证核心 |
| `@repo/env` | 环境变量与构建标记 |

## 快速开始

```bash
pnpm install

# 启动某个应用（在 apps/<name> 下）
cd apps/vue-support-monitor-starter
pnpm dev        # 开发服务器（端口见各自 vite.config.ts）
pnpm build      # 生产构建
pnpm preview    # 本地预览构建产物
```

## 应用装配模型

所有 PC 应用的入口都是同一行：

```ts
import { createContextApp } from "@repo/app";

createContextApp({ appName: "vue-support-xxx-starter" })
  .widgets([/* home widget 贡献，见下文 */])
  .mount("#app");
```

`createContextApp` 完成：框架装配（vue-router / pinia / i18n / http）→ 主题挂载（koi 布局）→ 路由注册（`registerMenuResolver` 菜单解析 + 各模块路由）→ contributions 依序执行。业务页面不直接写在 app 里，而是放在 `pages/<领域>`，通过包别名 `@pages/<领域>` 引入；app 只负责「把哪些模块装进哪个壳」。

## 注册自定义主题配置分区

主题配置抽屉（koi 布局右侧设置面板）的分区是**注册表驱动**的：主题包只提供注册机制与渲染位置，业务模块在宿主启动时把自定义分区注入。

**1. 在业务模块里写一个分区组件**（建议直接复用 `config-section` 视觉）：

```vue
<!-- pages/foo/src/SettingsSection.vue -->
<script setup lang="ts">
import { getConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";

const appConfig = getConfig();
</script>

<template>
  <div class="config-section">
    <div class="section-header"><span class="section-title">Foo 设置</span></div>
    <div class="section-card">
      <ReSwitch layout="card" title="启用 Foo" v-model="appConfig.other.foo.enable" />
    </div>
  </div>
</template>
```

**2. 在模块入口（副作用模块）里注册**：

```ts
// pages/foo/src/contribution.ts —— import 即完成注册
import { registerThemeConfigSection } from "@repo/theme/koi/layouts/components/ThemeConfig/registry";
import { getConfig } from "@repo/config";

registerThemeConfigSection({
  id: "foo-settings",            // 全局唯一，建议 <模块>-<功能>
  tab: "advanced",               // appearance | interface | extension | advanced
  order: 20,                     // 排序权重（小在前，缺省 100）
  visible: () => getConfig().other.foo?.enable !== false,  // yaml 决定「允不允许」
  component: () => import("./SettingsSection.vue"),        // 懒加载
});
```

**3. 在 app 的入口 import 该副作用模块**（main.ts / embed.ts / menu.ts 均可）：

```ts
import "@pages/foo/src/contribution";
```

约定：

- **yaml 开 + 模块在场 = 分区出现**。yaml 开关（`other.xxx.enable`）决定允不允许；模块不在场时没人调用注册，分区天然不存在。
- `visible` 在每次渲染分区列表时求值，可读任意响应式配置。
- `component` 支持同步组件 / `{ default }` / 动态 `import()`（Promise 会被包装为异步组件并缓存）。
- 同 id 重复注册以后注册者为准（HMR 安全），返回的注销函数可用于卸载。

## 注册 home widget

首页仪表板的卡片同样是注册表驱动（`packages/theme/src/themes/koi/views/home/registry.ts`，全仓唯一事实来源）。模块贡献一批 widget，宿主 app 用 `.widgets()` 接线：

**1. 在业务模块里定义 widget 清单**：

```ts
// pages/foo/src/widgets/fooWidgets.ts
import { DataAnalysis } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

export const fooWidgets: WidgetRegistration[] = [
  {
    type: "foo-task-stats",            // 全局唯一，加模块前缀
    title: "Foo 任务概览",
    description: "运行中 / 失败 / 已完成的任务数",
    icon: "DataAnalysis",
    iconComponent: DataAnalysis,       // 直给组件；只给字符串会静默退化成默认图标
    defaultSize: { w: 4, h: 3 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "foo",                     // 必填：随布局持久化；模块未启用时渲染占位卡
    component: () => import("./FooTaskStatsWidget.vue"),
  },
];
```

**2. 宿主 app 接线**：

```ts
import { createContextApp } from "@repo/app";
import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
import { fooWidgets } from "@pages/foo/src/widgets/fooWidgets";

createContextApp({ appName: "..." })
  .widgets([defineWidgetContribution(fooWidgets)])
  .mount("#app");
```

约定：`type` 全局唯一加模块前缀；`source` 必填（未启用该模块的 app 读到存档时渲染「由 foo 模块提供」占位卡，而不是丢弃位置）；组件懒加载；同 type 重复注册以最后一次为准。

## 注册悬浮组件（koi 主布局）

常驻布局的可插拔悬浮能力（如 AI 悬浮球）走 `packages/theme/src/themes/koi/layouts/floatingWidgets.ts`：

```ts
import { registerFloatingWidget } from "@repo/theme/koi/layouts/floatingWidgets";
import { getConfig } from "@repo/config";

registerFloatingWidget({
  id: "ai-character",
  order: 10,
  visible: () => getConfig().other.aiChat?.enable !== false,
  component: () => import("@repo/web-llm/ReAiCharacter.vue"),  // 懒加载
});
```

与主题配置分区同一套约定：yaml 决定允不允许、模块在场才注册、懒加载并缓存、可注销。

## AI 对话模块（webllm）架构

AI 对话能力由三部分组成，依赖方向严格单向：

```
pages/ai ──▶ @repo/theme（注册表 API，只读消费）
pages/ai ──▶ @repo/web-llm（webllm 供应商 / 悬浮球 / 注入点）
@repo/web-llm ✗→ pages/ai（不反向依赖业务包，靠注入点解耦）
```

- **`@repo/web-llm`**（`packages/ui/web-llm`）：前端写死的本地推理提供商。导出 webllm 供应商模板、内置 MLC 模型清单、`useWebLLM` 引擎（Web Worker）、悬浮球组件 `ReAiCharacter`，以及两个注入点 `setChatModelResolver` / `setRemoteChatHandler`。
- **`pages/ai`**：`src/koi/contribution.ts` 是装配入口——注入 Worker 地址、模型解析器（读 localStorage 选中模型）与远端发送实现（POST 后端 `/v2/v1/chat/completions`），并注册「AI 对话」配置分区与悬浮球。
- **模型与凭据的唯一真相源是模型管理**（`/api/providers`）。当前选中的对话模型持久化在 localStorage（`ai-chat-selected-model`）；会话分发按模型 `platform`：`webllm` 走浏览器本地推理，其余走后端 ChatClient。

旧配置字段（`aiChatMode` / `aiChatApiKey` / `aiChatMaxTokens` 等）已在 `@repo/config` 标记 `@deprecated`，仅为兼容已发布的 app.yaml 保留；`app.example.yaml` 中已注明。

## 应用清单

| 应用 | 定位 | 主要组装模块 |
|---|---|---|
| `vue-support-ai-starter` | AI 控制台独立应用壳 | `@pages/ai`（+ cdp / channel / filesystem） |
| `vue-support-ai-miniapp-starter` | AI 控制台微信小程序端（uni-app） | 复用 `@pages/ai` 服务层 |
| `vue-support-system-starter` | 系统管理平台 | system / tenant / task / job / ai / actuator / apm … |
| `vue-support-monitor-starter` | 监控运维平台（最大宿主） | monitor / apm / actuator / cdp / channel / datasource / device / docker / tunnel / room … |
| `vue-support-collect-scheduler-starter` | 采集调度平台 | collect / datasource / job / osgi |
| `vue-support-device-starter` | 设备接入平台 | device（视频 flv/hls、地图 leaflet、3D） |
| `vue-support-eduai-starter` | 教育 AI 平台 | eduai / collect（tiptap 富文本） |
| `vue-support-filestorage-starter` | 文件存储平台 | filesystem |
| `vue-support-hotspot-starter` | 热点分析平台 | hotsport（关系图 relation-graph、echarts） |
| `vue-support-video-starter` | 视频平台 | 自含 views（hls.js） |
| `vue-support-geo-starter` | 地理空间数据下载工具 | 自含 views（Leaflet） |
| `vue-support-software-starter` | 预留占位（暂无源码） | — |

各应用详情见 `apps/<name>/README.md`。

## 约定与红线

- **模块边界**：渠道管理属于后端 `spring-support-account-starter`；前端只调 account 的渠道 API，不依赖 ai 侧实现细节。
- **小程序**：唯一入口 `createContextApp`，`platform: "wechat-miniapp"`；流式只能经 `ctx.sse`；UI 用 `wot-design-uni`（easycom），不与 `@repo/ui` 互搬。
- **提交**：只提交自己的文件，`git commit` 必须带显式 pathspec。
- **验收**：改动页面的关键控件必须真点验证；写入类操作验证后必须还原数据。
