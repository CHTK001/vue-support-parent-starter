<template>
  <div class="vnc-desktop">
    <!-- 头部工具栏 -->
    <div class="desktop-header">
      <div class="desktop-info">
        <IconifyIconOnline icon="ri:tv-line" class="mr-2" />
        <span class="desktop-title">VNC桌面 - {{ server?.name }}</span>
        <el-tag :type="connectionStatus === 'connected' ? 'success' : 'danger'" size="small" class="ml-2">
          {{ connectionStatusText }}
        </el-tag>
      </div>
      <div class="desktop-actions">
        <el-button size="small" @click="toggleFullscreen" v-if="connectionStatus === 'connected'">
          <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" class="mr-1" />
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button size="small" @click="reconnect" :disabled="connecting">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重连
        </el-button>
        <el-dropdown @command="handleToolCommand" v-if="connectionStatus === 'connected'">
          <el-button size="small">
            工具
            <IconifyIconOnline icon="ri:arrow-down-s-line" class="ml-1" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="screenshot">截图</el-dropdown-item>
              <el-dropdown-item command="clipboard">剪贴板</el-dropdown-item>
              <el-dropdown-item command="keyboard">虚拟键盘</el-dropdown-item>
              <el-dropdown-item command="ctrlAltDel" divided>Ctrl+Alt+Del</el-dropdown-item>
              <el-dropdown-item command="refresh">刷新屏幕</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          关闭
        </el-button>
      </div>
    </div>

    <!-- 桌面容器 -->
    <div class="desktop-container" ref="desktopContainer" v-loading="connecting">
      <div class="desktop-content" ref="desktopContent">
        <!-- 连接状态提示 -->
        <div v-if="connectionStatus === 'disconnected'" class="connection-prompt">
          <div class="prompt-content">
            <IconifyIconOnline icon="ri:tv-line" class="prompt-icon" />
            <h3>VNC桌面连接</h3>
            <p>服务器: {{ server?.host }}:{{ server?.port }}</p>
            <div class="connection-options">
              <el-form :model="connectionForm" label-width="80px" size="small">
                <el-form-item label="显示模式">
                  <el-select v-model="connectionForm.viewMode" placeholder="选择显示模式">
                    <el-option label="适应窗口" value="fit" />
                    <el-option label="原始大小" value="original" />
                    <el-option label="缩放显示" value="scale" />
                  </el-select>
                </el-form-item>
                <el-form-item label="色彩质量">
                  <el-select v-model="connectionForm.colorQuality" placeholder="选择色彩质量">
                    <el-option label="高质量" value="high" />
                    <el-option label="中等质量" value="medium" />
                    <el-option label="低质量" value="low" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="connectionForm.enableClipboard">启用剪贴板同步</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="connectionForm.enableCursor">显示远程光标</el-checkbox>
                </el-form-item>
              </el-form>
            </div>
            <el-button type="primary" @click="connect" :loading="connecting">
              <IconifyIconOnline icon="ri:play-line" class="mr-1" />
              连接
            </el-button>
          </div>
        </div>

        <!-- 桌面显示区域 -->
        <div v-show="connectionStatus === 'connected'" class="desktop-display" ref="desktopDisplay">
          <!-- 这里将集成VNC客户端 -->
          <canvas ref="vncCanvas" class="vnc-canvas"></canvas>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="desktop-footer" v-if="connectionStatus === 'connected'">
      <div class="status-info">
        <span class="status-item">
          <IconifyIconOnline icon="ri:time-line" class="mr-1" />
          连接时间: {{ formatDuration(connectionDuration) }}
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:speed-line" class="mr-1" />
          帧率: {{ frameRate }}fps
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:aspect-ratio-line" class="mr-1" />
          分辨率: {{ currentResolution }}
        </span>
      </div>
      <div class="desktop-controls">
        <el-slider
          v-model="compressionLevel"
          :min="0"
          :max="9"
          :step="1"
          :show-tooltip="false"
          style="width: 100px"
          @change="updateCompression"
        />
        <span class="compression-label">压缩</span>
      </div>
    </div>

    <!-- 虚拟键盘 -->
    <el-dialog v-model="keyboardVisible" title="虚拟键盘" width="600px">
      <div class="virtual-keyboard">
        <div class="keyboard-row">
          <el-button v-for="key in keyboardLayout.row1" :key="key" size="small" @click="sendKey(key)">
            {{ key }}
          </el-button>
        </div>
        <div class="keyboard-row">
          <el-button v-for="key in keyboardLayout.row2" :key="key" size="small" @click="sendKey(key)">
            {{ key }}
          </el-button>
        </div>
        <div class="keyboard-row">
          <el-button v-for="key in keyboardLayout.row3" :key="key" size="small" @click="sendKey(key)">
            {{ key }}
          </el-button>
        </div>
        <div class="keyboard-row">
          <el-button size="small" @click="sendKey('space')" style="width: 200px">空格</el-button>
          <el-button size="small" @click="sendKey('enter')">回车</el-button>
          <el-button size="small" @click="sendKey('backspace')">退格</el-button>
          <el-button size="small" @click="sendKey('tab')">Tab</el-button>
        </div>
        <div class="keyboard-row">
          <el-button size="small" @click="sendKey('ctrl')">Ctrl</el-button>
          <el-button size="small" @click="sendKey('alt')">Alt</el-button>
          <el-button size="small" @click="sendKey('shift')">Shift</el-button>
          <el-button size="small" @click="sendKey('escape')">Esc</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { message } from "@repo/utils";
import { io, Socket } from "socket.io-client";

// Props
const props = defineProps<{
  server?: any;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 状态
const connecting = ref(false);
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
const connectionStartTime = ref<number>(0);
const connectionDuration = ref(0);
const frameRate = ref(0);
const currentResolution = ref('');
const compressionLevel = ref(6);
const isFullscreen = ref(false);
const keyboardVisible = ref(false);

// 连接配置
const connectionForm = ref({
  viewMode: 'fit',
  colorQuality: 'medium',
  enableClipboard: true,
  enableCursor: true
});

// 引用
const desktopContainer = ref<HTMLElement>();
const desktopContent = ref<HTMLElement>();
const desktopDisplay = ref<HTMLElement>();
const vncCanvas = ref<HTMLCanvasElement>();

// WebSocket连接
const socket = ref<Socket | null>(null);
const vncClient = ref<any>(null); // VNC客户端实例

// 虚拟键盘布局
const keyboardLayout = {
  row1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  row2: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  row3: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"]
};

// 计算属性
const connectionStatusText = computed(() => {
  const statusMap = {
    'disconnected': '未连接',
    'connecting': '连接中',
    'connected': '已连接',
    'error': '连接错误'
  };
  return statusMap[connectionStatus.value];
});

// 方法
const connect = async () => {
  if (connecting.value) return;

  try {
    connecting.value = true;
    connectionStatus.value = 'connecting';

    // 初始化WebSocket连接
    await initWebSocket();
    
    // 初始化VNC客户端
    await initVNCClient();

    connectionStatus.value = 'connected';
    connectionStartTime.value = Date.now();
    startDurationTimer();
    startFrameRateMonitor();

    message.success('VNC桌面连接成功');
  } catch (error) {
    connectionStatus.value = 'error';
    message.error('VNC桌面连接失败');
    console.error('VNC连接失败:', error);
  } finally {
    connecting.value = false;
  }
};

const disconnect = () => {
  try {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }

    if (vncClient.value) {
      try {
        vncClient.value.disconnect();
      } catch (error) {
        console.warn('VNC客户端断开时出现警告:', error);
      }
      vncClient.value = null;
    }

    connectionStatus.value = 'disconnected';
    stopDurationTimer();
    stopFrameRateMonitor();
    resetStats();
  } catch (error) {
    console.error('断开VNC连接时出错:', error);
  }
};

const reconnect = async () => {
  disconnect();
  await nextTick();
  await connect();
};

const initWebSocket = async () => {
  return new Promise((resolve, reject) => {
    try {
      // 创建WebSocket连接到VNC服务
      socket.value = io('/vnc', {
        query: {
          serverId: props.server?.id,
          host: props.server?.host,
          port: props.server?.port,
          username: props.server?.username,
          password: props.server?.password,
          viewMode: connectionForm.value.viewMode,
          colorQuality: connectionForm.value.colorQuality,
          enableClipboard: connectionForm.value.enableClipboard,
          enableCursor: connectionForm.value.enableCursor
        }
      });

      socket.value.on('connect', () => {
        console.log('VNC WebSocket连接成功');
        resolve(true);
      });

      socket.value.on('disconnect', () => {
        console.log('VNC WebSocket连接断开');
        connectionStatus.value = 'disconnected';
      });

      socket.value.on('error', (error: any) => {
        console.error('VNC WebSocket错误:', error);
        reject(error);
      });

      // 连接超时处理
      setTimeout(() => {
        if (connectionStatus.value === 'connecting') {
          reject(new Error('连接超时'));
        }
      }, 15000);

    } catch (error) {
      reject(error);
    }
  });
};

const initVNCClient = async () => {
  try {
    // 动态导入VNC客户端
    const { VNCClient } = await import('@/utils/vnc');

    // 创建VNC客户端实例
    vncClient.value = new VNCClient(socket.value);

    // 绑定到canvas
    if (vncCanvas.value) {
      vncClient.value.attachTo(vncCanvas.value);
    }

    // 监听连接事件
    vncClient.value.onStateChange = (state: string) => {
      console.log('VNC状态变化:', state);
      if (state === 'CONNECTED') {
        currentResolution.value = vncClient.value.getResolution();
      }
    };

    // 监听帧率变化
    vncClient.value.onFrameRateChange = (newFrameRate: number) => {
      frameRate.value = newFrameRate;
    };

  } catch (error) {
    console.error('初始化VNC客户端失败:', error);
    throw error;
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    desktopContainer.value?.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};

const handleToolCommand = (command: string) => {
  switch (command) {
    case 'screenshot':
      takeScreenshot();
      break;
    case 'clipboard':
      handleClipboard();
      break;
    case 'keyboard':
      keyboardVisible.value = true;
      break;
    case 'ctrlAltDel':
      sendCtrlAltDel();
      break;
    case 'refresh':
      refreshScreen();
      break;
  }
};

const takeScreenshot = () => {
  if (vncClient.value) {
    const screenshot = vncClient.value.takeScreenshot();
    // 下载截图
    const link = document.createElement('a');
    link.download = `vnc-screenshot-${Date.now()}.png`;
    link.href = screenshot;
    link.click();
    message.success('截图已保存');
  }
};

const handleClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (vncClient.value) {
      vncClient.value.setClipboard(text);
      message.success('剪贴板内容已同步');
    }
  } catch (error) {
    message.error('无法访问剪贴板');
  }
};

const sendCtrlAltDel = () => {
  if (vncClient.value) {
    vncClient.value.sendKeySequence(['ctrl', 'alt', 'delete']);
  }
};

const refreshScreen = () => {
  if (vncClient.value) {
    vncClient.value.requestFullUpdate();
    message.success('屏幕刷新完成');
  }
};

const sendKey = (key: string) => {
  if (vncClient.value) {
    vncClient.value.sendKey(key);
  }
};

const updateCompression = (value: number) => {
  if (vncClient.value) {
    vncClient.value.setCompressionLevel(value);
  }
};

const startDurationTimer = () => {
  const timer = setInterval(() => {
    if (connectionStatus.value === 'connected') {
      connectionDuration.value = Date.now() - connectionStartTime.value;
    } else {
      clearInterval(timer);
    }
  }, 1000);
};

const stopDurationTimer = () => {
  connectionDuration.value = 0;
};

const startFrameRateMonitor = () => {
  // 模拟帧率监控
  const timer = setInterval(() => {
    if (connectionStatus.value === 'connected') {
      frameRate.value = Math.floor(Math.random() * 10) + 15; // 15-25fps
    } else {
      clearInterval(timer);
    }
  }, 1000);
};

const stopFrameRateMonitor = () => {
  frameRate.value = 0;
};

const resetStats = () => {
  connectionDuration.value = 0;
  frameRate.value = 0;
  currentResolution.value = '';
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
};

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement;
});

// 生命周期
onMounted(() => {
  // 自动连接
  connect();
});

onUnmounted(() => {
  disconnect();
});
</script>

<style lang="scss" scoped>
.vnc-desktop {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.desktop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .desktop-info {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .desktop-title {
      margin-right: 8px;
    }
  }

  .desktop-actions {
    display: flex;
    gap: 8px;
  }
}

.desktop-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.desktop-content {
  height: 100%;
  position: relative;
}

.connection-prompt {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color-page);

  .prompt-content {
    text-align: center;
    padding: 40px;
    max-width: 400px;

    .prompt-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    p {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0 0 20px 0;
      font-family: monospace;
    }

    .connection-options {
      text-align: left;
      margin-bottom: 20px;
    }
  }
}

.desktop-display {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .vnc-canvas {
    max-width: 100%;
    max-height: 100%;
    border: none;
    outline: none;
  }
}

.desktop-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;

  .status-info {
    display: flex;
    gap: 16px;

    .status-item {
      display: flex;
      align-items: center;
      color: var(--el-text-color-secondary);
    }
  }

  .desktop-controls {
    display: flex;
    align-items: center;
    gap: 8px;

    .compression-label {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

.virtual-keyboard {
  .keyboard-row {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-bottom: 8px;

    .el-button {
      min-width: 40px;
      padding: 4px 8px;
    }
  }
}

@media (max-width: 768px) {
  .desktop-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .desktop-actions {
      justify-content: flex-end;
    }
  }

  .desktop-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .status-info {
      justify-content: space-between;
    }
  }
}
</style>
