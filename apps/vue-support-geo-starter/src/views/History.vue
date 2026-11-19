<script setup lang="ts">
/**
 * 下载历史页
 *
 * 分页 + 表格，支持金字塔构建、删除、清空。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, ref, watch, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import {
  getAllHistory,
  deleteDownloadRecord,
  clearDownloadHistory,
  buildPyramidForFile,
} from "@/api/history";
import type { DownloadHistoryRecord } from "@/types";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";

/**
 * 后端 /v1/geo/history/page 只支持 page/pageSize，不支持筛选参数。
 * 为保证筛选真实生效（而非前端摆设），这里一次性拉全量，筛选与分页都在前端完成。
 */
const allRecords = ref<DownloadHistoryRecord[]>([]);
const loading = ref(false);
const loadError = ref("");
const page = ref(1);
const pageSize = ref(20);
const filterKeyword = ref("");
const filterStatus = ref("");
/** 日期范围 [YYYY-MM-DD, YYYY-MM-DD]，按 createdAt 的日期部分过滤 */
const filterDate = ref<[string, string] | null>(null);

/** 前端筛选：名称/图源关键字 + 状态 + 日期范围 */
const filteredRecords = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase();
  const status = filterStatus.value;
  const [dStart, dEnd] = filterDate.value ?? ["", ""];
  return allRecords.value.filter((r) => {
    if (kw && !`${r.name ?? ""}${r.sourceName ?? r.source ?? ""}`.toLowerCase().includes(kw)) return false;
    if (status && (r.status ?? "") !== status) return false;
    const day = r.createdAt?.slice(0, 10) ?? "";
    if (dStart && (!day || day < dStart || day > dEnd)) return false;
    return true;
  });
});

const total = computed(() => filteredRecords.value.length);

/** 当前页数据（前端分页切片） */
const records = computed(() =>
  filteredRecords.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);

/** 筛选条件变化时回到第一页 */
watch([filterKeyword, filterStatus, filterDate], () => {
  page.value = 1;
});

const statusMap: Record<string, { label: string; type: string }> = {
  completed: { label: "已完成", type: "success" },
  downloaded: { label: "已下载", type: "primary" },
  failed: { label: "失败", type: "danger" },
};

/**
 * 列配置：原模板里 11 个 el-table-column 收敛为数组。
 *
 * <p>带 {@code <template #default>} 的列配 {@code slot}，模板里用 {@code #col-<prop>}
 * 接收；原本没有 prop 的展示列按其渲染的字段名造稳定 prop（zoom/format/…），
 * 操作列合成 {@code actions}。列标题全为静态文案，无需 computed。</p>
 */
const historyColumns: ReTableColumn[] = [
  { prop: "id", label: "ID", width: 80, align: "center" },
  { prop: "name", label: "名称", minWidth: 180, showOverflowTooltip: true },
  { prop: "sourceName", label: "图源", width: 120, showOverflowTooltip: true, slot: "sourceName" },
  { prop: "zoom", label: "级别", width: 60, align: "center", slot: "zoom" },
  { prop: "format", label: "格式", width: 90, slot: "format" },
  { prop: "tileCount", label: "瓦片数", width: 80, align: "right", slot: "tileCount" },
  { prop: "fileSize", label: "文件大小", width: 100, align: "right", slot: "fileSize" },
  { prop: "status", label: "状态", width: 100, align: "center", slot: "status" },
  { prop: "durationSecs", label: "耗时", width: 90, align: "right", slot: "durationSecs" },
  { prop: "createdAt", label: "创建时间", width: 170, slot: "createdAt" },
  { prop: "actions", label: "操作", width: 140, fixed: "right", slot: "actions" },
];

/**
 * ReTable 列插槽里的 row 是宽类型（各字段取出为 unknown），
 * 算术与传参前统一在这里收窄成 DownloadHistoryRecord（见黄金样例的 durationMs）。
 */
function asRecord(row: Record<string, unknown>): DownloadHistoryRecord {
  return row as unknown as DownloadHistoryRecord;
}

/** 瓦片数文案（原模板 row.tileCount?.toLocaleString()，unknown 上不能直接调方法） */
function tileCountText(row: Record<string, unknown>): string {
  return asRecord(row).tileCount?.toLocaleString() ?? "-";
}

/** 文件大小（formatSize 形参是 number|undefined，unknown 需先收窄） */
function rowSize(row: Record<string, unknown>): number | undefined {
  return asRecord(row).fileSize;
}

/** 耗时文案（formatDuration 形参是 number|undefined，unknown 需先收窄） */
function durationText(row: Record<string, unknown>): string {
  return formatDuration(asRecord(row).durationSecs);
}

/** 状态标签类型（原模板 (statusMap[row.status]?.type as any) ?? 'info'，unknown 不能作索引） */
function statusTagType(row: Record<string, unknown>): any {
  return (statusMap[asRecord(row).status ?? ""]?.type as any) ?? "info";
}

/** 状态标签文案（原模板 statusMap[row.status]?.label ?? row.status ?? "-"） */
function statusLabel(row: Record<string, unknown>): string {
  const status = asRecord(row).status;
  return statusMap[status ?? ""]?.label ?? status ?? "-";
}

/** 行 ID（操作列回调形参是 string|number，unknown 需先收窄） */
function rowId(row: Record<string, unknown>): string | number {
  return asRecord(row).id;
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

/**
 * 格式化耗时
 * @param s 秒数
 * @returns 可读的耗时字符串
 */
function formatDuration(s?: number) {
  if (!s) return "-";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}分${sec}秒` : `${sec}秒`;
}

/** 拉取全量历史（筛选与分页在前端完成） */
async function refresh() {
  loading.value = true;
  try {
    allRecords.value = await getAllHistory();
    loadError.value = "";
  } catch (e: any) {
    // 失败不再清空列表伪装成空态：保留旧数据，由表格上方错误条展示
    loadError.value = e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

/**
 * 删除单条历史记录
 * @param id 记录 ID
 */
async function onDelete(id: string | number) {
  try {
    await ElMessageBox.confirm("确定删除该记录？", "删除", { type: "warning" });
    await deleteDownloadRecord(id);
    message.success("已删除");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") message.error(`删除失败：${e?.message ?? e}`);
  }
}

/** 清空全部下载历史 */
async function onClearAll() {
  try {
    await ElMessageBox.confirm("确定清空全部下载历史？此操作不可恢复。", "清空历史", { type: "warning" });
    await clearDownloadHistory();
    message.success("已清空");
    refresh();
  } catch (e: any) {
    if (e !== "cancel") message.error(`清空失败：${e?.message ?? e}`);
  }
}

/**
 * 为指定记录构建金字塔
 * @param id 记录 ID
 */
async function onBuildPyramid(id: string | number) {
  try {
    const res = await buildPyramidForFile(id);
    message.success(res.message || "已触发金字塔构建");
  } catch (e: any) {
    message.error(`金字塔构建失败：${e?.message ?? e}`);
  }
}

/**
 * 切换页码（前端分页：仅移动切片窗口，不重新请求）
 * @param p 目标页码
 */
function onPageChange(p: number) {
  page.value = p;
}

onMounted(refresh);
</script>

<template>
  <div class="history-page">
    <div class="history-head">
      <div class="history-title">
        <el-icon><Clock /></el-icon>
        <span>下载历史</span>
        <el-tag type="info" effect="plain">{{ total }} 条记录</el-tag>
      </div>
      <el-button type="danger" plain :disabled="allRecords.length === 0" @click="onClearAll">
        清空历史
      </el-button>
    </div>

    <div class="history-filters">
      <el-input v-model="filterKeyword" placeholder="搜索名称 / 图源" clearable style="width: 200px" />
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 130px">
        <el-option v-for="(v, k) in statusMap" :key="k" :label="v.label" :value="k" />
      </el-select>
      <el-date-picker
        v-model="filterDate"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
      />
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :title="`历史加载失败：${loadError}`"
      :closable="false"
      show-icon
      class="history-error"
    >
      <el-button size="small" type="primary" plain @click="refresh">重试</el-button>
    </el-alert>

    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
         既有 :deep(.el-table…) 样式与 e2e 选择器一概不失效；pagination=false —— 分页仍由
         下方 el-pagination 自管，否则会多出一套页码控件；toolbar=false 不新增工具栏
         （按钮清单与改造前逐个一致）；原 border 走 ReTable 默认（border: true），
         v-loading 换成 :loading，stripe 同名保留。 -->
    <ReTable
      :data="records"
      :columns="historyColumns"
      :loading="loading"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      stripe
      :empty-text="allRecords.length ? '暂无符合条件的历史' : '暂无下载历史'"
      class="history-table"
    >
      <template #col-sourceName="{ row }">{{ row.sourceName || row.source || "-" }}</template>
      <template #col-zoom="{ row }">{{ row.zoom ?? "-" }}</template>
      <template #col-format="{ row }">{{ row.format || "-" }}</template>
      <template #col-tileCount="{ row }">{{ tileCountText(row) }}</template>
      <template #col-fileSize="{ row }">{{ formatSize(rowSize(row)) }}</template>
      <template #col-status="{ row }">
        <el-tag :type="statusTagType(row)">
          {{ statusLabel(row) }}
        </el-tag>
      </template>
      <template #col-durationSecs="{ row }">{{ durationText(row) }}</template>
      <template #col-createdAt="{ row }">{{ row.createdAt ?? "-" }}</template>
      <template #col-actions="{ row }">
        <el-button link type="primary" @click="onBuildPyramid(rowId(row))">金字塔</el-button>
        <el-button link type="danger" @click="onDelete(rowId(row))">删除</el-button>
      </template>
    </ReTable>

    <div class="history-pager">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.history-page {
  height: calc(100vh - 128px);
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
}
.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.history-error {
  margin-bottom: 8px;
}
.history-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 4px 8px;
}
.history-table {
  flex: 1;
  width: 100%;
}
.history-pager {
  padding: 12px 4px 4px;
  display: flex;
  justify-content: center;
}
</style>