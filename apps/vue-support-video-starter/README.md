# vue-support-video-starter

视频平台前端。页面自含（`src/views`），未拆分为 `@pages/*` 模块。

## 功能

- 视频播放（hls.js，HLS 流）
- 视频列表 / 分类 / 检索
- 播放器组件（`src/components`）

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Vue Router、hls.js。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@repo/app": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*",
  "hls.js": "catalog:"
}
```

## 开发启动

```bash
cd apps/vue-support-video-starter
pnpm dev
pnpm build
```

## 目录结构

```
src/
├── api/          # 后端接口封装
├── components/   # 播放器等组件
├── styles/       # 全局样式
├── types/        # 类型
├── utils/        # 工具
├── views/        # 页面
├── router.ts     # 路由
└── main.ts       # createContextApp 装配入口
```
