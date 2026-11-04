<template>
  <div class="dsm tel-page">
    <!-- 顶栏 -->
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataLine" :size="18" class="dsm-title-icon dsm-sky-icon" />
        <span class="dsm-title">SkyWalking 链路管理</span>
        <span class="dsw-state" :class="stateClass">
          <i class="dsw-state-dot" />
          {{ statusText }}
        </span>
        <span v-if="metaText" class="dsw-meta">{{ metaText }}</span>
      </div>

      <div class="dsm-toolbar-right">
        <div class="dsm-db-select">
          <ReSelect
            :model-value="datasourceId"
            data-testid="dsw-select-source"
            placeholder="选择实例"
            @change="onSwitchSource"
          >
            <ReOption v-for="d in sources" :key="d.id" :value="d.id" :label="d.name || `${d.host}:${d.port || 12800}`" />
          </ReSelect>
        </div>

        <ReButton
          layout="square"
          icon="Refresh"
          tip="刷新"
          data-testid="dsw-btn-refresh"
          :loading="overviewLoading"
          @click="reloadOverview"
        />
      </div>
    </div>

    <MiddlewareGap v-if="gap" :text="gap" @retry="onGapRetry" />

    <div v-else class="dsm-body">
      <!-- 左侧菜单 -->
      <aside class="dsm-sidebar dsw-nav">
        <div class="dsw-nav-header">
          <span class="dsw-nav-title">SKYWALKING 控制台</span>
        </div>
        <div class="dsw-nav-list">
          <button
            v-for="t in tabs"
            :key="t.name"
            class="dsw-nav-item"
            :class="{ active: activeTab === t.name }"
            type="button"
            :data-testid="`dsw-tab-${t.name}`"
            @click="goTab(t.name)"
          >
            <ReIcon :name="t.icon" :size="14" class="dsw-nav-icon" />
            <span>{{ t.label }}</span>
          </button>
        </div>
      </aside>

      <!-- 内容区 -->
      <section class="dsw-main">
        <!-- 总览 -->
        <div v-if="activeTab === 'overview'" class="dsw-view">
          <div class="dsw-info-card re-surface">
            <div class="dsw-info-row">
              <span class="dsw-info-label">数据源</span>
              <span class="dsw-info-value">{{ source ? source.name : "未选择" }}</span>
            </div>
            <div class="dsw-info-row">
              <span class="dsw-info-label">OAP 地址</span>
              <span class="dsw-info-value mono">{{ overview ? overview.url : source ? `${source.host}:${source.port || 12800}` : "—" }}</span>
            </div>
            <div class="dsw-info-row">
              <span class="dsw-info-label">状态</span>
              <div class="dsw-info-status">
                <ReTag :type="overview && overview.available ? 'success' : 'danger'">
                  {{ overview ? (overview.available ? "运行中" : "不可达") : "未检测" }}
                </ReTag>
                <span class="dsw-info-sub">版本 {{ overview ? (overview.version || "unknown") : "—" }}</span>
              </div>
            </div>
            <div class="dsw-info-row">
              <span class="dsw-info-label">数据源</span>
              <span class="dsw-info-sub">{{ overview ? (overview.enabled ? "已启用" : "已停用") : "—当前未启用" }}</span>
            </div>
          </div>

          <div class="dsw-stats">
            <div class="dsw-stat re-surface">
              <span class="dsw-stat-value">{{ overview ? overview.serviceCount : 0 }}</span>
              <span class="dsw-stat-label">服务数</span>
            </div>
            <div class="dsw-stat re-surface">
              <span class="dsw-stat-value">{{ overview ? overview.alarmCount : 0 }}</span>
              <span class="dsw-stat-label">活跃告警</span>
            </div>
            <div class="dsw-stat re-surface">
              <span class="dsw-stat-value">{{ overview ? overview.recentAlarmCount : 0 }}</span>
              <span class="dsw-stat-label">最近 15 分钟告警</span>
            </div>
            <div class="dsw-stat re-surface">
              <span class="dsw-stat-value">{{ checkedAtText }}</span>
              <span class="dsw-stat-label">探测时间</span>
            </div>
          </div>

          <div class="dsw-section re-surface">
            <div class="dsw-section-title">能力清单</div>
            <div class="dsw-capabilities">
              <span v-for="c in (overview && overview.capabilities) || []" :key="c" class="dsw-capacity chalk">
                <ReIcon name="CheckTag" size="12" />
                {{ c }}
              </span>
              <span v-if="!overview || !overview.capabilities.length" class="dsw-muted">暂无能力信息</span>
            </div>
          </div>
        </div>

        <!-- 服务目录 -->
        <div v-if="activeTab === 'services'" class="dsw-view">
          <div class="dsw-filter-bar re-surface">
            <ReInput v-model="serviceFilter.keyword" clearable placeholder="按服务名关键字过滤" style="width: 200px" />
            <ReButton type="primary" :loading="servicesLoading" @click="loadServices">
              <template #icon><ReIcon name="Search" size="12" /></template>查询
            </ReButton>
            <span class="dsw-spacer" />
            <ReButton text @click="loadServices">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <ReTable
            :data="services"
            :columns="serviceColumns"
            :loading="servicesLoading"
            :total="serviceTotal"
            stripe
            border
            height="550px"
            @page-change="onServicePage"
          >
            <template #row-name="{ row }">
              <ReButton text type="primary" @click="openService(row)">{{ row.name }}</ReButton>
            </template>
            <template #avgMs="{ row }">{{ formatMs(row.avgMs) }}</template>
            <template #p95Ms="{ row }">{{ formatMs(row.p95Ms) }}</template>
            <template #p99Ms="{ row }">{{ formatMs(row.p99Ms) }}</template>
            <template #errorRate="{ row }">
              <ReTag :type="row.errorRate > 0 ? 'danger' : 'success'" size="small">{{ (row.errorRate * 100).toFixed(2) + '%' }}</ReTag>
            </template>
            <template #tags="{ row }">
              <div class="dsw-tags">
                <ReTag v-for="t in row.tags" :key="t.key" size="small" type="info">{{ t.key }}={{ t.value }}</ReTag>
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 链路 -->
        <div v-if="activeTab === 'traces'" class="dsw-view">
          <div class="dsw-filter-bar re-surface">
            <ReInput v-model="traceForm.serviceName" clearable placeholder="服务名" style="width: 140px" />
            <ReInput v-model="traceForm.keyword" clearable placeholder="端点名/链路 ID" style="width: 140px" />
            <ReSelect v-model="traceForm.state" style="width: 140px">
              <ReOption label="全部" value="ALL" />
              <ReOption label="成功" value="SUCCESS" />
              <ReOption label="失败" value="ERROR" />
            </ReSelect>
            <ReInput v-model="traceForm.startTime" type="number" placeholder="起始(ms)" style="width: 130px" />
            <ReInput v-model="traceForm.endTime" type="number" placeholder="结束(ms)" style="width: 130px" />
            <ReButton type="primary" :loading="tracesLoading" @click="loadTraces">
              <template #icon><ReIcon name="Search" size="12" /></template>查询
            </ReButton>
          </div>
          <ReTable
            :data="traces"
            :columns="traceColumns"
            :loading="tracesLoading"
            :total="traceTotal"
            stripe
            border
            height="500px"
            @page-change="onTracePage"
          >
            <template #startTime="{ row }">{{ row.startTime ? formatTime(row.startTime) : "—" }}</template>
            <template #durationMs="{ row }">{{ formatMs(row.durationMs) }}</template>
            <template #error="{ row }">
              <ReTag :type="row.error ? 'danger' : 'success'" size="small">{{ row.error ? "失败" : "成功" }}</ReTag>
            </template>
          </ReTable>
        </div>

        <!-- 拓扑 -->
        <div v-if="activeTab === 'topology'" class="dsw-view">
          <div class="dsw-filter-bar re-surface">
            <ReSelect v-model="topologyForm.serviceName" clearable placeholder="按服务过滤（留空查全局拓扑）" style="width: 160px">
              <ReOption v-for="s in services" :key="s.name" :value="s.name" :label="s.name" />
            </ReSelect>
            <ReButton type="primary" :loading="topologyLoading" @click="loadTopology">
              <template #icon><ReIcon name="Search" size="12" /></template>查询
            </ReButton>
          </div>
          <div v-if="topology" class="dsw-topology re-surface">
            <svg viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet" class="dsw-topology-svg">
              <!-- 调用线 -->
              <g class="dsw-edges">
                <line
                  v-for="(c, i) in topology.calls"
                  :key="c.id || i"
                  :x1="nodeX(nodeOf(c.source))"
                  :y1="nodeY(nodeOf(c.source))"
                  :x2="nodeX(nodeOf(c.target))"
                  :y2="nodeY(nodeOf(c.target))"
                  stroke="var(--border-subtle)"
                  stroke-width="1"
                  marker-end="url(#arrow)"
                />
              </g>
              <!-- 箭头 -->
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="6" markerHeight="6">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-subtle)" />
                </marker>
              </defs>
              <!-- 节点 -->
              <g class="dsw-nodes">
                <g
                  v-for="n in topology.nodes"
                  :key="n.id"
                  transform="translate(x, y)"
                  @click="() => {}"
                >
                  <rect :x="-80" :y="-26" width="160" height="52" rx="6" :fill="nodeColor(n.type)" stroke="var(--border-subtle)" stroke-width="1" />
                  <text text-anchor="middle" dominant-baseline="middle" class="dsw-node-label">{{ n.name }}</text>
                  <text
                    y="16"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="dsw-node-sub"
                    font-size="10"
                  >
                    {{ n.type }} · {{ nodeTypeLabel(n.type) }}
                  </text>
                </g>
              </g>
            </svg>
            <div class="dsw-topology-meta">
              共 {{ topology.nodes.length }} 个节点 / {{ topology.calls.length }} 条调用
            </div>
          </div>
          <ReEmpty v-else description="点击上方「查询」绘制拓扑" />
        </div>

        <!-- 告警 -->
        <div v-if="activeTab === 'alarms'" class="dsw-view">
          <div class="dsw-filter-bar re-surface">
            <ReInput v-model="alarmForm.keyword" clearable placeholder="告警内容关键字" style="width: 200px" />
            <ReButton type="primary" :loading="alarmsLoading" @click="loadAlarms">
              <template #icon><ReIcon name="Search" size="12" /></template>查询
            </ReButton>
            <span class="dsw-spacer" />
            <ReButton text @click="loadAlarms">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <ReTable
            :data="alarms"
            :columns="alarmColumns"
            :loading="alarmsLoading"
            stripe
            border
            height="550px"
          >
            <template #startTime="{ row }">{{ row.startTime ? formatTime(row.startTime) : "—" }}</template>
            <template #scope="{ row }">
              <ReTag size="small" type="warning">{{ row.scope }}</ReTag>
            </template>
            <template #events="{ row }">{{ row.events?.length ?? 0 }}</template>
          </ReTable>
        </div>

        <!-- 日志 -->
        <div v-if="activeTab === 'logs'" class="dsw-view">
          <div class="dsw-filter-bar re-surface">
            <ReInput v-model="logForm.serviceName" clearable placeholder="服务名" style="width: 130px" />
            <ReInput v-model="logForm.keyword" clearable placeholder="日志内容" style="width: 140px" />
            <ReButton type="primary" :loading="logsLoading" @click="loadLogs">
              <template #icon><ReIcon name="Search" size="12" /></template>查询
            </ReButton>
          </div>
          <ReTable
            :data="logs"
            :columns="logColumns"
            :loading="logsLoading"
            stripe
            border
            height="550px"
          >
            <template #timestamp="{ row }">{{ row.timestamp ? formatTime(row.timestamp) : "—" }}</template>
            <template #content="{ row }">{{ truncate(row.content ?? "", 60) }}</template>
          </ReTable>
        </div>
      </section>
    </div>

    <!-- 服务详情（实例 / 端点）弹窗 -->
    <ReDialog
      v-model="serviceDetailVisible"
      :title="`服务详情：${currentService?.name}`"
      width="900px"
      :close-on-click-modal="false"
      data-testid="dsw-dialog-service"
    >
      <ReTabs v-model="serviceDetailTab" :description="''">
        <ReTab name="instances" label="实例">
          <ReTable :data="currentInstances" :columns="instanceColumns" :loading="instancesLoading" stripe border height="400px">
            <template #heartbeatTime="{ row }">{{ row.heartbeatTime ? formatTime(row.heartbeatTime) : "—" }}</template>
          </ReTable>
        </ReTab>
        <ReTab name="endpoints" label="端点">
          <ReTable :data="currentEndpoints" :columns="endpointColumns" :loading="endpointsLoading" stripe border height="400px">
            <template #avgMs="{ row }">{{ formatMs(row.avgMs) }}</template>
            <template #errorRate="{ row }">
              <ReTag :type="row.errorRate > 0 ? 'danger' : 'success'" size="small">{{ (row.errorRate * 100).toFixed(2) + '%' }}</ReTag>
            </template>
          </ReTable>
        </ReTab>
      </ReTabs>
    </ReDialog>

    <!-- 链路详情弹窗 -->
    <ReDialog
      v-model="traceDetailVisible"
      title="链路详情"
      width="860px"
      :close-on-click-modal="false"
      data-testid="dsw-dialog-trace"
    >
      <div v-if="currentTrace">
        <div class="dsw-info-card re-surface" style="margin-bottom: 12px">
          <div class="dsw-info-row">
            <span class="dsw-info-label">链路 ID</span>
            <span class="dsw-info-value mono">{{ currentTrace.traceId }}</span>
          </div>
          <div class="dsw-info-row">
            <span class="dsw-info-label">开始/结束</span>
            <span class="dsw-info-value">{{ currentTrace.startTime ? formatTime(currentTrace.startTime) : "—" }} / {{ currentTrace.endTime ? formatTime(currentTrace.endTime) : "—" }}</span>
          </div>
          <div class="dsw-info-row">
            <span class="dsw-info-label">服务 / 端点</span>
            <span class="dsw-info-value">{{ currentTrace.serviceName }} / {{ currentTrace.endpointName }}</span>
          </div>
          <div class="dsw-info-row">
            <span class="dsw-info-label">耗时 / Span 数 / 错误</span>
            <span class="dsw-info-value">{{ formatMs(currentTrace.durationMs) }} · {{ currentTrace.spanCount }} · {{ currentTrace.error ? "是" : "否" }}</span>
          </div>
        </div>
        <div class="dsw-spf">
          <div class="dsw-spf-title">Span 树</div>
          <div class="dsw-spf-scroll">
            <div v-for="s in traceRoots" :key="s.spanId" class="dsw-span-row">
              <div class="dsw-span-header">
                <div class="dsw-span-header-left">
                  <span class="dsw-span-pad" style="width: 18px" />
                  <ReIcon :name="spanIcon(s)" size="14" class="dsw-span-icon" />
                  <span class="dsw-span-name">{{ s.endpointName || s.name || s.serviceName }}</span>
                  <ReTag size="small" type="info" class="dsw-span-layer">{{ s.layer }}</ReTag>
                  <span class="dsw-span-meta">{{ formatMs(s.durationMs) }} · {{ s.type }}</span>
                </div>
                <div class="dsw-span-header-right">
                  <ReTag v-if="s.error" type="danger" size="small">ERROR</ReTag>
                </div>
              </div>
              <div v-for="(c, ci) in spanChildren(s)" :key="c.spanId" class="dsw-span-row dsw-span-child">
                <div class="dsw-span-header">
                  <div class="dsw-span-header-left">
                    <span class="dsw-span-pad" style="width: 40px" />
                    <ReIcon :name="spanIcon(c)" size="14" class="dsw-span-icon" />
                    <span class="dsw-span-name">{{ c.endpointName || c.name || c.serviceName }}</span>
                    <ReTag size="small" type="info" class="dsw-span-layer">{{ c.layer }}</ReTag>
                    <span class="dsw-span-meta">{{ formatMs(c.durationMs) }} · {{ c.type }}</span>
                  </div>
                  <div class="dsw-span-header-right">
                    <ReTag v-if="c.error" type="danger" size="small">ERROR</ReTag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="SkywalkingManageView">
/**
 * SkyWalking 管理页
 *
 * <p>基于「数据源管理」登记的 skywalking 数据源，通过 /ms/monitor/skywalking/** 读取真实服务、
 * 链路、拓扑、指标、告警与日志；接口缺失或目标服务不可达时，把原因摊开给使用者，
 * 不再回退到任何内置演示数据。</p>
 *
 * <p>总览卡片 + 六页签：总览 / 服务 / 链路 / 拓扑 / 告警 / 日志（均不对接 Prometheus 的查询与配置线）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import ReTag from "@repo/ui/re-tag";

import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReOption from "@repo/ui/re-option";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTabs from "@repo/ui/re-tabs";
import ReTab from "@repo/ui/re-tab";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  fetchSkywalkingOverview,
  fetchSkywalkingStatus,
  fetchSkywalkingServices,
  fetchSkywalkingInstances,
  fetchSkywalkingEndpoints,
  fetchSkywalkingTraces,
  fetchSkywalkingTrace,
  fetchSkywalkingTopology,
  fetchSkywalkingAlarms,
  fetchSkywalkingLogs,
  type SkyOverview,
  type SkyStatus,
  type SkyService,
  type SkyInstance,
  type SkyEndpoint,
  type SkyTraceSummary,
  type SkyTracePage,
  type SkyTraceDetail,
  type SkySpan,
  type SkyTopology,
  type SkyTopologyNode,
  type SkyAlarm,
  type SkyLogRecord,
} from "../../api/skywalking/api";

const { datasourceId, source, gap, bind, ready, fail } = useMiddlewareSource();

// ==================== 页签 ====================

const tabs = [
  { name: "overview", label: "总览", icon: "Odometer" },
  { name: "services", label: "服务目录", icon: "Shop" },
  { name: "traces", label: "链路", icon: "Connection" },
  { name: "topology", label: "拓扑", icon: "Share" },
  { name: "alarms", label: "告警", icon: "Bell" },
  { name: "logs", label: "日志", icon: "Tickets" },
] as const;

const activeTab = ref<(typeof tabs)[number]["name"]>("overview");

function goTab(name: (typeof tabs)[number]["name"]): void {
  activeTab.value = name;
}

// ==================== 数据源 ====================

const sources = ref<Awaited<ReturnType<typeof fetchSkywalkingSources>>>([]);
const overview = ref<SkyOverview | null>(null);
const status = ref<SkyStatus | null>(null);
const overviewLoading = ref(false);

/** 顶栏状态：可达 / 不可达 / 加载中 / 未知 */
const statusText = computed(() => {
  if (overviewLoading.value) {
    return "加载中";
  }
  if (!overview.value) {
    return "状态未知";
  }
  return overview.value.available ? "运行中" : "不可达";
});

const stateClass = computed(() => ({
  "is-running": !overviewLoading.value && overview.value?.available === true,
  "is-stopped": !overviewLoading.value && overview.value?.available === false,
  "is-unknown": !overviewLoading.value && !overview.value,
  "is-loading": overviewLoading.value,
}));

const metaText = computed(() => {
  const o = overview.value;
  if (!o) {
    return "";
  }
  const parts: string[] = [];
  if (o.version) {
    parts.push(`v${o.version}`);
  }
  if (source.value) {
    parts.push(`${source.value.host}:${source.value.port || 12800}`);
  }
  return parts.join(" · ");
});

/** 检测时间文本 */
const checkedAtText = computed(() => {
  const ts = overview.value?.checkedAt;
  if (!ts) return "—";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return String(ts);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});

async function onGapRetry(): Promise<void> {
  await bind("skywalking");
  if (datasourceId.value) {
    await reloadOverview();
  }
}

async function reloadOverview(): Promise<void> {
  if (!datasourceId.value) {
    overview.value = null;
    status.value = null;
    return;
  }
  overviewLoading.value = true;
  try {
    const [o, s] = await Promise.all([
      fetchSkywalkingOverview(datasourceId.value),
      fetchSkywalkingStatus(datasourceId.value),
    ]);
    overview.value = o;
    status.value = s;
    ready();
  } catch (e) {
    overview.value = null;
    status.value = null;
    fail(e, "/ms/monitor/skywalking/overview");
    message.error(`总览加载失败：${(e as Error)?.message ?? e}`);
  } finally {
    overviewLoading.value = false;
  }
}

async function onSwitchSource(id: number): Promise<void> {
  datasourceId.value = id;
  overview.value = null;
  status.value = null;
  await bind("skywalking");
  if (datasourceId.value) {
    await reloadOverview();
  }
}

// ==================== 服务 ====================

const services = ref<SkyService[]>([]);
const servicesLoading = ref(false);
const serviceTotal = ref(0);
const servicePage = ref(1);
const serviceFilter = ref({ keyword: "", serviceName: "" });

const serviceColumns = [
  { prop: "name", label: "服务名", minWidth: 160, slot: "row-name" },
  { prop: "group", label: "分组", width: 140 },
  { prop: "services", label: "服务数", width: 80 },
  { prop: "endpoints", label: "端点数", width: 80 },
  { prop: "avgMs", label: "平均耗时(ms)", width: 110, slot: "avgMs" },
  { prop: "p95Ms", label: "P95(ms)", width: 100, slot: "p95Ms" },
  { prop: "p99Ms", label: "P99(ms)", width: 100, slot: "p99Ms" },
  { prop: "errorRate", label: "错误率", width: 100, slot: "errorRate" },
  { prop: "tags", label: "标签", minWidth: 200, slot: "tags" },
];

async function loadServices(): Promise<void> {
  if (!datasourceId.value) return;
  servicesLoading.value = true;
  try {
    const page = Number(servicePage.value) || 1;
    const size = 20;
    const res = await fetchSkywalkingServices({
      ...serviceFilter.value,
      page,
      size,
      datasourceId: datasourceId.value,
    });
    services.value = res ?? [];
    serviceTotal.value = services.value.length;
    ready();
  } catch (e) {
    services.value = [];
    fail(e, "/ms/monitor/skywalking/services");
  } finally {
    servicesLoading.value = false;
  }
}

function onServicePage(page: number): void {
  servicePage.value = page;
  loadServices();
}

// 服务详情（实例 / 端点）
const serviceDetailVisible = ref(false);
const serviceDetailTab = ref("instances");
const currentService = ref<SkyService | null>(null);
const currentInstances = ref<SkyInstance[]>([]);
const currentEndpoints = ref<SkyEndpoint[]>([]);
const instancesLoading = ref(false);
const endpointsLoading = ref(false);

function openService(row: SkyService): void {
  currentService.value = row;
  serviceDetailVisible.value = true;
  serviceDetailTab.value = "instances";
  loadServiceInstances(row.name);
  loadServiceEndpoints(row.name);
}

async function loadServiceInstances(serviceName: string): Promise<void> {
  if (!serviceName) return;
  instancesLoading.value = true;
  try {
    currentInstances.value =
      (await fetchSkywalkingInstances(serviceName, { datasourceId: datasourceId.value })) ?? [];
    ready();
  } catch (e) {
    currentInstances.value = [];
    fail(e, "/ms/monitor/skywalking/instances");
  } finally {
    instancesLoading.value = false;
  }
}

async function loadServiceEndpoints(serviceName: string): Promise<void> {
  if (!serviceName) return;
  endpointsLoading.value = true;
  try {
    currentEndpoints.value =
      (await fetchSkywalkingEndpoints(serviceName, { datasourceId: datasourceId.value })) ?? [];
    ready();
  } catch (e) {
    currentEndpoints.value = [];
    fail(e, "/ms/monitor/skywalking/endpoints");
  } finally {
    endpointsLoading.value = false;
  }
}

const instanceColumns = [
  { prop: "name", label: "实例名", minWidth: 180 },
  { prop: "language", label: "语言", width: 120 },
  { prop: "heartbeatTime", label: "心跳时间", width: 180, slot: "heartbeatTime" },
  { prop: "tags", label: "标签", minWidth: 200, slot: "tags" },
];

const endpointColumns = [
  { prop: "name", label: "端点名", minWidth: 220 },
  { prop: "calls", label: "调用次数", width: 100 },
  { prop: "avgMs", label: "平均耗时(ms)", width: 110, slot: "avgMs" },
  { prop: "p95Ms", label: "P95(ms)", width: 100, slot: "avgMs" },
  { prop: "p99Ms", label: "P99(ms)", width: 100, slot: "avgMs" },
  { prop: "errorRate", label: "错误率", width: 100, slot: "errorRate" },
];

// ==================== 链路 ====================

const traces = ref<SkyTraceSummary[]>([]);
const tracesLoading = ref(false);
const traceTotal = ref(0);
const tracePage = ref(1);
const traceForm = ref({
  serviceName: "",
  keyword: "",
  state: "ALL" as "ALL" | "SUCCESS" | "ERROR" | null,
  startTime: 0,
  endTime: 0,
});

const traceColumns = [
  { prop: "traceId", label: "链路 ID", minWidth: 240 },
  { prop: "serviceName", label: "服务名", width: 140 },
  { prop: "endpointName", label: "端点名", minWidth: 200 },
  { prop: "startTime", label: "开始时间", width: 180, slot: "startTime" },
  { prop: "durationMs", label: "耗时", width: 100, slot: "durationMs" },
  { prop: "error", label: "错误", width: 80, slot: "error" },
  { prop: "spanCount", label: "Span 数", width: 80 },
];

async function loadTraces(): Promise<void> {
  if (!datasourceId.value) return;
  tracesLoading.value = true;
  try {
    const res = await fetchSkywalkingTraces({
      ...traceForm.value,
      page: Number(tracePage.value) || 1,
      size: 20,
      datasourceId: datasourceId.value,
    });
    traces.value = res?.list ?? [];
    traceTotal.value = res?.total ?? 0;
    ready();
  } catch (e) {
    traces.value = [];
    fail(e, "/ms/monitor/skywalking/traces");
  } finally {
    tracesLoading.value = false;
  }
}

function onTracePage(page: number): void {
  tracePage.value = page;
  loadTraces();
}

// 链路详情
const traceDetailVisible = ref(false);
const currentTrace = ref<SkyTraceDetail | null>(null);
const traceSpans = ref<SkySpan[]>([]);

/** 整条链路 (server/DB/RPC 级 Span)，按查询顺序排列 */
const traceRoots = computed(() => traceSpans.value.filter(s => !s.parentSpanId));

async function openTrace(row: SkyTraceSummary): Promise<void> {
  if (!datasourceId.value) return;
  currentTrace.value = null;
  traceDetailVisible.value = true;
  try {
    const detail = await fetchSkywalkingTrace(row.traceId, datasourceId.value);
    currentTrace.value = detail;
    traceSpans.value = detail?.spans ?? [];
    ready();
  } catch (e) {
    currentTrace.value = null;
    fail(e, "/ms/monitor/skywalking/trace");
  }
}

/** 取 Span 的父节点 */
function spanChildren(span: SkySpan): SkySpan[] {
  if (!traceSpans.value) return [];
  return traceSpans.value.filter(s => s.parentSpanId === span.spanId);
}

/** 根据 layer 取icon */
function spanIcon(s: SkySpan): string {
  switch (s.layer) {
    case "NETWORK":
      return "Link";
    case "DATABASE":
      return "Coin";
    case "SERVICE":
      return "Monitor";
    case "RPC_FRAMEWORK":
      return "Setting";
    case "WEB_FRAMEWORK":
      return "MouseListener";
    default:
      return "Connection";
  }
}

// ==================== 拓扑 ====================

const topology = ref<SkyTopology | null>(null);
const topologyLoading = ref(false);
const topologyForm = ref<{ serviceName?: string | null }>({ serviceName: "" });

function loadTopology(): void {
  if (!datasourceId.value) return;
  topologyLoading.value = true;
  topology.value = null;
  Promise.all([loadServices()])
    .then(() => {
      fetchSkywalkingTopology({
        serviceName: topologyForm.value.serviceName,
        page: 1,
        size: 50,
        datasourceId: datasourceId.value,
      })
        .then(r => {
          topology.value = r;
          ready();
        })
        .catch(e => {
          fail(e, "/ms/monitor/skywalking/topology");
        })
        .finally(() => {
          topologyLoading.value = false;
        });
    })
    .catch(() => {
      topologyLoading.value = false;
    });
}

/** 拓扑节点的平面坐标（按时/空布局：服务一行、中间件一行） */
const nodeIndex = computed(() => {
  const nodes = topology.value?.nodes ?? [];
  const map = new Map<string, SkyTopologyNode>();
  nodes.forEach((n, i) => map.set(n.id ?? n.name, n));
  const coords = new Map<string, { x: number; y: number }>();
  const rows = new Map<string, number>();
  let row = 0;
  nodes.forEach(n => {
    const key = n.type;
    if (!rows.has(key)) {
      rows.set(key, row);
      row++;
    }
    const x = 120 + (rows.get(key) ?? 0) * 340;
    const y = 120 + (rows.get(key) ?? 0) * 6;
    coords.set(n.id ?? n.name, { x, y });
  });
  return { map, coords };
});

const nodeOf = (name: string | undefined) => {
  if (!name) return undefined;
  return nodeIndex.value.map.get(name);
};

const nodeX = (n?: SkyTopologyNode) => (n ? nodeIndex.value.coords.get(n.id ?? n.name)?.x ?? 120 : 120);
const nodeY = (n?: SkyTopologyNode) => (n ? nodeIndex.value.coords.get(n.id ?? n.name)?.y ?? 120 : 120);

const nodeColor = (type: string) => {
  switch (type) {
    case "SERVICE":
      return "var(--brand-50)";
    case "ENDPOINT":
      return "var(--success-50)";
    case "INSTANCE":
      return "var(--warning-50)";
    default:
      return "var(--bg-fill)";
  }
};

const nodeTypeLabel = (type: string) => {
  switch (type) {
    case "SERVICE":
      return "服务";
    case "ENDPOINT":
      return "端点";
    case "INSTANCE":
      return "实例";
    default:
      return type;
  }
};

// ==================== 告警 ====================

const alarms = ref<SkyAlarm[]>([]);
const alarmsLoading = ref(false);
const alarmForm = ref({ keyword: "" });

const alarmColumns = [
  // name 是「实体名」不是规则名（OAP 的 AlarmMessage.name 写的是 AlarmEntity#getName()），
  // 规则名在 query-protocol 里根本没暴露，所以这里不能挂一列规则名。
  { prop: "name", label: "实体", minWidth: 180 },
  { prop: "serviceName", label: "服务", width: 140 },
  { prop: "scope", label: "作用域", width: 100, slot: "scope" },
  { prop: "message", label: "告警信息", minWidth: 300 },
  { prop: "startTime", label: "开始时间", width: 180, slot: "startTime" },
  { prop: "events", label: "事件数", width: 100, slot: "events" },
];

async function loadAlarms(): Promise<void> {
  if (!datasourceId.value) return;
  alarmsLoading.value = true;
  try {
    alarms.value =
      (await fetchSkywalkingAlarms({ ...alarmForm.value, page: 1, size: 50, datasourceId: datasourceId.value })) ?? [];
    ready();
  } catch (e) {
    alarms.value = [];
    fail(e, "/ms/monitor/skywalking/alarms");
  } finally {
    alarmsLoading.value = false;
  }
}

// ==================== 日志 ====================

const logs = ref<SkyLogRecord[]>([]);
const logsLoading = ref(false);
const logForm = ref({ serviceName: "", keyword: "" });

const logColumns = [
  { prop: "timestamp", label: "时间", width: 180, slot: "timestamp" },
  { prop: "serviceName", label: "服务名", width: 140 },
  { prop: "instanceName", label: "实例名", width: 160 },
  { prop: "endpointName", label: "端点名", width: 200 },
  { prop: "level", label: "等级", width: 80 },
  { prop: "content", label: "内容", minWidth: 300, slot: "content" },
];

async function loadLogs(): Promise<void> {
  if (!datasourceId.value) return;
  logsLoading.value = true;
  try {
    logs.value =
      (await fetchSkywalkingLogs({ ...logForm.value, page: 1, size: 50, datasourceId: datasourceId.value })) ?? [];
    ready();
  } catch (e) {
    logs.value = [];
    fail(e, "/ms/monitor/skywalking/logs");
  } finally {
    logsLoading.value = false;
  }
}

// ==================== 工具 ====================

const formatMs = (ms?: number | null): string => {
  if (ms === undefined || ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatTime = (text: string | number | null | undefined): string => {
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return String(text);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const truncate = (text: string, len: number): string => {
  if (!text) return "—";
  return text.length > len ? `${text.slice(0, len)}…` : text;
};

onMounted(async () => {
  try {
    sources.value = (await fetchSkywalkingSources()) || [];
  } catch {
    // 列表拿不到时下拉为空，不影响已选数据源的使用
  }
  await bind("skywalking", sources.value);
  if (datasourceId.value) {
    await reloadOverview();
  }
});
</script>

<style scoped lang="scss">
/* 整页：与 nginx 控制台同款 dsm 壳（背景非白 + 6px 间距） */
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dsm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.dsm-sky-icon {
  color: #5b6ad5;
}

.dsm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dsm-db-select {
  width: 200px;
  flex-shrink: 0;
}

/* 运行状态胶囊：与 nginx 同款五态 */
.dsw-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 18px;
  border: 1px solid transparent;
  white-space: nowrap;

  &.is-running {
    color: var(--status-success);
    background: color-mix(in srgb, var(--status-success) 12%, transparent);
    border-color: color-mix(in srgb, var(--status-success) 32%, transparent);
  }

  &.is-stopped {
    color: var(--status-error);
    background: color-mix(in srgb, var(--status-error) 12%, transparent);
    border-color: color-mix(in srgb, var(--status-error) 32%, transparent);
  }

  &.is-unknown {
    color: var(--text-secondary);
    background: var(--bg-fill);
    border-color: var(--border-subtle);
  }

  &.is-loading {
    color: var(--brand-500);
    background: color-mix(in srgb, var(--brand-500) 12%, transparent);
    border-color: color-mix(in srgb, var(--brand-500) 32%, transparent);
  }
}

.dsw-state-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: currentColor;
}

.dsw-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体布局：侧栏 + 内容 */
.dsm-body {
  display: flex;
  flex: 1;
  gap: 6px;
  overflow: hidden;
  min-height: 0;
}

.dsw-nav {
  width: 190px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
}

.dsw-nav-header {
  padding: 12px 0 0 0;
  flex-shrink: 0;
}

.dsw-nav-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  padding: 0 14px;
  display: block;
}

.dsw-nav-list {
  flex: 1;
  padding: 6px 0;
  overflow-y: auto;
}

.dsw-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 12px;
  border: 0;
  background: transparent;
  font-size: 13px;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.active {
    background: var(--brand-50);
    color: var(--brand-600);
    font-weight: 600;
  }
}

.dsw-nav-icon {
  flex-shrink: 0;
}

.dsw-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.dsw-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

/* 筛选栏 */
.dsw-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
}

.dsw-spacer {
  flex: 1;
}

/* 总览卡片 */
.dsw-info-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px 24px;
  padding: 16px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);

  .dsw-info-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dsw-info-label {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .dsw-info-value {
    font-size: 14px;
    color: var(--text-primary);
    word-break: break-all;
  }

  .dsw-info-sub {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .dsw-info-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mono {
    font-family: var(--font-mono);
  }
}

.dsw-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;

  .dsw-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    background: var(--bg-container);

    .dsw-stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dsw-stat-label {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }
}

/* 能力清单 */
.dsw-section {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  padding: 14px 18px;
}

.dsw-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.dsw-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .dsw-capacity {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    font-size: 12px;
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 9999px;
    background: var(--bg-fill);
  }
}

/* 拓扑 */
.dsw-topology {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  padding: 14px 18px;

  .dsw-topology-svg {
    width: 100%;
    display: block;
  }

  .dsw-topology-meta {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 8px;
  }
}

.dsw-node-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-anchor: middle;
}

.dsw-node-sub {
  font-size: 10px;
  color: var(--text-tertiary);
  text-anchor: middle;
}

/* 标签 */
.dsw-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 链路详情 */
.dsw-spf {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  padding: 14px 18px;

  .dsw-spf-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .dsw-spf-scroll {
    max-height: 420px;
    overflow-y: auto;
  }
}

.dsw-span-row {
  position: relative;
}

.dsw-span-child {
  margin-left: 20px;
}

.dsw-span-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-fill);

  &:hover {
    background: var(--bg-hover);
  }
}

.dsw-span-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dsw-span-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dsw-span-layer {
  flex-shrink: 0;
}

.dsw-span-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.dsw-span-icon {
  flex-shrink: 0;
}

.dsw-span-pad {
  display: inline-block;
  flex-shrink: 0;
}
</style>
