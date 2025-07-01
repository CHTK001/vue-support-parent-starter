# SimpleRDPDesktop 无法使用问题修复

## 问题描述

SimpleRDPDesktop.vue 组件无法正常使用，主要问题包括：

1. **WebSocket URL 参数错误**：前端发送的参数格式与后端期望不匹配
2. **TypeScript 类型错误**：缺少类型定义和类型不匹配
3. **Display DOM 问题**：Canvas 元素使用不当

## 问题分析

### 1. WebSocket 连接问题

**后端期望**：
- 后端 `RdpWebSocketHandler.getServerIdFromSession()` 方法从 URL 查询参数中获取 `serverId`
- 其他连接参数（host、port、username、password）通过服务器配置从数据库获取

**前端问题**：
- `SimpleGuacamoleClient.buildWebSocketUrl()` 发送了过多不必要的参数
- 参数格式与后端期望不匹配

### 2. TypeScript 类型问题

**问题**：
- 缺少 `@/types/server` 模块
- `el-tag` 组件的 `type` 属性类型不匹配
- 未使用的函数参数警告

## 修复方案

### 1. 修复 WebSocket URL 构建

**文件**：`src/utils/guacamole/simple-client.ts`

**修改前**：
```typescript
// 构建连接参数
const params = new URLSearchParams({
  serverId: this.config.serverId.toString(),
  host: this.config.host,
  port: this.config.port.toString(),
  protocol: this.config.protocol
  // ... 更多参数
});
```

**修改后**：
```typescript
// 后端只需要serverId参数，其他参数通过服务器配置获取
const params = new URLSearchParams({
  serverId: this.config.serverId.toString()
});
```

### 2. 修复 TypeScript 类型问题

#### 2.1 替换服务器类型定义

**文件**：`SimpleRDPDesktop.vue` 和 `SimpleVNCDesktop.vue`

**修改前**：
```typescript
import type { MonitorSysGenServer } from '@/types/server';

interface Props {
  server: MonitorSysGenServer | null;
}
```

**修改后**：
```typescript
interface Props {
  server: {
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerPort: number;
    monitorSysGenServerUsername?: string;
    monitorSysGenServerPassword?: string;
  } | null;
}
```

#### 2.2 修复 el-tag 类型问题

**修改前**：
```typescript
return { type: 'success', text: '已连接' };
```

**修改后**：
```typescript
return { type: 'success' as const, text: '已连接' };
```

#### 2.3 修复未使用参数警告

**修改前**：
```typescript
onClipboard: (stream: any, mimetype: string) => {
```

**修改后**：
```typescript
onClipboard: (_stream: any, mimetype: string) => {
```

### 3. Display DOM 修复

已在之前的修复中完成：
- 将 `<canvas>` 改为 `<div>` 容器
- 更新 `attachTo` 方法支持 HTMLElement
- 修复 CSS 样式

## 后端配置验证

### WebSocket 端点配置

**文件**：`GuacamoleWebSocketConfig.java`
```java
// RDP WebSocket端点
registry.addHandler(rdpWebSocketHandler, "/websocket/rdp")
        .addInterceptors(webSocketInterceptor)
        .setAllowedOrigins("*");
```

### 参数获取逻辑

**文件**：`RdpWebSocketHandler.java`
```java
private String getServerIdFromSession(WebSocketSession session) {
    String query = session.getUri().getQuery();
    if (query != null) {
        String[] params = query.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=");
            if (keyValue.length == 2 && "serverId".equals(keyValue[0])) {
                return keyValue[1];
            }
        }
    }
    return null;
}
```

## 测试验证

### 1. 创建测试页面

创建了 `simple-rdp-test.vue` 测试页面，包含：
- 服务器配置表单
- SimpleRDPDesktop 组件测试
- 连接状态监控
- 详细日志记录

### 2. 测试步骤

1. 配置测试服务器信息
2. 点击"开始测试"创建服务器对象
3. 在 SimpleRDPDesktop 组件中点击"连接"
4. 观察连接状态和日志输出
5. 验证 WebSocket 连接是否成功建立

## 预期结果

修复后的 SimpleRDPDesktop 组件应该能够：

1. **正确建立 WebSocket 连接**：
   - URL 格式正确：`ws://host/websocket/rdp?serverId=1`
   - 后端能正确解析 serverId 参数
   - 从数据库获取服务器配置信息

2. **正确显示连接状态**：
   - 连接状态标签正确显示
   - 连接按钮状态正确切换
   - 错误信息正确提示

3. **正确渲染远程桌面**：
   - Guacamole display 元素正确挂载到 div 容器
   - 鼠标键盘事件正确处理
   - 截图功能正常工作

## 注意事项

1. **服务器配置**：确保数据库中有对应的服务器配置记录
2. **网络连接**：确保前端能访问到后端 WebSocket 端点
3. **Guacamole 服务**：确保后端 Guacamole 服务正常运行
4. **权限验证**：确保 WebSocket 连接通过权限验证

## 后续优化

1. **错误处理**：增强错误处理和用户提示
2. **连接重试**：添加自动重连机制
3. **性能优化**：优化 WebSocket 消息处理
4. **安全加固**：加强连接安全验证
