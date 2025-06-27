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
              <el-dropdown-item command="copy">复制选中</el-dropdown-item>
              <el-dropdown-item command="paste">粘贴</el-dropdown-item>
              <el-dropdown-item command="cleanup" divided>清屏</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
import { message } from "@repo/utils";
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'
import { Unicode11Addon } from 'xterm-addon-unicode11'
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit'
import { useSSHWebSocket, useServerWebSocket } from "@/composables/useServerWebSocket";


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
const isInitialized = ref(false); // 防止重复初始化
const isSSHListenersInitialized = ref(false); // SSH监听器初始化状态
const { connectSSH, sendSSHInput, disconnectSSH, onSSHData, onSSHStatus, cleanupSubscriptions } = useSSHWebSocket(props.server?.id || 0);


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
  if (connecting.value || connectionStatus.value === 'connected') {
    console.log('跳过连接请求 - connecting:', connecting.value, 'status:', connectionStatus.value);
    return;
  }

  try {
    console.log('开始SSH连接...');
    connecting.value = true;
    connectionStatus.value = 'connecting';

    // 初始化终端（每次连接都重新初始化以确保状态正确）
    if (!isInitialized.value || !terminal.value) {
      console.log('初始化终端...');
      await initTerminal();
      isInitialized.value = true;
    }

    // 发送 SSH 连接请求
    console.log('发送SSH连接请求到:', props.server?.host, ':', props.server?.port);
    const success = connectSSH(props.server?.host || '', props.server?.port || 22);
    if (!success) {
      throw new Error('发送连接请求失败');
    }

    console.log('SSH连接请求已发送，等待后端确认...');
    // 注意：不在这里设置连接状态，等待后端的ssh_connect消息确认
  } catch (error) {
    console.error('SSH连接失败:', error);
    connectionStatus.value = 'error';
    message.error('SSH连接失败: ' + error.message);
  } finally {
    connecting.value = false;
  }
};

const disconnect = (skipWebSocketCleanup = false) => {
  try {
    console.log('断开SSH连接, skipWebSocketCleanup:', skipWebSocketCleanup);

    // 发送断开连接消息
    disconnectSSH('用户主动断开');

    // 只在完全关闭时清理WebSocket订阅，重连时保留
    if (!skipWebSocketCleanup) {
      cleanupSubscriptions();
      isSSHListenersInitialized.value = false;
    }

    if (terminal.value) {
      try {
        // 清理事件监听器
        if (terminal.value._resizeHandler) {
          window.removeEventListener('resize', terminal.value._resizeHandler);
        }

        // 销毁终端实例 - 这会自动清理所有相关的DOM元素
        terminal.value.dispose();
      } catch (error) {
        console.warn('终端销毁时出现警告:', error);
      }
      terminal.value = null;
    }

    // 手动清理可能残留的 xterm-helpers 元素
    setTimeout(() => {
      const helpers = document.querySelectorAll('.xterm-helpers');
      helpers.forEach(helper => {
        // 检查是否为孤立元素（没有关联的终端容器）
        if (!helper.closest('.terminal-output')) {
          helper.remove();
        }
      });
    }, 100);

    connectionStatus.value = 'disconnected';
    isInitialized.value = false;
    stopDurationTimer();
    resetStats();
  } catch (error) {
    console.error('断开连接时出错:', error);
  }
};



const reconnect = async () => {
  if (connecting.value) {
    console.log('正在连接中，跳过重连请求');
    return;
  }

  console.log('开始重连SSH...');

  // 先断开连接，但保留WebSocket订阅
  disconnect(true);

  // 等待DOM更新和清理完成
  await nextTick();

  // 等待更长时间确保后端连接完全清理
  setTimeout(async () => {
    try {
      console.log('检查WebSocket连接状态...');
      // 确保WebSocket监听器已设置
      if (!isSSHListenersInitialized.value) {
        console.log('重新初始化SSH监听器...');
        initSSHMessageHandlers();
      }

      console.log('开始重新连接...');
      await connect();
    } catch (error) {
      console.error('重连失败:', error);
      message.error('重连失败: ' + error.message);
    }
  }, 500); // 增加等待时间到500ms
};

const clearTerminal = () => {
  if (terminal.value) {
    terminal.value.clear();
  }
};




/**
 * 初始化 SSH 消息监听
 */
const initSSHMessageHandlers = () => {
  if (isSSHListenersInitialized.value) {
    console.log('SSH监听器已初始化，跳过重复初始化');
    return;
  }

  console.log('初始化SSH消息监听器...');
  // 监听 SSH 数据
  onSSHData((data: string) => {
    if (terminal.value) {
      // 确保数据是字符串格式
      let outputData = data;
      if (typeof outputData !== 'string') {
        outputData = String(outputData);
      }
      
      // 不过滤任何字符，让xterm.js完全处理ANSI转义序列
      // xterm.js内置了完整的ANSI/VT100支持，包括颜色、光标控制等

      try {
        // 直接写入终端，xterm.js 会自动处理 ANSI 转义序列
        terminal.value.write(outputData);
        bytesReceived.value += outputData.length;

        // 调试信息：显示接收到的数据（仅在开发模式下）
        if (process.env.NODE_ENV === 'development') {
          // 显示原始数据的十六进制表示
          const hexData = Array.from(outputData).map(char =>
            '\\x' + char.charCodeAt(0).toString(16).padStart(2, '0')
          ).join('');
          console.log('SSH原始数据 (hex):', hexData);
          console.log('SSH原始数据 (string):', JSON.stringify(outputData));

          // 显示ANSI转义序列的调试信息
          const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]/g;
          const ansiMatches = outputData.match(ansiRegex);
          if (ansiMatches && ansiMatches.length > 0) {
            console.log('检测到ANSI转义序列:', ansiMatches);
          } else {
            console.log('未检测到ANSI转义序列');
          }
        }
      } catch (error) {
        console.error('写入终端数据时出错:', error);
        // 如果写入失败，尝试清理数据后重试
        const cleanData = outputData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        try {
          terminal.value.write(cleanData);
          bytesReceived.value += cleanData.length;
        } catch (retryError) {
          console.error('重试写入终端数据失败:', retryError);
        }
      }
    }
  });

  // 监听 SSH 连接状态
  onSSHStatus((status: 'connected' | 'disconnected' | 'error', msg?: string) => {
    
    switch (status) {
      case 'connected':
        if(connectionStatus.value == 'connected') {
          break;
        }
        console.log('SSH连接成功');
        connectionStatus.value = 'connected';
        connectionStartTime.value = Date.now();
        startDurationTimer();
        
        // 清除终端内容并显示简单欢迎信息
        if (terminal.value) {
          terminal.value.clear();
          terminal.value.write('\x1b[32m✓ SSH 连接成功\x1b[0m\r\n');
          terminal.value.write('服务器: ' + (props.server?.name || 'Unknown') + '\r\n');
          terminal.value.write('\x1B[31m准备就绪\x1B[0m\r\n\r\n');

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
        console.log('SSH连接断开:', msg);
        connectionStatus.value = 'disconnected';
        break;
      case 'error':
        console.error('SSH错误:', msg);
        connectionStatus.value = 'error';
        message.error(msg || 'SSH连接错误');
        break;
    }
  });

  // 标记SSH监听器已初始化
  isSSHListenersInitialized.value = true;
  console.log('SSH消息监听器初始化完成');
};



const initTerminal = async () => {
  try {
    // 清理旧终端实例
    if (terminal.value) {
      terminal.value.dispose();
      terminal.value = null;
    }

    // 创建终端实例 - 最简配置
    terminal.value = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff'
      },
      convertEol: true,
      windowsMode: true,
      scrollback: 1000
    });

    // 创建并加载插件
    const fitAddon = new FitAddon();
    terminal.value.loadAddon(fitAddon);
    // terminal.value.loadAddon(new Unicode11Addon());
    terminal.value.loadAddon(new WebLinksAddon());
    // terminal.value.unicode.activeVersion = '11';

    // 挂载到DOM
    if (terminalOutput.value) {
      terminal.value.open(terminalOutput.value);
      await nextTick();
      fitAddon.fit();
    }

    // 监听用户输入
    terminal.value.onData((data: string) => {
      if (connectionStatus.value === 'connected') {
        const success = sendSSHInput(data);
        if (success) {
          bytesSent.value += data.length;
        }
      }
    });

    // 监听窗口大小变化
    const resizeHandler = () => {
      if (terminal.value && fitAddon) {
        fitAddon.fit();
      }
    };
    window.addEventListener('resize', resizeHandler);
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
    case 'cleanup':
      if (terminal.value) {
        terminal.value.clear();
        message.success('终端已清屏');
      }
      break;
    case 'copy':
      if (terminal.value) {
        const selection = terminal.value.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
          message.success('已复制到剪贴板');
        } else {
          message.warning('请先选择要复制的文本');
        }
      }
      break;
    case 'paste':
      navigator.clipboard.readText().then(text => {
        if (terminal.value && connectionStatus.value === 'connected') {
          const success = sendSSHInput(text);
          if (success) {
            bytesSent.value += text.length;
          }
        }
      }).catch(() => {
        message.error('粘贴失败，请检查剪贴板权限');
      });
      break;
  }
};





// 监听服务器变化
watch(() => props.server?.id, (newId, oldId) => {
  if (newId !== oldId && oldId !== undefined) {
    // 服务器变化时重置状态
    disconnect();
    isInitialized.value = false;
  }
}, { immediate: false });

// 生命周期
onMounted(async () => {
  try {
    // 初始化 SSH 消息处理
    initSSHMessageHandlers();

    // 自动连接 SSH
    connect();
  } catch (error) {
    console.error('WebSocket 连接失败:', error);
    message.error('WebSocket 连接失败');
  }
});

onUnmounted(() => {
  // 断开 SSH 连接
  disconnect();

  console.log('WebSocket 连接已断开');

  // // 额外的清理，确保所有xterm相关元素都被移除
  // setTimeout(() => {
  //   cleanupXtermHelpers();
  // }, 100);
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
