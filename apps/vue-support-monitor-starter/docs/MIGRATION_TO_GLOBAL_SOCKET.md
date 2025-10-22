# 迁移到全局Socket服务文档

## ✅ 已完成迁移

### 背景
原先的 `src/utils/socket.ts` 提供了本地的Socket.IO封装，现已改用 `@repo/core` 的全局Socket服务 (`useGlobalSocket`)。

### 删除的文件
- ✅ `src/utils/socket.ts` - 已删除

### 修改的文件清单

#### 1. 主页面文件 (3个)
- ✅ `src/views/docker/soft/index.vue` - 软件库主页
- ✅ `src/views/docker/registry/index.vue` - 仓库管理
- ✅ `src/views/docker/images/index.vue` - 镜像管理
- ✅ `src/views/docker/containers/index.vue` - 容器管理

**修改内容**：
- 移除 `import { connectSocket, enableAutoConnect, addEventListener } from '@/utils/socket'`
- 改用 `import { useGlobalSocket } from '@repo/core'`
- 删除 `enableAutoConnect()` 和 `connectSocket()` 调用
- 使用 `globalSocket.on()` 和 `globalSocket.off()` 替代 `addEventListener()`

#### 2. 对话框组件 (4个)
- ✅ `src/views/docker/registry/components/SyncSoftwareDialog.vue`
- ✅ `src/views/docker/images/components/PullImageDialog.vue`
- ✅ `src/views/docker/images/components/InstallSoftwareDialog.vue`
- ✅ `src/views/docker/containers/components/StartContainerDialog.vue`

**修改内容**：
- 移除 `import { startOperation, subscribeOperation } from '@/utils/socket'`
- 删除 `startOperation()` 和 `subscribeOperation()` 调用
- ProgressMonitor会自动监听所有操作进度

#### 3. 核心组件 (1个)
- ✅ `src/components/ProgressMonitor.vue`

**修改内容**：
- 移除对 `utils/socket.ts` 的依赖
- 改用 `useGlobalSocket()` 获取全局Socket服务
- 在组件内部定义类型和状态
- 使用 `globalSocket.on()` 监听事件

---

## 📊 迁移前后对比

### 迁移前 (utils/socket.ts)
```typescript
// 1. 导入
import { connectSocket, enableAutoConnect, addEventListener } from '@/utils/socket';

// 2. 初始化
onMounted(() => {
  enableAutoConnect();
  connectSocket().catch(() => {});
  
  // 3. 监听事件
  const unsubscribe = addEventListener('operation_complete', (data) => {
    console.log('完成:', data);
  });
  
  eventUnsubscribers.push(unsubscribe);
});

// 4. 清理
onUnmounted(() => {
  eventUnsubscribers.forEach(unsub => unsub());
});
```

### 迁移后 (useGlobalSocket)
```typescript
// 1. 导入
import { useGlobalSocket } from '@repo/core';

// 2. 获取全局Socket
const globalSocket = useGlobalSocket();

// 3. 监听事件
function setupSocketListeners() {
  if (!globalSocket) {
    console.warn('Global Socket服务未初始化');
    return;
  }
  
  globalSocket.on('operation_complete', (data) => {
    console.log('完成:', data);
  });
}

onMounted(() => {
  setupSocketListeners();
});

// 4. 清理
onUnmounted(() => {
  if (!globalSocket) return;
  globalSocket.off('operation_complete');
});
```

---

## 🔧 GlobalSocketService API

### 接口定义
```typescript
export interface GlobalSocketService {
  socket: any;                    // 原始Socket实例
  isConnected: boolean;           // 连接状态
  connect: () => void;            // 连接
  disconnect: () => void;         // 断开连接
  on: (event: string, callback: Function) => void;      // 监听事件
  off: (event: string) => void;   // 移除监听
  emit: (event: string, data?: any) => void;  // 发送事件
  close: () => void;              // 关闭连接
}
```

### 使用方式
```typescript
const globalSocket = useGlobalSocket();

if (globalSocket) {
  // 监听事件
  globalSocket.on('event_name', (data) => {
    // 处理数据
  });
  
  // 发送事件
  globalSocket.emit('event_name', { data: 'value' });
  
  // 移除监听
  globalSocket.off('event_name');
  
  // 检查连接状态
  if (globalSocket.isConnected) {
    // Socket已连接
  }
}
```

---

## 🎯 ProgressMonitor组件

### 自动功能
ProgressMonitor组件现在自动处理以下功能：

1. **自动监听进度事件**
   - `operation_progress` - 操作进度更新
   - `operation_complete` - 操作完成
   - `operation_error` - 操作错误
   - `docker_image_pull_progress` - Docker镜像拉取进度

2. **自动管理状态**
   - `socketState` - Socket连接状态
   - `progressState.activeOperations` - 活跃操作Map
   - `progressState.notifications` - 通知列表

3. **自动显示UI**
   - 右下角悬浮球
   - 进度抽屉
   - 迷你进度条

### 不再需要的操作
- ❌ `startOperation()` - 不需要手动启动操作追踪
- ❌ `subscribeOperation()` - 不需要手动订阅进度
- ❌ `clearNotifications()` - 现在由ProgressMonitor内部管理

---

## 📝 迁移要点

### 1. 全局Socket在App层面初始化
全局Socket服务应该在App根组件或主Layout中初始化：

```typescript
// App.vue 或 Layout组件
import { provideGlobalSocket } from '@repo/core';

// 提供全局Socket服务
provideGlobalSocket(
  [import.meta.env.VITE_SOCKET_URL || window.location.origin],
  '/socket.io',
  {},
  {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000
  }
);
```

### 2. 子组件使用useGlobalSocket
```typescript
import { useGlobalSocket } from '@repo/core';

const globalSocket = useGlobalSocket();

if (!globalSocket) {
  console.warn('Global Socket服务未提供');
  return;
}
```

### 3. 事件监听模式
```typescript
// 设置监听
function setupSocketListeners() {
  if (!globalSocket) return;
  
  globalSocket.on('event_name', handleEvent);
}

// 清理监听
function cleanupSocketListeners() {
  if (!globalSocket) return;
  
  globalSocket.off('event_name');
}

onMounted(() => setupSocketListeners());
onUnmounted(() => cleanupSocketListeners());
```

---

## ✨ 优势

### 1. 统一管理
- ✅ 所有Socket连接由全局服务统一管理
- ✅ 避免重复连接
- ✅ 减少资源消耗

### 2. 简化代码
- ✅ 不需要在每个组件中初始化Socket
- ✅ 不需要手动管理连接状态
- ✅ ProgressMonitor自动处理进度追踪

### 3. 更好的架构
- ✅ 使用依赖注入模式 (provide/inject)
- ✅ 更符合Vue 3最佳实践
- ✅ 更容易测试和维护

### 4. 类型安全
- ✅ TypeScript类型定义完整
- ✅ 更好的IDE支持
- ✅ 编译时错误检查

---

## 🚨 注意事项

### 1. Socket未初始化检查
始终检查 `globalSocket` 是否存在：

```typescript
const globalSocket = useGlobalSocket();

if (!globalSocket) {
  console.warn('Global Socket服务未初始化');
  return;
}
```

### 2. 事件清理
确保在组件卸载时清理事件监听：

```typescript
onUnmounted(() => {
  if (globalSocket) {
    globalSocket.off('event_name');
  }
});
```

### 3. ProgressMonitor依赖
如果需要显示操作进度，确保：
- 页面中包含 `<ProgressMonitor />` 组件
- 后端推送的事件名称与前端监听的一致

---

## 📦 相关文件

### 全局Socket服务
- `@repo/core/src/config/socket.ts` - Socket服务实现

### 应用层
- `src/components/ProgressMonitor.vue` - 进度监控组件
- `src/views/docker/soft/index.vue` - 软件库（示例）

### 文档
- `docs/DOCKER_INSTALL_SOCKET.md` - Docker安装Socket文档
- `docs/DOCKER_SYNC_INSTALL.md` - Docker同步安装文档
- `docs/MIGRATION_TO_GLOBAL_SOCKET.md` - 本文档

---

## ✅ 迁移检查清单

- [x] 删除 `src/utils/socket.ts`
- [x] 修改所有引用 `utils/socket` 的文件
- [x] 更新 ProgressMonitor 组件
- [x] 更新主页面文件 (soft, registry, images, containers)
- [x] 更新对话框组件 (sync, pull, install, start)
- [x] 验证无linter错误
- [x] 创建迁移文档

---

## 🎉 迁移完成

所有文件已成功迁移到全局Socket服务！现在系统使用统一的Socket管理，代码更简洁，架构更清晰。

