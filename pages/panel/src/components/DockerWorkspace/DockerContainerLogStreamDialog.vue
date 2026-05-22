<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="容器日志"
    width="880px"
    @closed="handleClosed"
  >
    <template #header>
      <div class="cl-header">
        <span class="cl-header__title">容器日志</span>
        <span class="cl-header__subtitle">{{ containerName || containerId?.substring(0, 12) }}</span>
        <div class="cl-header__right">
          <ElSelect v-model="tailLines" size="small" style="width: 100px; margin-right: 8px;">
            <ElOption label="100 行" :value="100" />
            <ElOption label="500 行" :value="500" />
            <ElOption label="2000 行" :value="2000" />
            <ElOption label="全部" :value="0" />
          </ElSelect>
          <ElButton size="small" :icon="RefreshRight" :loading="loading" @click="fetchLogs">刷新</ElButton>
          <ElButton size="small" :icon="Delete" @click="clearLogs">清空</ElButton>
          <ElButton size="small" :icon="DocumentCopy" @click="copyLogs">复制</ElButton>
        </div>
      </div>
    </template>

    <div ref="logContainerRef" class="cl-body" @scroll="handleScroll">
      <div v-if="loading" class="cl-loading"><ElIcon class="is-loading"><Loading /></ElIcon> 加载中...</div>
      <div v-else-if="!logs" class="cl-empty">暂无日志</div>
      <pre v-else class="cl-logs" ref="logPreRef">{{ logs }}</pre>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from "vue";
import { ElButton, ElDialog, ElIcon, ElOption, ElSelect } from "element-plus";
import { Delete, DocumentCopy, Loading, RefreshRight } from "@element-plus/icons-vue";
import * as dockerApi from "../../api/docker";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
  containerId: string;
  containerName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

const loading = ref(false);
const tailLines = ref(500);
const logs = ref("");
const logContainerRef = ref<HTMLElement | null>(null);
const logPreRef = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await dockerApi.fetchDockerContainerLogs(props.connectionId, props.containerId, tailLines.value);
    logs.value = res?.data || "";
    await nextTick();
    if (autoScroll.value) scrollToBottom();
  } catch { logs.value = "(获取日志失败)"; }
  finally { loading.value = false; }
};

const clearLogs = () => { logs.value = ""; };
const copyLogs = async () => {
  try {
    await navigator.clipboard.writeText(logs.value);
  } catch { /* ignore */ }
};

const scrollToBottom = () => {
  const el = logContainerRef.value;
  if (el) el.scrollTop = el.scrollHeight;
};

const handleScroll = () => {
  const el = logContainerRef.value;
  if (!el) return;
  autoScroll.value = (el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
};

// Polling (every 3s) for live log streaming effect
const startPolling = () => {
  stopPolling();
  fetchLogs();
  pollTimer = setInterval(fetchLogs, 3000);
};

const stopPolling = () => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
};

const handleClosed = () => {
  stopPolling();
  logs.value = "";
};

watch(() => props.visible, (v) => { if (v) startPolling(); });
onBeforeUnmount(stopPolling);
</script>

<style scoped>
.cl-header { display: flex; align-items: center; gap: 10px; width: 100%; }
.cl-header__title { font-size: 15px; font-weight: 600; white-space: nowrap; }
.cl-header__subtitle { font-size: 13px; color: var(--el-text-color-secondary); white-space: nowrap; }
.cl-header__right { margin-left: auto; display: flex; align-items: center; }

.cl-body {
  height: 500px;
  overflow: auto;
  background: #1e1e2e;
  border-radius: 6px;
  font-family: "Cascadia Code", "Fira Code", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.cl-loading, .cl-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #a0a0b0;
}
.cl-logs {
  margin: 0;
  padding: 12px 16px;
  color: #cdd6f4;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
