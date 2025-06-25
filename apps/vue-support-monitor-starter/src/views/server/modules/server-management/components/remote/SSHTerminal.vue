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
        <el-button size="small" @click="testAnsiColors" :disabled="connectionStatus !== 'connected'">
          <IconifyIconOnline icon="ri:palette-line" class="mr-1" />
          测试颜色
        </el-button>
        <el-button size="small" @click="clearTerminal">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清屏
        </el-button>
        <el-button size="small" @click="emit('close')">
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
import { useSSHWebSocket } from "@/composables/useServerWebSocket";

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
const bytesReceived = ref(0);
const bytesSent = ref(0);

// 引用
const terminalContainer = ref<HTMLElement>();
const terminalContent = ref<HTMLElement>();
const terminalOutput = ref<HTMLElement>();

// WebSocket连接
const terminal = ref<any>(null); // xterm.js实例
const { connectSSH, sendSSHInput, disconnectSSH, onSSHData, onSSHStatus } = useSSHWebSocket(props.server?.id || 0);

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

    // 初始化终端
    await initTerminal();

    // 发送 SSH 连接请求
    const success = connectSSH(props.server?.host || '', props.server?.port || 22);
    if (!success) {
      throw new Error('发送连接请求失败');
    }

    // 注意：不在这里设置连接状态，等待后端的ssh_connect消息确认
  } catch (error) {
    connectionStatus.value = 'error';
    message.error('SSH连接失败');
    console.error('SSH连接失败:', error);
  } finally {
    connecting.value = false;
  }
};

const disconnect = () => {
  try {
    // 发送断开连接消息
    disconnectSSH('用户主动断开');

    if (terminal.value) {
      try {
        // 清理事件监听器
        if (terminal.value._resizeHandler) {
          window.removeEventListener('resize', terminal.value._resizeHandler);
        }

        // 安全地销毁终端实例
        terminal.value.dispose();
      } catch (error) {
        console.warn('终端销毁时出现警告:', error);
      }
      terminal.value = null;
    }

    connectionStatus.value = 'disconnected';
    stopDurationTimer();
    resetStats();
  } catch (error) {
    console.error('断开连接时出错:', error);
  }
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

/**
 * 测试 ANSI 颜色和格式
 */
const testAnsiColors = () => {
  if (!terminal.value) return;

  // 测试各种 ANSI 转义序列
  const testData = [
    '\r\n=== ANSI 颜色测试 ===\r\n',
    '\x1b[31m红色文本\x1b[0m\r\n',
    '\x1b[32m绿色文本\x1b[0m\r\n',
    '\x1b[33m黄色文本\x1b[0m\r\n',
    '\x1b[34m蓝色文本\x1b[0m\r\n',
    '\x1b[35m紫色文本\x1b[0m\r\n',
    '\x1b[36m青色文本\x1b[0m\r\n',
    '\x1b[37m白色文本\x1b[0m\r\n',
    '\x1b[1m粗体文本\x1b[0m\r\n',
    '\x1b[4m下划线文本\x1b[0m\r\n',
    '\x1b[7m反色文本\x1b[0m\r\n',
    '\x1b[41m红色背景\x1b[0m\r\n',
    '\x1b[42m绿色背景\x1b[0m\r\n',
    '\x1b[43m黄色背景\x1b[0m\r\n',
    '\x1b[44m蓝色背景\x1b[0m\r\n',
    '\x1b[1;31m粗体红色\x1b[0m\r\n',
    '\x1b[1;32m粗体绿色\x1b[0m\r\n',
    '\x1b[1;33m粗体黄色\x1b[0m\r\n',
    '\x1b[1;34m粗体蓝色\x1b[0m\r\n',
    '=== 测试完成 ===\r\n\r\n'
  ];

  // 逐行输出测试数据
  testData.forEach((line, index) => {
    setTimeout(() => {
      terminal.value.write(line);
    }, index * 100);
  });
};

/**
 * 初始化 SSH 消息监听
 */
const initSSHMessageHandlers = () => {
  // 监听 SSH 数据
  onSSHData((data: string) => {
    if (terminal.value) {
      // 确保数据是字符串格式
      let outputData = data;
      if (typeof outputData !== 'string') {
        outputData = String(outputData);
      }

      // 调试：打印原始数据以检查 ANSI 转义序列
      if (outputData.includes('\x1b[') || outputData.includes('\x1b[')) {
        console.log('检测到 ANSI 转义序列:', outputData.replace(/\x1b/g, '\\x1b'));
      }

      // 直接写入终端，xterm.js 会自动处理 ANSI 转义序列
      terminal.value.write(outputData);
      bytesReceived.value += outputData.length;

      console.log('SSH数据:', outputData.length, '字节');
    }
  });

  // 监听 SSH 连接状态
  onSSHStatus((status: 'connected' | 'disconnected' | 'error', message?: string) => {
    switch (status) {
      case 'connected':
        console.log('SSH连接成功');
        connectionStatus.value = 'connected';
        connectionStartTime.value = Date.now();
        startDurationTimer();

        // 先清除终端内容
        if (terminal.value) {
          terminal.value.clear();

          // 发送欢迎消息测试 ANSI 转义序列
          const welcomeMessage = '\r\n\x1b[32m✓ SSH 连接成功\x1b[0m\r\n\x1b[36m服务器: ' +
            (props.server?.name || 'Unknown') + '\x1b[0m\r\n\x1b[33m准备就绪，请输入命令...\x1b[0m\r\n\r\n';
          terminal.value.write(welcomeMessage);

          // 连接成功后重新调整终端大小
          setTimeout(() => {
            try {
              // 触发窗口大小变化事件来重新调整终端
              window.dispatchEvent(new Event('resize'));
            } catch (error) {
              console.warn('连接后调整终端大小失败:', error);
            }
          }, 100);
        }

        // 显示连接成功消息
        message.success('SSH连接成功');
        break;
      case 'disconnected':
        console.log('SSH连接断开:', message);
        connectionStatus.value = 'disconnected';
        break;
      case 'error':
        console.error('SSH错误:', message);
        connectionStatus.value = 'error';
        message.error(message || 'SSH连接错误');
        break;
    }
  });
};



const initTerminal = async () => {
  try {
    // 如果终端已存在，先清理
    if (terminal.value) {
      try {
        terminal.value.dispose();
      } catch (error) {
        console.warn('清理旧终端时出现警告:', error);
      }
      terminal.value = null;
    }

    // 动态导入xterm.js和相关插件
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
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      allowTransparency: true,
      convertEol: true,
      scrollback: 1000,
      tabStopWidth: 8,
      allowProposedApi: true,
      // 确保 ANSI 转义序列被正确处理
      windowsMode: false,
      macOptionIsMeta: false,
      rightClickSelectsWord: true,
      // 确保支持所有 ANSI 功能
      disableStdin: false
    });

    // 创建插件实例
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // 安全地加载插件
    try {
      terminal.value.loadAddon(fitAddon);
      terminal.value.loadAddon(webLinksAddon);
    } catch (error) {
      console.warn('加载终端插件时出现警告:', error);
    }

    // 挂载到DOM
    if (terminalOutput.value) {
      terminal.value.open(terminalOutput.value);

      // 等待DOM更新后再调整大小
      await nextTick();
      try {
        fitAddon.fit();
        // 强制刷新终端布局
        terminal.value.refresh(0, terminal.value.rows - 1);
      } catch (error) {
        console.warn('调整终端大小时出现警告:', error);
      }
    }

    // 监听用户输入
    terminal.value.onData((data: string) => {
      if (connectionStatus.value === 'connected') {
        // 发送SSH输入数据
        const success = sendSSHInput(data);
        if (success) {
          bytesSent.value += data.length;
        }
      }
    });

    // 监听窗口大小变化
    const resizeHandler = () => {
      try {
        if (terminal.value && fitAddon) {
          fitAddon.fit();
          // 强制刷新终端布局
          terminal.value.refresh(0, terminal.value.rows - 1);
        }
      } catch (error) {
        console.warn('窗口大小变化时调整终端大小出现警告:', error);
      }
    };

    window.addEventListener('resize', resizeHandler);

    // 保存清理函数
    terminal.value._resizeHandler = resizeHandler;

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
        if (terminal.value && connectionStatus.value === 'connected') {
          // 发送SSH输入数据
          const success = sendSSHInput(text);
          if (success) {
            bytesSent.value += text.length;
          }
        }
      });
      break;
  }
};

// 生命周期
onMounted(() => {
  // 初始化 SSH 消息处理
  initSSHMessageHandlers();
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
  width: 100%;
  background-color: #1e1e1e;

  :deep(.xterm) {
    height: 100%;
    width: 100%;
  }

  :deep(.xterm-viewport) {
    overflow-y: auto;
  }

  :deep(.xterm-screen) {
    width: 100%;
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
