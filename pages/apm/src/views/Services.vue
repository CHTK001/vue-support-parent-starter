<!--
  服务列表 —— 对齐 SkyWalking 的 Service 列表。

  列的口径与 SkyWalking UI 一致：用调用量 / 平均耗时 / P95 / P99 / 错误率。
  后端把这些值直接从 OAP 的 readMetricsValues 合并进 OtnlService，前端不再二次计算，
  只有「错误率」在后端缺失时按 calls 兜底。

  两个「有什么才显示什么」的列：
    · 实例数：SkyWalking 的 Service 实体不带实例计数（要按服务再查一次），
      所有值都是 0 时这一列没有信息量，直接不显示；
    · P95 / P99：没有开启 percentile 采集的部署会全部返回 -1，
      同理收起来 —— 一列全破折号的表格比少一列更让人困惑。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReInput v-model="keyword" placeholder="按服务名或分组过滤" clearable style="width: 240px" />
      <ReSelect v-model="layer" :options="layerOptions" placeholder="全部层" clearable style="width: 160px" />
      <el-checkbox v-model="errorOnly" label="仅看有错误的服务" />
      <span class="apm-bar__spacer" />
      <span class="apm-count">共 {{ items.length }} 个服务 · 匹配 {{ filtered.length }} 个</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <div class="apm-kpis">
      <ReStatCard
        size="compact"
        title="服务数"
        :value="items.length"
        desc="当前时间窗口内"
        :icon="Monitor"
        style="--accent: var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="总调用量"
        :value="fmtNum(totalCalls)"
        desc="服务入口调用合计"
        :icon="Histogram"
        style="--accent: var(--el-color-success)"
      />
      <ReStatCard
        size="compact"
        title="平均耗时"
        :value="fmtMs(avgLatency)"
        desc="按调用量加权"
        :icon="Timer"
        style="--accent: var(--el-color-warning)"
      />
      <ReStatCard
        size="compact"
        title="整体错误率"
        :value="errorRateText(overallErrorRate, totalCalls)"
        :desc="overallErrorRate < 0 ? '暂无调用' : '按调用量加权'"
        :icon="Warning"
        style="--accent: var(--el-color-danger)"
      />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />
    <ReTable
      v-else
      :data="filtered"
      :columns="columns"
      engine="element"
      :loading="loading"
      :settings="{ border: false }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      empty-text="没有符合条件的服务"
      :layout-table="{ maxHeight: 620 }"
      table-id="apm-services"
      class="apm-row-click"
      @row-click="onRowClick"
    >
      <template #empty="{ description }">
        <span class="apm-table-empty">{{ description }}</span>
      </template>
      <template #col-name="{ row }">
        <span class="apm-row__name">{{ row.name }}</span>
      </template>
      <template #col-layers="{ row }">
        <ReTag v-for="l in row.layers || []" :key="l" size="small" round style="margin-right: 4px">{{ l }}</ReTag>
        <span v-if="!(row.layers || []).length" class="apm-muted">—</span>
      </template>
      <template #col-calls="{ row }">
        <span class="apm-dist">
          <span class="apm-dist__track"><i :style="{ width: loadWidth(row.calls) }" /></span>
          <b>{{ fmtNum(row.calls) }}</b>
        </span>
      </template>
      <template #col-avgMs="{ row }">
        <span class="apm-mono" :class="latencyClass(row.avgMs)">{{ fmtMs(row.avgMs) }}</span>
      </template>
      <template #col-p95Ms="{ row }">
        <span class="apm-mono" :class="latencyClass(row.p95Ms)">{{ fmtMs(row.p95Ms) }}</span>
      </template>
      <template #col-p99Ms="{ row }">
        <span class="apm-mono" :class="latencyClass(row.p99Ms)">{{ fmtMs(row.p99Ms) }}</span>
      </template>
      <template #col-errorRate="{ row }">
        <span class="apm-mono" :class="Number(row.calls) > 0 ? errorRateClass(row.errorRate) : 'apm-muted'">{{ errorRateText(row.errorRate, row.calls) }}</span>
      </template>
    </ReTable>

    <div v-if="!status.capabilities.includes('services')" class="apm-absent">
      <h3 class="apm-absent__title">当前引擎不支持服务目录</h3>
      <p class="apm-absent__msg">引擎 {{ status.name }} 的能力清单里没有 services。</p>
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import { Histogram, Monitor, Timer, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { listServices } from "../api/apmApi";
import type { ApmService } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { consumeApmTabContext } from "../tabs";
import { errorRateClass, errorRateText, fmtMs, fmtNum, latencyClass } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const items = ref<ApmService[]>([]);
const loading = ref(false);
const keyword = ref("");
const layer = ref("");
const errorOnly = ref(false);

/** 层下拉：从已有数据里归纳，避免硬编码 SkyWalking 的 layer 枚举 */
const layerOptions = computed(() => {
  const set = new Set<string>();
  for (const item of items.value) {
    for (const l of item.layers ?? []) {
      set.add(l);
    }
  }
  return [{ label: "全部层", value: "" }, ...[...set].sort().map((l) => ({ label: l, value: l }))];
});

/** 前端过滤：keyword 命中服务名或分组，layer 命中层清单 */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return items.value
    .filter((s) => {
      if (kw && !`${s.name} ${s.group ?? ""}`.toLowerCase().includes(kw)) {
        return false;
      }
      if (layer.value && !(s.layers ?? []).includes(layer.value)) {
        return false;
      }
      if (errorOnly.value && !(s.errorRate > 0)) {
        return false;
      }
      return true;
    })
    .map((s) => s as unknown as Record<string, unknown>);
});

const totalCalls = computed(() => items.value.reduce((n, s) => n + Number(s.calls ?? 0), 0));

/**
 * 按调用量加权求平均。
 *
 * <p>几千次调用的服务与几十次的服务不能等权平均 —— 否则演示数据里一个冷门
 * 慢服务就能把整体耗时拉到看不见主链路。值为负数（未知）的样本直接跳过。</p>
 */
function weighted(pick: (s: ApmService) => number): number {
  let weight = 0;
  let sum = 0;
  for (const s of items.value) {
    const calls = Number(s.calls ?? 0);
    const value = pick(s);
    if (calls <= 0 || !Number.isFinite(value) || value < 0) {
      continue;
    }
    weight += calls;
    sum += calls * value;
  }
  return weight > 0 ? sum / weight : -1;
}

const avgLatency = computed(() => weighted((s) => Number(s.avgMs ?? -1)));
const overallErrorRate = computed(() => weighted((s) => Number(s.errorRate ?? -1)));

/* 列按「有没有数据」增减，不让整列破折号占着位置 */
const hasInstances = computed(() => items.value.some((s) => Number(s.instances ?? 0) > 0));const hasPercentile = computed(() => items.value.some((s) => Number(s.p95Ms ?? -1) >= 0 || Number(s.p99Ms ?? -1) >= 0));

const columns = computed<ReTableColumn[]>(() => {
  const list: ReTableColumn[] = [
    { prop: "name", label: "服务名", minWidth: 200, slot: "name", sortable: true },
    { prop: "layers", label: "层", width: 160, slot: "layers" },
  ];
  if (hasInstances.value) {
    list.push({ prop: "instances", label: "实例", width: 80, align: "right", sortable: true });
  }
  list.push(
    { prop: "calls", label: "调用量", minWidth: 200, slot: "calls", sortable: true },
    { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
  );
  if (hasPercentile.value) {
    list.push(
      { prop: "p95Ms", label: "P95", width: 100, align: "right", slot: "p95Ms", sortable: true },
      { prop: "p99Ms", label: "P99", width: 100, align: "right", slot: "p99Ms", sortable: true },
    );
  }
  list.push({ prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true });
  return list;
});

/** 调用量条：按当前列表最大值等比缩放，最少留 2% 以免看不见 */
function loadWidth(value: unknown): string {
  const max = Math.max(1, ...items.value.map((s) => Number(s.calls ?? 0)));
  return `${Math.max(2, Math.round((Math.max(0, Number(value ?? 0)) / max) * 100))}%`;
}

/** 行点击 → 服务详情 */
function onRowClick(row: Record<string, unknown>) {
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: String(row.name ?? "") } });
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    items.value = (await listServices({})) || [];
  } catch (e) {
    message.error(`加载服务列表失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 从总览点「慢服务」跳过来时带着服务名：直接落到该服务，不用再手选一次。
  // 上下文是一次性的（consume 后即清），刷新页面不会莫名其妙被旧筛选粘住。
  const context = consumeApmTabContext();
  if (context?.service) {
    keyword.value = context.service;
  }
  await load();
});
</script>

<style scoped>
/* 条形 + 数字：表格里也能一眼看出量级差 */
.apm-dist {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.apm-dist__track {
  flex: 1 1 auto;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.apm-dist__track i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  opacity: 0.5;
}

.apm-dist b {
  flex: none;
  width: 68px;
  text-align: right;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
</style>
