# Video 项目文档

## 项目概述

Video 项目是一个基于 Vue 3 + TypeScript 的视频管理系统，提供视频搜索、管理、配置等功能。

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Socket.IO
- Vite

## 项目结构

```
src/
├── api/                 # API 接口定义
├── components/          # 公共组件
├── views/              # 页面组件
│   ├── config/         # 配置管理页面
│   ├── search/         # 搜索页面
│   └── manage/         # 视频管理页面
├── router/             # 路由配置
└── types/              # 类型定义
```

## Socket 连接使用规范

### 使用封装的 Socket 服务

项目使用统一封装的 Socket 服务，位于 `@repo/core/config/socket`。请使用封装的服务而不是直接使用 `socket.io-client`。

#### 正确使用方式：

```typescript
import { socket } from '@repo/core/config/socket';

// 初始化连接
const socketInstance = socket({
  url: 'ws://localhost:3000',
  options: {
    transports: ['websocket']
  }
});

// 连接
socketInstance.connect();

// 监听事件
socketInstance.on('message', (data) => {
  console.log('收到消息:', data);
});

// 发送消息
socketInstance.emit('sendMessage', { content: 'Hello' });

// 断开连接
socketInstance.disconnect();
```

#### 错误使用方式（已废弃）：

```typescript
// ❌ 不要直接使用 socket.io-client
import { io } from 'socket.io-client';
const socket = io('ws://localhost:3000');
```

## API 调用规范

### 使用异步回调方式

项目中所有 API 接口调用都应使用异步回调（`.then/.catch`）方式，而不是 `async/await`。

#### 正确使用方式：

```typescript
// ✅ 使用 .then/.catch
const loadData = () => {
  loading.value = true;
  
  searchVideos(request)
    .then((response) => {
      if (response.code === 1000) {
        videoList.value = response.data.records;
        totalCount.value = response.data.total;
      }
    })
    .catch((error) => {
      console.error('加载失败:', error);
      ElMessage.error('加载失败');
    })
    .finally(() => {
      loading.value = false;
    });
};
```

#### 错误使用方式（已废弃）：

```typescript
// ❌ 不要使用 async/await
const loadData = async () => {
  try {
    loading.value = true;
    const response = await searchVideos(request);
    if (response.code === 1000) {
      videoList.value = response.data.records;
    }
  } catch (error) {
    console.error('加载失败:', error);
  } finally {
    loading.value = false;
  }
};
```

### API 响应处理

- 成功响应：`.then()` 回调中默认为成功状态，可直接处理数据
- 失败响应：`.catch()` 回调中处理错误情况
- 无需额外的 `code` 判断，回调本身已区分成功/失败

## 开发指南

### 启动项目

```bash
npm install
npm run dev
```

### 构建项目

```bash
npm run build
```

### 代码规范

1. 使用 TypeScript 进行类型检查
2. 遵循 Vue 3 Composition API 规范
3. 使用 Element Plus 组件库
4. API 调用统一使用异步回调方式
5. Socket 连接使用封装的服务

## 功能特性

### 配置管理

- ✨ 视频同步配置的增删改查
- ✨ 配置状态管理（启用/禁用）
- ✨ 同步任务执行和监控
- ✨ **手动停止同步功能**：支持在同步过程中手动停止正在执行的同步任务
- ✨ 连接测试功能
- ✨ 实时状态更新（通过 Socket 连接）

#### 停止同步功能

当配置处于同步中状态时，会显示红色的"停止"按钮，点击后可以手动停止正在执行的同步任务：

- **触发条件**：配置状态为同步中（`videoSyncConfigStatus === 2`）
- **操作方式**：点击配置卡片上的红色"停止"按钮
- **确认机制**：弹出确认对话框，防止误操作
- **API 接口**：`stopSyncTask(configId)` - 停止指定配置的同步任务
- **状态更新**：停止成功后，配置状态自动恢复为启用状态

```typescript
// 停止同步示例
const handleStop = (config: VideoSyncConfig) => {
  ElMessageBox.confirm(`确定要停止配置 "${config.videoSyncConfigName}" 的同步任务吗？`, "确认停止", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      stopSyncTask(config.videoSyncConfigId!)
        .then(() => {
          ElMessage.success("同步任务已停止");
          config.videoSyncConfigStatus = 1; // 恢复为启用状态
        })
        .catch((error) => {
          ElMessage.error("停止同步任务失败");
        });
    });
};
```

## 更新日志

### v1.2.0 (2024-12-19)

- ✨ 新增手动停止同步功能
- ✨ 在配置卡片中添加停止按钮（仅在同步中状态显示）
- 🔧 完善 API 接口，新增 `stopSyncTask` 方法
- 📝 更新文档，添加停止功能使用说明

### v1.1.0 (2024-12-19)

- 🔧 重构 Socket 连接，使用统一封装的服务
- 🔧 重构 API 调用方式，统一使用异步回调
- 📝 完善项目文档和使用规范
- ✨ 优化错误处理和用户体验

### v1.0.0

- 🎉 初始版本发布
- ✨ 实现视频搜索功能
- ✨ 实现视频管理功能
- ✨ 实现配置管理功能