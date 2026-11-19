<!--
  APM 总览 —— 落首页。

  这一页回答三个问题，并且按这个顺序摆：
    1. 现在健康吗（服务数 / 调用量 / 错误率 / 平均耗时，四张统计卡）；
    2. 系统长什么样（调用关系图，画在普通白卡片里）；
    3. 谁在拖后腿（服务行 + 右侧告警）。

  数据全部来自真实接口：/topology（关系图）、/services（服务行与四个读数）、
  /alarms（告警）。<b>四个读数刻意不从 /overview 的 health 取</b> ——
  SkyWalking 没有「全局 QPS / 全局 P99」这两项指标，OAP 的 health 会如实返回 0，
  直接显示就成了「有 3300 次调用却写着 QPS 0.00」的自相矛盾。这里改用
  服务清单按调用量加权算，和下面服务行里的数字同源，看的人不会怀疑哪一个是假的。

  每个接口都按「尽力而为」处理：某个不被引擎支持时只少一块内容，
  不会把整页变空白 —— 运维打开页面时最不需要的就是一个全局错误提示。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ApmTimeWindow v-model="timeWindow" @change="loadAll" />
      <span class="apm-bar__spacer" />
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="loadAll" />
      <ApmAutoRefresh @refresh="loadAll" />
    </div>

    <ReSkeleton v-if="loading && !loaded" :rows="6" animated />

    <template v-else>
      <!-- ── 四个数：和宿主统计卡同一种读法；每个数都能点进它背后的明细 ── -->
      <div class="apm-kpis">
        <div class="apm-kpi is-clickable" style="--accent: var(--el-color-primary)" title="查看服务清单" @click="go('services')">
          <div class="apm-kpi__label">服务</div>
          <div class="apm-kpi__value">{{ services.length }}<small>个</small></div>
          <div class="apm-kpi__sub">{{ windowLabel(timeWindow) }}内有调用</div>
        </div>
        <div class="apm-kpi is-clickable" style="--accent: var(--el-color-success)" title="查看这段时间的调用明细" @click="go('traces')">
          <div class="apm-kpi__label">调用量</div>
          <div class="apm-kpi__value">{{ fmtNum(totalCalls) }}<small>次</small></div>
          <div class="apm-kpi__sub">{{ windowLabel(timeWindow) }}累计</div>
        </div>
        <div class="apm-kpi is-clickable" style="--accent: var(--el-color-danger)" title="查看当前告警" @click="go('alarms')">
          <div class="apm-kpi__label">错误率</div>
          <div class="apm-kpi__value" :class="errorTone">{{ errorText[0] }}<small>{{ errorText[1] }}</small></div>
          <div class="apm-kpi__sub">按调用量加权</div>
        </div>
        <div
          class="apm-kpi is-clickable"
          style="--accent: var(--el-color-warning)"
          title="查看响应时间曲线"
          @click="go('metrics', { metric: 'service_resp_time' })"
        >
          <div class="apm-kpi__label">平均耗时</div>
          <div class="apm-kpi__value">{{ avgText[0] }}<small>{{ avgText[1] }}</small></div>
          <div class="apm-kpi__sub">按调用量加权</div>
        </div>
      </div>

      <!-- ── 图 + 读数 ───────────────────────────────────────── -->
      <div class="apm-hero">
        <section class="apm-canvas">
          <div class="apm-canvas__head">
            <span class="apm-canvas__title">调用关系</span>
            <span class="apm-canvas__hint">{{ topology.nodes.length }} 个节点 · {{ topology.calls.length }} 条边</span>
            <span class="apm-bar__spacer" />
            <button type="button" class="apm-link" @click="go('topology')">查看拓扑</button>
          </div>
          <div class="apm-canvas__stage">
            <ApmGraph
              :nodes="topology.nodes"
              :calls="topology.calls"
              height="380px"
              :label-size="12"
              :empty-text="graphEmptyText"
            />
          </div>
        </section>

        <aside class="apm-side">
          <!-- 成功率 -->
          <section class="apm-card">
            <div class="apm-card-head">
              <span class="apm-card-h">成功率</span>
              <!-- SLO 是运维定的口径，不是前端写死的常数：可调，存 localStorage -->
              <template v-if="sloEditing">
                <ReInput v-model="sloDraft" size="small" style="width: 86px" @keyup.enter="saveSlo" />
                <ReButton size="small" type="primary" @click="saveSlo">保存</ReButton>
                <ReButton size="small" @click="sloEditing = false">取消</ReButton>
              </template>
              <template v-else>
                <span class="apm-card-note">SLO {{ sloTargetLabel }}</span>
                <button type="button" class="apm-link" @click="startSloEdit">调整</button>
              </template>
            </div>
            <div class="apm-readout" :class="successTone">{{ fmtPercent(successRate) }}</div>
            <span class="apm-meter">
              <span class="apm-meter__fill" :class="successTone" :style="{ width: `${Math.max(0, Math.min(100, successRate))}%` }" />
            </span>
            <div class="apm-kvline"><span>引擎</span><b>{{ status.name }} {{ shortVersion(status.version) }}</b></div>
            <div class="apm-kvline"><span>模式</span><b>{{ status.mode }}</b></div>
          </section>

          <!-- 告警 -->
          <section class="apm-card">
            <div class="apm-card-head">
              <span class="apm-card-h">当前告警</span>
              <span class="apm-card-note">{{ alarmCount }} 条</span>
            </div>
            <div v-if="!topAlarms.length" class="apm-rows__empty">当前窗口内没有告警</div>
            <div
              v-for="alarm in topAlarms"
              :key="alarm.id"
              class="apm-alert is-clickable"
              :class="alarmTone(alarm)"
              :title="`在告警页只看「${alarmTitle(alarm)}」`"
              @click="go('alarms', { entity: alarmTitle(alarm) })"
            >
              <i class="apm-alert__bar" />
              <span class="apm-alert__body">
                <span class="apm-alert__title">{{ alarmTitle(alarm) }}</span>
                <span class="apm-alert__meta">{{ fmtAgo(alarm.startTime) }} · {{ alarm.scope || "SERVICE" }}</span>
              </span>
            </div>
            <button v-if="alarmCount" type="button" class="apm-link" @click="go('alarms')">全部告警</button>
          </section>

          <!-- 响应时间：引擎给得出非零时序就画线，给不出就退回调用量分布 -->
          <section class="apm-card">
            <div class="apm-card-head">
              <span class="apm-card-h">{{ latencySeries.length ? "响应时间" : "调用量分布" }}</span>
              <span v-if="latencySeries.length" class="apm-card-note">最忙服务 · P50 {{ fmtMs(weighted.avgMs) }}</span>
              <span v-else class="apm-card-note">合计 {{ fmtNum(totalCalls) }}</span>
            </div>
            <MetricChart v-if="latencySeries.length" compact height="62px" :series="latencySeries" />
            <template v-else>
              <div v-for="svc in topServices" :key="svc.id" class="apm-load">
                <span class="apm-load__name">{{ svc.name }}</span>
                <span class="apm-load__track">
                  <i class="apm-load__bar" :style="{ width: loadWidth(svc) }" />
                </span>
                <span class="apm-load__num">{{ fmtNum(svc.calls) }}</span>
              </div>
              <div v-if="!topServices.length" class="apm-rows__empty">后端未返回服务指标</div>
            </template>
          </section>
        </aside>
      </div>

      <!-- ── 服务：谁在拖后腿 ───────────────────────────────── -->
      <section class="apm-card apm-card--flush">
        <div class="apm-card-head apm-card-head--pad">
          <span class="apm-card-h">服务</span>
          <span class="apm-card-note">按调用量排序 · 点行看详情</span>
        </div>
        <div class="apm-rows">
          <div class="apm-rows__head apm-rows__head--svc">
            <span />
            <span>服务</span>
            <span>调用量分布</span>
            <span class="apm-row__num">调用量</span>
            <span class="apm-row__num">错误率</span>
            <span class="apm-row__num">平均耗时</span>
          </div>
          <div
            v-for="svc in topServices"
            :key="svc.id"
            class="apm-row apm-row--svc"
            :title="`打开 ${svc.name} 详情（实例 / 端点 / 指标）`"
            @click="openService(svc.name)"
          >
            <i class="apm-row__dot" :class="dotTone(svc)" />
            <span class="apm-row__name">{{ svc.name }}</span>
            <span class="apm-row__track">
              <i class="apm-row__bar" :style="{ width: loadWidth(svc) }" />
            </span>
            <span class="apm-row__num">{{ fmtNum(svc.calls) }}</span>
            <span class="apm-row__num" :class="Number(svc.calls) > 0 ? errorRateClass(svc.errorRate) : 'apm-muted'">{{ errorRateText(svc.errorRate, svc.calls) }}</span>
            <span class="apm-row__num" :class="latencyClass(svc.avgMs)">{{ fmtMs(svc.avgMs) }}</span>
          </div>
          <div v-if="!topServices.length" class="apm-rows__empty">该时间窗口内没有服务数据</div>
        </div>
      </section>

      <!-- ── 引擎探测：收起来，需要时才展开 ──────────────────── -->
      <section class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">引擎探测</span>
          <span class="apm-card-note">{{ candidateRows.length }} 个候选 · {{ fmtAgo(status.checkedAt) }}</span>
          <span class="apm-bar__spacer" />
          <button type="button" class="apm-link" @click="probeOpen = !probeOpen">
            {{ probeOpen ? "收起" : "展开" }}
          </button>
        </div>
        <template v-if="probeOpen">
          <ReTable
            :data="candidateRows"
            :columns="candidateColumns"
            engine="element"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            :settings="{ border: false }"
            empty-text="没有探测到任何 APM 引擎"
            :layout-table="{ maxHeight: 360 }"
            table-id="apm-overview-candidates"
          >
            <template #empty="{ description }">
              <span class="apm-table-empty">{{ description }}</span>
            </template>
            <template #col-available="{ row }">
              <ReTag :type="row.available ? 'success' : 'info'" round>
                {{ row.available ? "可用" : "不可用" }}
              </ReTag>
            </template>
            <template #col-message="{ row }">
              <span class="apm-muted">{{ row.message || "—" }}</span>
            </template>
          </ReTable>
          <div class="apm-bar">
            <span class="apm-count">探测时间：{{ fmtTime(status.checkedAt) }}</span>
            <span class="apm-bar__spacer" />
            <ReButton icon="Refresh" :loading="probing" @click="reload">重新探测</ReButton>
          </div>
        </template>
      </section>

      <!-- ── 页脚：这块数据是什么时候的 ──────────────────────── -->
      <div class="apm-bar apm-foot">
        <span class="apm-count">窗口 {{ windowLabel(timeWindow) }} · 更新于 {{ updatedAt || "—" }}</span>
        <span class="apm-bar__spacer" />
        <span class="apm-count">能力 {{ status.capabilities.length }} 项</span>
      </div>
    </template>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import ApmAutoRefresh from "../components/ApmAutoRefresh.vue";
import ApmGraph from "../components/ApmGraph.vue";
import ApmTimeWindow from "../components/ApmTimeWindow.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetrics, getOverview, getTopology, listAlarms, listServices } from "../api/apmApi";
import type { ApmAlarm, ApmHealth, ApmMetricSeries, ApmService, ApmTopology } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { consumeApmTabContext, openApmTab } from "../tabs";
import { useApmTabActivated } from "../composables/useApmTabActivated";
import type { ApmTabContext } from "../tabs";
import { message } from "@repo/core";
import { errorRateClass, errorRateText, fmtAgo, fmtMs, fmtNum, fmtPercent, fmtTime, latencyClass } from "../utils/format";
import { DEFAULT_WINDOW_MINUTES, timeQuery, windowLabel } from "../utils/timeRange";
import type { ApmTimeWindow as ApmTimeWindowState } from "../utils/timeRange";

const { present, ensure, refresh, status } = useApmStatus();

/** 本页在 URL 上的页签名，必须与 tabs.ts 里的 name 一致 */
const TAB_NAME = "overview";

const router = useRouter();

const loading = ref(false);
const probing = ref(false);
const probeOpen = ref(false);
const loaded = ref(false);

const topology = ref<ApmTopology>({ nodes: [], calls: [] });
const services = ref<ApmService[]>([]);
const alarms = ref<ApmAlarm[]>([]);
const latencySeries = ref<ApmMetricSeries[]>([]);
const health = ref<ApmHealth | null>(null);

/** 时间窗：预设分钟数或自定义区间 */
const timeWindow = ref<ApmTimeWindowState>({ minutes: DEFAULT_WINDOW_MINUTES });
const updatedAt = ref("");

/* ── SLO 目标：可调，存 localStorage，全站共用一个口径 ── */

/** localStorage 键：SLO 是运维定的口径，换页面不该变 */
const SLO_STORAGE_KEY = "apm:slo-target";
const sloTarget = ref(99);
const sloEditing = ref(false);
const sloDraft = ref("");

const sloTargetLabel = computed(() => `${sloTarget.value.toFixed(1)}%`);

function startSloEdit(): void {
  sloDraft.value = sloTarget.value.toFixed(1);
  sloEditing.value = true;
}

/** 保存 SLO 目标：0~100 之间保留一位小数，写 localStorage 让下次进来还认 */
function saveSlo(): void {
  const value = Number(sloDraft.value);
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    message.error("SLO 目标需在 0 ~ 100 之间");
    return;
  }
  sloTarget.value = Math.round(value * 10) / 10;
  try {
    localStorage.setItem(SLO_STORAGE_KEY, String(sloTarget.value));
  } catch {
    /* 存储不可用时本次会话内仍然生效 */
  }
  sloEditing.value = false;
  message.success(`SLO 目标已设为 ${sloTargetLabel.value}`);
}

/** 读回 SLO 目标：脏数据一律退回默认 99，不让 localStorage 把页面打坏 */
function loadSlo(): void {
  try {
    const stored = localStorage.getItem(SLO_STORAGE_KEY);
    if (!stored) {
      return;
    }
    const value = Number(stored);
    if (Number.isFinite(value) && value > 0 && value <= 100) {
      sloTarget.value = Math.round(value * 10) / 10;
    }
  } catch {
    /* ignore */
  }
}

/* ── 四个读数：全部由服务清单加权得出，和服务行同源 ───────── */

/** 加权：调用量越大的服务对「整体」的影响越大，和真实体感一致 */
const weighted = computed(() => {
  let calls = 0;
  let errorRate = 0;
  let avgMs = 0;
  for (const svc of services.value) {
    const c = Math.max(0, Number(svc.calls ?? 0));
    calls += c;
    errorRate += Math.max(0, Number(svc.errorRate ?? 0)) * c;
    avgMs += Math.max(0, Number(svc.avgMs ?? 0)) * c;
  }
  if (calls > 0) {
    return { calls, errorRate: errorRate / calls, avgMs: avgMs / calls };
  }
  // 引擎不支持服务清单时（只有 health），退回 health 的原始值
  return {
    calls: 0,
    errorRate: Math.max(0, Number(health.value?.errorRate ?? 0)),
    avgMs: Math.max(0, Number(health.value?.avgMs ?? 0)),
  };
});

const totalCalls = computed(() => weighted.value.calls);

const alarmCount = computed(() => alarms.value.length);

const successRate = computed(() => Math.max(0, Math.min(100, 100 - weighted.value.errorRate)));

/* ── 数字拆成「值 + 单位」：等宽大字只给值，单位退成小字 ── */
function splitUnit(text: string): [string, string] {
  const match = /^(-?[\d.,]+)(.*)$/.exec(text);
  return match ? [match[1], match[2]] : [text, ""];
}

const errorText = computed(() => splitUnit(fmtPercent(weighted.value.errorRate)));
const avgText = computed(() => splitUnit(fmtMs(weighted.value.avgMs)));

const errorTone = computed(() => {
  const rate = weighted.value.errorRate;
  if (rate > 5) return "is-bad";
  if (rate > 1) return "is-warn";
  return "";
});

/**
 * 成功率的脸色：低于 SLO 即警告，再低一档（SLO - 4）才算事故红。
 * 阈值跟着可配置的 SLO 走，不再是写死的 99 / 95。
 */
const successTone = computed(() => {
  if (successRate.value < sloTarget.value - 4) return "is-bad";
  if (successRate.value < sloTarget.value) return "is-warn";
  return "";
});

/** 服务行状态点：先看错误率，再看平均耗时 */
function dotTone(svc: ApmService): string {
  if (Number(svc.errorRate ?? 0) > 5 || Number(svc.avgMs ?? 0) >= 1000) return "is-bad";
  if (Number(svc.errorRate ?? 0) > 1 || Number(svc.avgMs ?? 0) >= 500) return "is-warn";
  return "";
}

/** 服务按调用量倒序，只取前 6 条：总览不是列表页 */
const topServices = computed(() =>
  [...services.value]
    .sort((a, b) => Number(b.calls ?? 0) - Number(a.calls ?? 0))
    .slice(0, 6),
);

/** 条形宽度：按调用量占最大值的比例，最小 2% 以免最少的那个看不见 */
function loadWidth(svc: ApmService): string {
  const max = Math.max(1, ...services.value.map((s) => Number(s.calls ?? 0)));
  const ratio = Math.max(0, Number(svc.calls ?? 0)) / max;
  return `${Math.max(2, Math.round(ratio * 100))}%`;
}

const topAlarms = computed(() => alarms.value.slice(0, 3));

const graphEmptyText = computed(() =>
  present.value && !status.value?.capabilities?.includes("topology")
    ? `引擎 ${status.value?.name ?? ""} 不支持拓扑查询`
    : "该时间窗口内没有调用关系（可能没有跨服务调用）",
);

const candidateRows = computed(() => (status.value?.candidates ?? []) as unknown as Record<string, unknown>[]);

const candidateColumns: ReTableColumn[] = [
  { prop: "name", label: "引擎", width: 140 },
  { prop: "available", label: "状态", width: 90, align: "center", slot: "available" },
  { prop: "mode", label: "模式", width: 100 },
  { prop: "version", label: "版本", width: 120 },
  { prop: "endpoint", label: "后端地址", minWidth: 160 },
  { prop: "message", label: "说明", minWidth: 220, slot: "message" },
];

/** 版本号里的 `-` / `+` 之后是构建信息，顶栏与侧栏都不需要 */
function shortVersion(version?: string | null): string {
  if (!version || version === "unknown") return "";
  return version.split(/[-+]/)[0];
}

/** 当前时间窗 → 跳转上下文：自定义区间给起止，预设给分钟数 */
function windowContext(): ApmTabContext {
  const win = timeWindow.value;
  if (win.startTime && win.endTime) {
    return { startTime: win.startTime, endTime: win.endTime };
  }
  return { minutes: win.minutes || DEFAULT_WINDOW_MINUTES };
}

/**
 * 跨页签跳转，带上当前窗口与定位上下文。
 *
 * <p>不走 `router.push`：宿主给路由组件挂了 `:key="route.fullPath"`，
 * 换 query 会重建整页，页签保活就白做了。这里发一个事件，由工作台切页签，
 * 同时把上下文暂存下来 —— 落地页据此预填筛选，不用再选一次。</p>
 *
 * @param tab 页签名
 * @param context 可选的定位上下文（服务名 / 端点 / 时间窗 / 指标名）
 */
function go(tab: string, context?: ApmTabContext): void {
  openApmTab(tab, { ...windowContext(), ...context });
}

/**
 * 打开某个服务的详情页。
 *
 * <p>为什么不先跳服务列表再点一次：总览这张表就是「谁在拖后腿」的结论，
 * 点一行本来就想看这个服务的实例 / 端点 / 指标；先落到列表等于让人再点一次。
 * 详情页是独立地址（可分享、可后退），这里直接 push 过去。</p>
 *
 * @param name 服务名
 */
function openService(name: string): void {
  if (!name) {
    return;
  }
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: name } });
}

/** 告警的危险级别：能判定的只有「恢复」与默认两类 */
function alarmTone(alarm: ApmAlarm): string {
  return alarm.events?.includes("Recovery") ? "apm-alert--info" : "apm-alert--error";
}

function alarmTitle(alarm: ApmAlarm): string {
  return alarm.name || alarm.serviceName || "未知实体";
}

/* ── 取数 ── */

/**
 * 包一层「失败返回默认值」：三个接口里任何一个挂了，其余两块照常显示。
 * 失败会被计数，loadAll 结束后统一给出可见提示，避免「失败」被误读成「空数据」。
 *
 * @param task 请求
 * @param fallback 失败时的值
 */
let failedRequests = 0;

async function safe<T>(task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch {
    failedRequests += 1;
    return fallback;
  }
}

/** 取一条指标，失败返回 null —— 时序图是加分项 */
async function tryMetric(name: string, service: string): Promise<ApmMetricSeries | null> {
  if (!service) return null;
  try {
    const series = await getMetrics({ name, service, scope: "SERVICE", ...timeQuery(timeWindow.value), step: "MINUTE" });
    return series?.points?.length ? series : null;
  } catch {
    return null;
  }
}

/**
 * 时序必须带服务名。
 *
 * <p>SkyWalking 的服务级指标挂在具体实体上（{@code service_resp_time} 的读数 id 是
 * `指标_桶_实体`），不指定服务就只能查到"All"作用域 —— 那个实体绝大多数部署里没有数据，
 * 结果就是"有调用量却画不出线"。这里取调用量最大的服务，它最能代表整体。</p>
 *
 * <p>全窗口都是 0 的时序不画：一条贴着底边的直线看起来像图表没加载出来，
 * 这时退回「调用量分布」反而能读出东西。</p>
 */
async function loadMetrics(): Promise<void> {
  if (!present.value) return;
  const busiest = topServices.value[0]?.name ?? "";
  if (!busiest) {
    latencySeries.value = [];
    return;
  }
  try {
    const resp = await tryMetric("service_resp_time", busiest);
    const hasValue = resp?.points?.some((point) => Number(point.value) > 0) ?? false;
    latencySeries.value = resp && hasValue ? [resp] : [];
  } catch {
    latencySeries.value = [];
  }
}

/** 全量刷新：一次窗口切换要把三个列表都换掉 */
async function loadAll(): Promise<void> {
  // 子组件的 ApmGate 与本站同批挂载，状态可能还没回来 —— 先等它一次
  await ensure();
  if (!present.value) return;
  loading.value = true;
  failedRequests = 0;
  try {
    const [ov, topo, svc, alarmList] = await Promise.all([
      safe(getOverview({ ...timeQuery(timeWindow.value) }), null as { health: ApmHealth } | null),
      safe(getTopology({ ...timeQuery(timeWindow.value) }), { nodes: [], calls: [] } as ApmTopology),
      safe(listServices({ ...timeQuery(timeWindow.value) }), [] as ApmService[]),
      safe(listAlarms({ ...timeQuery(timeWindow.value) }), [] as ApmAlarm[]),
    ]);
    health.value = ov?.health ?? null;
    topology.value = topo;
    services.value = svc;
    alarms.value = alarmList;
    updatedAt.value = fmtTime(Date.now());
    loaded.value = true;
    if (failedRequests > 0) {
      message.warning(`有 ${failedRequests} 项数据加载失败，当前显示可能不完整，请稍后刷新重试`);
    }
  } finally {
    loading.value = false;
  }
  loadMetrics();
}

/** 重新探测后把概览一起刷新 */
async function reload(): Promise<void> {
  probing.value = true;
  try {
    await refresh();
    await loadAll();
  } finally {
    probing.value = false;
  }
}

onMounted(() => {
  loadSlo();
  // 从 URL / 跳转上下文带时间窗过来时按它取数（与其它页签同口径）
  const context = consumeApmTabContext();
  if (context?.startTime && context?.endTime) {
    timeWindow.value = { minutes: 0, startTime: context.startTime, endTime: context.endTime };
  } else if (context?.minutes) {
    timeWindow.value = { minutes: context.minutes };
  }
  loadAll();
});

/**
 * 页签常驻保活（v-show 切换）：深链或其它页签带时间窗切回本页时
 * {@link onMounted} 不会重跑，一次性上下文在这里接住。
 * 普通切回不重查 —— 总览一次要拉拓扑 + 服务 + 告警三份数据，新鲜度由自动刷新兜底。
 */
useApmTabActivated(TAB_NAME, () => {
  const context = consumeApmTabContext();
  if (!context) {
    return;
  }
  if (context.startTime && context.endTime) {
    timeWindow.value = { minutes: 0, startTime: context.startTime, endTime: context.endTime };
  } else if (context.minutes) {
    timeWindow.value = { minutes: context.minutes };
  }
  loadAll();
});
</script>
