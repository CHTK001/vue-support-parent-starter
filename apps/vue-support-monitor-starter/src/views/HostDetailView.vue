<script setup lang="ts">
/**
 * 主机监控详情 —— design.md §4.3
 * 按 monitorId 展示 CPU/内存/磁盘/网络/JVM 实时值与 24h 趋势。
 * 数据来自 /ms/monitor/metric/{cpu|memory|network|jvm}/{id} + history。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { getHost, queryHosts } from "@pages/server/src/api";
import {
  getLatestCpu, getCpuHistory,
  getLatestMemory, getMemoryHistory,
  getLatestDisk,
  getLatestNetwork, getNetworkHistory,
  getLatestJvm, getJvmHistory,
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

function pct(v?: number): string {
  return v == null ? "—" : `${v.toFixed(0)}%`;
}
function fmt(v?: number): string {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)}K`;
  return String(Math.round(v));
}
function sparkline(data: number[]): string {
  if (data.length === 0) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 36, pad = 2;
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
const ringStyle = (p: number, color: string) => ({
  background: `conic-gradient(${color} ${Math.min(100, p)}%, var(--border-subtle) 0)`,
});

async function fetchMetrics(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const id = monitorId.value;
    const [c, m, d, n, j] = await Promise.allSettled([
      getLatestCpu(id), getLatestMemory(id), getLatestDisk(id), getLatestNetwork(id), getLatestJvm(id),
    ]);
    if (c.status === "fulfilled") cpu.value = c.value;
    if (m.status === "fulfilled") mem.value = m.value;
    if (d.status === "fulfilled") disk.value = d.value ?? [];
    if (n.status === "fulfilled") net.value = n.value;
    if (j.status === "fulfilled") jvm.value = j.value;

    const [ch, mh, nh, jh] = await Promise.allSettled([
      getCpuHistory(id, 24), getMemoryHistory(id, 24), getNetworkHistory(id, 24), getJvmHistory(id, 24),
    ]);
    const pick = (p: number | string | undefined): number => (p == null ? 0 : Number(p));
    if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map(r => pick((r as any).msMonitorCpuMetricUsage ?? (r as any).value));
    if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map(r => pick((r as any).msMonitorMemoryMetricUsagePercent ?? (r as any).value));
    if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map(r => pick((r as any).tx ?? (r as any).value));
    if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map(r => pick((r as any).heapUsagePercent ?? (r as any).value));
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

async function resolveHost(): Promise<void> {
  // 用 monitorId 反查主机名：查 asset 里 id 匹配项
  try {
    const hosts = (await queryHosts()) ?? [];
    const hit = hosts.find((h: any) => h.id === monitorId.value);
    if (hit) hostName.value = hit.serverHostName;
  } catch { /* 忽略 */ }
}

const cpuPct = computed(() => cpu.value?.usage ?? 0);
const memPct = computed(() => mem.value?.usagePercent ?? 0);
const jvmPct = computed(() => jvm.value?.heapUsagePercent ?? 0);

watch(() => route.params.id, id => {
  const n = Number(id);
  if (n && n !== monitorId.value) { monitorId.value = n; fetchMetrics(); resolveHost(); }
});

onMounted(() => { fetchMetrics(); resolveHost(); });
</script>

<template>
  <div class="hd scrollable">
    <header class="hd-head">
      <div class="hd-left">
        <el-button size="small" plain @click="router.push('/assets')"><el-icon><ArrowLeft /></el-icon>资产</el-button>
        <h1 class="hd-title">{{ hostName || `主机 #${monitorId}` }} <span class="hd-id">监控详情</span></h1>
      </div>
      <div class="hd-actions">
        <el-button size="small" :loading="loading" @click="fetchMetrics">刷新</el-button>
        <el-button type="primary" size="small" @click="router.push({ path: '/terminal', query: { hostId: String(monitorId) } })">连接远控</el-button>
      </div>
    </header>

    <div v-if="error" class="hd-error">
      <span>部分数据加载失败：{{ error }}</span>
      <el-button size="small" type="primary" @click="fetchMetrics">重试</el-button>
    </div>

    <!-- 6 卡实时指标 -->
    <section class="gauge-grid">
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-cpu)">CPU</div>
        <div class="g-ring" :style="ringStyle(cpuPct, 'var(--metric-cpu)')"><div class="g-hole"><b>{{ pct(cpuPct) }}</b><span v-if="cpu?.cores">/ {{ cpu.cores }}核</span></div></div>
      </div>
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-mem)">内存</div>
        <div class="g-ring" :style="ringStyle(memPct, 'var(--metric-mem)')"><div class="g-hole"><b>{{ pct(memPct) }}</b><span>{{ fmt(mem?.usage) }}/{{ fmt(mem?.total) }}</span></div></div>
      </div>
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-disk)">磁盘</div>
        <div class="g-ring" :style="ringStyle(disk.length ? 60 : 0, 'var(--metric-disk)')"><div class="g-hole"><b>{{ disk.length }} 挂载</b></div></div>
      </div>
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-net)">网络</div>
        <div class="net-big">
          <span class="net-label">RX</span><b>{{ fmt(net?.rx) }}</b>
          <span class="net-label sep">TX</span><b>{{ fmt(net?.tx) }}</b>
        </div>
        <svg class="spark" viewBox="0 0 120 36" preserveAspectRatio="none">
          <polyline :points="sparkline(netHist)" fill="none" stroke="var(--metric-net)" stroke-width="1.5" />
        </svg>
      </div>
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-jvm)">JVM</div>
        <div class="g-ring" :style="ringStyle(jvmPct, 'var(--metric-jvm)')"><div class="g-hole"><b>{{ pct(jvmPct) }}</b><span>{{ fmt(jvm?.heapUsed) }}/{{ fmt(jvm?.heapMax) }}</span></div></div>
      </div>
      <div class="gauge-card">
        <div class="g-tag" style="color: var(--metric-redis)">磁盘 1</div>
        <div class="net-big">
          <span class="net-label">已用</span><b>{{ disk[0] ? fmt(disk[0].used) : "—" }}</b>
        </div>
      </div>
    </section>

    <!-- 趋势 4 列 -->
    <section class="trend-grid">
      <div class="card t-card">
        <div class="card-title">CPU 趋势 24h</div>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none">
          <polyline :points="sparkline(cpuHist)" fill="none" stroke="var(--metric-cpu)" stroke-width="1.6" />
          <polygon :points="sparkline(cpuHist) + ` L200,60 L0,60`" fill="var(--metric-cpu)" opacity="0.08" />
        </svg>
      </div>
      <div class="card t-card">
        <div class="card-title">内存趋势 24h</div>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none">
          <polyline :points="sparkline(memHist)" fill="none" stroke="var(--metric-mem)" stroke-width="1.6" />
          <polygon :points="sparkline(memHist) + ` L200,60 L0,60`" fill="var(--metric-mem)" opacity="0.08" />
        </svg>
      </div>
      <div class="card t-card">
        <div class="card-title">JVM 趋势 24h</div>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none">
          <polyline :points="sparkline(jvmHist)" fill="none" stroke="var(--metric-jvm)" stroke-width="1.6" />
        </svg>
      </div>
      <div class="card t-card">
        <div class="card-title">网络流量 24h</div>
        <svg class="spark-lg" viewBox="0 0 200 60" preserveAspectRatio="none">
          <polyline :points="sparkline(netHist)" fill="none" stroke="var(--metric-net)" stroke-width="1.6" />
        </svg>
      </div>
    </section>

    <!-- 磁盘挂载点 -->
    <div class="card">
      <div class="card-title">磁盘挂载点</div>
      <el-table :data="disk" size="small" empty-text="暂无磁盘数据">
        <el-table-column prop="mount" label="挂载点" min-width="140" />
        <el-table-column prop="device" label="设备" min-width="120" show-overflow-tooltip />
        <el-table-column label="已用">
          <template #default="{ row }"><span class="mono">{{ fmt(row.used) }} / {{ fmt(row.total) }}</span></template>
        </el-table-column>
        <el-table-column label="使用率" width="160">
          <template #default="{ row }">
            <div class="bar"><div class="bar-fill" :style="{ width: `${Math.min(100, Number(row.usagePercent ?? 0))}%` }" /></div>
            <span class="mono dim">{{ pct(row.usagePercent) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hd { max-width: 1440px; padding: 24px; }
.hd-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.hd-left { display: flex; align-items: center; gap: 14px; }
.hd-title { margin: 0; font-size: 20px; font-weight: 600; }
.hd-id { font-size: 13px; color: var(--text-tertiary); font-weight: 400; }
.hd-actions { display: flex; gap: 8px; }
.hd-error { display: flex; align-items: center; gap: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #9b1c2e; background: #fdecef; border: 1px solid #fbc0c9; border-radius: 8px; }

.gauge-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 16px; }
.gauge-card { padding: 14px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; }
.g-tag { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.g-ring { width: 74px; height: 74px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.g-hole { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 50%; background: var(--bg-container); font-size: 11px; color: var(--text-tertiary); b { font-size: 16px; color: var(--text-primary); } }
.net-big { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 6px; b { font-size: 15px; }.net-label { font-size: 11px; color: var(--text-tertiary); }.sep { margin-top: 4px; } }
.spark { width: 100%; height: 36px; }

.trend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.card { padding: 14px 16px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.card-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
.spark-lg { width: 100%; height: 60px; }
.bar { flex: 1; height: 6px; margin-right: 8px; background: var(--border-subtle); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--metric-disk); }
.mono { font-family: monospace; font-size: 12px; }
.dim { color: var(--text-tertiary); }
</style>