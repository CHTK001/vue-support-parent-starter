<template>
  <div class="flow-page">
    <!-- 页头卡片 -->
    <header class="flow-hero">
      <div class="flow-hero-main">
        <div class="flow-hero-icon">
          <ReIcon name="Refresh" :size="20" />
        </div>
        <div class="flow-hero-text">
          <h2 class="flow-title">
            同步日志
            <span class="flow-badge">● 每次执行留档</span>
          </h2>
          <p class="flow-sub">跨任务汇总每一次数据同步执行的旅程与过程日志（保留 30 天，后端重启不丢）</p>
        </div>
      </div>
      <div class="flow-hero-side">
        <div class="flow-hero-stat">
          <span class="flow-hero-stat-val">{{ total }}</span>
          <span class="flow-hero-stat-key">次执行</span>
        </div>
        <ReButton :loading="loading" @click="reload">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
      </div>
    </header>

    <!-- 筛选卡片：任务 / 状态 / 触发方式 一行 -->
    <section class="flow-filters">
      <ReSelect
        v-model="filters.taskId"
        class="flow-filter-task"
        placeholder="任务：全部"
        clearable
        filterable
        :options="taskOptions"
        @change="applyFilters"
      />
      <el-segmented v-model="filters.status" :options="STATUS_SEGMENTS" class="flow-seg" @change="applyFilters" />
      <ReSelect
        v-model="filters.trigger"
        class="flow-filter-trigger"
        placeholder="触发方式：全部"
        clearable
        :options="TRIGGER_OPTIONS"
        @change="applyFilters"
      />
      <span class="flow-filters-hint">保留 30 天 · 每天 03:30 自动清理过期记录</span>
    </section>

    <!-- 记录列表：ReTable 远程分页 -->
    <ReTable
      ref="tableRef"
      table-id="sync-task-run-logs"
      class="flow-table"
      :loader="loadLogs"
      :columns="columns"
      :pagination="true"
      :params="pageQuery"
      row-key="id"
      v-model:page="pageQuery.page"
      v-model:page-size="pageQuery.pageSize"
    >
      <template #empty>
        <div class="flow-empty">
          <span class="flow-empty-icon"><ReIcon name="Document" :size="22" /></span>
          <span class="flow-empty-title">还没有执行日志</span>
          <span class="flow-empty-desc">从「数据同步」页手动执行一次，或等定时任务触发，这里会记录每次执行的旅程与过程日志。</span>
          <ReButton icon="Refresh" @click="reload">刷新</ReButton>
        </div>
      </template>
      <template #runTime="{ row }">
        <span class="flow-mono">{{ row.runTime }}</span>
      </template>
      <template #taskName="{ row }">
        <span class="flow-task" :class="{ 'is-deleted': /已删除/.test(row.taskName) }">{{ row.taskName }}</span>
      </template>
      <template #trigger="{ row }">
        <span class="flow-trigger" :class="`is-${row.trigger.toLowerCase()}`">{{ triggerLabel(row.trigger) }}</span>
      </template>
      <template #status="{ row }">
        <span class="flow-status" :class="row.status === 'SUCCESS' ? 'ok' : 'bad'">
          {{ row.status === "SUCCESS" ? "成功" : "失败" }}
        </span>
      </template>
      <!-- 旅程迷你列：读源 → 映射 → 写入，颜色即结果 -->
      <template #journey="{ row }">
        <div
          class="flow-mini"
          :class="row.status === 'SUCCESS' ? 'ok' : 'bad'"
          :title="`读源 → 映射 → 写入：${row.status === 'SUCCESS' ? '顺利走完' : '以失败告终'}`"
        >
          <span class="flow-mini-node">1</span>
          <span class="flow-mini-line" />
          <span class="flow-mini-node">2</span>
          <span class="flow-mini-line" />
          <span class="flow-mini-node">3</span>
        </div>
      </template>
      <template #costMs="{ row }">
        <span class="flow-mono">{{ row.costMs ?? "—" }} ms</span>
      </template>
      <template #lineCount="{ row }">
        <span class="flow-mono">{{ row.lineCount }} 行</span>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="View" tip="查看过程日志" @click="openDetail(row)" />
      </template>
    </ReTable>

    <!-- 详情抽屉：某一次执行的旅程 + 过程日志 -->
    <ReDialog
      v-model="detailVisible"
      class="flow-detail-dlg"
      width="820px"
      title="执行日志详情"
      :subtitle="detail?.taskName || ''"
      :icon="DocumentIcon"
      :close-on-click-modal="false"
    >
      <div v-if="detail" class="flow-detail">
        <!-- 旅程走线（详情版） -->
        <div class="flow-journey flow-journey--detail">
          <template v-for="(step, i) in JOURNEY_STEPS" :key="step">
            <div class="flow-step">
              <span class="flow-node" :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'">{{ i + 1 }}</span>
              <span class="flow-node-label">{{ step }}</span>
            </div>
            <span
              v-if="i < JOURNEY_STEPS.length - 1"
              class="flow-line"
              :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'"
            />
          </template>
        </div>

        <!-- 摘要条 -->
        <div class="flow-detail-summary">
          <span class="flow-status" :class="detail.status === 'SUCCESS' ? 'ok' : 'bad'">
            {{ detail.status === "SUCCESS" ? "成功" : "失败" }}
          </span>
          <span class="flow-detail-meta"><span class="flow-mono">{{ detail.runTime }}</span></span>
          <span class="flow-detail-meta">{{ triggerLabel(detail.trigger) }}</span>
          <span class="flow-detail-meta">{{ detail.costMs ?? "—" }} ms</span>
          <span class="flow-detail-meta">{{ detail.lineCount }} 行</span>
        </div>

        <!-- 过程日志 -->
        <div class="flow-detail-block">
          <div class="flow-detail-block-head">
            <span class="flow-detail-block-title">过程日志</span>
            <span class="flow-detail-block-hint">连源、SQL、列解析、映射、逐文件读写、错误堆栈</span>
          </div>
          <div v-if="detail.lines.length" class="flow-lines">
            <div
              v-for="(li, i) in detail.lines"
              :key="i"
              class="flow-line-row"
              :class="`is-${li.level.toLowerCase()}`"
            >
              <span class="flow-line-time">{{ li.time }}</span>
              <span class="flow-line-level">{{ li.level }}</span>
              <span class="flow-line-msg">{{ li.message }}</span>
            </div>
          </div>
          <div v-else class="flow-lines-empty">该次执行没有过程日志行</div>
        </div>
      </div>
      <div v-else-if="detailLoading" class="flow-detail-loading">加载中…</div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 同步日志页 —— 跨任务汇总每次数据同步执行的旅程与过程详情。
 *
 * <p>设计取向：把「一次同步」表达为一段旅程——读源 → 字段映射 → 写入目标。
 * 列表用 ReTable 承载执行记录，「旅程」列以三节点走线用颜色直接传达结果
 * （绿=顺利走完 / 红=以失败告终）；点开某次执行看完整过程日志，定位卡在哪一步。</p>
 *
 * <p>与「数据同步」列表页里的「日志」弹窗（按任务查、含进行中实时追加）不同，
 * 本页是独立菜单入口，面向「所有任务的所有执行」：后端
 * {@code GET /ms/monitor/datasync/logs} 分页返回每一次执行（带任务名），点开
 * {@code GET /ms/monitor/datasync/logs/{id}} 查看该次执行的完整过程日志。</p>
 *
 * <p>数据来自 {@code ms_sync_task_run_log}（执行结束时落库，保留 30 天、每天
 * 03:30 由调度器清理）。任务删除后日志仍保留，任务名位置显示回退文案。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, reactive, ref } from "vue";
import { Document as DocumentIcon } from "@element-plus/icons-vue";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTable from "@repo/ui/re-table";
import ReSelect from "@repo/ui/re-select";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReDialog from "@repo/ui/re-dialog";
import {
  fetchSyncTasks,
  fetchSyncRunLogs,
  fetchSyncRunLogDetail,
  type SyncTask,
  type SyncTaskRunLogItem,
  type SyncTaskRunLogDetail,
} from "../../api/syncTaskApi";

/** 旅程三阶段（数据同步的真实流程：读源 → 字段映射 → 写入目标） */
const JOURNEY_STEPS = ["读源", "映射", "写入"] as const;

/** 状态分段：全部 / 成功 / 失败（value 与后端一致，"" 表示不过滤） */
const STATUS_SEGMENTS = [
  { label: "全部", value: "" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
];

/** 触发方式选项 */
const TRIGGER_OPTIONS = [
  { label: "手动", value: "MANUAL" },
  { label: "定时", value: "SCHEDULED" },
  { label: "实时", value: "REALTIME" },
];

/** 查询参数（ReTable 远程 loader 传参；page/pageSize 由 v-model 双向绑定） */
const pageQuery = reactive<{
  page: number;
  pageSize: number;
  taskId?: number | null;
  status?: string;
  trigger?: string;
}>({ page: 1, pageSize: 12, taskId: null, status: "", trigger: "" });

/** 筛选面板状态（与 pageQuery 分离：只在此处改动，应用后统一回第一页） */
const filters = reactive<{ taskId?: number | null; status: string; trigger?: string }>({
  taskId: null,
  status: "",
  trigger: "",
});

const tableRef = ref();
const loading = ref(false);
const total = ref(0);

/** 任务下拉：全部任务名（供按任务过滤） */
const tasks = ref<SyncTask[]>([]);
const taskOptions = computed(() => tasks.value.map(t => ({ label: t.syncTaskName, value: t.id })));

/** 表格列定义 */
const columns: ReTableColumn[] = [
  { prop: "runTime", label: "执行时间", width: 170, slot: "runTime" },
  { prop: "taskName", label: "任务", minWidth: 180, slot: "taskName" },
  { prop: "trigger", label: "触发", width: 90, slot: "trigger", align: "center" },
  { prop: "status", label: "状态", width: 90, slot: "status", align: "center" },
  { prop: "journey", label: "旅程", width: 150, slot: "journey", align: "center" },
  { prop: "costMs", label: "耗时", width: 90, slot: "costMs", align: "center" },
  { prop: "lineCount", label: "行数", width: 80, slot: "lineCount", align: "center" },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
];

/** 远程分页 loader：后端 /logs 分页，返回 { total, data } */
async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const res = await fetchSyncRunLogs({
      page,
      pageSize,
      taskId: (params.taskId as number) ?? null,
      status: (params.status as string) || null,
      trigger: (params.trigger as string) || null,
    });
    const list = res?.records ?? [];
    total.value = res?.total ?? 0;
    return { total: res?.total ?? 0, data: list as unknown as Record<string, unknown>[] };
  } finally {
    loading.value = false;
  }
}

/** 应用筛选：写回 pageQuery 并回到第一页 */
function applyFilters() {
  pageQuery.taskId = filters.taskId ?? null;
  pageQuery.status = filters.status || "";
  pageQuery.trigger = filters.trigger || "";
  pageQuery.page = 1;
  void tableRef.value?.reload();
}

/** 重新拉取（保留筛选与当前页） */
function reload() {
  void tableRef.value?.reload();
}

/** 详情 */
const detailVisible = ref(false);
const detail = ref<SyncTaskRunLogDetail | null>(null);
const detailLoading = ref(false);

async function openDetail(row: SyncTaskRunLogItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await fetchSyncRunLogDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

/** 触发方式中文 */
function triggerLabel(trigger: string): string {
  if (trigger === "MANUAL") return "手动";
  if (trigger === "REALTIME") return "实时";
  return "定时";
}

onMounted(async () => {
  try {
    tasks.value = (await fetchSyncTasks()) ?? [];
  } catch {
    tasks.value = [];
  }
});
</script>

<style scoped>
.flow-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 20px;
}

/* ---------- 页头卡片 ---------- */
.flow-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 18px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.flow-hero-main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.flow-hero-icon {
  flex: none;
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  background: var(--brand-gradient, linear-gradient(135deg, var(--brand-500), var(--brand-400)));
  box-shadow: var(--shadow-brand);
}
.flow-title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px; }
.flow-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--status-success);
  background: color-mix(in srgb, var(--status-success) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-success) 34%, transparent);
  border-radius: 999px; padding: 2px 9px;
}
.flow-sub { margin-top: 3px; font-size: 12.5px; color: var(--text-tertiary); }
.flow-hero-side { display: flex; align-items: center; gap: 16px; }
.flow-hero-stat { display: inline-flex; align-items: baseline; gap: 4px; }
.flow-hero-stat-val { font-size: 22px; font-weight: 700; color: var(--brand-600); font-variant-numeric: tabular-nums; }
.flow-hero-stat-key { font-size: 12px; color: var(--text-tertiary); }

/* ---------- 筛选卡片（一行） ---------- */
.flow-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  padding: 10px 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.flow-filter-task { width: 240px; flex: none; }
.flow-filter-trigger { width: 180px; flex: none; }
.flow-seg { flex: none; }
.flow-filters-hint { margin-left: auto; flex: none; font-size: 11.5px; color: var(--text-tertiary); white-space: nowrap; }

/* ---------- 表格 ---------- */
.flow-table { width: 100%; }
.flow-mono { font-family: var(--el-font-family-mono, "JetBrains Mono", "Consolas", monospace); font-variant-numeric: tabular-nums; }
.flow-task { font-weight: 600; color: var(--text-primary); }
.flow-task.is-deleted { color: var(--text-tertiary); font-style: italic; font-weight: 500; }

/* 触发 / 状态胶囊 */
.flow-trigger {
  display: inline-block;
  font-size: 11px; font-weight: 600; border-radius: 999px; padding: 1px 8px; line-height: 1.7;
  color: var(--text-secondary); background: var(--bg-fill); border: 1px solid var(--border-default);
}
.flow-trigger.is-manual { color: var(--brand-600); background: var(--brand-50); border-color: color-mix(in srgb, var(--brand-500) 30%, transparent); }
.flow-trigger.is-realtime { color: var(--status-warning); background: color-mix(in srgb, var(--status-warning) 12%, transparent); border-color: color-mix(in srgb, var(--status-warning) 34%, transparent); }

.flow-status { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 1px 9px; line-height: 1.7; color: #fff; }
.flow-status.ok { background: var(--status-success); }
.flow-status.bad { background: var(--status-error); }

/* 旅程迷你列 */
.flow-mini { display: inline-flex; align-items: center; }
.flow-mini-node {
  width: 18px; height: 18px; border-radius: 50%; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff;
}
.flow-mini-line { width: 16px; height: 2px; flex: none; border-radius: 2px; }
.flow-mini.ok .flow-mini-node { background: var(--status-success); }
.flow-mini.ok .flow-mini-line { background: var(--status-success); }
.flow-mini.bad .flow-mini-node { background: var(--status-error); }
.flow-mini.bad .flow-mini-line { background: var(--status-error); }

/* 空态 */
.flow-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 30px 0; }
.flow-empty-icon { color: var(--brand-500); opacity: .7; }
.flow-empty-title { font-weight: 600; color: var(--text-primary); }
.flow-empty-desc { font-size: 12px; color: var(--text-secondary); max-width: 420px; text-align: center; }
.flow-empty > :last-child { margin-top: 6px; }

/* ---------- 详情抽屉 ---------- */
.flow-detail { display: flex; flex-direction: column; gap: 12px; }
.flow-journey { display: flex; align-items: flex-start; }
.flow-journey--detail { margin: 2px 0 4px; padding: 12px; background: var(--bg-fill); border-radius: 10px; }
.flow-step { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: none; }
.flow-node {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
}
.flow-node.ok { background: var(--status-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-success) 16%, transparent); }
.flow-node.bad { background: var(--status-error); box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-error) 16%, transparent); }
.flow-node-label { font-size: 10.5px; color: var(--text-tertiary); }
.flow-line { flex: 1; height: 2px; margin: 12px 6px 0; border-radius: 2px; }
.flow-line.ok { background: var(--status-success); }
.flow-line.bad { background: var(--status-error); }

.flow-detail-summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.flow-detail-meta { font-size: 12px; color: var(--text-secondary); }
.flow-detail-block { display: flex; flex-direction: column; gap: 8px; }
.flow-detail-block-head { display: flex; align-items: baseline; gap: 10px; }
.flow-detail-block-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.flow-detail-block-hint { font-size: 11.5px; color: var(--text-tertiary); }
.flow-detail-loading { padding: 30px 0; text-align: center; font-size: 12.5px; color: var(--text-tertiary); }

.flow-lines {
  max-height: 55vh; overflow: auto;
  border: 1px solid var(--border-default); border-radius: 8px;
  padding: 8px 10px; background: var(--bg-fill);
  font-family: var(--el-font-family-mono, "JetBrains Mono", "Consolas", monospace);
  font-size: 12px; line-height: 1.6;
}
.flow-line-row { display: flex; gap: 10px; align-items: flex-start; white-space: pre-wrap; word-break: break-all; }
.flow-line-time { flex: none; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.flow-line-level { flex: none; width: 46px; font-weight: 700; }
.flow-line-msg { flex: 1; min-width: 0; color: var(--text-primary); }
.flow-line-row.is-info .flow-line-level { color: var(--brand-500); }
.flow-line-row.is-warn .flow-line-level { color: var(--status-warning); }
.flow-line-row.is-error .flow-line-level { color: var(--status-error); }
.flow-line-row.is-error .flow-line-msg { color: var(--status-error); }
.flow-lines-empty { padding: 16px 4px; font-size: 12px; color: var(--text-tertiary); }

/* ---------- 响应式 ---------- */
@media (max-width: 720px) {
  .flow-page { padding: 14px 12px 16px; }
  .flow-filters { flex-wrap: wrap; overflow-x: visible; }
  .flow-filter-task, .flow-filter-trigger { width: 100%; }
  .flow-filters-hint { margin-left: 0; }
  .flow-hero-side { width: 100%; justify-content: space-between; }
  .flow-line-row { flex-wrap: wrap; row-gap: 1px; }
  .flow-line-msg { flex: 1 0 100%; }
}
</style>