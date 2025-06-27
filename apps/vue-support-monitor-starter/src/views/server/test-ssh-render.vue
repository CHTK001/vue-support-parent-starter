<template>
  <div class="test-ssh-render">
    <div class="test-header">
      <h2>SSH终端渲染测试</h2>
      <div class="test-controls">
        <el-button @click="toggleServer" type="primary">
          切换服务器 (当前: {{ currentServerId }})
        </el-button>
        <el-button @click="forceRerender" type="warning">
          强制重新渲染
        </el-button>
        <el-button @click="clearLogs" type="info">
          清空日志
        </el-button>
      </div>
    </div>

    <div class="test-content">
      <!-- 左侧：SSH终端 -->
      <div class="terminal-section">
        <h3>SSH终端组件</h3>
        <div class="terminal-wrapper">
          <SSHTerminal
            v-if="showTerminal"
            :server="currentServer"
            :key="`test-ssh-${currentServerId}-${renderKey}`"
            @close="handleClose"
          />
        </div>
      </div>

      <!-- 右侧：调试信息 -->
      <div class="debug-section">
        <h3>调试信息</h3>
        <div class="debug-info">
          <p><strong>当前服务器ID:</strong> {{ currentServerId }}</p>
          <p><strong>渲染Key:</strong> {{ renderKey }}</p>
          <p><strong>组件显示状态:</strong> {{ showTerminal ? '显示' : '隐藏' }}</p>
          <p><strong>渲染次数:</strong> {{ renderCount }}</p>
        </div>

        <div class="logs-section">
          <h4>渲染日志</h4>
          <div class="logs" ref="logsContainer">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch, nextTick } from "vue";

// 异步加载SSH终端组件
const SSHTerminal = defineAsyncComponent(() => import("./modules/server-management/components/remote/SSHTerminal.vue"));

// 测试数据
const testServers = [
  { id: "1", name: "测试服务器1", host: "192.168.1.100", port: 22, protocol: "SSH" },
  { id: "2", name: "测试服务器2", host: "192.168.1.101", port: 22, protocol: "SSH" },
  { id: "3", name: "测试服务器3", host: "192.168.1.102", port: 22, protocol: "SSH" },
];

// 状态
const currentServerId = ref("1");
const renderKey = ref(0);
const showTerminal = ref(true);
const renderCount = ref(0);
const logs = ref<Array<{ time: string, message: string }>>([]);
const logsContainer = ref<HTMLElement>();

// 计算属性
const currentServer = computed(() => {
  return testServers.find(s => s.id === currentServerId.value);
});

// 方法
const addLog = (message: string) => {
  const now = new Date();
  const time = now.toLocaleTimeString();
  logs.value.push({ time, message });
  
  // 自动滚动到底部
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
};

const toggleServer = () => {
  const currentIndex = testServers.findIndex(s => s.id === currentServerId.value);
  const nextIndex = (currentIndex + 1) % testServers.length;
  const nextServer = testServers[nextIndex];
  
  addLog(`切换服务器: ${currentServer.value?.name} -> ${nextServer.name}`);
  currentServerId.value = nextServer.id;
  renderKey.value++;
};

const forceRerender = () => {
  addLog("强制重新渲染组件");
  renderKey.value++;
  showTerminal.value = false;
  nextTick(() => {
    showTerminal.value = true;
  });
};

const clearLogs = () => {
  logs.value = [];
  addLog("日志已清空");
};

const handleClose = () => {
  addLog("SSH终端组件关闭");
  showTerminal.value = false;
};

// 监听渲染
watch([currentServerId, renderKey], ([newServerId, newRenderKey], [oldServerId, oldRenderKey]) => {
  renderCount.value++;
  if (oldServerId !== undefined) {
    addLog(`组件重新渲染 - 服务器ID: ${newServerId}, 渲染Key: ${newRenderKey}`);
  }
}, { immediate: true });

// 初始化
addLog("SSH终端渲染测试页面初始化完成");
</script>

<style lang="scss" scoped>
.test-ssh-render {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0;
    color: var(--el-text-color-primary);
  }

  .test-controls {
    display: flex;
    gap: 12px;
  }
}

.test-content {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.terminal-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
  }

  .terminal-wrapper {
    flex: 1;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    overflow: hidden;
  }
}

.debug-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3, h4 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
  }

  .debug-info {
    margin-bottom: 20px;
    padding: 12px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .logs-section {
    flex: 1;
    display: flex;
    flex-direction: column;

    .logs {
      flex: 1;
      max-height: 400px;
      overflow-y: auto;
      padding: 12px;
      background-color: #1e1e1e;
      border-radius: 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;

      .log-item {
        margin-bottom: 4px;
        display: flex;
        gap: 8px;

        .log-time {
          color: #569cd6;
          min-width: 80px;
        }

        .log-message {
          color: #d4d4d4;
        }
      }

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #2d2d2d;
      }

      &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 3px;

        &:hover {
          background: #777;
        }
      }
    }
  }
}
</style>
