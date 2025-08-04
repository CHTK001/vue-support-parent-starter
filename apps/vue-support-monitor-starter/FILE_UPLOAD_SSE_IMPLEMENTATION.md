# 文件上传SSE实时推送实现

## 概述

本次实现将文件上传进度监听从轮询方式改为SSE（Server-Sent Events）实时推送，提高了系统性能和用户体验。

## 实现内容

### 1. 后端SSE服务

后端已经实现了完整的SSE服务：

- **FileSystemSseService**: 文件系统SSE服务接口
- **FileSystemSseServiceImpl**: SSE服务实现类
- **FileSystemSseController**: SSE连接控制器

#### 主要功能
- 建立SSE连接：`/api/filesystem/sse/connect`
- 心跳保持：`/api/filesystem/sse/heartbeat`
- 事件订阅：`/api/filesystem/sse/subscribe`
- 实时推送上传进度、合并进度、文件操作结果等

#### 支持的事件类型
- `upload_progress`: 上传进度更新
- `upload_completed`: 上传完成
- `upload_failed`: 上传失败
- `merge_progress`: 合并进度更新
- `merge_completed`: 合并完成
- `merge_failed`: 合并失败
- `file_deleted`: 文件删除
- `system_status`: 系统状态更新
- `queue_status`: 队列状态更新

### 2. 前端SSE客户端

#### 新增文件
- **useFileSystemSSE.ts**: SSE连接管理composable

#### 主要特性
- 自动连接和重连机制
- 心跳保持连接
- 事件订阅管理
- 消息处理器注册
- 连接状态管理

### 3. 组件更新

#### FileUploadDialog组件
**更新内容：**
- 接收SSE连接相关props（queueStatus、onMessage、MESSAGE_TYPE）
- 添加SSE消息监听器设置和清理
- 在文件初始化上传后设置currentFileId用于进度跟踪
- 自动将上传任务添加到队列中
- 通过SSE实时接收上传进度更新

**新增Props：**
```typescript
interface Props {
  modelValue: boolean;
  queueStatus: Map<number, UploadQueueStatus>;
  onMessage: (type: string, handler: (message: any) => void) => () => void;
  MESSAGE_TYPE: any;
}
```

**新增Events：**
- `add-to-queue`: 添加任务到上传队列

#### UploadQueueStatus组件
**更新内容：**
- 移除轮询机制（startPolling、stopPolling方法）
- 改为接收queueStatus作为props
- 通过watch监听props变化自动更新队列状态
- 移除checkUploadStatus API调用

**更新Props：**
```typescript
interface Props {
  queueStatus: Map<number, UploadQueueStatus>;
}
```

#### 文件系统管理主页
**更新内容：**
- 将WebSocket连接替换为SSE连接
- 更新导入：`useFileSystemWebSocket` → `useFileSystemSSE`
- 更新连接状态变量：`wsState` → `sseState`
- 更新连接方法：`connectWS` → `connectSSE`
- 传递SSE相关props给子组件
- 添加handleAddToQueue方法处理队列添加事件

### 4. 数据流程

#### 上传进度实时推送流程
1. **前端发起上传**
   - FileUploadDialog调用initChunkUpload初始化上传
   - 获取fileId并设置为currentFileId
   - 将任务添加到上传队列
   - 开始分片上传

2. **后端处理上传**
   - FileSystemServiceImpl处理分片上传
   - 计算上传进度
   - 通过FileSystemSseService推送进度更新

3. **前端接收更新**
   - SSE连接接收upload_progress事件
   - FileUploadDialog监听当前文件的进度更新
   - UploadQueueStatus通过props接收队列状态更新
   - 实时更新UI显示

#### 队列状态管理
1. **SSE推送队列状态**
   - 后端通过SSE推送queue_status事件
   - 包含所有活跃任务的状态信息

2. **前端状态同步**
   - useFileSystemSSE接收并更新queueStatus Map
   - UploadQueueStatus组件通过props接收更新
   - 自动转换Map为数组并更新UI

### 5. 性能优化

#### 移除轮询机制
- **之前**: 每2秒轮询检查上传状态
- **现在**: 实时SSE推送，零延迟更新

#### 减少API调用
- **之前**: 频繁调用checkUploadStatus API
- **现在**: 仅在初始化时调用，后续通过SSE推送

#### 连接管理
- 自动重连机制（最多5次）
- 心跳保持连接活跃
- 组件卸载时自动清理连接

### 6. 错误处理

#### 连接错误
- 自动重连机制
- 连接状态指示器
- 错误消息提示

#### 消息处理错误
- try-catch包装消息处理器
- 错误日志记录
- 不影响其他消息处理

### 7. 兼容性

#### 浏览器支持
- 现代浏览器原生支持SSE
- 自动降级处理（如需要）

#### 现有功能
- 保持所有现有上传功能
- 向后兼容现有API
- 不影响其他模块

## 使用方式

### 启动SSE连接
```typescript
const {
  state: sseState,
  realtimeStatus,
  queueStatus,
  connect: connectSSE,
  disconnect: disconnectSSE,
  onMessage,
  MESSAGE_TYPE,
} = useFileSystemSSE();

// 组件挂载时连接
onMounted(() => {
  connectSSE();
});

// 组件卸载时断开
onUnmounted(() => {
  disconnectSSE();
});
```

### 监听消息
```typescript
// 监听上传进度
onMessage(MESSAGE_TYPE.UPLOAD_PROGRESS, (message) => {
  console.log('上传进度:', message.data);
});

// 监听上传完成
onMessage(MESSAGE_TYPE.UPLOAD_COMPLETED, (message) => {
  console.log('上传完成:', message.data);
});
```

### 队列状态管理
```typescript
// 队列状态自动通过props传递
<UploadQueueStatusComponent 
  :queue-status="queueStatus"
  @queue-update="handleQueueUpdate" 
/>
```

## 总结

通过实现SSE实时推送，我们成功地：

1. **提升了性能**: 消除了轮询开销，减少了不必要的API调用
2. **改善了用户体验**: 实时更新进度，零延迟反馈
3. **增强了可靠性**: 自动重连机制，错误处理完善
4. **保持了兼容性**: 不破坏现有功能，平滑升级

文件上传现在具有真正的实时进度反馈，为用户提供了更好的交互体验。
