<script setup lang="ts">
/**
 * 文件资产 — 文件存储管理
 * 接口：filesystem-starter FileStorageServerFilter REST API
 * 端口：plugin.filesystem.servers[].port（默认 18080）
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";

// ========== 配置 ==========
const STORAGE_BASE = "http://127.0.0.1:18080";
const BUCKET = "default";

// ========== 类型 ==========
interface FileItem {
  name: string;
  directory: boolean;
  size?: number;
  lastModified?: string;
}

// ========== 状态 ==========
const loading = ref(false);
const items = ref<FileItem[]>([]);
const currentPath = ref("");
const selectedFiles = ref<FileItem[]>([]);

// ========== API ==========
const api = async (method: string, path: string, body?: unknown): Promise<any> => {
  const url = `${STORAGE_BASE}/${BUCKET}${path}`;
  const opts: RequestInit = {
    method,
    headers: {} as Record<string, string>,
  };
  if (body !== undefined) {
    if (body instanceof FormData) {
      opts.body = body;
    } else {
      (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(url, opts);
  return res.json();
};

/** 列出当前路径下文件 */
async function loadItems(): Promise<void> {
  loading.value = true;
  try {
    const path = currentPath.value ? `/${currentPath.value}` : "";
    const res = await api("GET", `${path}?format=json`);
    items.value = res?.items ?? [];
  } catch (e) {
    ElMessage.error("加载文件列表失败");
    items.value = [];
  } finally {
    loading.value = false;
  }
}

/** 上传文件 */
async function handleUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  const key = currentPath.value ? `${currentPath.value}/${file.name}` : file.name;
  const url = `${STORAGE_BASE}/${BUCKET}/${key}`;
  loading.value = true;
  try {
    const res = await fetch(url, { method: "PUT", body: file });
    if (res.ok) {
      ElMessage.success(`上传成功: ${file.name}`);
      await loadItems();
    } else {
      ElMessage.error(`上传失败: ${res.status}`);
    }
  } catch (e) {
    ElMessage.error(`上传异常`);
  } finally {
    loading.value = false;
    input.value = "";
  }
}

/** 删除文件 */
async function deleteItem(item: FileItem): Promise<void> {
  if (item.directory) {
    ElMessage.warning("暂不支持删除目录");
    return;
  }
  await ElMessageBox.confirm(`确认删除「${item.name}」？`, "删除确认", { type: "warning" });
  const key = currentPath.value ? `${currentPath.value}/${item.name}` : item.name;
  try {
    await api("DELETE", `/${key}`);
    ElMessage.success("已删除");
    await loadItems();
  } catch (e) {
    ElMessage.error("删除失败");
  }
}

/** 下载文件 */
function downloadItem(item: FileItem): void {
  const key = currentPath.value ? `${currentPath.value}/${item.name}` : item.name;
  window.open(`${STORAGE_BASE}/${BUCKET}/${key}?download=true`, "_blank");
}

/** 双击进入目录 */
function openDir(item: FileItem): void {
  if (!item.directory) return;
  const path = currentPath.value ? `${currentPath.value}/${item.name}` : item.name;
  currentPath.value = path;
  loadItems();
}

/** 点击返回上级 */
function goBack(): void {
  const parts = currentPath.value.split("/");
  parts.pop();
  currentPath.value = parts.join("/");
  loadItems();
}

/** 格式化文件大小 */
function formatSize(size?: number): string {
  if (size == null || size === 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 格式化时间 */
function formatTime(ts?: string): string {
  if (!ts) return "-";
  return ts.replace("T", " ").slice(0, 19);
}

/** 路径段 */
const pathParts = computed(() => {
  const parts = currentPath.value.split("/").filter(Boolean);
  return parts.map((name, idx) => ({
    name,
    path: parts.slice(0, idx + 1).join("/"),
  }));
});

/** ReTable 列定义 */
const columns = [
  { prop: "name", label: "文件名", minWidth: 280, slot: "name" },
  { prop: "size", label: "大小", width: 120, slot: "size", align: "center" as const },
  { prop: "lastModified", label: "修改时间", width: 180, slot: "modified" },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right" as const },
];

onMounted(loadItems);
</script>

<template>
  <div class="file-asset">
    <div class="page-header">
      <div>
        <h1 class="page-title">文件资产</h1>
        <p class="page-desc">文件存储管理 · {{ items.length }} 个项目</p>
      </div>
      <div class="page-actions">
        <label class="upload-label">
          <ReButton icon="Upload" :show-text="true" size="small" type="primary">上传文件</ReButton>
          <input type="file" class="upload-input" @change="handleUpload" />
        </label>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="loadItems">刷新</ReButton>
      </div>
    </div>

    <!-- 路径导航 -->
    <div class="breadcrumb" v-if="pathParts.length > 0">
      <span class="crumb-link" @click="currentPath = ''; loadItems()">/</span>
      <template v-for="(part, idx) in pathParts" :key="idx">
        <span class="crumb-sep">/</span>
        <span class="crumb-link" @click="currentPath = part.path">{{ part.name }}</span>
      </template>
    </div>

    <ReCard :radius="12" shadow="never">
      <ReTable
        :data="items"
        :columns="columns"
        :loading="loading"
        size="small"
        :pagination="false"
        :toolbar="false"
        empty-text="当前目录为空"
      >
        <template #name="{ row }">
          <span class="file-name" :class="{ 'is-dir': row.directory }" @click="openDir(row)">
            <ReIcon :name="row.directory ? 'FolderOpened' : 'Document'" :size="16" />
            <span>{{ row.name }}</span>
            <ReIcon v-if="!row.directory" name="Download" :size="12" class="dl-icon" @click.stop="downloadItem(row)" />
          </span>
        </template>
        <template #size="{ row }">
          <span v-if="!row.directory">{{ formatSize(row.size) }}</span>
          <span v-else class="dim">-</span>
        </template>
        <template #modified="{ row }">
          <span class="mono dim">{{ formatTime(row.lastModified) }}</span>
        </template>
        <template #action="{ row }">
          <div class="op-cell">
            <ReButton v-if="!row.directory" icon="Download" layout="square" size="small" title="下载" @click="downloadItem(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="deleteItem(row)" />
          </div>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.file-asset {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.page-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-tertiary);
}
.page-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.upload-label {
  position: relative;
  cursor: pointer;
}
.upload-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}
.crumb-link {
  cursor: pointer;
  color: var(--brand-500);
  &:hover {
    text-decoration: underline;
  }
}
.crumb-sep {
  color: var(--text-tertiary);
}
.op-cell {
  display: flex;
  gap: 6px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
}
.dim {
  color: var(--text-tertiary);
}
.file-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-primary);
}
.file-name.is-dir {
  color: var(--brand-500);
  font-weight: 500;
}
.dl-icon {
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  color: var(--text-tertiary);
}
.file-name:hover .dl-icon {
  opacity: 1;
}
</style>
