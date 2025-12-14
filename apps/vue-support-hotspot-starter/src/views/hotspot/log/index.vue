<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:file-text-line" class="title-icon" />
            日志监控
          </h1>
          <p class="page-subtitle">实时查看和筛选应用日志</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ dataList.length }}</div>
            <div class="stat-label">日志条数</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <div class="log-container">
          <!-- 控制面板 -->
          <div class="control-panel">
            <div class="filter-group">
              <el-radio-group v-model="form.message" size="small">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="ERROR">ERROR</el-radio-button>
                <el-radio-button value="INFO">INFO</el-radio-button>
                <el-radio-button value="DEBUG">DEBUG</el-radio-button>
              </el-radio-group>
            </div>
            <el-input v-model="form.message" placeholder="请输入请求ID筛选..." clearable class="search-input">
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
            <div class="control-buttons">
              <el-button v-if="config.lock" type="primary" circle :icon="useRenderIcon('ep:lock')" @click="config.lock = false" title="已开启自动滚动，点击停止" />
              <el-button v-else type="info" circle :icon="useRenderIcon('ep:unlock')" @click="config.lock = true" title="已停止自动滚动，点击开启" />
              <el-button circle type="success" :icon="useRenderIcon('ep:bottom')" @click="scrollToBottom" title="滚动到底部" />
              <el-button circle type="danger" :icon="useRenderIcon('ep:delete-filled')" @click="dataList.length = 0" title="清空日志" />
              <el-tag :type="wsConnected ? 'success' : 'danger'" size="small" class="ml-2">
                {{ wsConnected ? 'WS已连接' : 'WS未连接' }}
              </el-tag>
            </div>
          </div>
          <!-- 日志列表 -->
          <div class="log-list-container">
            <ul id="containerRef" class="log-list">
              <li v-for="(item, index) in getData(dataList)" :key="index" class="log-item">
                <span class="log-index">{{ index + 1 }}</span>
                <span class="log-content" v-html="ansiToHtml(item?.data?.message)" />
              </li>
            </ul>
            <el-empty v-if="!dataList || dataList.length == 0" description="暂无日志记录" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { nextTick, ref, onUnmounted, reactive, onMounted, computed } from "vue";
import { AnsiUp } from "ansi_up";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { wsService } from "@/utils/websocket";

const ansiUp = new AnsiUp();
const form = reactive({
  message: null
});
const dataList = reactive([]);
const config = reactive({
  lock: true
});
let unsubscribe = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector("#containerRef");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "AGENT_LOG") {
    try {
      const logData = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
      dataList.push({ data: logData });
      // 限制最大记录数
      while (dataList.length > 10000) {
        dataList.shift();
      }
      // 自动滚动到底部
      if (config.lock) {
        nextTick(() => {
          const container = document.querySelector("#containerRef");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    } catch (error) {
      console.error("解析日志失败:", error);
    }
  }
};

const ansiToHtml = ansiString => {
  if (!ansiString) return "";
  return ansiUp.ansi_to_html(ansiString);
};

const getData = data => {
  return data.filter(item => filter(item));
};

const filter = row => {
  if (!form.message) {
    return true;
  }
  if (!row?.data?.message) {
    return false;
  }
  return row.data.message?.indexOf(form.message) > -1;
};

onMounted(() => {
  // 连接 WebSocket
  wsService.connect();
  // 订阅日志消息
  unsubscribe = wsService.subscribe("LOG", "AGENT_LOG", handleWsMessage);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>
<style scoped lang="scss">
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .stat-number {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.log-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.control-panel {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 16px;

  .filter-group {
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    max-width: 300px;
  }

  .control-buttons {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
}

.log-list-container {
  flex: 1;
  overflow: hidden;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  height: 100%;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-lighter);
  }

  .log-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 24px;
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .log-content {
    flex: 1;
    word-break: break-all;
  }
}

:deep(.el-card) {
  border-radius: 8px;

  .el-card__body {
    height: 100%;
    padding: 16px;
  }
}
</style>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
