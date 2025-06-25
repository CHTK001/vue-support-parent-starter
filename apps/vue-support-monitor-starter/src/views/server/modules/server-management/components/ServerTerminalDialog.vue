<template>
  <el-dialog
    v-model="visible"
    :title="`${serverData.monitorSysGenServerName} - 终端`"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    :fullscreen="isFullscreen"
    class="terminal-dialog"
  >
    <template #header="{ titleId, titleClass }">
      <div class="terminal-header">
        <div :id="titleId" :class="titleClass" class="terminal-title">
          <IconifyIconOnline :icon="getProtocolIcon(serverData.monitorSysGenServerProtocol)" class="mr-2" />
          {{ serverData.monitorSysGenServerName }} - 终端
          <el-tag size="small" class="ml-2">{{ serverData.monitorSysGenServerProtocol }}</el-tag>
        </div>
        <div class="terminal-actions">
          <el-button-group>
            <el-button size="small" @click="handleClear">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              清屏
            </el-button>
            <el-button size="small" @click="handleReconnect" :loading="connecting">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              重连
            </el-button>
            <el-button size="small" @click="toggleFullscreen">
              <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" class="mr-1" />
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="terminal-container" :class="{ 'fullscreen': isFullscreen }">
      <!-- SSH 终端 -->
      <div
        v-if="serverData.monitorSysGenServerProtocol === 'SSH'"
        ref="terminalRef"
        class="terminal-wrapper ssh-terminal"
      ></div>

      <!-- RDP 远程桌面 -->
      <div
        v-else-if="serverData.monitorSysGenServerProtocol === 'RDP'"
        class="terminal-wrapper rdp-terminal"
      >
        <canvas
          ref="rdpCanvasRef"
          class="rdp-canvas"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
          tabindex="0"
        ></canvas>
        <div class="rdp-status">
          <el-tag :type="connectionStatus === 'connected' ? 'success' : 'info'">
            {{ connectionStatus === 'connected' ? '已连接' : '未连接' }}
          </el-tag>
          <span class="ml-2">分辨率: {{ rdpConfig.width }}x{{ rdpConfig.height }}</span>
        </div>
      </div>

      <!-- VNC 远程桌面 -->
      <div
        v-else-if="serverData.monitorSysGenServerProtocol === 'VNC'"
        class="terminal-wrapper vnc-terminal"
      >
        <canvas
          ref="vncCanvasRef"
          class="vnc-canvas"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
          tabindex="0"
        ></canvas>
        <div class="vnc-status">
          <el-tag :type="connectionStatus === 'connected' ? 'success' : 'info'">
            {{ connectionStatus === 'connected' ? '已连接' : '未连接' }}
          </el-tag>
          <span class="ml-2">只读模式: {{ vncConfig.readOnly ? '是' : '否' }}</span>
        </div>
      </div>

      <!-- 连接状态 -->
      <div v-if="!isConnected" class="connection-overlay">
        <div class="connection-content">
          <el-icon class="connection-icon" :size="48">
            <Loading v-if="connecting" />
            <Warning v-else />
          </el-icon>
          <div class="connection-text">
            {{ connecting ? '正在连接...' : '连接已断开' }}
          </div>
          <el-button v-if="!connecting" type="primary" @click="handleConnect">
            重新连接
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="terminal-footer">
        <div class="connection-info">
          <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
          <span class="ml-2">{{ serverData.monitorSysGenServerHost }}:{{ serverData.monitorSysGenServerPort }}</span>
        </div>
        <div class="footer-actions">
          <el-button @click="visible = false">关闭</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import {
  connectServer,
  disconnectServer,
  sendServerData,
  resizeServerTerminal,
  protocolIconMap,
} from "@/api/server";
import { getWebSocketUrl } from "@/api/config";

// 响应式状态
const visible = ref(false);
const connecting = ref(false);
const isConnected = ref(false);
const isFullscreen = ref(false);
const connectionStatus = ref("disconnected");

// 数据
const serverData = reactive<any>({});

// 终端相关
const terminalRef = ref();
const rdpCanvasRef = ref();
const vncCanvasRef = ref();
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let websocket: WebSocket | null = null;

// RDP 配置
const rdpConfig = reactive({
  width: 1024,
  height: 768,
  colorDepth: 24,
});

// VNC 配置
const vncConfig = reactive({
  readOnly: false,
});

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  return protocolIconMap[protocol as keyof typeof protocolIconMap] || "ri:server-line";
};

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
  nextTick(() => {
    initTerminal();
  });
};

/**
 * 设置数据
 */
const setData = (data: any) => {
  Object.assign(serverData, data);
  
  // 设置协议特定配置
  if (data.monitorSysGenServerProtocol === "RDP") {
    rdpConfig.width = data.monitorSysGenServerWidth || 1024;
    rdpConfig.height = data.monitorSysGenServerHeight || 768;
    rdpConfig.colorDepth = data.monitorSysGenServerColorDepth || 24;
  } else if (data.monitorSysGenServerProtocol === "VNC") {
    vncConfig.readOnly = data.monitorSysGenServerReadOnly || false;
  }
};

/**
 * 初始化终端
 */
const initTerminal = () => {
  if (serverData.monitorSysGenServerProtocol === "SSH") {
    initSSHTerminal();
  } else if (serverData.monitorSysGenServerProtocol === "RDP") {
    initRDPTerminal();
  } else if (serverData.monitorSysGenServerProtocol === "VNC") {
    initVNCTerminal();
  }
};

/**
 * 初始化 SSH 终端
 */
const initSSHTerminal = () => {
  if (!terminalRef.value) return;

  // 创建终端实例
  terminal = new Terminal({
    theme: {
      background: "#1e1e1e",
      foreground: "#ffffff",
      cursor: "#ffffff",
      selection: "#3a3a3a",
    },
    fontSize: 14,
    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
    cursorBlink: true,
    allowTransparency: true,
  });

  // 添加插件
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(new WebLinksAddon());

  // 挂载到 DOM
  terminal.open(terminalRef.value);
  fitAddon.fit();

  // 连接 WebSocket
  connectWebSocket();

  // 监听终端输入
  terminal.onData((data) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: "input",
        data: data,
      }));
    }
  });

  // 监听终端大小变化
  terminal.onResize(({ cols, rows }) => {
    if (serverData.monitorSysGenServerId) {
      resizeServerTerminal(String(serverData.monitorSysGenServerId), cols, rows);
    }
  });
};

/**
 * 初始化 RDP 终端
 */
const initRDPTerminal = () => {
  if (!rdpCanvasRef.value) return;

  const canvas = rdpCanvasRef.value;
  canvas.width = rdpConfig.width;
  canvas.height = rdpConfig.height;

  // 连接 RDP WebSocket
  connectRDPWebSocket();
};

/**
 * 初始化 VNC 终端
 */
const initVNCTerminal = () => {
  if (!vncCanvasRef.value) return;

  const canvas = vncCanvasRef.value;
  
  // 连接 VNC WebSocket
  connectVNCWebSocket();
};

/**
 * 连接 SSH WebSocket
 */
const connectWebSocket = () => {
  const wsUrl = getWebSocketUrl(
    "/socket/ssh",
    `id=${serverData.monitorSysGenServerId}&type=ssh`
  );

  websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    isConnected.value = true;
    connectionStatus.value = "connected";
    message.success("终端连接成功");
  };

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "output" && terminal) {
        terminal.write(data.data);
      }
    } catch (error) {
      // 直接输出文本数据
      if (terminal) {
        terminal.write(event.data);
      }
    }
  };

  websocket.onclose = () => {
    isConnected.value = false;
    connectionStatus.value = "disconnected";
    message.warning("终端连接已断开");
  };

  websocket.onerror = (error) => {
    isConnected.value = false;
    connectionStatus.value = "error";
    message.error("终端连接出错");
    console.error("WebSocket error:", error);
  };
};

/**
 * 连接 RDP WebSocket
 */
const connectRDPWebSocket = () => {
  const wsUrl = getWebSocketUrl(
    "/websocket/rdp",
    `id=${serverData.monitorSysGenServerId}`
  );

  websocket = new WebSocket(wsUrl);
  websocket.binaryType = "arraybuffer";

  websocket.onopen = () => {
    isConnected.value = true;
    connectionStatus.value = "connected";
    message.success("RDP 连接成功");
  };

  websocket.onmessage = (event) => {
    // 处理 RDP 图像数据
    if (event.data instanceof ArrayBuffer) {
      renderRDPFrame(event.data);
    }
  };

  websocket.onclose = () => {
    isConnected.value = false;
    connectionStatus.value = "disconnected";
    message.warning("RDP 连接已断开");
  };

  websocket.onerror = (error) => {
    isConnected.value = false;
    connectionStatus.value = "error";
    message.error("RDP 连接出错");
    console.error("RDP WebSocket error:", error);
  };
};

/**
 * 连接 VNC WebSocket
 */
const connectVNCWebSocket = () => {
  const wsUrl = getWebSocketUrl(
    "/websocket/vnc",
    `id=${serverData.monitorSysGenServerId}`
  );

  websocket = new WebSocket(wsUrl);
  websocket.binaryType = "arraybuffer";

  websocket.onopen = () => {
    isConnected.value = true;
    connectionStatus.value = "connected";
    message.success("VNC 连接成功");
  };

  websocket.onmessage = (event) => {
    // 处理 VNC 图像数据
    if (event.data instanceof ArrayBuffer) {
      renderVNCFrame(event.data);
    }
  };

  websocket.onclose = () => {
    isConnected.value = false;
    connectionStatus.value = "disconnected";
    message.warning("VNC 连接已断开");
  };

  websocket.onerror = (error) => {
    isConnected.value = false;
    connectionStatus.value = "error";
    message.error("VNC 连接出错");
    console.error("VNC WebSocket error:", error);
  };
};

/**
 * 渲染 RDP 帧
 */
const renderRDPFrame = (data: ArrayBuffer) => {
  if (!rdpCanvasRef.value) return;

  const canvas = rdpCanvasRef.value;
  const ctx = canvas.getContext("2d");

  // 这里应该解析 RDP 协议的图像数据
  // 实际实现需要根据后端返回的数据格式进行解析
  console.log("Received RDP frame data:", data.byteLength);
};

/**
 * 渲染 VNC 帧
 */
const renderVNCFrame = (data: ArrayBuffer) => {
  if (!vncCanvasRef.value) return;

  const canvas = vncCanvasRef.value;
  const ctx = canvas.getContext("2d");

  // 这里应该解析 VNC 协议的图像数据
  // 实际实现需要根据后端返回的数据格式进行解析
  console.log("Received VNC frame data:", data.byteLength);
};

/**
 * 处理鼠标事件
 */
const handleMouseDown = (event: MouseEvent) => {
  if (!isConnected.value || !websocket) return;

  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  websocket.send(JSON.stringify({
    type: "mouse",
    action: "down",
    button: event.button,
    x: Math.floor(x),
    y: Math.floor(y),
  }));
};

const handleMouseUp = (event: MouseEvent) => {
  if (!isConnected.value || !websocket) return;

  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  websocket.send(JSON.stringify({
    type: "mouse",
    action: "up",
    button: event.button,
    x: Math.floor(x),
    y: Math.floor(y),
  }));
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isConnected.value || !websocket) return;

  const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  websocket.send(JSON.stringify({
    type: "mouse",
    action: "move",
    x: Math.floor(x),
    y: Math.floor(y),
  }));
};

/**
 * 处理键盘事件
 */
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isConnected.value || !websocket) return;

  event.preventDefault();

  websocket.send(JSON.stringify({
    type: "key",
    action: "down",
    key: event.key,
    code: event.code,
    keyCode: event.keyCode,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
  }));
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (!isConnected.value || !websocket) return;

  event.preventDefault();

  websocket.send(JSON.stringify({
    type: "key",
    action: "up",
    key: event.key,
    code: event.code,
    keyCode: event.keyCode,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
  }));
};

/**
 * 清屏
 */
const handleClear = () => {
  if (terminal) {
    terminal.clear();
  }
};

/**
 * 重新连接
 */
const handleReconnect = async () => {
  try {
    connecting.value = true;

    // 断开现有连接
    if (websocket) {
      websocket.close();
    }

    // 重新连接服务器
    const res = await connectServer(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      // 重新初始化终端
      await nextTick();
      initTerminal();
      message.success("重连成功");
    } else {
      message.error(res.msg || "重连失败");
    }
  } catch (error) {
    message.error("重连异常，请稍后重试");
    console.error("重连出错:", error);
  } finally {
    connecting.value = false;
  }
};

/**
 * 连接服务器
 */
const handleConnect = () => {
  handleReconnect();
};

/**
 * 切换全屏
 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  nextTick(() => {
    if (fitAddon) {
      fitAddon.fit();
    }
  });
};

/**
 * 清理资源
 */
const cleanup = () => {
  if (websocket) {
    websocket.close();
    websocket = null;
  }

  if (terminal) {
    terminal.dispose();
    terminal = null;
  }

  fitAddon = null;
};

// 生命周期
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener("resize", () => {
    if (fitAddon) {
      fitAddon.fit();
    }
  });
});

onUnmounted(() => {
  cleanup();
});

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
.terminal-dialog {
  :deep(.el-dialog) {
    margin: 0;
    border-radius: 8px;

    &.is-fullscreen {
      border-radius: 0;
    }
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(100vh - 200px);

    .is-fullscreen & {
      height: calc(100vh - 120px);
    }
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .terminal-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
  }

  .terminal-actions {
    display: flex;
    align-items: center;
  }
}

.terminal-container {
  height: 100%;
  position: relative;
  background-color: #1e1e1e;

  &.fullscreen {
    height: calc(100vh - 120px);
  }

  .terminal-wrapper {
    width: 100%;
    height: 100%;
    position: relative;

    &.ssh-terminal {
      padding: 8px;

      :deep(.xterm) {
        height: 100% !important;
      }

      :deep(.xterm-viewport) {
        background-color: transparent !important;
      }
    }

    &.rdp-terminal,
    &.vnc-terminal {
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;

      .rdp-canvas,
      .vnc-canvas {
        flex: 1;
        background-color: white;
        cursor: crosshair;

        &:focus {
          outline: 2px solid var(--el-color-primary);
          outline-offset: -2px;
        }
      }

      .rdp-status,
      .vnc-status {
        padding: 8px 16px;
        background-color: var(--el-bg-color);
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        align-items: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .connection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    .connection-content {
      text-align: center;
      color: white;

      .connection-icon {
        margin-bottom: 16px;
        color: var(--el-color-warning);
      }

      .connection-text {
        font-size: 16px;
        margin-bottom: 20px;
      }
    }
  }
}

.terminal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .connection-info {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .footer-actions {
    display: flex;
    gap: 12px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .terminal-dialog {
    :deep(.el-dialog) {
      width: 100% !important;
      margin: 0;
      border-radius: 0;
      height: 100vh;
    }

    :deep(.el-dialog__body) {
      height: calc(100vh - 140px);
    }
  }

  .terminal-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;

    .terminal-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
