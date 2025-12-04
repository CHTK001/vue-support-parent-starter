<template>
  <el-tag :type="typeMap[statusKey] || 'default'" :size="size">
    <IconifyIconOnline :icon="iconMap[statusKey] || 'ri:question-line'" />
    {{ textMap[statusKey] || status }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  status?: string | null;
  size?: "small" | "default" | "large";
}
const props = defineProps<Props>();

const statusKey = computed(() => (props.status || "").toString().toLowerCase());

const typeMap: Record<string, string> = {
  success: "success",
  failed: "danger",
  running: "warning",
  cancelled: "info",
  timeout: "warning",
  completed: "success",
};

const iconMap: Record<string, string> = {
  success: "ri:check-line",
  failed: "ri:close-line",
  running: "ri:loader-line",
  cancelled: "ri:stop-line",
  timeout: "ri:alarm-warning-line",
  completed: "ri:checkbox-circle-line",
};

const textMap: Record<string, string> = {
  success: "成功",
  failed: "失败",
  running: "运行�?,
  cancelled: "已取�?,
  timeout: "超时",
  completed: "完成",
};
</script>

<style scoped>
:deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
}
</style>

