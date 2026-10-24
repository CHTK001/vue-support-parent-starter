<!--
  上传任务页 —— 任务化分片上传的管理视图。

  职责边界（与 FileStorageManage 页解耦）：
    1) 上传动作只创建任务：选文件 + 选 bucket（从后端 /buckets 拉取）→ 分片上传 → complete；
       后台（时间轮 + 虚拟线程）负责合并与写入，本页只轮询展示状态。
    2) 任务列表：状态、进度（已收片数/总片数）、失败原因、取消操作。

  数据来源：@pages/filesystem/api/filestorageApi 的 uploadTask* 系列（Spring 侧接口，
  走应用登录态，与文件服务器直连通道无关）。
-->
<template>
  <div class="upload-task-page">
    <ReSectionHead
      class="upload-head"
      title="上传任务"
      description="任务化分片上传的管理视图：选文件与 bucket 创建任务，后台分片合并，本页只负责轮询展示状态"
    >
      <template #actions>
        <el-button
          size="small"
          text
          :loading="listLoading"
          @click="refreshTasks"
        ><el-icon><Refresh /></el-icon>刷新</el-button>
      </template>
    </ReSectionHead>

    <!-- 概览条：任务计数（koi 令牌大数字 + 顶部色条） -->
    <div class="stat-grid" role="group" aria-label="上传任务概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">任务总数</span>
        <span class="stat-value">{{ tasks.length }}</span>
        <span class="stat-trend">全部记录</span>
      </div>
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">进行中</span>
        <span class="stat-value">{{ tasks.filter(t => isActive(t.state)).length }}</span>
        <span class="stat-trend">上传 / 合并</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">已完成</span>
        <span class="stat-value">{{ tasks.filter(t => t.state === "COMPLETED").length }}</span>
        <span class="stat-trend">后台合并完毕</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <span class="stat-label">失败</span>
        <span class="stat-value">{{ tasks.filter(t => t.state === "FAILED").length }}</span>
        <span class="stat-trend">需要关注</span>
      </div>
    </div>

    <!-- 顶部：发起上传 -->
    <div class="upload-card koi-card">
      <div class="ut-upload-bar">
        <el-select
          v-model="provider"
          placeholder="选择 bucket（后台已开启）"
          class="ut-bucket-select"
          :loading="bucketsLoading"
          clearable
          size="small"
        >
          <el-option v-for="b in buckets" :key="b" :label="b" :value="b" />
        </el-select>
        <el-select v-model="chunkSizeMb" class="ut-chunk-select" size="small">
          <el-option v-for="n in [1, 5, 10, 20]" :key="n" :label="`分片 ${n} MB`" :value="n" />
        </el-select>
        <el-button type="primary" size="small" :loading="uploading" @click="pickFiles">
          <el-icon><Upload /></el-icon><span>选择文件上传</span>
        </el-button>
        <el-button size="small" :disabled="uploading" @click="taskInputRef?.click()">批量文件</el-button>
        <input
          ref="singleInputRef"
          type="file"
          hidden
          @change="(e) => onFilesPicked(e, false)"
        />
        <input
          ref="taskInputRef"
          type="file"
          multiple
          hidden
          @change="(e) => onFilesPicked(e, true)"
        />
        <span v-if="uploading" class="ut-upload-hint">上传中…（后台分片合并，可关闭本页）</span>
      </div>
      <el-alert
        v-if="bucketError"
        :title="bucketError"
        type="warning"
        :closable="true"
        class="ut-bucket-alert"
      />
    </div>

    <!-- 任务列表 -->
    <div class="table-card koi-card">
      <div class="ut-list-header">
        <span class="ut-list-title">文件记录</span>
        <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="refreshTasks" />
      </div>
      <el-table
        :data="tasks"
        v-loading="listLoading"
        size="small"
        empty-text="暂无上传任务"
        class="ut-table"
      >
        <template #empty>
          <ReEmpty v-if="!listLoading" layout="modern" description="暂无上传任务，从上方发起上传">
            <el-button size="small" type="primary" @click="pickFiles">选择文件上传</el-button>
          </ReEmpty>
        </template>
        <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatSize(row.totalSize) }}</template>
        </el-table-column>
        <el-table-column label="bucket" width="120">
          <template #default="{ row }">{{ row.provider || "默认" }}</template>
        </el-table-column>
        <el-table-column label="分片" width="140">
          <template #default="{ row }">
            {{ row.receivedChunks }} / {{ row.totalChunks }}
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="taskPercent(row)"
              :status="progressStatus(row.state)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="stateTagType(row.state)" size="small">{{ stateLabel(row.state) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.message || row.objectKey }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定取消该任务？" @confirm="onCancel(row)">
              <template #reference>
                <el-button
                  text
                  type="danger"
                  size="small"
                  :disabled="!isActive(row.state)"
                >取消</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Upload } from "@element-plus/icons-vue";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import {
  SIMPLE_SYNC_MAX_MB,
  cancelUploadTask,
  completeUploadTask,
  createUploadTask,
  listUploadBuckets,
  listUploadTasks,
  subscribeUploadTasks,
  uploadFileSimple,
  uploadTaskChunk,
  type UploadTaskInfo,
  type UploadTaskState,
} from "../api/filestorageApi";

/** 可选 bucket（后端 /buckets 下发，不硬编码） */
const buckets = ref<string[]>([]);
/** 选中 bucket（空 = 默认提供者） */
const provider = ref("");
/** bucket 列表加载中 */
const bucketsLoading = ref(false);
/** bucket 列表失败提示 */
const bucketError = ref("");

/** 分片大小（MB） */
const chunkSizeMb = ref(5);

/** 任务列表 */
const tasks = ref<UploadTaskInfo[]>([]);
const listLoading = ref(false);

/** 是否有分片正在上传 */
const uploading = ref(false);

const singleInputRef = ref<HTMLInputElement>();
const taskInputRef = ref<HTMLInputElement>();

/** 列表轮询句柄（SSE 失效时的兜底） */
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** SSE 订阅取消函数 */
let unsubscribeSse: (() => void) | null = null;

onMounted(() => {
  loadBuckets();
  refreshTasks();
  // 实时推送：任务创建/分片进度/状态变化由后端 SSE 即时下发
  unsubscribeSse = subscribeUploadTasks(
    (snapshot) => {
      tasks.value = snapshot;
    },
    (task) => {
      const index = tasks.value.findIndex((t) => t.taskId === task.taskId);
      if (index >= 0) {
        tasks.value.splice(index, 1, task);
      } else {
        tasks.value.unshift(task);
      }
    },
  );
  // 兜底：SSE 断连重连间隙或推送丢失时，30 秒慢轮询补齐
  pollTimer = setInterval(refreshTasks, 30000);
});

onBeforeUnmount(() => {
  unsubscribeSse?.();
  unsubscribeSse = null;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

/** 拉取后台已开启的 bucket */
async function loadBuckets() {
  bucketsLoading.value = true;
  bucketError.value = "";
  try {
    buckets.value = await listUploadBuckets();
    if (buckets.value.length === 0) {
      bucketError.value = "后台未开启任何 bucket（plugin.filesystem.providers 为空）";
    }
  } catch (e) {
    bucketError.value = (e as Error).message;
  } finally {
    bucketsLoading.value = false;
  }
}

/** 刷新任务列表 */
async function refreshTasks() {
  listLoading.value = true;
  try {
    tasks.value = await listUploadTasks();
  } catch {
    // 轮询失败静默，不打断页面
  } finally {
    listLoading.value = false;
  }
}

/** 触发文件选择（单个入口与批量入口共用处理） */
function pickFiles() {
  taskInputRef.value?.click();
}

/** 文件选择回调：逐个创建任务并分片上传 */
async function onFilesPicked(e: Event, _batch: boolean) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (files.length === 0) {
    return;
  }
  uploading.value = true;
  try {
    for (const file of files) {
      await uploadOne(file);
    }
    ElMessage.success(files.length === 1 ? "上传完成，后台合并中" : `${files.length} 个文件上传完成，后台合并中`);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    uploading.value = false;
    refreshTasks();
  }
}

/** 单文件上传：小文件同步直传，大文件任务化分片 */
async function uploadOne(file: File) {
  // 小文件同步（后端 /simple 直接写存储返回 COMPLETED）；大文件走任务链路
  if (file.size <= SIMPLE_SYNC_MAX_MB * 1024 * 1024) {
    await uploadFileSimple(file, { provider: provider.value || undefined });
    return;
  }
  const task = await createUploadTask({
    fileName: file.name,
    totalSize: file.size,
    chunkSize: chunkSizeMb.value * 1024 * 1024,
    provider: provider.value || undefined,
  });
  const chunkSize = chunkSizeMb.value * 1024 * 1024;
  const totalChunks = Math.max(task.totalChunks, 1);
  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const blob = file.slice(start, Math.min(start + chunkSize, file.size));
    await uploadTaskChunk(task.taskId, index, await blob.arrayBuffer());
  }
  await completeUploadTask(task.taskId);
}

/** 取消任务 */
async function onCancel(row: UploadTaskInfo) {
  try {
    await cancelUploadTask(row.taskId);
    ElMessage.success("任务已取消");
    refreshTasks();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

// ==================== 展示辅助 ====================

/** 任务进度百分比（合并中显示 100，完成看后端状态） */
function taskPercent(row: UploadTaskInfo): number {
  if (row.state === "COMPLETED" || row.state === "MERGING") {
    return 100;
  }
  if (row.totalChunks > 0) {
    return Math.round((row.receivedChunks / row.totalChunks) * 100);
  }
  if (row.totalSize > 0) {
    return Math.round((row.receivedBytes / row.totalSize) * 100);
  }
  return 0;
}

function progressStatus(state: UploadTaskState) {
  if (state === "FAILED") {
    return "exception" as const;
  }
  if (state === "COMPLETED") {
    return "success" as const;
  }
  return undefined;
}

function stateTagType(state: UploadTaskState) {
  switch (state) {
    case "COMPLETED":
      return "success" as const;
    case "FAILED":
      return "danger" as const;
    case "CANCELLED":
      return "info" as const;
    case "MERGING":
      return "warning" as const;
    default:
      return "primary" as const;
  }
}

function stateLabel(state: UploadTaskState): string {
  const labels: Record<UploadTaskState, string> = {
    UPLOADING: "上传中",
    MERGING: "合并中",
    COMPLETED: "已完成",
    FAILED: "失败",
    CANCELLED: "已取消",
  };
  return labels[state] ?? state;
}

function isActive(state: UploadTaskState): boolean {
  return state === "UPLOADING" || state === "MERGING";
}

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
</script>

<style scoped lang="scss">
.upload-task-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-page, var(--el-bg-color-page, #f5f7fa));
  min-height: 100%;
}

/* ===== 页头（ReSectionHead 容器层） ===== */
.upload-head :deep(.re-section-head__title) { color: var(--text-primary); }
.upload-head :deep(.re-section-head__desc) { color: var(--text-secondary); }
.upload-head :deep(.re-section-head__actions) {
  flex-wrap: wrap;
}

/* ===== 概览条（koi 大数字 + 顶部色条） ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  padding: 14px 16px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out, ease), transform 0.2s var(--ease-out, ease);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.stat-trend.is-down { color: var(--status-error); }

/* ===== 卡片壳 ===== */
.koi-card {
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm);
  padding: 12px;
  transition: box-shadow 0.2s var(--ease-out, ease), border-color 0.2s;
}
.koi-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-default, var(--el-border-color, #dcdfe6));
}

/* ===== 发起上传页卡 ===== */
.ut-upload-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 主按钮：主色渐变 + hover 上浮（koi 渐变按钮令牌） */
.ut-upload-bar :deep(.el-button--primary) {
  background: var(--brand-gradient, linear-gradient(135deg, #409eff, #79bbff));
  border: none;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--brand-500, #409eff) 25%, transparent);
  transition: all 0.2s var(--ease-out, ease);
}
.ut-upload-bar :deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--brand-500, #409eff) 35%, transparent);
}

.ut-bucket-select {
  width: 220px;
}

.ut-chunk-select {
  width: 130px;
}

.ut-upload-hint {
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ut-upload-hint::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-500, #409eff);
  animation: ut-pulse 1.2s ease-in-out infinite;
}

@keyframes ut-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

@media (prefers-reduced-motion: reduce) {
  .ut-upload-hint::before { animation: none; }
  .ut-upload-bar :deep(.el-button--primary:hover) { transform: none; }
}

.ut-bucket-alert {
  margin-top: 10px;
  border-radius: var(--radius-md, 8px);
}

/* ===== 任务列表卡片 ===== */
.ut-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.ut-list-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.ut-list-header :deep(.el-button) {
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}

/* 表格观感：去外框、行 hover、单元格留白 */
.ut-table {
  --el-table-border-color: var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
:deep(.ut-table .el-table__row) {
  transition: background-color 0.15s ease;
}
:deep(.ut-table .cell) {
  padding: 0 12px;
}
:deep(.ut-table .el-progress) {
  min-width: 120px;
}

/* 状态标签统一小圆角 */
:deep(.ut-table .el-tag) {
  border-radius: var(--radius-sm, 4px);
  font-weight: 500;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ut-bucket-select,
  .ut-chunk-select {
    width: 100%;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .koi-card {
    transition: none;
  }
  .stat-card:hover,
  .koi-card:hover {
    transform: none;
  }
}
