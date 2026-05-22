<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="拉取镜像"
    width="550px"
  >
    <ElForm label-width="100px">
      <ElFormItem label="镜像名" required>
        <ElInput v-model="imageName" placeholder="nginx" @keyup.enter="handlePull" />
      </ElFormItem>
      <ElFormItem label="标签">
        <ElInput v-model="imageTag" placeholder="latest" @keyup.enter="handlePull" />
      </ElFormItem>
      <ElFormItem label="搜索">
        <ElInput v-model="searchTerm" placeholder="搜索 Docker Hub 镜像..." @keyup.enter="handleSearch">
          <template #append>
            <ElButton :icon="Search" @click="handleSearch" />
          </template>
        </ElInput>
      </ElFormItem>
    </ElForm>

    <!-- Search results -->
    <div v-if="searchResults.length" class="ip-search-results">
      <ElTable :data="searchResults" size="small" stripe highlight-current-row @row-click="selectFromSearch" max-height="200px">
        <ElTableColumn label="名称" prop="name" min-width="180" />
        <ElTableColumn label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="星数" prop="stars" width="70" />
        <ElTableColumn label="官方" width="60">
          <template #default="{ row }">{{ row.isOfficial ? '是' : '否' }}</template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- Pull progress -->
    <div v-if="operation && operation.status === 'running'" class="ip-progress">
      <ElProgress :percentage="operation.progressPercent" :stroke-width="8" />
      <span class="ip-progress__text">正在拉取 {{ fullImageName }}... {{ operation.progressPercent }}%</span>
      <ElCollapse v-model="logOpen" class="ip-log-section">
        <ElCollapseItem title="拉取日志" name="log">
          <div ref="logViewerRef" class="ip-log-viewer">
            <div v-for="(line, idx) in operation.logs" :key="idx" class="ip-log-line">{{ stripAnsi(line) }}</div>
            <div v-if="!operation.logs.length" class="ip-log-empty">等待日志...</div>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </div>

    <!-- Pull completed -->
    <div v-if="pullCompleted" class="ip-post-pull">
      <ElAlert type="success" :title="`镜像 ${fullImageName} 拉取完成`" show-icon :closable="false" />
      <div class="ip-post-pull__actions">
        <ElButton type="primary" @click="handleCreateContainer">从此镜像创建容器</ElButton>
      </div>
    </div>

    <!-- Pull error -->
    <div v-if="operation?.status === 'error' && operation?.errorMessage" class="ip-post-pull">
      <ElAlert type="error" title="拉取失败" :description="operation.errorMessage" show-icon :closable="false" />
    </div>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="pulling" @click="handlePull">拉取</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElAlert, ElButton, ElCollapse, ElCollapseItem, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElProgress, ElTable, ElTableColumn } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import * as dockerApi from "../../api/docker";
import { useDockerProgressSocket } from "./useDockerProgressSocket";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  pulled: [];
  createFromImage: [imageName: string];
}>();

const imageName = ref("");
const imageTag = ref("latest");
const searchTerm = ref("");
const searchResults = ref<any[]>([]);
const pulling = ref(false);
const logOpen = ref<string[]>(["log"]);
const logViewerRef = ref<HTMLElement | null>(null);
const pullCompleted = ref(false);

const fullImageName = computed(() => imageName.value ? `${imageName.value}:${imageTag.value || 'latest'}` : "");

// ─── WebSocket progress ──────────────────────────────

const progressSocket = useDockerProgressSocket();
const operationKey = computed(() => imageName.value ? `pull:${fullImageName.value}` : "");
const operation = computed(() => progressSocket.operationsByKey.value[operationKey.value]);

// Auto-scroll log viewer
watch(operation, () => {
  setTimeout(() => {
    const el = logViewerRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}, { deep: true });

// Watch for success/error
watch(operation, (op) => {
  if (op?.status === "success") {
    pullCompleted.value = true;
    emit("pulled");
  }
}, { deep: true });

// ─── Handlers ────────────────────────────────────────

const handleSearch = async () => {
  if (!searchTerm.value) return;
  try {
    const res = await dockerApi.searchDockerImages(props.connectionId, searchTerm.value);
    searchResults.value = res?.data || [];
  } catch { ElMessage.error("搜索失败"); }
};

const selectFromSearch = (row: any) => {
  imageName.value = row.name;
};

const handlePull = async () => {
  if (!imageName.value) { ElMessage.warning("请输入镜像名"); return; }
  pulling.value = true;
  pullCompleted.value = false;
  progressSocket.connect();
  progressSocket.resetOperation(operationKey.value);
  try {
    await dockerApi.pullDockerImage(props.connectionId, fullImageName.value);
    // REST call succeeded; progress may come via WebSocket
  } catch (e: any) {
    ElMessage.error("拉取失败");
    progressSocket.resetOperation(operationKey.value);
    setOpStatus("error", e?.message || "拉取失败");
  } finally {
    pulling.value = false;
  }
};

const setOpStatus = (status: "error" | "success", msg?: string) => {
  const key = operationKey.value;
  if (!key) return;
  const cur = progressSocket.operationsByKey.value[key] || { progressPercent: 0, logs: [], status: "idle" as const };
  progressSocket.operationsByKey.value = {
    ...progressSocket.operationsByKey.value,
    [key]: { ...cur, status, errorMessage: msg },
  };
};

const handleCreateContainer = () => {
  emit("createFromImage", fullImageName.value);
};

// ─── Dialog lifecycle ────────────────────────────────

watch(() => props.visible, (v) => {
  if (v) {
    searchResults.value = [];
    pullCompleted.value = false;
    progressSocket.connect();
  } else {
    if (operationKey.value) progressSocket.removeOperation(operationKey.value);
  }
});

// ─── Utils ───────────────────────────────────────────

const stripAnsi = (str: string) => {
  return str.replace(/\x1B\[\d+(;\d+)*m/g, "").replace(/\r/g, "");
};
</script>

<style scoped>
.ip-search-results { margin-top: 8px; border: 1px solid var(--el-border-color); border-radius: 4px; overflow: hidden; }
.ip-progress { margin-top: 16px; text-align: center; }
.ip-progress__text { font-size: 12px; color: var(--el-text-color-secondary); display: block; margin-top: 8px; }
.ip-log-section { margin-top: 8px; text-align: left; }
.ip-log-viewer {
  max-height: 200px; overflow-y: auto;
  background: #1e1e2e; color: #cdd6f4;
  font-family: "Cascadia Code", "Fira Code", monospace;
  font-size: 11px; line-height: 1.5;
  padding: 8px; border-radius: 4px;
}
.ip-log-line { white-space: pre-wrap; word-break: break-all; }
.ip-log-empty { color: #6c7086; font-style: italic; }
.ip-post-pull { margin-top: 12px; }
.ip-post-pull__actions { margin-top: 8px; text-align: center; }
</style>
