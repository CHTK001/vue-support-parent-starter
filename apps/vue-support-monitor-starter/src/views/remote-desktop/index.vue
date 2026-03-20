<template>
  <div class="remote-desktop-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <ScBreadcrumb separator="/">
        <ScBreadcrumbItem>首页</ScBreadcrumbItem>
        <ScBreadcrumbItem>远程桌面</ScBreadcrumbItem>
      </ScBreadcrumb>
      <h1 class="page-title">远程桌面</h1>
      <p class="page-description">通过WebSocket连接远程桌面服务器</p>
    </div>

    <!-- 连接配置面板 -->
    <ScCard v-if="!isConnected" class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <ScIcon><Setting /></ScIcon>
          <span>连接配置</span>
        </div>
      </template>

      <ScForm :model="config" label-width="120px" class="config-form">
        <ScFormItem label="服务器ID">
          <ScInputNumber
            v-model="config.serverId"
            :min="1"
            placeholder="可选，服务器ID"
            style="width: 100%"
          />
        </ScFormItem>
        <ScFormItem label="服务器地址">
          <ScInput v-model="config.host" placeholder="localhost" clearable />
        </ScFormItem>
        <ScFormItem label="WebSocket端口">
          <ScInputNumber
            v-model="config.websocketPort"
            :min="1"
            :max="65535"
            placeholder="21117"
            style="width: 100%"
          />
        </ScFormItem>
        <ScFormItem>
          <ScButton
            type="primary"
            size="large"
            :loading="connecting"
            @click="connect"
          >
            <ScIcon><Connection /></ScIcon>
            连接
          </ScButton>
          <ScButton @click="loadDefaultConfig">加载默认配置</ScButton>
          <ScButton :loading="starting" @click="startService"
            >启动服务</el-button
          >
        </ScFormItem>
      </ScForm>
    </ScCard>

    <!-- 远程桌面显示区域 -->
    <div v-if="isConnected" class="desktop-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <ScTag type="success" effect="light">
            <ScIcon><CircleCheck /></ScIcon>
            已连接
          </ScTag>
          <span class="server-info">
            {{ config.host }}:{{ config.websocketPort }}
          </span>
          <ScTag v-if="fps > 0" type="info" effect="plain" size="small">
            FPS: {{ fps }}
          </ScTag>
          <ScTag v-if="latency > 0" type="info" effect="plain" size="small">
            延迟: {{ latency }}ms
          </ScTag>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <ScTooltip content="全屏" placement="bottom">
              <ScButton size="small" @click="toggleFullscreen">
                <ScIcon><FullScreen /></ScIcon>
              </ScButton>
            </ScTooltip>
            <ScTooltip content="截图" placement="bottom">
              <ScButton size="small" @click="takeScreenshot">
                <ScIcon><Camera /></ScIcon>
              </ScButton>
            </ScTooltip>
            <ScTooltip content="断开连接" placement="bottom">
              <ScButton size="small" type="danger" @click="disconnect">
                <ScIcon><Close /></ScIcon>
                断开
              </ScButton>
            </ScTooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 画布显示区域 -->
      <div ref="canvasContainer" class="canvas-container" @contextmenu.prevent>
        <canvas
          ref="remoteCanvas"
          class="remote-canvas"
          tabindex="0"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @wheel="handleWheel"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
        />

        <!-- 加载中 -->
        <div v-if="connecting" class="loading-overlay">
          <ScIcon class="loading-icon" :size="48"><Loading /></ScIcon>
          <p>正在连接远程桌面...</p>
        </div>

        <!-- 连接失败 -->
        <div v-if="errorMessage" class="error-overlay">
          <ScIcon :size="48"><CircleClose /></ScIcon>
          <p>{{ errorMessage }}</p>
          <ScButton type="primary" @click="reconnect">重新连接</ScButton>
        </div>
      </div>
    </div>

    <!-- 日志面板 -->
    <ScCard v-if="logs.length > 0" class="log-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <ScIcon><Document /></ScIcon>
          <span>连接日志</span>
          <ScButton type="text" size="small" @click="clearLogs"
            >清空</el-button
          >
        </div>
      </template>
      <div class="log-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-entry', `log-${log.type}`]"
        >
          [{{ log.time }}] {{ log.message }}
        </div>
      </div>
    </ScCard>
  </div>
</template>

<script setup lang="ts">
/**
 * 远程桌面客户端
 * @author CH
 * @date 2026-01-24
 */

import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { message } from "@repo/utils";
import {
  Setting,
  Connection,
  CircleCheck,
  FullScreen,
  Camera,
  Close,
  Loading,
  CircleClose,
  Document,
} from "@element-plus/icons-vue";
import {
  getRemoteDesktopConnectInfo,
  getRemoteDesktopStatus,
  startRemoteDesktopService,
  stopRemoteDesktopService,
} from "@/api/remote-desktop";

// 配置
const config = ref({
  serverId: undefined as number | undefined,
  host: "localhost",
  websocketPort: 21117,
});

// 状态
const isConnected = ref(false);
const connecting = ref(false);
const starting = ref(false);
const errorMessage = ref("");
const remoteCanvas = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const logs = ref<Array<{ time: string; message: string; type: string }>>([]);
const fps = ref(0);
const latency = ref(0);

// WebSocket相关
let websocket: WebSocket | null = null;
let frameCount = 0;
let lastFpsUpdateTime = Date.now();
let lastFrameTime = Date.now();

/**
 * 添加日志
 */
const addLog = (
  msg: string,
  type: "info" | "success" | "error" | "warn" = "info",
) => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message: msg,
    type,
  });
  if (logs.value.length > 100) {
    logs.value.shift();
  }
};

/**
 * 清空日志
 */
const clearLogs = () => {
  logs.value = [];
};

/**
 * 加载默认配置
 */
const loadDefaultConfig = async () => {
  try {
    const { data } = await getRemoteDesktopStatus();
    if (data.enabled) {
      config.value.host = data.defaultHost || "localhost";
      config.value.websocketPort = data.defaultWebSocketPort || 21117;
      addLog("已加载默认配置", "success");
    }
  } catch (error) {
    console.error("加载默认配置失败:", error);
  }
};

/**
 * 启动远程桌面服务
 */
const startService = async () => {
  if (starting.value) {
    return;
  }

  starting.value = true;
  try {
    const { data } = await startRemoteDesktopService({
      serverId: config.value.serverId,
      websocketPort: config.value.websocketPort,
      tcpPort: undefined,
    });

    if (data.enabled) {
      config.value.host = data.host;
      config.value.websocketPort = data.websocketPort;
      addLog("远程桌面服务启动成功", "success");
      message("远程桌面服务启动成功", { type: "success" });
    } else {
      throw new Error("远程桌面服务启动失败");
    }
  } catch (error: any) {
    addLog(`启动服务失败: ${error.message || "未知错误"}`, "error");
    message(`启动服务失败: ${error.message || "未知错误"}`, { type: "error" });
  } finally {
    starting.value = false;
  }
};

/**
 * 连接远程桌面
 */
const connect = async () => {
  if (connecting.value || isConnected.value) {
    return;
  }

  connecting.value = true;
  errorMessage.value = "";
  addLog("开始连接远程桌面...", "info");

  try {
    // 获取连接信息
    const { data } = await getRemoteDesktopConnectInfo({
      serverId: config.value.serverId,
      host: config.value.host,
      websocketPort: config.value.websocketPort,
    });

    if (!data.enabled) {
      throw new Error("远程桌面服务未启用");
    }

    addLog(`连接到 ${data.host}:${data.websocketPort}`, "info");

    // 连接WebSocket
    await connectWebSocket(data.websocketUrl);
  } catch (error: any) {
    errorMessage.value = error.message || "连接失败";
    addLog(`连接失败: ${errorMessage.value}`, "error");
    message(`连接失败: ${errorMessage.value}`, { type: "error" });
    connecting.value = false;
  }
};

/**
 * 连接WebSocket
 */
const connectWebSocket = async (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // 关闭旧连接
      if (websocket) {
        websocket.close();
        websocket = null;
      }

      // 创建WebSocket连接
      websocket = new WebSocket(url);

      websocket.onopen = () => {
        addLog("WebSocket连接成功", "success");
        isConnected.value = true;
        connecting.value = false;
        resolve();
      };

      websocket.onerror = (error) => {
        addLog(`WebSocket连接错误: ${error}`, "error");
        errorMessage.value = "WebSocket连接错误";
        connecting.value = false;
        reject(new Error("WebSocket连接错误"));
      };

      websocket.onclose = () => {
        addLog("WebSocket连接已断开", "warn");
        isConnected.value = false;
        connecting.value = false;
      };

      websocket.onmessage = (event) => {
        handleWebSocketMessage(event);
      };
    } catch (error: any) {
      reject(error);
    }
  });
};

/**
 * 处理WebSocket消息
 */
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    if (event.data instanceof Blob) {
      // 二进制数据，可能是图像帧
      event.data.arrayBuffer().then((buffer) => {
        handleImageFrame(buffer);
      });
    } else if (typeof event.data === "string") {
      // 文本消息，可能是JSON
      try {
        const data = JSON.parse(event.data);
        handleTextMessage(data);
      } catch (e) {
        addLog(`收到文本消息: ${event.data}`, "info");
      }
    }
  } catch (error: any) {
    addLog(`处理消息失败: ${error.message}`, "error");
  }
};

/**
 * 处理图像帧
 */
const handleImageFrame = (buffer: ArrayBuffer) => {
  if (!remoteCanvas.value) {
    return;
  }

  try {
    const canvas = remoteCanvas.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // 创建ImageData并绘制
    // 注意：这里需要根据实际的图像格式进行解析
    // 假设是RGBA格式，每像素4字节
    const imageData = new ImageData(
      new Uint8ClampedArray(buffer),
      canvas.width,
      canvas.height,
    );
    ctx.putImageData(imageData, 0, 0);

    // 更新FPS
    frameCount++;
    const now = Date.now();
    if (now - lastFpsUpdateTime >= 1000) {
      fps.value = frameCount;
      frameCount = 0;
      lastFpsUpdateTime = now;
    }

    // 计算延迟
    const frameTime = Date.now();
    latency.value = frameTime - lastFrameTime;
    lastFrameTime = frameTime;
  } catch (error: any) {
    addLog(`渲染图像失败: ${error.message}`, "error");
  }
};

/**
 * 处理文本消息
 */
const handleTextMessage = (data: any) => {
  if (data.type === "error") {
    addLog(`服务器错误: ${data.message}`, "error");
    errorMessage.value = data.message || "服务器错误";
  } else if (data.type === "info") {
    addLog(data.message || "收到服务器消息", "info");
  }
};

/**
 * 处理鼠标按下
 */
const handleMouseDown = (e: MouseEvent) => {
  if (!websocket || !remoteCanvas.value) {
    return;
  }

  const rect = remoteCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  sendInputEvent("mousedown", {
    button: e.button,
    x: Math.round(x),
    y: Math.round(y),
  });
};

/**
 * 处理鼠标抬起
 */
const handleMouseUp = (e: MouseEvent) => {
  if (!websocket || !remoteCanvas.value) {
    return;
  }

  const rect = remoteCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  sendInputEvent("mouseup", {
    button: e.button,
    x: Math.round(x),
    y: Math.round(y),
  });
};

/**
 * 处理鼠标移动
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!websocket || !remoteCanvas.value) {
    return;
  }

  const rect = remoteCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  sendInputEvent("mousemove", {
    x: Math.round(x),
    y: Math.round(y),
  });
};

/**
 * 处理滚轮
 */
const handleWheel = (e: WheelEvent) => {
  if (!websocket) {
    return;
  }

  sendInputEvent("wheel", {
    deltaX: e.deltaX,
    deltaY: e.deltaY,
  });
};

/**
 * 处理键盘按下
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (!websocket) {
    return;
  }

  sendInputEvent("keydown", {
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
  });
};

/**
 * 处理键盘抬起
 */
const handleKeyUp = (e: KeyboardEvent) => {
  if (!websocket) {
    return;
  }

  sendInputEvent("keyup", {
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
  });
};

/**
 * 发送输入事件
 */
const sendInputEvent = (type: string, data: any) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        type,
        data,
      }),
    );
  }
};

/**
 * 断开连接
 */
const disconnect = () => {
  if (websocket) {
    websocket.close();
    websocket = null;
  }

  if (remoteCanvas.value) {
    const ctx = remoteCanvas.value.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, remoteCanvas.value.width, remoteCanvas.value.height);
    }
  }

  isConnected.value = false;
  connecting.value = false;
  fps.value = 0;
  latency.value = 0;
  addLog("已断开连接", "info");
};

/**
 * 重新连接
 */
const reconnect = () => {
  disconnect();
  setTimeout(() => {
    connect();
  }, 1000);
};

/**
 * 全屏
 */
const toggleFullscreen = () => {
  if (!canvasContainer.value) {
    return;
  }

  if (!document.fullscreenElement) {
    canvasContainer.value.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

/**
 * 截图
 */
const takeScreenshot = () => {
  if (!remoteCanvas.value) {
    return;
  }

  remoteCanvas.value.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      addLog("截图已保存", "success");
    }
  });
};

// 组件卸载时断开连接
onUnmounted(() => {
  disconnect();
});

// 组件挂载时加载默认配置
onMounted(() => {
  loadDefaultConfig();
  nextTick(() => {
    if (remoteCanvas.value) {
      remoteCanvas.value.width = 1280;
      remoteCanvas.value.height = 720;
      remoteCanvas.value.focus();
    }
  });
});
</script>

<style scoped lang="scss">
.remote-desktop-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 8px 0;
  }

  .page-description {
    color: var(--el-text-color-regular);
    margin-top: 8px;
  }
}

.config-card {
  margin-bottom: 24px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .config-form {
    max-width: 600px;
  }
}

.desktop-container {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border-radius: 8px;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .server-info {
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }
  }

  .canvas-container {
    position: relative;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    min-height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;

    .remote-canvas {
      width: 100%;
      height: auto;
      max-height: 80vh;
      cursor: crosshair;
      outline: none;
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
      background: rgba(0, 0, 0, 0.7);
      color: white;

      .loading-icon {
        animation: rotate 2s linear infinite;
      }

      p {
        margin: 16px 0;
        font-size: 16px;
      }
    }
  }
}

.log-card {
  margin-top: 24px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .log-container {
    max-height: 300px;
    overflow-y: auto;
    font-family: "Courier New", monospace;
    font-size: 12px;

    .log-entry {
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 4px;

      &.log-info {
        color: #333;
        background: #f5f5f5;
      }

      &.log-success {
        color: #44aa44;
        background: #e8f5e9;
      }

      &.log-error {
        color: #cc0000;
        background: #ffebee;
      }

      &.log-warn {
        color: #ff8800;
        background: #fff3e0;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
