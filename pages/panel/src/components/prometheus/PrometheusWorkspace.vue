<template>
  <section class="prom-workspace">
    <ScLayout
      v-model="railTabValue"
      class="prom-layout"
      left-enabled
      :left-width="260"
      :left-min-width="180"
      :left-max-width="360"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- ─── 左侧面板 ─────────────────────────────────────────────────────── -->
      <template #left>
        <div class="left-panel">
          <!-- 左侧 tab 切换 -->
          <div class="left-tabs">
            <button
              class="left-tab"
              :class="{ 'is-active': leftTab === 'metrics' }"
              @click="leftTab = 'metrics'"
            >
              <ElIcon><DataLine /></ElIcon>
              <span>Metrics</span>
            </button>
            <button
              class="left-tab"
              :class="{ 'is-active': leftTab === 'targets' }"
              @click="leftTab = 'targets'"
            >
              <ElIcon><Connection /></ElIcon>
              <span>Targets</span>
            </button>
          </div>

          <!-- Metrics 列表 -->
          <template v-if="leftTab === 'metrics'">
            <div class="left-search">
              <ElInput
                v-model="metricSearch"
                placeholder="搜索 Metric…"
                clearable
                size="small"
              >
                <template #prefix><ElIcon><Search /></ElIcon></template>
              </ElInput>
              <ElTooltip content="刷新">
                <ElButton
                  :icon="RefreshRight"
                  circle
                  size="small"
                  :loading="metricsLoading"
                  @click="loadMetrics"
                />
              </ElTooltip>
            </div>
            <ElScrollbar class="left-scroll">
              <div v-if="metricsLoading && !filteredMetrics.length" class="left-empty">
                <ElIcon class="is-loading"><Loading /></ElIcon>
                <span>加载中…</span>
              </div>
              <div v-else-if="!filteredMetrics.length" class="left-empty">
                <ElEmpty description="暂无 Metrics" :image-size="40" />
              </div>
              <div v-else class="metric-list">
                <div
                  v-for="m in filteredMetrics"
                  :key="m"
                  class="metric-item"
                  :class="{ 'is-active': promql === m }"
                  @click="fillPromql(m)"
                >
                  <ElIcon class="metric-item__icon"><DataLine /></ElIcon>
                  <span class="metric-item__name">{{ m }}</span>
                </div>
              </div>
            </ElScrollbar>
          </template>

          <!-- Targets 列表 -->
          <template v-else>
            <div class="left-search">
              <ElInput
                v-model="targetSearch"
                placeholder="搜索 Target…"
                clearable
                size="small"
              >
                <template #prefix><ElIcon><Search /></ElIcon></template>
              </ElInput>
              <ElTooltip content="刷新">
                <ElButton
                  :icon="RefreshRight"
                  circle
                  size="small"
                  :loading="targetsLoading"
                  @click="loadTargets"
                />
              </ElTooltip>
            </div>
            <ElScrollbar class="left-scroll">
              <div v-if="targetsLoading" class="left-empty">
                <ElIcon class="is-loading"><Loading /></ElIcon>
                <span>加载中…</span>
              </div>
              <div v-else-if="!filteredTargetGroups.length" class="left-empty">
                <ElEmpty description="暂无 Targets" :image-size="40" />
              </div>
              <div v-else class="target-groups">
                <div
                  v-for="group in filteredTargetGroups"
                  :key="group.job"
                  class="target-group"
                >
                  <div
                    class="target-group__header"
                    @click="group.expanded = !group.expanded"
                  >
                    <ElIcon class="target-group__arrow" :class="{ 'is-expanded': group.expanded }">
                      <ArrowRight />
                    </ElIcon>
                    <span class="target-group__job">{{ group.job }}</span>
                    <span class="target-group__count">{{ group.targets.length }}</span>
                  </div>
                  <div v-if="group.expanded" class="target-items">
                    <div
                      v-for="(t, idx) in group.targets"
                      :key="idx"
                      class="target-item"
                    >
                      <span
                        class="target-item__health"
                        :class="`is-${t.health}`"
                      />
                      <span class="target-item__url">{{ t.labels?.instance || t.scrapeUrl }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElScrollbar>
          </template>
        </div>
      </template>

      <!-- ─── 右侧主内容 ──────────────────────────────────────────────────── -->
      <template #default>
        <div class="main-content">

          <!-- 工作区 tab：PromQL 查询 -->
          <template v-if="railTabValue === 'workspace'">
            <div class="query-panel">
              <div class="query-header">
                <span class="query-title">PromQL 查询</span>
                <div class="query-header__right">
                  <ElSelect v-model="queryMode" size="small" style="width: 110px">
                    <ElOption label="Instant" value="instant" />
                    <ElOption label="Range" value="range" />
                  </ElSelect>
                  <ElButton
                    type="primary"
                    size="small"
                    :loading="queryLoading"
                    @click="executeQuery"
                  >
                    <ElIcon><CaretRight /></ElIcon>
                    执行
                  </ElButton>
                  <ElButton size="small" :icon="Delete" circle @click="clearQuery" />
                </div>
              </div>

              <!-- PromQL 输入 -->
              <div class="query-editor">
                <ElInput
                  v-model="promql"
                  type="textarea"
                  :rows="3"
                  placeholder="输入 PromQL，例如：up、rate(http_requests_total[5m])"
                  class="promql-input"
                  resize="none"
                  @keydown.ctrl.enter="executeQuery"
                />
              </div>

              <!-- Range 参数 -->
              <div v-if="queryMode === 'range'" class="range-bar">
                <div class="range-field">
                  <span class="range-field__label">Start</span>
                  <ElInput v-model="rangeStart" size="small" placeholder="2024-01-01T00:00:00Z" />
                </div>
                <div class="range-field">
                  <span class="range-field__label">End</span>
                  <ElInput v-model="rangeEnd" size="small" placeholder="2024-01-01T01:00:00Z" />
                </div>
                <div class="range-field range-field--narrow">
                  <span class="range-field__label">Step</span>
                  <ElInput v-model="rangeStep" size="small" placeholder="60" style="width: 80px" />
                </div>
              </div>

              <!-- 结果区 -->
              <div class="result-area">
                <div v-if="queryLoading" class="result-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                  <span>查询中…</span>
                </div>
                <div v-else-if="queryError" class="result-error">
                  <ElIcon><Warning /></ElIcon>
                  <span>{{ queryError }}</span>
                </div>
                <div v-else-if="queryResult" class="result-content">
                  <div class="result-meta">
                    <ElTag type="info" effect="plain" size="small">
                      {{ queryResult.resultType }}
                    </ElTag>
                    <ElTag effect="plain" size="small">
                      {{ queryResult.result?.length ?? 0 }} 条
                    </ElTag>
                  </div>

                  <!-- vector 结果表格 -->
                  <ElScrollbar class="result-scroll">
                    <table v-if="queryResult.resultType === 'vector'" class="result-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Value</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, idx) in (queryResult.result as any[])"
                          :key="idx"
                        >
                          <td class="metric-labels">
                            <span
                              v-for="(v, k) in row.metric"
                              :key="k"
                              class="label-badge"
                            >{{ k }}=<em>{{ v }}</em></span>
                          </td>
                          <td class="metric-value">{{ row.value?.[1] }}</td>
                          <td class="metric-ts">{{ formatTs(row.value?.[0]) }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- matrix 结果 -->
                    <div v-else-if="queryResult.resultType === 'matrix'" class="matrix-result">
                      <div
                        v-for="(series, idx) in (queryResult.result as any[])"
                        :key="idx"
                        class="matrix-series"
                      >
                        <div class="matrix-series__header">
                          <span
                            v-for="(v, k) in series.metric"
                            :key="k"
                            class="label-badge"
                          >{{ k }}=<em>{{ v }}</em></span>
                        </div>
                        <table class="result-table result-table--compact">
                          <thead>
                            <tr><th>Timestamp</th><th>Value</th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="([ts, val], vi) in series.values" :key="vi">
                              <td class="metric-ts">{{ formatTs(ts) }}</td>
                              <td class="metric-value">{{ val }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- scalar / string -->
                    <div v-else class="scalar-result">
                      <pre>{{ JSON.stringify(queryResult, null, 2) }}</pre>
                    </div>
                  </ElScrollbar>
                </div>
                <div v-else class="result-placeholder">
                  <ElEmpty description="输入 PromQL 并点击执行" :image-size="64" />
                </div>
              </div>
            </div>
          </template>

          <!-- 告警 tab -->
          <template v-else-if="railTabValue === 'alerts'">
            <div class="alerts-panel">
              <div class="panel-header">
                <span class="panel-title">活跃告警</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="alertsLoading" @click="loadAlerts" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="alertsLoading" class="panel-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="!alertsList.length" class="panel-empty">
                  <ElEmpty description="暂无活跃告警" :image-size="56" />
                </div>
                <div v-else class="alert-cards">
                  <div
                    v-for="(alert, idx) in alertsList"
                    :key="idx"
                    class="alert-card"
                    :class="`is-${alert.state}`"
                  >
                    <div class="alert-card__header">
                      <span class="alert-card__name">{{ alert.labels?.alertname || '未命名' }}</span>
                      <ElTag
                        :type="alert.state === 'firing' ? 'danger' : 'warning'"
                        size="small"
                        effect="dark"
                      >
                        {{ alert.state }}
                      </ElTag>
                    </div>
                    <div class="alert-card__labels">
                      <span
                        v-for="(v, k) in alert.labels"
                        :key="k"
                        class="label-badge"
                      >{{ k }}=<em>{{ v }}</em></span>
                    </div>
                    <div v-if="alert.annotations && Object.keys(alert.annotations).length" class="alert-card__annotations">
                      <div
                        v-for="(v, k) in alert.annotations"
                        :key="k"
                        class="annotation-row"
                      >
                        <span class="annotation-key">{{ k }}</span>
                        <span class="annotation-val">{{ v }}</span>
                      </div>
                    </div>
                    <div class="alert-card__footer">
                      <span class="alert-card__time">触发于 {{ formatIso(alert.activeAt) }}</span>
                      <span class="alert-card__value">值: {{ alert.value }}</span>
                    </div>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- 规则 tab -->
          <template v-else-if="railTabValue === 'rules'">
            <div class="rules-panel">
              <div class="panel-header">
                <span class="panel-title">规则列表</span>
                <div class="panel-header__right">
                  <ElSelect v-model="ruleTypeFilter" size="small" style="width: 120px">
                    <ElOption label="全部" value="" />
                    <ElOption label="Alerting" value="alerting" />
                    <ElOption label="Recording" value="recording" />
                  </ElSelect>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="rulesLoading" @click="loadRules" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="rulesLoading" class="panel-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="!filteredRuleGroups.length" class="panel-empty">
                  <ElEmpty description="暂无规则" :image-size="56" />
                </div>
                <div v-else class="rule-groups">
                  <div
                    v-for="group in filteredRuleGroups"
                    :key="group.name"
                    class="rule-group"
                  >
                    <div class="rule-group__header">
                      <ElIcon><SetUp /></ElIcon>
                      <span class="rule-group__name">{{ group.name }}</span>
                      <span class="rule-group__file">{{ group.file }}</span>
                      <ElTag type="info" effect="plain" size="small">{{ group.rules?.length ?? 0 }} 条</ElTag>
                    </div>
                    <table class="result-table">
                      <thead>
                        <tr>
                          <th>名称</th>
                          <th>类型</th>
                          <th>查询</th>
                          <th>健康</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="rule in group.rules" :key="rule.name">
                          <td>{{ rule.name }}</td>
                          <td>
                            <ElTag
                              :type="rule.type === 'alerting' ? 'danger' : 'success'"
                              size="small"
                              effect="plain"
                            >{{ rule.type }}</ElTag>
                          </td>
                          <td class="rule-query">{{ rule.query }}</td>
                          <td>
                            <span
                              class="health-dot"
                              :class="`is-${rule.health}`"
                            />
                            {{ rule.health }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- 信息 tab -->
          <template v-else-if="railTabValue === 'info'">
            <div class="info-panel">
              <div class="panel-header">
                <span class="panel-title">连接信息</span>
                <ElButton :icon="RefreshRight" circle size="small" @click="loadInfo" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div class="info-cards">
                  <div class="info-card">
                    <div class="info-card__icon">
                      <ElIcon><Connection /></ElIcon>
                    </div>
                    <div class="info-card__body">
                      <span class="info-card__label">连接状态</span>
                      <span class="info-card__value is-success">已连接</span>
                    </div>
                  </div>
                  <div class="info-card">
                    <div class="info-card__icon">
                      <ElIcon><DataLine /></ElIcon>
                    </div>
                    <div class="info-card__body">
                      <span class="info-card__label">Metrics 总数</span>
                      <span class="info-card__value">{{ metrics.length }}</span>
                    </div>
                  </div>
                  <div class="info-card">
                    <div class="info-card__icon">
                      <ElIcon><Monitor /></ElIcon>
                    </div>
                    <div class="info-card__body">
                      <span class="info-card__label">Targets 总数</span>
                      <span class="info-card__value">{{ totalTargets }}</span>
                    </div>
                  </div>
                  <div class="info-card">
                    <div class="info-card__icon">
                      <ElIcon><Warning /></ElIcon>
                    </div>
                    <div class="info-card__body">
                      <span class="info-card__label">活跃告警</span>
                      <span class="info-card__value" :class="{ 'is-danger': alertsList.length > 0 }">
                        {{ alertsList.length }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="info-section">
                  <div class="info-section__title">Labels 列表</div>
                  <div class="label-chips">
                    <span v-for="l in labels" :key="l" class="label-chip">{{ l }}</span>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  CaretRight,
  Connection,
  DataLine,
  Delete,
  Loading,
  Monitor,
  RefreshRight,
  Search,
  SetUp,
  Warning,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, markRaw, onMounted, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchPrometheusAlerts,
  fetchPrometheusRules,
  listPrometheusLabels,
  listPrometheusMetrics,
  listPrometheusTargets,
  queryPrometheus,
  queryRangePrometheus,
} from "../../api/prometheus";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ────────────────────────────────────────────────────────────────
const railTabs = [
  { name: "workspace", title: "查询", icon: markRaw(DataLine) },
  { name: "alerts", title: "告警", icon: markRaw(Warning) },
  { name: "rules", title: "规则", icon: markRaw(SetUp) },
  { name: "info", title: "信息", icon: markRaw(Connection) },
];
const railTabValue = ref("workspace");

// ─── 左侧 tab ─────────────────────────────────────────────────────────────────
const leftTab = ref<"metrics" | "targets">("metrics");

// ─── Metrics ──────────────────────────────────────────────────────────────────
const metrics = ref<string[]>([]);
const metricsLoading = ref(false);
const metricSearch = ref("");

const filteredMetrics = computed(() => {
  const term = metricSearch.value.trim().toLowerCase();
  if (!term) return metrics.value;
  return metrics.value.filter((m) => m.toLowerCase().includes(term));
});

const loadMetrics = async () => {
  metricsLoading.value = true;
  try {
    const res = await listPrometheusMetrics(props.connectionId);
    metrics.value = (res?.data ?? []).sort();
  } catch {
    ElMessage.error("加载 Metrics 失败");
  } finally {
    metricsLoading.value = false;
  }
};

// ─── Labels ───────────────────────────────────────────────────────────────────
const labels = ref<string[]>([]);

const loadLabels = async () => {
  try {
    const res = await listPrometheusLabels(props.connectionId);
    labels.value = res?.data ?? [];
  } catch {
    // 静默
  }
};

// ─── Targets ──────────────────────────────────────────────────────────────────
interface TargetGroup {
  job: string;
  expanded: boolean;
  targets: {
    health: string;
    labels: Record<string, string>;
    scrapeUrl: string;
  }[];
}

const targetGroups = ref<TargetGroup[]>([]);
const targetsLoading = ref(false);
const targetSearch = ref("");
const totalTargets = ref(0);

const filteredTargetGroups = computed(() => {
  const term = targetSearch.value.trim().toLowerCase();
  if (!term) return targetGroups.value;
  return targetGroups.value.filter(
    (g) =>
      g.job.toLowerCase().includes(term) ||
      g.targets.some(
        (t) =>
          (t.labels?.instance ?? "").toLowerCase().includes(term) ||
          t.scrapeUrl.toLowerCase().includes(term)
      )
  );
});

const loadTargets = async () => {
  targetsLoading.value = true;
  try {
    const res = await listPrometheusTargets(props.connectionId);
    const data = (res?.data as any)?.data ?? {};
    const activeTargets: any[] = data.activeTargets ?? [];
    totalTargets.value = activeTargets.length;
    const groupMap = new Map<string, TargetGroup>();
    for (const t of activeTargets) {
      const job = t.labels?.job ?? "unknown";
      if (!groupMap.has(job)) {
        groupMap.set(job, { job, expanded: true, targets: [] });
      }
      groupMap.get(job)!.targets.push({
        health: t.health,
        labels: t.labels ?? {},
        scrapeUrl: t.scrapeUrl ?? "",
      });
    }
    targetGroups.value = Array.from(groupMap.values());
  } catch {
    ElMessage.error("加载 Targets 失败");
  } finally {
    targetsLoading.value = false;
  }
};

// ─── PromQL 查询 ──────────────────────────────────────────────────────────────
const promql = ref("");
const queryMode = ref<"instant" | "range">("instant");
const rangeStart = ref("");
const rangeEnd = ref("");
const rangeStep = ref("60");
const queryLoading = ref(false);
const queryError = ref("");
const queryResult = ref<any>(null);

const fillPromql = (metric: string) => {
  promql.value = metric;
  railTabValue.value = "workspace";
};

const clearQuery = () => {
  promql.value = "";
  queryResult.value = null;
  queryError.value = "";
};

const executeQuery = async () => {
  if (!promql.value.trim()) {
    ElMessage.warning("请输入 PromQL");
    return;
  }
  queryLoading.value = true;
  queryError.value = "";
  queryResult.value = null;
  try {
    let res: any;
    if (queryMode.value === "range") {
      res = await queryRangePrometheus(
        props.connectionId,
        promql.value,
        rangeStart.value || String(Math.floor(Date.now() / 1000) - 3600),
        rangeEnd.value || String(Math.floor(Date.now() / 1000)),
        rangeStep.value || "60"
      );
    } else {
      res = await queryPrometheus(props.connectionId, promql.value);
    }
    const raw = res?.data as any;
    if (raw?.status === "error") {
      queryError.value = raw.error ?? "查询失败";
    } else {
      queryResult.value = raw?.data ?? null;
    }
  } catch (e: any) {
    queryError.value = e?.message ?? "查询失败";
  } finally {
    queryLoading.value = false;
  }
};

// ─── 告警 ─────────────────────────────────────────────────────────────────────
const alertsList = ref<any[]>([]);
const alertsLoading = ref(false);

const loadAlerts = async () => {
  alertsLoading.value = true;
  try {
    const res = await fetchPrometheusAlerts(props.connectionId);
    const data = (res?.data as any)?.data ?? {};
    alertsList.value = data.alerts ?? [];
  } catch {
    ElMessage.error("加载告警失败");
  } finally {
    alertsLoading.value = false;
  }
};

// ─── 规则 ─────────────────────────────────────────────────────────────────────
const ruleGroups = ref<any[]>([]);
const rulesLoading = ref(false);
const ruleTypeFilter = ref("");

const filteredRuleGroups = computed(() => {
  if (!ruleTypeFilter.value) return ruleGroups.value;
  return ruleGroups.value
    .map((g) => ({
      ...g,
      rules: (g.rules ?? []).filter((r: any) => r.type === ruleTypeFilter.value),
    }))
    .filter((g) => g.rules.length > 0);
});

const loadRules = async () => {
  rulesLoading.value = true;
  try {
    const res = await fetchPrometheusRules(props.connectionId);
    const data = (res?.data as any)?.data ?? {};
    ruleGroups.value = data.groups ?? [];
  } catch {
    ElMessage.error("加载规则失败");
  } finally {
    rulesLoading.value = false;
  }
};

// ─── 信息 ─────────────────────────────────────────────────────────────────────
const loadInfo = () => {
  loadMetrics();
  loadLabels();
  loadTargets();
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const formatTs = (ts: number) => {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("zh-CN");
};

const formatIso = (iso: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("zh-CN");
  } catch {
    return iso;
  }
};

// ─── 初始化 ───────────────────────────────────────────────────────────────────
onMounted(() => {
  loadMetrics();
  loadTargets();
  loadLabels();
  loadAlerts();
  loadRules();
});
</script>

<style scoped lang="scss">
.prom-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.prom-layout {
  height: 100%;
}

// ─── 左侧面板 ──────────────────────────────────────────────────────────────────
.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #f0f2f9, #e8ecf5);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    z-index: 1;
  }
}

.left-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.left-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  padding: 7px 10px;
  border: none;
  border-radius: 8px 8px 0 0;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &.is-active {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(8px);
    color: #4f46e5;
    font-weight: 600;
    border-bottom: 2px solid;
    border-image: linear-gradient(90deg, #6366f1, #8b5cf6) 1;
  }

  &:hover:not(.is-active) {
    background: rgba(99,102,241,0.06);
    color: #6366f1;
  }
}

.left-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.left-scroll {
  flex: 1;
  min-height: 0;
}

.left-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 12px;
}

// ─── Metrics 列表 ──────────────────────────────────────────────────────────────
.metric-list {
  padding: 4px 0;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: rgba(99,102,241, 0.06);
  }

  &.is-active {
    background: rgba(99,102,241, 0.12);
    color: #4f46e5;
  }
}

.metric-item__icon {
  color: #6366f1;
  font-size: 13px;
  flex-shrink: 0;
}

.metric-item__name {
  font-size: 12px;
  color: #334155;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ─── Targets ──────────────────────────────────────────────────────────────────
.target-groups {
  padding: 4px 0;
}

.target-group__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(99,102,241, 0.05);
  }
}

.target-group__arrow {
  color: #94a3b8;
  font-size: 11px;
  transition: transform 0.18s;

  &.is-expanded {
    transform: rotate(90deg);
  }
}

.target-group__job {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-group__count {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 1px 7px;
}

.target-items {
  padding-left: 24px;
}

.target-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
}

.target-item__health {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-up {
    background: #22c55e;
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
  }

  &.is-down {
    background: #ef4444;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
  }

  &.is-unknown {
    background: #f59e0b;
  }
}

.target-item__url {
  font-size: 11px;
  color: #64748b;
  font-family: "JetBrains Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ─── 主内容区 ──────────────────────────────────────────────────────────────────
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

// ─── 查询面板 ──────────────────────────────────────────────────────────────────
.query-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 12px;
  box-sizing: border-box;
}

.query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.query-title {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.query-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-editor {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #1e293b);
  box-shadow: 0 2px 8px rgba(15, 37, 52, 0.04);
}

.promql-input :deep(.el-textarea__inner) {
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px 14px;
  border: none;
  box-shadow: none;
  background: transparent;
  color: #e2e8f0;
}

.range-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.9);
}

.range-field {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;

  &--narrow {
    flex: 0 0 auto;
  }
}

.range-field__label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

// ─── 结果区 ────────────────────────────────────────────────────────────────────
.result-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
}

.result-loading,
.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  color: #94a3b8;
  font-size: 13px;

  .el-icon {
    font-size: 32px;
    color: #c8d8e4;
  }
}

.result-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #dc2626;
  font-size: 13px;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 8px;
  margin: 12px;
}

.result-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.8);
}

.result-scroll {
  flex: 1;
  min-height: 0;
}

// ─── 结果表格 ──────────────────────────────────────────────────────────────────
.result-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;

  &--compact {
    margin: 0 0 8px;
  }

  th {
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    background: rgba(248, 250, 252, 0.9);
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    vertical-align: top;
  }

  tr:hover td {
    background: rgba(99,102,241,0.04);
  }
}

.metric-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.metric-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #4f46e5;
  font-weight: 600;
  white-space: nowrap;
}

.metric-ts {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.16);
  font-size: 11px;
  color: #6366f1;
  font-family: "JetBrains Mono", monospace;

  em {
    font-style: normal;
    color: #4f46e5;
    font-weight: 600;
    margin-left: 2px;
  }
}

// ─── Matrix 结果 ───────────────────────────────────────────────────────────────
.matrix-result {
  padding: 8px;
}

.matrix-series {
  margin-bottom: 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.matrix-series__header {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.9);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.scalar-result pre {
  padding: 16px;
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-all;
}

// ─── 通用面板 ──────────────────────────────────────────────────────────────────
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.9);
}

.panel-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.panel-scroll {
  flex: 1;
  min-height: 0;
}

.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px;
  color: #94a3b8;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.alerts-panel,
.rules-panel,
.info-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

// ─── 告警卡片 ──────────────────────────────────────────────────────────────────
.alert-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.alert-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(15, 37, 52, 0.04);

  &.is-firing {
    border-left: 3px solid #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.04), rgba(255,255,255,0.7) 40%);
  }

  &.is-pending {
    border-left: 3px solid #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(255,255,255,0.7) 40%);
  }
}

.alert-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.alert-card__name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.alert-card__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.alert-card__annotations {
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.9);
}

.annotation-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.annotation-key {
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.annotation-val {
  color: #334155;
}

.alert-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

// ─── 规则 ──────────────────────────────────────────────────────────────────────
.rule-groups {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rule-group {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
}

.rule-group__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(248, 250, 252, 0.9);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 13px;
}

.rule-group__name {
  font-weight: 700;
  color: #1e293b;
}

.rule-group__file {
  font-size: 11px;
  color: #94a3b8;
  font-family: "JetBrains Mono", monospace;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-query {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: #64748b;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 4px;

  &.is-ok {
    background: #22c55e;
  }

  &.is-err {
    background: #ef4444;
  }

  &.is-unknown {
    background: #f59e0b;
  }
}

// ─── 信息面板 ──────────────────────────────────────────────────────────────────
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(15, 37, 52, 0.04);
}

.info-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #38bdf8);
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.info-card__body {
  display: grid;
  gap: 4px;
}

.info-card__label {
  font-size: 11px;
  color: #94a3b8;
}

.info-card__value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;

  &.is-success {
    color: #16a34a;
  }

  &.is-danger {
    color: #dc2626;
  }
}

.info-section {
  padding: 0 16px 16px;
}

.info-section__title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.label-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label-chip {
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.16);
  font-size: 12px;
  color: #6366f1;
  font-family: "JetBrains Mono", monospace;
}

// ── Dark Mode ──
:global(html.dark) {
  .left-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
    border-right: 1px solid rgba(148, 163, 184, 0.08);
  }
  .left-tabs { border-bottom-color: rgba(148, 163, 184, 0.08); }
  .left-tab {
    color: #64748b;
    &.is-active {
      background: rgba(15, 23, 42, 0.6);
      color: #a5b4fc;
      box-shadow: 0 -2px 0 #818cf8 inset;
    }
    &:hover:not(.is-active) {
      background: rgba(148, 163, 184, 0.06);
      color: #94a3b8;
    }
  }
  .left-search {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .left-empty { color: #64748b; }

  .metric-item {
    &:hover { background: rgba(148, 163, 184, 0.06); }
    &.is-active { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
  }
  .metric-item__name { color: #cbd5e1; }

  .target-group__header:hover { background: rgba(148, 163, 184, 0.06); }
  .target-group__arrow { color: #64748b; }
  .target-group__job { color: #e2e8f0; }
  .target-group__count { color: #64748b; background: rgba(148, 163, 184, 0.1); }
  .target-item__url { color: #94a3b8; }

  .query-title { color: #e2e8f0; }
  .query-editor {
    border-color: rgba(148, 163, 184, 0.15);
    background: rgba(15, 23, 42, 0.5);
    box-shadow: none;
  }
  .promql-input :deep(.el-textarea__inner) { color: #e2e8f0; }

  .range-bar {
    background: rgba(15, 23, 42, 0.4);
    border-color: rgba(148, 163, 184, 0.12);
  }
  .range-field__label { color: #64748b; }

  .result-area {
    border-color: rgba(148, 163, 184, 0.12);
    background: rgba(15, 23, 42, 0.4);
  }
  .result-loading,
  .result-placeholder {
    color: #64748b;
    .el-icon { color: #475569; }
  }
  .result-error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
  .result-meta {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .result-table {
    th {
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.5);
      border-bottom-color: rgba(148, 163, 184, 0.1);
    }
    td {
      color: #cbd5e1;
      border-bottom-color: rgba(148, 163, 184, 0.06);
    }
    tr:hover td { background: rgba(99, 102, 241, 0.06); }
  }
  .metric-value { color: #a5b4fc; }
  .metric-ts { color: #64748b; }

  .label-badge {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    em { color: #c7d2fe; }
  }

  .matrix-series { border-color: rgba(148, 163, 184, 0.1); }
  .matrix-series__header {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .scalar-result pre { color: #cbd5e1; }

  .panel-header {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .panel-title { color: #e2e8f0; }
  .panel-loading { color: #64748b; }

  .alert-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
    &.is-firing {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.6) 40%);
    }
    &.is-pending {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.6) 40%);
    }
  }
  .alert-card__name { color: #e2e8f0; }
  .alert-card__annotations { background: rgba(148, 163, 184, 0.06); }
  .annotation-key { color: #64748b; }
  .annotation-val { color: #94a3b8; }
  .alert-card__footer { color: #64748b; }

  .rule-group {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
  }
  .rule-group__header {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .rule-group__name { color: #e2e8f0; }
  .rule-group__file { color: #64748b; }
  .rule-query { color: #94a3b8; }

  .info-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
  }
  .info-card__label { color: #64748b; }
  .info-card__value { color: #e2e8f0; }
  .info-section__title { color: #94a3b8; }
  .label-chip {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }
}
</style>

