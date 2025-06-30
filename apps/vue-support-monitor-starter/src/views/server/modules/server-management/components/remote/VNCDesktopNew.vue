<template>
  <div class="vnc-desktop-new">
    <!-- 头部工具栏 -->
    <div class="desktop-header">
      <div class="desktop-info">
        <IconifyIconOnline icon="ep:monitor" />
        <span class="desktop-title">VNC 远程桌面 - {{ server?.monitorSysGenServerName }}</span>
        <el-tag 
          :type="connectionState?.connected ? 'success' : connectionState?.connecting ? 'warning' : 'danger'" 
          size="small" 
          class="ml-2"
        >
          {{ connectionStateText }}
        </el-tag>
      </div>
      <div class="desktop-actions">
        <el-button
          size="small"
          @click="toggleFullscreen"
          v-if="connectionState?.connected"
        >
          <IconifyIconOnline :icon="isFullscreen ? 'ep:full-screen' : 'ep:full-screen'" class="mr-1" />
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button
          size="small"
          @click="reconnect"
          :disabled="connectionState?.connecting"
        >
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          重连
        </el-button>
        <el-dropdown @command="handleToolCommand" v-if="connectionState?.connected">
          <el-button size="small">
            工具
            <IconifyIconOnline icon="ep:arrow-down" class="el-icon--right" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="screenshot">截图</el-dropdown-item>
              <el-dropdown-item command="clipboard">剪贴板</el-dropdown-item>
              <el-dropdown-item command="fileTransfer">文件传输</el-dropdown-item>
              <el-dropdown-item command="refresh" divided>刷新屏幕</el-dropdown-item>
              <el-dropdown-item command="viewOnly">只读模式</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="$emit('close')">
          <IconifyIconOnline icon="ep:close" class="mr-1" />
          关闭
        </el-button>
      </div>
    </div>

    <!-- 桌面容器 -->
    <div class="desktop-container" ref="desktopContainer" v-loading="connectionState?.connecting">
      <div class="desktop-content" ref="desktopContent">
        <!-- 连接配置面板 -->
        <div v-if="!connectionState?.connected" class="connection-panel">
          <el-card shadow="hover" class="connection-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="ep:monitor" />
                <span>VNC 连接配置</span>
              </div>
            </template>
            
            <el-form :model="connectionConfig" label-width="120px" class="connection-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="颜色深度">
                    <el-select v-model="connectionConfig.colorDepth" placeholder="选择颜色深度">
                      <el-option label="8位 (256色)" :value="8" />
                      <el-option label="16位 (高彩色)" :value="16" />
                      <el-option label="24位 (真彩色)" :value="24" />
                      <el-option label="32位 (真彩色)" :value="32" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="光标类型">
                    <el-select v-model="connectionConfig.cursor" placeholder="选择光标类型">
                      <el-option label="本地光标" value="local" />
                      <el-option label="远程光标" value="remote" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="启用剪贴板">
                    <el-switch v-model="connectionConfig.enableClipboard" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="启用光标">
                    <el-switch v-model="connectionConfig.enableCursor" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="只读模式">
                    <el-switch v-model="connectionConfig.readOnly" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="交换红蓝">
                    <el-switch v-model="connectionConfig.swapRedBlue" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="自动重试">
                    <el-switch v-model="connectionConfig.autoRetry" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="编码类型">
                <el-checkbox-group v-model="connectionConfig.encodings">
                  <el-checkbox label="raw">Raw</el-checkbox>
                  <el-checkbox label="rre">RRE</el-checkbox>
                  <el-checkbox label="corre">CoRRE</el-checkbox>
                  <el-checkbox label="hextile">Hextile</el-checkbox>
                  <el-checkbox label="zlib">Zlib</el-checkbox>
                  <el-checkbox label="tight">Tight</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            
            <div class="connection-actions">
              <el-button 
                type="primary" 
                :loading="connectionState?.connecting" 
                @click="connect"
                :disabled="!server"
                size="large"
              >
                <IconifyIconOnline icon="ep:connection" class="mr-1" />
                {{ connectionState?.connecting ? '连接中...' : '连接' }}
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 桌面显示区域 -->
        <div v-show="connectionState?.connected" class="desktop-display" ref="desktopDisplay">
          <canvas ref="guacamoleCanvas" class="guacamole-canvas"></canvas>
        </div>

        <!-- 错误提示 -->
        <div v-if="connectionState?.error" class="error-panel">
          <el-alert
            :title="connectionState.error"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="desktop-footer" v-if="connectionState?.connected">
      <div class="status-info">
        <span class="status-item">
          <IconifyIconOnline icon="ep:timer" />
          连接时间: {{ formatDuration(connectionState.duration) }}
        </span>
        <span class="status-item" v-if="connectionStats">
          <IconifyIconOnline icon="ep:data-line" />
          延迟: {{ connectionStats.latency }}ms
        </span>
        <span class="status-item" v-if="displayInfo">
          <IconifyIconOnline icon="ep:monitor" />
          分辨率: {{ displayInfo.width }}x{{ displayInfo.height }}
        </span>
        <span class="status-item" v-if="connectionStats">
          <IconifyIconOnline icon="ep:upload" />
          上传: {{ formatBytes(connectionStats.bytesSent) }}
        </span>
        <span class="status-item" v-if="connectionStats">
          <IconifyIconOnline icon="ep:download" />
          下载: {{ formatBytes(connectionStats.bytesReceived) }}
        </span>
        <span class="status-item" v-if="connectionStats">
          <IconifyIconOnline icon="ep:odometer" />
          帧率: {{ connectionStats.frameRate }}fps
        </span>
      </div>
      <div class="scale-control">
        <span class="scale-label">缩放:</span>
        <el-slider
          v-model="displayScale"
          :min="25"
          :max="200"
          :step="25"
          :format-tooltip="(val) => `${val}%`"
          @change="handleScaleChange"
          style="width: 120px; margin: 0 10px;"
        />
        <span class="scale-value">{{ displayScale }}%</span>
      </div>
    </div>

    <!-- 剪贴板对话框 -->
    <el-dialog
      v-model="clipboardDialogVisible"
      title="剪贴板"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="clipboardText"
        type="textarea"
        :rows="6"
        placeholder="在此输入要发送到远程桌面的文本"
      />
      <template #footer>
        <el-button @click="clipboardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendClipboard">发送</el-button>
      </template>
    </el-dialog>

    <!-- 文件传输对话框 -->
    <el-dialog
      v-model="fileTransferDialogVisible"
      title="文件传输"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileSelect"
        :show-file-list="true"
        drag
        multiple
      >
        <IconifyIconOnline icon="ep:upload-filled" class="el-icon--upload" />
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持多文件上传，文件将传输到远程桌面
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="fileTransferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadFiles">上传文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 移除 @element-plus/icons-vue 导入，使用全局 IconifyIconOnline 组件
import { guacamoleConnectionManager } from '@/utils/guacamole/connection-manager';
import type { 
  VNCConnectionConfig, 
  GuacamoleConnectionState, 
  GuacamoleStatistics,
  GuacamoleDisplayInfo 
} from '@/utils/guacamole/types';

interface Props {
  /** 服务器信息 */
  server?: {
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerPort: number;
    monitorSysGenServerUsername?: string;
    monitorSysGenServerPassword?: string;
  };
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 引用
const desktopContainer = ref<HTMLElement>();
const desktopContent = ref<HTMLElement>();
const desktopDisplay = ref<HTMLElement>();
const guacamoleCanvas = ref<HTMLCanvasElement>();
const uploadRef = ref();

// 状态
const isFullscreen = ref(false);
const displayScale = ref(100);
const clipboardDialogVisible = ref(false);
const fileTransferDialogVisible = ref(false);
const clipboardText = ref('');
const selectedFiles = ref<File[]>([]);

// 连接配置
const connectionConfig = reactive<VNCConnectionConfig>({
  serverId: props.server?.monitorSysGenServerId || 0,
  protocol: 'vnc',
  host: props.server?.monitorSysGenServerHost || '',
  port: props.server?.monitorSysGenServerPort || 5900,
  username: props.server?.monitorSysGenServerUsername || '',
  password: props.server?.monitorSysGenServerPassword || '',
  enableClipboard: true,
  enableCursor: true,
  readOnly: false,
  swapRedBlue: false,
  colorDepth: 24,
  cursor: 'local',
  encodings: ['tight', 'hextile', 'zlib'],
  autoRetry: true
});

// 连接状态
const connectionState = computed(() => 
  guacamoleConnectionManager.getConnectionState(connectionConfig.serverId)
);

const connectionStats = computed(() => 
  guacamoleConnectionManager.getConnectionStats(connectionConfig.serverId)
);

const displayInfo = computed(() => 
  guacamoleConnectionManager.getDisplayInfo(connectionConfig.serverId)
);

const connectionStateText = computed(() => {
  if (!connectionState.value) return '未连接';
  if (connectionState.value.connecting) return '连接中';
  if (connectionState.value.connected) return '已连接';
  if (connectionState.value.error) return '连接错误';
  return '已断开';
});

// 方法
const connect = async () => {
  if (!props.server) {
    ElMessage.error('服务器信息不完整');
    return;
  }

  try {
    // 创建连接
    const client = await guacamoleConnectionManager.createConnection(connectionConfig);
    
    // 绑定到 canvas
    await nextTick();
    if (guacamoleCanvas.value) {
      client.attachTo(guacamoleCanvas.value);
    }
    
    // 连接到服务器
    await guacamoleConnectionManager.connect(connectionConfig.serverId);
    
    ElMessage.success('VNC 连接成功');
  } catch (error) {
    console.error('VNC 连接失败:', error);
    ElMessage.error(`连接失败: ${error}`);
  }
};

const disconnect = async () => {
  try {
    await guacamoleConnectionManager.disconnect(connectionConfig.serverId);
    ElMessage.success('已断开连接');
  } catch (error) {
    console.error('断开连接失败:', error);
  }
};

const reconnect = async () => {
  await disconnect();
  await nextTick();
  await connect();
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

const handleScaleChange = (scale: number) => {
  guacamoleConnectionManager.setScale(connectionConfig.serverId, scale / 100);
};

const handleToolCommand = (command: string) => {
  switch (command) {
    case 'screenshot':
      takeScreenshot();
      break;
    case 'clipboard':
      clipboardDialogVisible.value = true;
      break;
    case 'fileTransfer':
      fileTransferDialogVisible.value = true;
      break;
    case 'refresh':
      refreshScreen();
      break;
    case 'viewOnly':
      toggleViewOnly();
      break;
  }
};

const takeScreenshot = () => {
  const screenshot = guacamoleConnectionManager.screenshot(connectionConfig.serverId);
  if (screenshot) {
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `vnc-screenshot-${Date.now()}.png`;
    link.href = screenshot;
    link.click();
    ElMessage.success('截图已保存');
  } else {
    ElMessage.error('截图失败');
  }
};

const sendClipboard = () => {
  if (clipboardText.value.trim()) {
    guacamoleConnectionManager.sendClipboard(connectionConfig.serverId, clipboardText.value);
    clipboardDialogVisible.value = false;
    clipboardText.value = '';
    ElMessage.success('剪贴板内容已发送');
  }
};

const handleFileSelect = (file: any) => {
  selectedFiles.value = [file.raw];
};

const uploadFiles = () => {
  selectedFiles.value.forEach(file => {
    guacamoleConnectionManager.sendFile(connectionConfig.serverId, file);
  });
  fileTransferDialogVisible.value = false;
  selectedFiles.value = [];
  ElMessage.success('文件上传已开始');
};

const refreshScreen = () => {
  // 刷新屏幕
  ElMessage.info('屏幕刷新请求已发送');
};

const toggleViewOnly = () => {
  connectionConfig.readOnly = !connectionConfig.readOnly;
  ElMessage.info(connectionConfig.readOnly ? '已切换到只读模式' : '已切换到交互模式');
};

const formatDuration = (duration: number): string => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 生命周期
onMounted(async () => {
  console.log('VNC 组件已挂载，服务器信息:', props.server);

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });

  // 自动连接
  if (props.server) {
    await nextTick();
    await connect();
  }
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped lang="scss">
.vnc-desktop-new {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;

  .desktop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .desktop-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .desktop-title {
        font-weight: 500;
        color: #303133;
      }
    }

    .desktop-actions {
      display: flex;
      gap: 8px;
    }
  }

  .desktop-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .desktop-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;

      .connection-panel {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;

        .connection-card {
          width: 100%;
          max-width: 700px;

          .card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
          }

          .connection-form {
            margin: 20px 0;

            .el-checkbox-group {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;

              .el-checkbox {
                margin-right: 0;
              }
            }
          }

          .connection-actions {
            text-align: center;
            margin-top: 20px;
          }
        }
      }

      .desktop-display {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        overflow: hidden;

        .guacamole-canvas {
          max-width: 100%;
          max-height: 100%;
          border: none;
          outline: none;
          cursor: crosshair;
        }
      }

      .error-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        z-index: 10;
      }
    }
  }

  .desktop-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: white;
    border-top: 1px solid #e4e7ed;
    font-size: 12px;
    color: #606266;

    .status-info {
      display: flex;
      gap: 16px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .scale-control {
      display: flex;
      align-items: center;
      gap: 8px;

      .scale-label,
      .scale-value {
        font-size: 12px;
        color: #606266;
        white-space: nowrap;
      }
    }
  }

  // 全屏模式样式
  &:fullscreen {
    .desktop-header,
    .desktop-footer {
      display: none;
    }

    .desktop-container {
      height: 100vh;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .desktop-header {
      padding: 8px 12px;

      .desktop-actions {
        gap: 4px;

        .el-button {
          padding: 8px 12px;
        }
      }
    }

    .desktop-footer {
      padding: 6px 12px;
      flex-direction: column;
      gap: 8px;

      .status-info {
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .connection-panel {
      padding: 12px;

      .connection-card {
        max-width: none;
      }
    }
  }
}

// VNC 特定样式
.vnc-desktop-new {
  .desktop-display {
    .guacamole-canvas {
      // VNC 特定的光标样式
      &.view-only {
        cursor: not-allowed;
      }

      &.interactive {
        cursor: crosshair;
      }
    }
  }

  // VNC 编码选择样式
  .connection-form {
    .el-checkbox-group {
      .el-checkbox {
        &:nth-child(1) .el-checkbox__label { color: #e6a23c; } // Raw - 橙色
        &:nth-child(2) .el-checkbox__label { color: #67c23a; } // RRE - 绿色
        &:nth-child(3) .el-checkbox__label { color: #409eff; } // CoRRE - 蓝色
        &:nth-child(4) .el-checkbox__label { color: #909399; } // Hextile - 灰色
        &:nth-child(5) .el-checkbox__label { color: #f56c6c; } // Zlib - 红色
        &:nth-child(6) .el-checkbox__label { color: #9c27b0; } // Tight - 紫色
      }
    }
  }
}

// 对话框样式优化
:deep(.el-dialog) {
  .el-dialog__header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 12px 20px 16px;
    border-top: 1px solid #e4e7ed;
  }
}

// 上传组件样式
:deep(.el-upload) {
  .el-upload-dragger {
    width: 100%;
    height: 120px;
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }

    .el-icon--upload {
      font-size: 28px;
      color: #c0c4cc;
      margin: 20px 0 16px;
      line-height: 50px;
    }
  }
}

// 滑块样式优化
:deep(.el-slider) {
  .el-slider__runway {
    height: 4px;
    background-color: #e4e7ed;
  }

  .el-slider__bar {
    height: 4px;
    background-color: #409eff;
  }

  .el-slider__button {
    width: 12px;
    height: 12px;
    border: 2px solid #409eff;
    background-color: white;
  }
}

// 复选框组样式优化
:deep(.el-checkbox-group) {
  .el-checkbox {
    .el-checkbox__input {
      .el-checkbox__inner {
        border-radius: 4px;
      }
    }

    .el-checkbox__label {
      font-weight: 500;
      transition: color 0.3s;
    }

    &.is-checked {
      .el-checkbox__label {
        color: #409eff;
      }
    }
  }
}
</style>
