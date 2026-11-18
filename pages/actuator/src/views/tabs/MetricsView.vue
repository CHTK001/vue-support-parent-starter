<!--
  指标（`/actuator/metrics`）

  左侧指标名、右侧明细：Micrometer 的指标清单可能上千条，全部铺成表格既慢又难找；
  「先选名字、再看数值」是唯一能在长列表里保持可用的结构。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`共 ${names.length} 项`"
    :loading="loading"
    :error="error"
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
          <div class="act-kv">
            <div v-for="m in detail.measurements ?? []" :key="m.statistic" class="act-kv__row">
              <span class="act-kv__k">{{ m.statistic }}</span>
              <span class="act-kv__v">{{ m.value }}</span>
            </div>
          </div>
          <div v-if="detail.availableTags?.length" class="act-metrics__tags">
            <div class="act-group__title">可用标签</div>
            <div class="act-kv">
              <div v-for="tag in detail.availableTags" :key="tag.tag" class="act-kv__row">
                <span class="act-kv__k">{{ tag.tag }}</span>
                <span class="act-kv__v">{{ (tag.values ?? []).join("、") || "—" }}</span>
              </div>
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
import { ElEmpty, ElMessage } from "element-plus";
import ReInput from "@repo/ui/re-input";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";
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

const { data, loading, error, reload } = useActuatorPanel("metrics");

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

/**
 * 取单个指标的明细。
 *
 * @param name   指标名
 * @param silent 静默刷新：保留当前明细，不显示加载态（清单刷新时用）
 */
async function selectMetric(name: string, silent = false): Promise<void> {
  const tag = ++ticker;
  metricName.value = name;
  if (silent) {
    detailLoading.value = true;
  } else {
    detailLoading.value = true;
    detail.value = null;
  }
  try {
    const res = await getActuatorEndpoint(`metrics/${name}`);
    if (tag !== ticker) return;
    detail.value = (res as MetricDetail) ?? null;
  } catch (err) {
    if (tag !== ticker) return;
    ElMessage.error((err as Error)?.message ?? "加载指标明细失败");
  } finally {
    if (tag === ticker) detailLoading.value = false;
  }
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
</script>
