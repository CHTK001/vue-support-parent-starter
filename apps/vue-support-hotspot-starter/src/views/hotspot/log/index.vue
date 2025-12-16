<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:file-text-line" class="header-icon" />
        <div class="header-info">
          <h2 class="header-title">日志监控</h2>
          <p class="header-desc">实时查看应用运行日志输出</p>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-card">
          <div class="stat-number">{{ dataList.length }}</div>
          <div class="stat-label">日志总数</div>
        </div>
        <div class="stat-card error">
          <div class="stat-number">{{ errorCount }}</div>
          <div class="stat-label">ERROR</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">{{ warnCount }}</div>
          <div class="stat-label">WARN</div>
        </div>
        <el-tag :type="wsConnected ? 'success' : 'danger'" effect="light" size="large">
          {{ wsConnected ? 'WS已连接' : 'WS未连接' }}
        </el-tag>
      </div>
    </div>

    <!-- 内容区域 -->
    <el-card shadow="never" class="log-card">
      <div class="log-container">
        <!-- 控制面板 -->
        <div class="control-panel">
          <div class="filter-group">
            <el-radio-group v-model="filterLevel" size="small">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="ERROR">ERROR</el-radio-button>
              <el-radio-button value="WARN">WARN</el-radio-button>
              <el-radio-button value="INFO">INFO</el-radio-button>
              <el-radio-button value="DEBUG">DEBUG</el-radio-button>
            </el-radio-group>
          </div>
          <el-input v-model="form.message" placeholder="筛选关键字..." clearable class="search-input" size="small">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
          <div class="font-size-control">
            <span class="font-label">字号</span>
            <el-slider v-model="config.fontSize" :min="10" :max="20" :step="1" :show-tooltip="true" style="width: 80px" />
          </div>
          <div class="control-buttons">
            <el-tooltip :content="config.lock ? '已开启自动滚动' : '已停止自动滚动'" placement="top">
              <el-button v-if="config.lock" type="primary" circle size="small" :icon="useRenderIcon('ep:lock')" @click="config.lock = false" />
              <el-button v-else type="info" circle size="small" :icon="useRenderIcon('ep:unlock')" @click="config.lock = true" />
            </el-tooltip>
            <el-tooltip content="滚动到底部" placement="top">
              <el-button circle type="success" size="small" :icon="useRenderIcon('ep:bottom')" @click="scrollToBottom" />
            </el-tooltip>
            <el-tooltip content="清空日志" placement="top">
              <el-button circle type="danger" size="small" :icon="useRenderIcon('ep:delete-filled')" @click="clearLogs" />
            </el-tooltip>
          </div>
        </div>
          <!-- 日志列表 -->
          <div id="logListContainer" class="log-list-container thin-scroller">
            <ul class="log-list" :style="{ fontSize: config.fontSize + 'px' }">
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
const filterLevel = ref("");
const dataList = reactive([]);
const config = reactive({
  lock: true,
  fontSize: 13
});

// 统计计数
const errorCount = computed(() => {
  return dataList.filter(item => item?.data?.message?.includes('ERROR')).length;
});
const warnCount = computed(() => {
  return dataList.filter(item => item?.data?.message?.includes('WARN')).length;
});
let unsubscribe = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector("#logListContainer");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// 清空日志
const clearLogs = () => {
  dataList.length = 0;
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
          const container = document.querySelector("#logListContainer");
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
  // 先按级别过滤
  if (filterLevel.value && row?.data?.message) {
    if (!row.data.message.includes(filterLevel.value)) {
      return false;
    }
  }
  // 再按关键字过滤
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
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-info-light-9) 0%, var(--el-color-info-light-8) 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;
      color: var(--el-color-info);
      padding: 12px;
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      border-radius: 12px;
    }

    .header-info {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-desc {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-card {
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: var(--el-color-info);
      }

      .stat-label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }

      &.error .stat-number {
        color: var(--el-color-danger);
      }

      &.warning .stat-number {
        color: var(--el-color-warning);
      }
    }
  }
}

.log-card {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;

  :deep(.el-card__body) {
    height: 100%;
    padding: 16px;
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
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;

  .filter-group {
    flex-shrink: 0;
  }

  .search-input {
    width: 180px;
  }

  .control-buttons {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  
  .font-size-control {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-left: auto;
    
    .font-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }
}

.log-list-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
  max-height: calc(100vh - 180px);
  position: relative;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-family: "Courier New", monospace;
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

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .page-header {
    background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    .header-right .stat-card {
      background: var(--el-bg-color);
    }
  }

  .log-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>
