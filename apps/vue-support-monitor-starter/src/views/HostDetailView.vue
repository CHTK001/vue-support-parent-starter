<script setup lang="ts">
/**
 * 主机监控详情 —— 对齐 prototype §主机监控详情
 * ReSectionHead + ReCard + ReStatCard + ReButton(square)。指标 rings + sparkline 用纯 CSS/SVG（app 未装 echarts）。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getHost, queryHosts } from "@pages/server/src/api";
import {
  getLatestCpu, getCpuHistory, getLatestMemory, getMemoryHistory, getLatestDisk,
  getLatestNetwork, getNetworkHistory, getLatestJvm, getJvmHistory,
} from "@pages/monitor/src/api";

const route = useRoute();
const router = useRouter();
const monitorId = ref<number>(Number(route.params.id) || 0);
const hostName = ref("");
const loading = ref(false);
const error = ref("");

const cpu = ref<{ usage?: number; cores?: number } | null>(null);
const mem = ref<{ usagePercent?: number; usage?: number; total?: number } | null>(null);
const disk = ref<any[]>([]);
const net = ref<{ rx?: number; tx?: number } | null>(null);
const jvm = ref<{ heapUsed?: number; heapMax?: number; heapUsagePercent?: number } | null>(null);
const cpuHist = ref<number[]>([]);
const memHist = ref<number[]>([]);
const netHist = ref<number[]>([]);
const jvmHist = ref<number[]>([]);

function pct(v?: number): string { return v == null ? "—" : `${v.toFixed(0)}%`; }
function fmt(v?: number): string {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)}K`;
  return String(Math.round(v));
}
function spark(data: number[]): string {
  if (data.length === 0) return "";
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, w = 200, h = 60, pad = 2;
  // 返回 points 属性所需坐标对：x,y x,y（不能带 M/L 路径命令）
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
const ringStyle = (p: number, color: string) => ({ background: `conic-gradient(${color} ${Math.min(100, p)}%, var(--border-subtle) 0)` });
const cpuPct = computed(() => cpu.value?.usage ?? 0);
const memPct = computed(() => mem.value?.usagePercent ?? 0);
const jvmPct = computed(() => jvm.value?.heapUsagePercent ?? 0);

/** ReTable 列：磁盘挂载点 */
const diskColumns = [
  { prop: "mount", label: "挂载点", minWidth: 140 },
  { prop: "device", label: "设备", minWidth: 120, showOverflowTooltip: true },
  { prop: "usedText", label: "已用", slot: "used" },
  { prop: "usagePercent", label: "使用率", width: 200, slot: "usage" },
];
function diskUsed(r: any): string { return `${fmt(r.used)} / ${fmt(r.total)}`; }
function diskUsageWidth(r: any): string { return `${Math.min(100, Number(r.usagePercent ?? 0))}%`; }

async function fetchMetrics(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const id = monitorId.value;
    const [c, m, d, n, j] = await Promise.allSettled([getLatestCpu(id), getLatestMemory(id), getLatestDisk(id), getLatestNetwork(id), getLatestJvm(id)]);
    if (c.status === "fulfilled") cpu.value = c.value;
    if (m.status === "fulfilled") mem.value = m.value;
    if (d.status === "fulfilled") disk.value = d.value ?? [];
    if (n.status === "fulfilled") net.value = n.value;
    if (j.status === "fulfilled") jvm.value = j.value;
    const pick = (v: any): number => (v == null ? 0 : Number(v));
    const [ch, mh, nh, jh] = await Promise.allSettled([
      getCpuHistory(id, 24), getMemoryHistory(id, 24), getNetworkHistory(id, 24), getJvmHistory(id, 24),
    ]);
    if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map(r => pick((r as any).value));
    if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map(r => pick((r as any).value));
    if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map(r => pick((r as any).tx ?? r.value));
    if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map(r => pick((r as any).value));
  } catch (e) { error.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}
async function resolveHost(): Promise<void> {
  try {
    const hosts = (await queryHosts()) ?? [];
    const hit = hosts.find((h: any) => h.id === monitorId.value);
    if (hit) hostName.value = hit.serverHostName;
  } catch { /* 忽略 */ }
}
watch(() => route.params.id, id => {
  const n = Number(id);
  if (n && n !== monitorId.value) { monitorId.value = n; fetchMetrics(); resolveHost(); }
});
onMounted(() => { fetchMetrics(); resolveHost(); });
</script>

<template>
  <div class="hd">
    <ReSectionHead :description="`主机 #${monitorId} · 实时指标与 24h 趋势`">
      <template #title>{{ hostName || `主机 #${monitorId}` }}</template>
      <template #actions>
        <ReButton icon="Back" :show-text="true" size="small" @click="router.push('/assets')">资产</ReButton>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchMetrics">刷新</ReButton>
        <ReButton icon="Connection" :show-text="true" type="primary" size="small" @click="router.push({ path: '/terminal', query: { hostId: String(monitorId) } })">连接远控</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="error" class="hd-error">
      <span>部分数据加载失败：{{ error }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchMetrics">重试</ReButton>
    </div>

    <!-- 实时指标 -->
    <section class="gauge-grid">
      <ReCard :radius="12" shadow="never" :padding="14" body-style="display:flex;flex-direction:column;align-items:center">
        <div class="g-tag" style="color: var(--metric-cpu)">CPU</div>
        <div class="g-ring" :style="ringStyle(cpuPct, 'var(--metric-cpu)')"><div class="g-hole"><b>{{ pct(cpuPct) }}</b><span v-if="cpu?.cores">/ {{ cpu.cores }}核</span></div></div>
      </ReCard>
      <ReCard :radius="12" shadow="never" :padding="14" body-style="display:flex;flex-direction:column;align-items:center">
        <div class="g-tag" style="color: var(--metric-mem)">内存</div>
        <div class="g-ring" :style="ringStyle(memPct, 'var(--metric-mem)')"><div class="g-hole"><b>{{ pct(memPct) }}</b><span>{{ fmt(mem?.usage) }}/{{ fmt(mem?.total) }}</span></div></div>
      </ReCard>
      <ReCard :radius="12" shadow="never" :padding="14" body-style="display:flex;flex-direction:column;align-items:center">
        <div class="g-tag" style="color: var(--metric-disk)">磁盘</div>
        <div class="g-ring" :style="ringStyle(disk.length ? 60 : 0, 'var(--metric-disk)')"><div class="g-hole"><b>{{ disk.length }}</b><span>挂载</span></div></div>
      </ReCard>
      <ReCard :radius="12" shadow="never" :padding="14" body-style="display:flex;flex-direction:column;align-items:center">
        <div class="g-tag" style="color: var(--metric-net)">网络</div>
        <div class="net-big"><span class="net-label">RX</span><b>{{ fmt(net?.rx) }}</b><span class="net-label sep">TX</span><b>{{ fmt(net?.tx) }}</b></div>
      </ReCard>
      <ReCard :radius="12" shadow="never" :padding="14" body-style="display:flex;flex-direction:column;align-items:center">
        <div class="g-tag" style="color: var(--metric-jvm)">JVM</div>
        <div class="g-ring" :style="ringStyle(jvmPct, 'var(--metric-jvm)')"><div class="g-hole"><b>{{ pct(jvmPct) }}</b><span>{{ fmt(jvm?.heapUsed) }}/{{ fmt(jvm?.heapMax) }}</span></div></div>
      </ReCard>
    </section>

    <!-- 趋势 -->
    <section class="trend-grid">
      <ReCard :radius="12" shadow="never"><template #header><span class="card-h">CPU 24h</span></template>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none"><polyline :points="spark(cpuHist)" fill="none" stroke="var(--metric-cpu)" stroke-width="1.6" /><polygon :points="spark(cpuHist) + ' 200,60 0,60'" fill="var(--metric-cpu)" opacity="0.08" /></svg>
      </ReCard>
      <ReCard :radius="12" shadow="never"><template #header><span class="card-h">内存 24h</span></template>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none"><polyline :points="spark(memHist)" fill="none" stroke="var(--metric-mem)" stroke-width="1.6" /><polygon :points="spark(memHist) + ' 200,60 0,60'" fill="var(--metric-mem)" opacity="0.08" /></svg>
      </ReCard>
      <ReCard :radius="12" shadow="never"><template #header><span class="card-h">JVM 24h</span></template>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none"><polyline :points="spark(jvmHist)" fill="none" stroke="var(--metric-jvm)" stroke-width="1.6" /></svg>
      </ReCard>
      <ReCard :radius="12" shadow="never"><template #header><span class="card-h">网络 24h</span></template>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none"><polyline :points="spark(netHist)" fill="none" stroke="var(--metric-net)" stroke-width="1.6" /></svg>
      </ReCard>
    </section>

    <!-- 磁盘挂载点 -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">磁盘挂载点</span></template>
      <ReTable :data="disk" :columns="diskColumns" size="small" empty-text="暂无磁盘数据" :pagination="false" :toolbar="false" table-id="monitor-host-disk">
        <template #col-used="{ row }"><span class="mono">{{ diskUsed(row) }}</span></template>
        <template #col-usage="{ row }">
          <div class="use-row"><div class="bar"><div class="bar-fill" :style="{ width: diskUsageWidth(row) }" /></div><span class="mono dim">{{ pct(row.usagePercent) }}</span></div>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.hd-error { display: flex; align-items: center; gap: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: var(--status-error-text); background: var(--status-error-bg); border: 1px solid var(--status-error-border); border-radius: var(--radius-sm); }
.card-h { font-size: 13px; font-weight: 600; }
.gauge-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
.g-tag { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.g-ring {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(15, 18, 33, 0.02), var(--shadow-1);
  transition: background 0.6s var(--ease-out, ease), transform 0.2s var(--ease-out, ease);
}
.gauge-grid .card:hover .g-ring { transform: scale(1.05); }
.g-hole { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 58px; height: 58px; border-radius: 50%; background: var(--bg-container); font-size: 11px; color: var(--text-tertiary); b { font-size: 16px; color: var(--text-primary); } }
.net-big { display: flex; flex-direction: column; align-items: center; gap: 2px; b { font-size: 15px; } .net-label { font-size: 11px; color: var(--text-tertiary); } .sep { margin-top: 4px; } }
.trend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.spark-lg { width: 100%; height: 60px; }
.mono { font-family: monospace; font-size: 12px; }
.dim { color: var(--text-tertiary); }
.use-row { display: flex; align-items: center; gap: 8px; }
.bar { flex: 1; height: 6px; background: var(--border-subtle); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background-color: var(--metric-disk); border-radius: 3px; }
</style>