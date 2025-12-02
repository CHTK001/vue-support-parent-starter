<template>
  <div class="log-layout">
    <div class="log-container thin-scrollbar" :style="{ height: `${height}px` }" ref="logContainerRef">
      <div v-for="(log, index) in logs" :key="index" class="log-item" :style="{ paddingLeft: `${log.indent * 20}px` }">
        <span class="log-time">{{ formatTime(log.time) }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>

    <div class="log-progress">
      <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="strokeWidth" :format="percentageFormat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

interface LogItem {
  time: Date;
  message: string;
  indent: number;
}

interface Props {
  logs: LogItem[];
  percentage: number;
  status: string;
  height?: number;
  strokeWidth?: number;
  autoScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  strokeWidth: 8,
  autoScroll: true
});

const logContainerRef = ref<HTMLElement>();

// 计算属性
const progressStatus = computed(() => {
  if (props.status === "success") return "success";
  if (props.status === "error") return "exception";
  return "";
});

// 格式化时间
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// 格式化百分比
const percentageFormat = (percentage: number) => {
  return percentage === 100 && props.status === "success" ? "完成" : `${percentage}%`;
};

// 滚动到底部
const scrollToBottom = () => {
  if (!props.autoScroll) return;

  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
    }
  });
};

// 监听日志变化，自动滚动
watch(() => props.logs, scrollToBottom, { deep: true });

// 暴露方法
defineExpose({
  scrollToBottom
});
</script>

<style scoped>
.log-layout {
  width: 100%;
}

.log-container {
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 3px 0;
  line-height: 1.5;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time {
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.log-message {
  color: var(--el-text-color-regular);
}

.log-progress {
  margin-top: 10px;
}

/* 滚动条样式 */
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 3px;
}

.thin-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color);
}
</style>
