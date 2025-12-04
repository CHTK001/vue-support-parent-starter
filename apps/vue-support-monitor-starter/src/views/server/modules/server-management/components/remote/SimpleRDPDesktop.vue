<template>
  <div class="simple-rdp-desktop">
    <div class="desktop-header">
      
      <div class="desktop-controls">
        <div class="connection-info">
          <el-tag :type="connectionStatus.type" size="small">
            {{ connectionStatus.text }}
          </el-tag>
          <span class="server-info">{{ props.server?.monitorSysGenServerName }} - RDP</span>
        </div>
        <el-button 
          v-if="!isConnected" 
          type="primary" 
          size="small" 
          :loading="isConnecting"
          @click="connect"
        >
          {{ isConnecting ? '连接�?..' : '连接' }}
        </el-button>
        
        <el-button 
          v-if="isConnected" 
          type="danger" 
          size="small" 
          @click="disconnect"
        >
          断开连接
        </el-button>
        
        <el-button 
          v-if="isConnected" 
          size="small" 
          @click="takeScreenshot"
        >
          截图
        </el-button>
      </div>
    </div>

    <div class="desktop-container">
      <!-- Guacamole 显示容器 -->
      <div
        ref="desktopDisplay"
        class="desktop-display"
        :class="{ 'connected': isConnected }"
      ></div>

      <div v-if="!isConnected && !isConnecting" class="connection-placeholder">
        <el-empty description="点击连接按钮开�?RDP 会话" />
      </div>

      <div v-if="isConnecting" class="connecting-overlay">
        <el-loading-spinner />
        <p>正在连接�?{{ props.server?.monitorSysGenServerHost }}:{{ props.server?.monitorSysGenServerPort }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import SimpleGuacamoleClient, { GuacamoleStates } from '@/utils/guacamole/simple-client';
interface Props {
  server: {
    monitorSysGenServerId: number;
    monitorSysGenServerName: string;
    monitorSysGenServerHost: string;
    monitorSysGenServerPort: number;
    monitorSysGenServerUsername?: string;
    monitorSysGenServerPassword?: string;
  } | null;
}

const props = defineProps<Props>();

// 响应式数�?
const desktopDisplay = ref<HTMLElement>();
const guacamoleClient = ref<SimpleGuacamoleClient | null>(null);
const currentState = ref(GuacamoleStates.IDLE);
const isConnecting = ref(false);

// 计算属�?
const isConnected = computed(() => currentState.value === GuacamoleStates.CONNECTED);

const connectionStatus = computed(() => {
  switch (currentState.value) {
    case GuacamoleStates.CONNECTED:
      return { type: 'success' as const, text: '已连�? };
    case GuacamoleStates.CONNECTING:
      return { type: 'warning' as const, text: '连接�? };
    case GuacamoleStates.DISCONNECTED:
      return { type: 'info' as const, text: '未连�? };
    default:
      return { type: 'info' as const, text: '空闲' };
  }
});

// 方法
const connect = async () => {
  if (!props.server || !desktopDisplay.value) {
    ElMessage.error('服务器信息不完整或显示容器未准备�?);
    return;
  }

  try {
    isConnecting.value = true;
    
    // 创建 Guacamole 客户端配�?
    const config = {
      serverId: props.server.monitorSysGenServerId,
      protocol: 'rdp' as const,
      host: props.server.monitorSysGenServerHost,
      port: props.server.monitorSysGenServerPort || 3389,
      username: props.server.monitorSysGenServerUsername || '',
      password: props.server.monitorSysGenServerPassword || '',
      resolution: '1920x1080',
      colorDepth: 32,
      enableAudio: true,
      enableClipboard: true
    };

    // 创建客户�?
    guacamoleClient.value = new SimpleGuacamoleClient(config, {
      onStateChange: (state: number) => {
        currentState.value = state;
        console.log('RDP 连接状态变�?', state);
      },
      onError: (error: any) => {
        console.error('RDP 连接错误:', error);
        ElMessage.error(`连接错误: ${error.message || error}`);
        isConnecting.value = false;
      },
      onName: (name: string) => {
        console.log('RDP 会话名称:', name);
      },
      onClipboard: (_stream: any, mimetype: string) => {
        console.log('收到剪贴板数�?', mimetype);
      }
    });

    // 连接到服务器
    await guacamoleClient.value.connect();

    // 绑定到显示容�?
    guacamoleClient.value.attachTo(desktopDisplay.value);
    
    ElMessage.success('RDP 连接成功');
    
  } catch (error) {
    console.error('RDP 连接失败:', error);
    ElMessage.error(`连接失败: ${error}`);
  } finally {
    isConnecting.value = false;
  }
};

const disconnect = () => {
  if (guacamoleClient.value) {
    guacamoleClient.value.disconnect();
    guacamoleClient.value = null;
  }
  currentState.value = GuacamoleStates.DISCONNECTED;
  ElMessage.success('已断开 RDP 连接');
};

const takeScreenshot = () => {
  if (guacamoleClient.value && isConnected.value) {
    const screenshot = guacamoleClient.value.screenshot();
    if (screenshot) {
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `rdp-screenshot-${Date.now()}.png`;
      link.href = screenshot;
      link.click();
      ElMessage.success('截图已保�?);
    } else {
      ElMessage.error('截图失败');
    }
  }
};

// 生命周期
onMounted(() => {
  console.log('SimpleRDPDesktop 组件已挂�?);
  // 移除自动连接，改为手动点击连接按�?
});

onUnmounted(() => {
  if (guacamoleClient.value) {
    guacamoleClient.value.destroy();
  }
});
</script>

<style scoped>
.simple-rdp-desktop {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.desktop-header {
  display: flex;
  justify-content: right;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid #e4e7ed;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.server-info {
  font-weight: 500;
  color: #606266;
}

.desktop-controls {
  display: flex;
  gap: 8px;
}

.desktop-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.desktop-display {
  width: 100%;
  height: 100%;
  background: #000;
  cursor: crosshair;
}

.desktop-display.connected {
  cursor: default;
}

.desktop-display :deep(canvas) {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
}

.connection-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.connecting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-primary);
  gap: 16px;
}

.connecting-overlay p {
  margin: 0;
  font-size: 14px;
}
</style>
