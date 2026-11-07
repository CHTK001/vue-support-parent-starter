<!--
  /**
   * 虚拟桌面 · 监控窗口
   *
   * <p>数据来自台账详情接口（最近一次采集落库值），不新开实时通道：
   * 桌面里同时开几个监控窗口也不会把 socket 打爆，轮询间隔 5 秒足够看趋势。
   * 需要历史曲线时仍从「主机资产」的指标页看，这里不重复造一套。</p>
   */
  -->
<template>
  <div class="dm">
    <div class="dm__bar">
      <span class="dm__title">{{ host?.serverHostName || `主机 #${hostId}` }}</span>
      <span class="dm__os">{{ host?.serverHostOsType || '—' }}</span>
      <span class="dm__spacer" />
      <span class="dm__tick">{{ tickText }}</span>
      <button type="button" class="dm__btn" :disabled="loading" @click="refresh">
        <ReIcon name="RefreshRight" :size="12" />
      </button>
    </div>

    <div v-if="error" class="dm__error">{{ error }}</div>

    <div class="dm__rings">
      <div v-for="r in rings" :key="r.key" class="dm__ring">
        <div class="dm__ring-wrap">
          <svg viewBox="0 0 44 44" class="dm__ring-svg">
            <circle class="dm__ring-bg" cx="22" cy="22" r="18" pathLength="100" />
            <circle
              class="dm__ring-fg"
              cx="22" cy="22" r="18" pathLength="100"
              :style="{ stroke: colorOf(r.value), strokeDasharray: `${clamp(r.value)} 100` }"
            />
          </svg>
          <b class="dm__ring-val">{{ textOf(r.value) }}</b>
        </div>
        <span class="dm__ring-label">{{ r.label }}</span>
      </div>
    </div>

    <div class="dm__grid">
      <div class="dm__cell">
        <span class="dm__k">内存</span>
        <span class="dm__v">{{ gbOf(host?.serverHostMemoryMb) }}</span>
      </div>
      <div class="dm__cell">
        <span class="dm__k">磁盘</span>
        <span class="dm__v">{{ host?.serverHostDiskGb ? `${host.serverHostDiskGb} GB` : '—' }}</span>
      </div>
      <div class="dm__cell">
        <span class="dm__k">磁盘读</span>
        <span class="dm__v">{{ kbsOf(host?.serverHostDiskReadKbs) }}</span>
      </div>
      <div class="dm__cell">
        <span class="dm__k">磁盘写</span>
        <span class="dm__v">{{ kbsOf(host?.serverHostDiskWriteKbs) }}</span>
      </div>
      <div class="dm__cell">
        <span class="dm__k">网络收</span>
        <span class="dm__v">{{ kbsOf(host?.serverHostNetRxKbs) }}</span>
      </div>
      <div class="dm__cell">
        <span class="dm__k">网络发</span>
        <span class="dm__v">{{ kbsOf(host?.serverHostNetTxKbs) }}</span>
      </div>
      <div class="dm__cell is-wide">
        <span class="dm__k">最近采集</span>
        <span class="dm__v">{{ host?.serverHostLastCollectTime || '—' }}</span>
      </div>
      <div class="dm__cell is-wide">
        <span class="dm__k">地址</span>
        <span class="dm__v mono">{{ host?.serverHostAddress || '—' }}:{{ host?.serverHostPort ?? 22 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getHost } from "../../../api";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 轮询间隔：桌面里多个监控窗口叠加，5 秒足够看趋势又不压采集侧 */
const POLL_MS = 5000;

const host = ref<any>(null);
const loading = ref(false);
const error = ref("");
const tick = ref(0);
let timer: number | undefined;

/** 三条环形指标 */
const rings = computed(() => [
  { key: "cpu", label: "CPU", value: host.value?.serverHostCpuUsage },
  { key: "mem", label: "内存", value: host.value?.serverHostMemUsage },
  { key: "disk", label: "磁盘", value: host.value?.serverHostDiskUsage },
]);

/** 距离上次刷新多少秒，给「数据是不是还活着」一个参照 */
const tickText = computed(() => (tick.value ? `${tick.value}s 前刷新` : "—"));

/**
 * 拉一次台账详情。
 */
async function refresh(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    host.value = await getHost(props.hostId);
    tick.value = 0;
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

/**
 * 百分比收敛 0-100。
 *
 * @param v 原值
 */
function clamp(v?: number | null): number {
  return Math.max(0, Math.min(100, Number(v) || 0));
}

/**
 * 环形填充色：60 以下绿、80 以下橙、再高红。
 *
 * @param v 百分比
 */
function colorOf(v?: number | null): string {
  const p = clamp(v);
  if (p >= 80) return "#f56c6c";
  if (p >= 60) return "#e9a13b";
  return "#3fbf7f";
}

/**
 * 百分比文案，无数据给破折号而不是 0%。
 *
 * @param v 原值
 */
function textOf(v?: number | null): string {
  return v == null ? "—" : `${clamp(v).toFixed(0)}%`;
}

/**
 * MB 转 GB。
 *
 * @param mb 兆字节
 */
function gbOf(mb?: number | null): string {
  return mb ? `${(mb / 1024).toFixed(1)} GB` : "—";
}

/**
 * KB/s 速率文案。
 *
 * @param v 速率
 */
function kbsOf(v?: number | null): string {
  if (v == null) return "—";
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)} GB/s`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)} MB/s`;
  return `${Number(v).toFixed(1)} KB/s`;
}

onMounted(() => {
  refresh();
  timer = window.setInterval(() => {
    tick.value += POLL_MS / 1000;
    if (tick.value % (POLL_MS / 1000) === 0) {
      refresh();
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
.dm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 0 10px;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dm__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dm__title {
  font-weight: 600;
  color: #efeaf7;
}

.dm__os {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dm__spacer {
  flex: 1;
}

.dm__tick {
  font-size: 10.5px;
  color: #7e7889;
}

.dm__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.dm__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
}

.dm__error {
  flex: none;
  padding: 6px 10px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
}

.dm__rings {
  display: flex;
  flex: none;
  gap: 18px;
  justify-content: center;
  padding: 16px 12px 10px;
}

.dm__ring {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.dm__ring-wrap {
  position: relative;
  width: 78px;
  height: 78px;
}

.dm__ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.dm__ring-bg,
.dm__ring-fg {
  fill: none;
  stroke-width: 4;
}

.dm__ring-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.dm__ring-fg {
  stroke-linecap: round;
  transition: stroke-dasharray 0.4s ease;
}

.dm__ring-val {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #efeaf7;
}

.dm__ring-label {
  font-size: 11px;
  color: #9d97ab;
}

.dm__grid {
  display: grid;
  flex: 1;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  min-height: 0;
  padding: 4px 12px 0;
  overflow-y: auto;
  align-content: start;
}

.dm__cell {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 7px;
}

.dm__cell.is-wide {
  grid-column: 1 / -1;
}

.dm__k {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dm__v {
  overflow: hidden;
  font-size: 11.5px;
  color: #e6e1ef;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dm__v.mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
}
</style>
