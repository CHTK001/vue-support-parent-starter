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
import ReTable from "@repo/ui/re-table";
import { clearRecords, countRecords, deleteRecord, deleteRecords, fetchFields, listFlows, pageRecords } from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
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
const selected = ref<CollectRecord[]>([]);
const detailVisible = ref(false);
const detail = ref<CollectRecord | null>(null);
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
  const [page1, defs, count] = await Promise.all([
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
    countRecords(flowId || undefined),
  ]);
  fields.value = defs ?? [];
  countAll.value = Number(count ?? 0);
  return { total: page1.total, data: page1.rows as unknown as Record<string, unknown>[] };
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

function showDetail(input: Record<string, unknown>): void {
  detail.value = input as unknown as CollectRecord;
  detailVisible.value = true;
}
</script>

<template>
  <div class="collect-page">
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
      empty-text="暂无采集结果"
      stripe
      @selection-change="pickSelection"
      @search="backToFirstPage"
      @search-reset="reloadFromFirstPage"
    >
      <template #toolbar>
        <span class="collect-hint">
          {{ activeFlowId ? `该流程共 ${countAll} 条结果` : "按流程筛选后展开字段列" }}
        </span>
        <ReButton
          icon="Delete"
          :disabled="!selected.length"
          :title="selected.length ? `删除勾选的 ${selected.length} 条结果` : '先勾选要删除的结果'"
          @click="removeSelected">selected.length ? `删除勾选的 ${selected.length} 条结果` : '先勾选要删除的结果'</ReButton>
        <ReButton icon="CircleClose" type="danger" title="清空当前流程的全部结果" @click="clearFlowRecords">清空当前流程的全部结果</ReButton>
      </template>

      <template #action="{ row }">
        <ReButton layout="square" icon="View" type="primary" title="查看这条结果的字段" @click="showDetail(row)"/>
        <ReButton layout="square" icon="Delete" type="danger" title="删除这条结果" @click="removeOne(row)"/>
      </template>
    </ReTable>

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
.collect-detail {
  margin-top: 10px;
  padding: 0;
  border: none;
  box-shadow: none;
}
</style>
