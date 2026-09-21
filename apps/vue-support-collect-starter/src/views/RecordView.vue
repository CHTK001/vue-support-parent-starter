<!--
  采集结果查询：列定义来自 /field/list，单元格来自 record.cells。

  后端不下发原始 payload，只给有序的 cells；因此动态列必须由流程的字段定义驱动。
  未选流程时没有稳定 schema，只展示固定列，字段值在「详情」里看。
  动态列用 formatter 渲染（列名随流程而变，无法预先声明插槽）。
-->
<script setup lang="ts">
import { computed, onActivated, ref } from "vue";
import { msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { clearRecords, countRecords, deleteRecord, deleteRecords, fetchFields, listFlows, pageRecords } from "../api/collectApi";
import { confirmAction, errText, useCollectGated, useCollectView } from "../composables/useCollectView";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import type { CollectFieldDef, CollectFlow, CollectRecord } from "../types/collect";

defineOptions({ name: "CollectRecord" });

interface RecordQuery {
  page: number;
  pageSize: number;
  collectRecordFlowId?: string;
  collectRecordTaskId?: string;
  collectRecordNodeId?: string;
  collectRecordKey?: string;
  collectRecordUrl?: string;
}

const flows = ref<CollectFlow[]>([]);
const fields = ref<CollectFieldDef[]>([]);
const countAll = ref(0);
const selected = ref<CollectRecord[]>([]);
const detailVisible = ref(false);
const detail = ref<CollectRecord | null>(null);
const tableRef = ref<{ reload: () => void; clearAllSelection: () => void } | null>(null);

const query = ref<RecordQuery>({ page: 1, pageSize: 20 });
const draft = ref({
  collectRecordFlowId: "" as string | number,
  collectRecordTaskId: "" as string | number,
  collectRecordNodeId: "",
  collectRecordKey: "",
  collectRecordUrl: "",
});

const { ready } = useCollectGated();
const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
});

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reloadFlows();
  tableRef.value?.reload();
});

const flowOptions = computed(() =>
  flows.value.map(item => ({
    label: String(item.collectFlowName ?? item.collectFlowId),
    value: String(item.collectFlowId),
  })),
);

function cellOf(record: unknown, name: string): string {
  const cells = (record as CollectRecord)?.cells ?? [];
  return cells.find(cell => cell.name === name)?.value ?? "";
}

/** 固定列 + 字段驱动的动态列 */
const columns = computed<ReTableColumn[]>(() => {
  const base: ReTableColumn[] = [
    { prop: "collectRecordId", label: "ID", width: 80 },
    ...(query.value.collectRecordFlowId
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
    { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right" }];
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

function search(): void {
  const picked = draft.value;
  query.value = {
    page: 1,
    pageSize: query.value.pageSize,
    collectRecordFlowId: picked.collectRecordFlowId ? String(picked.collectRecordFlowId) : undefined,
    collectRecordTaskId: picked.collectRecordTaskId ? String(picked.collectRecordTaskId) : undefined,
    collectRecordNodeId: String(picked.collectRecordNodeId ?? "").trim() || undefined,
    collectRecordKey: String(picked.collectRecordKey ?? "").trim() || undefined,
    collectRecordUrl: String(picked.collectRecordUrl ?? "").trim() || undefined,
  };
}

function reset(): void {
  draft.value = {
    collectRecordFlowId: "",
    collectRecordTaskId: "",
    collectRecordNodeId: "",
    collectRecordKey: "",
    collectRecordUrl: "",
  };
  query.value = { page: 1, pageSize: 20 };
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
  const flowId = draft.value.collectRecordFlowId;
  if (!flowId) {
    msgWarning("请先选择流程，清空必须带流程或任务");
    return;
  }
  if (!(await confirmAction("确认清空该流程的全部采集结果？该操作不可撤销。", "清空结果"))) {
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
    <div class="collect-card collect-filters">
      <ReSelect
        v-model="draft.collectRecordFlowId"
        size="small"
        clearable
        filterable
        placeholder="全部流程"
        :options="flowOptions"
        style="width: 200px"
        @update:model-value="search"
      />
      <ReInput v-model="draft.collectRecordTaskId" size="small" clearable placeholder="任务 ID" style="width: 140px" @keyup.enter="search"/>
      <ReInput v-model="draft.collectRecordNodeId" size="small" clearable placeholder="节点 ID" style="width: 120px" @keyup.enter="search"/>
      <ReInput v-model="draft.collectRecordKey" size="small" clearable placeholder="业务主键模糊" style="width: 160px" @keyup.enter="search"/>
      <ReInput v-model="draft.collectRecordUrl" size="small" clearable placeholder="来源地址模糊" style="width: 200px" @keyup.enter="search"/>
      <ReButton size="small" type="primary" icon="Search" @click="search">查询</ReButton>
      <ReButton size="small" @click="reset">重置</ReButton>
      <span class="spacer"/>
      <span class="collect-hint">{{ query.collectRecordFlowId ? `共 ${countAll} 条结果` : "选择流程后按字段定义展开结果列" }}</span>
      <ReButton size="small" :disabled="!selected.length" @click="removeSelected">删除所选</ReButton>
      <ReButton size="small" type="danger" plain @click="clearFlowRecords">清空结果</ReButton>
    </div>

    <ReTable
      v-if="ready"
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
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无采集结果"
      @selection-change="pickSelection"
      stripe
    >
      <template #action="{ row }">
        <ReButton size="small" text type="primary" @click="showDetail(row)">详情</ReButton>
        <ReButton size="small" text type="danger" @click="removeOne(row)">删除</ReButton>
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
