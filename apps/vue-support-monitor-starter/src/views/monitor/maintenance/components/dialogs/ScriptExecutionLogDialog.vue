<template>
  <el-dialog v-model="visible" :append-to-body="true" top="10px" title="脚本执行日志" width="80%" :close-on-click-modal="false" :destroy-on-close="true">
    <script-execution-log ref="scriptExecutionLogRef" :task-id="taskId" />
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, defineExpose, watch, defineAsyncComponent } from "vue";

const ScriptExecutionLog = defineAsyncComponent(() => import("../ScriptExecutionLog.vue"));

const props = defineProps({
  taskId: {
    type: [Number, String],
    default: null
  },
  title: {
    type: String,
    default: "脚本执行日志"
  }
});

const emit = defineEmits(["update:visible", "close"]);

const visible = ref(false);
const scriptExecutionLogRef = ref(null);

// 打开对话框
const open = taskId => {
  visible.value = true;

  // 主动启动监控
  if (scriptExecutionLogRef.value && taskId) {
    scriptExecutionLogRef.value.startMonitor(taskId);
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
    if (visible.value && newVal && scriptExecutionLogRef.value) {
      scriptExecutionLogRef.value.startMonitor(newVal);
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