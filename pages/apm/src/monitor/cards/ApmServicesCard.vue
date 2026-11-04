<template>
  <ApmCardBody capability="services">
    <div class="ac-card">
      <div class="ac-head">
        <span class="ac-chip">服务 {{ total }}</span>
        <span class="ac-muted">按调用量排序</span>
      </div>

      <div v-if="error" class="ac-note ac-danger">{{ error }}</div>

      <div class="ac-list">
        <div v-for="s in rows" :key="s.id" class="ac-row">
          <div class="ac-row__main">
            <span class="ac-row__name" :title="s.name">{{ s.name }}</span>
            <span class="ac-row__meta">
              调用 {{ fmtNum(s.calls) }} · 均值 {{ fmtMs(s.avgMs) }} · P99 {{ fmtMs(s.p99Ms) }}
            </span>
            <span class="ac-row__bar">
              <i class="ac-row__fill" :style="{ width: barPct(s.calls) + '%' }" />
            </span>
          </div>
          <span class="ac-row__value" :class="errorRateClass(s.errorRate)">{{ fmtPercent(s.errorRate) }}</span>
        </div>

        <div v-if="!rows.length && !loading" class="ac-empty">最近 {{ WINDOW_MINUTES }} 分钟没有服务数据</div>
        <div v-else-if="!rows.length" class="ac-empty">读取服务目录…</div>
      </div>

      <p class="ac-foot">/api/apm/v1/services · 最近 {{ WINDOW_MINUTES }} 分钟 · 更新于 {{ clock }}</p>
    </div>
  </ApmCardBody>
</template>

<script setup lang="ts" name="ApmServicesCard">
/**
 * APM 服务目录卡片
 *
 * <p>按调用量列出服务，右侧给错误率 —— 监控大屏上最先要回答的问题是
 * 「哪个服务在扛流量、哪个在报错」，所以不铺端点/实例，只保留这两列主信息。
 * 调用量用相对占比条表示：绝对数值在跨服务比较时读不出量级差异。</p>
 */
import { computed, watch } from "vue";
import type { MonitorCardItem } from "@pages/system";
import ApmCardBody from "../ApmCardBody.vue";
import { useApmCardGate } from "../useApmCardGate";
import { useApmPoll } from "../useApmPoll";
import { listServices, type ApmService } from "../../api/apmApi";
import { errorRateClass, fmtClock, fmtMs, fmtNum, fmtPercent } from "../../utils/format";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const WINDOW_MINUTES = 30;

/** 展示条数：默认 6，可在卡片配置里调 */
const limit = computed(() => props.card.config?.limit ?? 6);

const gate = useApmCardGate(() => "services");
const poll = useApmPoll<ApmService[]>(
  () => gate.ready.value,
  () => listServices({ minutes: WINDOW_MINUTES, pageSize: limit.value }),
  () => props.card.config?.intervalSec ?? 30,
);

watch(
  () => props.refreshKey,
  () => void poll.reload(true),
);

/** 全量服务数（后端返回的是当前页，这里给「已取到的条数」更诚实） */
const total = computed(() => poll.data.value?.length ?? 0);

/** 按调用量降序；占比条以当前行最大值为满格 */
const rows = computed<ApmService[]>(() =>
  [...(poll.data.value ?? [])].sort((a, b) => Number(b.calls) - Number(a.calls)),
);

const maxCalls = computed(() => Math.max(1, ...rows.value.map((s) => Number(s.calls) || 0)));

function barPct(calls: number): number {
  return Math.max(0, Math.min(100, ((Number(calls) || 0) / maxCalls.value) * 100));
}

const loading = computed(() => poll.loading.value);
const error = computed(() => poll.error.value);
const clock = computed(() => fmtClock(poll.updatedAt.value));
</script>
