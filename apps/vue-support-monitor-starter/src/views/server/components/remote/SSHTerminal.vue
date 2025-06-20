<template>
  <div class="ssh-terminal">
    <!-- 头部工具栏 -->
    <div class="terminal-header">
      <div class="terminal-info">
        <IconifyIconOnline icon="ri:terminal-line" class="mr-2" />
        <span class="terminal-title">SSH终端 - {{ server?.name }}</span>
        <el-tag :type="connectionStatus === 'connected' ? 'success' : 'danger'" size="small" class="ml-2">
          {{ connectionStatusText }}
        </el-tag>
      </div>
      <div class="terminal-actions">
        <el-button size="small" @click="reconnect" :disabled="connecting">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重连
        </el-button>
        <el-button size="small" @click="clearTerminal">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清屏
        </el-button>
        <el-button size="small" @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          关闭
        </el-button>
      </div>
    </div>

    <!-- 终端容器 -->
    <div class="terminal-container" ref="terminalContainer" v-loading="connecting">
      <div class="terminal-content" ref="terminalContent">
        <!-- 连接状态提示 -->
        <div v-if="connectionStatus === 'disconnected'" class="connection-prompt">
          <div class="prompt-content">
            <IconifyIconOnline icon="ri:terminal-line" class="prompt-icon" />
            <h3>SSH终端连接</h3>
            <p>服务器: {{ server?.host }}:{{ server?.port }}</p>
            <el-button type="primary" @click="connect" :loading="connecting">
              <IconifyIconOnline icon="ri:play-line" class="mr-1" />
              连接
            </el-button>
          </div>
        </div>

        <!-- 终端输出区域 -->
        <div v-show="connectionStatus === 'connected'" class="terminal-output" ref="terminalOutput">
          <!-- 这里将集成xterm.js终端 -->
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="terminal-footer" v-if="connectionStatus === 'connected'">
      <div class="status-info">
        <span class="status-item">
          <IconifyIconOnline icon="ri:time-line" class="mr-1" />
          连接时间: {{ formatDuration(connectionDuration) }}
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          接收: {{ formatBytes(bytesReceived) }}
        </span>
        <span class="status-item">
          <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
          发送: {{ formatBytes(bytesSent) }}
        </span>
      </div>
      <div class="terminal-settings">
        <el-dropdown @command="handleSettingCommand">
          <el-button size="small" text>
            <IconifyIconOnline icon="ri:settings-line" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="fontSize">字体大小</el-dropdown-item>
              <el-dropdown-item command="theme">主题设置</el-dropdown-item>
              <el-dropdown-item command="encoding">编码设置</el-dropdown-item>
              <el-dropdown-item command="copy" divided>复制选中</el-dropdown-item>
              <el-dropdown-item command="paste">粘贴</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { message } from "@repo/utils";
import { io, Socket } from "socket.io-client";

// Props
const props = defineProps<{
  server: any;
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
const bytesReceived = ref(0);
const bytesSent = ref(0);

// 引用
const terminalContainer = ref<HTMLElement>();
const terminalContent = ref<HTMLElement>();
const terminalOutput = ref<HTMLElement>();

// WebSocket连接
const socket = ref<Socket | null>(null);
const terminal = ref<any>(null); // xterm.js实例

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
    
    // 初始化终端
    await initTerminal();

    connectionStatus.value = 'connected';
    connectionStartTime.value = Date.now();
    startDurationTimer();

    message.success('SSH连接成功');
  } catch (error) {
    connectionStatus.value = 'error';
    message.error('SSH连接失败');
    console.error('SSH连接失败:', error);
  } finally {
    connecting.value = false;
  }
};

const disconnect = () => {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }

  if (terminal.value) {
    terminal.value.dispose();
    terminal.value = null;
  }

  connectionStatus.value = 'disconnected';
  stopDurationTimer();
  resetStats();
};

const reconnect = async () => {
  disconnect();
  await nextTick();
  await connect();
};

const clearTerminal = () => {
  if (terminal.value) {
    terminal.value.clear();
  }
};

const initWebSocket = async () => {
  return new Promise((resolve, reject) => {
    try {
      // 创建WebSocket连接到SSH服务
      socket.value = io('/ssh', {
        query: {
          serverId: props.server?.id,
          host: props.server?.host,
          port: props.server?.port,
          username: props.server?.username,
          // 其他连接参数
        }
      });

      socket.value.on('connect', () => {
        console.log('SSH WebSocket连接成功');
        resolve(true);
      });

      socket.value.on('disconnect', () => {
        console.log('SSH WebSocket连接断开');
        connectionStatus.value = 'disconnected';
      });

      socket.value.on('data', (data: string) => {
        if (terminal.value) {
          terminal.value.write(data);
          bytesReceived.value += data.length;
        }
      });

      socket.value.on('error', (error: any) => {
        console.error('SSH WebSocket错误:', error);
        reject(error);
      });

      // 连接超时处理
      setTimeout(() => {
        if (connectionStatus.value === 'connecting') {
          reject(new Error('连接超时'));
        }
      }, 10000);

    } catch (error) {
      reject(error);
    }
  });
};

const initTerminal = async () => {
  try {
    // 动态导入xterm.js
    const { Terminal } = await import('xterm');
    const { FitAddon } = await import('xterm-addon-fit');
    const { WebLinksAddon } = await import('xterm-addon-web-links');

    // 创建终端实例
    terminal.value = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78'
      },
      allowTransparency: true
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.value.loadAddon(fitAddon);
    terminal.value.loadAddon(webLinksAddon);

    // 挂载到DOM
    if (terminalOutput.value) {
      terminal.value.open(terminalOutput.value);
      fitAddon.fit();
    }

    // 监听用户输入
    terminal.value.onData((data: string) => {
      if (socket.value) {
        socket.value.emit('input', data);
        bytesSent.value += data.length;
      }
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      fitAddon.fit();
    });

  } catch (error) {
    console.error('初始化终端失败:', error);
    throw error;
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
  bytesReceived.value = 0;
  bytesSent.value = 0;
  connectionDuration.value = 0;
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

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleSettingCommand = (command: string) => {
  switch (command) {
    case 'fontSize':
      // TODO: 实现字体大小设置
      break;
    case 'theme':
      // TODO: 实现主题设置
      break;
    case 'encoding':
      // TODO: 实现编码设置
      break;
    case 'copy':
      if (terminal.value) {
        const selection = terminal.value.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
          message.success('已复制到剪贴板');
        }
      }
      break;
    case 'paste':
      navigator.clipboard.readText().then(text => {
        if (terminal.value && socket.value) {
          socket.value.emit('input', text);
          bytesSent.value += text.length;
        }
      });
      break;
  }
};

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
.ssh-terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .terminal-info {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .terminal-title {
      margin-right: 8px;
    }
  }

  .terminal-actions {
    display: flex;
    gap: 8px;
  }
}

.terminal-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.terminal-content {
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
  }
}

.terminal-output {
  height: 100%;
  background-color: #1e1e1e;

  :deep(.xterm) {
    height: 100%;
  }

  :deep(.xterm-viewport) {
    overflow-y: auto;
  }
}

.terminal-footer {
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

  .terminal-settings {
    display: flex;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .terminal-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .terminal-actions {
      justify-content: flex-end;
    }
  }

  .terminal-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .status-info {
      justify-content: space-between;
    }
  }
}
</style>
