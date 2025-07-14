# 文件系统SSE (Server-Sent Events) 功能说明

## 概述

文件系统SSE功能使用Server-Sent Events技术替代了原有的WebSocket通信方式，为文件管理系统提供实时的状态更新和进度推送。

## 主要特性

### 1. 实时通信
- **上传进度推送**: 实时推送文件分片上传进度
- **合并进度推送**: 实时推送文件分片合并进度
- **系统状态更新**: 定期推送系统运行状态
- **队列状态更新**: 实时推送合并队列状态
- **统计信息更新**: 定期推送存储统计信息

### 2. 事件类型
- `upload_progress`: 上传进度事件
- `merge_progress`: 合并进度事件
- `file_created`: 文件创建事件
- `file_deleted`: 文件删除事件
- `file_updated`: 文件更新事件
- `system_status`: 系统状态事件
- `queue_status`: 队列状态事件
- `statistics_update`: 统计信息更新事件
- `error`: 错误事件
- `heartbeat`: 心跳事件

## API接口

### 1. 建立SSE连接
```
GET /v1/filesystem/sse/connect?clientId={clientId}
```
- **参数**: `clientId` (可选) - 客户端标识符
- **返回**: SSE事件流

### 2. 订阅事件
```
POST /v1/filesystem/sse/subscribe?clientId={clientId}&eventTypes={eventTypes}
```
- **参数**: 
  - `clientId` - 客户端标识符
  - `eventTypes` - 事件类型列表，用逗号分隔

### 3. 取消订阅
```
POST /v1/filesystem/sse/unsubscribe?clientId={clientId}&eventTypes={eventTypes}
```

### 4. 断开连接
```
POST /v1/filesystem/sse/disconnect?clientId={clientId}
```

### 5. 心跳检测
```
POST /v1/filesystem/sse/heartbeat?clientId={clientId}
```

### 6. 测试消息
```
POST /v1/filesystem/sse/test?clientId={clientId}
```

### 7. 获取连接状态
```
GET /v1/filesystem/sse/status
```

## 前端使用示例

### 1. 建立连接
```javascript
const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const eventSource = new EventSource(`/api/v1/filesystem/sse/connect?clientId=${clientId}`)

eventSource.onopen = () => {
  console.log('SSE连接建立成功')
}

eventSource.onerror = (error) => {
  console.error('SSE连接错误:', error)
}
```

### 2. 监听事件
```javascript
// 监听上传进度
eventSource.addEventListener('upload_progress', (event) => {
  const data = JSON.parse(event.data)
  console.log('上传进度:', data.progress, '%')
})

// 监听合并进度
eventSource.addEventListener('merge_progress', (event) => {
  const data = JSON.parse(event.data)
  console.log('合并进度:', data.progress, '%')
})

// 监听系统状态
eventSource.addEventListener('system_status', (event) => {
  const data = JSON.parse(event.data)
  console.log('系统状态:', data)
})
```

### 3. 订阅特定事件
```javascript
const subscribeEvents = async () => {
  const eventTypes = 'upload_progress,merge_progress,system_status'
  const response = await fetch(`/api/v1/filesystem/sse/subscribe?clientId=${clientId}&eventTypes=${eventTypes}`, {
    method: 'POST'
  })
  
  if (response.ok) {
    console.log('事件订阅成功')
  }
}
```

## 后端集成

### 1. 发送上传进度
```java
@Autowired
private FileSystemSseService fileSystemSseService;

// 发送上传进度
fileSystemSseService.sendUploadProgress(fileId, progress, status);
```

### 2. 发送合并进度
```java
// 发送合并进度
fileSystemSseService.sendMergeProgress(fileId, progress, status);
```

### 3. 发送文件操作结果
```java
// 发送操作结果
fileSystemSseService.sendFileOperationResult("upload", fileId, true, "上传成功");
```

### 4. 发送系统状态
```java
// 发送系统状态
Map<String, Object> status = new HashMap<>();
status.put("totalFiles", 100);
status.put("totalStorage", 1024 * 1024 * 1024);
fileSystemSseService.sendSystemStatusUpdate(status);
```

## 配置说明

### 1. SSE连接配置
- **连接超时**: 30分钟
- **心跳间隔**: 30秒
- **连接清理**: 每分钟检查一次过期连接

### 2. 定时任务配置
- **系统状态推送**: 每30秒
- **队列状态推送**: 每10秒
- **统计信息推送**: 每分钟

## 测试页面

系统提供了一个测试页面用于验证SSE功能：
- **路径**: `/server/file-system-sse-test`
- **功能**: 
  - 建立/断开SSE连接
  - 订阅/取消订阅事件
  - 发送测试消息
  - 实时显示接收到的消息

## 注意事项

1. **浏览器兼容性**: SSE在所有现代浏览器中都有良好支持
2. **连接管理**: 客户端应该在页面卸载时主动断开连接
3. **错误处理**: 应该监听`onerror`事件并实现重连机制
4. **性能考虑**: 大量客户端连接时注意服务器性能
5. **安全性**: 生产环境中应该添加适当的身份验证和授权

## 与WebSocket的对比

| 特性 | SSE | WebSocket |
|------|-----|-----------|
| 通信方向 | 单向(服务器到客户端) | 双向 |
| 协议 | HTTP | WebSocket协议 |
| 复杂度 | 简单 | 相对复杂 |
| 重连机制 | 浏览器自动重连 | 需要手动实现 |
| 防火墙友好 | 是 | 可能被阻止 |
| 适用场景 | 实时推送、状态更新 | 实时交互、聊天 |

对于文件系统的实时状态推送场景，SSE是更合适的选择。
