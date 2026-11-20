# vue-support-collect-scheduler-starter

采集调度平台前端。组装 `@pages/collect`（采集任务）、`@pages/datasource`（数据源管理）、`@pages/job`（作业调度）、`@pages/osgi`（OSGi 服务）四个业务模块成完整站点。

## 技术栈

Vue 3 + TypeScript + Vite（共享 `turbo/vite/createVite.ts`）、Element Plus、Pinia、Vue Router，应用骨架走 `@repo/app` 的 `createContextApp`。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/collect": "workspace:*",      // 采集任务
  "@pages/datasource": "workspace:*",   // 数据源管理
  "@pages/job": "workspace:*",          // 作业调度
  "@pages/osgi": "workspace:*",         // OSGi 服务
  "@repo/app": "workspace:*",           // createContextApp 装配器
  "@repo/theme": "workspace:*",         // koi 主题
  "@repo/core": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*"
}
```

## 开发启动

```bash
cd apps/vue-support-collect-scheduler-starter
pnpm dev
pnpm build
```

## 目录结构

```
src/
├── main.ts      # createContextApp 装配入口
├── routes.ts    # 应用级路由（聚合各 @pages 模块路由）
└── views/       # 应用级视图（布局容器等）
```

## home widget

采集侧贡献的首页仪表板卡片（任务概览等）经 `defineWidgetContribution(collectWidgets)` 接线，见 `@pages/collect/src/widgets/collectWidgets.ts`。
