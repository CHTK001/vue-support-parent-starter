<!--
  SshFileManager —— SSH 文件管理（简化版）
  现代化 UI：路径面包屑、卡片化文件列表、上传/下载进度条
-->
<template>
  <ReCard class="ssh-file-manager">
    <template #default>
      <div class="fm-toolbar">
        <div class="fm-path-bar">
          <el-icon class="fm-path-icon"><FolderOpened /></el-icon>
          <el-input v-model="pathInput" size="small" placeholder="/" @keyup.enter="navigateTo(pathInput)" class="fm-path-input" />
          <el-button size="small" :icon="RefreshRight" circle @click="refreshList" title="刷新" />
        </div>
        <div class="fm-actions">
          <el-upload :show-file-list="false" :before-upload="handleFileUpload" multiple>
            <el-button size="small" :icon="Upload" type="primary" plain>上传</el-button>
          </el-upload>
          <el-button size="small" :icon="FolderAdd" plain @click="showMkdirDialog = true" />
        </div>
      </div>

      <div class="fm-file-list" v-loading="loading">
        <div class="fm-file-item fm-parent-dir" @click="navigateUp">
          <el-icon><Back /></el-icon>
          <span class="fm-file-name">..</span>
          <span class="fm-file-meta">上级目录</span>
        </div>

        <div
          v-for="file in sortedFiles"
          :key="file.path"
          class="fm-file-item"
          :class="{ active: selectedFile?.path === file.path, directory: file.directory }"
          @click="selectedFile = file"
          @dblclick="onFileDoubleClick(file)"
        >
          <el-icon class="fm-file-icon" :class="{ 'is-dir': file.directory }">
            <Folder v-if="file.directory" />
            <Document v-else />
          </el-icon>
          <span class="fm-file-name" :title="file.name">{{ file.name }}</span>
          <span class="fm-file-size">{{ file.directory ? "--" : formatSize(file.size) }}</span>
          <span class="fm-file-perms">{{ file.permissions }}</span>
        </div>

        <div v-if="!loading && files.length === 0" class="fm-empty">空目录</div>
      </div>

      <div v-if="transfers.size > 0" class="fm-transfers">
        <div v-for="[id, t] in transfers" :key="id" class="fm-transfer-item">
          <div class="fm-transfer-info">
            <el-icon><Upload v-if="t.type === 'upload'" /><Download v-else /></el-icon>
            <span class="fm-transfer-name">{{ t.name }}</span>
            <span class="fm-transfer-status">{{ t.status }}</span>
          </div>
          <el-progress :percentage="t.percent" :show-text="false" :stroke-width="3" />
        </div>
      </div>

      <el-dialog v-model="showMkdirDialog" title="新建目录" width="320px" append-to-body>
        <el-input v-model="newDirName" placeholder="目录名" />
        <template #footer>
          <el-button @click="showMkdirDialog = false">取消</el-button>
          <el-button type="primary" @click="createDir">创建</el-button>
        </template>
      </el-dialog>
    </template>
  </ReCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  FolderOpened,
  RefreshRight,
  Upload,
  FolderAdd,
  Back,
  Folder,
  Document,
  Download,
} from "@element-plus/icons-vue";
import { message } from "@repo/core";
import type { RemoteControlInstance } from "../composables/useRemoteControl";

const props = defineProps<{
  remote: RemoteControlInstance;
  sessionId?: string;
}>();

interface FsFile {
  name: string;
  path: string;
  size: number;
  permissions: string;
  directory: boolean;
  modified?: number;
}

interface Transfer {
  id: string;
  type: "upload" | "download";
  name: string;
  percent: number;
  status: string;
}

const pathInput = ref("/");
const currentPath = ref("/");
const files = ref<FsFile[]>([]);
const selectedFile = ref<FsFile | null>(null);
const loading = ref(false);
const showMkdirDialog = ref(false);
const newDirName = ref("");

const transfers = reactive(new Map<string, Transfer>());

const sortedFiles = computed(() =>
  [...files.value].sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    return a.name.localeCompare(b.name);
  }),
);

const activeSessionId = computed(() => props.remote.activeSessionId.value);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function refreshList() {
  if (!activeSessionId.value) {
    message.warning("未连接到 SSH 会话");
    return;
  }
  loading.value = true;
  props.remote.sendFileOp(activeSessionId.value, "list", { path: currentPath.value });
}

function navigateTo(path: string) {
  currentPath.value = path;
  pathInput.value = path;
  refreshList();
}

function navigateUp() {
  const parts = currentPath.value.split("/").filter(Boolean);
  if (parts.length === 0) return;
  parts.pop();
  navigateTo("/" + parts.join("/"));
}

function onFileDoubleClick(file: FsFile) {
  if (file.directory) navigateTo(file.path);
  else downloadFile(file);
}

function handleFileUpload(file: File): boolean {
  if (!activeSessionId.value) {
    message.warning("未连接到 SSH 会话");
    return false;
  }
  const id = `${Date.now()}-${file.name}`;
  transfers.set(id, { id, type: "upload", name: file.name, percent: 0, status: "上传中" });
  props.remote.sendFileOp(activeSessionId.value, "upload", {
    name: file.name,
    size: file.size,
    path: currentPath.value,
    targetPath: `${currentPath.value}/${file.name}`.replace("//", "/"),
  });
  return false; // 阻止 el-upload 自动上传
}

function downloadFile(file: FsFile) {
  if (!activeSessionId.value) return;
  const id = `${Date.now()}-${file.name}`;
  transfers.set(id, { id, type: "download", name: file.name, percent: 0, status: "下载中" });
  props.remote.sendFileOp(activeSessionId.value, "download", { path: file.path });
}

function createDir() {
  if (!newDirName.value) {
    message.warning("请输入目录名");
    return;
  }
  if (!activeSessionId.value) return;
  props.remote.sendFileOp(activeSessionId.value, "mkdir", {
    path: `${currentPath.value}/${newDirName.value}`.replace("//", "/"),
  });
  showMkdirDialog.value = false;
  newDirName.value = "";
}

/* 监听 onFileOp 回调更新文件列表与进度（由 useRemoteControl 注入） */
function handleFileOpEvent(data: Record<string, unknown>) {
  if (data.action === "list" && data.path === currentPath.value) {
    files.value = (data.files as FsFile[]) || [];
    loading.value = false;
  } else if (data.action === "upload" && typeof data.percent === "number") {
    const t = transfers.get(`${data.uploadId}` || "");
    if (t) {
      t.percent = data.percent;
      if (t.percent >= 100) t.status = "完成";
    }
  } else if (data.action === "download" && typeof data.percent === "number") {
    const t = transfers.get(`${data.downloadId}` || "");
    if (t) {
      t.percent = data.percent;
      if (t.percent >= 100) t.status = "完成";
    }
  }
}

watch(
  () => activeSessionId.value,
  (sid) => {
    if (sid) refreshList();
  },
);

defineExpose({ refreshList, handleFileOpEvent });
</script>

<style scoped lang="scss">
.ssh-file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
}

.fm-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.fm-path-bar {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 6px;
}

.fm-path-icon {
  color: var(--el-color-primary);
}

.fm-path-input {
  flex: 1;
}

.fm-actions {
  display: flex;
  gap: 6px;
}

.fm-file-list {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
}

.fm-file-item {
  display: grid;
  grid-template-columns: 24px 1fr 80px 100px;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
  }

  &.fm-parent-dir {
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
}

.fm-file-icon {
  color: var(--el-text-color-secondary);

  &.is-dir {
    color: var(--el-color-primary);
  }
}

.fm-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.fm-file-size,
.fm-file-perms {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fm-file-meta {
  grid-column: span 3;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fm-empty {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.fm-transfers {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fm-transfer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-small);
}

.fm-transfer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.fm-transfer-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-transfer-status {
  color: var(--el-text-color-secondary);
}
</style>