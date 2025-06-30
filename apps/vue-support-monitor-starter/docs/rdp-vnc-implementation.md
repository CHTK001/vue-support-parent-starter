# RDP/VNC 前端实现说明

## 概述

本项目使用 `guacamole-common-js` 库直接实现 RDP 和 VNC 远程桌面功能，无需编写复杂的自定义逻辑。该实现提供了真实的远程桌面交互体验，包括图像显示、鼠标键盘操作、剪贴板同步等功能。

## 技术栈

- **guacamole-common-js**: Apache Guacamole 的 JavaScript 客户端库
- **Vue 3**: 前端框架
- **TypeScript**: 类型安全的 JavaScript
- **Element Plus**: UI 组件库
- **WebSocket**: 与后端的实时通信

## 核心组件

### 1. SimpleGuacamoleClient (`src/utils/guacamole/simple-client.ts`)

这是简化的 Guacamole 客户端，直接使用 `guacamole-common-js` 原生功能：

#### 主要功能：
- **连接管理**: 使用 Guacamole.WebSocketTunnel 建立连接
- **显示管理**: 使用 Guacamole.Client.getDisplay() 获取显示
- **输入处理**: 使用 Guacamole.Mouse 和 Guacamole.Keyboard 处理输入
- **剪贴板同步**: 使用 Guacamole 原生剪贴板 API
- **屏幕截图**: 直接从 Canvas 元素获取截图

#### 关键方法：
```typescript
// 连接到远程桌面
async connect(): Promise<void>

// 断开连接
disconnect(): void

// 绑定到 Canvas 元素
attachTo(canvas: HTMLCanvasElement): void

// 发送剪贴板数据
sendClipboard(data: string, mimetype?: string): void

// 调整显示尺寸
resize(width: number, height: number)

// 截图
takeScreenshot(): string | null
```

### 2. ServerTerminalDialog.vue

主要的终端对话框组件，支持 SSH、RDP 和 VNC 三种协议：

#### RDP/VNC 特性：
- **自动协议检测**: 根据服务器协议自动初始化相应的客户端
- **状态管理**: 实时显示连接状态和错误信息
- **交互控制**: 提供剪贴板、截图、尺寸调整等控制按钮
- **事件处理**: 自动处理 Guacamole 的各种事件

## 使用流程

### 1. 连接建立
```typescript
// 创建客户端管理器
const client = new GuacamoleClientManager(canvas);

// 设置事件回调
client.setOnStateChange((state) => {
  console.log('连接状态:', getStateDescription(state));
});

// 连接到服务器
client.connect(websocketUrl, {
  width: 1024,
  height: 768,
  dpi: 96
});
```

### 2. 事件处理
```typescript
// 状态变化
client.setOnStateChange((state) => {
  switch (state) {
    case GuacamoleState.CONNECTED:
      // 连接成功
      break;
    case GuacamoleState.DISCONNECTED:
      // 连接断开
      break;
  }
});

// 错误处理
client.setOnError((error) => {
  console.error('连接错误:', error);
});

// 剪贴板同步
client.setOnClipboard((data) => {
  navigator.clipboard.writeText(data);
});
```

### 3. 用户交互
```typescript
// 发送剪贴板数据
const text = await navigator.clipboard.readText();
client.sendClipboard(text);

// 调整屏幕尺寸
client.resize(1920, 1080);

// 截图
const dataUrl = client.takeScreenshot();
```

## 配置选项

### GuacamoleClientConfig
```typescript
interface GuacamoleClientConfig {
  width?: number;          // 显示宽度
  height?: number;         // 显示高度
  dpi?: number;           // DPI 设置
  audioMimetypes?: string[];   // 支持的音频格式
  videoMimetypes?: string[];   // 支持的视频格式
  imageMimetypes?: string[];   // 支持的图像格式
}
```

### 默认配置
```typescript
const defaultGuacamoleConfig = {
  width: 1024,
  height: 768,
  dpi: 96,
  audioMimetypes: ['audio/L16', 'audio/L8'],
  videoMimetypes: ['video/mp4', 'video/webm'],
  imageMimetypes: ['image/jpeg', 'image/png', 'image/webp']
};
```

## 状态管理

### 连接状态
- `IDLE (0)`: 空闲
- `CONNECTING (1)`: 连接中
- `WAITING (2)`: 等待中
- `CONNECTED (3)`: 已连接
- `DISCONNECTING (4)`: 断开中
- `DISCONNECTED (5)`: 已断开

### 状态监听
```typescript
client.setOnStateChange((state) => {
  const description = getStateDescription(state);
  console.log('当前状态:', description);
});
```

## 错误处理

### 常见错误类型
1. **连接超时**: 网络问题或服务器不可达
2. **认证失败**: 用户名密码错误
3. **协议错误**: 服务器不支持请求的协议
4. **权限错误**: 用户没有访问权限

### 错误处理示例
```typescript
client.setOnError((error) => {
  switch (error.code) {
    case 'UPSTREAM_TIMEOUT':
      message.error('连接超时，请检查网络');
      break;
    case 'CLIENT_UNAUTHORIZED':
      message.error('认证失败，请检查用户名密码');
      break;
    default:
      message.error(`连接错误: ${error.message}`);
  }
});
```

## 性能优化

### 1. 连接复用
- 避免重复连接同一服务器
- 正确处理连接状态检查

### 2. 资源清理
- 组件销毁时正确断开连接
- 清理事件监听器和定时器

### 3. 显示优化
- 合理设置显示分辨率
- 根据网络状况调整图像质量

## 浏览器兼容性

### 支持的浏览器
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 必需的浏览器功能
- WebSocket 支持
- Canvas 2D 渲染
- Clipboard API (用于剪贴板同步)
- File API (用于文件传输)

## 安全考虑

### 1. WebSocket 安全
- 使用 WSS (WebSocket Secure) 进行加密传输
- 验证服务器证书

### 2. 剪贴板权限
- 需要用户授权才能访问剪贴板
- 处理权限被拒绝的情况

### 3. 文件传输
- 验证文件类型和大小
- 防止恶意文件上传

## 故障排除

### 1. 连接问题
- 检查 WebSocket URL 是否正确
- 确认服务器端 Guacamole 服务正常运行
- 检查防火墙和代理设置

### 2. 显示问题
- 确认 Canvas 元素正确创建
- 检查显示尺寸设置
- 验证图像数据格式

### 3. 输入问题
- 确认鼠标和键盘事件正确绑定
- 检查焦点状态
- 验证事件传递链路

## 开发调试

### 启用调试日志
```typescript
// 在浏览器控制台中启用详细日志
localStorage.setItem('guacamole-debug', 'true');
```

### 监控连接状态
```typescript
// 定期检查连接状态
setInterval(() => {
  console.log('连接状态:', client.getState());
}, 5000);
```

## 扩展功能

### 1. 自定义快捷键
```typescript
// 添加自定义键盘快捷键处理
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'c') {
    // 处理 Ctrl+C
    handleCopy();
  }
});
```

### 2. 文件拖放
```typescript
// 设置文件拖放功能
setupFileDrop(canvasElement, client);
```

### 3. 自动调整尺寸
```typescript
// 根据容器大小自动调整显示尺寸
const cleanup = autoResizeDisplay(client, containerElement);
```

这个实现提供了完整的 RDP/VNC 远程桌面功能，具有良好的用户体验和稳定的性能表现。
