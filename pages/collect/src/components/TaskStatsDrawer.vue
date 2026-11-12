<!--
  执行统计抽屉：按流程 + 天数看成功率、耗时与每日趋势。

  数据来自 /task/stats（后端按 collect_task 聚合），页面不重算：成功率、均值、TopN 都是
  后端口径，前端另算一套会在两个入口给出不同结论。

  入口在运行记录页工具栏（不是采集器页）：统计的是「跑过的运行」，与运行记录同一批数据，
  放在运行记录页才符合「我看完列表想看看整体」的动线。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDrawer from "@repo/ui/re-drawer";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReCostText from "@repo/ui/re-cost-text";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchTaskStats, listFlows } from "../api/collectApi";
import { costMs } from "../constants/taskStatus";
import { errText } from "../composables/useCollectView";
import type { CollectNodeCost, CollectTaskStats } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  /** 初选流程；null 表示由抽屉内选择 */
  flowId?: number | null;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const DAYS: ReOption[] = [
  { label: "近 7 天", value: 7 },
  { label: "近 30 天", value: 30 },
  { label: "近 90 天", value: 90 },
];

const flows = ref<ReOption[]>([]);
const flowId = ref<number | null>(null);
const days = ref<number>(30);
const loading = ref(false);
const failed = ref(false);
const stats = ref<CollectTaskStats | null>(null);

/** 请求序号：改流程/改天数很快，只认最后一次响应 */
let seq = 0;

const flowOptions = computed<ReOption[]>(() => flows.value);

watch(
  () => props.modelValue,
  open => {
    if (!open) {
      return;
    }
    flowId.value = props.flowId ?? flowId.value;
    void boot();
  },
);

watch([flowId, days], () => {
  if (props.modelValue && flowId.value) {
    void load(flowId.value, days.value);
  }
});

/** 打开时先补流程清单，再落在初选流程（或第一条）上 */
async function boot(): Promise<void> {
  if (!flows.value.length) {
    try {
      const rows = (await listFlows()) ?? [];
      flows.value = rows.map(item => ({
        label: String(item.collectFlowName ?? item.collectFlowId),
        value: Number(item.collectFlowId),
      }));
    } catch (error) {
      msgError(errText(error));
    }
  }
  if (!flowId.value) {
    flowId.value = flows.value.length ? Number(flows.value[0].value) : null;
  }
  if (flowId.value) {
    await load(flowId.value, days.value);
  }
}

/**
 * 拉取统计。
 *
 * @param id   流程ID
 * @param span 统计天数
 */
async function load(id: number, span: number): Promise<void> {
  const mine = ++seq;
  loading.value = true;
  failed.value = false;
  try {
    const data = await fetchTaskStats(id, span);
    if (mine === seq) {
      stats.value = data;
    }
  } catch (error) {
    if (mine === seq) {
      stats.value = null;
      failed.value = true;
      msgError(errText(error));
    }
  } finally {
    if (mine === seq) {
      loading.value = false;
    }
  }
}

const nodeColumns = computed<ReTableColumn[]>(() => [
  { prop: "nodeName", label: "节点", minWidth: 150, showOverflowTooltip: true },
  { prop: "nodeShape", label: "类型", width: 96, align: "center" },
  { prop: "execCount", label: "执行次数", width: 96, align: "right" },
  { prop: "avgCostMs", label: "平均耗时", width: 108, slot: "avg", align: "right" },
  { prop: "totalCostMs", label: "总耗时", width: 108, slot: "total", align: "right" },
  { prop: "successRate", label: "成功率", width: 96, slot: "rate", align: "right" },
]);

/** 趋势柱高度/宽度按最大执行次数归一，全 0 时避免除零 */
const trendMax = computed(() => Math.max(1, ...(stats.value?.daily ?? []).map(item => item.runCount)));

const nodeRows = computed<CollectNodeCost[]>(() => stats.value?.nodeCosts ?? []);

function percent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(1)}%`;
}

function integer(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return Number(value).toLocaleString("zh-CN");
}

/** 柱宽：执行次数占比，最少 4% 让「有 1 次」也看得见 */
function barWidth(runCount: number): string {
  return `${Math.max(4, Math.round((runCount / trendMax.value) * 100))}%`;
}

/** 天数切换（ReSelect 的值为 number，兜底成 30） */
function pickDays(value: unknown): void {
  days.value = Number(value) || 30;
}

/** 流程切换（空值回落 null，由 watch 拦截） */
function pickFlow(value: unknown): void {
  flowId.value = value == null || value === "" ? null : Number(value);
}
</script>

<template>
  <ReDrawer
    :model-value="modelValue"
    title="执行统计"
    :size="780"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="stats-body">
      <div class="stats-controls">
        <ReSelect
          :model-value="flowId ?? ''"
          :options="flowOptions"
          placeholder="选择流程"
          filterable
          style="width: 240px"
          @update:model-value="pickFlow"
        />
        <ReSelect :model-value="days" :options="DAYS" style="width: 120px" @update:model-value="pickDays"/>
        <span class="stats-spacer"/>
        <ReButton
          icon="RefreshRight"
          layout="square"
          tip="重新统计"
          :disabled="!flowId || loading"
          @click="flowId && load(flowId, days)"
        />
      </div>

      <div v-if="!flows.length" class="stats-tip">还没有可统计的流程</div>
      <div v-else-if="loading" class="stats-tip">正在统计…</div>
      <div v-else-if="failed" class="stats-tip">
        <span>统计加载失败</span>
        <ReButton icon="RefreshRight" @click="flowId && load(flowId, days)">重试</ReButton>
      </div>

      <template v-else-if="stats">
        <div class="stats-cards">
          <div class="card">
            <span class="card-label">执行次数</span>
            <span class="card-value">{{ integer(stats.totalRuns) }}</span>
            <span class="card-extra">成功 {{ integer(stats.successCount) }} · 失败 {{ integer(stats.failureCount) }}</span>
          </div>
          <div class="card">
            <span class="card-label">成功率</span>
            <span class="card-value">{{ percent(stats.successRate) }}</span>
            <span class="card-extra">跳过 {{ integer(stats.skippedCount) }}</span>
          </div>
          <div class="card">
            <span class="card-label">采集记录</span>
            <span class="card-value">{{ integer(stats.totalRecords) }}</span>
            <span class="card-extra">平均 {{ stats.avgRecordsPerRun == null ? "—" : Number(stats.avgRecordsPerRun).toFixed(1) }} / 次</span>
          </div>
          <div class="card">
            <span class="card-label">平均耗时</span>
            <span class="card-value">
              <ReCostText v-if="stats.avgCostMs != null" :cost="costMs(Number(stats.avgCostMs))" />
              <span v-else>—</span>
            </span>
            <span class="card-extra">
              最长 <ReCostText v-if="stats.maxCostMs != null" :cost="costMs(stats.maxCostMs)" /><span v-else>—</span>
            </span>
          </div>
        </div>

        <div class="stats-section-title">每日趋势（{{ stats.days }} 天）</div>
        <div v-if="stats.daily.length" class="trend">
          <div v-for="item in stats.daily" :key="item.date" class="trend-row">
            <span class="trend-date">{{ item.date }}</span>
            <div class="trend-bar-wrap">
              <div class="trend-bar" :style="{ width: barWidth(item.runCount) }"/>
              <span class="trend-text">
                {{ item.runCount }} 次（成功 {{ item.successCount }} / 失败 {{ item.failureCount }}）· 记录 {{ integer(item.recordCount) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="stats-tip">该时间窗内没有运行记录</div>

        <div class="stats-section-title">节点耗时 TopN</div>
        <ReTable
          :data="nodeRows as unknown as Record<string, unknown>[]"
          :columns="nodeColumns"
          :pagination="false"
          :layout-table="{ maxHeight: 300 }"
          row-key="nodeId"
          empty-text="该时间窗内没有节点日志"
          stripe
        >
          <template #avg="{ row }">
            <ReCostText v-if="row.avgCostMs != null" :cost="costMs(Number(row.avgCostMs))" />
            <span v-else>—</span>
          </template>
          <template #total="{ row }">
            <ReCostText v-if="row.totalCostMs != null" :cost="costMs(row.totalCostMs)" />
            <span v-else>—</span>
          </template>
          <template #rate="{ row }">{{ percent(row.successRate) }}</template>
        </ReTable>
      </template>
    </div>
  </ReDrawer>
</template>

<style scoped>
.stats-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stats-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stats-spacer {
  flex: 1 1 auto;
}
.stats-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  min-width: 0;
}
.card-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.card-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.card-extra {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.stats-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.trend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.trend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.trend-date {
  width: 88px;
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
}
.trend-bar-wrap {
  flex: 1 1 auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.trend-bar {
  height: 14px;
  border-radius: 4px;
  background: var(--el-color-primary-light-5);
  flex: 0 0 auto;
}
.trend-text {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
