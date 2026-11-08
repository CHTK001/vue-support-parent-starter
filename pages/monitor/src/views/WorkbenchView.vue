<script setup lang="ts">
/**
 * 监控概览（工作台）—— 对齐 prototype §PAGE-1
 * KPI（ReStatCard + ReCountup + ReSkeleton）+ Donut + 最近告警 + 快捷入口
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useSocketService } from "@repo/core";
import ReTable from "@repo/ui/re-table";
import { queryHosts } from "@pages/server/src/api";
import { fetchAlarmEvents, alarmLevel, isUnhandled, type AlarmEvent } from "../api/monitorApi";

const router = useRouter();
const socket = useSocketService();
const loading = ref(false);
const loadError = ref("");
const hosts = ref<any[]>([]);
const events = ref<AlarmEvent[]>([]);
const lastRefresh = ref("");

const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_COLORS: Record<string, string> = { P0: "var(--sev-p0-text)", P1: "var(--sev-p1-text)", P2: "var(--sev-p2-text)", P3: "var(--sev-p3-text)", P4: "var(--sev-p4-text)" };
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };

const enabledCount = computed(() => hosts.value.filter(h => Number(h.serverHostStatus) !== 0).length);
const onlineCount = computed(() => hosts.value.filter(h => Number(h.serverHostOnline) === 1).length);
const unhandledCount = computed(() => events.value.filter(isUnhandled).length);
const totalAlarms = computed(() => events.value.length);
const levelCounts = computed(() => {
  const m: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) m[alarmLevel(e)]++;
  return m;
});
const donutStyle = computed(() => {
  const total = totalAlarms.value;
  if (total === 0) return { background: "var(--border-subtle)" };
  let acc = 0;
  const stops: string[] = [];
  for (const lv of LEVELS) {
    const n = levelCounts.value[lv]; if (!n) continue;
    const from = (acc / total) * 360; acc += n;
    stops.push(`${LEVEL_COLORS[lv]} ${from}deg ${(acc / total) * 360}deg`);
  }
  return { background: `conic-gradient(${stops.join(", ")})` };
});
const recentAlarms = computed(() =>
  [...events.value].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? "")).slice(0, 5),
);

function stampClock(): void {
  const d = new Date();
  lastRefresh.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

async function fetchAll(silent = false): Promise<void> {
  if (!silent) loading.value = true;
  loadError.value = "";
  try {
    const [hs, ev] = await Promise.all([queryHosts({}), fetchAlarmEvents()]);
    hosts.value = hs ?? []; events.value = ev ?? [];
    stampClock();
  } catch (e) { loadError.value = String((e as Error)?.message ?? e); }
  finally { if (!silent) loading.value = false; }
}

let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubAlarm: (() => void) | undefined;
function bindSocket(): void {
  if (!socket) return;
  unsubOnline = socket.subscribe("monitor", "host-online", (msg: any) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; online?: number };
      const t = d?.hostId != null ? hosts.value.find(h => h.id === d.hostId) : null;
      if (t) t.serverHostOnline = d.online ? 1 : 0;
    } catch { /* 静默 */ }
  });
  unsubMetrics = socket.subscribe("monitor", "host-metrics", (msg: any) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; cpu?: number; mem?: number; disk?: number };
      const t = d?.hostId != null ? hosts.value.find(h => h.id === d.hostId) : null;
      if (t) {
        if (d.cpu != null) t.serverHostCpuUsage = Number(d.cpu);
        if (d.mem != null) t.serverHostMemUsage = Number(d.mem);
        if (d.disk != null) t.serverHostDiskUsage = Number(d.disk);
        stampClock();
      }
    } catch { /* 静默 */ }
  });
  unsubAlarm = socket.subscribe("monitor", "alarm", () => {
    void fetchAlarmEvents()
      .then(ev => { events.value = ev ?? []; stampClock(); })
      .catch(() => { /* 静默 */ });
  });
}

onMounted(() => {
  void fetchAll();
  bindSocket();
});
onBeforeUnmount(() => {
  unsubOnline?.(); unsubMetrics?.(); unsubAlarm?.();
});
</script>

<template>
  <div class="workbench-page">
    <ReSectionHead class="page-head" title="监控概览" :description="`资产健康一览 · 最近更新 ${lastRefresh || '—'} · 实时更新`">
      <template #actions>
        <ReButton show-text icon="RefreshRight" size="small" :loading="loading" @click="fetchAll()">刷新</ReButton>
        <ReButton show-text icon="Plus" type="primary" size="small" @click="router.push('/assets')">新建资产</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="loadError" class="as-error">
      <ReStatusIndicator type="danger" />
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll()">重试</ReButton>
    </div>

    <ReSkeleton :loading="loading" :rows="2" :count="1" animated>
      <div class="stats-grid">
        <div class="stat-card" style="--accent: var(--brand-500)">
          <div class="stat-label">资产总数</div>
          <div class="stat-value">{{ hosts.length }}</div>
          <div class="stat-trend">已启用 {{ enabledCount }} · 在线 {{ onlineCount }}</div>
        </div>
        <div class="stat-card" style="--accent: var(--status-error)">
          <div class="stat-label">未处理告警</div>
          <div class="stat-value">{{ unhandledCount }}</div>
          <div class="stat-trend is-down">累计事件 {{ totalAlarms }}</div>
        </div>
        <div class="stat-card" style="--accent: var(--sev-p0-text, var(--status-error))">
          <div class="stat-label">高危告警 P0+P1</div>
          <div class="stat-value">{{ levelCounts.P0 + levelCounts.P1 }}</div>
          <div class="stat-trend">30 分钟内响应</div>
        </div>
        <div class="stat-card" style="--accent: var(--sev-p2-text, var(--status-warning))">
          <div class="stat-label">中危告警 P2</div>
          <div class="stat-value">{{ levelCounts.P2 }}</div>
          <div class="stat-trend">当班处理</div>
        </div>
      </div>
    </ReSkeleton>

    <div class="card-grid">
      <div class="wb-card">
        <div class="card-head"><span class="card-title">告警等级分布</span></div>
        <div class="donut-wrap">
          <div class="donut" :style="donutStyle">
            <div class="donut-center">
              <div class="donut-value">{{ totalAlarms }}</div>
            </div>
          </div>
          <div class="donut-legend">
            <div v-for="lv in LEVELS" :key="lv" class="legend-item">
              <span class="legend-dot" :style="{ background: LEVEL_COLORS[lv] }" />
              <span class="legend-label">{{ lv }}</span>
              <span class="tag" :class="`sev-${lv}`">{{ levelCounts[lv] }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="wb-card">
        <div class="card-head"><span class="card-title">最近告警</span></div>
        <div v-if="recentAlarms.length === 0" class="empty-state">
          <ReEmpty description="暂无告警事件，系统运行平稳" />
        </div>
        <ReTable
          v-else
          :data="recentAlarms"
          row-key="id"
          class="alarm-table"
          :layout-table="{ minHeight: 0 }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <ReTableColumn label="级别" width="64" align="center">
            <template #default="{ row }">
              <span class="tag" :class="`sev-${alarmLevel(row)}`">{{ alarmLevel(row) }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="主机" min-width="110">
            <template #default="{ row }">{{ row.msMonitorAlarmEventMonitorName || "—" }}</template>
          </ReTableColumn>
          <ReTableColumn label="指标" min-width="130">
            <template #default="{ row }">
              <span class="truncate">{{ row.msMonitorAlarmEventMetricName || "—" }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="时间" width="96">
            <template #default="{ row }">
              <span class="mono dim">{{ (row.msMonitorAlarmEventTriggerTime || "").slice(5, 16) }}</span>
            </template>
          </ReTableColumn>
        </ReTable>
        <div v-if="totalAlarms > 5" class="see-all">
          <ReButton icon="ArrowRight" size="small" text type="primary" @click="router.push('/alarms')">查看全部</ReButton>
        </div>
      </div>

      <div class="wb-card">
        <div class="card-head"><span class="card-title">快捷入口</span></div>
        <div class="quick-grid">
          <ReButton icon="Position" size="small" show-text class="quick" @click="router.push('/terminal')">远程控制台</ReButton>
          <ReButton icon="Monitor" size="small" show-text class="quick" @click="router.push('/assets')">主机资产</ReButton>
          <ReButton icon="Bell" size="small" show-text class="quick" @click="router.push('/alarms')">告警中心</ReButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.workbench-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 不自带内边距：外层 .main-content 已有 padding（koi 主题 8px） */
  padding: 0;
}

.page-head { margin-bottom: 4px; }

.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--status-error-text, var(--status-error));
  background: var(--status-error-bg, color-mix(in srgb, var(--status-error) 8%, transparent));
  border: 1px solid var(--status-error-border, var(--border-subtle));
  border-radius: var(--radius-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 6px;
}
.stat-trend {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.stat-trend.is-down { color: var(--status-error); }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.wb-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.wb-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.donut-wrap { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.donut {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}
.donut-center {
  position: absolute;
  inset: 12px;
  background: var(--bg-container);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.donut-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 120px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label { font-weight: 500; min-width: 24px; }

.tag { font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: var(--radius-sm); }
.sev-P0, .sev-P1 { color: var(--status-error); }
.sev-P2 { color: var(--status-warning); }
.sev-P3, .sev-P4 { color: var(--text-tertiary); }

/* 最近告警表：统一走 ReTable（全站唯一数据表实现），这里只压一档字号 */
.alarm-table { font-size: 12px; }
.truncate { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; }
.dim { color: var(--text-tertiary); }

.see-all { display: flex; justify-content: flex-end; margin-top: 4px; }

.quick-grid { display: flex; flex-direction: column; gap: 8px; }
.quick {
  width: 100%;
  justify-content: flex-start;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .card-grid { grid-template-columns: 1fr; }
  .donut-wrap { justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card, .wb-card { animation: none; transition: none; }
}
</style>