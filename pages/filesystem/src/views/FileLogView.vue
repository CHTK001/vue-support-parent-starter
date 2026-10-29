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
      </div>

      <!--
        表格统一 ReTable（engine="element" 沿用原 el-table 的 DOM 与视觉）。
        分页/工具栏关闭：日志是内存环形缓冲的实时流水，不分页、也不需要列设置入口。
        fill 走 ReTable 缺省的 auto：本卡片已由 flex 分配确定高度，表头固定、表体内部滚动。
      -->
      <ReTable
        :data="tableRows"
        :columns="logColumns"
        :loading="listLoading"
        engine="element"
        size="small"
        class="fl-table"
        empty-text="暂无文件操作日志"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
      >
        <template #col-time="{ row }">
          <span class="fl-time">{{ formatTime(row.time as number) }}</span>
        </template>
        <template #col-operation="{ row }">
          <el-tag
            :type="operationTagType(row.operation as string)"
            size="small"
            effect="light"
            class="fl-op-tag"
          >
            {{ operationLabel(row.operation as string) }}
          </el-tag>
        </template>
        <template #col-target="{ row }">
          <span class="fl-target">{{ row.target || "-" }}</span>
        </template>
        <template #col-status="{ row }">
          <el-tag
            :type="statusTagType(row.status as number)"
            size="small"
            effect="plain"
            class="fl-status-tag"
          >
            {{ row.status || "-" }}
          </el-tag>
        </template>
        <template #col-duration="{ row }">
          <span class="fl-duration oc-num">{{ formatDuration(row.durationMs as number) }}</span>
        </template>
        <template #col-detail="{ row }">
          <span class="fl-detail" :class="{ 'is-err': isErrorStatus(row.status as number) }">
            {{ row.detail || "" }}
          </span>
        </template>
      </ReTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh, Search } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { clearFileLogs, listFileLogs, type FileLogEntry } from "../api/filestorageApi";

/** 日志条目（内存缓冲，服务重启即清空） */
const logEntries = ref<FileLogEntry[]>([]);
const listLoading = ref(false);
const clearing = ref(false);

/**
 * 日志表格列定义（原 el-table-column 收敛为数组）。
 *
 * <p>带自定义渲染的列配 {@code slot}，模板里用 {@code #col-<slot>} 承接；
 * 其余列（时间 / 目标 / 状态 / 耗时 / 说明）全部走 slot，因为值都需要二次格式化。</p>
 */
const logColumns: ReTableColumn[] = [
  { prop: "time", label: "时间", width: 168, slot: "time" },
  { prop: "operation", label: "操作", width: 132, slot: "operation" },
  { prop: "target", label: "目标", minWidth: 220, showOverflowTooltip: true, slot: "target" },
  { prop: "status", label: "状态", width: 96, align: "center", slot: "status" },
  { prop: "duration", label: "耗时", width: 96, align: "right", slot: "duration" },
  { prop: "detail", label: "说明", minWidth: 180, showOverflowTooltip: true, slot: "detail" },
];

/** 操作类型筛选（空 = 全部） */
const operationFilter = ref("");
/** 目标关键字搜索 */
const keyword = ref("");

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
  { value: "TASK_DELETE", label: "删除任务" },
  { value: "SET_CONFIG", label: "修改配置" },
  { value: "HEAD", label: "探测" },
  { value: "COLLAB_CREATE", label: "创建协同" },
  { value: "COLLAB_SAVE", label: "保存协同" },
  { value: "COLLAB_ACCESS", label: "协同权限" },
  { value: "COLLAB_DELETE", label: "删除协同" },
];

/** 操作类型 → 中文标签（后端只回码，展示层映射；未知码原样显示） */
function operationLabel(op: string): string {
  const hit = operationOptions.find((o) => o.value === op);
  return hit ? hit.label : op || "-";
}

/** 操作类型 → el-tag type（任务/上传类走警告色，删除/失败类走错误色） */
function operationTagType(op: string): "success" | "warning" | "danger" | "info" | "primary" {
  if (op === "UPLOAD" || op === "TASK_CREATE" || op === "TASK_COMPLETE" || op === "COLLAB_CREATE") return "success";
  if (op === "DELETE" || op === "TASK_CANCEL" || op === "COLLAB_DELETE") return "danger";
  if (op === "RENAME" || op === "COPY" || op === "MOVE" || op === "UNZIP" || op === "COLLAB_SAVE") return "warning";
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

/**
 * 表格行数据。
 *
 * <p>ReTable 的 {@code data} 收 {@code Array<Record<string, unknown>>}，而
 * {@link FileLogEntry} 是具名接口（无索引签名），不能直接赋给它。这里做一次浅拷贝
 * 并补上 {@code duration} 列（列 prop 名与接口字段 durationMs 不同，单独映射）。</p>
 */
const tableRows = computed<Array<Record<string, unknown>>>(() =>
  filteredLogs.value.map((e) => ({ ...e, duration: e.durationMs })),
);

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
});
</script>

<style scoped>
.file-log-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 吃满 .el-main 的可用高度：上层 layout 的 .el-main 已有确定高度，
     这里用 100% 继承，再由下面 fl-table-wrap 的 flex:1 把剩余空间全给表格。
     不加 overflow:hidden —— 窄屏下内容超出时让 .el-main 自己滚动。 */
  height: 100%;
  min-height: 0;
}

/* ===== 概览条（koi 大数字 + 顶部色条） ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  /* 固定内容高度，剩余高度全留给表格 */
  flex: 0 0 auto;
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
  flex: 0 0 auto;
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
  /* 吃掉概览条与工具栏之外的全部剩余高度；min-height:0 让内部表格能真正收缩滚动 */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* ReTable 根节点撑满卡片剩余区域（表头固定 / 表体内部滚动由 ReTable 的 fill 负责） */
.fl-table-wrap > :deep(.re-table) {
  flex: 1 1 auto;
  min-height: 0;
}
/* 卡片标题条不参与伸缩 */
.md-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex: 0 0 auto;
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