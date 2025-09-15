# Core Package

核心功能包，提供全局状态管理、路由、API接口和Socket服务等基础功能。

## Socket服务

### 原有Socket工厂函数

```typescript
import { socket } from '@repo/core';

// 创建Socket连接
const socketInstance = socket(
  ['ws://localhost:3000'], // 服务器地址数组
  '/socket.io',            // Socket.IO路径
  {},                      // 查询参数
  {                        // 选项
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  }
);

// 监听事件
socketInstance.on('message', (data) => {
  console.log('收到消息:', data);
});

// 发送事件
socketInstance.emit('send-message', { text: 'Hello' });

// 关闭连接
socketInstance.close();
```

### 新增全局Socket服务（Vue Composition API）

#### 1. 在根组件中提供Socket服务

```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { provideGlobalSocket } from '@repo/core';

// 提供全局Socket服务
const globalSocketService = provideGlobalSocket(
  ['ws://localhost:3000'], // 服务器地址数组
  '/socket.io',            // Socket.IO路径（可选）
  {},                      // 查询参数（可选）
  {                        // 选项（可选）
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  }
);

// 可选：立即连接
globalSocketService.connect();
</script>
```

#### 2. 在子组件中使用Socket服务

```vue
<template>
  <div>
    <p>连接状态: {{ socketService.isConnected ? '已连接' : '未连接' }}</p>
    <button @click="connect">连接</button>
    <button @click="disconnect">断开</button>
    <button @click="sendMessage">发送消息</button>
  </div>
</template>

<script setup lang="ts">
import { useGlobalSocket } from '@repo/core';
import { onMounted, onUnmounted } from 'vue';

// 注入全局Socket服务
const socketService = useGlobalSocket();

// 连接Socket
const connect = () => {
  socketService.connect();
};

// 断开连接
const disconnect = () => {
  socketService.disconnect();
};

// 发送消息
const sendMessage = () => {
  socketService.emit('send-message', { text: 'Hello from component' });
};

// 组件挂载时监听事件
onMounted(() => {
  socketService.on('message', (data) => {
    console.log('收到消息:', data);
  });
  
  socketService.on('notification', (data) => {
    console.log('收到通知:', data);
  });
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  socketService.off('message');
  socketService.off('notification');
});
</script>
```

### API参考

#### GlobalSocketService接口

```typescript
interface GlobalSocketService {
  socket: any;                                    // Socket实例
  isConnected: boolean;                          // 连接状态
  connect: () => void;                           // 连接Socket
  disconnect: () => void;                        // 断开连接
  on: (event: string, callback: Function) => void;    // 监听事件
  off: (event: string) => void;                  // 移除事件监听
  emit: (event: string, data?: any) => void;     // 发送事件
  close: () => void;                             // 关闭连接
}
```

#### 函数说明

- `createGlobalSocketService(urls, context?, query?, options?)` - 创建全局Socket服务
- `provideGlobalSocket(urls, context?, query?, options?)` - 提供全局Socket服务
- `useGlobalSocket()` - 注入全局Socket服务
- `GlobalSocketKey` - 全局Socket注入键

### 特性

1. **兼容性** - 保持原有socket工厂函数不变，确保向后兼容
2. **依赖注入** - 使用Vue的provide/inject机制，便于组件间共享
3. **响应式状态** - 连接状态使用Vue的响应式系统
4. **自动重连** - 支持自动重连和错误处理
5. **事件管理** - 提供完整的事件监听和移除功能
6. **通知支持** - 内置浏览器通知功能

### 注意事项

1. 确保在使用`useGlobalSocket()`之前调用了`provideGlobalSocket()`
2. 在组件卸载时记得移除事件监听，避免内存泄漏
3. Socket连接会自动处理认证token和重连逻辑
4. 支持多个服务器地址，会随机选择一个进行连接

## 更新日志

### v1.0.0 (2024-12-19)
- 新增全局Socket服务，支持Vue Composition API
- 添加provide/inject模式的Socket管理
- 保持原有socket工厂函数的完全兼容性
- 新增响应式连接状态管理
- 完善事件监听和清理机制