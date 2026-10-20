<!--
  流程版本管理：按采集器查看 DSL 历史快照，支持对比和回滚。
  回滚会先恢复目标版本的 DSL，再自动生成一条新的快照，保证可追溯。
-->
<script setup lang="ts">
import { computed, onActivated, ref } from "vue";
import { getRouter, msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import {
  diffFlowVersions,
  getFlow,
  listFlowVersions,
  listFlows,
  rollbackFlowVersion,
  saveFlowVersion,
} from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { CollectFlow, CollectFlowVersion } from "../types/collect";

defineOptions({ name: "CollectFlowVersion" });

const rows = ref<CollectFlowVersion[]>([]);
const flows = ref<CollectFlow[]>([]);
const loading = ref(false);
const visible = ref(false);
const saving = ref(false);
const remark = ref("");
const selectedVersion = ref<CollectFlowVersion | null>(null);
const compareVisible = ref(false);
const compareV1 = ref<number | null>(null);
const compareV2 = ref<number | null>(null);
const compareResult = ref<{ v1: number; dsl1: string; v2: number; dsl2: string } | null>(null);
const comparing = ref(false);

/** 从路由 query 读取当前流程，支持外部深链 */
const flowId = ref<number>(Number(getRouter().currentRoute.value.query?.flowId ?? 0) || 0);

const flowOptions = computed<ReOption[]>(() =>
  flows.value.map(f => ({ label: String(f.collectFlowName ?? f.collectFlowId), value: String(f.collectFlowId) })),
);

const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
  if (!flowId.value && flows.value.length) {
    flowId.value = flows.value[0].collectFlowId;
    void load();
  }
});

let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    void reloadFlows();
    if (flowId.value) void load();
    return;
  }
  void reloadFlows();
  void load();
});

async function load(): Promise<void> {
  if (!flowId.value) return;
  loading.value = true;
  try {
    rows.value = (await listFlowVersions(flowId.value)) ?? [];
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

function changeFlow(): void {
  void load();
}

async function saveSnapshot(): Promise<void> {
  if (!flowId.value) return;
  saving.value = true;
  try {
    const flow = await getFlow(flowId.value);
    if (!flow.dsl) {
      msgError("当前流程还没有保存 DSL，无法创建快照");
      return;
    }
    await saveFlowVersion(flowId.value, JSON.stringify(flow.dsl), remark.value || `手动快照`);
    msgSuccess("版本快照已保存");
    remark.value = "";
    void load();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

function openVersion(input: Record<string, unknown>): void {
  selectedVersion.value = input as unknown as CollectFlowVersion;
  visible.value = true;
}

async function doRollback(input: Record<string, unknown>): Promise<void> {
  const version = input as unknown as CollectFlowVersion;
  if (!(await confirmAction(`确认回滚到 v${version.versionNo}？回滚后会自动生成一条新版本记录。`, "回滚流程"))) {
    return;
  }
  try {
    await rollbackFlowVersion(flowId.value, version.versionNo);
    msgSuccess(`已回滚到 v${version.versionNo}`);
    void load();
  } catch (error) {
    msgError(errText(error));
  }
}

const versionColumns = computed<ReTableColumn[]>(() => [
  { prop: "versionNo", label: "版本", width: 80, slot: "version", align: "center" },
  { prop: "versionRemark", label: "说明", minWidth: 180, showOverflowTooltip: true },
  { prop: "createName", label: "创建人", width: 120 },
  { prop: "createTime", label: "创建时间", width: 176 },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right" },
]);

async function compare(): Promise<void> {
  if (!compareV1.value || !compareV2.value || compareV1.value === compareV2.value) {
    msgError("请选择两个不同的版本");
    return;
  }
  comparing.value = true;
  compareResult.value = null;
  try {
    compareResult.value = await diffFlowVersions(flowId.value, compareV1.value, compareV2.value);
  } catch (error) {
    msgError(errText(error));
  } finally {
    comparing.value = false;
  }
}

const versionOptions = computed(() =>
  rows.value.map(v => ({ label: `v${v.versionNo} · ${v.versionRemark || "未填写说明"}`, value: String(v.versionNo) })),
);
</script>

<template>
  <div class="collect-page">
    <div class="version-header collect-card">
      <label class="flow-picker">
        <span>采集器</span>
        <ReSelect v-model="flowId" :options="flowOptions" style="width: 260px" @change="changeFlow" />
      </label>
      <div class="header-actions">
        <ReInput v-model="remark" placeholder="版本说明（可选）" style="width: 220px" />
        <ReButton icon="Plus" type="primary" @click="saveSnapshot">保存快照</ReButton>
        <ReButton icon="Switch" @click="compareVisible = true">对比版本</ReButton>
        <ReButton icon="Refresh" @click="load">刷新</ReButton>
      </div>
    </div>

    <ReTable
      class="collect-card"
      table-id="collect-flow-version"
      :loading="loading"
      :data="rows"
      :columns="versionColumns"
      :pagination="false"
      row-key="collectFlowVersionId"
      empty-text="该采集器暂无版本历史"
      stripe
    >
      <template #version="{ row }">
        <ReTag effect="plain" type="primary">v{{ row.versionNo }}</ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="View" tip="查看版本 DSL" @click="openVersion(row)" />
        <ReButton layout="square" icon="RefreshLeft" type="warning" tip="回滚到该版本" @click="doRollback(row)" />
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="`v${selectedVersion?.versionNo ?? ''} DSL 快照`"
      width="760px"
      top="6vh"
      footer-hidden
    >
      <pre class="dsl-preview">{{ selectedVersion?.flowDsl || "该版本未保存 DSL" }}</pre>
    </ReDialog>

    <ReDialog
      v-model="compareVisible"
      title="版本对比"
      width="720px"
      top="8vh"
    >
      <div class="compare-fields">
        <label class="field">
          <span class="field-label">版本 A</span>
          <ReSelect v-model="compareV1" :options="versionOptions" placeholder="选择版本 A" />
        </label>
        <label class="field">
          <span class="field-label">版本 B</span>
          <ReSelect v-model="compareV2" :options="versionOptions" placeholder="选择版本 B" />
        </label>
        <ReButton type="primary" :loading="comparing" @click="compare">对比</ReButton>
      </div>
      <div v-if="compareResult" class="compare-result">
        <div class="compare-meta">
          <span>v{{ compareResult.v1 }}：{{ compareResult.dsl1.length }} 字符</span>
          <span>v{{ compareResult.v2 }}：{{ compareResult.dsl2.length }} 字符</span>
          <span>长度差：{{ compareResult.dsl2.length - compareResult.dsl1.length }}</span>
        </div>
        <pre class="dsl-preview">{{ compareResult.dsl1 === compareResult.dsl2 ? "两个版本 DSL 内容一致" : "两个版本 DSL 内容不同，详细差异见版本详情。" }}</pre>
      </div>
      <template #footer>
        <ReButton @click="compareVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.flow-picker { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--el-text-color-secondary); }
.header-actions { display: flex; align-items: center; gap: 8px; }
.dsl-preview {
  max-height: 420px;
  overflow: auto;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  font-family: var(--el-font-family-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.compare-fields { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.field-label { font-size: 13px; color: var(--el-text-color-secondary); }
.compare-result { display: flex; flex-direction: column; gap: 10px; }
.compare-meta { display: flex; gap: 16px; font-size: 13px; color: var(--el-text-color-secondary); }
@media (max-width: 720px) {
  .version-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; align-items: stretch; }
}
</style>
