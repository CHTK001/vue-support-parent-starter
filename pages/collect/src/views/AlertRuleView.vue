<!--
  采集告警规则：按采集器配置失败次数、零产出、数据量下降等告警条件。
  规则本身只做配置与启停，触发判断由后端执行服务在任务结束时统一评估。
-->
<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import { msgError, msgInfo, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReOption } from "@repo/ui/re-select";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import {
  deleteAlertRule,
  listFlows,
  pageAlertRules,
  saveAlertRule,
  toggleAlertRule,
} from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { CollectAlertRule, CollectFlow, CollectPage } from "../types/collect";

defineOptions({ name: "CollectAlertRule" });

const ALERT_TYPES: ReOption[] = [
  { label: "连续失败次数", value: "FAILURE_COUNT" },
  { label: "单次产出为 0", value: "ZERO_OUTPUT" },
  { label: "数据量骤降", value: "RECORDS_DROP" },
  { label: "节点超时", value: "NODE_TIMEOUT" },
  { label: "错误率过高", value: "ERROR_RATE" },
];

const TIMINGS: ReOption[] = [
  { label: "每次触发", value: "ALWAYS" },
  { label: "只告警一次", value: "ONCE" },
];

const rows = ref<CollectAlertRule[]>([]);
const flows = ref<CollectFlow[]>([]);
const query = ref({ page: 1, pageSize: 20 });
const tableRef = ref<{ reload: () => void } | null>(null);
const visible = ref(false);
const saving = ref(false);
const form = reactive<CollectAlertRule>({
  collectAlertRuleId: null,
  collectFlowId: null,
  collectAlertRuleName: "",
  alertType: "FAILURE_COUNT",
  threshold: 3,
  alertTiming: "ALWAYS",
  alertEnabled: 1,
}) as CollectAlertRule & { alertEnabled: number };

const flowOptions = computed<ReOption[]>(() => [
  { label: "全局规则（所有采集器）", value: "" },
  ...flows.value.map(f => ({ label: String(f.collectFlowName ?? f.collectFlowId), value: String(f.collectFlowId) })),
]);

const typeLabels = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const item of ALERT_TYPES) map[item.value] = item.label;
  return map;
});

const { reload: reloadFlows } = useCollectView(async () => {
  flows.value = (await listFlows()) ?? [];
});

let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reloadFlows();
  tableRef.value?.reload();
});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectAlertRuleName", label: "规则名称", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectFlowId", label: "适用范围", width: 150, slot: "flow" },
  { prop: "alertType", label: "条件类型", width: 130, slot: "type", align: "center" },
  { prop: "threshold", label: "阈值", width: 90, slot: "threshold", align: "right" },
  { prop: "alertTiming", label: "告警时机", width: 110, slot: "timing", align: "center" },
  { prop: "alertEnabled", label: "启用", width: 76, slot: "enabled", align: "center" },
  { prop: "lastAlertTime", label: "最近触发", width: 176 },
  { prop: "lastAlertResult", label: "最近结果", minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 132, slot: "action", fixed: "right" },
]);

async function loadRules({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  const result: CollectPage<CollectAlertRule> = await pageAlertRules({
    page,
    pageSize,
  });
  rows.value = result.rows;
  return { total: result.total, data: result.rows as unknown as Record<string, unknown>[] };
}

function openCreate(): void {
  Object.assign(form, {
    collectAlertRuleId: null,
    collectFlowId: null,
    collectAlertRuleName: "",
    alertType: "FAILURE_COUNT",
    threshold: 3,
    alertTiming: "ALWAYS",
    alertEnabled: 1,
  });
  visible.value = true;
}

function openEdit(input: Record<string, unknown>): void {
  const rule = input as unknown as CollectAlertRule;
  Object.assign(form, {
    collectAlertRuleId: rule.collectAlertRuleId ?? null,
    collectFlowId: rule.collectFlowId ?? null,
    collectAlertRuleName: rule.collectAlertRuleName ?? "",
    alertType: rule.alertType ?? "FAILURE_COUNT",
    threshold: rule.threshold ?? 0,
    alertTiming: rule.alertTiming ?? "ALWAYS",
    alertEnabled: rule.alertEnabled ?? 1,
  });
  visible.value = true;
}

async function submit(): Promise<void> {
  if (!form.collectAlertRuleName.trim()) {
    msgInfo("请填写规则名称");
    return;
  }
  saving.value = true;
  try {
    await saveAlertRule({ ...form });
    msgSuccess("规则已保存");
    visible.value = false;
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function removeRule(input: Record<string, unknown>): Promise<void> {
  const rule = input as unknown as CollectAlertRule;
  if (!(await confirmAction(`确认删除规则「${rule.collectAlertRuleName}」？`, "删除规则"))) return;
  try {
    await deleteAlertRule(rule.collectAlertRuleId!);
    msgSuccess("规则已删除");
    tableRef.value?.reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function changeEnabled(rule: CollectAlertRule, enabled: boolean): Promise<void> {
  try {
    await toggleAlertRule(rule.collectAlertRuleId!, enabled);
    rule.alertEnabled = enabled ? 1 : 0;
    msgSuccess(enabled ? "规则已启用" : "规则已停用");
  } catch (error) {
    msgError(errText(error));
  }
}

const flowName = (id: number | null | undefined): string =>
  id == null ? "全局规则" : flows.value.find(f => f.collectFlowId === id)?.collectFlowName ?? String(id);
</script>

<template>
  <div class="collect-page">
    <ReTable
      ref="tableRef"
      class="collect-card"
      table-id="collect-alert-rule"
      :loader="loadRules"
      :params="query"
      :columns="columns"
      row-key="collectAlertRuleId"
      :page-sizes="[10, 20, 50, 100]"
      empty-text="暂无告警规则，点击右上角新增"
      stripe
    >
      <template #toolbar>
        <ReButton icon="Plus" type="primary" @click="openCreate">新增规则</ReButton>
      </template>
      <template #flow="{ row }">
        <ReTag effect="plain" :type="row.collectFlowId ? 'primary' : 'info'">{{ flowName(row.collectFlowId) }}</ReTag>
      </template>
      <template #type="{ row }">
        {{ typeLabels[row.alertType] ?? row.alertType }}
      </template>
      <template #threshold="{ row }">
        <span class="collect-cell-mono">{{ row.threshold ?? "—" }}</span>
      </template>
      <template #timing="{ row }">
        {{ row.alertTiming === "ONCE" ? "只告警一次" : "每次触发" }}
      </template>
      <template #enabled="{ row }">
        <ReSwitch :model-value="row.alertEnabled === 1" @change="(value: boolean) => changeEnabled(row, value)" />
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="Edit" tip="编辑规则" @click="openEdit(row)" />
        <ReButton layout="square" icon="Delete" type="danger" tip="删除规则" @click="removeRule(row)" />
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="form.collectAlertRuleId ? '编辑告警规则' : '新增告警规则'"
      width="520px"
      top="8vh"
      :loading="saving"
    >
      <div class="form-wrap">
        <label class="field">
          <span class="field-label">规则名称</span>
          <ReInput v-model="form.collectAlertRuleName" placeholder="例如：古诗采集连续失败提醒" />
        </label>
        <label class="field">
          <span class="field-label">适用范围</span>
          <ReSelect v-model="form.collectFlowId" :options="flowOptions" placeholder="全局规则" />
        </label>
        <label class="field">
          <span class="field-label">条件类型</span>
          <ReSelect v-model="form.alertType" :options="ALERT_TYPES" />
        </label>
        <label class="field">
          <span class="field-label">阈值</span>
          <ReInput v-model="form.threshold" type="number" placeholder="按条件类型填写阈值" />
        </label>
        <label class="field">
          <span class="field-label">告警时机</span>
          <ReSelect v-model="form.alertTiming" :options="TIMINGS" />
        </label>
        <label class="field">
          <span class="field-label">启用</span>
          <ReSwitch v-model="form.alertEnabled" :active-value="1" :inactive-value="0" />
        </label>
      </div>
      <template #footer>
        <ReButton @click="visible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submit">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.form-wrap { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; color: var(--el-text-color-secondary); }
</style>
