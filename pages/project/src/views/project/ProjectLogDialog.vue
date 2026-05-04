<template>
  <ScDialog
    v-model="visible"
    :title="`日志 — ${project?.projectName ?? ''}`"
    width="860px"
    destroy-on-close
    @open="startPolling"
    @close="stopPolling"
  >
    <div class="log-toolbar">
      <ScButton size="small" plain @click="logContent = ''">清空显示</ScButton>
      <ScButton size="small" :type="paused ? 'primary' : ''" plain @click="paused = !paused">
        {{ paused ? '继续' : '暂停' }}
      </ScButton>
      <el-select v-model="lines" size="small" style="width: 100px" @change="fetchLog">
        <el-option :value="100" label="100 行" />
        <el-option :value="200" label="200 行" />
        <el-option :value="500" label="500 行" />
      </el-select>
      <ScButton size="small" plain @click="fetchLog">
        <IconifyIconOnline icon="ep:refresh" />
      </ScButton>
      <span class="log-status">{{ paused ? '已暂停' : '实时更新中…' }}</span>
    </div>

    <pre ref="logRef" class="log-content thin-scroller">{{ logContent || '暂无日志…' }}</pre>

    <template #footer>
      <ScButton @click="visible = false">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import type { SysProject } from "../../api/manage/project";
import { fetchProjectLog } from "../../api/manage/project";

const visible = ref(false);
const project = ref<SysProject | null>(null);
const logContent = ref("");
const logRef = ref<HTMLPreElement | null>(null);
const paused = ref(false);
const lines = ref(200);
let timer: ReturnType<typeof setInterval> | null = null;

const fetchLog = async () => {
  if (!project.value?.projectId || paused.value) return;
  try {
    const res = await fetchProjectLog(project.value.projectId, lines.value);
    if (res.code === "00000" && res.data) {
      logContent.value = res.data;
      nextTick(() => {
        if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight;
      });
    }
  } catch { /* 忽略轮询错误 */ }
};

const startPolling = () => {
  paused.value = false;
  fetchLog();
  timer = setInterval(fetchLog, 3000);
};

const stopPolling = () => {
  if (timer) { clearInterval(timer); timer = null; }
};

const open = (p: SysProject) => {
  project.value = p;
  logContent.value = "";
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.log-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.log-status { font-size: 12px; color: var(--el-text-color-secondary); margin-left: auto; }
.log-content {
  background: #0f172a;
  color: #e2e8f0;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 16px;
  border-radius: 10px;
  height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
