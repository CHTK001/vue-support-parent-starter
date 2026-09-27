<template>
  <div class="ngx-overview" v-loading="loading">
    <!-- Hero：运行态 + 实例元信息（对应 UI 图主状态卡） -->
    <div class="ngx-hero" :class="heroClass">
      <div class="ngx-hero-icon">
        <ReIcon :name="heroIcon" :size="26" />
      </div>
      <div class="ngx-hero-title">
        <div class="ngx-hero-name">{{ runningText }}</div>
        <div class="ngx-hero-sub">
          实例状态<template v-if="overview?.version?.version"> · {{ overview.version.version }}</template>
        </div>
      </div>
      <div class="ngx-hero-facts">
        <div class="ngx-fact">
          <span class="ngx-fact-label">主进程</span>
          <span class="ngx-fact-value mono">{{ overview?.masterPid ? `PID ${overview.masterPid}` : "—" }}</span>
        </div>
        <div class="ngx-fact">
          <span class="ngx-fact-label">已运行</span>
          <span class="ngx-fact-value mono">{{ overview?.uptimeText || "—" }}</span>
        </div>
        <div class="ngx-fact">
          <span class="ngx-fact-label">监听地址</span>
          <span class="ngx-fact-value mono">{{ endpoint || "—" }}</span>
        </div>
        <div class="ngx-fact">
          <span class="ngx-fact-label">主配置</span>
          <span class="ngx-fact-value mono ngx-break">{{ overview?.configPath || "—" }}</span>
        </div>
      </div>
    </div>

    <!-- KPI 行（对应 UI 图四项：活跃连接 / 累计请求 / 配置文件 / 监听端口） -->
    <div class="ngx-kpis">
      <div class="ngx-kpi">
        <div class="ngx-kpi-label">活跃连接</div>
        <div class="ngx-kpi-value">{{ overview?.status?.activeConnections ?? "—" }}</div>
      </div>
      <div class="ngx-kpi">
        <div class="ngx-kpi-label">累计请求</div>
        <div class="ngx-kpi-value">{{ formatNumber(overview?.status?.requests) }}</div>
      </div>
      <div class="ngx-kpi">
        <div class="ngx-kpi-label">配置文件</div>
        <div class="ngx-kpi-value">
          {{ overview?.configFileCount ?? "—" }}
          <span class="ngx-kpi-unit">{{ formatSize(overview?.configTotalSize) }}</span>
        </div>
      </div>
      <div class="ngx-kpi">
        <div class="ngx-kpi-label">监听端口</div>
        <div class="ngx-kpi-value">
          {{ overview?.listenPorts?.length ?? "—" }}
          <span v-if="overview?.listenPorts?.length" class="ngx-kpi-chips">
            <ReTag v-for="p in overview.listenPorts" :key="p" size="small" effect="dark" type="info">
              {{ p }}
            </ReTag>
          </span>
        </div>
      </div>
    </div>

    <!-- 趋势：活跃连接 / 每秒请求数（采集类指标原始值是累计计数，直接画是单调直线，
         必须用后端换算出来的 rate） -->
    <div class="ngx-card ngx-trend-card">
      <div class="ngx-card-head">
        <span class="ngx-card-title">24 小时趋势</span>
        <div class="ngx-trend-legend">
          <button
            v-for="s in TREND_SERIES"
            :key="s.name"
            type="button"
            class="ngx-trend-key"
            :class="{ 'is-off': !trendOn[s.name] }"
            :style="{ '--k': s.color }"
            @click="toggleSeries(s.name)"
          >
            <i class="ngx-trend-dot" />{{ s.label }}
          </button>
        </div>
        <ReButton size="small" text :loading="trendLoading" @click="loadTrend">
          <template #icon><ReIcon name="Refresh" :size="12" /></template>
        </ReButton>
      </div>

      <div v-if="!trendLoaded" class="ngx-trend-empty">
        <ReIcon name="Loading" :size="14" /> 正在读取趋势…
      </div>
      <ReAlert
        v-else-if="!hasTrend"
        type="info"
        :title="trend?.message || '最近 24 小时没有采集到数据'"
      />
      <div v-else class="ngx-trend-body">
        <svg class="ngx-trend-svg" :viewBox="`0 0 ${TREND_W} ${TREND_H}`" preserveAspectRatio="none">
          <g v-for="g in trendGridY" :key="g.y">
            <line :x1="0" :y1="g.y" :x2="TREND_W" :y2="g.y" class="ngx-trend-grid" />
            <text :x="4" :y="g.y - 3" class="ngx-trend-axis">{{ g.label }}</text>
          </g>
          <polyline
            v-for="s in visibleTrendSeries"
            :key="s.name"
            :points="s.points"
            fill="none"
            :stroke="s.color"
            stroke-width="1.6"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
        <div class="ngx-trend-foot">
          <span>{{ trendFromText }}</span>
          <span>{{ trendToText }}</span>
        </div>
        <div class="ngx-trend-note">
          请求速率为「每秒增量」。worker 重启后 nginx 计数器归零，该点断开不连线，
          避免被误读成流量暴跌。
        </div>
      </div>
    </div>

    <!-- Top 统计：来自 access log 解析（不入库，每次实时扫尾部） -->
    <div class="ngx-card ngx-top-card">
      <div class="ngx-card-head">
        <span class="ngx-card-title">访问 Top</span>
        <span class="ngx-card-sub">
          {{ topLabel }}
        </span>
        <ReButton size="small" text :loading="topLoading" @click="loadTop">
          <template #icon><ReIcon name="Refresh" :size="12" /></template>
        </ReButton>
      </div>

      <div v-if="!topLoaded" class="ngx-trend-empty">
        <ReIcon name="Loading" :size="14" /> 正在统计访问日志…
      </div>
      <ReAlert
        v-else-if="!top"
        type="info"
        :title="topErr || '暂无访问日志统计'"
      />
      <div v-else-if="!top.total" class="ngx-trend-empty">
        <ReIcon name="Document" :size="14" />
        {{ top.message || "access log 里没有可统计的记录" }}
      </div>
      <div v-else class="ngx-top-body">
        <!-- 状态码分布：横条，比例一眼可见 -->
        <div class="ngx-top-status">
          <div v-for="s in top.statuses" :key="s.category" class="ngx-top-status-row">
            <span class="ngx-top-status-name">{{ s.category }}</span>
            <span class="ngx-top-status-bar">
              <i
                :style="{
                  width: `${Math.max(2, s.pct)}%`,
                  background: statusColor(s.category),
                }"
              />
            </span>
            <span class="ngx-top-status-num">{{ s.pct }}%</span>
          </div>
        </div>
        <div class="ngx-top-cols">
          <div class="ngx-top-col">
            <div class="ngx-top-col-title">路径 Top {{ top.paths.length }}</div>
            <ul class="ngx-top-list">
              <li v-for="p in top.paths.slice(0, 6)" :key="p.key" class="ngx-top-item">
                <span class="ngx-top-key mono" :title="p.key">{{ p.key }}</span>
                <span class="ngx-top-hits">{{ p.hits }}</span>
              </li>
              <li v-if="!top.paths.length" class="ngx-top-none">无</li>
            </ul>
          </div>
          <div class="ngx-top-col">
            <div class="ngx-top-col-title">客户端 IP Top {{ top.ips.length }}</div>
            <ul class="ngx-top-list">
              <li v-for="p in top.ips.slice(0, 6)" :key="p.key" class="ngx-top-item">
                <span class="ngx-top-key mono" :title="p.key">{{ p.key }}</span>
                <span class="ngx-top-hits">{{ p.hits }}</span>
              </li>
              <li v-if="!top.ips.length" class="ngx-top-none">无</li>
            </ul>
          </div>
        </div>
        <div class="ngx-trend-note">{{ top.message }}</div>
      </div>
    </div>

    <!-- 三栏：连接状态分布 / 站点与端口 / 巡检提示 -->
    <div class="ngx-grid">
      <div class="ngx-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title">连接状态分布</span>
          <span v-if="overview?.status?.source" class="ngx-card-sub mono" :title="overview.status.source">
            {{ overview.status.source }}
          </span>
        </div>
        <template v-if="overview?.status?.available">
          <div class="ngx-bar">
            <div
              class="ngx-bar-seg is-reading"
              :style="{ flexGrow: Math.max(overview.status.reading ?? 0, 0.001) }"
              :title="`读取请求头 ${overview.status.reading ?? 0}`"
            />
            <div
              class="ngx-bar-seg is-writing"
              :style="{ flexGrow: Math.max(overview.status.writing ?? 0, 0.001) }"
              :title="`正在处理 ${overview.status.writing ?? 0}`"
            />
            <div
              class="ngx-bar-seg is-waiting"
              :style="{ flexGrow: Math.max(overview.status.waiting ?? 0, 0.001) }"
              :title="`空闲等待 ${overview.status.waiting ?? 0}`"
            />
          </div>
          <div class="ngx-legend">
            <span><i class="is-reading" />读取 {{ overview.status.reading ?? 0 }}</span>
            <span><i class="is-writing" />处理 {{ overview.status.writing ?? 0 }}</span>
            <span><i class="is-waiting" />等待 {{ overview.status.waiting ?? 0 }}</span>
          </div>
          <div class="ngx-meta">
            <span>接受 {{ formatNumber(overview.status.accepts) }}</span>
            <span>处理 {{ formatNumber(overview.status.handled) }}</span>
          </div>
        </template>
        <div v-else class="ngx-dim">
          {{ overview?.status?.message || "未取到 stub_status 实时数据，请在配置里加 stub_status;" }}
        </div>
      </div>

      <div class="ngx-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title">站点与端口</span>
        </div>
        <div v-if="overview?.listenPorts?.length" class="ngx-chips">
          <ReTag
            v-for="p in overview.listenPorts"
            :key="p"
            size="small"
            :type="p === 443 || p === 8443 ? 'success' : p === 80 || p === 8080 ? 'info' : 'warning'"
          >
            {{ p }}
          </ReTag>
        </div>
        <div v-else class="ngx-dim">未从配置里解析到 listen 指令</div>
        <div class="ngx-label">主配置</div>
        <div class="ngx-mono ngx-break">{{ overview?.configPath || "—" }}</div>
        <div class="ngx-label">配置根目录</div>
        <div class="ngx-mono ngx-break">{{ overview?.configRoot || "—" }}</div>
      </div>

      <div class="ngx-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title">巡检提示</span>
          <!-- 三态：出错 / 有问题 / 正常。
               原来只有 v-if(有 issues) / v-else 两态，overview 为 null（接口失败）
               时会掉进 v-else 显示「一切正常」，等于没取到数据却报正常。 -->
          <ReTag v-if="loadError" size="small" type="danger">未取到数据</ReTag>
          <ReTag v-else-if="!overview" size="small" type="info">加载中</ReTag>
          <ReTag v-else-if="overview.issues?.length" size="small" type="warning">
            {{ overview.issues.length }} 条
          </ReTag>
          <ReTag v-else size="small" type="success">一切正常</ReTag>
        </div>
        <ul v-if="loadError" class="ngx-issues">
          <li>{{ loadError }}</li>
        </ul>
        <ul v-else-if="overview?.issues?.length" class="ngx-issues">
          <li v-for="(issue, i) in overview.issues" :key="i">{{ issue }}</li>
        </ul>
        <div v-else-if="!overview" class="ngx-ok">
          <ReIcon name="Loading" :size="15" class="ngx-ok-icon" />
          <span>正在读取实例状态…</span>
        </div>
        <div v-else class="ngx-ok">
          <ReIcon name="CircleCheckFilled" :size="15" class="ngx-ok-icon" />
          <span>未发现问题：进程在跑、配置语法通过、实时状态可读。</span>
        </div>
      </div>
    </div>

    <!-- 编译参数：默认折叠，点标题展开 -->
    <div class="ngx-card">
      <div class="ngx-card-head is-clickable" @click="showArgs = !showArgs">
        <span class="ngx-card-title">
          <ReIcon name="DocumentCopy" :size="14" />
          编译参数
        </span>
        <span class="ngx-card-sub">
          决定本机能用哪些模块与指令
          <ReIcon :name="showArgs ? 'ArrowUp' : 'ArrowDown'" :size="13" />
        </span>
      </div>
      <pre v-if="showArgs" class="ngx-conf">{{ overview?.version?.configureArguments || "—" }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  fetchNginxAccessTop,
  fetchNginxOverview,
  fetchNginxTrend,
  type NginxAccessTop,
  type NginxOverview,
  type NginxTrend,
} from "../../nginx/api";

const props = defineProps<{
  /** 加载中的状态由父级控制 */
  loading: boolean;
  /** 数据源 ID */
  datasourceId?: number;
  /** 总览数据 */
  overview: NginxOverview | null;
  /** 总览加载失败原因；非空时显示「未取到数据」而不是误报「一切正常」 */
  loadError?: string;
  /** 实例接入点，形如 host:port，用于 Hero 的「监听地址」 */
  endpoint?: string;
}>();

const emit = defineEmits<{
  (e: "changed"): void;
}>();

/** 编译参数默认折叠（内容长，展开会挤占版面） */
const showArgs = ref(false);

// ==================== 24 小时趋势 ====================

/** SVG 画布尺寸（viewBox 坐标，与实际像素解耦，容器自适应拉伸） */
const TREND_W = 600;
const TREND_H = 140;

/** 趋势曲线配色：跟 KPI 卡一致，用状态色而不是新的品牌色 */
const TREND_SERIES = [
  { name: "active", label: "活跃连接", color: "var(--metric-cpu, var(--el-color-primary))" },
  { name: "requests", label: "每秒请求", color: "var(--status-success, var(--el-color-success))" },
] as const;

/** 折线序列的名字集合 */
type TrendName = (typeof TREND_SERIES)[number]["name"];

const trend = ref<NginxTrend | null>(null);
const trendLoading = ref(false);
const trendLoaded = ref(false);
/** 图例开关：默认全开 */
const trendOn = ref<Record<string, boolean>>({ active: true, requests: true });

const trendSeries = computed(() =>
  (trend.value?.points ?? []).reduce<Record<string, { time: number; value: number }[]>>((acc, p) => {
    const v = p.rate;
    if (v == null) {
      return acc;
    }
    (acc[p.name] ??= []).push({ time: Date.parse(p.time), value: v });
    return acc;
  }, {}),
);

/**
 * 是否至少有一条序列拿到了数据点。
 *
 * <p>必须用 Object.keys 取长度：trendSeries 是「序列名 → 点数组」的映射，
 * 是对象不是数组，对象没有 length 属性。这里原先写的是
 * `v-else-if="!trendSeries.length"`，取到 undefined、取反恒为 true，
 * 于是趋势图永远落进空态分支，曲线一次都没画出来过 —— 而后端一直正常
 * 返回数据（实测 24h 窗口内 175 个点），看起来就像「采集没工作」。</p>
 */
const hasTrend = computed(() => Object.keys(trendSeries.value).length > 0);

/** 当前打开的序列（已过滤图例开关） */
const visibleTrendSeries = computed(() => {
  const all = trendSeries.value;
  return TREND_SERIES.filter(s => trendOn.value[s.name]).map(s => {
    const points = (all[s.name] ?? []).filter(p => Number.isFinite(p.value));
    return { ...s, points: points.length ? toPolyline(points) : "" };
  }).filter(s => s.points);
});

/**
 * 把数据点转成 SVG polyline 的 points 字符串。
 *
 * <p>横轴按时间等分而不是按序号：采集可能缺点（SSH 抖动），按序号排会把时间轴拉歪。</p>
 */
function toPolyline(points: { time: number; value: number }[]): string {
  const times = points.map(p => p.time);
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const spanT = Math.max(1, tMax - tMin);
  const vMax = Math.max(...points.map(p => p.value), 0.0001);
  return points
    .map(p => {
      const x = ((p.time - tMin) / spanT) * TREND_W;
      // 顶部留 6px、底部留 4px 的余量，曲线不贴边
      const y = TREND_H - 4 - (p.value / vMax) * (TREND_H - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** 纵轴刻度（4 条等分线） */
const trendGridY = computed(() => {
  const all = Object.values(trendSeries.value).flat();
  const vMax = Math.max(...all.map(p => p.value), 0.0001);
  return [0.75, 0.5, 0.25, 0].map(ratio => {
    const value = vMax * ratio;
    return {
      y: TREND_H - 4 - ratio * (TREND_H - 10),
      label: formatNumber(Math.round(value * 100) / 100),
    };
  });
});

/** 起止时间文案 */
const trendFromText = computed(() => trend.value ? new Date(trend.value.from).toLocaleTimeString("zh-CN", { hour12: false }) : "");
const trendToText = computed(() => trend.value ? new Date(trend.value.to).toLocaleTimeString("zh-CN", { hour12: false }) : "");

function toggleSeries(name: string): void {
  trendOn.value = { ...trendOn.value, [name]: !trendOn.value[name] };
}

async function loadTrend(): Promise<void> {
  if (!props.datasourceId) {
    trend.value = null;
    trendLoaded.value = true;
    return;
  }
  trendLoading.value = true;
  try {
    trend.value = await fetchNginxTrend(props.datasourceId, 24, 30);
  } catch (e) {
    trend.value = null;
    trendLoaded.value = true;
  } finally {
    trendLoading.value = false;
    trendLoaded.value = true;
  }
}

// ==================== 访问 Top（access log 解析） ====================

const top = ref<NginxAccessTop | null>(null);
const topLoading = ref(false);
const topLoaded = ref(false);
const topErr = ref("");

/** 头部说明：把「扫了多少行」讲清楚，避免被误读成全量统计 */
const topLabel = computed(() => {
  if (!top.value?.total) {
    return "实时扫描日志尾部";
  }
  return `解析 ${top.value.total}/${top.value.scanned} 行`;
});

/** 状态码类别配色：走状态令牌，暗色下自动跟随 */
function statusColor(category: string): string {
  if (category.startsWith("2")) {
    return "var(--status-success, var(--el-color-success))";
  }
  if (category.startsWith("3")) {
    return "var(--metric-cpu, var(--el-color-primary))";
  }
  if (category.startsWith("4")) {
    return "var(--status-warning, var(--el-color-warning))";
  }
  if (category.startsWith("5")) {
    return "var(--status-error, var(--el-color-danger))";
  }
  return "var(--el-text-color-secondary)";
}

async function loadTop(): Promise<void> {
  if (!props.datasourceId) {
    top.value = null;
    topLoaded.value = true;
    return;
  }
  topLoading.value = true;
  topErr.value = "";
  try {
    top.value = await fetchNginxAccessTop(props.datasourceId, 2000, 0, 10);
  } catch (e) {
    top.value = null;
    topErr.value = (e as Error)?.message || String(e);
  } finally {
    topLoading.value = false;
    topLoaded.value = true;
  }
}

// 切换数据源时重新拉趋势与 Top。
//
// 位置很关键：这段必须放在上面两段状态声明（trendLoaded / topLoaded）之后。
// immediate: true 会让回调在 setup 执行期间同步跑一遍，而回调里要写
// trendLoaded 和 topLoaded —— 声明写在 watch 之前/之后的顺序颠倒会踩
// const 的暂时性死区，抛 ReferenceError 让整个 setup 失败，表现为
// 「面板整块空白、但没有任何编译错误」，vue-tsc 也查不出来（TDZ 是运行期问题）。
watch(
  () => props.datasourceId,
  id => {
    trendLoaded.value = false;
    topLoaded.value = false;
    if (id) {
      void loadTrend();
      void loadTop();
    }
  },
  { immediate: true },
);

/**
 * Hero 主状态文案。
 *
 * <p>与顶栏状态胶囊（NginxManageView#statusText）保持同一套三态判定：加载中 /
 * 未取到数据 / 状态未知。两处各写一份是重复，但它们分属父子组件、props 契约不同，
 * 强行抽公共函数反而要跨组件传 props；这里用注释互相锚定，改一处记得同步另一处。
 * 不区分加载态的后果是：首屏那一两秒 Hero 显示「状态未知」，和「nginx 真停了」一样，
 * 排查时会被直接带偏。</p>
 */
const runningText = computed(() => {
  const r = props.overview?.running;
  if (r === "RUNNING") {
    return "运行中";
  }
  if (r === "STOPPED") {
    return "已停止";
  }
  if (props.loadError) {
    return "未取到数据";
  }
  if (props.loading && !props.overview) {
    return "加载中";
  }
  return "状态未知";
});

const heroClass = computed(() => {
  const r = props.overview?.running;
  if (r === "RUNNING") {
    return "is-running";
  }
  if (r === "STOPPED") {
    return "is-stopped";
  }
  if (props.loadError) {
    return "is-error";
  }
  if (props.loading && !props.overview) {
    return "is-loading";
  }
  return "is-unknown";
});

/** 图标随状态走：加载中用转圈样式的问题交给 v-loading，这里只区分「问号 / 播放 / 暂停」 */
const heroIcon = computed(() => {
  const r = props.overview?.running;
  if (r === "RUNNING") {
    return "VideoPlay";
  }
  if (r === "STOPPED") {
    return "VideoPause";
  }
  return "QuestionFilled";
});

/** 千分位；空值显示为破折号 */
function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) {
    return "—";
  }
  return n.toLocaleString("en-US");
}

/** 字节数转可读文本 */
function formatSize(bytes: number | null | undefined): string {
  if (!bytes) {
    return "";
  }
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

defineExpose({ formatSize, formatNumber, fetchNginxOverview, emit });
</script>

<style scoped lang="scss">
/* 色值全部走 koi / Element 令牌，暗色由 html.dark 自动覆盖 */
.ngx-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============ Hero 状态卡 ============ */
.ngx-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 20px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ngx-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  border-radius: 9999px;
  color: var(--el-color-white);
  background: var(--el-color-info);

  .is-running & {
    background: var(--el-color-success);
    box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--el-color-success) 65%, transparent);
  }

  .is-stopped & {
    background: var(--el-color-danger);
    box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--el-color-danger) 65%, transparent);
  }

  /* 未取到数据：橙黄，与「已停止」的红一眼可辨。
     缺这一条时取数失败会退回 is-unknown，图标是中性灰 + 问号，
     看起来像「服务状态未知」，实际是「我们没取到」，两回事。 */
  .is-error & {
    background: var(--el-color-warning);
    box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--el-color-warning) 65%, transparent);
  }

  /* 加载中：中性灰蓝 + 呼吸，和静态的问号图标区分开 */
  .is-loading & {
    background: var(--el-color-info);
    animation: ngx-hero-breathe 1.2s ease-in-out infinite;
  }
}

@keyframes ngx-hero-breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.ngx-hero-title {
  min-width: 150px;
}

.ngx-hero-name {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.ngx-hero-sub {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 四项事实：小屏折行 */
.ngx-hero-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 20px;
  flex: 1;
  min-width: 320px;
}

@media (max-width: 1100px) {
  .ngx-hero-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ngx-fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ngx-fact-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngx-fact-value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ============ KPI 行 ============ */
.ngx-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
  .ngx-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ngx-kpi {
  padding: 13px 16px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ngx-kpi-label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.ngx-kpi-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.ngx-kpi-unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.ngx-kpi-chips {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* ============ 三栏卡片 ============ */
/* ============ 访问 Top ============ */
.ngx-top-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ngx-top-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 状态码分布：名称 / 比例条 / 数值 三列 */
.ngx-top-status {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ngx-top-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.ngx-top-status-name {
  flex: 0 0 96px;
  color: var(--el-text-color-regular);
}

.ngx-top-status-bar {
  flex: 1 1 auto;
  height: 8px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.ngx-top-status-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  /* 只过渡 transform 类的视觉属性由下面 width 控制；这里宽度随数据变化，
     属于数据驱动而非交互反馈，不做过渡避免刷新时闪一下 */
}

.ngx-top-status-num {
  flex: 0 0 44px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.ngx-top-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .ngx-top-cols {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ngx-top-col-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.ngx-top-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ngx-top-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 12.5px;
  /* 两条列表按行等高，视觉上更整齐 */
  min-height: 24px;
}

.ngx-top-key {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.ngx-top-hits {
  flex: none;
  padding: 1px 7px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.ngx-top-none {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ============ 24 小时趋势 ============ */
.ngx-trend-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ngx-trend-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.ngx-trend-key {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), background-color var(--el-transition-duration, 0.2s);

  &:hover {
    background: var(--el-fill-color-light);
  }

  /* 关掉的序列淡化，但保留图例位置，避免开合时整行跳动 */
  &.is-off {
    color: var(--el-text-color-placeholder);
    opacity: 0.55;
  }
}

.ngx-trend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--k);
}

.ngx-trend-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 120px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ngx-trend-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ngx-trend-svg {
  width: 100%;
  height: 140px;
  display: block;
}

.ngx-trend-grid {
  stroke: var(--el-border-color-lighter);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.ngx-trend-axis {
  fill: var(--el-text-color-placeholder);
  font-size: 9px;
}

.ngx-trend-foot {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

.ngx-trend-note {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.ngx-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
  .ngx-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ngx-card {
  padding: 14px 16px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ngx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &.is-clickable {
    cursor: pointer;
    user-select: none;
  }
}

.ngx-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ngx-card-sub {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.ngx-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 10px 0 4px;
}

.ngx-dim {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.7;
}

.ngx-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.ngx-break {
  word-break: break-all;
}

.ngx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 连接分布条 */
.ngx-bar {
  display: flex;
  height: 10px;
  margin-top: 14px;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.ngx-bar-seg {
  min-width: 2px;
  transition: flex-grow 0.4s ease;

  &.is-reading {
    background: var(--el-color-primary);
  }
  &.is-writing {
    background: var(--el-color-warning);
  }
  &.is-waiting {
    background: var(--el-color-success);
  }
}

.ngx-legend {
  display: flex;
  gap: 14px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 4px;

    &.is-reading {
      background: var(--el-color-primary);
    }
    &.is-writing {
      background: var(--el-color-warning);
    }
    &.is-waiting {
      background: var(--el-color-success);
    }
  }
}

.ngx-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 巡检：正常态用绿色对勾 */
.ngx-ok {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 12px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.ngx-ok-icon {
  color: var(--el-color-success);
  flex: 0 0 auto;
  margin-top: 2px;
}

.ngx-issues {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-text-color-regular);

  li::marker {
    color: var(--el-color-warning);
  }
}

.ngx-conf {
  margin: 12px 0 0;
  max-height: 200px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
}
</style>
