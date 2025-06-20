# WebSocket 初始化改进说明

## 改进概述

参考 `InstallProgressDrawer.vue` 中的 `stompClient` 实现模式，将 `server/index.vue` 中的原生 WebSocket 初始化改为使用 `@repo/core` 中的 `socket` 工具，实现更统一和稳定的 WebSocket 连接管理。

## 主要改进内容

### 1. 导入依赖更新

#### 修改前
```typescript
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { getWebSocketUrl } from "@/api/config";
```

#### 修改后
```typescript
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from "vue";
import { message, splitToArray } from "@repo/utils";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { ElMessageBox } from "element-plus";
```

**变更说明**：
- 添加了 `splitToArray` 工具函数用于处理配置URL
- 添加了 `socket` 工具用于创建WebSocket连接
- 添加了 `getConfig` 用于获取配置信息
- 移除了 `getWebSocketUrl` 因为不再使用原生WebSocket

### 2. 状态变量更新

#### 修改前
```typescript
// WebSocket相关状态
const websocket = ref<WebSocket | null>(null);
const wsConnected = ref(false);
const serverMetrics = ref<Map<string, any>>(new Map());
```

#### 修改后
```typescript
// WebSocket相关状态
const stompClient = ref<any>(null);
const wsConnected = ref(false);
const serverMetrics = ref<Map<string, any>>(new Map());
```

**变更说明**：
- 将 `websocket` 改为 `stompClient`，使用统一的socket客户端

### 3. WebSocket初始化函数重构

#### 修改前（原生WebSocket）
```typescript
const initWebSocket = () => {
  try {
    const wsUrl = getWebSocketUrl("/gen/server", "");
    websocket.value = new WebSocket(wsUrl);

    websocket.value.onopen = () => {
      wsConnected.value = true;
      console.log("服务器管理WebSocket连接成功");
    };

    websocket.value.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("解析WebSocket消息失败:", error);
      }
    };

    websocket.value.onclose = () => {
      wsConnected.value = false;
      console.log("服务器管理WebSocket连接关闭");
      // 5秒后重连
      setTimeout(() => {
        if (!wsConnected.value) {
          initWebSocket();
        }
      }, 5000);
    };

    websocket.value.onerror = (error) => {
      console.error("服务器管理WebSocket连接错误:", error);
      wsConnected.value = false;
    };
  } catch (error) {
    console.error("初始化WebSocket失败:", error);
  }
};
```

#### 修改后（stompClient模式）
```typescript
const initWebSocket = async () => {
  if (stompClient.value && stompClient.value.connected) {
    return;
  }

  try {
    const config = getConfig();
    stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {});

    // 连接成功
    wsConnected.value = true;
    console.log("服务器管理WebSocket连接成功");
    
    // 订阅服务器相关主题
    subscribeToServerTopics();
  } catch (error) {
    console.error("WebSocket连接异常:", error);
    wsConnected.value = false;
    
    // 5秒后重连
    setTimeout(() => {
      if (!wsConnected.value) {
        initWebSocket();
      }
    }, 5000);
  }
};
```

### 4. 新增主题订阅管理

#### 订阅函数
```typescript
const subscribeToServerTopics = () => {
  if (!stompClient.value) return;
  
  // 先取消之前的订阅
  unsubscribeFromServerTopics();
  
  // 订阅服务器主题
  const serverTopic = `/topic/gen/server`;
  
  stompClient.value.on(serverTopic, (message: any) => {
    try {
      const output = JSON.parse(message.data);
      handleWebSocketMessage(output);
    } catch (error) {
      console.error("解析WebSocket消息失败:", error);
    }
  });

  console.log("已订阅服务器主题:", serverTopic);
};
```

#### 取消订阅函数
```typescript
const unsubscribeFromServerTopics = () => {
  if (!stompClient.value) return;
  
  // 取消服务器主题订阅
  const serverTopic = `/topic/gen/server`;
  stompClient.value.off(serverTopic);
};
```

### 5. 连接关闭函数改进

#### 修改前
```typescript
const closeWebSocket = () => {
  if (websocket.value) {
    websocket.value.close();
    websocket.value = null;
    wsConnected.value = false;
  }
};
```

#### 修改后
```typescript
const closeWebSocket = () => {
  try {
    // 先取消所有订阅
    if (stompClient.value) {
      unsubscribeFromServerTopics();
      
      // 断开连接并关闭
      if (stompClient.value.connected) {
        stompClient.value.disconnect();
      }
      
      stompClient.value.close();
      stompClient.value = null;
      
      console.log("服务器管理WebSocket连接已完全断开");
    }
    wsConnected.value = false;
  } catch (error) {
    console.error("断开WebSocket连接时出错:", error);
    wsConnected.value = false;
  }
};
```

## 改进优势

### 1. 统一的连接管理
- 使用与 `InstallProgressDrawer.vue` 相同的连接模式
- 统一的错误处理和重连机制
- 更好的连接状态管理

### 2. 主题订阅模式
- 支持多主题订阅管理
- 清晰的订阅/取消订阅逻辑
- 避免内存泄漏和重复订阅

### 3. 更好的错误处理
- 完善的异常捕获机制
- 优雅的连接断开处理
- 自动重连功能

### 4. 代码一致性
- 与项目中其他WebSocket使用保持一致
- 遵循相同的编码模式和最佳实践
- 便于维护和扩展

## 使用说明

### 配置要求
确保在配置文件中正确设置了 `SocketUrl`：
```typescript
const config = {
  SocketUrl: "ws://localhost:8080/socket.io,ws://backup:8080/socket.io"
};
```

### 主题格式
服务器相关消息应发送到主题：`/topic/gen/server`

### 消息格式
WebSocket消息应遵循以下格式：
```typescript
interface WebSocketMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
  serverId?: string;
}
```

## 兼容性说明

- 保持了原有的消息处理逻辑不变
- `handleWebSocketMessage` 函数无需修改
- 所有现有的消息类型和处理器继续有效
- UI状态显示（连接状态指示器）保持不变

## 后续建议

1. 考虑将其他使用原生WebSocket的组件也迁移到这种模式
2. 建立统一的WebSocket连接管理服务
3. 添加连接质量监控和统计功能
4. 考虑实现消息队列和离线消息处理
