<template>
  <div class="process-layout">
    <el-progress :percentage="percentage" :status="progressStatus" :stroke-width="strokeWidth" :format="percentageFormat" />

    <div v-if="message" class="process-message">
      <IconifyIconOnline :icon="messageIcon" class="message-icon" />
      <span>{{ message }}</span>
      <span v-if="currentStep" class="process-step">{{ currentStep }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface Props {
  percentage: number;
  status: string;
  message?: string;
  currentStep?: string;
  strokeWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 10,
  message: "",
  currentStep: ""
});

// 计算属性
const progressStatus = computed(() => {
  if (props.status === "success") return "success";
  if (props.status === "error") return "exception";
  return "";
});

const messageIcon = computed(() => {
  if (props.status === "error") return "ri:error-warning-line";
  if (props.status === "success") return "ri:check-line";
  return "ri:information-line";
});

// 格式化百分比显示
const percentageFormat = (percentage: number) => {
  return percentage === 100 && props.status === "success" ? "完成" : `${percentage}%`;
};
</script>

<style scoped>
.process-layout {
  width: 100%;
}

.process-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
}

.message-icon {
  margin-right: 5px;
  font-size: 14px;
}

.process-step {
  margin-left: 8px;
  color: var(--el-text-color-primary);
  font-size: 12px;
}
</style>
