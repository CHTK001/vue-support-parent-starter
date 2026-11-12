<!--
  采集结果查询：列定义来自 /field/list，单元格来自 record.cells。

  后端不下发原始 payload，只给有序的 cells；因此动态列必须由流程的字段定义驱动。
  未选流程时没有稳定 schema，只展示固定列，字段值在「详情」里看。
  动态列用 formatter 渲染（列名随流程而变，无法预先声明插槽）。
  查询条件走 ReTable 内置搜索区（ReSearch）：输入框里的值是草稿，只有点「查询」才取数，
  所以流程相关的展示（动态列、清空范围）以最近一次取数真正用到的流程为准。
-->
<script setup lang="ts">
import { computed, onActivated, ref } from "vue";
import { getRouter, msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReTable from "@repo/ui/re-table";
import { clearRecords, deleteRecord, deleteRecords, fetchFields, getFlow, listFlows, pageRecords } from "../api/collectApi";
import { COLLECT_ACTIONS } from "../constants/actionColumns";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import { loadStrokeData } from "../utils/strokeData";
import FieldDefDialog from "../components/FieldDefDialog.vue";
import HanziStrokeDialog from "../components/HanziStrokeDialog.vue";
import type { RePageResult, ReTableColumn, ReTableLoadParams, ReTableSearchConfig } from "@repo/ui/re-table";
import type { CollectFieldDef, CollectFlow, CollectRecord } from "../types/collect";

defineOptions({ name: "CollectRecord" });

interface RecordQuery {
  page: number;
  pageSize: number;
}

const flows = ref<CollectFlow[]>([]);
const fields = ref<CollectFieldDef[]>([]);
const countAll = ref(0);

/** 空表时的解释文案（loadRecords 每次取数后刷新，见 explainEmpty） */
const emptyHint = ref("暂无采集结果");
const selected = ref<CollectRecord[]>([]);
const detailVisible = ref(false);
const detail = ref<CollectRecord | null>(null);
/** 结果字段定义弹窗：只对最近一次真正筛选过的流程可用 */
const fieldDefVisible = ref(false);
const strokeVisible = ref(false);
const strokeChar = ref("");
const tableRef = ref<{ reload: () => void; goto: (page?: number) => void; clearAllSelection: () => void } | null>(null);

const query = ref<RecordQuery>({ page: 1, pageSize: 20 });
/** 内置搜索区的草稿值，点「查询」时由 ReTable 合并进 loader 的 params */
const searchModel = ref<Record<string, unknown>>({
  collectRecordFlowId: "",
  collectRecordTaskId: "",
  collectRecordNodeId: "",
  collectRecordKey: "",
  collectRecordUrl: "",
});

const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
});

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    applyDeepLink();
    return;
  }
  void reloadFlows();
  tableRef.value?.reload();
});

/**
 * 深链预置：运行记录 / 采集器管理跳过来时带上运行ID 或采集器ID，
 * 直接把内置搜索区填好并重查一次，省得用户自己再去下拉里选。
 */
function applyDeepLink(): void {
  const query = getRouter().currentRoute.value.query as Record<string, string>;
  const taskId = String(query.taskId ?? "");
  const flowId = String(query.flowId ?? "");
  if (!taskId && !flowId) {
    return;
  }
  searchModel.value = {
    ...searchModel.value,
    collectRecordTaskId: taskId,
    collectRecordFlowId: flowId,
  };
  void tableRef.value?.goto(1);
}

const flowOptions = computed(() =>
  flows.value.map(item => ({
    label: String(item.collectFlowName ?? item.collectFlowId),
    value: String(item.collectFlowId),
  })),
);

/** 最近一次取数真正用到的流程：搜索框里的值只是草稿，改了没查之前不作数 */
const activeFlowId = ref("");

/** 内置搜索区：必须是 computed，流程下拉的选项要跟着流程列表刷新 */
const SEARCH = computed<ReTableSearchConfig>(() => ({
  title: "搜索采集结果",
  filters: [
    {
      key: "collectRecordFlowId",
      label: "流程",
      type: "select",
      placeholder: "全部流程",
      options: flowOptions.value,
      attrs: { filterable: true },
    },
    { key: "collectRecordTaskId", label: "运行ID", type: "input", placeholder: "按运行ID（任务ID）过滤" },
    { key: "collectRecordNodeId", label: "节点 ID", type: "input", placeholder: "节点 ID" },
    { key: "collectRecordKey", label: "业务主键", type: "input", placeholder: "业务主键模糊" },
    { key: "collectRecordUrl", label: "来源地址", type: "input", placeholder: "来源地址模糊" },
  ],
}));

function cellOf(record: unknown, name: string): string {
  const cells = (record as CollectRecord)?.cells ?? [];
  return cells.find(cell => cell.name === name)?.value ?? "";
}

/** 固定列 + 字段驱动的动态列 */
const columns = computed<ReTableColumn[]>(() => {
  const base: ReTableColumn[] = [
    { prop: "collectRecordId", label: "ID", width: 80 },
    ...(activeFlowId.value
      ? []
      : [{ prop: "collectRecordFlowId", label: "流程", width: 80 } as ReTableColumn]),
    { prop: "collectRecordTaskId", label: "任务", width: 80 },
    { prop: "collectRecordNodeId", label: "节点", width: 90, showOverflowTooltip: true },
    { prop: "collectRecordKey", label: "业务主键", width: 150, showOverflowTooltip: true },
    { prop: "collectRecordUrl", label: "来源地址", minWidth: 200, showOverflowTooltip: true },
  ];
  const dynamic = cellColumns.value.map(column => ({
    prop: `cell:${column.name}`,
    label: column.label,
    width: 180,
    formatter: (row: Record<string, unknown>) => cellOf(row, column.name),
  }));
  return [...base, ...dynamic, { prop: "createTime", label: "采集时间", width: 176 },
    { prop: "action", label: "操作", width: 110, slot: "action", fixed: "right" }];
});

/** 字段定义驱动列：未选流程时没有稳定 schema，只展示固定列 */
const cellColumns = computed<{ name: string; label: string }[]>(() =>
  fields.value
    .filter(field => field.collectFieldEnabled !== 0 && field.collectFieldName)
    .sort((a, b) => Number(a.collectFieldSort ?? 0) - Number(b.collectFieldSort ?? 0))
    .map(field => ({
      name: field.collectFieldName,
      label: field.collectFieldLabel || field.collectFieldName,
    })),
);

async function loadRecords({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const flowId = params.collectRecordFlowId ? Number(params.collectRecordFlowId) : 0;
  activeFlowId.value = flowId ? String(flowId) : "";
  /** 数量不再单发 /record/count：page 接口本身就带 total，重复查一次纯浪费网络 */
  const [page1, defs] = await Promise.all([
    pageRecords({
      page,
      pageSize,
      collectRecordFlowId: params.collectRecordFlowId as string | undefined,
      collectRecordTaskId: params.collectRecordTaskId as string | undefined,
      collectRecordNodeId: params.collectRecordNodeId as string | undefined,
      collectRecordKey: params.collectRecordKey as string | undefined,
      collectRecordUrl: params.collectRecordUrl as string | undefined,
    }),
    flowId ? fetchFields(flowId) : Promise.resolve([]),
  ]);
  fields.value = defs ?? [];
  countAll.value = Number(page1.total ?? 0);
  emptyHint.value = await explainEmpty(flowId, page1.total);
  return { total: page1.total, data: page1.rows as unknown as Record<string, unknown>[] };
}

/**
 * 空表时的解释文案。
 *
 * <p>「采集结果」为空 ≠ 采集失败：流程若用「数据库」节点把整批数据直写业务表，
 * 该节点按引擎设计**不产采集记录**（CollectDatabaseExecutor 的 javadoc 与节点元信息
 * 明文「不产采集记录」），数据落在目标表里，节点摘要才是它的产出凭证
 * （实测示例-GitHub 项目采集：n4 摘要「覆盖写入 10 行」，record 表 0 条）。
 * 2026-10-05 用户反馈「采集结果没数据啊」正是踩到这个口径，所以空态要区分两种情形：
 * 用数据库节点 → 指路到目标表与节点摘要；否则 → 维持原提示。</p>
 */
async function explainEmpty(flowId: number, total: number): Promise<string> {
  if (total > 0 || !flowId) {
    return "暂无采集结果";
  }
  try {
    const flow = await getFlow(flowId);
    const nodes = flow.dsl?.nodes ?? [];
    if (nodes.some((n) => n.shape === "database")) {
      return "该流程用「数据库」节点直写业务表，不产采集结果（数据在目标表，写入行数看运行记录的节点摘要）";
    }
  } catch {
    // 查不到流程详情就退回通用提示，不让解释文案反过来把页面搞挂
  }
  return "暂无采集结果";
}

/** 点「查询」：ReTable 自己会带新条件重载，本页只负责不在第一页时跳回去 */
function backToFirstPage(): void {
  if (query.value.page !== 1) {
    void tableRef.value?.goto(1);
  }
}

/** 点「重置」：内置搜索区只清值不取数，必须回到第一页重查一次 */
function reloadFromFirstPage(): void {
  void tableRef.value?.goto(1);
}

function pickSelection(rows: Record<string, unknown>[]): void {
  selected.value = rows as unknown as CollectRecord[];
}

async function removeOne(input: Record<string, unknown>): Promise<void> {
  const record = input as unknown as CollectRecord;
  if (!(await confirmAction(`确认删除结果 ${record.collectRecordId}？`, "删除结果"))) {
    return;
  }
  try {
    await deleteRecord(record.collectRecordId);
    msgSuccess("结果已删除");
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function removeSelected(): Promise<void> {
  if (!selected.value.length) {
    msgInfo("请先勾选要删除的结果");
    return;
  }
  if (!(await confirmAction(`确认删除勾选的 ${selected.value.length} 条结果？`, "批量删除"))) {
    return;
  }
  try {
    const removed = await deleteRecords(selected.value.map(item => item.collectRecordId));
    msgSuccess(`已删除 ${removed} 条结果`);
    tableRef.value?.clearAllSelection();
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function clearFlowRecords(): Promise<void> {
  const flowId = activeFlowId.value;
  if (!flowId) {
    msgWarning("请先按流程筛选，清空必须带流程或任务");
    return;
  }
  const flowName = flowOptions.value.find(item => item.value === flowId)?.label ?? flowId;
  if (!(await confirmAction(`确认清空流程「${flowName}」的全部采集结果？该操作不可撤销。`, "清空结果"))) {
    return;
  }
  try {
    const removed = await clearRecords(Number(flowId));
    msgInfo(`已清空 ${removed} 条结果`);
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

function hanziOf(input: Record<string, unknown>): string {
  const record = input as unknown as CollectRecord;
  const cells = record.cells ?? [];
  return cells.find(cell => cell.name === "hanzi_char")?.value ?? "";
}

function isHanziRecord(input: Record<string, unknown>): boolean {
  return Boolean(hanziOf(input));
}

function openStroke(input: Record<string, unknown>): void {
  const ch = hanziOf(input).trim().charAt(0);
  if (!ch) return;
  strokeChar.value = ch;
  strokeVisible.value = true;
}

function showDetail(input: Record<string, unknown>): void {
  detail.value = input as unknown as CollectRecord;
  detailVisible.value = true;
}

/** 字段定义保存后立刻重查：列标题、顺序、显隐都以新定义为准 */
function reloadAfterFieldSave(): void {
  tableRef.value?.reload();
}
</script>

<template>
  <div class="collect-page record-page">
    <!--
      页面只有一张表：没有页头，也没有统计卡。
      表格是 ref 受控的 ReTable（动态列 formatter / v-model:search-model / loader），
      筛选走内置 ReSearch，计数与批量操作放在表格工具栏，空态由 #empty 插槽接 ReEmpty。
    -->
    <ReTable
      ref="tableRef"
      class="collect-card"
      table-id="collect-record"
      :loader="loadRecords"
      :params="query"
      :columns="columns"
      show-selection
      row-key="collectRecordId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      v-model:search-model="searchModel"
      :search="SEARCH"
      :page-sizes="[10, 20, 50, 100]"
      :empty-text="emptyHint"
      stripe
      @selection-change="pickSelection"
      @search="backToFirstPage"
      @search-reset="reloadFromFirstPage"
    >
      <template #toolbar>
        <span class="collect-hint record-toolbar-hint">
          <template v-if="activeFlowId">
            共 {{ countAll }} 条结果 · {{ fields.length }} 个动态字段列<template v-if="selected.length"> · 已勾选 {{ selected.length }} 条</template>
          </template>
          <template v-else>按流程筛选后展开字段列</template>
        </span>
        <ReButton
          icon="SetUp"
          layout="square"
          size="small"
          :disabled="!activeFlowId"
          :tip="activeFlowId ? '维护当前流程的字段定义' : '先按流程筛选，再维护字段定义'"
          @click="fieldDefVisible = true"/>
        <ReButton
          icon="Delete"
          layout="square"
          size="small"
          :disabled="!selected.length"
          :tip="selected.length ? `删除勾选的 ${selected.length} 条结果` : '先勾选要删除的结果'"
          @click="removeSelected"/>
        <ReButton
          icon="CircleClose"
          type="danger"
          layout="square"
          size="small"
          tip="清空当前流程的全部结果"
          @click="clearFlowRecords"/>
      </template>

      <template #action="{ row }">
        <ReButton v-if="isHanziRecord(row)" icon="EditPen" layout="square" size="small" tip="查看汉字笔顺" @click="openStroke(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.viewResult" layout="square" size="small" @click="showDetail(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.deleteRecord" layout="square" size="small" @click="removeOne(row)"/>
      </template>

      <!-- 空态：接管 ReTable 的 #empty（未提供时组件回落 el-empty）。description 仍取脚本里的
           emptyHint —— 用数据库节点直写业务表的流程会拿到另一句解释，口径不丢 -->
      <template #empty="{ description }">
        <ReEmpty class="record-empty" :description="description" :image-size="72" />
      </template>
    </ReTable>

    <FieldDefDialog
      v-model="fieldDefVisible"
      :flow-id="Number(activeFlowId) || null"
      @saved="reloadAfterFieldSave"
    />

    <HanziStrokeDialog v-model="strokeVisible" :character="strokeChar" :loadStrokeData="loadStrokeData" />

    <ReDialog v-model="detailVisible" title="采集结果详情" width="720px" top="8vh" footer-hidden>
      <dl v-if="detail" class="collect-kv">
        <dt>ID</dt>
        <dd>{{ detail.collectRecordId }}</dd>
        <dt>流程 / 任务 / 节点</dt>
        <dd>
          {{ detail.collectRecordFlowId }} / {{ detail.collectRecordTaskId }} /
          {{ detail.collectRecordNodeId || "—" }}
        </dd>
        <dt>业务主键</dt>
        <dd>{{ detail.collectRecordKey || "—" }}</dd>
        <dt>来源地址</dt>
        <dd>{{ detail.collectRecordUrl || "—" }}</dd>
        <dt>采集时间</dt>
        <dd>{{ detail.createTime || "—" }}</dd>
      </dl>
      <ReTable
        v-if="detail"
        class="collect-detail"
        :data="(detail.cells ?? []) as unknown as Record<string, unknown>[]"
        :columns="[{ prop: 'name', label: '字段', width: 180 }, { prop: 'value', label: '值', showOverflowTooltip: true }]"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ maxHeight: 360 }"
        empty-text="该结果没有字段"
      />
    </ReDialog>
  </div>
</template>

<style scoped>
/*
 * 本页是 ref 受控的 ReTable（loader / v-model:search-model / 动态列 formatter /
 * #action 插槽）+ 两个 ReDialog，模板按「脚本绑定的 ref 与插槽」耦合，
 * 因此表格壳与全部绑定保持原样；外壳只保留一张表，通过 #empty 插槽接入 ReEmpty。
 * 颜色 / 圆角 / 阴影 / 过渡一律用 koi 令牌。
 */
.record-page {
  gap: var(--gap-md, 12px);
}

/* ===== 工具条提示 ===== */
.record-toolbar-hint {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ===== 空态：ReEmpty 自带大留白，这里收一点，别把表格撑太高 ===== */
.record-empty {
  padding: 8px 0;
}

/* ===== 详情弹窗里的字段表 ===== */
.collect-detail {
  margin-top: 10px;
  padding: 0;
  border: none;
  box-shadow: none;
  border-radius: var(--radius-md);
}

.collect-detail :deep(.re-table__toolbar-row) {
  display: none;
}
</style>
