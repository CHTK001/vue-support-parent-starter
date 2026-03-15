<template>
  <div class="page-container">
    <!-- 内容区域 -->
    <ScCard shadow="hover" class="log-card">
      <div class="log-container">
        <!-- 控制面板 -->
        <div class="control-panel">
          <div class="filter-group">
            <ScRadioGroup v-model="filterLevel" size="small">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="ERROR">ERROR</el-radio-button>
              <el-radio-button value="WARN">WARN</el-radio-button>
              <el-radio-button value="INFO">INFO</el-radio-button>
              <el-radio-button value="DEBUG">DEBUG</el-radio-button>
            </ScRadioGroup>
          </div>
          <ScInput v-model="form.message" placeholder="筛选关键字..." clearable class="search-input" size="small">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </ScInput>
          <div class="font-size-control">
            <span class="font-label">字号</span>
            <ScSlider v-model="config.fontSize" :min="10" :max="20" :step="1" :show-tooltip="true" style="width: 80px" />
          </div>
          <div class="control-buttons">
            <ScTooltip :content="config.lock ? '已开启自动滚�? : '已停止自动滚�?" placement="top">
              <ScButton v-if="config.lock" type="primary" circle size="small" :icon="useRenderIcon('ep:lock')" @click="config.lock = false" />
              <ScButton v-else type="info" circle size="small" :icon="useRenderIcon('ep:unlock')" @click="config.lock = true" />
            </ScTooltip>
            <ScTooltip content="滚动到底�? placement="top">
              <ScButton circle type="success" size="small" :icon="useRenderIcon('ep:bottom')" @click="scrollToBottom" />
            </ScTooltip>
            <ScTooltip content="清空日志" placement="top">
              <ScButton circle type="danger" size="small" :icon="useRenderIcon('ep:delete-filled')" @click="clearLogs" />
            </ScTooltip>
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
          <ScEmpty v-if="!dataList || dataList.length == 0" description="暂无日志记录" />
        </div>
      </div>
    </ScCard>
  </div>
</template>
<script setup>
import { nextTick, ref, onUnmounted, reactive, onMounted, computed } from "vue";
import { AnsiUp } from "ansi_up";
import { useRenderIcon } from "@repo/components";
import { wsService } from "@/utils/websocket";
import { ScSlider } from "@repo/components";

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
  return dataList.filter(item => item?.data?.message?.includes("ERROR")).length;
});
const warnCount = computed(() => {
  return dataList.filter(item => item?.data?.message?.includes("WARN")).length;
});
let unsubscribe = null;

// WebSocket 连接状�?
const wsConnected = computed(() => wsService.connected.value);

// 滚动到底�?
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
      // 自动滚动到底�?
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
  // 再按关键字过�?
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
  display: flex;
  flex-direction: column;
  height: 100%;
}

.control-panel {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

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
  position: relative;
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 180px);
  overflow: auto;
}

.log-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  font-family: "Courier New", monospace;
  line-height: 1.6;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-lighter);
  }

  .log-index {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 24px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-info);
    background: var(--el-color-info-light-9);
    border-radius: 4px;
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

  .log-card {
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  }
}
</style>
