<script setup lang="ts">
/**
 * 监控概览（工作台）—— 对齐 prototype.html §PAGE1（KPI + Donut + 最近告警 + 快捷入口）
 * 使用 ReStatCard / ReCard / ReTag / ReStatusIndicator 组件库。
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  fetchAlarmEvents,
  fetchMonitors,
  alarmLevel,
  isUnhandled,
  type AlarmEvent,
  type MonitorItem,
} from "../monitorApi";

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
  <div class="page-wrap ov">
    <!-- 页面头部 -->
    <ReSectionHead :description="`资产健康一览 · 最近更新 ${lastRefresh || '—'}`">
      <template #title>监控概览</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- KPI 行（ReStatCard） -->
    <section class="kpi-grid">
      <ReStatCard title="资产总数" icon="Monitor" icon-color="var(--brand-500)" :value="String(monitors.length)" :desc="`运行中 ${onlineCount} · 停用 ${monitors.length - onlineCount}`" />
      <ReStatCard title="告警未处理" icon="Bell" icon-color="var(--pulse-alarm)" :value="String(unhandledCount)" :desc="`累计事件 ${totalAlarms}`" />
      <ReStatCard title="P0+P1 高危" icon="Warning" icon-color="var(--pulse-alarm)" :value="String(levelCounts.P0 + levelCounts.P1)" desc="30 分钟内响应" />
      <ReStatCard title="P2 中危" icon="Clock" icon-color="var(--metric-disk)" :value="String(levelCounts.P2)" desc="当班处理" />
    </section>

    <!-- 主区：Donut + 最近告警 + 快捷入口 -->
    <section class="ov-grid">
      <ReCard :radius="12" shadow="never">
        <template #header><span class="card-h">告警等级分布</span></template>
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
              <ReTag :type="lv === 'P0' || lv === 'P1' ? 'danger' : lv === 'P2' ? 'warning' : 'success'" size="small" effect="light">{{ levelCounts[lv] }}</ReTag>
            </div>
          </div>
        </div>
      </ReCard>

      <ReCard :radius="12" shadow="never">
        <template #header><span class="card-h">最近告警</span></template>
        <div v-if="recentAlarms.length === 0" class="empty-hint">暂无告警事件，系统运行平稳</div>
        <div v-else class="recent-list">
          <div v-for="a in recentAlarms" :key="a.id" class="recent-row">
            <ReTag :type="alarmLevel(a) === 'P0' || alarmLevel(a) === 'P1' ? 'danger' : alarmLevel(a) === 'P2' ? 'warning' : 'success'" size="small" effect="dark">{{ alarmLevel(a) }}</ReTag>
            <span class="recent-host">{{ a.msMonitorAlarmEventMonitorName }}</span>
            <span class="recent-metric">{{ a.msMonitorAlarmEventMetricName }}</span>
            <span class="recent-time">{{ (a.msMonitorAlarmEventTriggerTime || "").slice(5, 16) }}</span>
          </div>
        </div>
        <ReButton v-if="totalAlarms > 0" link type="primary" :show-text="true" @click="router.push('/alarms')">查看全部 →</ReButton>
      </ReCard>

      <ReCard :radius="12" shadow="never">
        <template #header><span class="card-h">快捷入口</span></template>
        <div class="quick-list">
          <button class="quick-item" @click="router.push('/terminal')"><ReIcon name="Position" :size="16" /><span>进入远控工作台</span></button>
          <button class="quick-item" @click="router.push('/assets')"><ReIcon name="Monitor" :size="16" /><span>管理主机资产</span></button>
          <button class="quick-item" @click="router.push('/alarms')"><ReIcon name="Bell" :size="16" /><span>处理告警事件</span></button>
        </div>
      </ReCard>
    </section>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { max-width: 1440px; padding: 24px; }
.as-error {
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
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.ov-grid {
  display: grid;
  grid-template-columns: 5fr 4fr 3fr;
  gap: 14px;
}
.card-h { font-size: 15px; font-weight: 600; }

.donut-wrap { display: flex; align-items: center; gap: 24px; padding: 4px 0; }
.donut {
  position: relative;
  width: 120px;
  height: 120px;
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
.donut-total { font-size: 22px; font-weight: 700; }
.donut-total-label { font-size: 11px; color: var(--text-tertiary); }
.donut-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-name { flex: 1; }

.empty-hint { padding: 32px 0; font-size: 13px; color: var(--text-tertiary); text-align: center; }
.recent-list { display: flex; flex-direction: column; }
.recent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border-subtle);
  &:last-child { border-bottom: none; }
}
.recent-host { font-weight: 600; }
.recent-metric { flex: 1; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.recent-time { font-size: 12px; color: var(--text-tertiary); font-family: monospace; }

.quick-list { display: flex; flex-direction: column; gap: 8px; }
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
  &:hover { color: var(--brand-600); background: var(--brand-50); border-color: var(--brand-100); }
}
</style>