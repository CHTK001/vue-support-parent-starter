# @repo/pages-sync

数据同步管理模块 - 可复用的页面、API 和 Store

## 功能特性

- ✅ 完整的数据同步任务管理
- ✅ 可视化任务设计器（基于 ScReteEditor）
- ✅ 实时监控与日志查看
- ✅ SPI 插件系统支持
- ✅ WebSocket 实时推送
- ✅ 模块化设计，可被其他应用集成

## 模块结构

```
packages/pages/sync/
├── api/              # API 接口层
│   └── sync.ts       # 数据同步相关 API
├── components/       # 共享组件
│   ├── TaskCard.vue
│   └── TaskForm.vue
├── pages/            # 页面组件
│   ├── TaskList.vue      # 任务列表
│   ├── TaskDesign.vue    # 任务设计器
│   ├── TaskLog.vue       # 任务日志
│   └── TaskMonitor.vue   # 监控仪表板
├── stores/           # Pinia Store
│   └── task.ts       # 任务状态管理
├── index.ts          # 主入口
├── routes.ts         # 路由配置
└── package.json      # 包配置
```

## 使用方式

### 1. 在应用中导入路由

```typescript
// 在你的应用路由配置中
import { syncRoutes } from '@repo/pages-sync';

const router = createRouter({
  routes: [
    ...syncRoutes,
    // 其他路由
  ]
});
```

### 2. 使用 API 和 Store

```typescript
// 导入 API
import {
  listSyncTasks,
  createSyncTask,
  getSyncTaskDesign
} from '@repo/pages-sync/api';

// 导入 Store
import { useSyncTaskStore } from '@repo/pages-sync/stores';

// 在组件中使用
const taskStore = useSyncTaskStore();
await taskStore.fetchTasks();
```

### 3. 直接使用页面组件

```vue
<template>
  <TaskList />
</template>

<script setup>
import { TaskList } from '@repo/pages-sync';
</script>
```

## 集成示例

### vue-support-sync-starter

独立的数据同步应用，完全基于 `@repo/pages-sync` 构建：

```typescript
// src/router/index.ts
import { syncRoutes } from "@repo/pages-sync";

const routes = [
  { path: "/", redirect: "/sync/tasks" },
  { path: "/login", component: () => import("./pages/Login.vue") },
  ...syncRoutes,
];
```

### vue-support-monitor-starter

监控平台集成数据同步功能：

```typescript
// 在 monitor 的路由中集成
import { syncRoutes } from "@repo/pages-sync";

// 可以添加前缀或自定义路由
const monitorRoutes = [
  {
    path: "/monitor",
    children: [
      ...syncRoutes.map(route => ({
        ...route,
        path: `sync/${route.path}`
      })),
      // 其他监控路由
    ]
  }
];
```

## 路由配置

模块导出的路由结构：

```typescript
[
  {
    path: "/sync",
    name: "Sync",
    redirect: "/sync/tasks",
    children: [
      {
        path: "tasks",
        name: "SyncTaskList",
        component: TaskList,
        meta: { title: "任务列表" }
      },
      {
        path: "design/:taskId?",
        name: "SyncTaskDesign",
        component: TaskDesign,
        meta: { title: "任务设计" }
      },
      {
        path: "monitor",
        name: "SyncTaskMonitor",
        component: TaskMonitor,
        meta: { title: "监控仪表板" }
      },
      {
        path: "logs/:taskId?",
        name: "SyncTaskLog",
        component: TaskLog,
        meta: { title: "任务日志" }
      }
    ]
  }
]
```

## API 接口

### 任务管理

- `listSyncTasks(query)` - 获取任务列表
- `createSyncTask(task)` - 创建任务
- `updateSyncTask(task)` - 更新任务
- `deleteSyncTask(taskId)` - 删除任务
- `startSyncTask(taskId)` - 启动任务
- `stopSyncTask(taskId)` - 停止任务
- `executeSyncTaskOnce(taskId)` - 执行一次

### 任务设计

- `getSyncTaskDesign(taskId)` - 获取任务设计
- `saveSyncTaskDesign(taskId, design)` - 保存任务设计
- `validateSyncTaskDesign(design)` - 验证任务设计

### SPI 管理

- `getAllSpiTypes()` - 获取所有 SPI 类型
- `getSpiParameters(type, name)` - 获取 SPI 参数
- `validateSpiConfig(type, name, config)` - 验证 SPI 配置
- `testSpiConnection(type, name, config)` - 测试连接

### 日志和监控

- `getSyncTaskLogs(taskId, page, size)` - 获取任务日志
- `getSyncLogDetail(logId)` - 获取日志详情
- `getStatistics(params)` - 获取统计数据
- `getTaskStatistics(taskId, params)` - 获取任务统计

## 依赖

- `@repo/scReteEditor` - 可视化节点编辑器
- `@element-plus/icons-vue` - Element Plus 图标
- `axios` - HTTP 客户端
- `element-plus` - UI 组件库
- `pinia` - 状态管理
- `vue` - Vue 3
- `vue-router` - 路由管理

## 后端接口

模块需要后端提供以下接口（默认基础路径：`/api/v1/sync`）：

- `GET /task/list` - 任务列表
- `POST /task/create` - 创建任务
- `PUT /task/update` - 更新任务
- `DELETE /task/delete/:id` - 删除任务
- `POST /task/start/:id` - 启动任务
- `POST /task/stop/:id` - 停止任务
- `POST /task/execute/:id` - 执行任务
- `GET /task/design/:id` - 获取设计
- `POST /task/design/:id` - 保存设计
- `GET /task/logs/:id` - 获取日志
- `GET /spi/all` - 获取所有 SPI
- `GET /spi/parameters` - 获取参数
- `POST /spi/validate` - 验证配置
- `POST /spi/test` - 测试连接
- `WS /ws/sync/progress` - WebSocket 进度推送

## 开发指南

### 添加新功能

1. 在 `pages/` 下添加新页面
2. 在 `api/` 下添加对应的 API 接口
3. 在 `routes.ts` 中注册路由
4. 在 `index.ts` 中导出

### 自定义样式

模块使用 Element Plus 主题，可以通过 CSS 变量自定义：

```css
:root {
  --el-color-primary: #667eea;
  --el-color-success: #52c41a;
  --el-color-warning: #faad14;
  --el-color-danger: #f5222d;
}
```

## 版本历史

### v1.0.0 (2026-03-20)

- ✅ 初始版本发布
- ✅ 完整的任务管理功能
- ✅ ScReteEditor 可视化设计器集成
- ✅ 实时监控和日志查看
- ✅ SPI 插件系统支持

## 许可证

ISC
