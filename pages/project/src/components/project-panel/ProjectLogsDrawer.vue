<template>
  <ScDrawer
    v-model="visible"
    :title="`日志 · ${project?.projectName || ''}`"
    size="680px"
    append-to-body
    destroy-on-close
    layout="simple"
    @close="$emit('close')"
    @open="$emit('open')"
  >
    <div class="logs-wrap">
      <div class="logs-toolbar">
        <el-tabs v-model="activeTab" class="logs-tabs">
          <el-tab-pane label="运行日志" name="runtime" />
          <el-tab-pane label="升级日志" name="deploy" />
          <el-tab-pane label="操作日志" name="operation" />
        </el-tabs>
        <ScButton size="small" plain @click="$emit('clear')">清空</ScButton>
        <ScButton size="small" plain :type="autoScroll ? 'primary' : ''" @click="$emit('update:autoScroll', !autoScroll)">
          自动滚动
        </ScButton>
        <ScButton size="small" plain @click="$emit('refresh')">刷新</ScButton>
      </div>
      <pre class="logs-panel thin-scroller">{{ content || "暂无日志..." }}</pre>
    </div>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RemoteProject } from "../../api/manage/remote";

const props = defineProps<{
  modelValue: boolean;
  project: RemoteProject | null;
  content: string;
  autoScroll: boolean;
  logType: "runtime" | "deploy" | "operation";
}>();

const emit = defineEmits<{
  (e: "clear"): void;
  (e: "close"): void;
  (e: "open"): void;
  (e: "refresh"): void;
  (e: "update:logType", value: "runtime" | "deploy" | "operation"): void;
  (e: "update:autoScroll", value: boolean): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});

const activeTab = computed({
  get: () => props.logType,
  set: value =>
    emit(
      "update:logType",
      value as "runtime" | "deploy" | "operation",
    ),
});
</script>

<style scoped lang="scss">
.logs-wrap {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  height: 100%;
}

.logs-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;

  .logs-tabs {
    min-width: 0;
    flex: 1 1 auto;
  }
}

.logs-panel {
  margin: 0;
  height: 100%;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 18px;
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.7;
  font-family: "Consolas", "Courier New", monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
