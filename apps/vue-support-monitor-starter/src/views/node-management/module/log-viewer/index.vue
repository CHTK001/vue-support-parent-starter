<template>
  <sc-dialog
    v-model="visible"
    title="节点日志查看"
    width="80%"
    :before-close="handleClose"
    append-to-body
    class="log-viewer-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <IconifyIconOnline icon="ri:file-list-3-line" class="header-icon" />
          <div class="header-text">
            <h3>节点日志查看</h3>
            <p v-if="nodeInfo">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }}
              ({{ nodeInfo.ipAddress }}:{{ nodeInfo.port }})
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="log-viewer-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-select
          v-model="selectedLogFile"
          placeholder="选择日志文件"
          style="width: 200px"
          @change="loadLogContent"
        >
          <el-option
            v-for="file in logFiles"
            :key="file"
            :label="file"
            :value="file"
          />
        </el-select>

        <el-input-number
          v-model="lines"
          :min="50"
          :max="1000"
          :step="50"
          style="width: 150px"
          placeholder="行数"
        />

        <el-button type="primary" @click="loadLogContent" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>

        <el-button @click="toggleAutoRefresh">
          <IconifyIconOnline
            :icon="autoRefresh ? 'ri:pause-circle-line' : 'ri:play-circle-line'"
          />
          {{ autoRefresh ? "停止自动刷新" : "自动刷新" }}
        </el-button>

        <el-button @click="scrollToBottom">
          <IconifyIconOnline icon="ri:arrow-down-line" />
          滚动到底部
        </el-button>

        <el-button @click="copyLogContent">
          <IconifyIconOnline icon="ri:file-copy-line" />
          复制
        </el-button>
      </div>

      <!-- 日志内容 -->
      <div class="log-content-wrapper">
        <div v-if="loading" class="loading-mask">
          <el-icon class="is-loading">
            <IconifyIconOnline icon="ri:loader-4-line" />
          </el-icon>
          <span>加载中...</span>
        </div>

        <pre ref="logContentRef" class="log-content">{{ logContent }}</pre>

        <div v-if="!loading && !logContent" class="empty-content">
          <el-empty description="暂无日志内容" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { message } from "@repo/utils";
import {
  getLogFilesForNodeControl,
  getLogContentForNodeControl,
} from "@/api/server/node-control";

interface Props {
  modelValue: boolean;
  nodeInfo?: {
    nodeName?: string;
    applicationName: string;
    ipAddress: string;
    port: number;
  } | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const logFiles = ref<string[]>([]);
const selectedLogFile = ref("application.log");
const logContent = ref("");
const lines = ref(200);
const autoRefresh = ref(false);
const logContentRef = ref<HTMLElement>();

let refreshTimer: NodeJS.Timeout | null = null;

/**
 * 加载日志文件列表
 */
const loadLogFiles = async () => {
  if (!props.nodeInfo) return;

  try {
    const response = await getLogFilesForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port
    );
    if (response.success && response.data) {
      logFiles.value = response.data;
      if (logFiles.value.length > 0 && !selectedLogFile.value) {
        selectedLogFile.value = logFiles.value[0];
      }
    }
  } catch (error) {
    console.error("加载日志文件列表失败:", error);
  }
};

/**
 * 加载日志内容
 */
const loadLogContent = async () => {
  if (!props.nodeInfo) return;

  loading.value = true;
  try {
    const response = await getLogContentForNodeControl(
      props.nodeInfo.ipAddress,
      props.nodeInfo.port,
      selectedLogFile.value,
      lines.value
    );
    if (response.success && response.data) {
      logContent.value = response.data;
    } else {
      message.error(response.msg || "获取日志内容失败");
    }
  } catch (error) {
    console.error("加载日志内容失败:", error);
    message.error("加载日志内容失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 切换自动刷新
 */
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startAutoRefresh();
    message.success("已开启自动刷新");
  } else {
    stopAutoRefresh();
    message.info("已停止自动刷新");
  }
};

/**
 * 开始自动刷新
 */
const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    loadLogContent();
  }, 5000);
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  if (logContentRef.value) {
    logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
  }
};

/**
 * 复制日志内容
 */
const copyLogContent = async () => {
  try {
    await navigator.clipboard.writeText(logContent.value);
    message.success("日志内容已复制到剪贴板");
  } catch {
    message.error("复制失败");
  }
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  stopAutoRefresh();
  autoRefresh.value = false;
  visible.value = false;
};

watch(
  () => props.nodeInfo,
  (newNodeInfo) => {
    if (newNodeInfo && visible.value) {
      loadLogFiles();
      loadLogContent();
    }
  },
  { immediate: true }
);

watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadLogFiles();
    loadLogContent();
  } else if (!newVisible) {
    stopAutoRefresh();
    autoRefresh.value = false;
    logContent.value = "";
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.log-viewer-content {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .log-content-wrapper {
    position: relative;
    height: 500px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;

    .loading-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 10;

      .el-icon {
        font-size: 32px;
        color: var(--el-color-primary);
        margin-bottom: 8px;
      }
    }

    .log-content {
      height: 100%;
      margin: 0;
      padding: 16px;
      overflow: auto;
      background: var(--el-fill-color-darker);
      color: var(--el-text-color-primary);
      font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .empty-content {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
