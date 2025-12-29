<template>
  <div class="native-remote-desktop">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-tag :type="connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'danger'" effect="light">
          <IconifyIconOnline :icon="getStatusIcon()" class="mr-1" />
          {{ getStatusText() }}
        </el-tag>
        <span v-if="server" class="server-info">
          {{ server.monitorSysGenServerName }} ({{ server.monitorSysGenServerHost }}:{{ remotePort }})
        </span>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-tooltip content="重新连接" placement="bottom">
            <el-button size="small" @click="reconnect" :disabled="connectionStatus === 'connecting'">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏" placement="bottom">
            <el-button size="small" @click="toggleFullscreen">
              <IconifyIconOnline icon="ri:fullscreen-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="截图" placement="bottom">
            <el-button size="small" @click="takeScreenshot">
              <IconifyIconOnline icon="ri:camera-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="关闭" placement="bottom">
            <el-button size="small" type="danger" @click="handleClose">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>
    </div>

    <!-- 远程桌面画布 -->
    <div ref="canvasContainer" class="canvas-container" @contextmenu.prevent>
      <canvas
        ref="screenCanvas"
        class="remote-screen"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
        @wheel="handleMouseWheel"
        @keydown="handleKeyDown"
        @keyup="handleKeyUp"
        tabindex="0"
      />
      
      <!-- 加载中 -->
      <div v-if="connectionStatus === 'connecting'" class="loading-overlay">
        <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
        <p>正在连接远程桌面...</p>
      </div>
      
      <!-- 连接失败 -->
      <div v-if="connectionStatus === 'disconnected' && errorMessage" class="error-overlay">
        <el-icon :size="48"><CircleClose /></el-icon>
        <p>{{ errorMessage }}</p>
        <el-button type="primary" @click="reconnect">重新连接</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { message } from "@repo/utils";
import { useSocketService, type SocketTemplate } from "@repo/core";
import { RemoteTopics } from "@repo/core";

interface Props {
  /** 服务器信息 */
  server?: {
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerPort: number;
    monitorSysGenServerProtocol?: string;
    monitorSysGenServerUsername?: string;
    monitorSysGenServerPassword?: string;
  };
}

interface Emits {
  (e: 'close'): void;
  (e: 'connected'): void;
  (e: 'disconnected'): void;
  (e: 'fallback-ssh'): void; // 降级到 SSH 模式
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const errorMessage = ref<string>('');
const screenCanvas = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);

// Socket 服务
let socketService: SocketTemplate | null = null;

// 远程桌面默认端口（utils-support-remote-starter 的 agent 端口）
const remotePort = computed(() => {
  // 使用服务器配置的端口，或默认 8899
  return props.server?.monitorSysGenServerPort || 8899;
});

// 连接远程桌面
const connect = () => {
  if (!props.server) {
    errorMessage.value = '未提供服务器信息';
    return;
  }
  
  connectionStatus.value = 'connecting';
  errorMessage.value = '';
  
  try {
    // 获取全局 Socket 服务
    socketService = useSocketService();
    
    if (!socketService) {
      errorMessage.value = 'Socket 服务不可用';
      connectionStatus.value = 'disconnected';
      return;
    }
    
    // 注册事件监听
    setupSocketListeners();
    
    // 发送连接请求
    socketService.emit(RemoteTopics.DESKTOP.CONNECT, JSON.stringify({
      serverId: props.server.monitorSysGenServerId
    }));
    
    console.log('发送远程桌面连接请求:', props.server.monitorSysGenServerId);
    
  } catch (error) {
    console.error('连接失败:', error);
    connectionStatus.value = 'disconnected';
    errorMessage.value = '连接失败: ' + (error as Error).message;
  }
};

// 设置 Socket 事件监听
const setupSocketListeners = () => {
  if (!socketService) return;
  
  // 连接成功
  socketService.on(RemoteTopics.DESKTOP.CONNECTED, (data: string) => {
    try {
      const msg = JSON.parse(data);
      console.log('远程桌面连接成功:', msg);
      connectionStatus.value = 'connected';
      emit('connected');
      
      const mode = msg.data?.mode || 'DESKTOP';
      message(`远程桌面连接成功 (${mode} 模式)`, { type: 'success' });
      
      // 如果是 SSH 模式，降级到 SSH 终端
      if (mode === 'SSH') {
        message('检测到 SSH 模式，正在切换到终端...', { type: 'warning' });
        emit('fallback-ssh');
      }
    } catch (e) {
      console.error('解析连接响应失败:', e);
    }
  });
  
  // 屏幕数据（二进制）
  socketService.on(RemoteTopics.DESKTOP.SCREEN, (data: ArrayBuffer | string) => {
    if (data instanceof ArrayBuffer) {
      handleScreenData(data);
    } else if (typeof data === 'string') {
      // Base64 编码的图像数据
      handleBase64ScreenData(data);
    }
  });
  
  // 模式检测
  socketService.on(RemoteTopics.DESKTOP.MODE_DETECTED, (data: string) => {
    try {
      const msg = JSON.parse(data);
      const mode = msg.data?.mode;
      console.log('检测到模式:', mode);
      
      if (mode === 'SSH') {
        message('检测到 SSH 模式，正在切换到终端...', { type: 'warning' });
        emit('fallback-ssh');
      }
    } catch (e) {
      console.error('解析模式检测消息失败:', e);
    }
  });
  
  // 断开连接
  socketService.on(RemoteTopics.DESKTOP.DISCONNECTED, (data: string) => {
    console.log('远程桌面连接断开:', data);
    connectionStatus.value = 'disconnected';
    emit('disconnected');
  });
  
  // 错误
  socketService.on(RemoteTopics.DESKTOP.ERROR, (data: string) => {
    try {
      const msg = JSON.parse(data);
      console.error('远程桌面错误:', msg);
      errorMessage.value = msg.msg || msg.message || '连接错误';
    } catch (e) {
      errorMessage.value = data || '连接错误';
    }
  });
};

// 移除 Socket 事件监听
const removeSocketListeners = () => {
  if (!socketService) return;
  
  socketService.off(RemoteTopics.DESKTOP.CONNECTED);
  socketService.off(RemoteTopics.DESKTOP.SCREEN);
  socketService.off(RemoteTopics.DESKTOP.MODE_DETECTED);
  socketService.off(RemoteTopics.DESKTOP.DISCONNECTED);
  socketService.off(RemoteTopics.DESKTOP.ERROR);
};

// 处理 Base64 编码的屏幕数据
const handleBase64ScreenData = (base64Data: string) => {
  if (!screenCanvas.value) return;
  
  const ctx = screenCanvas.value.getContext('2d');
  if (!ctx) return;
  
  try {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    handleScreenData(bytes.buffer);
  } catch (e) {
    console.error('解析 Base64 屏幕数据失败:', e);
  }
};

// 处理屏幕数据（二进制图片数据）
// 后端格式: [4字节格式长度][格式字符串如"png"][图像数据]
const handleScreenData = (data: ArrayBuffer) => {
  if (!screenCanvas.value) return;
  
  const ctx = screenCanvas.value.getContext('2d');
  if (!ctx) return;
  
  try {
    const dataView = new DataView(data);
    
    // 读取格式长度（Big Endian 4字节）
    const formatLength = dataView.getInt32(0);
    
    // 验证格式长度合理性
    if (formatLength <= 0 || formatLength > 20 || formatLength + 4 > data.byteLength) {
      // 如果格式长度不合理，尝试直接作为PNG处理（兼容旧格式）
      console.debug('尝试直接解析为PNG图片');
      renderImage(data, 'image/png', ctx);
      return;
    }
    
    // 读取格式字符串
    const formatBytes = new Uint8Array(data, 4, formatLength);
    const format = new TextDecoder().decode(formatBytes);
    
    // 提取图像数据
    const imageData = data.slice(4 + formatLength);
    
    // 根据格式确定MIME类型
    const mimeType = format === 'png' ? 'image/png' : 
                     format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 
                     'image/png';
    
    renderImage(imageData, mimeType, ctx);
  } catch (e) {
    console.error('解析屏幕数据失败:', e);
    // 降级尝试直接解析
    renderImage(data, 'image/png', ctx);
  }
};

// 渲染图像到画布
const renderImage = (imageData: ArrayBuffer, mimeType: string, ctx: CanvasRenderingContext2D) => {
  const blob = new Blob([imageData], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  img.onload = () => {
    // 调整画布大小
    if (screenCanvas.value) {
      if (screenCanvas.value.width !== img.width || screenCanvas.value.height !== img.height) {
        screenCanvas.value.width = img.width;
        screenCanvas.value.height = img.height;
      }
      ctx.drawImage(img, 0, 0);
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error('图片加载失败');
  };
  img.src = url;
};


// 鼠标事件处理
const getMousePosition = (event: MouseEvent) => {
  if (!screenCanvas.value) return { x: 0, y: 0 };
  
  const rect = screenCanvas.value.getBoundingClientRect();
  const scaleX = screenCanvas.value.width / rect.width;
  const scaleY = screenCanvas.value.height / rect.height;
  
  return {
    x: Math.round((event.clientX - rect.left) * scaleX),
    y: Math.round((event.clientY - rect.top) * scaleY)
  };
};

const handleMouseMove = (event: MouseEvent) => {
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  const pos = getMousePosition(event);
  socketService.emit(RemoteTopics.DESKTOP.MOUSE_MOVE, JSON.stringify({
    x: pos.x,
    y: pos.y
  }));
};

const handleMouseDown = (event: MouseEvent) => {
  screenCanvas.value?.focus();
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  const pos = getMousePosition(event);
  socketService.emit(RemoteTopics.DESKTOP.MOUSE_CLICK, JSON.stringify({
    x: pos.x,
    y: pos.y,
    button: event.button,
    pressed: true
  }));
};

const handleMouseUp = (event: MouseEvent) => {
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  const pos = getMousePosition(event);
  socketService.emit(RemoteTopics.DESKTOP.MOUSE_CLICK, JSON.stringify({
    x: pos.x,
    y: pos.y,
    button: event.button,
    pressed: false
  }));
};

const handleMouseWheel = (event: WheelEvent) => {
  event.preventDefault();
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  const pos = getMousePosition(event);
  socketService.emit(RemoteTopics.DESKTOP.MOUSE_WHEEL, JSON.stringify({
    x: pos.x,
    y: pos.y,
    amount: Math.sign(event.deltaY) * -3
  }));
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  event.preventDefault();
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  socketService.emit(RemoteTopics.DESKTOP.KEY_PRESS, JSON.stringify({
    keyCode: event.keyCode,
    keyChar: event.key,
    modifiers: getModifiers(event)
  }));
};

const handleKeyUp = (event: KeyboardEvent) => {
  event.preventDefault();
  if (!socketService || connectionStatus.value !== 'connected') return;
  
  socketService.emit(RemoteTopics.DESKTOP.KEY_RELEASE, JSON.stringify({
    keyCode: event.keyCode,
    keyChar: event.key,
    modifiers: getModifiers(event)
  }));
};

const getModifiers = (event: KeyboardEvent) => {
  let modifiers = 0;
  if (event.shiftKey) modifiers |= 1;
  if (event.ctrlKey) modifiers |= 2;
  if (event.altKey) modifiers |= 8;
  if (event.metaKey) modifiers |= 4;
  return modifiers;
};

// 工具栏方法
const reconnect = () => {
  disconnect();
  setTimeout(connect, 500);
};

const disconnect = () => {
  if (socketService && props.server) {
    socketService.emit(RemoteTopics.DESKTOP.DISCONNECT, JSON.stringify({
      serverId: props.server.monitorSysGenServerId
    }));
  }
  removeSocketListeners();
  connectionStatus.value = 'disconnected';
};

const toggleFullscreen = () => {
  if (!canvasContainer.value) return;
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    canvasContainer.value.requestFullscreen();
  }
};

const takeScreenshot = () => {
  if (!screenCanvas.value) return;
  
  const link = document.createElement('a');
  link.download = `screenshot-${Date.now()}.png`;
  link.href = screenCanvas.value.toDataURL('image/png');
  link.click();
  
  message('截图已保存', { type: 'success' });
};

const handleClose = () => {
  disconnect();
  emit('close');
};

// 状态显示
const getStatusIcon = () => {
  switch (connectionStatus.value) {
    case 'connected': return 'ri:link';
    case 'connecting': return 'ri:loader-4-line';
    default: return 'ri:link-unlink';
  }
};

const getStatusText = () => {
  switch (connectionStatus.value) {
    case 'connected': return '已连接';
    case 'connecting': return '连接中...';
    default: return '未连接';
  }
};

// 生命周期
onMounted(() => {
  connect();
});

onUnmounted(() => {
  disconnect();
});

// 监听服务器变化
watch(() => props.server, () => {
  reconnect();
}, { deep: true });

// 暴露方法
defineExpose({
  reconnect,
  disconnect,
  connect,
});
</script>

<style scoped lang="scss">
.native-remote-desktop {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .server-info {
        color: #b0b0b0;
        font-size: 13px;
      }
    }
  }
  
  .canvas-container {
    flex: 1;
    position: relative;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .remote-screen {
      max-width: 100%;
      max-height: 100%;
      cursor: default;
      outline: none;
      
      &:focus {
        outline: 2px solid var(--el-color-primary);
      }
    }
    
    .loading-overlay,
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      gap: 16px;
      
      .loading-icon {
        animation: spin 1s linear infinite;
      }
      
      p {
        font-size: 16px;
        margin: 0;
      }
    }
    
    .error-overlay {
      color: #ff6b6b;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
