<!--
  项目观测面板（Actuator 指标 / 日志管理 / 链路追踪 / 其它端点）。

  为什么不再只弹一个「有没有 Actuator」的对话框：运维真正要看的是数字和开关 ——
  内存/线程/连接数是多少、某个包的日志级别能不能当场调、一次请求慢在哪个 span。
  这里把这些能力收进一个页签，入口仍在左侧项目右键的「观测与诊断」二级菜单。

  数据来源分两类，不能混：
    · Actuator（指标 / 日志级别 / 链路记录 / 其它端点）—— 项目自己暴露的端点，
      后端在目标主机内 curl，前端只传项目 id + 端点路径；
    · 链路追踪 —— 优先走 APM 引擎（SkyWalking 等）的 span 树；APM 未接入时
      回退读项目 Actuator 的 httptrace / httpexchanges 请求记录，不假装有链路。
-->
<template>
  <div class="obs">
    <div class="obs-bar">
      <div class="obs-tabs">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          class="obs-tab"
          :class="{ 'is-on': tab === t.key }"
          @click="switchTab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>
      <span class="obs-grow"></span>
      <span v-if="currentUrl" class="obs-url mono" :title="currentUrl">{{ currentUrl }}</span>
      <button type="button" class="obs-btn" :disabled="loading" @click="refresh">刷新</button>
    </div>

    <!-- ==================== 指标 ==================== -->
    <div v-if="tab === 'metrics'" class="obs-body obs-split">
      <aside class="obs-side">
        <input v-model="metricKeyword" class="obs-search" type="text" placeholder="搜索指标名" />
        <div class="obs-list">
          <button
            v-for="name in filteredMetrics"
            :key="name"
            type="button"
            class="obs-item"
            :class="{ 'is-on': name === metricName }"
            :title="name"
            @click="openMetric(name)"
          >
            {{ name }}
          </button>
          <div v-if="!metrics.length && !loading" class="obs-empty-sm">
            {{ loadError || '没有读到指标，确认 management.endpoints.web.exposure.include 含 metrics' }}
          </div>
        </div>
      </aside>
      <section class="obs-main obs-main-rel">
        <div v-if="loading && metricDetail" class="obs-loading-mask" role="status" aria-label="读取指标中">
          <span class="obs-spinner"></span>
        </div>
        <div v-if="loading && !metricDetail" class="obs-empty">读取中…</div>
        <div v-else-if="!metricDetail" class="obs-empty">左侧选一个指标查看当前值</div>
        <template v-else>
          <div class="obs-kpis">
            <div v-for="m in metricMeasurements" :key="m.statistic" class="obs-kpi">
              <span class="obs-kpi-k">{{ m.statistic }}</span>
              <b class="obs-kpi-v">{{ fmtNum(m.value) }}</b>
            </div>
          </div>
          <div v-if="metricTags.length" class="obs-taglist">
            <span v-for="t in metricTags" :key="t.tag" class="obs-tagchip">
              {{ t.tag }}<template v-if="t.values && t.values.length"> · {{ t.values.slice(0, 6).join(', ') }}</template>
            </span>
          </div>
          <pre class="obs-json">{{ pretty(metricDetail) }}</pre>
        </template>
      </section>
    </div>

    <!-- ==================== 日志管理 ==================== -->
    <div v-else-if="tab === 'loggers'" class="obs-body">
      <div class="obs-hint">
        改级别走 Actuator <code>POST /actuator/loggers/{name}</code>，立即生效、不用重启；
        「继承」表示清掉项目级配置、回落到上级（通常是 ROOT）。
      </div>
      <div class="obs-logger-bar">
        <input
          v-model="loggerKeyword"
          class="obs-search"
          type="text"
          placeholder="搜索日志名称，如 com.chua（回车精确查询）"
          @keyup.enter="lookupLogger(loggerKeyword)"
        />
        <label class="obs-check">
          <input v-model="onlyConfigured" type="checkbox" />
          只看已单独设置
        </label>
        <span class="obs-count">{{ filteredLoggers.length }} 个</span>
      </div>
      <div v-if="loggersTruncated" class="obs-warn">
        日志列表过大已被截断（只显示前一部分）：需要调整哪个就在搜索框输入完整名字后回车，会单独查出它的级别。
      </div>
      <div class="obs-table">
        <div class="obs-tr obs-th">
          <span class="obs-c-name">日志名称</span>
          <span class="obs-c-level">生效级别</span>
          <span class="obs-c-level">项目级配置</span>
          <span class="obs-c-op">设为</span>
        </div>
        <div v-for="row in visibleLoggers" :key="row.name" class="obs-tr">
          <span class="obs-c-name mono" :title="row.name">{{ row.name }}</span>
          <span class="obs-c-level">{{ row.effectiveLevel || '—' }}</span>
          <span class="obs-c-level" :class="{ 'is-set': !!row.configuredLevel }">
            {{ row.configuredLevel || '继承' }}
          </span>
          <span class="obs-c-op">
            <select
              class="obs-select"
              :value="row.configuredLevel || ''"
              :disabled="!!savingLogger[row.name]"
              @change="onLevelChangeEvent(row.name, $event)"
            >
              <option value="">继承</option>
              <option v-for="lv in levels" :key="lv" :value="lv">{{ lv }}</option>
            </select>
          </span>
        </div>
        <div v-if="!filteredLoggers.length" class="obs-empty-sm">
          {{ loadError || '没有读到日志列表，确认 exposure.include 含 loggers' }}
        </div>
      </div>
    </div>

    <!-- ==================== 链路追踪（APM 树 / Actuator 请求记录） ==================== -->
    <div v-else-if="tab === 'traces'" class="obs-body obs-split">
      <aside class="obs-side">
        <div class="obs-trace-bar">
          <select v-model.number="traceMinutes" class="obs-select" @change="loadTraces">
            <option :value="15">近 15 分钟</option>
            <option :value="30">近 30 分钟</option>
            <option :value="60">近 1 小时</option>
            <option :value="180">近 3 小时</option>
          </select>
          <span class="obs-count">{{ traceSource === 'apm' ? traces.length : httpRecords.length }} 条</span>
        </div>
        <div v-if="traceSource === 'actuator'" class="obs-hint obs-trace-note">
          APM 未接入，展示项目 Actuator 的 <code>{{ httpTraceEndpoint }}</code> 请求记录；
          需要完整 span 调用链时再为项目注入 SkyWalking / 平台 APM agent。
          <span v-if="httpTraceTruncated">记录过多，已截断展示。</span>
        </div>
        <div class="obs-list">
          <template v-if="traceSource === 'apm'">
            <button
              v-for="t in traces"
              :key="t.traceId"
              type="button"
              class="obs-item obs-trace-item"
              :class="{ 'is-on': t.traceId === traceId, 'is-error': t.error }"
              @click="openTrace(t.traceId)"
            >
              <span class="obs-trace-ms mono">{{ fmtMs(t.durationMs) }}</span>
              <span class="obs-trace-name" :title="t.endpointName || t.serviceName || t.traceId">
                {{ t.endpointName || t.serviceName || t.traceId }}
              </span>
              <span class="obs-trace-time">{{ fmtClock(t.startTime) }}</span>
            </button>
          </template>
          <template v-else>
            <button
              v-for="r in httpRecords"
              :key="r.key"
              type="button"
              class="obs-item obs-trace-item"
              :class="{ 'is-on': r.key === httpRecordKey, 'is-error': r.status >= 500 }"
              @click="openHttpRecord(r)"
            >
              <span class="obs-trace-ms mono">{{ r.status ? r.status : '—' }}</span>
              <span class="obs-trace-name" :title="`${r.method} ${r.uri}`">{{ r.method }} {{ r.uri }}</span>
              <span class="obs-trace-time">{{ r.timestamp ? fmtClock(r.timestamp) : '' }}</span>
            </button>
          </template>
          <div
            v-if="(traceSource === 'apm' ? !traces.length : !httpRecords.length) && !loading"
            class="obs-empty-sm"
          >
            {{ traceEmpty }}
          </div>
        </div>
      </aside>
      <section class="obs-main obs-main-rel">
        <template v-if="traceSource === 'actuator'">
          <div v-if="!currentHttpRecord" class="obs-empty">左侧选一条请求记录查看详情</div>
          <template v-else>
            <div class="obs-trace-head">
              <span class="mono">{{ currentHttpRecord.method }} {{ currentHttpRecord.uri }}</span>
              <span class="obs-grow"></span>
              <span class="obs-count">HTTP {{ currentHttpRecord.status || '—' }} · {{ fmtMs(currentHttpRecord.timeTaken) }}</span>
            </div>
            <pre class="obs-json">{{ currentHttpRecord.raw }}</pre>
          </template>
        </template>
        <template v-else>
          <div v-if="!traceId" class="obs-empty">左侧选一条链路，按父子 span 展开成树</div>
          <div v-else-if="loading && !spanRows.length" class="obs-empty">读取链路…</div>
          <div v-else-if="!spanRows.length" class="obs-empty">这条链路没有 span（可能已过保留期）</div>
          <template v-else>
            <div class="obs-trace-head">
              <span class="mono">{{ traceId }}</span>
              <span class="obs-grow"></span>
              <span class="obs-count">{{ spanRows.length }} 个 span · {{ traceDuration }}</span>
              <button type="button" class="obs-btn" @click="toggleAll">{{ allExpanded ? '全部收起' : '全部展开' }}</button>
            </div>
            <div class="obs-tree">
              <div
                v-for="row in visibleSpanRows"
                :key="row.key"
                class="obs-tree-row"
                :class="{ 'is-error': row.span.error, 'is-remote': !row.span.parentSpanId }"
                :style="{ paddingLeft: 6 + row.depth * 16 + 'px' }"
              >
                <button
                  type="button"
                  class="obs-tree-toggle"
                  :class="{ 'is-hidden': !row.hasChildren }"
                  @click="toggleNode(row.key)"
                >
                  {{ expanded[row.key] ? '▾' : '▸' }}
                </button>
                <span class="obs-tree-svc mono" :title="row.span.serviceName || ''">
                  {{ row.span.serviceName || '—' }}
                </span>
                <span class="obs-tree-name" :title="row.span.endpointName || ''">
                  {{ row.span.endpointName || row.span.component || row.span.spanId }}
                </span>
                <span class="obs-tree-ms mono">{{ fmtMs(row.span.durationMs) }}</span>
              </div>
            </div>
          </template>
        </template>
      </section>
    </div>

    <!-- ==================== 其它端点 ==================== -->
    <div v-else class="obs-body obs-split">
      <aside class="obs-side">
        <div class="obs-list">
          <button
            v-for="e in OTHER_ENDPOINTS"
            :key="e"
            type="button"
            class="obs-item"
            :class="{ 'is-on': e === otherEndpoint }"
            @click="openOther(e)"
          >
            {{ e }}
          </button>
        </div>
      </aside>
      <section class="obs-main">
        <div v-if="!otherEndpoint" class="obs-empty">左侧选一个端点读取原始返回</div>
        <template v-else>
          <div class="obs-other-head">
            <span class="mono">/actuator/{{ otherEndpoint }}</span>
            <span class="obs-grow"></span>
            <span class="obs-count">HTTP {{ otherStatus }} · {{ otherElapsed }}ms</span>
          </div>
          <div v-if="otherMessage" class="obs-warn">{{ otherMessage }}</div>
          <pre class="obs-json">{{ otherBody || '（空返回）' }}</pre>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目观测面板。
 *
 * <p>四个页签的数据来源不同，但都在同一个页签里切换：运维排查时「指标 → 日志级别 →
 * 链路」是一条连贯的路径，切来切去反而丢上下文。</p>
 *
 * <p>链路追踪只读 APM 引擎：没接入时给出明确原因，不做假数据兜底。</p>
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from '@repo/core';
import { fetchActuator, setActuatorLogLevel, type ActuatorHttpRecord } from '../api/releaseActuator';
import { getApmStatus, getTrace, listTraces } from '@pages/apm/src/api/apmApi';
import type { ApmSpan, ApmTrace } from '@pages/apm/src/api/apmApi';
import { toastError } from '../utils/errors';

defineOptions({ name: 'ProjectObservePanel' });

const props = withDefaults(
  defineProps<{
    projectId: number;
    projectName?: string;
    /** APM 服务名（用于筛链路）；空串表示没有可用的 APM 上下文 */
    apmService?: string;
    /** 首次落地的页签：metrics / loggers / traces / other */
    initialTab?: string;
  }>(),
  { projectName: '', apmService: '', initialTab: 'metrics' },
);

/** 页签定义 */
const TABS = [
  { key: 'metrics', label: 'Actuator 指标' },
  { key: 'loggers', label: '日志管理' },
  { key: 'traces', label: '链路追踪' },
  { key: 'other', label: '其它端点' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const OTHER_ENDPOINTS = [
  'health',
  'info',
  'env',
  'beans',
  'mappings',
  'configprops',
  'scheduledtasks',
  'conditions',
  'threaddump',
  'startup',
  'httptrace',
  'httpexchanges',
];

const tab = ref<TabKey>((props.initialTab as TabKey) || 'metrics');
const loading = ref(false);
const loadError = ref('');
const currentUrl = ref('');

/** 各页签只在首次进入时拉数据，切回来不重复请求 */
const loaded = reactive<Record<string, boolean>>({});

function switchTab(next: TabKey) {
  if (tab.value === next) return;
  tab.value = next;
  ensureLoaded();
}

function refresh() {
  loaded[tab.value] = false;
  ensureLoaded();
}

function ensureLoaded() {
  if (loaded[tab.value]) return;
  loaded[tab.value] = true;
  if (tab.value === 'metrics') void loadMetrics();
  else if (tab.value === 'loggers') void loadLoggers();
  else if (tab.value === 'traces') void loadTracePage();
  else if (tab.value === 'other') void openOther(otherEndpoint.value || 'health');
}

// ==================== 指标 ====================

const metrics = ref<string[]>([]);
const metricKeyword = ref('');
const metricName = ref('');
const metricDetail = ref<any>(null);

const filteredMetrics = computed(() => {
  const kw = metricKeyword.value.trim().toLowerCase();
  return kw ? metrics.value.filter((n) => n.toLowerCase().includes(kw)) : metrics.value;
});

const metricMeasurements = computed<any[]>(() => {
  const list = metricDetail.value?.measurements;
  return Array.isArray(list) ? list : [];
});

const metricTags = computed<any[]>(() => {
  const list = metricDetail.value?.availableTags;
  return Array.isArray(list) ? list : [];
});

async function loadMetrics() {
  loading.value = true;
  loadError.value = '';
  try {
    const payload = await fetchActuator(props.projectId, 'metrics');
    currentUrl.value = payload.url || '';
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
      metrics.value = [];
      return;
    }
    const parsed = parseJson<any>(payload.body);
    const names = Array.isArray(parsed?.names) ? parsed.names : [];
    metrics.value = names.map((n: unknown) => String(n)).sort();
    if (!metricName.value && metrics.value.length) {
      void openMetric(metrics.value[0]);
    }
  } catch (e: any) {
    loadError.value = e?.message || '读取指标失败';
  } finally {
    loading.value = false;
  }
}

async function openMetric(name: string) {
  if (!name) return;
  metricName.value = name;
  loading.value = true;
  try {
    const payload = await fetchActuator(props.projectId, `metrics/${name}`);
    currentUrl.value = payload.url || currentUrl.value;
    metricDetail.value = payload.status === 200 ? parseJson<any>(payload.body) || { raw: payload.body } : null;
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
    }
  } finally {
    loading.value = false;
  }
}

// ==================== 日志级别 ====================

interface LoggerRow {
  name: string;
  effectiveLevel: string;
  configuredLevel: string;
}

const levels = ref<string[]>(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF']);
const loggerRows = ref<LoggerRow[]>([]);
const loggerKeyword = ref('');
const onlyConfigured = ref(false);
const savingLogger = reactive<Record<string, boolean>>({});
/** 后端因响应体过大截断了列表 */
const loggersTruncated = ref(false);
/** 精确查询单个 logger（列表被截断时用） */
const loggerLookupLoading = ref(false);

const filteredLoggers = computed(() => {
  const kw = loggerKeyword.value.trim().toLowerCase();
  let rows = loggerRows.value;
  if (kw) rows = rows.filter((r) => r.name.toLowerCase().includes(kw));
  if (onlyConfigured.value) rows = rows.filter((r) => !!r.configuredLevel);
  return rows;
});

/** 列表最多渲染 300 行：一个应用动辄上千个 logger，全画出来会卡住滚动 */
const visibleLoggers = computed(() => filteredLoggers.value.slice(0, 300));

async function loadLoggers() {
  loading.value = true;
  loadError.value = '';
  loggersTruncated.value = false;
  try {
    const payload = await fetchActuator(props.projectId, 'loggers');
    currentUrl.value = payload.url || '';
    if (payload.status !== 200) {
      loadError.value = payload.message || `HTTP ${payload.status}`;
      loggerRows.value = [];
      return;
    }
    if (Array.isArray(payload.levels) && payload.levels.length) {
      levels.value = payload.levels;
    }
    loggersTruncated.value = !!payload.truncated;
    // 后端已把列表压成 name/级别三列；老后端没有该字段时退回解析原文
    const rows: LoggerRow[] = Array.isArray(payload.loggers)
      ? payload.loggers.map((row) => ({
          name: String(row.name || ''),
          effectiveLevel: String(row.effectiveLevel || ''),
          configuredLevel: String(row.configuredLevel || ''),
        }))
      : parseLoggersFromBody(payload.body);
    loggerRows.value = rows
      .filter((row) => row.name)
      .sort((a, b) => {
        // ROOT 与已单独设置过的排前面，其余按名字排
        if (a.name === 'ROOT') return -1;
        if (b.name === 'ROOT') return 1;
        const ac = a.configuredLevel ? 0 : 1;
        const bc = b.configuredLevel ? 0 : 1;
        return ac - bc || a.name.localeCompare(b.name);
      });
    if (!loggerRows.value.length && !loggersTruncated.value) {
      loadError.value = '没有读到日志列表，确认 exposure.include 含 loggers';
    }
  } catch (e: any) {
    loadError.value = e?.message || '读取日志级别失败';
  } finally {
    loading.value = false;
  }
}

/**
 * 兜底解析：老后端只回原始 JSON 时，按 {name: {configuredLevel, effectiveLevel}} 取。
 *
 * @param body 原始响应体
 * @returns 日志行
 */
function parseLoggersFromBody(body: string): LoggerRow[] {
  const parsed = parseJson<any>(body);
  const map = parsed?.loggers && typeof parsed.loggers === 'object' ? parsed.loggers : {};
  return Object.keys(map).map((name) => ({
    name,
    effectiveLevel: String(map[name]?.effectiveLevel || ''),
    configuredLevel: String(map[name]?.configuredLevel || ''),
  }));
}

/**
 * 精确查询一个 logger（列表被截断或名字不在列表里时用）。
 *
 * @param name 完整日志名，如 com.chua.demo
 */
async function lookupLogger(name: string) {
  const target = name.trim();
  if (!target || loggerLookupLoading.value) return;
  loggerLookupLoading.value = true;
  try {
    const payload = await fetchActuator(props.projectId, `loggers/${target}`);
    if (payload.status !== 200) {
      message.warning(payload.message || `没查到 ${target}（HTTP ${payload.status}）`);
      return;
    }
    const parsed = parseJson<any>(payload.body) || {};
    const row: LoggerRow = {
      name: target,
      effectiveLevel: String(parsed.effectiveLevel || ''),
      configuredLevel: String(parsed.configuredLevel || ''),
    };
    const exists = loggerRows.value.find((r) => r.name === target);
    if (exists) {
      exists.effectiveLevel = row.effectiveLevel;
      exists.configuredLevel = row.configuredLevel;
    } else {
      loggerRows.value = [row, ...loggerRows.value];
    }
    message.success(`已定位 ${target}`);
  } catch (e: any) {
    toastError(e, '查询日志名失败');
  } finally {
    loggerLookupLoading.value = false;
  }
}

/**
 * 下拉变更入口：把 DOM 事件里的值转出来再走业务逻辑。
 *
 * @param name 日志名称
 * @param ev   变更事件
 */
function onLevelChangeEvent(name: string, ev: Event) {
  const value = (ev.target as HTMLSelectElement).value;
  void onLevelChange(name, value);
}

/**
 * 热更新一个 logger 的级别。
 *
 * @param name  日志名称
 * @param level 目标级别；空串表示继承上级
 */
async function onLevelChange(name: string, level: string) {
  savingLogger[name] = true;
  try {
    const res = await setActuatorLogLevel(props.projectId, name, level);
    if (res.ok) {
      message.success(`${name} → ${level || '继承'}`);
      const row = loggerRows.value.find((r) => r.name === name);
      if (row) row.configuredLevel = level;
      // 生效级别由服务端合并上级后决定，回读一次才准
      void reloadLoggersQuiet();
    } else {
      message.error(res.message || `修改失败（HTTP ${res.status}）`);
    }
  } catch (e: any) {
    toastError(e, '修改日志级别失败');
  } finally {
    savingLogger[name] = false;
  }
}

/** 静默回读：只刷新行数据，不切 loading，避免表格闪一下 */
async function reloadLoggersQuiet() {
  try {
    const payload = await fetchActuator(props.projectId, 'loggers');
    if (Array.isArray(payload.loggers)) {
      for (const row of loggerRows.value) {
        const hit = payload.loggers.find((r) => r.name === row.name);
        if (hit) {
          row.effectiveLevel = String(hit.effectiveLevel || row.effectiveLevel);
          row.configuredLevel = String(hit.configuredLevel || '');
        }
      }
      return;
    }
    const parsed = parseJson<any>(payload.body);
    const map = parsed?.loggers && typeof parsed.loggers === 'object' ? parsed.loggers : {};
    for (const row of loggerRows.value) {
      if (map[row.name]) {
        row.effectiveLevel = String(map[row.name].effectiveLevel || row.effectiveLevel);
        row.configuredLevel = String(map[row.name].configuredLevel || '');
      }
    }
  } catch {
    // 回读失败保留本地值：用户刚看到成功提示，不该因为一次刷新失败又跳回去
  }
}

// ==================== 链路追踪 ====================

const traces = ref<ApmTrace[]>([]);
const traceId = ref('');
const traceSpans = ref<ApmSpan[]>([]);
const traceMinutes = ref(30);
const traceEmpty = ref('');

/** 树节点：span + 深度 + 是否有子节点（按 parentSpanId 建树） */
interface SpanRow {
  key: string;
  span: ApmSpan;
  depth: number;
  hasChildren: boolean;
  parentKey: string;
}

const spanRows = computed<SpanRow[]>(() => buildRows(traceSpans.value));

/** 展开状态：默认全部展开，用户收起某个节点后只隐藏它的子树 */
const expanded = reactive<Record<string, boolean>>({});

const visibleSpanRows = computed(() => {
  const rows = spanRows.value;
  const out: SpanRow[] = [];
  const hidden = new Set<string>();
  for (const row of rows) {
    if (row.parentKey && hidden.has(row.parentKey)) {
      hidden.add(row.key);
      continue;
    }
    out.push(row);
    if (row.hasChildren && expanded[row.key] === false) {
      hidden.add(row.key);
    }
  }
  return out;
});

const allExpanded = computed(() => spanRows.value.every((r) => expanded[r.key] !== false));

const traceDuration = computed(() => {
  const list = traceSpans.value;
  if (!list.length) return '—';
  return fmtMs(Math.max(...list.map((s) => s.durationMs)));
});

/**
 * 按 parentSpanId 把 span 排成树（先序），同一层按开始时间。
 *
 * @param spans 链路里的 span
 * @returns 扁平化的树行
 */
function buildRows(spans: ApmSpan[]): SpanRow[] {
  if (!spans.length) return [];
  const keyOf = (s: ApmSpan) => `${s.segmentId || ''}:${s.spanId}`;
  const byKey = new Map<string, ApmSpan>();
  for (const s of spans) byKey.set(keyOf(s), s);

  const children = new Map<string, ApmSpan[]>();
  const roots: ApmSpan[] = [];
  for (const s of spans) {
    const parentKey = s.parentSpanId ? `${s.segmentId || ''}:${s.parentSpanId}` : '';
    if (parentKey && byKey.has(parentKey)) {
      const list = children.get(parentKey) || [];
      list.push(s);
      children.set(parentKey, list);
    } else {
      roots.push(s);
    }
  }
  const sortByStart = (a: ApmSpan, b: ApmSpan) => a.startTime - b.startTime || b.durationMs - a.durationMs;
  roots.sort(sortByStart);

  const out: SpanRow[] = [];
  const walk = (span: ApmSpan, depth: number, parentKey: string) => {
    const key = keyOf(span);
    const kids = children.get(key) || [];
    out.push({ key, span, depth, hasChildren: kids.length > 0, parentKey });
    kids.sort(sortByStart).forEach((kid) => walk(kid, depth + 1, key));
  };
  roots.forEach((root) => walk(root, 0, ''));
  return out;
}

function toggleNode(key: string) {
  expanded[key] = expanded[key] === false;
}

function toggleAll() {
  const next = !allExpanded.value;
  for (const row of spanRows.value) expanded[row.key] = next;
}

async function loadTracePage() {
  await loadTraces();
  if (traceSource.value === 'apm' && !traceId.value && traces.value.length) {
    await openTrace(traces.value[0].traceId);
  } else if (traceSource.value === 'actuator' && !currentHttpRecord.value && httpRecords.value.length) {
    openHttpRecord(httpRecords.value[0]);
  }
}

/** 当前链路数据来源：apm = APM 引擎 span 树；actuator = Actuator httptrace/httpexchanges 请求记录 */
const traceSource = ref<'apm' | 'actuator'>('apm');

/** Actuator 请求记录（httptrace/httpexchanges） */
interface HttpRecord {
  key: string;
  method: string;
  uri: string;
  status: number;
  timeTaken: number;
  timestamp: number;
  raw: string;
}
const httpRecords = ref<HttpRecord[]>([]);
const currentHttpRecord = ref<HttpRecord | null>(null);
const httpRecordKey = ref('');
/** 实际读取到的记录端点（httptrace / httpexchanges 由后端探测决定） */
const httpTraceEndpoint = ref('httptrace');
/** 记录是否被后端压缩时截断（响应体 >64KB，远端命令通道会截断） */
const httpTraceTruncated = ref(false);
/** 端点是否真的暴露（200 也算，即使一条记录都没有——区分「未暴露」与「无记录」） */
const httpTraceExposed = ref(false);

/**
 * 解析 Actuator httptrace / httpexchanges 响应。
 *
 * <p>优先用后端压缩好的 {@code records}（body 已清空，见 releaseActuator.ts）；
 * 后端未升级或 body 仍是原始 JSON 时，两种端点结构不同——httptrace 是
 * {@code {traces:[...]}}（Spring Boot 2.x），httpexchanges 是 {@code {exchanges:[...]}}
 * （Spring Boot 3.x 起）。这里两个都认，字段统一成 method/uri/status/timeTaken/timestamp
 * 供列表展示。</p>
 *
 * @param payload 端点返回
 * @returns 解析出的记录
 */
function parseHttpTrace(payload: { body?: string; records?: ActuatorHttpRecord[] }): HttpRecord[] {
  const compact = Array.isArray(payload?.records) ? payload.records : [];
  if (compact.length || payload?.records) {
    return compact.map((e: ActuatorHttpRecord, idx: number) => {
      const method = String(e.method || 'GET');
      let uri = String(e.uri || '');
      try {
        uri = new URL(uri).pathname + new URL(uri).search;
      } catch {
        /* 保持原样 */
      }
      const status = Number(e.status || 0);
      const timeTaken = Number(e.timeTaken || 0);
      let timestamp = Number(e.timestamp || 0);
      if (!timestamp && e.timestamp) {
        const ms = Date.parse(String(e.timestamp));
        if (Number.isFinite(ms)) timestamp = ms;
      }
      return {
        key: `${idx}:${method}:${uri}:${status}`,
        method,
        uri,
        status,
        timeTaken,
        timestamp,
        raw: prettyText(JSON.stringify(e, null, 2)),
      };
    });
  }
  const parsed = parseJson<any>(payload?.body || '');
  const list = Array.isArray(parsed?.exchanges) ? parsed.exchanges : Array.isArray(parsed?.traces) ? parsed.traces : [];
  return list.map((e: any, idx: number) => {
    const req = e?.request || {};
    const res = e?.response || {};
    const method = String(req.method || 'GET');
    let uri = String(req.uri || '');
    try {
      uri = new URL(uri).pathname + new URL(uri).search;
    } catch {
      /* 保持原样 */
    }
    const status = Number(res.status || 0);
    const timeTaken = Number(e?.timeTaken || 0);
    let timestamp = Number(e?.timestamp || 0);
    if (!timestamp && e?.timestamp) {
      const ms = Date.parse(String(e.timestamp));
      if (Number.isFinite(ms)) timestamp = ms;
    }
    return {
      key: `${idx}:${method}:${uri}:${status}`,
      method,
      uri,
      status,
      timeTaken,
      timestamp,
      raw: prettyText(JSON.stringify(e, null, 2)),
    };
  });
}

/**
 * 探测并读取 Actuator 请求记录端点（httptrace 优先，404 再试 httpexchanges）。
 *
 * @returns 读到的记录；端点都没暴露时返回空数组
 */
async function loadHttpTraceFallback(): Promise<HttpRecord[]> {
  httpTraceExposed.value = false;
  for (const ep of ['httptrace', 'httpexchanges']) {
    const payload = await fetchActuator(props.projectId, ep);
    if (payload.status === 200) {
      httpTraceExposed.value = true;
      httpTraceEndpoint.value = ep;
      httpTraceTruncated.value = !!payload.truncated;
      const records = parseHttpTrace(payload);
      if (records.length) {
        return records;
      }
    }
  }
  return [];
}

async function loadTraces() {
  loading.value = true;
  traceEmpty.value = '';
  try {
    const status = await getApmStatus();
    if (!status.present || !status.capabilities?.includes('traces')) {
      // APM 没接入：回退到项目自己的 Actuator 请求记录，用户在这里打开的就是 Actuator 语境，
      // 不该被一句「先去注入 agent」挡在门外。
      const records = await loadHttpTraceFallback();
      traces.value = [];
      traceSpans.value = [];
      if (records.length) {
        traceSource.value = 'actuator';
        httpRecords.value = records;
        if (!currentHttpRecord.value && records.length) openHttpRecord(records[0]);
        return;
      }
      traceSource.value = 'apm';
      httpRecords.value = [];
      if (httpTraceExposed.value) {
        traceEmpty.value = `项目 Actuator 已暴露 ${httpTraceEndpoint.value}，但近期没有请求记录`
          + '（应用可能刚启动或没有流量）；要完整 span 链路可注入 SkyWalking / 平台 APM agent';
      } else {
        traceEmpty.value = 'APM 未接入，且项目 Actuator 未暴露 httptrace / httpexchanges：'
          + '要完整 span 链路可注入 SkyWalking / 平台 APM agent；'
          + '或确认 management.endpoints.web.exposure.include 含 httptrace';
      }
      return;
    }
    traceSource.value = 'apm';
    httpRecords.value = [];
    httpTraceEndpoint.value = 'httptrace';
    traces.value = await listTraces({
      service: props.apmService || undefined,
      minutes: traceMinutes.value,
      pageSize: 50,
      orderByDuration: true,
    });
    if (!traces.value.length) {
      traceEmpty.value = `近 ${traceMinutes.value} 分钟没有链路`;
    }
  } catch (e: any) {
    traces.value = [];
    traceEmpty.value = e?.message || '读取链路失败';
  } finally {
    loading.value = false;
  }
}

function openHttpRecord(r: HttpRecord) {
  httpRecordKey.value = r.key;
  currentHttpRecord.value = r;
}

async function openTrace(id: string) {
  if (!id) return;
  traceId.value = id;
  loading.value = true;
  try {
    const detail = await getTrace(id);
    traceSpans.value = detail?.spans || [];
    for (const row of buildRows(traceSpans.value)) expanded[row.key] = true;
  } catch (e: any) {
    traceSpans.value = [];
    traceEmpty.value = e?.message || '读取链路详情失败';
  } finally {
    loading.value = false;
  }
}

// ==================== 其它端点 ====================

const otherEndpoint = ref('health');
const otherBody = ref('');
const otherStatus = ref(0);
const otherElapsed = ref(0);
const otherMessage = ref('');

async function openOther(endpoint: string) {
  otherEndpoint.value = endpoint;
  loading.value = true;
  try {
    const payload = await fetchActuator(props.projectId, endpoint);
    currentUrl.value = payload.url || '';
    otherStatus.value = payload.status;
    otherElapsed.value = payload.elapsedMs;
    otherMessage.value = payload.message || '';
    // httptrace / httpexchanges 后端会压成 records（body 已清空），
    // 这里直接展示压缩后的记录，别让用户看到「（空返回）」
    const compact = Array.isArray(payload.records) ? payload.records : [];
    otherBody.value =
      compact.length || payload.records
        ? prettyText(JSON.stringify(payload.records, null, 2))
        : prettyText(payload.body);
  } catch (e: any) {
    otherMessage.value = e?.message || '读取失败';
    otherBody.value = '';
  } finally {
    loading.value = false;
  }
}

// ==================== 公共 ====================

/** JSON.parse 容错：文本不是 JSON 时返回 null */
function parseJson<T>(text: string): T | null {
  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

/** 能解析就格式化，不能就原样输出 */
function prettyText(text: string): string {
  if (!text) return '';
  const parsed = parseJson<unknown>(text);
  return parsed === null ? text : JSON.stringify(parsed, null, 2);
}

/** 指标明细整体展示用（表格已覆盖常用字段，原始 JSON 留给排障） */
function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function fmtNum(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 10) return `${ms.toFixed(0)}ms`;
  return `${ms.toFixed(1)}ms`;
}

function fmtClock(ms: number): string {
  const d = new Date(ms);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

onMounted(() => {
  if (!TABS.some((t) => t.key === tab.value)) tab.value = 'metrics';
  ensureLoaded();
});
</script>

<style scoped>
.obs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12.5px;
}

.obs-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.obs-tabs {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.obs-tab {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
}

.obs-tab.is-on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.obs-grow {
  flex: 1;
}

.obs-url {
  max-width: 34%;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-btn {
  padding: 3px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.obs-btn:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.obs-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.obs-split {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  gap: 10px;
  overflow: hidden;
  padding: 10px;
}

.obs-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.obs-main {
  min-width: 0;
  overflow: auto;
}

/* 详情读取中的覆盖层：切换指标时旧数据仍在，遮罩给出「在加载」的可见反馈 */
.obs-main-rel { position: relative; }
.obs-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 55%, transparent);
}
.obs-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: obs-spin 0.8s linear infinite;
}
@keyframes obs-spin {
  to { transform: rotate(360deg); }
}

.obs-search {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.obs-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.obs-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.obs-item:hover {
  background: var(--el-fill-color-light);
}

.obs-item.is-on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.obs-empty,
.obs-empty-sm {
  padding: 16px 10px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-align: center;
}

.obs-empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.obs-kpis {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.obs-kpi {
  display: flex;
  min-width: 120px;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.obs-kpi-k {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.obs-kpi-v {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.obs-taglist {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.obs-tagchip {
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.obs-json {
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.obs-hint {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  line-height: 1.6;
}

.obs-hint code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.obs-logger-bar,
.obs-trace-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.obs-logger-bar .obs-search {
  width: 260px;
}

.obs-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.obs-count {
  color: var(--el-text-color-placeholder);
  font-size: 11.5px;
}

.obs-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.obs-tr {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 96px 96px;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.obs-tr:last-child {
  border-bottom: none;
}

.obs-th {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
}

.obs-c-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-c-level.is-set {
  color: var(--el-color-warning);
  font-weight: 600;
}

.obs-select {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 11.5px;
}

.obs-trace-item {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 58px;
  gap: 6px;
}

.obs-trace-item.is-error .obs-trace-ms {
  color: var(--el-color-danger);
}

.obs-trace-ms {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.obs-trace-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-trace-time {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-align: right;
}

.obs-trace-head,
.obs-other-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
}

.obs-tree {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.obs-tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.obs-tree-row:last-child {
  border-bottom: none;
}

.obs-tree-row.is-error .obs-tree-name {
  color: var(--el-color-danger);
}

.obs-tree-row.is-remote {
  background: color-mix(in srgb, var(--el-color-primary) 4%, transparent);
}

.obs-tree-toggle {
  width: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  cursor: pointer;
}

.obs-tree-toggle.is-hidden {
  visibility: hidden;
}

.obs-tree-svc {
  width: 132px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-tree-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obs-tree-ms {
  color: var(--el-text-color-regular);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.obs-warn {
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  font-size: 11.5px;
}

.mono {
  font-family: var(--font-mono, monospace);
}
</style>
