# WebSocket 连接问题诊断和修复

## 问题发现

在检查 SimpleRDPDesktop 无法使用的问题时，发现主要原因是 **WebSocket 连接未能正确建立**。

## 问题分析

### 1. 前端配置问题

**原始问题**：
- `SimpleGuacamoleClient` 使用了错误的配置导入：`import { getConfig } from '@repo/config'`
- 这个导入路径不存在，导致 WebSocket URL 构建失败

**修复方案**：
```typescript
// 修复前
import { getConfig } from '@repo/config';
const path = getConfig().BaseUrl + `/websocket/${this.config.protocol}`;

// 修复后
const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/monitor/api';
const path = baseUrl + `/websocket/${this.config.protocol}`;
```

### 2. WebSocket URL 构建

**正确的 URL 格式**：
```
ws://localhost:8848/monitor/api/websocket/rdp?serverId=1
```

**URL 组成部分**：
- `protocol`: `ws://` 或 `wss://`（根据当前页面协议）
- `host`: `window.location.host`（当前页面的主机和端口）
- `baseUrl`: `/monitor/api`（从环境变量获取）
- `endpoint`: `/websocket/rdp` 或 `/websocket/vnc`
- `params`: `?serverId=1`（只需要服务器ID）

### 3. 后端配置验证

**WebSocket 端点配置**：
```java
// GuacamoleWebSocketConfig.java
registry.addHandler(rdpWebSocketHandler, "/websocket/rdp")
        .addInterceptors(webSocketInterceptor)
        .setAllowedOrigins("*");
```

**拦截器逻辑**：
```java
// GuacamoleWebSocketInterceptor.java
public boolean beforeHandshake(...) {
    // 目前允许所有连接
    return true;
}
```

## 修复内容

### 1. 修复配置导入

**文件**: `src/utils/guacamole/simple-client.ts`

```typescript
// 移除错误的导入
// import { getConfig } from '@repo/config';

// 使用环境变量
const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/monitor/api';
```

### 2. 简化参数传递

**修复前**：发送多个参数（host、port、username等）
**修复后**：只发送 `serverId`，其他参数由后端从数据库获取

```typescript
const params = new URLSearchParams({
  serverId: this.config.serverId.toString()
});
```

### 3. 增强调试信息

添加了详细的连接状态日志：
```typescript
console.log('开始连接 Guacamole WebSocket:', wsUrl);
console.log('Guacamole 客户端状态变化:', state, this.getStateText(state));
```

### 4. 改进错误处理

```typescript
this.tunnel.onerror = (error: any) => {
  console.error('WebSocket 隧道错误:', error);
  if (this.events.onError) {
    this.events.onError(error);
  }
  reject(error);
};
```

## 诊断工具

### 1. WebSocket 连接测试页面

**文件**: `src/views/test/websocket-test.vue`

功能：
- 直接测试 WebSocket 连接
- 实时显示连接状态
- 详细的连接日志
- 支持 RDP 和 VNC 协议测试

### 2. SimpleRDP 测试页面

**文件**: `src/views/test/simple-rdp-test.vue`

功能：
- 分步测试（WebSocket连接 → 组件创建）
- 服务器配置表单
- 连接状态监控
- 详细的操作日志

## 可能的问题点

### 1. 后端服务未启动
- 检查后端服务是否在运行
- 确认端口 8080 是否可访问

### 2. 数据库中无服务器配置
- 确保数据库中存在对应 serverId 的服务器记录
- 检查服务器配置是否完整

### 3. Guacamole 服务未配置
- 后端需要能够连接到 Guacamole 守护进程
- 检查 Guacamole 相关配置

### 4. 网络连接问题
- 检查防火墙设置
- 确认 WebSocket 协议未被阻止

## 测试步骤

### 1. 基础 WebSocket 测试
```bash
# 访问测试页面
http://localhost:8848/#/test/websocket-test

# 配置参数
- 协议: RDP
- 服务器ID: 1

# 点击"测试连接"
```

### 2. SimpleRDP 组件测试
```bash
# 访问测试页面
http://localhost:8848/#/test/simple-rdp-test

# 配置服务器信息
- 服务器ID: 1
- 服务器名称: Test Server
- 主机地址: 192.168.1.100
- 端口: 3389
- 用户名: administrator
- 密码: ******

# 点击"开始测试"
```

### 3. 浏览器开发者工具检查
```bash
# 打开开发者工具
F12 → Network → WS

# 查看 WebSocket 连接
- 连接状态
- 发送/接收的消息
- 错误信息
```

## 预期结果

### 成功连接的标志：
1. **WebSocket 握手成功**：状态码 101
2. **后端日志显示**：`RDP WebSocket连接建立: sessionId=xxx`
3. **前端收到消息**：连接成功的确认消息
4. **Guacamole 状态**：从 CONNECTING → CONNECTED

### 失败的常见原因：
1. **404 错误**：端点路径不正确
2. **403 错误**：权限验证失败
3. **500 错误**：后端服务异常
4. **超时**：网络连接问题

## 后续优化

1. **添加重连机制**：自动重试连接
2. **改进错误提示**：更友好的用户提示
3. **连接状态管理**：统一的连接状态管理
4. **性能优化**：减少不必要的连接尝试
