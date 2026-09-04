<script setup lang="ts">
/**
 * 监控概览（工作台）—— design.md §4.1
 * KPI 条 + 告警等级 Donut + 最近告警 + 快捷入口
 * 数据全部来自真实接口；后端 overview/trend 接口缺失时客户端聚合降级。
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RefreshRight } from "@element-plus/icons-vue";
import { fetchAlarmEvents, fetchMonitors, alarmLevel, isUnhandled, type AlarmEvent, type MonitorItem } from "../monitorApi";

const router = useRouter();

const loading = ref(false);
const loadError = ref("");
const monitors = ref<MonitorItem[]>([]);
const events = ref<AlarmEvent[]>([]);
const lastRefresh = ref("");

const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_COLORS: Record<string, string> = {
  P0: "#f04a5d",
  P1: "#f97316",
  P2: "#eab308",
  P3: "#22c55e",
  P4: "#94a3b8",
};
const LEVEL_LABELS: Record<string, string> = {
  P0: "严重",
  P1: "高",
  P2: "中",
  P3: "低",
  P4: "信息",
};

const onlineCount = computed(() => monitors.value.filter(m => m.monitorEnabled === 1).length);
const unhandledCount = computed(() => events.value.filter(isUnhandled).length);
const totalAlarms = computed(() => events.value.length);
const levelCounts = computed(() => {
  const map: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) map[alarmLevel(e)]++;
  return map;
});

/** Donut：conic-gradient 段 */
const donutStyle = computed(() => {
  const total = totalAlarms.value;
  if (total === 0) return { background: "var(--border-subtle)" };
  let acc = 0;
  const stops: string[] = [];
  for (const lv of LEVELS) {
    const n = levelCounts.value[lv];
    if (n === 0) continue;
    const from = (acc / total) * 360;
    acc += n;
    const to = (acc / total) * 360;
    stops.push(`${LEVEL_COLORS[lv]} ${from}deg ${to}deg`);
  }
  return { background: `conic-gradient(${stops.join(", ")})` };
});

const recentAlarms = computed(() =>
  [...events.value]
    .sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""))
    .slice(0, 5),
);

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const [m, ev] = await Promise.all([fetchMonitors(), fetchAlarmEvents()]);
    monitors.value = m ?? [];
    events.value = ev ?? [];
    const d = new Date();
    lastRefresh.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAll);
</script>

<template>
  <div class="ov">
    <header class="ov-head">
      <div>
        <h1 class="ov-title">监控概览</h1>
        <div class="ov-sub">系统健康与待处理事项一目了然</div>
      </div>
      <div class="ov-head-right">
        <span v-if="lastRefresh" class="ov-refresh-time">更新于 {{ lastRefresh }}</span>
        <el-button size="small" :loading="loading" @click="fetchAll">
          <el-icon v-if="!loading"><RefreshRight /></el-icon>
          刷新
        </el-button>
      </div>
    </header>

    <div v-if="loadError" class="ov-error">
      <span>数据加载失败：{{ loadError }}</span>
      <el-button size="small" type="primary" @click="fetchAll">重试</el-button>
    </div>

    <!-- KPI 条 -->
    <section class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">资产总数</div>
        <div class="kpi-value">{{ monitors.length }}</div>
        <div class="kpi-sub">运行中 {{ onlineCount }} · 停用 {{ monitors.length - onlineCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">告警未处理</div>
        <div :class="['kpi-value', unhandledCount > 0 ? 'is-alarm' : '']">{{ unhandledCount }}</div>
        <div class="kpi-sub">累计事件 {{ totalAlarms }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">P0+P1 高危</div>
        <div class="kpi-value">{{ levelCounts.P0 + levelCounts.P1 }}</div>
        <div class="kpi-sub">30 分钟内响应</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">P2 中危</div>
        <div class="kpi-value">{{ levelCounts.P2 }}</div>
        <div class="kpi-sub">当班处理</div>
      </div>
    </section>

    <!-- 主区：Donut + 最近告警 + 快捷入口 -->
    <section class="ov-grid">
      <div class="card donut-card">
        <div class="card-title">告警等级分布</div>
        <div class="donut-wrap">
          <div class="donut" :style="donutStyle">
            <div class="donut-hole">
              <div class="donut-total">{{ totalAlarms }}</div>
              <div class="donut-total-label">事件</div>
            </div>
          </div>
          <div class="donut-legend">
            <div v-for="lv in LEVELS" :key="lv" class="legend-row">
              <span class="legend-dot" :style="{ background: LEVEL_COLORS[lv] }" />
              <span class="legend-name">{{ lv }} {{ LEVEL_LABELS[lv] }}</span>
              <span class="legend-count">{{ levelCounts[lv] }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card recent-card">
        <div class="card-title">最近告警</div>
        <div v-if="recentAlarms.length === 0" class="empty-hint">暂无告警事件，系统运行平稳</div>
        <div v-else class="recent-list">
          <div v-for="a in recentAlarms" :key="a.id" class="recent-row">
            <span :class="['lv-tag', `lv-${alarmLevel(a).toLowerCase()}`]">{{ alarmLevel(a) }}</span>
            <span class="recent-host">{{ a.msMonitorAlarmEventMonitorName }}</span>
            <span class="recent-metric">{{ a.msMonitorAlarmEventMetricName }}</span>
            <span class="recent-time">{{ (a.msMonitorAlarmEventTriggerTime || "").slice(5, 16) }}</span>
          </div>
        </div>
        <el-button v-if="totalAlarms > 0" link type="primary" class="recent-more" @click="router.push('/alarms')">
          查看全部 →
        </el-button>
      </div>

      <div class="card quick-card">
        <div class="card-title">快捷入口</div>
        <div class="quick-list">
          <button class="quick-item" @click="router.push('/terminal')">
            <ReIcon name="Position" :size="16" />
            <span>进入远控工作台</span>
          </button>
          <button class="quick-item" @click="router.push('/assets')">
            <ReIcon name="Monitor" :size="16" />
            <span>管理主机资产</span>
          </button>
          <button class="quick-item" @click="router.push('/alarms')">
            <ReIcon name="Bell" :size="16" />
            <span>处理告警事件</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ov {
  max-width: 1440px;
  padding: 24px;
}
.ov-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}
.ov-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.ov-sub {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.ov-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ov-refresh-time {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
}
.ov-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #9b1c2e;
  background: #fdecef;
  border: 1px solid #fbc0c9;
  border-radius: 8px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-card {
  padding: 16px 18px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.kpi-value {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
  &.is-alarm { color: var(--pulse-alarm); }
}
.kpi-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.ov-grid {
  display: grid;
  grid-template-columns: 5fr 4fr 3fr;
  gap: 16px;
}
.card {
  padding: 16px 18px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.card-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
}

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
}
.donut {
  position: relative;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  flex-shrink: 0;
}
.donut-hole {
  position: absolute;
  inset: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-container);
  border-radius: 50%;
}
.donut-total {
  font-size: 24px;
  font-weight: 700;
}
.donut-total-label {
  font-size: 11px;
  color: var(--text-tertiary);
}
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.legend-count {
  margin-left: auto;
  font-weight: 600;
  color: var(--text-primary);
  font-family: monospace;
}

.empty-hint {
  padding: 32px 0;
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}
.recent-list {
  display: flex;
  flex-direction: column;
}
.recent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border-subtle);
  &:last-child { border-bottom: none; }
}
.lv-tag {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  border: 1px solid transparent;
  border-radius: 4px;
}
.recent-host { font-weight: 600; }
.recent-metric {
  flex: 1;
  overflow: hidden;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-time {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
}
.recent-more {
  margin-top: 8px;
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: left;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    color: var(--brand-600);
    background: var(--brand-50);
    border-color: var(--brand-100);
  }
}
</style>
