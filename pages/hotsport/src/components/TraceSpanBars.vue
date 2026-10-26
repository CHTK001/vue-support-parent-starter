<!-- 链路 span 甘特条：树表展开行内使用。
     展开时才挂载 → 才发请求，不展开不打接口；数据全部来自真实 span 记录。 -->
<template>
  <div class="trace-spans">
    <div v-if="loading" class="ts-hint muted">正在加载 span…</div>
    <div v-else-if="!spans.length" class="ts-hint muted">该链路无 span 数据</div>

    <template v-else>
      <div class="ts-head">
        <span class="ts-head-name">Span</span>
        <span class="ts-head-track">时间轴（{{ fmtMs(totalMs) }} ms）</span>
        <span class="ts-head-dur">耗时</span>
      </div>

      <div
        v-for="(sp, i) in spans"
        :key="`${sp.spanId || 'span'}-${i}`"
        class="ts-row"
        :class="{ 'is-error': isError(sp) }"
      >
        <span class="ts-name" :style="{ paddingLeft: depthOf(sp) * 14 + 'px' }">
          <i class="ts-kind" :style="{ background: kindColor(sp.protocol) }" aria-hidden="true" />
          <code class="mono ts-op">{{ shortName(sp) }}</code>
        </span>

        <span class="ts-track">
          <i
            class="ts-bar"
            :style="{
              left: offsetPercent(sp) + '%',
              width: durationPercent(sp) + '%',
              background: kindColor(sp.protocol),
            }"
            :title="`${shortName(sp)} · ${fmtMs(sp.durationMs)} ms · ${sp.status || 'OK'}`"
          />
        </span>

        <span class="ts-dur mono" :class="durClass(sp)">
          {{ fmtMs(sp.durationMs) }} ms
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getTraceDetail } from "../api/apmApi";
import type { TransmissionRecord } from "../api/apmApi";

const props = defineProps<{ traceId: string }>();

const spans = ref<TransmissionRecord[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    spans.value = (await getTraceDetail(props.traceId)) || [];
  } catch {
    spans.value = [];
  } finally {
    loading.value = false;
  }
});

/** 时间轴总跨度：所有 span 里最晚结束 − 最早开始 */
const totalMs = computed(() => {
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const sp of spans.value) {
    const start = toMs(sp.startTime);
    const end = sp.endTime ? toMs(sp.endTime) : start + (Number(sp.durationMs) || 0);
    if (start < min) min = start;
    if (end > max) max = end;
  }
  if (!Number.isFinite(min) || max <= min) {
    // 时间戳缺失时退回「耗时之和」，保证条形仍有相对宽度
    return spans.value.reduce((acc, sp) => acc + (Number(sp.durationMs) || 0), 0) || 1;
  }
  return max - min;
});

const originMs = computed(() => {
  let min = Number.POSITIVE_INFINITY;
  for (const sp of spans.value) {
    const start = toMs(sp.startTime);
    if (start < min) min = start;
  }
  return Number.isFinite(min) ? min : 0;
});

function toMs(v: string | undefined): number {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 层级：沿 parentSpanId 上溯，最大 8 层（再深也读不出差异） */
const depthMap = computed(() => {
  const byId = new Map<string, TransmissionRecord>();
  for (const sp of spans.value) {
    if (sp.spanId) byId.set(sp.spanId, sp);
  }
  const map = new Map<string, number>();
  for (const sp of spans.value) {
    if (!sp.spanId) continue;
    let depth = 0;
    let cur: TransmissionRecord | undefined = sp;
    const guard = new Set<string>();
    while (cur?.parentSpanId && byId.has(cur.parentSpanId) && !guard.has(cur.parentSpanId)) {
      guard.add(cur.parentSpanId);
      cur = byId.get(cur.parentSpanId);
      depth++;
      if (depth > 8) break;
    }
    map.set(sp.spanId, depth);
  }
  return map;
});

function depthOf(sp: TransmissionRecord): number {
  return depthMap.value.get(sp.spanId || "") ?? 0;
}

function offsetPercent(sp: TransmissionRecord): number {
  const total = totalMs.value;
  if (total <= 0) return 0;
  const rel = toMs(sp.startTime) - originMs.value;
  return Math.min(100, Math.max(0, (rel / total) * 100));
}

function durationPercent(sp: TransmissionRecord): number {
  const total = totalMs.value;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0.5, ((Number(sp.durationMs) || 0) / total) * 100));
}

function isError(sp: TransmissionRecord): boolean {
  return Boolean(sp.status && sp.status !== "OK");
}

function fmtMs(v: number | undefined): string {
  const n = Number(v) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function shortName(sp: TransmissionRecord): string {
  const name = sp.operation || sp.target || sp.spanId || "—";
  return name.length > 46 ? name.slice(0, 46) + "…" : name;
}

function durClass(sp: TransmissionRecord): string {
  const v = Number(sp.durationMs) || 0;
  if (v >= 3000) return "crit";
  if (v >= 1000) return "slow";
  if (v >= 300) return "mid";
  return "fast";
}

/** 协议 → 令牌色（同一协议同色，扫一眼能分出调用类型） */
function kindColor(protocol: string | undefined): string {
  switch ((protocol || "").toUpperCase()) {
    case "HTTP":
      return "var(--apm-chart-1, var(--brand-500))";
    case "GRPC":
      return "var(--status-warning, var(--apm-warning))";
    case "KAFKA":
    case "MQ":
      return "var(--apm-chart-3, var(--apm-accent-alt))";
    case "REDIS":
    case "MYSQL":
    case "JDBC":
      return "var(--status-success, var(--apm-success))";
    default:
      return "var(--apm-chart-5, var(--apm-muted))";
  }
}
</script>

<style scoped>
.trace-spans {
  padding: var(--apm-space-2) var(--apm-space-3) var(--apm-space-3);
  background: var(--bg-elevated, var(--apm-panel-raised));
}

.ts-hint {
  font-size: 12px;
  padding: var(--apm-space-2) 0;
}

.ts-head,
.ts-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
}

.ts-head {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-tertiary, var(--apm-muted));
  padding: 4px 0;
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-soft));
  margin-bottom: 2px;
}

.ts-head-name {
  width: 300px;
  flex-shrink: 0;
}

.ts-head-track {
  flex: 1;
  min-width: 120px;
}

.ts-head-dur {
  width: 84px;
  flex-shrink: 0;
  text-align: right;
}

.ts-row {
  min-height: 26px;
  font-size: 12px;
  border-radius: var(--apm-radius-sm);
}

.ts-row:hover {
  background: var(--bg-hover, var(--apm-panel-active));
}

.ts-name {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ts-kind {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ts-op {
  font-size: 11.5px;
  color: var(--text-primary, var(--apm-fg));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 甘特轨道：细网格底 + 绝对定位条，横向对齐同一时间轴 */
.ts-track {
  position: relative;
  flex: 1;
  min-width: 120px;
  height: 10px;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.ts-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  min-width: 2px;
}

.ts-row.is-error .ts-bar {
  box-shadow: 0 0 0 1.5px var(--status-error, var(--apm-danger));
}

.ts-dur {
  width: 84px;
  flex-shrink: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ts-dur.fast { color: var(--status-success, var(--apm-success)); }
.ts-dur.mid { color: var(--text-secondary, var(--apm-fg-regular)); }
.ts-dur.slow { color: var(--status-warning, var(--apm-warning)); }
.ts-dur.crit { color: var(--status-error, var(--apm-danger)); font-weight: 600; }

@media (max-width: 900px) {
  .ts-name,
  .ts-head-name {
    width: 180px;
  }

  .ts-track,
  .ts-head-track {
    display: none;
  }
}
</style>
