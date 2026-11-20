# vue-support-system-starter

系统管理平台前端。组装 `@pages/system`（系统管理）、`@pages/tenant`（租户）、`@pages/task`（任务）、`@pages/job`（作业）、`@pages/ai`（AI 提供商管理嵌入）、`@pages/actuator`、`@pages/apm`、`@pages/cdp`、`@pages/filesystem`、`@pages/hotsport` 等模块。

## 功能

- 用户 / 角色 / 菜单 / 部门 / 字典 / 参数等系统管理
- 租户管理、任务中心、作业调度
- AI 提供商管理（`@pages/ai/menu.ts` 菜单嵌入，不拖 AI 整壳与全局样式）
- 操作日志、登录日志
- 滑块验证（vue3-slide-verify）、Excel 导入导出（xlsx）

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Vue Router、vue-i18n、js-yaml、sortablejs。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/system": "workspace:*",
  "@pages/tenant": "workspace:*",
  "@pages/task": "workspace:*",
  "@pages/job": "workspace:*",
  "@pages/ai": "workspace:*",
  "@pages/actuator": "workspace:*",
  "@pages/apm": "workspace:*",
  "@pages/cdp": "workspace:*",
  "@pages/filesystem": "workspace:*",
  "@pages/hotsport": "workspace:*",
  "@repo/app": "workspace:*",
  "@repo/theme": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*"
}
```

## 开发启动

```bash
cd apps/vue-support-system-starter
pnpm dev
pnpm build
pnpm lint
```

## 目录结构

```
src/
├── env.d.ts    # 环境类型
└── main.ts     # createContextApp 装配入口（页面在各 @pages 模块）
```
