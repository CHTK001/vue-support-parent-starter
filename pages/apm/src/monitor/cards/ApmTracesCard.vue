<template>
  <ApmCardBody capability="traces">
    <div class="ac-card">
      <div class="ac-head">
        <span class="ac-chip">最慢 {{ rows.length }} 条</span>
        <span class="ac-muted">最近 {{ WINDOW_MINUTES }} 分钟</span>
      </div>

      <div v-if="error" class="ac-note ac-danger">{{ error }}</div>

      <div class="ac-list">
        <div v-for="t in rows" :key="t.traceId" class="ac-row">
          <div class="ac-row__main">
            <span class="ac-row__name" :title="t.endpointName || t.traceId">
              {{ t.endpointName || "（未命名端点）" }}
            </span>
            <span class="ac-row__meta">
              {{ t.serviceName || "—" }} · {{ t.spanCount }} span · {{ fmtAgo(t.startTime) }}
            </span>
          </div>
          <span class="ac-row__value" :class="latencyClass(t.durationMs)">
            <span v-if="t.error" class="ac-danger">!</span>
            {{ fmtMs(t.durationMs) }}
          </span>
        </div>

        <div v-if="!rows.length && !loading" class="ac-empty">最近 {{ WINDOW_MINUTES }} 分钟没有采集到链路</div>
        <div v-else-if="!rows.length" class="ac-empty">读取链路…</div>
      </div>

      <p class="ac-foot">/api/apm/v1/traces · 按耗时倒序 · 更新于 {{ clock }}</p>
    </div>
  </ApmCardBody>
</template>

<script setup lang="ts" name="ApmTracesCard">
/**
 * APM 慢链路卡片
 *
 * <p>链路表在 APM 页面里是「先筛选再看瀑布」，大屏上没有交互空间，所以只取
 * <b>耗时倒序的前 N 条</b>，把「哪个端点最慢、是不是错误链路」直接摊开。
 * {@code traceId} 只作为 key 与悬浮提示，不铺在正文里 —— 32 位十六进制在卡片宽度下
 * 只会被截断。</p>
 */
import { computed, watch } from "vue";
import type { MonitorCardItem } from "@pages/system";
import ApmCardBody from "../ApmCardBody.vue";
import { useApmCardGate } from "../useApmCardGate";
import { useApmPoll } from "../useApmPoll";
import { listTraces, type ApmTrace } from "../../api/apmApi";
import { fmtAgo, fmtClock, fmtMs, latencyClass } from "../../utils/format";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const WINDOW_MINUTES = 30;

/** 展示条数：默认 6 */
const limit = computed(() => props.card.config?.limit ?? 6);

const gate = useApmCardGate(() => "traces");
const poll = useApmPoll<ApmTrace[]>(
  () => gate.ready.value,
  () =>
    listTraces({
      minutes: WINDOW_MINUTES,
      pageSize: limit.value,
      orderByDuration: true,
      state: "ALL",
    }),
  () => props.card.config?.intervalSec ?? 30,
);

watch(
  () => props.refreshKey,
  () => void poll.reload(true),
);

const rows = computed(() => poll.data.value ?? []);
const loading = computed(() => poll.loading.value);
const error = computed(() => poll.error.value);
const clock = computed(() => fmtClock(poll.updatedAt.value));
</script>
