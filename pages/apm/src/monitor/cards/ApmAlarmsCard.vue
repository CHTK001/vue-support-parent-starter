<template>
  <ApmCardBody capability="alarms">
    <div class="ac-card">
      <div class="ac-head">
        <span class="ac-chip">告警 {{ rows.length }}</span>
        <span class="ac-muted">最近 {{ WINDOW_HOURS }} 小时</span>
      </div>

      <div v-if="error" class="ac-note ac-danger">{{ error }}</div>

      <div class="ac-list">
        <div v-for="a in rows" :key="a.id" class="ac-row">
          <div class="ac-row__main">
            <!-- 主行是「出了什么事」（message），实体名放副行：
                 卡片上要一眼看出告警内容，而不是先读一行服务名。 -->
            <span class="ac-row__name" :title="`${a.name} · ${a.scope || ''}`">
              {{ a.message || a.name }}
            </span>
            <span class="ac-row__meta">{{ [a.name, a.scope].filter(Boolean).join(" · ") || "—" }}</span>
          </div>
          <span class="ac-row__value ac-warn">{{ fmtAgo(a.startTime) }}</span>
        </div>

        <div v-if="!rows.length && !loading" class="ac-empty">最近 {{ WINDOW_HOURS }} 小时没有告警</div>
        <div v-else-if="!rows.length" class="ac-empty">读取告警…</div>
      </div>

      <p class="ac-foot">/api/apm/v1/alarms · 按开始时间倒序 · 更新于 {{ clock }}</p>
    </div>
  </ApmCardBody>
</template>

<script setup lang="ts" name="ApmAlarmsCard">
/**
 * APM 告警卡片
 *
 * <p>大屏上看告警只关心两件事：<b>有没有、多久之前</b>。时间用相对值（「3 分钟前」）而不是
 * 绝对时间戳 —— 值班时眼睛扫的是「新旧」，不是「几点几分」。窗口取 24 小时，
 * 与告警通常的处置节奏一致；要更长窗口请用 APM 页面的告警分析。</p>
 *
 * <p>引擎没有告警能力时（如 OTel 纯指标模式），{@code ApmCardBody} 会直接给出
 * 「引擎不支持告警」，不会请求这个接口。</p>
 */
import { computed, watch } from "vue";
import type { MonitorCardItem } from "@pages/system";
import ApmCardBody from "../ApmCardBody.vue";
import { useApmCardGate } from "../useApmCardGate";
import { useApmPoll } from "../useApmPoll";
import { listAlarms, type ApmAlarm } from "../../api/apmApi";
import { fmtAgo, fmtClock } from "../../utils/format";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const WINDOW_HOURS = 24;

/** 展示条数：默认 6 */
const limit = computed(() => props.card.config?.limit ?? 6);

const gate = useApmCardGate(() => "alarms");
const poll = useApmPoll<ApmAlarm[]>(
  () => gate.ready.value,
  () => listAlarms({ minutes: WINDOW_HOURS * 60, pageSize: limit.value }),
  () => props.card.config?.intervalSec ?? 60,
);

watch(
  () => props.refreshKey,
  () => void poll.reload(true),
);

/** 新的在前 */
const rows = computed(() =>
  [...(poll.data.value ?? [])]
    .sort((a, b) => Number(b.startTime) - Number(a.startTime))
    .slice(0, limit.value),
);

const loading = computed(() => poll.loading.value);
const error = computed(() => poll.error.value);
const clock = computed(() => fmtClock(poll.updatedAt.value));
</script>
