<template>
  <el-dialog v-model="visible" title="任务监控" width="70%" :close-on-click-modal="false" :destroy-on-close="true">
    <task-monitor ref="taskMonitorRef" :task-id="taskId" />
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, defineExpose, watch } from "vue";
import { defineAsyncComponent } from "vue";

const TaskMonitor = defineAsyncComponent(() => import("../TaskMonitor.vue"));

const props = defineProps({
  taskId: {
    type: [Number, String],
    default: null
  },
  title: {
    type: String,
    default: "任务监控"
  }
});

const emit = defineEmits(["update:visible", "close"]);

const visible = ref(false);
const taskMonitorRef = ref(null);

// 打开对话框
const open = taskId => {
  visible.value = true;

  // 主动启动监控
  if (taskMonitorRef.value && taskId) {
    taskMonitorRef.value.startMonitor(taskId);
  }
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 监听taskId的变化
watch(
  () => props.taskId,
  newVal => {
    if (visible.value && newVal && taskMonitorRef.value) {
      taskMonitorRef.value.startMonitor(newVal);
    }
  }
);

defineExpose({
  open,
  close
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  padding: 10px 20px;
  height: 70vh;
  overflow: auto;
}
</style>
