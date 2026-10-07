<template>
  <div class="ngx-overview">
    <!-- 首屏骨架屏。
         只在「首次」加载时出现：loaded 一旦为 true 就不再退回骨架，
         否则每次刷新（SSE 推帧后 reload）都会整页闪一下，用户以为页面在重载。
         用 v-if 二选一而不是 v-show + 遮罩：v-show 会让真实 DOM 与骨架同时渲染，
         既抢不到正确的层叠高度，也会让读屏软件念到两遍内容。 -->
    <div v-if="loading && !loaded" class="ngx-skeleton" aria-busy="true" aria-label="总览加载中">
      <!-- Hero 骨架：左侧圆角图标块 + 两行文字，右侧四个事实位。
           圆形占位用 class 实现而不用 <template #template>：
           具名插槽会在 SFC 顶层 template 里再嵌一层 <template>，
           parser 会把它与下面的 <template v-else> 混在一起报 "missing end tag"。

           每处都必须显式写 loading：ReSkeleton 把该 prop 的默认值设成了 false，
           而 el-skeleton 的语义是 loading=true 才显示骨架。少写这个 prop 骨架就是不渲染，
           表现为「骨架元素在 DOM 里但一片空白」，极难看出是 prop 默认值的问题。 -->
      <div class="ngx-skel-hero">
        <ReSkeleton loading animated :rows="0" class="ngx-skel-hero-icon ngx-skel-round" />
        <div class="ngx-skel-hero-text">
          <ReSkeleton loading animated :rows="2" />
        </div>
        <div class="ngx-skel-hero-facts">
          <ReSkeleton v-for="i in 4" :key="i" loading animated :rows="2" />
        </div>
      </div>

      <!-- KPI 骨架：四列，与真实 .ngx-kpis 的网格一致 -->
      <div class="ngx-skel-kpis">
        <ReSkeleton v-for="i in 4" :key="i" loading animated :rows="2" />
      </div>

      <!-- 图表骨架：占住与真实图表相同的盒子，避免加载完成后布局跳动 -->
      <div class="ngx-card ngx-skel-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title ngx-skel-block ngx-skel-w-sm" />
        </div>
        <div class="ngx-skel-chart">
          <ReSkeleton loading animated :rows="6" />
        </div>
      </div>
    </div>

    <template v-else>
    <!-- Hero：运行态 + 实例元信息（对应 UI 图主状态卡） -->
    <div class="ngx-hero" :class="heroClass">
      <div class="ngx-hero-icon">
        <ReIcon :name="heroIcon" :size="26" />
      </div>
      <div class="ngx-hero-title">
        <div class="ngx-hero-name">{{ runningText }}</div>
        <div class="ngx-hero-sub">{{ healthText }}</div>
        <!-- 丢弃连接并进 Hero：它平时恒为 0，单独占一张卡不值；
             但一旦 >0 就说明 accept 队列溢出，必须在第一屏显眼处报出来。 -->
        <div v-if="droppedConnections !== null && droppedConnections > 0" class="ngx-hero-alert">
          <ReIcon name="Warning" :size="12" />
          已丢弃连接 {{ formatNumber(droppedConnections) }}：accept 队列溢出（backlog 不够 / worker 忙不过来）
        </div>
      </div>
      <div class="ngx-hero-facts">
        <div class="ngx-fact">
          <span class="ngx-fact-label">主进程</span>
          <span class="ngx-fact-value mono">{{ liveOverview?.masterPid ? `PID ${liveOverview.masterPid}` : "—" }}</span>
        </div>
        <div class="ngx-fact">
          <span class="ngx-fact-label">已运行</span>
          <span class="ngx-fact-value mono">{{ liveOverview?.uptimeText || "—" }}</span>
        </div>
        <div class="ngx-fact">
          <span class="ngx-fact-label">监听地址</span>
          <span class="ngx-fact-value mono">{{ endpoint || "—" }}</span>
        </div>
        <div class="ngx-fact" :title="KPI_HINTS.dropped">
          <span class="ngx-fact-label">丢弃连接</span>
          <span class="ngx-fact-value mono" :class="{ 'is-bad': droppedConnections !== null && droppedConnections > 0 }">
            {{ droppedConnections === null ? "—" : formatNumber(droppedConnections) }}
          </span>
        </div>
      </div>
    </div>

    <!-- KPI：一行四张，不再往下堆。
         之前拆成 12 张（活跃/请求/配置/端口 + 接受/处理/丢弃/流量 + 4xx/5xx/IP/错误率），
         问题是每张只放一个数字，视线要来回扫，且把真正要看的趋势图挤到了屏幕下方。
         现在按「一个维度一张卡」合并，卡内用小字给出细分数字：
           活跃连接 ← 读取/写入/等待在下面的环形图里，不再重复占位
           请求速率 ← 累计请求降为副信息
           错误率   ← 4xx 与 5xx 合并成副信息
           出站流量 ← 独立访客 IP 降为副信息
         丢弃连接并进 Hero 的告警区：它平时是 0，单独占一张卡不值，
         但一旦 >0 必须在第一屏显眼处报出来。 -->
    <div class="ngx-kpis">
      <div class="ngx-kpi" :style="{ '--k': 'var(--metric-cpu, var(--el-color-primary))' }" :title="KPI_HINTS.active">
        <div class="ngx-kpi-label"><i class="ngx-kpi-dot" />活跃连接</div>
        <div class="ngx-kpi-value">{{ liveOverview?.status?.activeConnections ?? "—" }}</div>
        <div class="ngx-kpi-foot">
          <span class="ngx-kpi-sub">
            读取 {{ liveOverview?.status?.reading ?? "—" }} ·
            写入 {{ liveOverview?.status?.writing ?? "—" }} ·
            等待 {{ liveOverview?.status?.waiting ?? "—" }}
          </span>
          <Sparkline class="ngx-kpi-spark" :values="sparkActive" token="--metric-cpu" />
        </div>
      </div>

      <div class="ngx-kpi" :style="{ '--k': 'var(--metric-disk, var(--el-color-warning))' }" :title="KPI_HINTS.requests">
        <div class="ngx-kpi-label"><i class="ngx-kpi-dot" />每秒请求</div>
        <div class="ngx-kpi-value">
          {{ trendRequestRate ?? "—" }}<span class="ngx-kpi-unit">req/s</span>
        </div>
        <div class="ngx-kpi-foot">
          <span class="ngx-kpi-sub">
            区间峰值 {{ requestsPeak === null ? "—" : `${requestsPeak} req/s` }} ·
            累计 {{ formatNumber(liveOverview?.status?.requests) }}
          </span>
          <Sparkline class="ngx-kpi-spark" :values="sparkRequests" token="--metric-disk" />
        </div>
      </div>

      <div
        class="ngx-kpi"
        :class="{ 'is-warn': top?.clientErrors, 'is-bad': top?.serverErrors }"
        :style="{ '--k': 'var(--status-success, var(--el-color-success))' }"
        :title="KPI_HINTS.errorRate"
      >
        <div class="ngx-kpi-label"><i class="ngx-kpi-dot" />错误率</div>
        <div class="ngx-kpi-value">
          <template v-if="errorRatePct === null">—</template>
          <template v-else>{{ errorRatePct }}<span class="ngx-kpi-unit">%</span></template>
        </div>
        <div class="ngx-kpi-foot">
          <span class="ngx-kpi-sub">
            4xx {{ topLoaded ? (top?.clientErrors ?? 0) : "—" }} ·
            5xx {{ topLoaded ? (top?.serverErrors ?? 0) : "—" }}
          </span>
        </div>
      </div>

      <div
        class="ngx-kpi"
        :style="{ '--k': 'var(--metric-mem, var(--el-color-primary))' }"
        :title="KPI_HINTS.bytes"
      >
        <div class="ngx-kpi-label"><i class="ngx-kpi-dot" />出站流量</div>
        <div class="ngx-kpi-value">
          <template v-if="top?.bytesSent != null">{{ formatSize(top.bytesSent) }}</template>
          <template v-else-if="topLoaded">无法统计</template>
          <template v-else>—</template>
        </div>
        <div class="ngx-kpi-foot">
          <span class="ngx-kpi-sub">
            <template v-if="topLoaded">独立访客 IP {{ uniqueIpCount }}</template>
            <template v-else>按本次扫描口径</template>
          </span>
        </div>
      </div>
    </div>

    <!-- 趋势：活跃连接 / 每秒请求数（采集类指标原始值是累计计数，直接画是单调直线，
         必须用后端换算出来的 rate） -->
    <div class="ngx-card ngx-trend-card">
      <div class="ngx-card-head">
        <span class="ngx-card-title">24 小时趋势</span>
        <span class="ngx-card-sub">数据来自 stub_status · 每 {{ trend?.interval ?? 30 }} 分钟采集</span>
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
        <ReButton text tip="刷新趋势" :loading="trendLoading" @click="loadTrend">
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
        <NginxTrendChart
          :series="chartSeries"
          :url-series="urlTrendSeries"
          url-title="URL 访问趋势"
          :height="190"
        />
        <div class="ngx-trend-foot">
          <span>{{ trendFromText }}</span>
          <span class="ngx-trend-live">
            <i :class="['ngx-trend-live-dot', `is-${streamState}`]" />
            {{ streamHint }}
          </span>
          <span>{{ trendToText }}</span>
        </div>
        <div class="ngx-trend-note">
          请求速率为「每秒增量」。worker 重启后 nginx 计数器归零，该点断开不连线，
          避免被误读成流量暴跌。
        </div>
        <!-- 覆盖区间必须显式写出：右边那块来自 access log 尾部，跨度由日志密度决定，
             不是固定 24 小时。不标出来就会有人把 3 分钟的曲线当成 3 小时看。 -->
        <div class="ngx-trend-note">
          <template v-if="urlTrendRangeText">
            右侧 URL 访问趋势扫的是 access log 尾部，
            <strong>实际覆盖 {{ urlTrendRangeText }}</strong>，与左侧 24 小时窗口不是同一尺度。
          </template>
          <template v-else>右侧 URL 访问趋势暂无数据（access log 尾部没有可解析的记录）。</template>
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
        <ReButton text tip="刷新访问 Top" :loading="topLoading" @click="loadTop">
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
        <!-- 状态码分布（2xx/3xx/4xx/5xx）：参考稿里没有这一块，但它是唯一能看到
             「成功/重定向各占多少」的地方，KPI 卡只给了 4xx/5xx 两个数。
             删掉它等于为了贴图而丢信息，故保留，排在两列 Top 之上。 -->
        <NginxStatusBarChart :items="top.statuses" :height="Math.max(88, top.statuses.length * 26)" />
        <div class="ngx-top-cols">
          <div class="ngx-top-col">
            <div class="ngx-top-col-title">访问路径</div>
            <ul class="ngx-top-list">
              <li v-for="p in top.paths.slice(0, 6)" :key="p.key" class="ngx-top-item">
                <span class="ngx-top-key mono" :title="p.key">{{ p.key }}</span>
                <span class="ngx-top-hits">
                  {{ p.hits.toLocaleString("en-US") }}
                  <i class="ngx-top-pct">{{ pctOfTop(p.hits) }}%</i>
                </span>
                <span class="ngx-top-track">
                  <span class="ngx-top-fill" :style="{ width: `${pctOfTop(p.hits)}%` }" />
                </span>
              </li>
              <li v-if="!top.paths.length" class="ngx-top-none">无</li>
            </ul>
          </div>
          <div class="ngx-top-col">
            <div class="ngx-top-col-title">来源 IP</div>
            <ul class="ngx-top-list">
              <li v-for="p in top.ips.slice(0, 6)" :key="p.key" class="ngx-top-item">
                <span class="ngx-top-key mono" :title="p.key">{{ p.key }}</span>
                <span class="ngx-top-hits">
                  {{ p.hits.toLocaleString("en-US") }}
                  <i class="ngx-top-pct">{{ pctOfTop(p.hits) }}%</i>
                </span>
                <span class="ngx-top-track">
                  <span class="ngx-top-fill is-ip" :style="{ width: `${pctOfTop(p.hits)}%` }" />
                </span>
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
          <span v-if="liveOverview?.status?.source" class="ngx-card-sub mono" :title="liveOverview.status.source">
            {{ liveOverview.status.source }}
          </span>
        </div>
        <template v-if="liveOverview?.status?.available">
          <NginxConnDonut
            :reading="liveOverview.status.reading"
            :writing="liveOverview.status.writing"
            :waiting="liveOverview.status.waiting"
            :height="150"
          />
          <div class="ngx-meta">
            <span>接受 {{ formatNumber(liveOverview.status.accepts) }}</span>
            <span>处理 {{ formatNumber(liveOverview.status.handled) }}</span>
          </div>
        </template>
        <div v-else class="ngx-dim">
          {{ liveOverview?.status?.message || "未取到 stub_status 实时数据，请在配置里加 stub_status;" }}
        </div>
      </div>

      <div class="ngx-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title">站点与端口</span>
        </div>
        <div v-if="liveOverview?.listenPorts?.length" class="ngx-chips">
          <ReTag
            v-for="p in liveOverview.listenPorts"
            :key="p"
            
            :type="p === 443 || p === 8443 ? 'success' : p === 80 || p === 8080 ? 'info' : 'warning'"
          >
            {{ p }}
          </ReTag>
        </div>
        <div v-else class="ngx-dim">未从配置里解析到 listen 指令</div>
        <div class="ngx-label">主配置</div>
        <div class="ngx-path-row">
          <ReIcon name="Document" :size="13" />
          <span class="ngx-mono ngx-break">{{ liveOverview?.configPath || "—" }}</span>
          <!-- 「已校验」只在真的跑过 nginx -t 且无 issue 时打勾；
               没取到数据时不显示，免得看起来像校验通过了 -->
          <ReTag v-if="liveOverview && !liveOverview.issues?.length" type="success" effect="plain">已校验</ReTag>
        </div>
        <div class="ngx-label">配置根目录</div>
        <div class="ngx-path-row">
          <ReIcon name="Folder" :size="13" />
          <span class="ngx-mono ngx-break">{{ liveOverview?.configRoot || "—" }}</span>
        </div>
      </div>

      <div class="ngx-card">
        <div class="ngx-card-head">
          <span class="ngx-card-title">巡检提示</span>
          <!-- 三态：出错 / 有问题 / 正常。
               原来只有 v-if(有 issues) / v-else 两态，overview 为 null（接口失败）
               时会掉进 v-else 显示「一切正常」，等于没取到数据却报正常。 -->
          <ReTag v-if="loadError"  type="danger">未取到数据</ReTag>
          <ReTag v-else-if="!liveOverview"  type="info">加载中</ReTag>
          <ReTag v-else-if="liveOverview.issues?.length"  type="warning">
            {{ liveOverview.issues.length }} 条
          </ReTag>
          <ReTag v-else  type="success">一切正常</ReTag>
        </div>
        <ul v-if="loadError" class="ngx-issues">
          <li>{{ loadError }}</li>
        </ul>
        <ul v-else-if="liveOverview?.issues?.length" class="ngx-issues">
          <li v-for="(issue, i) in liveOverview.issues" :key="i">{{ issue }}</li>
        </ul>
        <div v-else-if="!liveOverview" class="ngx-ok">
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
      <pre v-if="showArgs" class="ngx-conf">{{ liveOverview?.version?.configureArguments || "—" }}</pre>
    </div>
    <!-- /v-else：首屏骨架屏 -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReTag from "@repo/ui/re-tag";
import { ReAlert } from "@repo/ui/re-kit";
import {
  fetchNginxAccessTop,
  fetchNginxOverview,
  fetchNginxTrend,
  fetchNginxUrlTrend,
  type NginxAccessTop,
  type NginxOverview,
  type NginxRuntime,
  type NginxTrend,
  type NginxTrendPoint,
  type NginxUrlTrend,
} from "../../api/nginx/api";
import { mergePoints, useNginxStream } from "../../nginx/useNginxStream";
import type { TrendSeriesInput, UrlTrendSeriesInput } from "./charts/useEchart";
import NginxTrendChart from "./charts/NginxTrendChart.vue";
import NginxStatusBarChart from "./charts/NginxStatusBarChart.vue";
import NginxConnDonut from "./charts/NginxConnDonut.vue";
import Sparkline from "./charts/Sparkline.vue";
import ReSkeleton from "@repo/ui/re-skeleton";

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

/**
 * 首屏是否已渲染过真实内容。
 *
 * <p>骨架屏只在「首次」加载时出现：拿到第一份数据（含加载失败）之后就置 true，
 * 此后即使父级把 {@code loading} 重新拉高（SSE 推帧触发的后台刷新）也不再退回骨架。
 * 否则每隔几秒整页闪一次，用户会以为页面在反复重载。</p>
 *
 * <p>声明必须排在 {@code defineProps} 之后：下面几个 watch 的 getter 都要读
 * {@code props.xxx}，而 {@code const props} 走的是 TDZ，写在前面会抛
 * “Cannot access 'props' before initialization”，整页白屏而不是局部降级。</p>
 */
const loaded = ref(false);

/** 数据到齐或失败都算「首屏结束」——失败时该显示错误提示，不该永远停在骨架上 */
const markLoaded = () => {
  loaded.value = true;
};

/** 各 KPI 的悬停说明。这些口径不看说明容易被误读，故全部显式写出来 */
const KPI_HINTS = {
  active: "当前正在处理的连接数。读取 / 写入 / 等待的拆分见下方「连接状态分布」环形图",
  requests: "每秒请求数由采集器按相邻两点差值算出；累计值降为副信息",
  dropped:
    "累计接受 − 已处理。持续增长说明 accept 队列溢出（backlog 不够 / worker 忙不过来 / fd 或内存压力），"
    + "是 nginx 最需要提前发现的信号",
  bytes: "本次扫描到的 access log 里 $body_bytes_sent 之和（响应体字节，不等于网络带宽）",
  errorRate: "（4xx + 5xx）÷ 已解析行数。分母只算能解析出格式的行，格式不匹配的行不计入"
} as const;

/**
 * 被内核丢弃的连接数 = accepts − handled。
 *
 * <p>null 表示算不出来（stub_status 不可用或两个字段缺一个），界面据此显示「—」。
 * 刻意不用 0：把「不知道」显示成 0 会让人以为连接一个都没丢。</p>
 */
const droppedConnections = computed<number | null>(() => {
  const st = props.overview?.status;
  if (!st || st.accepts == null || st.handled == null) {
    return null;
  }
  // 理论上 accepts ≥ handled；出现负数说明两个数取自不同时刻（期间重启过），此时按 0 显示
  return Math.max(0, st.accepts - st.handled);
});

/** 独立访客 IP 总数（后端给的真实总数，不是 Top 榜长度——那只含前 N 名） */
const uniqueIpCount = computed(() => top.value?.uniqueIps ?? 0);

/**
 * 错误率百分比（一位小数）。
 *
 * <p>分母用 {@code total}（成功解析的行数）而不是 {@code scanned}（扫描行数）：
 * 格式不匹配的行不构成「请求」，算进分母会把错误率人为压低。</p>
 */
const errorRatePct = computed<number | null>(() => {
  if (!topLoaded.value || !top.value || !top.value.total) {
    return null;
  }
  const errs = (top.value.clientErrors ?? 0) + (top.value.serverErrors ?? 0);
  return Math.round((errs / top.value.total) * 1000) / 10;
});

// 结束条件一：拿到数据或拿到错误原因。
watch(
  () => [props.overview, props.loadError],
  () => {
    if (props.overview || props.loadError) {
      markLoaded();
    }
  },
  { immediate: true },
);

// 结束条件二：loading 从「true」落回「false」。
//
// 这里必须比 old === true，不能写成「!v 就置位」：父组件的 overviewLoading
// 初始值本来就是 false（请求还没发出），组件挂载那一刻它也是 false。
// 一旦按「!v」判定，immediate 会在挂载瞬间就把 loaded 置 true，
// 骨架屏从此再也不出现——这正是第一版实测「真实内容渲染了但骨架没出现」的原因。
// 只有观察到 true → false 的下降沿，才说明确实加载过一轮。
watch(
  () => props.loading,
  (v, old) => {
    if (!v && old === true) {
      markLoaded();
    }
  },
);

// 换数据源时重新走一次首屏：旧实例的骨架状态不能带过去，
// 否则切到新数据源后会直接显示上一个实例残留的旧内容。
watch(
  () => props.datasourceId,
  () => {
    loaded.value = false;
  },
);

const emit = defineEmits<{
  (e: "changed"): void;
}>();

/** 编译参数默认折叠（内容长，展开会挤占版面） */
const showArgs = ref(false);

// ==================== 24 小时趋势 ====================

/**
 * 趋势曲线配色。
 *
 * <p><strong>存的是令牌名而不是 `var(--x)` 串</strong>：ECharts 画在 canvas 上，
 * 认不出 CSS 变量，必须拿到解析后的颜色值。图表组件在渲染时用
 * `getComputedStyle` 读这里的令牌，所以亮暗主题切换后颜色会跟着变。
 * 模板里的图例小圆点仍用 `--k: s.color` 注入 `var()`，两条路径同源。</p>
 */
const TREND_SERIES = [
  { name: "active", label: "活跃连接", color: "--metric-cpu" },
  { name: "requests", label: "每秒请求", color: "--status-success" },
] as const;

/** 折线序列的名字集合 */
type TrendName = (typeof TREND_SERIES)[number]["name"];

const trend = ref<NginxTrend | null>(null);
const trendLoading = ref(false);
const trendLoaded = ref(false);
/** 图例开关：默认全开 */
const trendOn = ref<Record<string, boolean>>({ active: true, requests: true });

/**
 * 按指标名归组的曲线点。
 *
 * <p><strong>null 必须留着当断点</strong>：worker 重启后累计计数归零，
 * 后端把该点的 `rate` 置 null。原先这里是 `if (v == null) return acc` 直接丢弃，
 * 于是重启点被前后两点连了起来——曲线看上去毫无异常，实际中间已经换了一个 worker。
 * 现在保留 null，交给 ECharts 的 `connectNulls: false` 断开。</p>
 */
const trendSeries = computed(() =>
  (trend.value?.points ?? []).reduce<Record<string, { time: number; value: number | null }[]>>(
    (acc, p) => {
      (acc[p.name] ??= []).push({
        time: Date.parse(p.time),
        // 时刻解析失败会得到 NaN，NaN 进 ECharts 会污染整条序列的极值计算
        value: Number.isNaN(Date.parse(p.time)) ? null : p.rate,
      });
      return acc;
    },
    {},
  ),
);

/**
 * 是否至少有一个有效数据点。
 *
 * <p>必须用 Object.keys 取长度：trendSeries 是「序列名 → 点数组」的映射，
 * 是对象不是数组，对象没有 length 属性。这里原先写的是
 * `v-else-if="!trendSeries.length"`，取到 undefined、取反恒为 true，
 * 于是趋势图永远落进空态分支，曲线一次都没画出来过 —— 而后端一直正常
 * 返回数据（实测 24h 窗口内 175 个点），看起来就像「采集没工作」。</p>
 *
 * <p>这里数的是**非 null 的点**：worker 刚重启时序列里已经有点但全是断点，
 * 照样画不出任何东西，显示「没有数据」比显示一张空图诚实。</p>
 */
const hasTrend = computed(() =>
  Object.values(trendSeries.value).some(points => points.some(p => p.value != null)),
);

/** 交给 ECharts 的序列（已按图例开关过滤） */
const chartSeries = computed<TrendSeriesInput[]>(() =>
  TREND_SERIES.filter(s => trendOn.value[s.name]).map(s => ({
    name: s.name,
    label: s.label,
    color: s.color,
    data: (trendSeries.value[s.name] ?? [])
      .filter(p => !Number.isNaN(p.time))
      .map(p => [p.time, p.value] as [number, number | null]),
  })),
);

/** 起止时间文案 */
const trendFromText = computed(() => trend.value ? new Date(trend.value.from).toLocaleTimeString("zh-CN", { hour12: false }) : "");
const trendToText = computed(() => trend.value ? new Date(trend.value.to).toLocaleTimeString("zh-CN", { hour12: false }) : "");

/**
 * 当前每秒请求数（取「每秒请求」序列的最后一个点）。
 *
 * <p>比「累计请求」更适合放首屏：累计值一直变大却看不出快慢，速率才反映当下压力。
 * 累计值降为副信息留在卡片小字里，需要时仍能看到。</p>
 */
const trendRequestRate = computed<number | null>(() => {
  const points = trendSeries.value["requests"] ?? [];
  const last = points[points.length - 1];
  return last && last.value != null ? Math.round(last.value * 10) / 10 : null;
});

function toggleSeries(name: string): void {
  trendOn.value = { ...trendOn.value, [name]: !trendOn.value[name] };
}

// ==================== KPI 迷你趋势 ====================

/**
 * KPI 卡上的迷你趋势序列。
 *
 * <p>直接取 {@link trendSeries} 的点（值已归一成「活跃连接数」与「每秒请求数」），
 * 不另存一份：另存一份就得处理两份数据不同步的问题，而这两张卡的 sparkline
 * 与下方趋势图本来就该是同一条线。</p>
 */
const sparkActive = computed<Array<number | null>>(() => (trendSeries.value["active"] ?? []).map(p => p.value));
const sparkRequests = computed<Array<number | null>>(() => (trendSeries.value["requests"] ?? []).map(p => p.value));

/**
 * 区间内每秒请求峰值。
 *
 * <p>只统计非 null 点：worker 重启处是断点，把 null 当 0 参与 max 不会改变结果，
 * 但把它当「缺数据」更能避免读者以为那段时间真的是 0 req/s。</p>
 */
const requestsPeak = computed<number | null>(() => {
  const nums = sparkRequests.value.filter((v): v is number => v != null);
  return nums.length ? Math.round(Math.max(...nums) * 10) / 10 : null;
});

/**
 * Hero 副标题：实例健康 + 配置校验结论。
 *
 * <p>「配置已校验通过」只在真的跑过 {@code nginx -t} 且没有 issue 时才敢说——
 * overview 的 issues 为空即代表后端校验通过；接口失败时走「未能读取实例状态」，
 * 绝不在没取到数据时报「一切正常」。</p>
 */
const healthText = computed(() => {
  const o = props.overview;
  if (!o) {
    return props.loadError ? "未能读取实例状态" : "正在读取实例状态…";
  }
  const runtime =
    o.running === "RUNNING" ? "实例状态健康" : o.running === "STOPPED" ? "实例已停止" : "实例状态未知";
  const config = o.issues?.length ? `配置有 ${o.issues.length} 项待处理` : "配置已校验通过";
  return `${runtime} · ${config}`;
});

// ==================== URL 访问趋势（扫 access log 尾部） ====================

const urlTrend = ref<NginxUrlTrend | null>(null);

/**
 * 桶索引 → 毫秒时间戳的基准。
 *
 * <p>后端把跨度压成「等宽桶数组」再返回，是因为带宽（`bucketSeconds`）+ 点数
 * 比传一串时间戳省得多，也免得两边对时间格式化理解不一致。代价是前端必须
 * 自己把索引还原成时刻，所以这里取 `fromTime` 当基准。</p>
 */
const urlTrendBase = computed(() => {
  const t = urlTrend.value;
  if (!t || !t.fromEpoch) {
    return NaN;
  }
  return t.fromEpoch * 1000;
});

/** 右侧 URL 趋势的序列（桶索引已还原成真实时刻） */
const urlTrendSeries = computed<UrlTrendSeriesInput[]>(() => {
  const base = urlTrendBase.value;
  if (Number.isNaN(base)) {
    return [];
  }
  const step = (urlTrend.value?.bucketSeconds ?? 60) * 1000;
  return (urlTrend.value?.series ?? []).map(s => ({
    path: s.path,
    data: s.buckets.map((v, i) => [base + i * step, Number(v)] as [number, number]),
  }));
});

/**
 * 实际覆盖区间的文案。
 *
 * <p>两端都用 epoch 秒格式化，显示成**浏览器本地时区**。这不是偷懒：
 * 浏览器所在时区就是读者理解的「现在几点」，而 epoch 是绝对时刻，
 * 换算后必然与读者的钟表一致。若改用后端的 `fromTime`/`toTime` 文本，
 * 那些串不带时区，浏览器会按自己的时区二次解释，跨时区就整体错位。</p>
 *
 * <p>空串表示「拿不到」——模板据此换成「暂无数据」的说法。
 * 不能退化成 `0:00:00` 这种假时间：那会把「没采到」显示成「覆盖为零秒」，
 * 读者会以为日志是空的。</p>
 */
const urlTrendRangeText = computed(() => {
  const t = urlTrend.value;
  if (!t?.fromEpoch || !t.toEpoch) {
    return "";
  }
  const opts: Intl.DateTimeFormatOptions = { hour12: false };
  const f = new Date(t.fromEpoch * 1000);
  const to = new Date(t.toEpoch * 1000);
  // 起点永远带日期：读者没有别处的上下文能推断它是哪一天。
  const from = `${f.toLocaleDateString("zh-CN", opts)} ${f.toLocaleTimeString("zh-CN", opts)}`;
  // 终点只有「确实跨了自然日」时才补日期。少了这个判断，跨零点的区间会显示成
  // 「09-26 12:16:55 → 08:37:09」，看起来只有 20 小时，实际是 44 小时——
  // 而这正是本行文案要避免的误读。
  const crossesDay = f.toDateString() !== to.toDateString();
  const toText = `${crossesDay ? `${to.toLocaleDateString("zh-CN", opts)} ` : ""}${to.toLocaleTimeString("zh-CN", opts)}`;
  return `${from} → ${toText}`;
});

/**
 * 读取 URL 访问趋势。
 *
 * <p>失败一律降级成「右半边空着」，不往外抛：这个接口要 SSH 扫日志尾部，
 * 比读库慢得多也更容易受远端状态影响。它挂了不该把左边那块已经画好的
 * 采集曲线一起带走。</p>
 */
async function loadUrlTrend(): Promise<void> {
  if (!props.datasourceId) {
    urlTrend.value = null;
    return;
  }
  try {
    urlTrend.value = await fetchNginxUrlTrend(props.datasourceId, 5000, 5);
  } catch {
    urlTrend.value = null;
  }
}

async function loadTrend(): Promise<void> {
  if (!props.datasourceId) {
    trend.value = null;
    urlTrend.value = null;
    trendLoaded.value = true;
    return;
  }
  trendLoading.value = true;
  try {
    // 两条链路并行发起。URL 趋势耗时明显长于读库，但它自己 catch，
    // 所以这里不 await —— 刷新按钮的 loading 只需覆盖左侧读库，
    // 否则点一次刷新要等远端 SSH 扫完 5000 行日志才转圈停。
    void loadUrlTrend();
    trend.value = await fetchNginxTrend(props.datasourceId, 24, 30);
  } catch {
    trend.value = null;
  } finally {
    trendLoading.value = false;
    trendLoaded.value = true;
  }
}

// ==================== 实时推送（SSE） ====================

/** 最近一次由 SSE 推来的运行态；null 表示还没收到过推送，此时完全用 prop 的值 */
const runtime = ref<NginxRuntime | null>(null);

/**
 * 已经推过的 `running` 值。
 *
 * <p>用普通变量而不是 ref：它只服务于「判断是否翻转」，不需要进渲染。
 * 放 ref 只会让模板多一个无谓的响应式依赖。</p>
 */
let lastPushedRunning: string | null = null;

/**
 * 订阅当前数据源的指标 / 运行态推送。
 *
 * <p>用 `toRef(props, ...)` 而不是自己再包一层 computed：`datasourceId` 是 prop，
 * 直接以它为订阅键，父组件换数据源时流会自动断开重连到新 id，
 * 不依赖本组件有没有记得在 watch 里重连。</p>
 */
const { state: streamState, lastPushAt } = useNginxStream(toRef(props, "datasourceId"), {
  /**
   * 追加新点。
   *
   * <p>只往 `points` 末尾加，不动 `from` / `to`：这两个是首屏查询窗口的边界，
   * 拿来标注「本次拉取覆盖的范围」。新点落在 `to` 之后是正常的（SSE 比 HTTP 快），
   * 但把 `to` 一起往后推会让「已运行 XX 小时」这类文案跟着漂。</p>
   */
  onMetric: (points: NginxTrendPoint[]) => {
    const cur = trend.value;
    if (!cur) {
      // 首屏历史还没到就先攒着：SSE 每 30s 一次，比首屏 HTTP 慢不了多少，
      // 但用户网络慢时会先收到推送。此时直接丢弃这一批，下一轮 30s 后自然会补上。
      return;
    }
    trend.value = { ...cur, points: mergePoints(cur.points, points) };
  },
  /**
   * 记住最近一次推送的运行态。
   *
   * <p>存到独立 ref 而不是直接改 `props.overview`：它是父组件传进来的 prop，
   * 写 props 在 Vue 里是「静默失败 + 下次刷新回退」的典型来源。这里只记增量，
   * 由下面的 `liveOverview` 在读取时叠加。</p>
   *
   * <p><strong>状态翻转要通知父组件</strong>：生命周期按钮（重载/重启/停止 还是 启动）
   * 判的是父组件那份 `overview.running`，本组件自己叠的实时值它看不见。
   * 不通知的话，nginx 被停掉/崩了，按钮会一直停在「运行中」那一套，
   * 用户只能手动刷新页面才发现实例已经挂了——这正是实时推送要解决的事。</p>
   *
   * <p><strong>只在翻转时通知，不每帧通知</strong>：`reloadOverview` 会遍历配置目录、
   * 跑 `nginx -t`、读日志清单，是重查询。30s 一次会把被管主机打穿，
   * 而状态没变时重载拿到的信息和上一次完全一样。所以首次推送记为基线不触发。</p>
   */
  onRuntime: (rt: NginxRuntime) => {
    if (rt.running && rt.running !== lastPushedRunning) {
      if (lastPushedRunning !== null) {
        emit("changed");
      }
      lastPushedRunning = rt.running;
    }
    runtime.value = rt;
  },
});

/**
 * 把 SSE 推送的实时运行态叠加到 `props.overview` 上。
 *
 * <p>只覆盖运行态那几个字段，**不整体替换**：`overview` 里还有配置文件数、
 * 监听端口、编译参数等一次性重查询的结果，SSE 不带这些，整体换掉会把它们
 * 全抹成 undefined，卡片集体空掉。</p>
 *
 * <p>`activeConnections` 只在本次成功读到 stub_status 时才更新：一次读失败不该
 * 让刚采到的连接数从图上消失。`masterPid` / `uptimeText` 同样用 `??` 兜住 null，
 * 因为「这轮没读到进程信息」不等于「进程没了」。</p>
 */
const liveOverview = computed<NginxOverview | null>(() => {
  const cur = props.overview;
  const rt = runtime.value;
  if (!cur || !rt) {
    return cur;
  }
  return {
    ...cur,
    running: rt.running ?? cur.running,
    masterPid: rt.masterPid ?? cur.masterPid,
    uptimeText: rt.uptimeText ?? cur.uptimeText,
    status: rt.statusAvailable && cur.status
      ? { ...cur.status, activeConnections: rt.activeConnections ?? cur.status.activeConnections }
      : cur.status,
  };
});

/** 推送状态文案：不写「已连接」而写清楚「有没有在收新点」，因为连上≠有数据 */
const streamHint = computed(() => {
  if (streamState.value === "open") {
    return lastPushAt.value ? `实时 · ${lastPushAt.value}` : "实时已连接";
  }
  if (streamState.value === "connecting") {
    return "正在连接实时推送…";
  }
  if (streamState.value === "error") {
    return "实时推送已断开，正在重连";
  }
  return "未开启实时推送";
});

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

/**
 * 状态码类别配色已移入 `NginxStatusBarChart`。
 *
 * <p>原先这里是模板里 `style="background: var(--…)"` 的取值函数。ECharts 画在
 * canvas 上，不认 CSS 变量，图表组件改为在渲染时用 `getComputedStyle` 读令牌，
 * 模板里已无引用，函数随之删除（留着就是一个永远不被调用的死函数）。</p>
 */

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

/**
 * Top 条目占已解析行数的百分比（整数）。
 *
 * <p>分母用 {@code total}（成功解析的行数）而不是榜单最大值：最大值作分母时
 * 第一名永远是 100%，后面几条挤成一条线，看不出差距。</p>
 *
 * @param hits 该条目的命中数
 * @returns 百分比整数
 */
function pctOfTop(hits: number): number {
  const total = top.value?.total ?? 0;
  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

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

/* ============ 首屏骨架屏 ============ */
/* 布局刻意与真实 .ngx-hero / .ngx-kpis / .ngx-trend-card 对齐：
   骨架与真实内容占同样的盒子，数据到达时不会发生布局跳动。 */
.ngx-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* el-skeleton 自带的 item 背景在本主题下过淡（实测几乎不可见，只剩本组件自己写的
   那条标题灰条能看见），这里把它的动画两色覆盖成与 .ngx-skel-block 同一档灰。
   覆盖变量而不是 background-image，是为了保住 shimmer 动画。 */
.ngx-skeleton :deep(.el-skeleton) {
  --el-skeleton-animation-bg-color: var(--el-fill-color);
  --el-skeleton-animation-to-color: var(--el-fill-color-light);
}

.ngx-skel-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

/* ReSkeleton 的根就是 el-skeleton，rows=0 时它自身不产生 item，
   圆形占位只能靠这个壳撑出宽高；给它一个与其它骨架同档的底色才看得见。 */
.ngx-skel-hero-icon:deep(.el-skeleton__content) {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--el-fill-color);
}

.ngx-skel-hero-text :deep(.el-skeleton__item),
.ngx-skel-hero-facts :deep(.el-skeleton__item),
.ngx-skel-kpis :deep(.el-skeleton__item),
.ngx-skel-chart :deep(.el-skeleton__item) {
  border-radius: 6px;
}

.ngx-skel-hero-icon {
  flex: 0 0 auto;
  width: 44px;
}

.ngx-skel-hero-text {
  flex: 1 1 auto;
  min-width: 0;
}

/* 圆形图标占位：el-skeleton 的容器本身没有内容，靠这里的宽高与圆角成形 */
.ngx-skel-round {
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

/* 与真实 .ngx-hero-facts 一样占右侧四格，断点也沿用同样的规则 */
.ngx-skel-hero-facts {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(96px, 1fr));
  gap: 18px;
}

.ngx-skel-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.ngx-skel-card {
  min-height: 246px;
}

/* 图表占位：与真实趋势图的 190px 高度相当 */
.ngx-skel-chart {
  height: 190px;
  padding: 8px 0;
}

.ngx-skel-block {
  border-radius: 6px;
  background: var(--el-fill-color);
}

.ngx-skel-w-sm {
  display: inline-block;
  width: 96px;
  height: 14px;
}

@media (max-width: 1100px) {
  .ngx-skel-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ngx-skel-hero-facts {
    grid-template-columns: repeat(2, minmax(96px, 1fr));
  }
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

/* 四项事实：小屏折行。竖分隔线只画在相邻项之间，首项不画，
   否则卡片左侧会出现一条贴着内容的多余竖线 */
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

/* 相邻事实之间的竖分隔线。断行成两列时这条线会跑到错误的行首，
   所以只在宽屏（单行四列）下画 */
@media (min-width: 1101px) {
  .ngx-fact + .ngx-fact {
    border-inline-start: 1px solid var(--el-border-color-lighter);
    padding-inline-start: 20px;
  }
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

/* Hero 里的丢弃连接告警：只在真的有丢弃时出现，平时不占位 */
.ngx-hero-alert {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  padding: 2px 8px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 18px;
}

.ngx-fact-value.is-bad {
  color: var(--el-color-danger);
}

.ngx-kpi-warn {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.ngx-kpi.is-bad .ngx-kpi-warn {
  color: var(--el-color-danger);
}

@media (max-width: 1100px) {
  .ngx-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ngx-kpi {
  position: relative;
  padding: 13px 16px;
  border-radius: var(--el-border-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 标题行：语义色圆点 + 文案。颜色由 --k 注入，卡片自带色系不必再各写一份 */
.ngx-kpi-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.ngx-kpi-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--k);
  flex: 0 0 auto;
}

.ngx-kpi-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
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

/* 底部一行：左侧副信息，右侧迷你趋势。副信息过长时省略号收尾，不把 sparkline 挤走 */
.ngx-kpi-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  min-height: 30px;
}

.ngx-kpi-sub {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ngx-kpi-spark {
  flex: 0 0 76px;
  width: 76px;
  height: 30px;
}

/* 需要提示的 KPI：值本身不变色，只加左边框，避免整块底色把数字盖住 */
.ngx-kpi.is-warn {
  box-shadow: inset 2px 0 0 var(--el-color-warning);
}

.ngx-kpi.is-bad {
  box-shadow: inset 2px 0 0 var(--el-color-danger);
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

/* 状态码分布的三列样式（名称 / 比例条 / 数值）已随 NginxStatusBarChart 迁走。
   ECharts 自己按 grid + containLabel 排版，条长与标注间距由 series.label 控，
   留着这套 flex 样式会变成永不匹配的孤儿类。 */

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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px 8px;
  padding: 5px 0;
  font-size: 12.5px;
}

.ngx-top-key {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.ngx-top-hits {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 1px 7px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 百分比弱一档：它是补充信息，不该和命中数抢注意力 */
.ngx-top-pct {
  font-style: normal;
  color: var(--el-text-color-secondary);
}

/* 进度条占满一整行（grid 第二列合并），长度 = 占已解析行数的比例 */
.ngx-top-track {
  grid-column: 1 / -1;
  height: 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.ngx-top-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--metric-cpu, var(--el-color-primary));
}

/* 来源 IP 换一种色，与左列一眼可分（两列同色会被当成同一组数据） */
.ngx-top-fill.is-ip {
  background: var(--metric-mem, var(--el-color-primary));
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

/* 原手写 SVG 的画布/网格/刻度样式已随 NginxTrendChart 一并迁走：
   ECharts 自带网格与刻度，留着会变成永不匹配的孤儿类。 */

.ngx-trend-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

/* 实时推送状态：夹在起止时间中间，不额外占一行 */
.ngx-trend-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-variant-numeric: tabular-nums;
}

.ngx-trend-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;

  &.is-open {
    background: var(--status-success);
    // 呼吸：让「真的在收数据」和「连着但没数据」在余光里就能区分
    animation: ngx-pulse 2s ease-in-out infinite;
  }

  /* connecting 用中性色而不是成功色：正在连还没连上，染成绿色会误报已就绪 */
  &.is-connecting,
  &.is-idle {
    background: var(--el-text-color-placeholder);
  }

  &.is-error {
    background: var(--status-error);
  }
}

@keyframes ngx-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

/* 推送断开时给整行降权，视觉上与「实时中」区分开 */
.ngx-trend-live:has(.is-error) {
  color: var(--status-error);
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

/* 路径行：图标 + 可折行的路径 + 右侧状态标签。标签固定在右侧不参与折行 */
.ngx-path-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: var(--el-text-color-placeholder);
}

.ngx-path-row .ngx-break {
  flex: 1 1 auto;
  min-width: 0;
}

.ngx-break {
  word-break: break-all;
}

.ngx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 连接分布条（.ngx-bar / .ngx-bar-seg / .ngx-legend）已随 NginxConnDonut 迁走。
   环形图自带三段配色与环内标注，配套的 flex 分段条与手绘图例一并删除；
   留着这三条会静默失效——类名还在，模板里已经没有对应节点了。 */

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
