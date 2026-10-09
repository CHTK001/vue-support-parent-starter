<template>
  <div class="dsm-flex-col">
    <div class="pms-card">
      <div class="pms-toolbar">
        <div class="dsm-seg" role="group" aria-label="监控视图">
          <button type="button" :class="{ 'is-active': tab === 'targets' }" data-testid="pms-tab-targets" @click="switchTab('targets')">
            抓取目标
            <span v-if="tab === 'targets' && targets" class="pms-count">{{ targets }}</span>
          </button>
          <button type="button" :class="{ 'is-active': tab === 'rules' }" data-testid="pms-tab-rules" @click="switchTab('rules')">规则</button>
          <button type="button" :class="{ 'is-active': tab === 'alerts' }" data-testid="pms-tab-alerts" @click="switchTab('alerts')">告警</button>
        </div>
        <div class="pms-spacer" />
        <ReButton size="small" data-testid="pms-btn-refresh" @click="load(true)">
          <ReIcon name="Refresh" :size="13" />
          刷新
        </ReButton>
      </div>

      <!-- 目标 -->
      <div v-if="tab === 'targets'">
        <div v-if="loading" class="pms-center">加载中…</div>
        <div v-else-if="error" class="pms-error">{{ error }}</div>
        <div v-else-if="!targetList.length" class="pms-center">暂无抓取目标</div>
        <table v-else class="pms-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>实例</th>
              <th>健康</th>
              <th>最近抓取</th>
              <th>耗时</th>
              <th>错误</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in targetList" :key="i">
              <td>{{ t.labels?.job || "—" }}</td>
              <td class="pms-name" :title="t.scrapeUrl || t.labels?.instance">{{ t.labels?.instance || t.scrapeUrl || "—" }}</td>
              <td>
                <span class="pms-badge" :class="healthClass(t.health)">{{ t.health }}</span>
              </td>
              <td>{{ shortTime(t.lastScrape) }}</td>
              <td>{{ t.lastScrapeDuration ? `${t.lastScrapeDuration.toFixed(3)}s` : "—" }}</td>
              <td class="pms-err" :title="t.lastError">{{ t.lastError || "" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 规则 -->
      <div v-else-if="tab === 'rules'">
        <div v-if="loading" class="pms-center">加载中…</div>
        <div v-else-if="error" class="pms-error">{{ error }}</div>
        <div v-else-if="!ruleGroups?.length" class="pms-center">暂无规则</div>
        <div v-else class="pms-groups">
          <div v-for="g in ruleGroups" :key="g.file + g.name" class="pms-group">
            <div class="pms-group-head">
              <span class="pms-group-name">{{ g.name }}</span>
              <span class="pms-group-file">{{ g.file }}</span>
            </div>
            <table class="pms-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>表达式</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in g.rules" :key="i">
                  <td>{{ r.name }}</td>
                  <td>{{ r.type }}</td>
                  <td>
                    <span v-if="r.state" class="pms-badge" :class="stateClass(r.state)">{{ r.state }}</span>
                    <span v-else>—</span>
                  </td>
                  <td class="pms-expr" :title="r.query">{{ r.query }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 告警 -->
      <div v-else>
        <div v-if="loading" class="pms-center">加载中…</div>
        <div v-else-if="error" class="pms-error">{{ error }}</div>
        <div v-else-if="!alerts?.length" class="pms-center">当前无活跃告警</div>
        <table v-else class="pms-table">
          <thead>
            <tr>
              <th>告警</th>
              <th>级别</th>
              <th>状态</th>
              <th>开始时间</th>
              <th>值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in alerts" :key="i">
              <td>
                <div class="pms-alert-name">{{ a.labels?.alertname || "—" }}</div>
                <div class="pms-alert-sub">{{ a.annotations?.summary || a.annotations?.description || "" }}</div>
              </td>
              <td>
                <span class="pms-badge" :class="severityClass(a.labels?.severity)">{{ a.labels?.severity || "—" }}</span>
              </td>
              <td>
                <span class="pms-badge" :class="a.state === 'firing' ? 'is-down' : 'is-warn'">{{ a.state }}</span>
              </td>
              <td>{{ shortTime(a.activeAt) }}</td>
              <td>{{ a.value ?? "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PromMonitorPanel">
/**
 * 监控面板：抓取目标 / 规则 / 活跃告警 三视图。
 */
import { onMounted, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import {
  fetchPrometheusAlerts,
  fetchPrometheusRules,
  fetchPrometheusTargets,
  type PromAlert,
  type PromRuleGroup,
  type PromTarget,
} from "../../../api/prometheus/api";

const props = defineProps<{
  datasourceId: number | null | undefined;
}>();

const tab = ref<"targets" | "rules" | "alerts">("targets");
const loading = ref(false);
const error = ref("");
const targetList = ref<PromTarget[]>([]);
const ruleGroups = ref<PromRuleGroup[]>([]);
const alerts = ref<PromAlert[]>([]);
const targets = ref(0);

const load = async (manual = false) => {
  void manual;
  loading.value = true;
  error.value = "";
  try {
    if (tab.value === "targets") {
      const data = await fetchPrometheusTargets(props.datasourceId);
      targetList.value = data?.activeTargets ?? [];
      targets.value = targetList.value.length;
    } else if (tab.value === "rules") {
      const data = await fetchPrometheusRules(props.datasourceId);
      ruleGroups.value = data?.groups ?? [];
    } else {
      const data = await fetchPrometheusAlerts(props.datasourceId);
      alerts.value = data?.alerts ?? [];
    }
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    loading.value = false;
  }
};

function switchTab(next: "targets" | "rules" | "alerts") {
  if (tab.value === next) {
    return;
  }
  tab.value = next;
  void load();
}

function healthClass(health: string | undefined): string {
  if (health === "up") return "is-up";
  if (health === "down") return "is-down";
  return "";
}

function stateClass(state: string | undefined): string {
  if (state === "firing") return "is-down";
  if (state === "pending") return "is-warn";
  return "is-up";
}

function severityClass(severity: string | undefined): string {
  if (!severity) return "";
  if (/critical|fatal|page/i.test(severity)) return "is-down";
  if (/warning|warn/i.test(severity)) return "is-warn";
  return "";
}

function shortTime(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("zh-CN", { hour12: false });
}

watch(
  () => props.datasourceId,
  () => {
    void load();
  }
);

onMounted(() => {
  void load();
});
</script>

<style scoped lang="scss">
.dsm-flex-col { display: flex; flex-direction: column; gap: 6px; }
.pms-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
}
.pms-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.pms-spacer { flex: 1; }
.dsm-seg {
  display: inline-flex;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.dsm-seg button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 0;
  border-right: 1px solid var(--border-default);
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  &:last-child { border-right: none; }
  &.is-active { background: var(--brand-500); color: #fff; }
}
.pms-count {
  font-size: 11px;
  padding: 0 5px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.24);
}
.pms-center { text-align: center; color: var(--text-tertiary); padding: 40px 0; font-size: 12px; }
.pms-error { color: var(--status-error); font-size: 12px; padding: 12px; }
.pms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th { position: sticky; top: 0; text-align: left; font-weight: 600; color: var(--text-tertiary); background: var(--bg-container); padding: 5px 8px; border-bottom: 1px solid var(--border-subtle); }
  td { padding: 5px 8px; border-bottom: 1px solid var(--border-subtle); color: var(--text-primary); }
}
.pms-name { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pms-expr { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, Consolas, monospace; }
.pms-err { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--status-error); }
.pms-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  &.is-up { background: color-mix(in srgb, var(--status-success) 14%, transparent); color: var(--status-success); }
  &.is-down { background: color-mix(in srgb, var(--status-error) 14%, transparent); color: var(--status-error); }
  &.is-warn { background: color-mix(in srgb, var(--status-warning) 14%, transparent); color: var(--status-warning); }
}
.pms-groups { display: flex; flex-direction: column; gap: 10px; }
.pms-group {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}
.pms-group-head {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg-fill);
}
.pms-group-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.pms-group-file { font-size: 11px; color: var(--text-tertiary); }
.pms-alert-name { font-weight: 600; }
.pms-alert-sub { font-size: 11px; color: var(--text-tertiary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>