<template>
  <el-tag :type="type" effect="light" round>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status?: string | null;
}>();

const statusTextMap: Record<string, string> = {
  RUNNING: "运行中",
  SUCCESS: "成功",
  INSTALLED: "已安装",
  ENABLED: "已启用",
  INSTALLING: "安装中",
  RUNNING_WAIT: "等待运行",
  UNINSTALLING: "卸载中",
  FAILED: "失败",
  ERROR: "异常",
  DISABLED: "已停用",
  STOPPED: "已停止",
  UNINSTALLED: "未安装",
  UNKNOWN: "未知",
  IDLE: "空闲",
  PREPARE: "准备中",
};

const displayText = computed(() => {
  const normalized = String(props.status || "UNKNOWN").toUpperCase();
  return statusTextMap[normalized] || props.status || "未知";
});

const type = computed(() => {
  const normalized = String(props.status || "").toUpperCase();
  if (["RUNNING", "SUCCESS", "INSTALLED", "ENABLED"].includes(normalized)) {
    return "success";
  }
  if (["INSTALLING", "RUNNING_WAIT", "UNINSTALLING", "RUNNING"].includes(normalized)) {
    return "warning";
  }
  if (["FAILED", "ERROR", "DISABLED", "STOPPED", "UNINSTALLED"].includes(normalized)) {
    return "danger";
  }
  return "info";
});
</script>
