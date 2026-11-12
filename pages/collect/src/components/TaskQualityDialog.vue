<!--
  任务质量报告：一次运行的节点成败、请求成功率、入库率与最慢节点。

  数据来自 /task/quality（后端从节点日志聚合），本组件只做展示与排序，不重算指标：
  评分、等级、入库率都是后端口径，前端另算一套会在两个入口给出不同结论。

  入口在运行记录的行操作「质量」（COLLECT_ACTIONS.taskQuality），只对已结束的任务有意义；
  运行中的任务节点还没跑完，质量报告会缺数，所以按钮在 RUNNING 行上禁用。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import ReButton from "@repo/ui/re-button";
import ReCostText from "@repo/ui/re-cost-text";
import { fetchTaskQuality } from "../api/collectApi";
import { costMs } from "../constants/taskStatus";
import { errText } from "../composables/useCollectView";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { CollectQualityNode, CollectTask, CollectTaskQuality } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  /** 要看的运行；null 时弹窗保持空态 */
  task: CollectTask | null;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const loading = ref(false);
const quality = ref<CollectTaskQuality | null>(null);
const failed = ref(false);

/** 请求序号：连续切换任务时只认最后一次，避免旧响应盖住新任务 */
let seq = 0;

watch(
  () => [props.modelValue, props.task?.collectTaskId] as const,
  ([open]) => {
    if (!open || !props.task) {
      return;
    }
    void load(props.task.collectTaskId);
  },
);

/**
 * 拉取质量报告。
 *
 * @param taskId 运行ID
 */
async function load(taskId: number): Promise<void> {
  const mine = ++seq;
  loading.value = true;
  failed.value = false;
  quality.value = null;
  try {
    const data = await fetchTaskQuality(taskId);
    if (mine === seq) {
      quality.value = data;
    }
  } catch (error) {
    if (mine === seq) {
      failed.value = true;
      msgError(errText(error));
    }
  } finally {
    if (mine === seq) {
      loading.value = false;
    }
  }
}

/** 失败节点优先、其次按总耗时：排查先看哪条分支最贵 */
const sortedNodes = computed<CollectQualityNode[]>(() => {
  const rows = [...(quality.value?.nodes ?? [])];
  return rows.sort((a, b) => b.failedCount - a.failedCount || (b.totalCostMs ?? 0) - (a.totalCostMs ?? 0));
});

const nodeColumns = computed<ReTableColumn[]>(() => [
  { prop: "nodeName", label: "节点", minWidth: 150, showOverflowTooltip: true },
  { prop: "nodeShape", label: "类型", width: 96, align: "center" },
  { prop: "runs", label: "执行/成功/失败/跳过", width: 176, slot: "runs", align: "center" },
  { prop: "avgCostMs", label: "平均耗时", width: 108, slot: "avg", align: "right" },
  { prop: "recordCount", label: "产出", width: 84, align: "right" },
  { prop: "successRate", label: "成功率", width: 96, slot: "rate", align: "right" },
]);

/** 等级 → ReTag 语义色；未知等级按 info 兜底，不吞掉后端新增值 */
function levelTag(level: string | null | undefined): "success" | "primary" | "warning" | "danger" | "info" {
  switch (String(level ?? "").toUpperCase()) {
    case "EXCELLENT":
      return "success";
    case "GOOD":
      return "primary";
    case "FAIR":
      return "warning";
    case "POOR":
      return "danger";
    default:
      return "info";
  }
}

/** 百分比展示：后端 BigDecimal 可能为 null，统一显示「—」 */
function percent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(1)}%`;
}

/** 整数千分位，记录数可能上万 */
function integer(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return Number(value).toLocaleString("zh-CN");
}

/** 重试当前任务 */
function retry(): void {
  if (props.task) {
    void load(props.task.collectTaskId);
  }
}
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    :title="`任务质量 · ${task?.collectTaskNo || ''}`"
    width="900px"
    top="6vh"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="quality-body">
      <div v-if="loading" class="quality-tip">正在聚合节点日志…</div>

      <div v-else-if="failed" class="quality-tip">
        <span>质量报告加载失败</span>
        <ReButton icon="RefreshRight" @click="retry">重试</ReButton>
      </div>

      <div v-else-if="!quality" class="quality-tip">暂无数据</div>

      <template v-else>
        <div class="quality-head">
          <div class="quality-score">
            <span class="quality-score-num">{{ quality.qualityScore }}</span>
            <span class="quality-score-unit">分</span>
            <ReTag :type="levelTag(quality.qualityLevel)" effect="plain">{{ quality.qualityLevel || "—" }}</ReTag>
          </div>
          <div class="quality-metrics">
            <div class="metric">
              <span class="metric-label">节点成功率</span>
              <span class="metric-value">{{ percent(quality.nodeSuccessRate) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">入库率</span>
              <span class="metric-value">{{ percent(quality.insertRate) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">请求成功/失败</span>
              <span class="metric-value">{{ integer(quality.requestSuccess) }} / {{ integer(quality.requestFailed) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">记录 总数/新增/重复</span>
              <span class="metric-value">
                {{ integer(quality.recordCount) }} / {{ integer(quality.newRecords) }} / {{ integer(quality.duplicateRecords) }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">节点 成功/失败/跳过</span>
              <span class="metric-value">
                {{ integer(quality.successNodes) }} / {{ integer(quality.failedNodes) }} / {{ integer(quality.skippedNodes) }}
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">最慢节点</span>
              <span class="metric-value">
                {{ quality.slowestNode || "—" }}
                <ReCostText v-if="quality.slowestNodeCostMs != null" :cost="costMs(quality.slowestNodeCostMs)" />
              </span>
            </div>
          </div>
        </div>

        <div v-if="quality.errorSummary" class="quality-error">错误摘要：{{ quality.errorSummary }}</div>

        <ReTable
          :data="sortedNodes as unknown as Record<string, unknown>[]"
          :columns="nodeColumns"
          :pagination="false"
          :layout-table="{ maxHeight: 360 }"
          row-key="nodeId"
          empty-text="没有节点日志，无法按节点统计"
          stripe
        >
          <template #runs="{ row }">
            {{ row.execCount }} / {{ row.successCount }} / {{ row.failedCount }} / {{ row.skippedCount }}
          </template>
          <template #avg="{ row }">
            <ReCostText v-if="row.avgCostMs != null" :cost="costMs(row.avgCostMs)" />
            <span v-else>—</span>
          </template>
          <template #rate="{ row }">{{ percent(row.successRate) }}</template>
        </ReTable>
      </template>
    </div>
  </ReDialog>
</template>

<style scoped>
.quality-body {
  min-height: 220px;
}
.quality-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  justify-content: center;
  color: var(--el-text-color-secondary);
}
.quality-head {
  display: flex;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 14px;
}
.quality-score {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 12px 18px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  flex: 0 0 auto;
}
.quality-score-num {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}
.quality-score-unit {
  color: var(--el-text-color-secondary);
  margin-right: 6px;
}
.quality-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  flex: 1 1 auto;
  align-content: center;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 14px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.quality-error {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 13px;
  word-break: break-all;
}
</style>
