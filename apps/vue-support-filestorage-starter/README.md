# vue-support-filestorage-starter

文件存储平台前端。业务代码在 [`pages/filesystem`](../../pages/filesystem)（包名 `@pages/filesystem`），本应用是部署壳（`src/main.ts` 装配入口，`src/preview.ts` 预览装配）。

## 功能

- 文件 / 目录管理（浏览、上传、下载、复制、移动、删除）
- 文件预览（图片 / 文本 / Office 类）
- 存储空间管理

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Axios，应用骨架走 `@repo/app` 的 `createContextApp`。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/filesystem": "workspace:*",   // 文件存储业务页
  "@repo/app": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/utils": "workspace:*"
}
```

## 开发启动

```bash
cd apps/vue-support-filestorage-starter
pnpm dev
pnpm build
```

## 目录结构

```
src/
├── main.ts      # createContextApp 装配入口
└── preview.ts   # vite preview 装配
```
