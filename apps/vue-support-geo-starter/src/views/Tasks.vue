<script setup lang="ts">
/**
 * 任务中心页
 *
 * 展示进行中的下载任务列表，支持刷新、取消、暂停/继续、部分导出、删除，
 * 并每 4 秒轮询任务状态。
 * @author CH
 * @since 4.0.0
 */
import { ref, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getActiveTasks, cancelTask, togglePauseTask, removeTask, exportPartialTask } from "@/api/tile";
import { useRouter } from "vue-router";
import type { TaskInfo } from "@/types";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";

const router = useRouter();

const tasks = ref<TaskInfo[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: "排队中", type: "info" },
  downloading: { label: "下载中", type: "primary" },
  merging: { label: "拼接中", type: "warning" },
  processing: { label: "处理中", type: "warning" },
  exporting: { label: "导出中", type: "warning" },
  building_pyramid: { label: "建金字塔", type: "warning" },
  completed: { label: "已完成", type: "success" },
  completed_with_gaps: { label: "完成(有缺失)", type: "warning" },
  failed: { label: "失败", type: "danger" },
  cancelled: { label: "已取消", type: "info" },
  paused: { label: "已暂停", type: "info" },
  pending_decision: { label: "待处理", type: "danger" },
};

/**
 * 列配置：原模板里 9 个 el-table-column 收敛为数组。
 *
 * <p>带 {@code <template #default>} 的列配 {@code slot}，模板里用 {@code #col-<prop>}
 * 接收；原本没有 prop 的展示列按其渲染的字段名造稳定 prop（zoom/format/…），
 * 操作列合成 {@code actions}。</p>
 */
const taskColumns: ReTableColumn[] = [
  { prop: "id", label: "任务 ID", width: 180, showOverflowTooltip: true },
  { prop: "name", label: "名称", minWidth: 140, showOverflowTooltip: true },
  { prop: "sourceName", label: "图源", width: 120, showOverflowTooltip: true, slot: "sourceName" },
  { prop: "zoom", label: "级别", width: 70, align: "center", slot: "zoom" },
  { prop: "format", label: "格式", width: 100, slot: "format" },
  { prop: "progress", label: "进度", width: 220, slot: "progress" },
  { prop: "status", label: "状态", width: 120, align: "center", slot: "status" },
  { prop: "fileSize", label: "大小", width: 100, align: "right", slot: "fileSize" },
  { prop: "actions", label: "操作", width: 220, fixed: "right", slot: "actions" },
];

/**
 * ReTable 列插槽里的 row 是宽类型（各字段取出为 unknown），
 * 算术与传参前统一在这里收窄成 TaskInfo（见黄金样例的 durationMs）。
 */
function asTask(row: Record<string, unknown>): TaskInfo {
  return row as unknown as TaskInfo;
}

/** 进度百分比（原模板内联 Math 计算，unknown 不能直接做算术） */
function progressPct(row: Record<string, unknown>): number {
  const t = asTask(row);
  const completed = t.completed ?? 0;
  const total = t.total ?? 0;
  const pct = t.progress ?? (completed && total ? (completed / total) * 100 : 0);
  return Math.min(100, Math.round(pct));
}

/** 状态标签类型（原模板 (statusMap[row.status]?.type as any) ?? 'info'，unknown 不能作索引） */
function statusTagType(row: Record<string, unknown>): any {
  return (statusMap[asTask(row).status]?.type as any) ?? "info";
}

/** 状态标签文案（原模板 statusMap[row.status]?.label ?? row.status） */
function statusLabel(row: Record<string, unknown>): string {
  const t = asTask(row);
  return statusMap[t.status]?.label ?? t.status;
}

/** 文件大小（formatSize 形参是 number|undefined，unknown 需先收窄） */
function rowSize(row: Record<string, unknown>): number | undefined {
  return asTask(row).fileSize;
}

/** 暂停按钮显隐（原模板内联数组 includes(row.status)，unknown 不能传给 includes(string[])） */
function canPause(row: Record<string, unknown>): boolean {
  return ["downloading", "pending", "merging", "exporting", "processing"].includes(asTask(row).status);
}

/** 行 ID（操作列回调形参是 string，unknown 需先收窄） */
function rowId(row: Record<string, unknown>): string {
  return asTask(row).id;
}

/** 刷新任务列表 */
async function refresh() {
  loading.value = true;
  try {
    tasks.value = await getActiveTasks();
  } catch (e: any) {
    /* 后端未启动时静默 */
  } finally {
    loading.value = false;
  }
}

/**
 * 取消任务
 * @param id 任务 ID
 */
async function onCancel(id: string) {
  try {
    await cancelTask(id);
    ElMessage.success("已取消任务");
    refresh();
  } catch (e: any) {
    ElMessage.error(`取消失败：${e?.message ?? e}`);
  }
}

/**
 * 切换任务暂停/继续
 * @param id 任务 ID
 */
async function onPause(id: string) {
  try {
    const res = await togglePauseTask(id);
    ElMessage.success(res.message || "已切换暂停状态");
    refresh();
  } catch (e: any) {
    ElMessage.error(`操作失败：${e?.message ?? e}`);
  }
}

/**
 * 请求导出任务的已完成部分
 * @param id 任务 ID
 */
async function onExportPartial(id: string) {
  try {
    const res = await exportPartialTask(id);
    ElMessage.success(res.message || "已请求导出");
  } catch (e: any) {
    ElMessage.error(`导出失败：${e?.message ?? e}`);
  }
}

/**
 * 删除任务记录
 * @param id 任务 ID
 */
async function onRemove(id: string) {
  try {
    await ElMessageBox.confirm("确定删除该任务记录？", "删除任务", { type: "warning" });
    await removeTask(id);
    ElMessage.success("已删除");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") ElMessage.error(`删除失败：${e?.message ?? e}`);
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 可读的文件大小字符串
 */
function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes > 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes > 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** 跳转至工作台新建任务 */
function goWorkspace() {
  router.push("/workspace");
}

/** 轮询任务状态 */
function poll() {
  refresh();
}

onMounted(() => {
  refresh();
  timer = setInterval(poll, 4000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="tasks-page">
    <div class="tasks-head">
      <div class="tasks-title">
        <el-icon><List /></el-icon>
        <span>任务中心</span>
        <el-tag type="info" effect="plain">{{ tasks.length }} 个任务</el-tag>
      </div>
      <div class="tasks-actions">
        <el-button :icon="'Refresh'" :loading="loading" @click="refresh">刷新</el-button>
        <el-button type="primary" :icon="'Plus'" @click="goWorkspace" text>新建任务</el-button>
      </div>
    </div>

    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
         既有 :deep(.el-table…) 样式与 e2e 选择器一概不失效；pagination=false —— 本页原本
         没有分页条，行为照旧全量展示；toolbar=false 不新增工具栏（按钮清单与改造前逐个一致）；
         原 border 走 ReTable 默认（border: true），v-loading 换成 :loading，stripe 同名保留。 -->
    <ReTable
      :data="tasks"
      :columns="taskColumns"
      :loading="loading"
      engine="element"
      :pagination="false"
      :toolbar="false"
      stripe
      empty-text="暂无任务"
      class="tasks-table"
    >
      <template #col-sourceName="{ row }">
        <span>{{ row.sourceName || row.source || "-" }}</span>
      </template>
      <template #col-zoom="{ row }">{{ row.zoom ?? "-" }}</template>
      <template #col-format="{ row }">{{ row.format || "-" }}</template>
      <template #col-progress="{ row }">
        <div class="prog-cell">
          <el-progress
            :percentage="progressPct(row)"
            :status="row.status === 'failed' ? 'exception' : undefined"
          />
          <span class="prog-num">{{ row.completed ?? 0 }}/{{ row.total ?? 0 }}</span>
        </div>
      </template>
      <template #col-status="{ row }">
        <el-tag :type="statusTagType(row)">
          {{ statusLabel(row) }}
        </el-tag>
      </template>
      <template #col-fileSize="{ row }">{{ formatSize(rowSize(row)) }}</template>
      <template #col-actions="{ row }">
        <el-button
          link
          type="warning"
          v-if="canPause(row)"
          @click="onPause(rowId(row))"
        >
          暂停
        </el-button>
        <el-button link type="success" v-if="row.status === 'paused'" @click="onPause(rowId(row))">
          继续
        </el-button>
        <el-button link type="danger" @click="onCancel(rowId(row))">取消</el-button>
        <el-button link type="primary" v-if="row.status === 'failed'" @click="onExportPartial(rowId(row))">
          部分导出
        </el-button>
        <el-button link type="danger" @click="onRemove(rowId(row))">删除</el-button>
      </template>
    </ReTable>
  </div>
</template>

<style scoped>
.tasks-page {
  height: calc(100vh - 128px);
  padding: 8px;
  overflow: auto;
}
.tasks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
}
.tasks-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.tasks-actions {
  display: flex;
  gap: 8px;
}
.tasks-table {
  width: 100%;
}
.prog-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prog-cell .el-progress {
  flex: 1;
}
.prog-num {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>