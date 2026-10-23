<script setup lang="ts">
/**
 * 服务节点运行指标。
 *
 * <p>服务节点本身不存 PID，只有 host/port，因此指标分两段取：</p>
 * <ol>
 *   <li><b>端口层</b>：{@code /ms/system/netproc} 按监听端口拉连接明细，得到
 *       活跃连接数 / LISTEN 数 / 占用进程 PID / 进程名。这条链路对 TCP/UDP 都成立，
 *       且不依赖节点是否由本进程托管。</li>
 *   <li><b>进程层</b>：拿到 PID 后再用 {@code /ms/system/processes} 精确取该进程的
 *       CPU 与内存占用。拿不到 PID（跨主机、权限不足、端口不是本机）时这一段留空，
 *       不编造数值。</li>
 * </ol>
 *
 * <p>另有一条<b>可连通性</b>依据：对 HTTP 类节点发一次轻量请求量出往返耗时，
 * 非 HTTP 节点改用 TCP 建连耗时。这是唯一能反映「服务真的能应答」的指标，
 * 端口在 LISTEN 但进程卡死时它也会掉。</p>
 *
 * <p>采样只在本组件挂载且节点处于 RUNNING 时进行，离开抽屉即停止，不做全局轮询。</p>
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { fetchNetProcesses, fetchProcesses, type NetProcessInfo, type ProcessInfo } from '../api';
import type { ServerNodeView } from '../api';

const props = defineProps<{
  /** 当前节点；null 表示未选中 */
  node: ServerNodeView | null;
}>();

/** 采样点上限：60 个点按 3s 一次约 3 分钟窗口，足够看出抖动 */
const MAX_POINTS = 60;
/** 采样间隔（毫秒） */
const SAMPLE_MS = 3000;

/** 端口占用明细 */
const netRows = ref<NetProcessInfo[]>([]);
/** 命中的进程（可能为空） */
const proc = ref<ProcessInfo | null>(null);
/** 端口反查到的 PID，0 表示未取到 */
const pid = ref(0);
/** 本次采样是否拿到端口数据 */
const netOk = ref(false);
/** 采样错误信息 */
const sampleError = ref('');
/** 最近一次采样时间 */
const sampledAt = ref(0);
/** 正在采样 */
const sampling = ref(false);
/** 可连通性探测耗时（毫秒），null 表示本次未测或失败 */
const latency = ref<number | null>(null);

/** 活跃连接数历史 */
const connHist = ref<[number, number][]>([]);
/** CPU 历史（该进程） */
const cpuHist = ref<[number, number][]>([]);
/** 内存历史（MB） */
const memHist = ref<[number, number][]>([]);
/** 连通耗时历史 */
const latencyHist = ref<[number, number][]>([]);

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
let timer: number | null = null;
/** 上一轮在途标记，避免慢采样堆叠 */
let inFlight = false;

/** 该端口上的连接总数（不分状态） */
const totalConns = computed(() => netRows.value.length);
/** 处于 ESTABLISHED 的连接数 */
const establishedConns = computed(
  () => netRows.value.filter(r => r.state === 'ESTABLISHED').length,
);
/** 处于 LISTEN / UNCONN 的监听条目数 */
const listenCount = computed(
  () => netRows.value.filter(r => r.state === 'LISTEN' || r.state === 'UNCONN').length,
);
/** 对端地址去重数，粗略反映「多少个客户端」 */
const peerCount = computed(() => {
  const peers = new Set<string>();
  for (const r of netRows.value) {
    if (r.state !== 'ESTABLISHED') continue;
    const addr = r.remoteAddr;
    if (addr && addr !== '0.0.0.0' && addr !== '::') peers.add(addr);
  }
  return peers.size;
});

/** 本次采样是否成功拿到任何指标 */
const hasData = computed(() => netOk.value || latency.value != null);

/**
 * 该节点是否为 HTTP 系协议（决定连通性探测方式）。
 *
 * <p>仅用于探测方式选择；协议编码来自后端枚举，不做业务分支。</p>
 */
const isHttpLike = computed(() => {
  const p = (props.node?.protocol || '').toUpperCase();
  return p.startsWith('HTTP');
});

/**
 * 探测节点可连通性。
 *
 * <p>浏览器没有裸 TCP 能力，因此只能分两种情况：</p>
 * <ul>
 *   <li><b>HTTP 系节点</b>：直连 {@code http://host:port/} 发一次 HEAD。
 *       命中说明服务确实在应答应用层请求，是最有说服力的探针。</li>
 *   <li><b>非 HTTP 节点</b>（TCP/UDP 代理、SIP 等）：直连会因协议不匹配而
 *       静默挂到超时为止，白白拖慢采样节奏。这种情况下以「端口在 LISTEN」
 *       作为可达性依据，不伪造耗时。</li>
 * </ul>
 *
 * @returns 往返毫秒数；不适用或失败返回 null
 */
async function probeLatency(): Promise<number | null> {
  const n = props.node;
  if (!n || !n.port || !isHttpLike.value) return null;
  const host = n.host && n.host !== '0.0.0.0' ? n.host : '127.0.0.1';
  const started = performance.now();
  const ctrl = new AbortController();
  const abort = window.setTimeout(() => ctrl.abort(), 2000);
  try {
    // no-cors：跨域也能发出请求，拿到 opaque 响应即证明端口在应答
    await fetch(`http://${host}:${n.port}/`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    return Math.round(performance.now() - started);
  } catch {
    return null;
  } finally {
    window.clearTimeout(abort);
  }
}

/**
 * 执行一次采样：端口明细 → PID → 进程资源 → 连通耗时。
 */
async function sample(): Promise<void> {
  const n = props.node;
  if (!n || !n.port || inFlight) return;
  inFlight = true;
  sampling.value = true;
  const ts = Date.now();
  try {
    const rows = await fetchNetProcesses();
    const hit = rows.filter(r => Number(r.port ?? r.localPort) === n.port);
    netRows.value = hit;
    netOk.value = true;
    sampleError.value = '';

    const listenRow = hit.find(r => r.state === 'LISTEN' || r.state === 'UNCONN');
    pid.value = Number(listenRow?.pid) || 0;

    if (pid.value > 0) {
      // 用 keyword 缩小范围后按 PID 精确匹配：fetchProcesses 不支持按 PID 查询
      const page = await fetchProcesses({ keyword: listenRow?.process || undefined, limit: 200 });
      proc.value = page.list.find(p => Number(p.pid) === pid.value) || null;
    } else {
      proc.value = null;
    }

    latency.value = await probeLatency();

    connHist.value = push(connHist.value, ts, establishedConns.value);
    latencyHist.value = push(latencyHist.value, ts, latency.value);
    if (proc.value) {
      cpuHist.value = push(cpuHist.value, ts, Number(proc.value.cpu) || 0);
      memHist.value = push(memHist.value, ts, Number(proc.value.memory) || 0);
    }
    sampledAt.value = ts;
    await nextTick();
    renderChart();
  } catch (e) {
    netOk.value = false;
    sampleError.value = (e as Error).message || '采样失败';
  } finally {
    sampling.value = false;
    inFlight = false;
  }
}

/**
 * 追加一个采样点并裁剪到窗口上限。
 *
 * @param arr  历史序列
 * @param ts   时间戳（毫秒）
 * @param v    值；null 表示本次无值，不落点（折线会自然断开）
 */
function push(arr: [number, number][], ts: number, v: number | null): [number, number][] {
  if (v == null) return arr.slice(-MAX_POINTS);
  const next = [...arr, [ts, v] as [number, number]];
  return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
}

/** 渲染实时折线图 */
function renderChart(): void {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption({
    animation: false,
    grid: { left: 8, right: 8, top: 28, bottom: 4, containLabel: true },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 6,
      textStyle: { fontSize: 10 },
      data: isHttpLike.value ? ['活跃连接', '连通耗时'] : ['活跃连接'],
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      valueFormatter: (v: unknown) => (v == null ? '-' : String(v)),
    },
    xAxis: { type: 'time', axisLabel: { fontSize: 10, hideOverlap: true } },
    yAxis: [
      { type: 'value', name: '连接', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, minInterval: 1 },
      ...(isHttpLike.value
        ? [{ type: 'value' as const, name: 'ms', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, minInterval: 1 }]
        : []),
    ],
    series: [
      {
        name: '活跃连接',
        type: 'line',
        yAxisIndex: 0,
        data: connHist.value,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: '#22d3ee' },
        areaStyle: { color: 'rgba(34,211,238,0.12)' },
      },
      // 非 HTTP 节点测不到应用层往返，整条系列不渲染，避免一条永远为空的线
      ...(isHttpLike.value
        ? [{
            name: '连通耗时',
            type: 'line' as const,
            yAxisIndex: 1,
            data: latencyHist.value,
            showSymbol: false,
            smooth: true,
            connectNulls: false,
            lineStyle: { width: 1.5, color: '#a78bfa', type: 'dashed' as const },
          }]
        : []),
    ],
  }, true);
}

/** 启动周期采样 */
function start(): void {
  stop();
  void sample();
  timer = window.setInterval(() => void sample(), SAMPLE_MS);
}

/** 停止采样并清空序列 */
function stop(): void {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
}

/** 节点变化或运行态变化时重建采样 */
watch(
  () => [props.node?.id, props.node?.status, props.node?.port] as const,
  ([, status]) => {
    connHist.value = [];
    cpuHist.value = [];
    memHist.value = [];
    latencyHist.value = [];
    netRows.value = [];
    proc.value = null;
    pid.value = 0;
    latency.value = null;
    netOk.value = false;
    sampleError.value = '';
    if (status === 'RUNNING') {
      start();
    } else {
      stop();
      renderChart();
    }
  },
  { immediate: true },
);

/** 容器尺寸变化时重排图表 */
const onResize = () => chart?.resize();
window.addEventListener('resize', onResize);

onBeforeUnmount(() => {
  stop();
  window.removeEventListener('resize', onResize);
  chart?.dispose();
  chart = null;
});

/** 采样时间展示 */
const sampledText = computed(() =>
  sampledAt.value ? new Date(sampledAt.value).toLocaleTimeString('zh-CN', { hour12: false }) : '-',
);
</script>

<template>
  <div class="node-metrics">
    <!-- 运行态才采样：停止的节点拿不到 PID，也不该继续占用轮询 -->
    <template v-if="node?.status === 'RUNNING'">
      <div class="nm-cards">
        <div class="nm-card">
          <span class="nm-label">活跃连接</span>
          <span class="nm-value mono">{{ establishedConns }}</span>
          <span class="nm-sub">对端 {{ peerCount }} 个</span>
        </div>
        <div class="nm-card">
          <span class="nm-label">总连接</span>
          <span class="nm-value mono">{{ totalConns }}</span>
          <span class="nm-sub">监听 {{ listenCount }}</span>
        </div>
        <div class="nm-card">
          <span class="nm-label">进程 PID</span>
          <span class="nm-value mono">{{ pid || '-' }}</span>
          <span class="nm-sub">{{ proc?.name || '未定位进程' }}</span>
        </div>
        <div class="nm-card">
          <span class="nm-label">CPU</span>
          <span class="nm-value mono" :class="{ warn: (proc?.cpu ?? 0) >= 80 }">
            {{ proc ? `${(Number(proc.cpu) || 0).toFixed(1)}%` : '-' }}
          </span>
          <span class="nm-sub">{{ proc ? `${proc.threads ?? proc.threadCount ?? '-'} 线程` : '无进程数据' }}</span>
        </div>
        <div class="nm-card">
          <span class="nm-label">内存</span>
          <span class="nm-value mono">{{ proc ? `${Number(proc.memory).toFixed(0)} MB` : '-' }}</span>
          <span class="nm-sub">{{ proc?.user || '—' }}</span>
        </div>
        <div class="nm-card">
          <span class="nm-label">连通耗时</span>
          <!-- 非 HTTP 节点无法从浏览器测应用层往返，这里明确说明，不留假数据 -->
          <span class="nm-value mono" :class="{ warn: (latency ?? 0) >= 1000 }">
            {{ isHttpLike ? (latency == null ? '超时' : `${latency} ms`) : '—' }}
          </span>
          <span class="nm-sub">{{ isHttpLike ? 'HTTP 探测' : '非 HTTP，仅看端口' }}</span>
        </div>
      </div>

      <div ref="chartRef" class="nm-chart" />

      <div class="nm-foot">
        <span class="dim">
          每 {{ SAMPLE_MS / 1000 }}s 采样 · 最近 {{ sampledText }}
          <template v-if="sampling"> · 采样中…</template>
        </span>
        <span v-if="sampleError" class="nm-err" :title="sampleError">{{ sampleError }}</span>
        <span v-else-if="!netOk" class="nm-err">未取到端口明细（可能是跨主机节点或权限不足）</span>
        <span v-else-if="!isHttpLike" class="dim">非 HTTP 协议不做应用层探测，连通性以端口监听状态为准</span>
      </div>

      <div v-if="netRows.length" class="nm-peers">
        <span class="nm-peers-title">当前连接</span>
        <span
          v-for="(r, i) in netRows.slice(0, 6)"
          :key="`${r.local}-${r.remote}-${i}`"
          class="nm-peer"
          :class="r.state === 'ESTABLISHED' ? 'on' : 'off'"
        >
          {{ r.remote || r.local }} · {{ r.state }}
        </span>
        <span v-if="netRows.length > 6" class="dim">+{{ netRows.length - 6 }}</span>
      </div>
    </template>

    <!-- 非运行态：说明为什么没有指标，而不是留一片空白 -->
    <div v-else class="nm-empty">
      <span class="dim">
        {{ node?.status === 'ERROR' ? '节点启动失败，无运行指标；修复错误后重启即可恢复采样' : '节点未运行，暂无指标' }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 指标卡：与页面统计卡同一套科技感语言（霓虹左边框 + 毛玻璃） */
.nm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 8px;
}

.nm-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  background: color-mix(in srgb, var(--el-color-primary) 3%, var(--el-bg-color));
  min-width: 0;
}

.nm-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.nm-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  /* 数字用等宽，数值跳动时不会左右抖 */
  font-variant-numeric: tabular-nums;
  &.warn { color: var(--el-color-warning); }
}

.nm-sub {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nm-chart {
  height: 132px;
  width: 100%;
}

.nm-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  flex-wrap: wrap;
}

.nm-err {
  color: var(--el-color-warning);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.nm-peers {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
}

.nm-peers-title {
  color: var(--el-text-color-secondary);
}

/* 连接对端标签：在线青、离线灰，靠颜色区分状态而不靠额外图标 */
.nm-peer {
  padding: 1px 6px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid transparent;
  font-family: ui-monospace, monospace;
  &.on {
    color: var(--el-color-success);
    border-color: color-mix(in srgb, var(--el-color-success) 35%, transparent);
    background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  }
  &.off {
    color: var(--el-text-color-secondary);
    border-color: var(--el-border-color-lighter);
  }
}

.nm-empty {
  padding: 16px;
  text-align: center;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.dim { color: var(--el-text-color-secondary); }
.mono { font-family: ui-monospace, monospace; }
</style>
