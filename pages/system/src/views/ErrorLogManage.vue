<script setup lang="ts">
/**
 * 异常日志监控页面
 *
 * 顶部 4 个统计卡片（今日异常/未处理/已处理/处理率） + 搜索 + 分页表格 + 详情弹窗。
 * 支持标记已处理 / 忽略 / 删除。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Warning, Clock, CircleCheck, TrendCharts } from "@element-plus/icons-vue";
import { pageForErrorLog, getErrorLogStatistic, updateErrorLogStatus, deleteErrorLog } from "../api/systemApi";
import type { SysErrorLog, ErrorLogStatistic } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/* ================== 统计卡片 ================== */
const statistic = ref<ErrorLogStatistic>({
  total: 0,
  todayCount: 0,
  pendingCount: 0,
  handledCount: 0,
  ignoredCount: 0,
  handleRate: 0,
});
const statLoading = ref(false);

async function loadStatistic() {
  statLoading.value = true;
  try {
    const res = await getErrorLogStatistic();
    statistic.value = res?.data ?? statistic.value;
  } catch {
    /* 统计失败不阻塞列表 */
  } finally {
    statLoading.value = false;
  }
}

/* ================== 查询 ================== */
const query = ref<{
  page: number;
  pageSize: number;
  sysErrorMessage?: string;
  sysErrorSource?: string;
  sysErrorStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

const sourceOptions = [
  { value: "js", label: "JS 错误" },
  { value: "rejection", label: "未处理 Promise" },
  { value: "resource", label: "资源加载" },
  { value: "manual", label: "手动上报" },
];

const statusOptions = [
  { value: 0, label: "未处理" },
  { value: 1, label: "已处理" },
  { value: 2, label: "已忽略" },
];

function sourceLabel(v?: string) {
  return sourceOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}

function statusLabel(v?: number) {
  return statusOptions.find((o) => o.value === v)?.label ?? "-";
}

function statusTagType(v?: number): "danger" | "success" | "info" {
  if (v === 1) return "success";
  if (v === 2) return "info";
  return "danger";
}

/** 毫秒时间戳格式化 */
function fmtTime(ts?: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const tableRef = ref();
const actionLoading = ref<number>(0);

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForErrorLog({
    page,
    pageSize,
    sysErrorMessage: (params.sysErrorMessage as string) || undefined,
    sysErrorSource: (params.sysErrorSource as string) || undefined,
    sysErrorStatus:
      params.sysErrorStatus === "" || params.sysErrorStatus === undefined
        ? undefined
        : (params.sysErrorStatus as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/* ================== 详情 ================== */
const detailVisible = ref(false);
const detail = ref<SysErrorLog | null>(null);

function handleView(row: Record<string, unknown>) {
  detail.value = row as unknown as SysErrorLog;
  detailVisible.value = true;
}

/* ================== 状态处理 / 删除 ================== */
async function changeStatus(row: Record<string, unknown>, status: number) {
  const log = row as unknown as SysErrorLog;
  if (actionLoading.value) return;
  actionLoading.value = log.sysErrorLogId!;
  try {
    await updateErrorLogStatus(log.sysErrorLogId!, status);
    ElMessage.success(status === 1 ? "已标记为已处理" : "已忽略");
    tableRef.value?.reload();
    loadStatistic();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    actionLoading.value = 0;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const log = row as unknown as SysErrorLog;
  if (actionLoading.value) return;
  try {
    await ElMessageBox.confirm("确认删除该异常日志？", "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  actionLoading.value = log.sysErrorLogId!;
  try {
    await deleteErrorLog(log.sysErrorLogId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
    loadStatistic();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    actionLoading.value = 0;
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysErrorMessage", label: "异常消息", minWidth: 240, showOverflowTooltip: true },
  { prop: "sysErrorSource", label: "来源", width: 120, slot: "source", align: "center" },
  { prop: "sysErrorFilename", label: "出错文件", minWidth: 180, showOverflowTooltip: true },
  { prop: "linecol", label: "行:列", width: 90, slot: "linecol", align: "center" },
  { prop: "sysErrorCount", label: "发生次数", width: 90, align: "center" },
  { prop: "sysErrorFirstAt", label: "首次发生时间", width: 170, slot: "firstAt", align: "center" },
  { prop: "sysErrorStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 240, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
  loadStatistic();
});
</script>

<template>
  <div class="system-page">
    <!-- 统计卡片 -->
    <div class="stat-cards" v-loading="statLoading">
      <div class="stat-card stat-card--today">
        <div class="stat-card__icon"><el-icon><Warning /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.todayCount ?? 0 }}</div>
          <div class="stat-card__label">今日异常</div>
        </div>
      </div>
      <div class="stat-card stat-card--pending">
        <div class="stat-card__icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.pendingCount ?? 0 }}</div>
          <div class="stat-card__label">未处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--resolved">
        <div class="stat-card__icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.handledCount ?? 0 }}</div>
          <div class="stat-card__label">已处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--rate">
        <div class="stat-card__icon"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ (statistic.handleRate ?? 0).toFixed(1) }}%</div>
          <div class="stat-card__label">处理率</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" :add-button="false">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysErrorMessage"
            placeholder="异常消息（模糊）"
            clearable
            class="!w-56"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysErrorSource"
            placeholder="来源"
            clearable
            class="!w-40"
            :data="sourceOptions"
          />
          <ReSelect
            v-model="query.sysErrorStatus"
            placeholder="状态"
            clearable
            class="!w-40"
            :data="statusOptions"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload(); loadStatistic()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-error-log"
        :loader="loadLogs"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysErrorLogId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        class="mt-2"
      >
        <template #source="{ row }">
          <ReTag type="primary" effect="plain" size="small">{{ sourceLabel(row.sysErrorSource) }}</ReTag>
        </template>
        <template #linecol="{ row }">
          <span class="text-xs">{{ row.sysErrorLineno ?? '-' }}:{{ row.sysErrorColno ?? '-' }}</span>
        </template>
        <template #firstAt="{ row }">
          <span class="text-xs">{{ fmtTime(row.sysErrorFirstAt) }}</span>
        </template>
        <template #status="{ row }">
          <ReTag :type="statusTagType(row.sysErrorStatus)" size="small">{{ statusLabel(row.sysErrorStatus) }}</ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="info" @click="handleView(row)">详情</ReButton>
          <ReButton
            layout="square"
            type="success"
            v-admin
            :disabled="row.sysErrorStatus === 1"
            :loading="actionLoading === row.sysErrorLogId"
            @click="changeStatus(row, 1)"
          >
            标记已处理
          </ReButton>
          <ReButton
            layout="square"
            type="warning"
            v-admin
            :disabled="row.sysErrorStatus === 2"
            :loading="actionLoading === row.sysErrorLogId"
            @click="changeStatus(row, 2)"
          >
            忽略
          </ReButton>
          <ReButton
            layout="square"
            type="danger"
            icon="Delete"
            v-admin
            :loading="actionLoading === row.sysErrorLogId"
            @click="handleDelete(row)"
          >
            删除
          </ReButton>
        </template>
      </ReTable>
    </el-card>

    <!-- 异常详情弹窗 -->
    <ReDialog
      v-model="detailVisible"
      title="异常详情"
      width="820"
      :footer-hidden="true"
      destroy-on-close
      layout="modern"
    >
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="异常消息" :span="2">
            <span class="text-danger">{{ detail.sysErrorMessage || detail.sysErrorLogMessage || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="来源">{{ sourceLabel(detail.sysErrorSource) }}</el-descriptions-item>
          <el-descriptions-item label="出错文件">
            <span class="break-all">{{ detail.sysErrorFilename || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="行:列">{{ detail.sysErrorLineno ?? '-' }}:{{ detail.sysErrorColno ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="标签名">{{ detail.sysErrorTagName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资源URL" :span="2">
            <span class="break-all text-xs">{{ detail.sysErrorResourceUrl || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="首次发生时间">{{ fmtTime(detail.sysErrorFirstAt) }}</el-descriptions-item>
          <el-descriptions-item label="发生次数">{{ detail.sysErrorCount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="上报时间" :span="2">{{ fmtTime(detail.sysErrorReportTime) }}</el-descriptions-item>
        </el-descriptions>
        <div class="err-stack">
          <div class="err-stack__title">异常堆栈</div>
          <pre class="err-stack__pre">{{ detail.sysErrorStack || detail.sysErrorLogStack || '无' }}</pre>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
.text-danger {
  color: var(--el-color-danger);
  word-break: break-all;
}
.break-all {
  word-break: break-all;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: white;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
  }
  &__num {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
  &--today &__icon {
    background: linear-gradient(135deg, #f5576c, #f093fb);
  }
  &--pending &__icon {
    background: linear-gradient(135deg, #f6d365, #fda085);
  }
  &--resolved &__icon {
    background: linear-gradient(135deg, #11998e, #38ef7d);
  }
  &--rate &__icon {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }
}

.err-stack {
  margin-top: 16px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  &__pre {
    margin: 0;
    padding: 12px;
    border-radius: 8px;
    background: var(--el-fill-color-darker);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 320px;
    overflow: auto;
  }
}
</style>
