# 串口监控 Socket 监听优化

## 概述

参考 `TerminalSocketIOListener` 的实现模式，对串口监控页面的 Socket 监听功能进行了全面优化，提升了连接稳定性、错误处理能力和用户体验。

## 🔧 主要改进

### 1. 连接状态管理

#### 新增状态变量
```typescript
const socketConnected = ref(false);      // Socket连接状态
const reconnectAttempts = ref(0);        // 重连尝试次数
const maxReconnectAttempts = 3;          // 最大重连次数
const reconnectDelay = 1000;             // 重连延迟（毫秒）
```

#### 状态显示
- 在状态栏显示 Socket 连接状态
- 显示重连尝试次数
- 实时更新连接状态指示器

### 2. 事件监听器优化

#### 参考 Terminal 模式
```typescript
// 设置多种事件监听器
socketInstance.on(eventName, handleSocketData);
socketInstance.on('connect', handleSocketConnect);
socketInstance.on('disconnect', handleSocketDisconnect);
socketInstance.on('connect_error', handleSocketError);
socketInstance.on('reconnect', handleSocketReconnect);
socketInstance.on('reconnect_error', handleSocketReconnectError);
```

#### 数据处理优化
- 支持多种数据格式（JSON、字符串）
- 兼容不同的消息结构
- 增强错误处理和日志记录

### 3. 重连机制

#### 智能重连
- 指数退避算法：`reconnectDelay * Math.pow(2, reconnectAttempts)`
- 最大重连次数限制
- 重连状态实时显示

#### 连接恢复
```typescript
const attemptReconnect = () => {
  if (reconnectAttempts.value >= maxReconnectAttempts) {
    addLog('error', '重连次数已达上限，停止重连');
    return;
  }
  
  reconnectAttempts.value++;
  addLog('system', `尝试重连 Socket (${reconnectAttempts.value}/${maxReconnectAttempts})`);
  
  if (socketInstance) {
    socketInstance.connect();
  }
};
```

### 4. 数据发送优化

#### 参考 Terminal 发送模式
```typescript
const sendPayload = JSON.stringify({
  command: content,
  genId: props.data?.genId || currentSerial.value.monitorSysGenSerialId,
  serialId: currentSerial.value.monitorSysGenSerialId,
  mode: sendMode.value,
  timestamp: new Date().toISOString(),
  config: {
    baudRate: currentSerial.value.monitorSysGenSerialBaudRate,
    dataBits: currentSerial.value.monitorSysGenSerialDataBits,
    stopBits: currentSerial.value.monitorSysGenSerialStopBits,
    parity: currentSerial.value.monitorSysGenSerialParity
  }
});
```

#### 发送前检查
- Socket 连接状态检查
- 串口设备选择检查
- 连接状态验证

### 5. 连接/断开优化

#### 连接流程
1. 检查 Socket 连接状态
2. 调用后端 API 启动串口
3. 设置 Socket 监听器
4. 发送初始化命令（`\r`）
5. 更新状态和日志

#### 断开流程
1. 发送退出命令（`exit\r`）
2. 等待命令执行
3. 调用后端 API 停止串口
4. 移除 Socket 监听器
5. 重置状态

### 6. 错误处理增强

#### 多层错误处理
```typescript
const handleSocketData = (data: any) => {
  try {
    // 字符串数据处理
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        addLog('receive', data);
        return;
      }
    }
    
    // API 响应格式处理
    if (data?.code === '00000') {
      if (data?.msg) {
        message.warning(data.msg);
        return;
      }
      if (data?.data) {
        addLog('receive', data.data, data.raw);
      }
      return;
    }
    
    // 其他格式处理...
  } catch (error) {
    console.error('处理socket消息失败:', error);
    addLog('error', `处理接收数据失败: ${error.message}`);
  }
};
```

#### 状态变化处理
```typescript
const handleStatusChange = (data: any) => {
  switch (data.status) {
    case 'connected':
      connected.value = true;
      addLog('system', '串口连接已建立');
      break;
    case 'disconnected':
      connected.value = false;
      addLog('system', '串口连接已断开');
      break;
    case 'error':
      addLog('error', data.message || '串口发生错误');
      break;
    case 'timeout':
      addLog('error', '串口操作超时');
      break;
  }
};
```

### 7. 生命周期管理

#### 组件挂载
```typescript
onMounted(async () => {
  // 初始化Socket连接
  initializeSocket();
  
  // 加载数据
  await Promise.all([
    loadSerialList(),
    loadAvailablePorts()
  ]);
  
  // 添加欢迎信息
  addLog('system', '串口监控系统已启动');
});
```

#### 组件卸载
```typescript
onUnmounted(async () => {
  addLog('system', '正在关闭串口监控系统...');
  
  try {
    if (connected.value && currentSerial.value) {
      await handleDisconnect();
    }
    removeSocketListener();
    socketConnected.value = false;
    reconnectAttempts.value = 0;
  } catch (error) {
    console.error('组件卸载清理失败:', error);
  }
});
```

## 🎯 用户体验改进

### 1. 实时状态反馈
- Socket 连接状态实时显示
- 重连进度可视化
- 详细的操作日志

### 2. 智能错误提示
- 分类错误信息
- 用户友好的提示文案
- 操作建议和解决方案

### 3. 连接稳定性
- 自动重连机制
- 连接状态监控
- 网络异常处理

## 🔍 调试和监控

### 日志系统
- 系统日志：连接状态、操作记录
- 数据日志：发送/接收的数据
- 错误日志：异常信息和堆栈

### 控制台输出
```typescript
console.log(`开始监听串口事件: ${eventName}`);
console.log('Socket连接成功');
console.error('Socket连接错误:', error);
```

### 状态监控
- 连接状态指示器
- 数据统计计数器
- 重连尝试进度

## 📊 性能优化

### 1. 事件监听器管理
- 避免重复监听
- 及时移除监听器
- 内存泄漏防护

### 2. 数据处理优化
- 高效的数据解析
- 错误边界处理
- 异步操作优化

### 3. 状态更新优化
- 批量状态更新
- 防抖处理
- 渲染性能优化

## 🚀 兼容性

### API 兼容
- 保持原有 API 接口不变
- 向后兼容现有功能
- 渐进式增强

### 浏览器兼容
- 现代浏览器支持
- WebSocket 标准兼容
- 错误降级处理

## 📝 使用建议

1. **监控连接状态**：关注状态栏的 Socket 连接指示器
2. **查看日志信息**：通过日志了解连接和数据传输状态
3. **网络异常处理**：网络不稳定时会自动重连，请耐心等待
4. **错误排查**：遇到问题时查看控制台日志和错误提示

这些改进使串口监控功能更加稳定可靠，提供了更好的用户体验和调试能力。
