<template>
  <div class="tunnel-vnc-desktop">
    <!-- 工具�?-->
    <div class="desktop-toolbar">
      <div class="toolbar-left">
        <el-button 
          v-if="!isConnected" 
          type="primary" 
          size="small" 
          :loading="isConnecting"
          @click="connect"
        >
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          {{ isConnecting ? '连接�?..' : '连接' }}
        </el-button>
        
        <el-button 
          v-else 
          type="danger" 
          size="small" 
          @click="disconnect"
        >
          <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
          断开连接
        </el-button>

        <el-divider direction="vertical" />

        <el-button 
          size="small" 
          :disabled="!isConnected"
          @click="takeScreenshot"
        >
          <IconifyIconOnline icon="ri:camera-line" class="mr-1" />
          截图
        </el-button>

        <el-button 
          size="small" 
          :disabled="!isConnected"
          @click="toggleFullscreen"
        >
          <IconifyIconOnline icon="ri:fullscreen-line" class="mr-1" />
          全屏
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-tag 
          :type="connectionStatusType" 
          size="small"
        >
          {{ connectionStatusText }}
        </el-tag>
      </div>
    </div>

    <!-- 桌面显示区域 -->
    <div 
      ref="desktopDisplay" 
      class="desktop-display"
      :class="{ 'fullscreen': isFullscreen }"
    >
      <div v-if="!isConnected && !isConnecting" class="connection-placeholder">
        <div class="placeholder-content">
          <IconifyIconOnline icon="ri:computer-line" class="placeholder-icon" />
          <h3>VNC 远程桌面</h3>
          <p>点击"连接"按钮开始连接到远程桌面</p>
          <div class="server-info">
            <p><strong>服务�?</strong> {{ server?.monitorSysGenServerName }}</p>
            <p><strong>地址:</strong> {{ server?.monitorSysGenServerHost }}:{{ server?.monitorSysGenServerPort }}</p>
          </div>
        </div>
      </div>

      <div v-if="isConnecting" class="connection-loading">
        <el-loading-directive 
          v-loading="true" 
          element-loading-text="正在连接远程桌面..."
          element-loading-background="rgba(0, 0, 0, 0.8)"
        />
      </div>
    </div>

    <!-- 连接错误对话�?-->
    <el-dialog
      v-model="showErrorDialog"
      title="连接错误"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="error-content">
        <el-alert
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
        />
        
        <div class="error-details" v-if="errorDetails">
          <h4>错误详情:</h4>
          <pre>{{ errorDetails }}</pre>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showErrorDialog = false">关闭</el-button>
        <el-button type="primary" @click="retryConnection">重试连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { GuacamoleTunnelClient } from '@/utils/guacamole/tunnel-client';
import type { TunnelClientConfig } from '@/utils/guacamole/tunnel-client';

// Props
interface Props {
  server: any;
}

const props = defineProps<Props>();

// 响应式数�?
const desktopDisplay = ref<HTMLElement>();
const isConnecting = ref(false);
const isConnected = ref(false);
const isFullscreen = ref(false);
const currentState = ref<number | null>(null);
const showErrorDialog = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');

// Guacamole客户�?
let tunnelClient: GuacamoleTunnelClient | null = null;

// 计算属�?
const connectionStatusType = computed(() => {
  if (isConnected.value) return 'success';
  if (isConnecting.value) return 'warning';
  return 'info';
});

const connectionStatusText = computed(() => {
  if (isConnected.value) return '已连�?;
  if (isConnecting.value) return '连接�?;
  return '未连�?;
});

// 方法
const connect = async () => {
  if (!props.server || !desktopDisplay.value) {
    ElMessage.error('服务器信息不完整或显示容器未准备�?);
    return;
  }

  try {
    isConnecting.value = true;
    
    // 创建隧道客户端配�?
    const config: TunnelClientConfig = {
      serverId: props.server.monitorSysGenServerId,
      protocol: 'vnc' as const,
      host: props.server.monitorSysGenServerHost,
      port: props.server.monitorSysGenServerPort || 5900,
      username: props.server.monitorSysGenServerUsername || '',
      password: props.server.monitorSysGenServerPassword || '',
      colorDepth: 32,
      swapRedBlue: false,
      cursor: 'local',
      readOnly: false
    };

    // 创建客户�?
    tunnelClient = new GuacamoleTunnelClient(config, {
      onStateChange: (state: number) => {
        currentState.value = state;
        console.log('VNC 隧道状态变�?', state);
        
        // 检查是否已连接
        if (tunnelClient && tunnelClient.isConnected()) {
          isConnected.value = true;
          isConnecting.value = false;
        } else if (state === (window as any).Guacamole?.Client?.DISCONNECTED) {
          isConnected.value = false;
          isConnecting.value = false;
        }
      },
      onError: (error: any) => {
        console.error('VNC 隧道错误:', error);
        isConnecting.value = false;
        isConnected.value = false;
        showError('连接错误', error.message || error.toString());
      },
      onName: (name: string) => {
        console.log('VNC 会话名称:', name);
      },
      onClipboard: (_stream: any, mimetype: string) => {
        console.log('收到剪贴板数�?', mimetype);
      }
    });

    // 连接到服务器
    await tunnelClient.connect();

    // 等待DOM更新后绑定到显示容器
    await nextTick();
    tunnelClient.attachTo(desktopDisplay.value);
    
    ElMessage.success('VNC 隧道连接成功');
    
  } catch (error) {
    console.error('VNC 隧道连接失败:', error);
    isConnecting.value = false;
    showError('连接失败', error instanceof Error ? error.message : String(error));
  }
};

const disconnect = () => {
  if (tunnelClient) {
    tunnelClient.disconnect();
    tunnelClient = null;
  }
  
  isConnected.value = false;
  isConnecting.value = false;
  
  // 清空显示容器
  if (desktopDisplay.value) {
    desktopDisplay.value.innerHTML = '';
  }
  
  ElMessage.info('VNC 连接已断开');
};

const takeScreenshot = () => {
  if (tunnelClient && tunnelClient.isConnected()) {
    const screenshot = tunnelClient.takeScreenshot();
    if (screenshot) {
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `vnc-screenshot-${Date.now()}.png`;
      link.href = screenshot;
      link.click();
      
      ElMessage.success('截图已保�?);
    } else {
      ElMessage.error('截图失败');
    }
  }
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

const showError = (title: string, details: string) => {
  errorMessage.value = title;
  errorDetails.value = details;
  showErrorDialog.value = true;
};

const retryConnection = () => {
  showErrorDialog.value = false;
  setTimeout(() => {
    connect();
  }, 1000);
};

// 生命周期
onMounted(() => {
  console.log('TunnelVNCDesktop 组件已挂�?);
});

onUnmounted(() => {
  console.log('TunnelVNCDesktop 组件即将卸载');
  if (tunnelClient) {
    tunnelClient.destroy();
    tunnelClient = null;
  }
});
</script>

<style scoped>
.tunnel-vnc-desktop {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.desktop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.desktop-display {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
}

.desktop-display.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.connection-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: var(--el-text-color-primary);
}

.placeholder-content {
  text-align: center;
  padding: 40px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.placeholder-content h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 500;
}

.placeholder-content p {
  margin: 0 0 24px 0;
  font-size: 16px;
  opacity: 0.9;
}

.server-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  text-align: left;
}

.server-info p {
  margin: 4px 0;
  font-size: 14px;
}

.connection-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  margin-bottom: 16px;
}

.error-details {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.error-details h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.error-details pre {
  margin: 0;
  font-size: 12px;
   color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
