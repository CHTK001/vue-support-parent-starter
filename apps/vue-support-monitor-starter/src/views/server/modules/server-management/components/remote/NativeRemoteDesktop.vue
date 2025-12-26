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

// WebSocket 连接
let ws: WebSocket | null = null;

// 远程桌面默认端口（utils-support-remote-starter 的 agent 端口）
const remotePort = computed(() => {
  // 使用服务器配置的端口，或默认 8899
  return props.server?.monitorSysGenServerPort || 8899;
});

// 获取 WebSocket URL
const getWebSocketUrl = () => {
  const host = props.server?.monitorSysGenServerHost || 'localhost';
  const port = remotePort.value;
  const serverId = props.server?.monitorSysGenServerId;
  
  // 通过后端 WebSocket 代理连接
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  return `${wsProtocol}//${wsHost}/websocket/remote?serverId=${serverId}&host=${host}&port=${port}`;
};

// 连接远程桌面
const connect = () => {
  if (!props.server) {
    errorMessage.value = '未提供服务器信息';
    return;
  }
  
  connectionStatus.value = 'connecting';
  errorMessage.value = '';
  
  try {
    const wsUrl = getWebSocketUrl();
    console.log('连接远程桌面:', wsUrl);
    
    ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    
    ws.onopen = () => {
      console.log('WebSocket 连接已建立');
      connectionStatus.value = 'connected';
      emit('connected');
      message('远程桌面连接成功', { type: 'success' });
    };
    
    ws.onmessage = (event) => {
      handleScreenData(event.data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      errorMessage.value = '连接发生错误';
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket 连接关闭:', event.code, event.reason);
      connectionStatus.value = 'disconnected';
      
      // 4010 状态码表示需要降级到 SSH（Linux 无桌面环境）
      if (event.code === 4010 || event.reason === 'FALLBACK_SSH') {
        console.log('远程桌面不可用，降级到 SSH 模式');
        message('远程桌面不可用（可能是 Linux 无桌面环境），正在切换到 SSH 模式...', { type: 'warning' });
        emit('fallback-ssh');
        return;
      }
      
      if (event.code !== 1000) {
        errorMessage.value = event.reason || '连接已断开';
      }
      emit('disconnected');
    };
  } catch (error) {
    console.error('连接失败:', error);
    connectionStatus.value = 'disconnected';
    errorMessage.value = '连接失败: ' + (error as Error).message;
  }
};

// 处理屏幕数据
const handleScreenData = (data: ArrayBuffer) => {
  if (!screenCanvas.value) return;
  
  const ctx = screenCanvas.value.getContext('2d');
  if (!ctx) return;
  
  // 解析二进制数据包格式: [4字节格式长度][格式字符串][图像数据]
  const view = new DataView(data);
  const formatLen = view.getInt32(0);
  const formatBytes = new Uint8Array(data, 4, formatLen);
  const format = new TextDecoder().decode(formatBytes);
  const imageData = new Uint8Array(data, 4 + formatLen);
  
  // 创建 Blob 并渲染图像
  const blob = new Blob([imageData], { type: `image/${format}` });
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
  img.src = url;
};

// 发送二进制命令
const sendBinaryCommand = (type: number, ...data: number[]) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  const buffer = new ArrayBuffer(1 + data.length * 4);
  const view = new DataView(buffer);
  view.setUint8(0, type);
  
  let offset = 1;
  for (const value of data) {
    view.setInt32(offset, value);
    offset += 4;
  }
  
  ws.send(buffer);
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
  const pos = getMousePosition(event);
  sendBinaryCommand(1, pos.x, pos.y); // mouseMove
};

const handleMouseDown = (event: MouseEvent) => {
  screenCanvas.value?.focus();
  const pos = getMousePosition(event);
  // mouseClick: type=2, x, y, button, pressed(1)
  const buffer = new ArrayBuffer(14);
  const view = new DataView(buffer);
  view.setUint8(0, 2);
  view.setInt32(1, pos.x);
  view.setInt32(5, pos.y);
  view.setUint8(9, event.button);
  view.setUint8(10, 1); // pressed
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
};

const handleMouseUp = (event: MouseEvent) => {
  const pos = getMousePosition(event);
  const buffer = new ArrayBuffer(14);
  const view = new DataView(buffer);
  view.setUint8(0, 2);
  view.setInt32(1, pos.x);
  view.setInt32(5, pos.y);
  view.setUint8(9, event.button);
  view.setUint8(10, 0); // released
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
};

const handleMouseWheel = (event: WheelEvent) => {
  event.preventDefault();
  const pos = getMousePosition(event);
  // mouseWheel: type=3, x, y, amount
  const buffer = new ArrayBuffer(13);
  const view = new DataView(buffer);
  view.setUint8(0, 3);
  view.setInt32(1, pos.x);
  view.setInt32(5, pos.y);
  view.setInt32(9, Math.sign(event.deltaY) * -3);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  event.preventDefault();
  // keyPress: type=4, keyCode, keyChar, modifiers
  const buffer = new ArrayBuffer(11);
  const view = new DataView(buffer);
  view.setUint8(0, 4);
  view.setInt32(1, event.keyCode);
  view.setUint16(5, event.key.charCodeAt(0) || 0);
  view.setInt32(7, getModifiers(event));
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  event.preventDefault();
  // keyRelease: type=5, keyCode, keyChar, modifiers
  const buffer = new ArrayBuffer(11);
  const view = new DataView(buffer);
  view.setUint8(0, 5);
  view.setInt32(1, event.keyCode);
  view.setUint16(5, event.key.charCodeAt(0) || 0);
  view.setInt32(7, getModifiers(event));
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
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
  if (ws) {
    ws.close(1000, '用户断开连接');
    ws = null;
  }
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
