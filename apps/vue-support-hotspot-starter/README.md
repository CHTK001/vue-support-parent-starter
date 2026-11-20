# vue-support-hotspot-starter

热点分析平台前端。业务代码在 [`pages/hotsport`](../../pages/hotsport)（包名 `@pages/hotsport`）。

## 功能

- 热点数据采集与分析
- 关系图谱（@relation-graph/vue3）
- 图表看板（echarts）
- 多语言（vue-i18n，`src/i18n.ts`）

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Vue Router、vue-i18n、echarts、@relation-graph/vue3。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/hotsport": "workspace:*",     // 热点业务页
  "@repo/app": "workspace:*",
  "@repo/assets": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/theme": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*",
  "@relation-graph/vue3": "catalog:",   // 关系图
  "echarts": "catalog:",
  "vue-i18n": "catalog:"
}
```

## 开发启动

```bash
cd apps/vue-support-hotspot-starter
pnpm dev
pnpm build
pnpm lint
```

## 目录结构

```
src/
├── api/           # 后端接口封装
├── components/    # 应用级组件
├── composables/   # 组合式函数
├── services/      # 服务层
├── stores/        # Pinia
├── i18n.ts        # 多语言装配
├── router.ts      # 路由
└── main.ts        # createContextApp 装配入口
```
