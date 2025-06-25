<template>
  <div class="rdp-desktop">
    <!-- 头部工具栏 -->
    <div class="desktop-header">
      <div class="desktop-info">
        <IconifyIconOnline icon="ri:computer-line" class="mr-2" />
        <span class="desktop-title">远程桌面 - {{ server?.name }}</span>
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
              <el-dropdown-item command="fileTransfer">文件传输</el-dropdown-item>
              <el-dropdown-item command="ctrlAltDel" divided>Ctrl+Alt+Del</el-dropdown-item>
              <el-dropdown-item command="winKey">Windows键</el-dropdown-item>
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
            <IconifyIconOnline icon="ri:computer-line" class="prompt-icon" />
            <h3>远程桌面连接</h3>
            <p>服务器: {{ server?.host }}:{{ server?.port }}</p>
            <div class="connection-options">
              <el-form :model="connectionForm" label-width="80px" size="small">
                <el-form-item label="分辨率">
                  <el-select v-model="connectionForm.resolution" placeholder="选择分辨率">
                    <el-option label="1920x1080" value="1920x1080" />
                    <el-option label="1680x1050" value="1680x1050" />
                    <el-option label="1440x900" value="1440x900" />
                    <el-option label="1366x768" value="1366x768" />
                    <el-option label="1280x720" value="1280x720" />
                    <el-option label="自适应" value="auto" />
                  </el-select>
                </el-form-item>
                <el-form-item label="色彩深度">
                  <el-select v-model="connectionForm.colorDepth" placeholder="选择色彩深度">
                    <el-option label="32位真彩色" value="32" />
                    <el-option label="24位真彩色" value="24" />
                    <el-option label="16位高彩色" value="16" />
                    <el-option label="15位高彩色" value="15" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="connectionForm.enableAudio">启用音频</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="connectionForm.enableClipboard">启用剪贴板</el-checkbox>
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
          <!-- 这里将集成Guacamole客户端 -->
          <canvas ref="guacamoleCanvas" class="guacamole-canvas"></canvas>
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
          延迟: {{ latency }}ms
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:aspect-ratio-line" class="mr-1" />
          分辨率: {{ currentResolution }}
        </span>
      </div>
      <div class="desktop-controls">
        <el-slider
          v-model="quality"
          :min="1"
          :max="10"
          :step="1"
          :show-tooltip="false"
          style="width: 100px"
          @change="updateQuality"
        />
        <span class="quality-label">画质</span>
      </div>
    </div>

    <!-- 文件传输对话框 -->
    <el-dialog v-model="fileTransferVisible" title="文件传输" width="600px">
      <div class="file-transfer">
        <el-upload
          drag
          multiple
          :auto-upload="false"
          :on-change="handleFileSelect"
          :file-list="fileList"
        >
          <IconifyIconOnline icon="ri:upload-cloud-line" class="upload-icon" />
          <div class="upload-text">
            <p>将文件拖拽到此处，或<em>点击上传</em></p>
            <p class="upload-tip">支持多文件上传</p>
          </div>
        </el-upload>
        <div class="transfer-progress" v-if="transferring">
          <el-progress :percentage="transferProgress" :status="transferStatus" />
          <p>{{ transferMessage }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="fileTransferVisible = false">取消</el-button>
        <el-button type="primary" @click="startFileTransfer" :loading="transferring">
          开始传输
        </el-button>
      </template>
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
const latency = ref(0);
const currentResolution = ref('');
const quality = ref(8);
const isFullscreen = ref(false);

// 连接配置
const connectionForm = ref({
  resolution: 'auto',
  colorDepth: '32',
  enableAudio: true,
  enableClipboard: true
});

// 文件传输
const fileTransferVisible = ref(false);
const fileList = ref<any[]>([]);
const transferring = ref(false);
const transferProgress = ref(0);
const transferStatus = ref<'success' | 'exception' | undefined>();
const transferMessage = ref('');

// 引用
const desktopContainer = ref<HTMLElement>();
const desktopContent = ref<HTMLElement>();
const desktopDisplay = ref<HTMLElement>();
const guacamoleCanvas = ref<HTMLCanvasElement>();

// WebSocket连接
const socket = ref<Socket | null>(null);
const guacamoleClient = ref<any>(null); // Guacamole客户端实例

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
    
    // 初始化Guacamole客户端
    await initGuacamoleClient();

    connectionStatus.value = 'connected';
    connectionStartTime.value = Date.now();
    startDurationTimer();

    message.success('远程桌面连接成功');
  } catch (error) {
    connectionStatus.value = 'error';
    message.error('远程桌面连接失败');
    console.error('RDP连接失败:', error);
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

    if (guacamoleClient.value) {
      try {
        guacamoleClient.value.disconnect();
      } catch (error) {
        console.warn('Guacamole客户端断开时出现警告:', error);
      }
      guacamoleClient.value = null;
    }

    connectionStatus.value = 'disconnected';
    stopDurationTimer();
    resetStats();
  } catch (error) {
    console.error('断开RDP连接时出错:', error);
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
      // 创建WebSocket连接到RDP服务
      socket.value = io('/rdp', {
        query: {
          serverId: props.server?.id,
          host: props.server?.host,
          port: props.server?.port,
          username: props.server?.username,
          resolution: connectionForm.value.resolution,
          colorDepth: connectionForm.value.colorDepth,
          enableAudio: connectionForm.value.enableAudio,
          enableClipboard: connectionForm.value.enableClipboard
        }
      });

      socket.value.on('connect', () => {
        console.log('RDP WebSocket连接成功');
        resolve(true);
      });

      socket.value.on('disconnect', () => {
        console.log('RDP WebSocket连接断开');
        connectionStatus.value = 'disconnected';
      });

      socket.value.on('error', (error: any) => {
        console.error('RDP WebSocket错误:', error);
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

const initGuacamoleClient = async () => {
  try {
    // 动态导入Guacamole客户端
    const { GuacamoleClient } = await import('@/utils/guacamole');

    // 创建Guacamole客户端实例
    guacamoleClient.value = new GuacamoleClient(socket.value);

    // 绑定到canvas
    if (guacamoleCanvas.value) {
      guacamoleClient.value.attachTo(guacamoleCanvas.value);
    }

    // 监听连接事件
    guacamoleClient.value.onStateChange = (state: string) => {
      console.log('Guacamole状态变化:', state);
      if (state === 'CONNECTED') {
        currentResolution.value = guacamoleClient.value.getResolution();
      }
    };

    // 监听延迟变化
    guacamoleClient.value.onLatencyChange = (newLatency: number) => {
      latency.value = newLatency;
    };

  } catch (error) {
    console.error('初始化Guacamole客户端失败:', error);
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
    case 'fileTransfer':
      fileTransferVisible.value = true;
      break;
    case 'ctrlAltDel':
      sendCtrlAltDel();
      break;
    case 'winKey':
      sendWinKey();
      break;
  }
};

const takeScreenshot = () => {
  if (guacamoleClient.value) {
    const screenshot = guacamoleClient.value.takeScreenshot();
    // 下载截图
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = screenshot;
    link.click();
    message.success('截图已保存');
  }
};

const handleClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (guacamoleClient.value) {
      guacamoleClient.value.setClipboard(text);
      message.success('剪贴板内容已同步');
    }
  } catch (error) {
    message.error('无法访问剪贴板');
  }
};

const sendCtrlAltDel = () => {
  if (guacamoleClient.value) {
    guacamoleClient.value.sendKeySequence(['ctrl', 'alt', 'delete']);
  }
};

const sendWinKey = () => {
  if (guacamoleClient.value) {
    guacamoleClient.value.sendKey('meta');
  }
};

const updateQuality = (value: number) => {
  if (guacamoleClient.value) {
    guacamoleClient.value.setQuality(value);
  }
};

const handleFileSelect = (file: any) => {
  fileList.value.push(file);
};

const startFileTransfer = async () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要传输的文件');
    return;
  }

  try {
    transferring.value = true;
    transferProgress.value = 0;
    transferStatus.value = undefined;

    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i];
      transferMessage.value = `正在传输: ${file.name}`;
      
      // 模拟文件传输进度
      for (let progress = 0; progress <= 100; progress += 10) {
        transferProgress.value = Math.round(((i * 100) + progress) / fileList.value.length);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    transferStatus.value = 'success';
    transferMessage.value = '文件传输完成';
    message.success('文件传输成功');
    
    setTimeout(() => {
      fileTransferVisible.value = false;
      fileList.value = [];
    }, 2000);

  } catch (error) {
    transferStatus.value = 'exception';
    transferMessage.value = '文件传输失败';
    message.error('文件传输失败');
  } finally {
    transferring.value = false;
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

const resetStats = () => {
  connectionDuration.value = 0;
  latency.value = 0;
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
.rdp-desktop {
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

  .guacamole-canvas {
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

    .quality-label {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

.file-transfer {
  .upload-icon {
    font-size: 48px;
    color: var(--el-color-primary);
    margin-bottom: 16px;
  }

  .upload-text {
    p {
      margin: 0;
      color: var(--el-text-color-regular);

      em {
        color: var(--el-color-primary);
        font-style: normal;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .transfer-progress {
    margin-top: 20px;
    text-align: center;

    p {
      margin-top: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
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