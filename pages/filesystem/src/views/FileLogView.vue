<!--
  文件日志页 —— 文件服务器操作 + 上传任务生命周期的运行期流水。

  数据来源：@pages/filesystem/api/filestorageApi 的 listFileLogs / clearFileLogs
  （Spring 侧 FileLogStore 内存环形缓冲，走应用登录态，与上传任务同通道）。

  展示：
    概览条（总条数 / 成功 / 失败 / 4xx/5xx 告警）→
    工具栏（操作类型筛选 / 关键字搜索 / 刷新 / 清空）→
    日志表格（时间 / 操作徽章 / 目标 / 状态码 / 耗时 / 详情）。

  操作类型映射：文件服务器（UPLOAD/DOWNLOAD/DELETE/LIST/MKDIR/RENAME/COPY/MOVE/
  ZIP/UNZIP/SET_CONFIG）+ 上传任务（TASK_CREATE/TASK_COMPLETE/TASK_CANCEL）。
  约定：内存流水，服务重启即清空；清空操作需二次确认。
-->

<template>
  <div class="file-log-page">
    <!-- 概览条：日志计数 + 健康度（koi 令牌大数字 + 顶部色条） -->
    <div class="stat-grid" role="group" aria-label="文件日志概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">日志总数</span>
        <span class="stat-value">{{ logEntries.length }}</span>
        <span class="stat-trend">内存环形缓冲</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">成功</span>
        <span class="stat-value">{{ successCount }}</span>
        <span class="stat-trend">2xx / 3xx</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <span class="stat-label">失败</span>
        <span class="stat-value">{{ errorCount }}</span>
        <span class="stat-trend">4xx / 5xx</span>
      </div>
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">本次过滤</span>
        <span class="stat-value">{{ filteredLogs.length }}</span>
        <span class="stat-trend">{{ activeFilterLabel }}</span>
      </div>
    </div>

    <!-- 工具栏：操作筛选 / 搜索 / 刷新 / 清空 -->
    <div class="fl-toolbar koi-card">
      <el-select
        v-model="operationFilter"
        size="small"
        clearable
        class="fl-op-select"
        placeholder="全部操作"
        aria-label="操作类型筛选"
      >
        <el-option
          v-for="op in operationOptions"
          :key="op.value"
          :label="op.label"
          :value="op.value"
        />
      </el-select>
      <el-input
        v-model="keyword"
        size="small"
        clearable
        placeholder="搜索文件路径 / 文件名"
        class="fl-search"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="loadLogs">
        刷新
      </el-button>
      <el-button
        size="small"
        type="danger"
        plain
        :disabled="logEntries.length === 0"
        :loading="clearing"
        @click="onClear"
      >
        <el-icon><Delete /></el-icon>清空
      </el-button>
    </div>

    <!-- 日志表格 -->
    <div class="fl-table-wrap koi-card">
      <div class="md-card-hd">
        <span class="md-card-title">操作流水</span>
        <span class="fl-live-hint" v-if="autoRefresh">
          <span class="fl-live-dot" />每 {{ refreshSeconds }}s 自动刷新
        </span>
      </div>

      <el-table
        :data="filteredLogs"
        size="small"
        class="fl-table"
        empty-text="暂无文件操作日志"
      >
        <el-table-column label="时间" width="168">
          <template #default="{ row }">
            <span class="fl-time">{{ formatTime(row.time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="132">
          <template #default="{ row }">
            <el-tag
              :type="operationTagType(row.operation)"
              size="small"
              effect="light"
              class="fl-op-tag"
            >
              {{ operationLabel(row.operation) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fl-target">{{ row.target || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96" align="center">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
              effect="plain"
              class="fl-status-tag"
            >
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="96" align="right">
          <template #default="{ row }">
            <span class="fl-duration oc-num">{{ formatDuration(row.durationMs) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fl-detail" :class="{ 'is-err': isErrorStatus(row.status) }">
              {{ row.detail || "" }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh, Search } from "@element-plus/icons-vue";
import { clearFileLogs, listFileLogs, type FileLogEntry } from "../api/filestorageApi";

/** 日志条目（内存缓冲，服务重启即清空） */
const logEntries = ref<FileLogEntry[]>([]);
const listLoading = ref(false);
const clearing = ref(false);

/** 操作类型筛选（空 = 全部） */
const operationFilter = ref("");
/** 目标关键字搜索 */
const keyword = ref("");

/** 自动刷新间隔（秒） */
const refreshSeconds = 5;
const autoRefresh = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

/** 操作类型选项（前端映射栏） */
const operationOptions = [
  { value: "UPLOAD", label: "上传" },
  { value: "DOWNLOAD", label: "下载" },
  { value: "DELETE", label: "删除" },
  { value: "LIST", label: "列表" },
  { value: "MKDIR", label: "新建目录" },
  { value: "MKFILE", label: "新建文件" },
  { value: "RENAME", label: "重命名" },
  { value: "COPY", label: "复制" },
  { value: "MOVE", label: "移动" },
  { value: "ZIP", label: "打包" },
  { value: "UNZIP", label: "解压" },
  { value: "TASK_CREATE", label: "创建上传任务" },
  { value: "TASK_COMPLETE", label: "任务合并完成" },
  { value: "TASK_CANCEL", label: "取消任务" },
  { value: "SET_CONFIG", label: "修改配置" },
  { value: "HEAD", label: "探测" },
];

/** 操作类型 → 中文标签（后端只回码，展示层映射；未知码原样显示） */
function operationLabel(op: string): string {
  const hit = operationOptions.find((o) => o.value === op);
  return hit ? hit.label : op || "-";
}

/** 操作类型 → el-tag type（任务/上传类走警告色，删除/失败类走错误色） */
function operationTagType(op: string): "success" | "warning" | "danger" | "info" | "primary" {
  if (op === "UPLOAD" || op === "TASK_CREATE" || op === "TASK_COMPLETE") return "success";
  if (op === "DELETE" || op === "TASK_CANCEL") return "danger";
  if (op === "RENAME" || op === "COPY" || op === "MOVE" || op === "UNZIP") return "warning";
  if (op === "DOWNLOAD" || op === "LIST" || op === "HEAD") return "primary";
  return "info";
}

/** 状态码 → el-tag type */
function statusTagType(status: number): "success" | "danger" | "warning" | "info" {
  if (!status) return "info";
  if (status < 400) return "success";
  if (status < 500) return "warning";
  return "danger";
}

/** 是否错误状态（4xx/5xx，用于详情文字高亮） */
function isErrorStatus(status: number): boolean {
  return status >= 400;
}

/** 概览统计 */
const successCount = computed(() => logEntries.value.filter((e) => e.status > 0 && e.status < 400).length);
const errorCount = computed(() => logEntries.value.filter((e) => e.status >= 400).length);

/** 当前筛选说明 */
const activeFilterLabel = computed(() => {
  if (operationFilter.value) {
    return operationLabel(operationFilter.value);
  }
  return keyword.value.trim() ? `关键字「${keyword.value.trim()}」` : "全部";
});

/** 搜索 + 操作筛选后的日志 */
const filteredLogs = computed<FileLogEntry[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return logEntries.value.filter((e) => {
    if (operationFilter.value && e.operation !== operationFilter.value) return false;
    if (kw && !e.target.toLowerCase().includes(kw)) return false;
    return true;
  });
});

/** 时间显示（MM-DD HH:mm:ss） */
function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 耗时显示（ms 或 秒） */
function formatDuration(ms: number): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** 拉取日志 */
async function loadLogs() {
  listLoading.value = true;
  try {
    logEntries.value = await listFileLogs({ limit: 500 });
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "获取文件日志失败");
  } finally {
    listLoading.value = false;
  }
}

/** 清空日志（二次确认） */
async function onClear() {
  try {
    await ElMessageBox.confirm("确认清空全部文件操作日志？", "清空日志", {
      confirmButtonText: "清空",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return; // 用户取消
  }
  clearing.value = true;
  try {
    const n = await clearFileLogs();
    logEntries.value = [];
    ElMessage.success(`已清空 ${n} 条日志`);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "清空文件日志失败");
  } finally {
    clearing.value = false;
  }
}

onMounted(() => {
  loadLogs();
  timer = setInterval(() => {
    if (autoRefresh.value && !listLoading.value) loadLogs();
  }, refreshSeconds * 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.file-log-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 概览条（koi 大数字 + 顶部色条） ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500, #409eff));
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-variant-numeric: tabular-nums;
}
.stat-trend {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}

/* ===== 工具栏 ===== */
.fl-toolbar {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fl-op-select {
  width: 150px;
}
.fl-search {
  flex: 1;
  min-width: 200px;
}

/* ===== 日志表格 ===== */
.fl-table-wrap {
  padding: 12px;
  min-height: 260px;
}
.md-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.md-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.fl-live-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.fl-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success, #67c23a);
  animation: fl-pulse 1.4s ease-in-out infinite;
}
@keyframes fl-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.fl-table {
  width: 100%;
}
:deep(.fl-table .el-table__row) {
  cursor: default;
}
.fl-time {
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.fl-target {
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  word-break: break-all;
}
.fl-duration {
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.fl-detail {
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.fl-detail.is-err {
  color: var(--status-error, #f56c6c);
}
.fl-op-tag {
  font-variant-numeric: tabular-nums;
}
.fl-status-tag {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .fl-live-dot { animation: none; }
}
</style>