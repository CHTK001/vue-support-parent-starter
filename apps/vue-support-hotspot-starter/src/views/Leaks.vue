<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">资源泄漏</span>
        <el-select v-model="filterType" placeholder="类型" clearable class="filter-select">
          <el-option label="File" value="File" />
          <el-option label="Socket" value="Socket" />
          <el-option label="Connection" value="Connection" />
          <el-option label="Thread" value="Thread" />
        </el-select>
        <el-input
          v-model="resourceNameSearch"
          placeholder="搜索资源名…"
          clearable

          class="filter-input"
        />
        <el-input
          v-model="threadSearch"
          placeholder="搜索线程…"
          clearable

          class="filter-input"
        />
        <el-checkbox v-model="activeOnly" >仅看活跃</el-checkbox>
        <el-date-picker
          v-model="range"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始时间"
          end-placeholder="结束时间"

          style="width: 320px"
        />
      </div>
      <div class="toolbar-right">
        <el-button round @click="exportCsvFull">
          <el-icon class="mr-1"><Download /></el-icon>导出 CSV（全量）
        </el-button>
        <el-button type="primary" round :loading="injecting" @click="doInjectLeak">
          <el-icon class="mr-1"><Plus /></el-icon>制造一条泄漏
        </el-button>
        <el-button round :loading="loading" @click="load">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <div class="table-panel">
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
           .apm-table 变量覆盖与 e2e 的 .el-table__body 选择器不失效；
           pagination=false —— 分页仍由下方 el-pagination 自管；toolbar=false 不新增工具栏；
           原 el-table 没写 border → settings.border=false 抑制默认边框；
           layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。 -->
      <ReTable
        :data="items as unknown as Record<string, unknown>[]"
        :columns="leakColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        class="apm-table"
        empty-text="暂无泄漏记录"
      >
        <template #col-resourceType="{ row }">
          <el-tag :type="typeTagOf(row)" round>
            {{ row.resourceType }}
          </el-tag>
        </template>
        <template #col-resourceName="{ row }">
          <span class="mono">{{ row.resourceName }}</span>
        </template>
        <template #col-thread="{ row }">
          <span class="mono muted">{{ row.thread || "—" }}</span>
        </template>
        <template #col-ageMs="{ row }">
          <el-progress
            :percentage="agePercent(ageMsOf(row))"
            :color="ageColor(ageMsOf(row))"
            :stroke-width="6"
          />
        </template>
        <template #col-active="{ row }">
          <el-tag :type="row.active ? 'danger' : 'info'" effect="dark">
            {{ row.active ? "活跃" : "已关闭" }}
          </el-tag>
        </template>
        <template #col-detectedAt="{ row }">
          <span class="muted">{{ row.detectedAt || "—" }}</span>
        </template>
        <template #col-stackTrace="{ row }">
          <el-popover v-if="row.stackTrace" trigger="hover" width="420" placement="left">
            <template #reference>
              <el-button text type="primary">展开</el-button>
            </template>
            <pre class="stack">{{ row.stackTrace }}</pre>
          </el-popover>
          <span v-else class="muted">—</span>
        </template>
      </ReTable>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Download, Plus } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { pageLeaks, exportLeaksCsv, injectLeak } from "../api/apmApi";
import type { LeakRecord, LeakQuery } from "../api/apmApi";

const items = ref<LeakRecord[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const filterType = ref("");
const resourceNameSearch = ref("");
const threadSearch = ref("");
const activeOnly = ref(false);
const range = ref<[Date, Date] | null>(null);

/**
 * 列配置：原来散在模板里的 7 个 el-table-column 收敛到这里。
 *
 * <p>标题都是写死文案（没有 t()），用普通常量即可。七列原 el-table-column
 * 都没有 prop（纯自定义单元格），这里补稳定合成 prop（直接取行字段名，
 * stackTrace 列取调用栈字段），模板里一一对应 #col-&lt;prop&gt; 插槽。</p>
 */
const leakColumns: ReTableColumn[] = [
  { prop: "resourceType", label: "类型", width: 120, slot: "resourceType" },
  { prop: "resourceName", label: "资源", minWidth: 200, slot: "resourceName" },
  { prop: "thread", label: "线程", minWidth: 140, slot: "thread" },
  { prop: "ageMs", label: "存活", width: 100, align: "center", slot: "ageMs" },
  { prop: "active", label: "状态", width: 80, align: "center", slot: "active" },
  { prop: "detectedAt", label: "检测时间", width: 160, slot: "detectedAt" },
  { prop: "stackTrace", label: "调用栈", width: 90, align: "center", slot: "stackTrace" },
];

/** 插槽里的 row 是宽类型（unknown）：类型取色前先收窄成 string（原 typeTag(row.resourceType) 同义） */
function typeTagOf(row: Record<string, unknown>) {
  return typeTag(String(row.resourceType ?? ""));
}

/** 插槽里的 row 是宽类型（unknown）：存活毫秒是算术入参，先收窄成 number */
function ageMsOf(row: Record<string, unknown>): number {
  return Number(row.ageMs ?? 0);
}

async function load() {
  loading.value = true;
  try {
    const q: LeakQuery = {
      page: page.value,
      size: size.value,
      resourceType: filterType.value || undefined,
      resourceName: resourceNameSearch.value.trim() || undefined,
      thread: threadSearch.value.trim() || undefined,
      activeOnly: activeOnly.value || undefined,
      startTime: range.value?.[0] ? new Date(range.value[0]).getTime() : undefined,
      endTime: range.value?.[1] ? new Date(range.value[1]).getTime() : undefined,
    };
    const res = await pageLeaks(q);
    items.value = res.items;
    total.value = res.total;
  } catch {
    ElMessage.error("加载泄漏记录失败");
  } finally {
    loading.value = false;
  }
}

function typeTag(t: string) {
  switch (t) {
    case "File":
      return "warning";
    case "Socket":
      return "danger";
    case "Connection":
      return "primary";
    case "Thread":
      return "success";
    default:
      return "info";
  }
}

/** 存活 0~60s 映射到 0~100% */
function agePercent(ageMs: number) {
  return Math.min(100, Math.round((ageMs / 60000) * 100));
}

function ageColor(ageMs: number) {
  if (ageMs > 30000) return "#ef4444";
  if (ageMs > 10000) return "#f59e0b";
  return "#22c55e";
}

onMounted(load);

watch(
  () => [filterType.value, resourceNameSearch.value, threadSearch.value, activeOnly.value, range.value],
  () => {
    page.value = 1;
    load();
  },
);

// ---- 注入 ----
const injecting = ref(false);
const leakSeq = ref(0);

async function doInjectLeak() {
  injecting.value = true;
  try {
    leakSeq.value++;
    const kinds = ["File", "Socket", "Connection", "Thread"];
    const kind = kinds[leakSeq.value % kinds.length];
    await injectLeak(kind, `${kind.toLowerCase()}-manual-${leakSeq.value}`);
    ElMessage.success(`已制造一条 ${kind} 泄漏记录`);
    await load();
  } catch {
    ElMessage.error("写入失败");
  } finally {
    injecting.value = false;
  }
}

/** 后端全量 CSV 导出（带当前筛选条件） */
function exportCsvFull() {
  exportLeaksCsv({
    resourceType: filterType.value || undefined,
    resourceName: resourceNameSearch.value.trim() || undefined,
    thread: threadSearch.value.trim() || undefined,
    startTime: range.value?.[0] ? new Date(range.value[0]).getTime() : undefined,
    endTime: range.value?.[1] ? new Date(range.value[1]).getTime() : undefined,
  });
}
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
}

.filter-select {
  width: 140px;
}

.filter-input {
  width: 160px;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg */
  padding: 8px;
}

.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

.stack {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
  color: var(--apm-fg);
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 8px 4px;
}

/* 尊重系统「减少动态效果」偏好：
   本页自身无 transition/animation，需关掉的是 loading 与分页的旋转动画 */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
