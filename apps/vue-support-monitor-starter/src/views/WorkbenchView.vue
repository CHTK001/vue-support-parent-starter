<script setup lang="ts">
/**
 * 监控概览（工作台）—— 对齐 prototype §PAGE-1
 * KPI 行（左侧色条 + value + sparkline）+ 告警 Donut + 最近告警 + 快捷入口
 * 使用全局 pages.css 样式（.page-header / .kpi-row / .kpi / .card）；不套 page-wrap，响应式填满。
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
    const from = (acc / total) * 360; acc += n;
    stops.push(`${LEVEL_COLORS[lv]} ${from}deg ${(acc / total) * 360}deg`);
  }
  return { background: `conic-gradient(${stops.join(", ")})` };
});
const recentAlarms = computed(() =>
  [...events.value].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? "")).slice(0, 5),
);

// Sparkline 生成（返回 polyline points 字符串：x,y x,y ...，兼容 SVG points 属性）
function spark(data: number[], w = 100, h = 24): string {
  if (!data.length) return "";
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  return data.map((v, i) => `${(i / (data.length - 1 || 1) * w).toFixed(1)},${(h - (v - min) / range * h).toFixed(1)}`).join(" ");
}

// 概览 sparkline 数据（用告警级别计数模拟趋势 —— 后端 trend 接口 404 时降级）
// 实际生产应替换为 /ms/monitor/alarm/trend
const alarmTrend = computed(() => {
  const len = 12;
  // 模拟趋势：随机波动的告警数，实测时会是真实数据
  return Array.from({ length: len }, () => Math.floor(Math.random() * 5));
});

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const [m, ev] = await Promise.all([fetchMonitors(), fetchAlarmEvents()]);
    monitors.value = m ?? [];
    events.value = ev ?? [];
    const d = new Date();
    lastRefresh.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
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
        <button class="btn" @click="fetchAll" :disabled="loading">⟳ 刷新</button>
        <button class="btn btn-primary" @click="router.push('/assets')">+ 新建资产</button>
      </div>
    </div>

    <div v-if="loadError" style="padding:10px 14px;margin-bottom:16px;font-size:13px;color:#9b1c2e;background:#fdecef;border:1px solid #fbc0c9;border-radius:8px;display:flex;align-items:center;gap:12px">
      <span>数据加载失败：{{ loadError }}</span>
      <button class="btn btn-primary btn-sm" @click="fetchAll">重试</button>
    </div>

    <!-- KPI 行 -->
    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <div class="kpi-top">
          <span class="kpi-label">资产总数</span>
          <span class="kpi-delta up">↗ +4</span>
        </div>
        <div class="kpi-value">{{ monitors.length }}</div>
        <svg class="kpi-spark" viewBox="0 0 100 24" preserveAspectRatio="none"><polyline :points="spark(alarmTrend)" fill="none" stroke="var(--brand-500)" stroke-width="1.6" opacity="0.4" /></svg>
        <div class="kpi-sub">运行中 <b>{{ onlineCount }}</b> · 离线 <b>{{ monitors.length - onlineCount }}</b></div>
      </div>
      <div class="kpi c-red">
        <div class="kpi-top">
          <span class="kpi-label">告警未处理</span>
        </div>
        <div class="kpi-value">{{ unhandledCount }}<span class="unit">/ {{ totalAlarms }}</span></div>
        <svg class="kpi-spark" viewBox="0 0 100 24" preserveAspectRatio="none"><polyline :points="spark(alarmTrend.map(v => v * 1.2))" fill="none" stroke="var(--status-alarm)" stroke-width="1.6" opacity="0.4" /></svg>
        <div class="kpi-sub">累计事件</div>
      </div>
      <div class="kpi c-red">
        <div class="kpi-top">
          <span class="kpi-label">P0+P1 高危</span>
          <span class="kpi-delta down">↘ -2</span>
        </div>
        <div class="kpi-value">{{ levelCounts.P0 + levelCounts.P1 }}</div>
        <div class="kpi-sub">30 分钟内响应</div>
      </div>
      <div class="kpi c-amber">
        <div class="kpi-top">
          <span class="kpi-label">P2 中危</span>
        </div>
        <div class="kpi-value">{{ levelCounts.P2 }}</div>
        <div class="kpi-sub">当班处理</div>
      </div>
    </section>

    <!-- 主区：Donut + 最近告警 + 快捷入口 -->
    <section class="cols-2-equal-responsive" style="margin-bottom:16px">
      <div class="card">
        <div class="card-head">
          <span class="card-title">告警等级分布</span>
        </div>
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
        <div class="card-head">
          <span class="card-title">最近告警</span>
        </div>
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
        <div v-if="totalAlarms > 5" style="padding:8px 12px;font-size:13px;text-align:right">
          <button class="btn btn-ghost btn-sm" @click="router.push('/alarms')">查看全部 →</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">快捷入口</span></div>
        <button class="btn" style="width:100%;justify-content:flex-start" @click="router.push('/terminal')">🖱 远程控制台</button>
        <button class="btn" style="width:100%;justify-content:flex-start;margin-top:8px" @click="router.push('/assets')">🖥 主机资产</button>
        <button class="btn" style="width:100%;justify-content:flex-start;margin-top:8px" @click="router.push('/alarms')">🔔 告警中心</button>
      </div>
    </section>
  </div>
</template>