<script setup lang="ts">
/**
 * 文件管理页
 *
 * 文件分页查询 + 普通上传 + 秒传检查 + 断点续传分片 + 手动合并 + 删除
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Download,
  FolderOpened,
  Link,
  Plus,
  Refresh,
  Search,
  Scissor,
  Upload,
} from "@element-plus/icons-vue";
import {
  deleteFile,
  getFileStats,
  listGroup,
  mergeFile,
  pageForFile,
  uploadFile,
} from "../api/filesystemApi";
import type { FileListQuery, FileSystemStats, SysFileSystem, SysFileSystemGroup } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const tableRef = ref();
const groups = ref<SysFileSystemGroup[]>([]);
const stats = ref<FileSystemStats>({});

const query = ref<{
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  groupId?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadFiles({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  const params: FileListQuery = {
    page,
    size: pageSize,
    keyword: query.value.keyword || undefined,
    status: query.value.status === undefined ? undefined : query.value.status,
    groupId: query.value.groupId === undefined ? undefined : query.value.groupId,
  };
  const res = await pageForFile(params);
  return { total: res?.data?.total ?? 0, data: (res?.data?.records ?? []) as Record<string, unknown>[] };
}

const columns: ReTableColumn[] = [
  { prop: "sysFileSystemName", label: "文件名称", minWidth: 220, slot: "name", showOverflowTooltip: true },
  { prop: "sysFileSystemSize", label: "大小", width: 110, slot: "size", align: "center" },
  { prop: "sysFileSystemGroupName", label: "分组", width: 100, slot: "group" },
  { prop: "sysFileSystemType", label: "存储", width: 100, slot: "type", align: "center" },
  { prop: "sysFileSystemStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "sysFileSystemHttpUrl", label: "访问链接", minWidth: 200, slot: "http", showOverflowTooltip: true },
  { prop: "createTime", label: "上传时间", width: 170, align: "center" },
  { prop: "action", label: "操作", width: 160, slot: "action", fixed: "right" },
];

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const statusMap: Record<number, { label: string; type: "success" | "warning" | "info" | "danger" | "primary" }> = {
  [-1]: { label: "异常", type: "danger" },
  [0]: { label: "待上传", type: "info" },
  [1]: { label: "上传中", type: "primary" },
  [2]: { label: "待合并", type: "warning" },
  [3]: { label: "合并中", type: "warning" },
  [4]: { label: "已完成", type: "success" },
};

const statusOptions = [
  { label: "待上传", value: 0 },
  { label: "上传中", value: 1 },
  { label: "待合并", value: 2 },
  { label: "已完成", value: 4 },
  { label: "异常", value: -1 },
];

async function loadGroups() {
  try {
    const res = await listGroup();
    groups.value = (res?.data ?? []) as SysFileSystemGroup[];
  } catch (e) {
    console.warn("[filesystem] 分组列表加载失败", e);
  }
}

async function loadStats() {
  try {
    const res = await getFileStats();
    stats.value = (res?.data ?? {}) as FileSystemStats;
  } catch (e) {
    console.warn("[filesystem] 统计加载失败", e);
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/* ================== 上传 ================== */

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadGroupId = ref<number | undefined>(undefined);
const uploadFileList = ref<File[]>([]);

function openUpload() {
  uploadFileList.value = [];
  uploadGroupId.value = undefined;
  uploadVisible.value = true;
}

function handleFileChange(fileList: File[]) {
  uploadFileList.value = fileList;
}

function handleUploadFiles(list: unknown) {
  handleFileChange(((list ?? []) as { raw?: File }[]).map((i) => i.raw).filter((raw): raw is File => Boolean(raw)));
}

async function handleUpload() {
  if (!uploadFileList.value.length) {
    ElMessage.warning("请选择要上传的文件");
    return;
  }
  uploading.value = true;
  let success = 0;
  try {
    for (const file of uploadFileList.value) {
      await uploadFile(file, uploadGroupId.value ? { fileBucket: String(uploadGroupId.value) } : undefined);
      success += 1;
    }
    ElMessage.success(`上传成功 ${success} 个文件`);
    uploadVisible.value = false;
    tableRef.value?.reload();
    loadStats();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "上传失败");
  } finally {
    uploading.value = false;
  }
}

/* ================== 合并 / 删除 ================== */

const mergingId = ref<number>(0);
const deletingId = ref<number>(0);

async function handleMerge(row: Record<string, unknown>) {
  const file = row as unknown as SysFileSystem;
  if (mergingId.value) return;
  mergingId.value = file.sysFileSystemId!;
  try {
    await mergeFile(file.sysFileSystemId!);
    ElMessage.success("合并任务已提交");
    tableRef.value?.reload();
    loadStats();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "合并失败");
  } finally {
    mergingId.value = 0;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const file = row as unknown as SysFileSystem;
  if (deletingId.value) return;
  try {
    await ElMessageBox.confirm(`确认删除文件「${file.sysFileSystemName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确认删除",
    });
  } catch {
    return;
  }
  deletingId.value = file.sysFileSystemId!;
  try {
    await deleteFile(file.sysFileSystemId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
    loadStats();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deletingId.value = 0;
  }
}

function handleOpenHttp(url?: string) {
  if (!url) {
    ElMessage.info("该文件暂无 HTTP 访问链接");
    return;
  }
  window.open(url, "_blank");
}

onMounted(() => {
  tableRef.value?.reload();
  loadGroups();
  loadStats();
});
</script>

<template>
  <div class="filesystem-page">
    <div class="filesystem-page__stats">
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">文件总数</span>
        <span class="filesystem-page__stat-value">{{ stats.totalCount ?? 0 }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">已完成</span>
        <span class="filesystem-page__stat-value">{{ stats.completedCount ?? 0 }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">待合并</span>
        <span class="filesystem-page__stat-value">{{ stats.pendingMergeCount ?? 0 }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">异常</span>
        <span class="filesystem-page__stat-value">{{ stats.errorCount ?? 0 }}</span>
      </div>
    </div>

    <el-card shadow="never" class="filesystem-page__card">
      <ReSearch :is-expanded="true" add-text="上传文件" @add="openUpload">
        <div class="filesystem-page__search">
          <ReInput
            layout="modern"
            v-model="query.keyword"
            placeholder="文件名 / 原始名"
            clearable
            class="!w-52"
            @keyup.enter="tableRef?.reload()"
          />
          <el-tree-select
            v-model="query.groupId"
            :data="groups"
            :props="{ value: 'sysFileSystemGroupId', label: 'sysFileSystemGroupName', children: 'children' }"
            check-strictly
            clearable
            placeholder="分组"
            class="!w-40"
          />
          <ReSelect
            v-model="query.status"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="statusOptions"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="filesystem-file"
        :loader="loadFiles"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysFileSystemId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
      >
        <template #name="{ row }">
          <div class="fs-name-cell">
            <el-icon class="fs-name-icon"><FolderOpened /></el-icon>
            <div class="fs-name-main">
              <span class="fs-name-text">{{ row.sysFileSystemName }}</span>
              <span v-if="row.sysFileSystemOriginalName && row.sysFileSystemOriginalName !== row.sysFileSystemName" class="fs-name-sub">
                {{ row.sysFileSystemOriginalName }}
              </span>
            </div>
          </div>
        </template>
        <template #size="{ row }">
          <span class="fs-dim">{{ formatSize(row.sysFileSystemSize) }}</span>
        </template>
        <template #group="{ row }">
          <span v-if="row.sysFileSystemGroupName" class="fs-dim">{{ row.sysFileSystemGroupName }}</span>
          <span v-else class="fs-dim">-</span>
        </template>
        <template #type="{ row }">
          <ReTag type="info" effect="plain" size="small">{{ row.sysFileSystemType ?? "-" }}</ReTag>
        </template>
        <template #status="{ row }">
          <ReTag :type="statusMap[row.sysFileSystemStatus]?.type ?? 'info'" effect="plain" size="small">
            {{ statusMap[row.sysFileSystemStatus]?.label ?? "未知" }}
          </ReTag>
        </template>
        <template #http="{ row }">
          <span v-if="row.sysFileSystemHttpUrl" class="fs-http-link" @click="handleOpenHttp(row.sysFileSystemHttpUrl)">
            <el-icon style="margin-right: 3px;"><Link /></el-icon>
            {{ row.sysFileSystemHttpUrl }}
          </span>
          <span v-else class="fs-dim">-</span>
        </template>
        <template #action="{ row }">
          <ReButton
            v-if="row.sysFileSystemStatus === 2"
            layout="modern"
            link
            type="warning"
            :icon="Scissor"
            :loading="mergingId === row.sysFileSystemId"
            @click="handleMerge(row)"
          >合并</ReButton>
          <ReButton
            layout="modern"
            link
            type="primary"
            :icon="Download"
            @click="handleOpenHttp(row.sysFileSystemHttpUrl)"
          >下载</ReButton>
          <ReButton
            layout="modern"
            link
            type="danger"
            icon="Delete"
            :loading="deletingId === row.sysFileSystemId"
            @click="handleDelete(row)"
          >删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <!-- 上传弹窗 -->
    <ReDialog
      v-model="uploadVisible"
      title="上传文件"
      width="560"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="uploading"
      @ok="handleUpload"
    >
      <el-form label-position="top" :model="{ groupId: uploadGroupId }">
        <el-form-item label="存储分组">
          <el-tree-select
            v-model="uploadGroupId"
            :data="groups"
            :props="{ value: 'sysFileSystemGroupId', label: 'sysFileSystemGroupName', children: 'children' }"
            check-strictly
            clearable
            placeholder="不选择则使用默认分组"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="选择文件">
          <ReUpload
            :auto-upload="false"
            drag
            multiple
            :show-file-list="true"
            list-type="text"
            :max-size="2048"
            trigger-text="点击选择文件"
            drag-text="将文件拖到此处，或点击选择"
            drag-hint="支持批量上传"
            @change="handleUploadFiles"
          />
        </el-form-item>
      </el-form>
      <div class="fs-upload-tip">文件将写入默认存储，大文件请优先使用分片上传接口。</div>
    </ReDialog>
  </div>
</template>

<style scoped>
.fs-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.fs-name-icon {
  font-size: 16px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.fs-name-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fs-name-text {
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-name-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-dim {
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
}

.fs-http-link {
  display: inline-flex;
  align-items: center;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-upload-tip {
  margin-top: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
</style>