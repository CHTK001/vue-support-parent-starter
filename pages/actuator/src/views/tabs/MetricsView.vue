<!--
  指标（`/actuator/metrics`）

  左侧指标名、右侧明细：Micrometer 的指标清单可能上千条，全部铺成表格既慢又难找；
  「先选名字、再看数值」是唯一能在长列表里保持可用的结构。

  明细按「主读数 / 上限 / 使用率」分块：数值先立起来，使用率再用细条表达，
  全部统计量仍完整保留在下方（分块是加法，不是删减）。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`共 ${names.length} 项`"
    :loading="loading"
    :error="error"
    auto-refresh
    :updated-at="updatedAt"
    @refresh="reload"
  >
    <div class="act-metrics">
      <aside class="act-metrics__list">
        <ReInput
          v-model="metricKeyword"
          layout="modern"
          placeholder="过滤指标名"
          clearable
          class="act-metrics__filter"
        />
        <div class="act-metrics__scroll">
          <button
            v-for="name in filteredNames"
            :key="name"
            type="button"
            class="act-metrics__item"
            :class="{ 'is-active': name === metricName }"
            :title="name"
            @click="selectMetric(name)"
          >
            {{ name }}
          </button>
        </div>
        <ElEmpty v-if="!filteredNames.length" description="无可显示的指标" :image-size="40" />
      </aside>

      <section class="act-metrics__detail">
        <template v-if="detailLoading && !detail">
          <div class="act__empty">加载中…</div>
        </template>
        <template v-else-if="detail">
          <div class="act-metrics__title">
            {{ detail.name }}
            <span v-if="detail.baseUnit" class="act-metrics__unit">{{ detail.baseUnit }}</span>
          </div>
          <p v-if="detail.description" class="act-metrics__desc">{{ detail.description }}</p>

          <div v-if="measurements.length" class="act-metrics__readings">
            <div v-if="primary" class="act-metrics__reading">
              <span class="act-metrics__reading-label">{{ primary.statistic }}</span>
              <span class="act-metrics__reading-value">
                {{ formatValue(primary.value) }}<span v-if="unitSuffix" class="act-metrics__reading-unit">{{ unitSuffix }}</span>
              </span>
            </div>
            <div v-if="maxMeasurement" class="act-metrics__reading">
              <span class="act-metrics__reading-label">{{ maxMeasurement.statistic }}</span>
              <span class="act-metrics__reading-value">
                {{ formatValue(maxMeasurement.value) }}<span v-if="unitSuffix" class="act-metrics__reading-unit">{{ unitSuffix }}</span>
              </span>
            </div>
            <div v-if="usage !== null" class="act-metrics__reading">
              <span class="act-metrics__reading-label">使用率（VALUE / MAX）</span>
              <span class="act-metrics__reading-value">{{ usageText }}</span>
              <div class="act-metrics__bar" :class="usageTone">
                <span :style="{ width: `${usage}%` }" />
              </div>
            </div>
          </div>
          <div v-else class="act__empty">该指标没有返回统计量</div>

          <template v-if="measurements.length">
            <div class="act-group__title">全部统计量</div>
            <div class="act-kv">
              <div v-for="m in measurements" :key="m.statistic" class="act-kv__row">
                <span class="act-kv__k">{{ m.statistic }}</span>
                <span class="act-kv__v">{{ m.value }}</span>
              </div>
            </div>
          </template>

          <div v-if="tagOptions.length" class="act-metrics__tags">
            <div class="act-group__title">按标签细分</div>
            <div class="act-metrics__tag-row">
              <label v-for="tag in tagOptions" :key="tag.tag" class="act-metrics__tag" :title="(tag.values ?? []).join('、')">
                <span class="act-metrics__tag-key">{{ tag.tag }}</span>
                <ElSelect
                  :model-value="tagSelection[tag.tag] ?? ''"
                  size="small"
                  clearable
                  placeholder="全部"
                  class="act-metrics__tag-select"
                  @change="(v: unknown) => setTagValue(tag.tag, String(v ?? ''))"
                  @clear="setTagValue(tag.tag, '')"
                >
                  <ElOption v-for="v in tag.values ?? []" :key="v" :label="v" :value="v" />
                </ElSelect>
              </label>
            </div>
          </div>
        </template>
        <ElEmpty v-else description="选择左侧指标查看明细" :image-size="48" />
      </section>
    </div>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorMetricsView">
/**
 * 指标页签。
 *
 * <p>明细需要第二跳（{@code /actuator/metrics/{name}}），因此有两份状态：清单的
 * loading/error 走面板 composable，明细的走本地 state。指标名列表变化时（首次加载、
 * 手动刷新、切回页签的静默刷新）自动重取当前指标的明细，避免右栏停留在旧数值。</p>
 */
import { computed, ref, watch } from "vue";
import { ElEmpty, ElMessage, ElOption, ElSelect } from "element-plus";
import ReInput from "@repo/ui/re-input";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { humanBytes } from "../../cards/useMetricRows";
import { getActuatorEndpoint } from "../../api/actuatorApi";

interface MetricMeasurement {
  statistic: string;
  value: number;
}

interface MetricTag {
  tag: string;
  values?: string[];
}

interface MetricDetail {
  name: string;
  description?: string;
  baseUnit?: string;
  measurements?: MetricMeasurement[];
  availableTags?: MetricTag[];
}

const { data, loading, error, updatedAt, reload } = useActuatorPanel("metrics");

/** 指标名清单（来自 /actuator/metrics 的 names） */
const names = computed<string[]>(() => {
  const list = (data.value as { names?: unknown } | null)?.names;
  return Array.isArray(list) ? list.filter((n): n is string => typeof n === "string") : [];
});

/** 左栏过滤词（与面板关键字无关：右栏明细不参与过滤） */
const metricKeyword = ref("");
const filteredNames = computed<string[]>(() => {
  const kw = metricKeyword.value.trim().toLowerCase();
  return kw ? names.value.filter((name) => name.toLowerCase().includes(kw)) : names.value;
});

const metricName = ref("");
const detail = ref<MetricDetail | null>(null);
const detailLoading = ref(false);

/** 请求序号：连点指标名时只认最后一次响应 */
let ticker = 0;

/* ---------- 标签维度细分（?tag=key:value） ---------- */

/** 标签选择器选项：取自本指标未过滤时的 availableTags（不随过滤结果收缩） */
const tagOptions = ref<MetricTag[]>([]);

/** 已选标签值：tag → value；空串 = 不限（全部） */
const tagSelection = ref<Record<string, string>>({});

/** 已选标签拼成查询串：`?tag=area:heap&tag=…`；全不选时为空串 */
function tagQuery(): string {
  const parts: string[] = [];
  Object.entries(tagSelection.value).forEach(([key, value]) => {
    if (value) parts.push(`tag=${encodeURIComponent(key)}:${encodeURIComponent(value)}`);
  });
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * 取指标明细（自动带上当前已选标签）。
 *
 * @param name   指标名
 * @param silent 静默刷新：保留当前明细，不显示加载态（清单刷新 / 选标签时用）
 */
async function fetchDetail(name: string, silent: boolean): Promise<void> {
  const tag = ++ticker;
  if (!silent) {
    detail.value = null;
  }
  detailLoading.value = true;
  try {
    const query = tagQuery();
    const res = await getActuatorEndpoint(`metrics/${name}${query}`);
    if (tag !== ticker) return;
    detail.value = (res as MetricDetail) ?? null;
    // 只有未过滤的响应才携带完整 availableTags：选择器选项不随过滤收缩
    if (!query) {
      tagOptions.value = detail.value?.availableTags ?? [];
    }
  } catch (err) {
    if (tag !== ticker) return;
    ElMessage.error((err as Error)?.message ?? "加载指标明细失败");
  } finally {
    if (tag === ticker) detailLoading.value = false;
  }
}

/**
 * 选中指标：换指标时清空已选标签，再取明细。
 *
 * @param name   指标名
 * @param silent 静默刷新：保留当前明细与已选标签（清单刷新时用）
 */
function selectMetric(name: string, silent = false): void {
  if (name !== metricName.value) {
    metricName.value = name;
    tagSelection.value = {};
  }
  void fetchDetail(name, silent);
}

/** 选定一个标签值（value 为空串 = 不限），明细按 `?tag=key:value` 重取 */
function setTagValue(key: string, value: string): void {
  const next = value ?? "";
  if ((tagSelection.value[key] ?? "") === next) return;
  tagSelection.value = { ...tagSelection.value, [key]: next };
  if (metricName.value) void fetchDetail(metricName.value, true);
}

/**
 * 清单变化 → 重取当前指标明细。
 *
 * <p>首次加载时选中第一条，避免右栏一直空着；已选中且仍在清单里就原地刷新。</p>
 */
watch(
  names,
  (list) => {
    if (!list.length) {
      metricName.value = "";
      detail.value = null;
      return;
    }
    const target = list.includes(metricName.value) ? metricName.value : list[0];
    void selectMetric(target, !!detail.value);
  },
  { immediate: true },
);

/* ---------- 读数分块 ---------- */

const measurements = computed<MetricMeasurement[]>(() => detail.value?.measurements ?? []);

/** 主读数：VALUE 优先，其次 COUNT / TOTAL_TIME，都没有就取第一条 */
const primary = computed<MetricMeasurement | undefined>(() => {
  const list = measurements.value;
  if (!list.length) return undefined;
  return (
    list.find((m) => m.statistic.toUpperCase() === "VALUE") ??
    list.find((m) => ["COUNT", "TOTAL_TIME"].includes(m.statistic.toUpperCase())) ??
    list[0]
  );
});

/** 上限：只有 MAX 统计量（gauge 类指标带容量上限）才有 */
const maxMeasurement = computed<MetricMeasurement | undefined>(() =>
  measurements.value.find((m) => m.statistic.toUpperCase() === "MAX"),
);

/**
 * 使用率。
 *
 * <p>只在「VALUE 与 MAX 同时存在」时计算：timer 的 MAX 是单次最大耗时，
 * 拿 COUNT / MAX 算比例没有语义，宁可不显示也不编一个数字出来。</p>
 */
const usage = computed<number | null>(() => {
  const value = measurements.value.find((m) => m.statistic.toUpperCase() === "VALUE")?.value;
  const max = maxMeasurement.value?.value;
  if (value === undefined || max === undefined) return null;
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return null;
  return Math.max(0, Math.min(100, (value / max) * 100));
});

const usageText = computed(() => (usage.value === null ? "" : `${usage.value.toFixed(usage.value >= 10 ? 0 : 1)}%`));

/** 使用率配色：≥90% 危险、≥70% 警告，其余用品牌色 */
const usageTone = computed(() => {
  if (usage.value === null) return "";
  if (usage.value >= 90) return "is-danger";
  if (usage.value >= 70) return "is-warn";
  return "";
});

/** 字节单位的大数按人类可读折算，其余按千分位 */
function formatValue(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (detail.value?.baseUnit === "bytes" && Math.abs(value) >= 1024) return humanBytes(value);
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
}

/** 读数右上角的单位：bytes 已由 humanBytes 带出，不再重复标注 */
const unitSuffix = computed(() => {
  const unit = detail.value?.baseUnit ?? "";
  if (!unit || unit === "bytes") return "";
  return unit;
});
</script>
