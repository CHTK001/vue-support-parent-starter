<script setup lang="ts">
/**
 * 监控概览（工作台）—— 对齐 prototype §PAGE-1
 * KPI + Donut + 最近告警 + 快捷入口
 * 全部按钮统一 ReButton，KPI 用 pages.css .kpi 原型风格（左侧色条 + sparkline）
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
const LEVEL_COLORS: Record<string, string> = { P0: "#f04a5d", P1: "#f97316", P2: "#eab308", P3: "#22c55e", P4: "#94a3b8" };
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
function spark(data: number[], w = 100, h = 24): string {
  if (!data.length) return "";
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  return data.map((v, i) => `${(i / (data.length - 1 || 1) * w).toFixed(1)},${(h - (v - min) / r * h).toFixed(1)}`).join(" ");
}
const trend = computed(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 5)));

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
  <div>
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

    <div v-if="loadError" class="as-error" style="margin-bottom:16px">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <span class="kpi-ico"><ReIcon name="DataBoard" :size="36" /></span>
        <div class="kpi-top"><span class="kpi-label">资产总数</span><span class="kpi-delta up">↗ +4</span></div>
        <div class="kpi-value">{{ monitors.length }}</div>
        <svg class="kpi-spark" viewBox="0 0 100 24" preserveAspectRatio="none"><polyline :points="spark(trend)" fill="none" stroke="var(--brand-500)" stroke-width="1.6" opacity="0.4" /></svg>
        <div class="kpi-sub">运行中 <b>{{ onlineCount }}</b> · 离线 <b>{{ monitors.length - onlineCount }}</b></div>
      </div>
      <div class="kpi c-red">
        <span class="kpi-ico"><ReIcon name="Bell" :size="36" /></span>
        <div class="kpi-top"><span class="kpi-label">告警未处理</span></div>
        <div class="kpi-value">{{ unhandledCount }}<span class="unit">/ {{ totalAlarms }}</span></div>
        <svg class="kpi-spark" viewBox="0 0 100 24" preserveAspectRatio="none"><polyline :points="spark(trend.map(v=>v*1.2))" fill="none" stroke="var(--status-alarm)" stroke-width="1.6" opacity="0.4" /></svg>
        <div class="kpi-sub">累计事件</div>
      </div>
      <div class="kpi c-red">
        <span class="kpi-ico"><ReIcon name="Warning" :size="36" /></span>
        <div class="kpi-top"><span class="kpi-label">P0+P1 高危</span><span class="kpi-delta down">↘ -2</span></div>
        <div class="kpi-value">{{ levelCounts.P0 + levelCounts.P1 }}</div>
        <div class="kpi-sub">30 分钟内响应</div>
      </div>
      <div class="kpi c-amber">
        <span class="kpi-ico"><ReIcon name="AlarmClock" :size="36" /></span>
        <div class="kpi-top"><span class="kpi-label">P2 中危</span></div>
        <div class="kpi-value">{{ levelCounts.P2 }}</div>
        <div class="kpi-sub">当班处理</div>
      </div>
    </section>

    <section class="cols-2-equal-responsive" style="margin-bottom:16px">
      <div class="card">
        <div class="card-head"><span class="card-title">告警等级分布</span></div>
        <div style="display:flex;align-items:center;gap:24px;padding:4px 0">
          <div :style="{width:'120px',height:'120px',borderRadius:'50%',flexShrink:0,position:'relative',...donutStyle}">
            <div style="position:absolute;inset:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-container);border-radius:50%">
              <div style="font-size:22px;font-weight:700">{{ totalAlarms }}</div>
              <div style="font-size:11px;color:var(--text-tertiary)">事件</div>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px">
            <div v-for="lv in LEVELS" :key="lv" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary)">
              <span :style="{width:'8px',height:'8px',borderRadius:'2px',background:LEVEL_COLORS[lv],flexShrink:0}" />
              <span style="flex:1">{{ lv }} {{ LEVEL_LABELS[lv] }}</span>
              <span class="tag" :class="`sev-${lv}`" style="font-size:11px;padding:1px 6px">{{ levelCounts[lv] }}</span>
            </div>
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
        <div v-if="totalAlarms > 5" style="padding:8px 12px;text-align:right">
          <ReButton icon="ArrowRight" :show-text="true" link type="primary" size="small" @click="router.push('/alarms')">查看全部</ReButton>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">快捷入口</span></div>
        <div class="quick-grid">
          <button class="quick" @click="router.push('/terminal')">
            <span class="q-ic" style="color:var(--brand-500);background:var(--brand-50)"><ReIcon name="Position" :size="18" /></span>
            <span class="q-meta"><b>远程控制台</b><span>SSH / RDP / VNC</span></span>
            <ReIcon name="ArrowRight" :size="14" class="q-arrow" />
          </button>
          <button class="quick" @click="router.push('/assets')">
            <span class="q-ic" style="color:var(--metric-cpu);background:rgba(59,130,246,.1)"><ReIcon name="Monitor" :size="18" /></span>
            <span class="q-meta"><b>主机资产</b><span>台账与凭据管理</span></span>
            <ReIcon name="ArrowRight" :size="14" class="q-arrow" />
          </button>
          <button class="quick" @click="router.push('/alarms')">
            <span class="q-ic" style="color:var(--metric-redis);background:rgba(239,68,68,.08)"><ReIcon name="Bell" :size="18" /></span>
            <span class="q-meta"><b>告警中心</b><span>事件流与处理</span></span>
            <ReIcon name="ArrowRight" :size="14" class="q-arrow" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.w100 { width: 100%; justify-content: flex-start; }
.as-error { display:flex; align-items:center; gap:12px; padding:10px 14px; font-size:13px; color:#9b1c2e; background:#fdecef; border:1px solid #fbc0c9; border-radius:8px; }
</style>
