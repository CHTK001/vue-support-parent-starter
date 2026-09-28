<script setup lang="ts">
/**
 * 文件资产 — 文件存储管理
 * 接口：monitor FileAssetController（/ms/monitor/file-assets/**），后端为 FileStorage SPI 存储桶
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteFileAsset,
  downloadFileAsset,
  fetchFileAssetBuckets,
  fetchFileAssets,
  uploadFileAsset,
  type FileAssetItem,
} from "../monitorApi";

// ========== 状态 ==========
const loading = ref(false);
const buckets = ref<string[]>([]);
const bucket = ref("");
const items = ref<FileAssetItem[]>([]);
const currentPath = ref("");

// ========== API ==========

/** 失败提示：优先展示后端返回的业务消息 */
function fail(e: unknown, fallback: string): void {
  const err = e as { message?: string; response?: { data?: { msg?: string } } };
  ElMessage.error(err?.response?.data?.msg || err?.message || fallback);
}

/** 加载存储桶列表，仅有一个桶时直接选中 */
async function loadBuckets(): Promise<void> {
  try {
    buckets.value = await fetchFileAssetBuckets();
    if (!bucket.value && buckets.value.length > 0) {
      bucket.value = buckets.value[0];
    }
  } catch (e) {
    fail(e, "加载存储桶失败");
  }
}

/** 列出当前路径下文件 */
async function loadItems(): Promise<void> {
  loading.value = true;
  try {
    items.value = await fetchFileAssets(currentPath.value, bucket.value || undefined);
  } catch (e) {
    fail(e, "加载文件列表失败");
    items.value = [];
  } finally {
    loading.value = false;
  }
}

/** 切换存储桶 */
function switchBucket(): void {
  currentPath.value = "";
  loadItems();
}

/** 上传文件 */
async function handleUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  loading.value = true;
  try {
    const item = await uploadFileAsset(currentPath.value, file, bucket.value || undefined);
    ElMessage.success(`上传成功: ${item?.name ?? file.name}`);
    await loadItems();
  } catch (e) {
    fail(e, "上传失败");
  } finally {
    loading.value = false;
    input.value = "";
  }
}

/** 删除文件 */
async function deleteItem(item: FileAssetItem): Promise<void> {
  await ElMessageBox.confirm(`确认删除「${item.name}」？`, "删除确认", { type: "warning" });
  try {
    await deleteFileAsset(item.path, bucket.value || undefined);
    ElMessage.success("已删除");
    await loadItems();
  } catch (e) {
    fail(e, "删除失败");
  }
}

/** 下载文件 */
async function downloadItem(item: FileAssetItem): Promise<void> {
  try {
    const blob = await downloadFileAsset(item.path, bucket.value || undefined);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    fail(e, "下载失败");
  }
}

/** 进入目录 */
function openDir(item: FileAssetItem): void {
  if (!item.directory) return;
  currentPath.value = item.path;
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

/** 格式化时间（毫秒时间戳） */
function formatTime(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
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

onMounted(async () => {
  await loadBuckets();
  await loadItems();
});
</script>

<template>
  <div class="file-asset">
    <div class="page-header">
      <div>
        <h1 class="page-title">文件资产</h1>
        <p class="page-desc">
          {{ bucket || "默认存储" }} · {{ items.length }} 个项目
          <span class="dim" v-if="buckets.length > 1">（单击目录名进入）</span>
        </p>
      </div>
      <div class="page-actions">
        <el-select
          v-if="buckets.length > 1"
          v-model="bucket"

          style="width: 160px"
          placeholder="存储桶"
          @change="switchBucket"
        >
          <el-option v-for="b in buckets" :key="b" :label="b" :value="b" />
        </el-select>
        <label class="upload-label">
          <ReButton icon="Upload" :show-text="true" type="primary">上传文件</ReButton>
          <input type="file" class="upload-input" @change="handleUpload" />
        </label>
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="loadItems">刷新</ReButton>
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
            <ReButton v-if="!row.directory" icon="Download" layout="square" title="下载" @click="downloadItem(row)" />
            <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="deleteItem(row)" />
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
