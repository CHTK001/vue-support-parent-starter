<template>
  <ScMessageDialog
    title="上传队列"
    icon="ri:upload-cloud-line"
    position="bottom-left"
    :offset-x="20"
    :offset-y="20"
    theme-color="#10b981"
    :operations="operationList"
    empty-text="暂无上传任务"
    :icon-map="iconMap"
    :status-text-map="statusTextMap"
    @clear="handleClear"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ScMessageDialog } from "@repo/components";
import type { UploadQueueStatus } from "@/api/monitor/filesystem";

/**
 * 上传队列状态组�?
 * 使用ScMessageDialog组件显示上传进度
 * @author CH
 * @version 2.0.0
 * @since 2025-12-01
 */

// Props
interface Props {
  queueStatus: Map<number, UploadQueueStatus>;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "queue-update": [queue: UploadQueueStatus[]];
  "pause-all": [];
  "resume-all": [];
  "clear-completed": [];
  "cancel-task": [fileId: number];
  "sync-task": [fileId: number];
}>();

// 响应式数�?
const queueList = ref<UploadQueueStatus[]>([]);

// 图标映射
const iconMap = {
  uploading: "ri:upload-line",
  merging: "ri:settings-3-line",
  completed: "ri:checkbox-circle-line",
  failed: "ri:error-warning-line",
};

// 状态文本映�?
const statusTextMap = {
  pending: "等待�?,
  uploading: "上传�?,
  merging: "合并�?,
  completed: "已完�?,
  failed: "失败",
};

// 转换为ScMessageDialog需要的操作列表格式
const operationList = computed(() => 
  queueList.value.map(item => ({
    id: String(item.fileId),
    type: item.status,
    title: item.fileName,
    description: item.message || statusTextMap[item.status as keyof typeof statusTextMap] || "",
    status: mapStatus(item.status),
    progress: item.progress,
    error: item.status === "failed" ? item.message : undefined,
  }))
);

/**
 * 状态映�?
 */
const mapStatus = (status: string): "pending" | "running" | "completed" | "failed" => {
  const map: Record<string, "pending" | "running" | "completed" | "failed"> = {
    uploading: "running",
    merging: "running",
    completed: "completed",
    failed: "failed",
  };
  return map[status] || "pending";
};

/**
 * 清除已完�?
 */
const handleClear = () => {
  emit("clear-completed");
};

// 监听队列状态变�?
watch(
  () => props.queueStatus,
  (newQueueStatus) => {
    // 将Map转换为数�?
    queueList.value = Array.from(newQueueStatus.values());
    emit("queue-update", queueList.value);
  },
  { deep: true, immediate: true }
);

// 生命周期
onMounted(() => {
  // 初始化队列数�?
  queueList.value = Array.from(props.queueStatus.values());
});

/**
 * 添加到队�?
 */
const addToQueue = (task: UploadQueueStatus) => {
  const existingIndex = queueList.value.findIndex(
    (item) => item.fileId === task.fileId
  );
  if (existingIndex >= 0) {
    queueList.value[existingIndex] = task;
  } else {
    queueList.value.push(task);
  }
  emit("queue-update", queueList.value);
};

/**
 * 从队列移�?
 */
const removeFromQueue = (fileId: number) => {
  const index = queueList.value.findIndex((item) => item.fileId === fileId);
  if (index >= 0) {
    queueList.value.splice(index, 1);
    emit("queue-update", queueList.value);
  }
};

/**
 * 更新队列状�?
 */
const updateQueueStatus = (
  fileId: number,
  updates: Partial<UploadQueueStatus>
) => {
  const item = queueList.value.find((item) => item.fileId === fileId);
  if (item) {
    Object.assign(item, updates);
    emit("queue-update", queueList.value);
  }
};

/**
 * 手动刷新队列状�?
 */
const refreshQueue = () => {
  // 从props重新获取最新数�?
  queueList.value = Array.from(props.queueStatus.values());
  emit("queue-update", queueList.value);
};

// 暴露方法给父组件
defineExpose({
  addToQueue,
  removeFromQueue,
  updateQueueStatus,
});
</script>
