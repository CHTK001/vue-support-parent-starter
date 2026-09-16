<script setup lang="ts">
/**
 * 监控概览（工作台）—— 对齐 prototype §PAGE-1
 * KPI（ReStatCard + ReCountup + ReSkeleton）+ Donut + 最近告警 + 快捷入口
 * 全部按钮统一 ReButton；.kpi 色条类保留（pages.css 左侧色条 + e2e 定位）
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchAlarmEvents, fetchMonitors, alarmLevel, isUnhandled, type AlarmEvent, type MonitorItem } from "../monitorApi";

const router = useRouter();
const loading = ref(false);
const loadError = ref("");
const monitors = ref<MonitorItem[]>([]);
const events = ref<AlarmEvent[]>([]);
const lastRefresh = ref("");

const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_COLORS: Record<string, string> = { P0: "var(--sev-p0-text)", P1: "var(--sev-p1-text)", P2: "var(--sev-p2-text)", P3: "var(--sev-p3-text)", P4: "var(--sev-p4-text)" };
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };

const onlineCount = computed(() => monitors.value.filter(m => m.monitorEnabled === 1).length);
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

async function fetchAll(): Promise<void> {
  loading.value = true; loadError.value = "";
  try {
    const [m, ev] = await Promise.all([fetchMonitors(), fetchAlarmEvents()]);
    monitors.value = m ?? []; events.value = ev ?? [];
    const d = new Date(); lastRefresh.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  } catch (e) { loadError.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}
onMounted(fetchAll);
</script>

<template>
  <div class="tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">监控概览</h1>
        <p class="page-desc">资产健康一览 · 最近更新 {{ lastRefresh || "—" }} <span class="muted">· 每 10s 自动刷新</span></p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" size="small" @click="router.push('/assets')">新建资产</ReButton>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <ReStatusIndicator type="danger" />
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- KPI 统计卡：纯数值 + tooltip（title/desc 移入悬停提示——代替图表+文字） -->
    <ReSkeleton :loading="loading" :rows="4" animated>
      <section class="kpi-row cols-4">
        <ReStatCard title="资产总数" :desc="`运行中 ${onlineCount} · 离线 ${monitors.length - onlineCount}`" icon-color="var(--brand-500)">
          <template #icon><ReButton icon="DataBoard" layout="square" size="small" /></template>
          <template #value><span class="kpi-big">{{ monitors.length }}</span></template>
        </ReStatCard>
        <ReStatCard title="未处理告警" :desc="`累计事件 ${totalAlarms}`" icon-color="var(--status-alarm)">
          <template #icon><ReButton icon="Bell" layout="square" size="small" type="danger" /></template>
          <template #value><span class="kpi-big">{{ unhandledCount }}</span></template>
        </ReStatCard>
        <ReStatCard title="高危告警 P0+P1" desc="30 分钟内响应" icon-color="var(--sev-p0-text)">
          <template #icon><ReButton icon="Warning" layout="square" size="small" type="danger" /></template>
          <template #value><span class="kpi-big">{{ levelCounts.P0 + levelCounts.P1 }}</span></template>
        </ReStatCard>
        <ReStatCard title="中危告警 P2" desc="当班处理" icon-color="var(--sev-p2-text)">
          <template #icon><ReButton icon="AlarmClock" layout="square" size="small" type="warning" /></template>
          <template #value><span class="kpi-big">{{ levelCounts.P2 }}</span></template>
        </ReStatCard>
      </section>
    </ReSkeleton>

    <section class="cols-2-equal-responsive">
      <div class="card">
        <div class="card-head"><span class="card-title">告警等级分布</span></div>
        <div class="donut-wrap">
          <el-tooltip :content="`告警事件 · 共 ${totalAlarms} 起`" placement="top">
            <div class="donut" :style="donutStyle">
              <div class="donut-center">
                <div class="donut-value">{{ totalAlarms }}</div>
              </div>
            </div>
          </el-tooltip>
          <div class="donut-legend">
            <el-tooltip v-for="lv in LEVELS" :key="lv" :content="`${lv} ${LEVEL_LABELS[lv]}`" placement="top">
              <div class="legend-item">
                <span class="legend-dot" :style="{ background: LEVEL_COLORS[lv] }" />
                <span class="legend-label">{{ lv }}</span>
                <span class="tag" :class="`sev-${lv}`">{{ levelCounts[lv] }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">最近告警</span></div>
        <div v-if="recentAlarms.length === 0" class="empty-state">暂无告警事件，系统运行平稳</div>
        <table v-else class="t">
          <thead><tr><th>级别</th><th>主机</th><th>指标</th><th>时间</th></tr></thead>
          <tbody>
            <tr v-for="a in recentAlarms" :key="a.id">
              <td><span class="tag" :class="`sev-${alarmLevel(a)}`">{{ alarmLevel(a) }}</span></td>
              <td>{{ a.msMonitorAlarmEventMonitorName }}</td>
              <td class="truncate">{{ a.msMonitorAlarmEventMetricName }}</td>
              <td class="mono dim">{{ (a.msMonitorAlarmEventTriggerTime || "").slice(5, 16) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="totalAlarms > 5" class="see-all">
          <ReButton icon="ArrowRight" :show-text="true" link type="primary" size="small" @click="router.push('/alarms')">查看全部</ReButton>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">快捷入口</span></div>
        <ReButton icon="Position" :show-text="true" size="small" class="quick w100" @click="router.push('/terminal')">远程控制台</ReButton>
        <ReButton icon="Monitor" :show-text="true" size="small" class="quick w100" style="margin-top:8px" @click="router.push('/assets')">主机资产</ReButton>
        <ReButton icon="Bell" :show-text="true" size="small" class="quick w100" style="margin-top:8px" @click="router.push('/alarms')">告警中心</ReButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.w100 { width: 100%; justify-content: flex-start; }
.as-error { display:flex; align-items:center; gap:12px; padding:10px 14px; font-size:13px; color:var(--status-error-text); background:var(--status-error-bg); border:1px solid var(--status-error-border); border-radius:8px; }
.kpi-ico {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0.14;
  pointer-events: none;
}
.quick-grid { display: flex; flex-direction: column; gap: 8px; }
.quick {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s var(--ease-out, ease), box-shadow 0.15s, transform 0.15s;
}
.quick:hover {
  border-color: var(--brand-100);
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
}
.quick:hover .q-arrow { transform: translateX(3px); color: var(--brand-500); opacity: 1; }
.q-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}
.q-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.q-meta b { font-size: 13px; color: var(--text-primary); }
.q-meta span { font-size: 11px; color: var(--text-tertiary); }
.q-arrow { color: var(--text-tertiary); opacity: 0.6; transition: transform 0.15s var(--ease-out, ease), color 0.15s, opacity 0.15s; }
.kpi-big {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
</style>

