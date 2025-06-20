# Server.ts 文件改进说明

## 改进概述

参考其他接口文件的最佳实践，对 `server.ts` 文件进行了全面的现代化改进，提升了代码质量、类型安全性和可维护性。

## 主要改进内容

### 1. 引入现代化工具
- 添加了 `@repo/utils` 中的 `http` 工具和 `ReturnResult` 类型
- 保留原有的 `axios` 导入以支持特殊场景（如文件上传/下载）

### 2. 完善的 TypeScript 类型定义

#### 核心接口类型
- `ServerInfo`: 服务器基本信息接口
- `ServerPageParams`: 分页查询参数接口
- `ServerSaveParams`: 服务器保存参数接口
- `ServerConnectionTestResult`: 连接测试结果接口
- `ServerStatistics`: 服务器统计信息接口
- `BatchOperationParams`: 批量操作参数接口

#### 枚举类型
- `ProtocolType`: 协议类型
- `ServerStatus`: 服务器状态
- `ConnectionStatus`: 连接状态
- `OnlineStatus`: 在线状态
- `WSMessageType`: WebSocket消息类型

### 3. API 函数现代化

#### 使用 http.request 替代 axios
大部分 API 函数已升级为使用 `http.request`，具备以下优势：
- 完整的 TypeScript 类型支持
- 统一的返回结果格式 `ReturnResult<T>`
- 更好的错误处理机制

#### 保留 axios 的特殊场景
以下场景仍使用原生 axios：
- 文件上传/下载操作
- 需要特殊 Content-Type 的请求
- 流式数据传输

### 4. 详细的 JSDoc 注释
为所有函数添加了完整的 JSDoc 注释：
- 函数功能描述
- 参数说明和类型
- 返回值说明
- 使用示例（适用时）

### 5. 代码组织结构优化

#### 清晰的分区
```typescript
// ==================== 类型定义 ====================
// ==================== API 函数 ====================  
// ==================== 常量和枚举 ====================
// ==================== WebSocket 相关 ====================
```

#### 逻辑分组
- 类型定义集中在文件顶部
- API 函数按功能分组
- 常量和枚举统一管理
- WebSocket 相关独立分区

### 6. 增强的类型安全

#### 强类型约束
- 所有枚举值都有对应的 TypeScript 类型
- 状态映射使用 Record 类型确保完整性
- 泛型接口支持更灵活的类型推导

#### 类型导出
```typescript
export type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];
export type ServerStatus = typeof SERVER_STATUS[keyof typeof SERVER_STATUS];
// ... 其他类型导出
```

### 7. WebSocket 消息类型改进

#### 泛型支持
```typescript
export interface WebSocketMessage<T = any> {
  type: WSMessageType;
  data: T;
  timestamp: number;
  serverId?: string;
}
```

#### 扩展的 ServerMetrics
添加了更多指标字段：
- CPU温度
- 进程数量
- 线程数量

## 使用示例

### 基本 API 调用
```typescript
import { getServerPageList, type ServerPageParams } from './server';

const params: ServerPageParams = {
  page: 1,
  pageSize: 20,
  monitorSysGenServerProtocol: 'SSH'
};

const result = await getServerPageList(params);
// result 类型为 ReturnResult<{ records: ServerInfo[]; total: number }>
```

### 状态映射使用
```typescript
import { SERVER_STATUS, statusMap } from './server';

const status = SERVER_STATUS.ENABLED;
const statusInfo = statusMap[status]; // { color: "success", text: "已启用" }
```

### WebSocket 消息处理
```typescript
import { type WebSocketMessage, WS_MESSAGE_TYPE } from './server';

const handleMessage = (message: WebSocketMessage) => {
  if (message.type === WS_MESSAGE_TYPE.SERVER_STATUS) {
    // 处理服务器状态更新
  }
};
```

## 兼容性说明

- 保持了所有原有 API 函数的签名兼容性
- 现有代码可以无缝升级使用新的类型定义
- 渐进式迁移：可以逐步将 axios 调用替换为 http.request

## 后续建议

1. 逐步将其他接口文件也按此模式进行改进
2. 考虑添加单元测试覆盖主要 API 函数
3. 建立接口文档生成机制，基于 JSDoc 注释自动生成
4. 考虑添加 API 响应数据的 mock 支持，便于开发调试
