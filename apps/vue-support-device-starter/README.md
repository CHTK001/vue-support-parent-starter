# vue-support-device-starter

设备接入平台前端。业务代码在 [`pages/device`](../../pages/device)（包名 `@pages/device`），本应用是部署壳（`src/main.ts` 装配入口）。

对应后端：`spring-support-device-starter`（设备接入按「接口目录 + 能力矩阵」维护，接口登记在 `*Apis.java`，支持度写在 `DeviceCapabilityMatrix`）。

## 功能

- 设备列表 / 详情 / 分组管理
- 实时视频（flv.js / hls.js）
- 地理位置与围栏（Leaflet）
- 3D 可视化（three.js）
- 设备能力矩阵展示（平台能力位与 `DeviceSession` 实现对齐，未验证不标支持）

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Leaflet、flv.js、hls.js、three.js。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/device": "workspace:*",     // 设备业务页
  "@repo/app": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*",
  "flv.js": "catalog:",               // FLV 直播流
  "hls.js": "catalog:",               // HLS 流
  "leaflet": "catalog:",              // 地图
  "three": "catalog:"                 // 3D
}
```

## 开发启动

```bash
cd apps/vue-support-device-starter
pnpm dev
pnpm build
```

## 目录结构

```
src/
└── main.ts    # createContextApp 装配入口（页面全部在 @pages/device）
```
