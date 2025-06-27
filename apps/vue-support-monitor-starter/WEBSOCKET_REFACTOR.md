# WebSocket 重构说明

## 修改概述

本次重构主要完成了以下工作：

1. **删除了 `useServerMetricsSocket` composable**
2. **修改了 `useServerWebSocket` 移除自动连接逻辑**
3. **更新了所有使用 WebSocket 的组件，改为手动控制连接**

## 详细修改内容

### 1. 删除文件
- `apps/vue-support-monitor-starter/src/composables/useServerMetricsSocket.ts`

### 2. 修改 `useServerWebSocket.ts`
- 移除了 `onMounted` 和 `onUnmounted` 的导入
- 删除了自动连接和断开的生命周期钩子
- 保留了 `connect()` 和 `disconnect()` 方法供手动调用

### 3. 更新引用文件

#### `apps/vue-support-monitor-starter/src/utils/serverMetricsValidator.ts`
- 将 `ServerMetricsData` 类型的导入从 `useServerMetricsSocket` 改为 `@/stores/serverMetrics`

#### `apps/vue-support-monitor-starter/src/views/server/index.vue`
- 添加了 `connect` 和 `disconnect` 方法的解构
- 在 `onMounted` 中手动调用 `connect()`
- 在 `onUnmounted` 中手动调用 `disconnect()`
- 添加了 `onUnmounted` 的导入

#### `apps/vue-support-monitor-starter/src/views/server/modules/server-management/index.vue`
- 添加了 `connect` 和 `disconnect` 方法的解构
- 在 `onMounted` 中手动调用 `connect()`
- 在 `onUnmounted` 中手动调用 `disconnect()`

#### `apps/vue-support-monitor-starter/src/views/server/modules/server-management/components/LocalServerDebug.vue`
- 此组件已经正确实现了手动连接控制，无需修改

## 使用方式变化

### 之前的使用方式
```typescript
// 自动连接，组件导入时就会建立连接
const { state, onMessage } = useServerWebSocket();
```

### 现在的使用方式
```typescript
// 需要手动控制连接
const { state, onMessage, connect, disconnect } = useServerWebSocket();

onMounted(async () => {
  // 手动连接
  await connect();
});

onUnmounted(() => {
  // 手动断开
  disconnect();
});
```

## 优势

1. **避免意外连接**：其他组件导入 `useServerWebSocket` 时不会自动创建连接
2. **更好的控制**：组件可以根据需要决定何时连接和断开
3. **资源管理**：避免不必要的 WebSocket 连接，节省资源
4. **调试友好**：连接状态更加可控，便于调试

## 注意事项

1. 所有使用 `useServerWebSocket` 的组件都需要手动调用 `connect()` 和 `disconnect()`
2. 建议在组件的 `onMounted` 中调用 `connect()`，在 `onUnmounted` 中调用 `disconnect()`
3. 可以通过 `state.value.connected` 检查连接状态
4. 连接失败时会自动重试，但需要确保组件仍然存在

## 测试建议

1. 测试各个页面的 WebSocket 连接是否正常
2. 测试页面切换时连接的建立和断开
3. 测试网络异常时的重连机制
4. 确认不会有多余的连接被创建
