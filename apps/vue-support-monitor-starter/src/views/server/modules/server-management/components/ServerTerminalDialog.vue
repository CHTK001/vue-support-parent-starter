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
          <IconifyIconOnline
            :icon="getProtocolIcon(serverData.monitorSysGenServerProtocol)"
            class="mr-2"
          />
          {{ serverData.monitorSysGenServerName }} - 终端
          <el-tag size="small" class="ml-2">{{
            serverData.monitorSysGenServerProtocol
          }}</el-tag>
        </div>
        <div class="terminal-actions">
          <el-button-group>
            <el-button size="small" @click="handleClear">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              清屏
            </el-button>
            <el-button
              size="small"
              @click="handleReconnect"
              :loading="connecting"
            >
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              重连
            </el-button>
            <el-button size="small" @click="toggleFullscreen">
              <IconifyIconOnline
                :icon="
                  isFullscreen
                    ? 'ri:fullscreen-exit-line'
                    : 'ri:fullscreen-line'
                "
                class="mr-1"
              />
              {{ isFullscreen ? "退出全�? : "全屏" }}
            </el-button>
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="terminal-container" :class="{ fullscreen: isFullscreen }">
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
        <div ref="rdpDisplayRef" class="rdp-display" tabindex="0"></div>
        <div class="rdp-controls">
          <div class="rdp-status">
            <el-tag
              :type="connectionStatus === 'connected' ? 'success' : 'info'"
            >
              {{ connectionStatus === "connected" ? "已连�? : "未连�? }}
            </el-tag>
            <span class="ml-2"
              >分辨�? {{ rdpConfig.width }}x{{ rdpConfig.height }}</span
            >
          </div>
          <div class="rdp-actions">
            <el-button
              size="small"
              @click="handleClipboard('rdp')"
              :disabled="!isConnected"
            >
              <IconifyIconOnline icon="ep:document-copy" />
              剪贴�?
            </el-button>
            <el-button
              size="small"
              @click="handleScreenshot('rdp')"
              :disabled="!isConnected"
            >
              <IconifyIconOnline icon="ep:camera" />
              截图
            </el-button>
            <el-button
              size="small"
              @click="handleScreenResize(1024, 768, 'rdp')"
              :disabled="!isConnected"
            >
              <IconifyIconOnline icon="ep:full-screen" />
              调整尺寸
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDisconnect('rdp')"
              :disabled="!isConnected"
              >断开连接</el-button
            >
          </div>
        </div>
      </div>

      <!-- VNC 远程桌面 -->
      <div
        v-else-if="serverData.monitorSysGenServerProtocol === 'VNC'"
        class="terminal-wrapper vnc-terminal"
      >
        <div ref="vncDisplayRef" class="vnc-display" tabindex="0"></div>
        <div class="vnc-controls">
          <div class="vnc-status">
            <el-tag
              :type="connectionStatus === 'connected' ? 'success' : 'info'"
            >
              {{ connectionStatus === "connected" ? "已连�? : "未连�? }}
            </el-tag>
            <span class="ml-2"
              >只读模式: {{ vncConfig.readOnly ? "�? : "�? }}</span
            >
          </div>
          <div class="vnc-actions">
            <el-button
              size="small"
              @click="handleClipboard('vnc')"
              :disabled="!isConnected || vncConfig.readOnly"
            >
              <IconifyIconOnline icon="ep:document-copy" />
              剪贴�?
            </el-button>
            <el-button
              size="small"
              @click="handleScreenshot('vnc')"
              :disabled="!isConnected"
            >
              <IconifyIconOnline icon="ep:camera" />
              截图
            </el-button>
            <el-button
              size="small"
              @click="handleScreenResize(1024, 768, 'vnc')"
              :disabled="!isConnected"
            >
              <IconifyIconOnline icon="ep:full-screen" />
              调整尺寸
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDisconnect('vnc')"
              :disabled="!isConnected"
              >断开连接</el-button
            >
          </div>
        </div>
      </div>

      <!-- 连接状�?-->
      <div v-if="!isConnected" class="connection-overlay">
        <div class="connection-content">
          <IconifyIconOnline
            :icon="connecting ? 'ep:loading' : 'ep:warning'"
            class="connection-icon"
            :size="48"
          />
          <div class="connection-text">
            {{ connecting ? "正在连接..." : "连接已断开" }}
          </div>
          <el-button v-if="!connecting" type="primary" @click="handleConnect"
            >重新连接</el-button
          >
        </div>
      </div>
    </div>

    <template #footer>
      <div class="terminal-footer">
        <div class="connection-info">
          <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
            {{ isConnected ? "已连�? : "未连�? }}
          </el-tag>
          <span class="ml-2"
            >{{ serverData.monitorSysGenServerHost }}:{{
              serverData.monitorSysGenServerPort
            }}</span
          >
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
import {
  GuacamoleClientManager,
  GuacamoleState,
  getStateDescription,
  createWebSocketUrl,
  defaultGuacamoleConfig,
  setupFileDrop,
} from "@/utils/guacamole";

// 响应式状�?
const visible = ref(false);
const connecting = ref(false);
const isConnected = ref(false);
const isFullscreen = ref(false);
const connectionStatus = ref("disconnected");

// 数据
const serverData = reactive<any>({});

// 终端相关
const terminalRef = ref();
const rdpDisplayRef = ref();
const vncDisplayRef = ref();
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;

// SSH WebSocket 连接
let sshWebSocket: WebSocket | null = null;

// Guacamole 客户端管理器
let rdpClient: GuacamoleClientManager | null = null;
let vncClient: GuacamoleClientManager | null = null;

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
  return (
    protocolIconMap[protocol as keyof typeof protocolIconMap] ||
    "ri:server-line"
  );
};

/**
 * 打开对话�?
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
 * 初始化终�?
 */
const initTerminal = () => {
  // 清理现有 Guacamole 客户�?
  if (rdpClient) {
    rdpClient.disconnect();
    rdpClient = null;
  }
  if (vncClient) {
    vncClient.disconnect();
    vncClient = null;
  }

  if (serverData.monitorSysGenServerProtocol === "SSH") {
    initSSHTerminal();
  } else if (serverData.monitorSysGenServerProtocol === "RDP") {
    initRDPTerminal();
  } else if (serverData.monitorSysGenServerProtocol === "VNC") {
    initVNCTerminal();
  }
};

/**
 * 初始�?SSH 终端
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

  // 挂载�?DOM
  terminal.open(terminalRef.value);
  fitAddon.fit();

  // 连接 SSH WebSocket
  connectSSHWebSocket();

  // 监听终端输入
  terminal.onData((data) => {
    if (sshWebSocket && sshWebSocket.readyState === WebSocket.OPEN) {
      sshWebSocket.send(
        JSON.stringify({
          type: "input",
          data: data,
        })
      );
    }
  });

  // 监听终端大小变化
  terminal.onResize(({ cols, rows }) => {
    if (serverData.monitorSysGenServerId) {
      resizeServerTerminal(
        String(serverData.monitorSysGenServerId),
        cols,
        rows
      );
    }
  });
};

/**
 * 初始�?RDP 终端
 */
const initRDPTerminal = () => {
  if (!rdpDisplayRef.value) return;

  const display = rdpDisplayRef.value;

  // 设置显示容器尺寸
  display.style.width = `${rdpConfig.width}px`;
  display.style.height = `${rdpConfig.height}px`;

  // 创建 Guacamole 客户端管理器
  rdpClient = new GuacamoleClientManager(display);

  // 设置事件回调
  setupGuacamoleEventHandlers(rdpClient, "rdp");

  // 设置文件拖放
  setupFileDrop(display, rdpClient);

  // 连接 RDP WebSocket
  connectRDPWebSocket();
};

/**
 * 初始�?VNC 终端
 */
const initVNCTerminal = () => {
  if (!vncDisplayRef.value) return;

  const display = vncDisplayRef.value;

  // 设置显示容器尺寸（初始尺寸，会根据服务器调整�?
  display.style.width = `${rdpConfig.width}px`;
  display.style.height = `${rdpConfig.height}px`;

  // 创建 Guacamole 客户端管理器
  vncClient = new GuacamoleClientManager(display);

  // 设置事件回调
  setupGuacamoleEventHandlers(vncClient, "vnc");

  // 设置文件拖放
  setupFileDrop(display, vncClient);

  // 连接 VNC WebSocket
  connectVNCWebSocket();
};

/**
 * 连接 SSH WebSocket
 */
const connectSSHWebSocket = () => {
  const wsUrl = getWebSocketUrl(
    "/socket/ssh",
    `id=${serverData.monitorSysGenServerId}&type=ssh`
  );

  sshWebSocket = new WebSocket(wsUrl);

  sshWebSocket.onopen = () => {
    isConnected.value = true;
    connectionStatus.value = "connected";
    message.success("SSH 终端连接成功");
  };

  sshWebSocket.onmessage = (event) => {
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

  sshWebSocket.onclose = () => {
    isConnected.value = false;
    connectionStatus.value = "disconnected";
    message.warning("SSH 终端连接已断开");
  };

  sshWebSocket.onerror = (error) => {
    isConnected.value = false;
    connectionStatus.value = "error";
    message.error("SSH 终端连接出错");
    console.error("SSH WebSocket error:", error);
  };
};

/**
 * 连接 RDP WebSocket
 */
const connectRDPWebSocket = () => {
  if (!rdpClient) {
    message.error("RDP 客户端未初始�?);
    return;
  }

  // 防止重复连接
  if (rdpClient.isConnected()) {
    console.warn("RDP 客户端已连接，跳过重复连�?);
    return;
  }

  try {
    const wsUrl = createWebSocketUrl(
      "/websocket/rdp",
      "rdp",
      serverData.monitorSysGenServerId
    );

    // 使用 Guacamole 客户端连�?
    rdpClient.connect(wsUrl, {
      width: rdpConfig.width,
      height: rdpConfig.height,
      dpi: 96,
    });

    message.success("RDP 连接已启�?);
  } catch (error) {
    console.error("RDP 连接失败:", error);
    message.error("RDP 连接失败");
  }
};

/**
 * 连接 VNC WebSocket
 */
const connectVNCWebSocket = () => {
  if (!vncClient) {
    message.error("VNC 客户端未初始�?);
    return;
  }

  // 防止重复连接
  if (vncClient.isConnected()) {
    console.warn("VNC 客户端已连接，跳过重复连�?);
    return;
  }

  try {
    const wsUrl = createWebSocketUrl(
      "/websocket/vnc",
      "vnc",
      serverData.monitorSysGenServerId
    );

    // 使用 Guacamole 客户端连�?
    vncClient.connect(wsUrl, {
      width: rdpConfig.width,
      height: rdpConfig.height,
      dpi: 96,
    });

    message.success("VNC 连接已启�?);
  } catch (error) {
    console.error("VNC 连接失败:", error);
    message.error("VNC 连接失败");
  }
};

/**
 * 设置 Guacamole 事件处理�?
 */
const setupGuacamoleEventHandlers = (
  client: GuacamoleClientManager,
  protocol: "rdp" | "vnc"
) => {
  // 状态变化事�?
  client.setOnStateChange((state: number) => {
    const stateDesc = getStateDescription(state);
    console.log(`${protocol.toUpperCase()} 状态变�?`, stateDesc);

    switch (state) {
      case GuacamoleState.CONNECTING:
        connectionStatus.value = "connecting";
        message.info(`${protocol.toUpperCase()} 连接�?..`);
        break;
      case GuacamoleState.CONNECTED:
        isConnected.value = true;
        connectionStatus.value = "connected";
        message.success(`${protocol.toUpperCase()} 连接成功`);
        break;
      case GuacamoleState.DISCONNECTED:
        isConnected.value = false;
        connectionStatus.value = "disconnected";
        message.warning(`${protocol.toUpperCase()} 连接已断开`);
        break;
      case GuacamoleState.DISCONNECTING:
        connectionStatus.value = "disconnecting";
        break;
    }
  });

  // 错误事件
  client.setOnError((error: any) => {
    console.error(`${protocol.toUpperCase()} 错误:`, error);
    isConnected.value = false;
    connectionStatus.value = "error";
    message.error(
      `${protocol.toUpperCase()} 连接错误: ${error.message || "未知错误"}`
    );
  });

  // 剪贴板事�?
  client.setOnClipboard((data: string) => {
    console.log(`${protocol.toUpperCase()} 剪贴板数�?`, data);
    // 将远程剪贴板数据写入本地剪贴�?
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(data)
        .then(() => {
          message.success("剪贴板数据已同步到本�?);
        })
        .catch((error) => {
          console.error("写入本地剪贴板失�?", error);
        });
    }
  });
};

/**
 * 调整屏幕尺寸
 */
const handleScreenResize = (
  width: number,
  height: number,
  protocol: "rdp" | "vnc"
) => {
  const client = protocol === "rdp" ? rdpClient : vncClient;
  if (!client || !client.isConnected()) {
    message.warning(`${protocol.toUpperCase()} 未连接`);
    return;
  }

  try {
    client.resize(width, height);

    // 更新配置
    if (protocol === "rdp") {
      rdpConfig.width = width;
      rdpConfig.height = height;
    }

    message.success(
      `${protocol.toUpperCase()} 屏幕尺寸已调整为 ${width}x${height}`
    );
  } catch (error) {
    console.error("调整屏幕尺寸失败:", error);
    message.error("调整屏幕尺寸失败");
  }
};

/**
 * 处理剪贴�?
 */
const handleClipboard = async (protocol: "rdp" | "vnc") => {
  const client = protocol === "rdp" ? rdpClient : vncClient;
  if (!client || !client.isConnected()) {
    message.warning(`${protocol.toUpperCase()} 未连接`);
    return;
  }

  try {
    // 读取本地剪贴板内�?
    const text = await navigator.clipboard.readText();

    // 发送到远程
    client.sendClipboard(text);

    message.success("剪贴板内容已发送到远程");
  } catch (error) {
    message.error("读取剪贴板失败，请检查浏览器权限");
    console.error("剪贴板操作失�?", error);
  }
};

/**
 * 截图功能
 */
const handleScreenshot = (protocol: "rdp" | "vnc") => {
  const client = protocol === "rdp" ? rdpClient : vncClient;
  if (!client || !client.isConnected()) {
    message.warning(`${protocol.toUpperCase()} 未连接`);
    return;
  }

  try {
    const dataUrl = client.takeScreenshot();
    if (dataUrl) {
      // 创建下载链接
      const link = document.createElement("a");
      link.download = `${protocol}-screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      message.success("截图已保�?);
    } else {
      message.error("截图失败");
    }
  } catch (error) {
    console.error("截图失败:", error);
    message.error("截图失败");
  }
};

/**
 * 断开连接
 */
const handleDisconnect = (protocol: "rdp" | "vnc") => {
  const client = protocol === "rdp" ? rdpClient : vncClient;
  if (!client) return;

  try {
    client.disconnect();
    isConnected.value = false;
    connectionStatus.value = "disconnected";
    message.success(`${protocol.toUpperCase()} 连接已断开`);
  } catch (error) {
    console.error("断开连接失败:", error);
    message.error("断开连接失败");
  }
};

/**
 * 清屏
 */
const handleClear = () => {
  if (terminal) {
    terminal.clear();
  }

  // 重新连接 RDP/VNC 以清空显�?
  if (serverData.monitorSysGenServerProtocol === "RDP" && rdpClient) {
    rdpClient.disconnect();
    setTimeout(() => connectRDPWebSocket(), 1000);
  } else if (serverData.monitorSysGenServerProtocol === "VNC" && vncClient) {
    vncClient.disconnect();
    setTimeout(() => connectVNCWebSocket(), 1000);
  }
};

/**
 * 重新连接
 */
const handleReconnect = async () => {
  try {
    connecting.value = true;

    // 断开现有连接
    if (sshWebSocket) {
      sshWebSocket.close();
    }
    if (rdpClient) {
      rdpClient.disconnect();
    }
    if (vncClient) {
      vncClient.disconnect();
    }

    // 重新连接服务�?
    const res = await connectServer(String(serverData.monitorSysGenServerId));
    if (res.code === "00000") {
      // 重新初始化终�?
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
 * 连接服务�?
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
  // 清理 SSH WebSocket
  if (sshWebSocket) {
    sshWebSocket.close();
    sshWebSocket = null;
  }

  // 清理终端
  if (terminal) {
    terminal.dispose();
    terminal = null;
  }

  // 清理 Guacamole 客户�?
  if (rdpClient) {
    rdpClient.disconnect();
    rdpClient = null;
  }

  if (vncClient) {
    vncClient.disconnect();
    vncClient = null;
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
      background: var(--el-bg-color-overlay);

      .rdp-display,
      .vnc-display {
        flex: 1;
        background-color: var(--el-bg-color-overlay);
        cursor: crosshair;
        overflow: hidden;

        &:focus {
          outline: 2px solid var(--el-color-primary);
          outline-offset: -2px;
        }

        :deep(canvas) {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
        }
      }

      .rdp-controls,
      .vnc-controls {
        padding: 8px 16px;
        background-color: var(--el-bg-color);
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .rdp-status,
        .vnc-status {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .rdp-actions,
        .vnc-actions {
          display: flex;
          gap: 8px;

          .el-button {
            padding: 4px 8px;

            .el-icon {
              margin-right: 4px;
            }
          }
        }
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
      color: var(--el-text-color-primary);

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

/* 响应式设�?*/
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
