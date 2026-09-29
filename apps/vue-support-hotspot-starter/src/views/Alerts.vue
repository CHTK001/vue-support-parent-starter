<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">告警中心</span>
        <ReTag :type="criticalCount ? 'danger' : 'success'" round>
          {{ criticalCount ? `${criticalCount} 个 CRITICAL` : "全部正常" }}
        </ReTag>
        <span class="match-hint" v-if="!loading">最近 {{ items.length }} 条事件 · 10s 自动刷新</span>
      </div>
      <div class="toolbar-right">
        <ReSelect v-model="severityFilter" :options="severityOptions" placeholder="严重级别" clearable class="sev-filter" />
        <ReSelect v-model="statusFilter" :options="statusOptions" placeholder="状态" clearable class="sev-filter" />
        <ReButton icon="SetUp" show-text round @click="openRules">规则管理</ReButton>
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="stat-row" v-if="!loading">
      <ReStatCard
        size="compact"
        title="总告警数"
        :value="items.length"
        :desc="`最近 ${windowLabel} 事件`"
        :icon="Bell"
        icon-color="#3b82f6"
      />
      <ReStatCard
        size="compact"
        title="CRITICAL"
        :value="criticalCount"
        :desc="criticalCount ? '存在严重告警' : '无严重告警'"
        :icon="Warning"
        :icon-color="criticalCount ? '#ef4444' : '#22c55e'"
      />
      <ReStatCard
        size="compact"
        title="WARNING"
        :value="warningCount"
        :desc="warningCount ? '存在预警事件' : '无预警事件'"
        :icon="Warning"
        :icon-color="warningCount ? '#f59e0b' : '#22c55e'"
      />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <div class="table-panel" v-else-if="filteredItems.length">
      <ReTab v-model="view" :tabs="tabItems" class="alert-tabs">
        <template #table>
          <ReTable
            :data="filteredItems as unknown as Record<string, unknown>[]"
            :columns="tableColumns"
            :loading="loading"
            :pagination="false"
            :toolbar="false"
            :layout-table="{ minHeight: 260 }"
          >
            <template #col-ts="{ row }">
              <span class="muted mono">{{ formatTime(row.ts) }}</span>
            </template>
            <template #col-metric="{ row }">
              <span class="mono metric-text">{{ (row as unknown as ApmAlert).metric }}</span>
              <ReTag
                v-if="(row as unknown as ApmAlert).severity === 'CRITICAL'"
                type="danger"

                round
                class="critical-flag"
              >
                CRITICAL
              </ReTag>
            </template>
            <template #col-current="{ row }">
              <span class="mono">{{ (row as unknown as ApmAlert).current }}</span>
            </template>
            <template #col-threshold="{ row }">
              <span class="mono muted">{{ (row as unknown as ApmAlert).threshold }}</span>
            </template>
            <template #col-severity="{ row }">
              <ReTag :type="sevTag((row as unknown as ApmAlert).severity)" round>
                {{ (row as unknown as ApmAlert).severity }}
              </ReTag>
            </template>
            <template #col-status="{ row }">
              <ReTag :type="statusTag((row as unknown as ApmAlert).status)" round>
                {{ (row as unknown as ApmAlert).status || 'OPEN' }}
              </ReTag>
            </template>
            <template #col-message="{ row }">
              <span class="msg-text">{{ (row as unknown as ApmAlert).message }}</span>
            </template>
            <template #col-actions="{ row }">
              <el-dropdown trigger="click" v-if="(row as unknown as ApmAlert).status !== 'ACKNOWLEDGED'">
                <el-button text type="primary">处置</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleAction(row, 'acknowledge')">确认</el-dropdown-item>
                    <el-dropdown-item @click="handleAction(row, 'mute')">静默</el-dropdown-item>
                    <el-dropdown-item @click="handleAction(row, 'ignore')">忽略</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span v-else class="mono muted">已确认</span>
            </template>
          </ReTable>
        </template>
        <template #timeline>
          <div class="timeline-wrap">
            <ReTimeline :items="timelineItems" :size="'small'">
              <template #description="{ item }">
                <p class="timeline-desc">
                  {{ item.description }}
                  <span class="mono muted timeline-values" v-if="timelineMeta(item)">
                    · 当前 {{ timelineMeta(item)!.current }} / 阈值 {{ timelineMeta(item)!.threshold }}
                  </span>
                </p>
              </template>
            </ReTimeline>
          </div>
        </template>
      </ReTab>
    </div>

    <div class="table-panel" v-else>
      <ReEmpty description="暂无告警事件，系统健康" />
    </div>

    <!-- 规则管理抽屉 -->
    <ReDrawer v-model="rulesVisible" title="告警规则管理" size="560px" direction="rtl">
      <div class="rule-form">
        <ReInput v-model="newRule.metric" placeholder="指标名（如 heap_percent / error_rate / active_leaks）" class="grow" />
        <ReInputNumber v-model="newRule.threshold" placeholder="阈值" class="grow" :min="0" />
        <ReSelect v-model="newRule.severity" :data="severityOptions" placeholder="级别" class="grow" />
        <ReInputNumber v-model="newRule.debounceMs" placeholder="去抖(ms)" class="grow" :min="0" />
        <el-button type="primary" :icon="Plus" show-text :loading="addingRule" @click="addRule" text>新增规则</el-button>
      </div>
      <div class="rule-list">
        <div v-for="r in rules" :key="r.metric" class="rule-item">
          <div class="rule-info">
            <div class="rule-metric mono">{{ r.metric }}</div>
            <div class="rule-threshold">
              <ReTag :type="r.enabled ? 'success' : 'info'" round>
                {{ r.enabled ? "启用" : "停用" }}
              </ReTag>
              <span class="mono muted">阈值 {{ r.threshold }} · {{ r.severity }} · 去抖 {{ r.debounceMs }}ms</span>
            </div>
          </div>
          <div class="rule-actions">
            <ReButton text type="primary" @click="toggleRule(r)">{{ r.enabled ? "停用" : "启用" }}</ReButton>
            <ReButton text type="danger" @click="deleteRule(r)">删除</ReButton>
          </div>
        </div>
        <ReEmpty v-if="!rules.length" description="暂无自定义规则" />
      </div>
    </ReDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Bell, Warning, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEmpty from "@repo/ui/re-empty";
import ReTab from "@repo/ui/re-tab";
import ReTimeline from "@repo/ui/re-timeline";
import ReSelect from "@repo/ui/re-select";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReDrawer from "@repo/ui/re-drawer";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getAlerts, getAlertRules, addAlertRule, toggleAlertRule, deleteAlertRule, acknowledgeAlert, muteAlert, ignoreAlert } from "../api/apmApi";
import type { ApmAlert, AlertRule } from "../api/apmApi";

/** ReTimeline items（@repo/ui/re-timeline 未导出该接口，与 index.vue 中定义对齐） */
interface TimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  time?: string;
  dotColor?: string;
  dotType?: "primary" | "success" | "warning" | "danger" | "info" | "hollow";
  current?: number;
  threshold?: number;
}

const items = ref<ApmAlert[]>([]);
const loading = ref(false);
const view = ref("table");
const severityFilter = ref("");
const statusFilter = ref("");
let timer: number | undefined;

const severityOptions = [
  { label: "CRITICAL", value: "CRITICAL" },
  { label: "WARNING", value: "WARNING" },
];

const statusOptions = [
  { label: "OPEN", value: "OPEN" },
  { label: "ACKNOWLEDGED", value: "ACKNOWLEDGED" },
  { label: "MUTED", value: "MUTED" },
  { label: "IGNORED", value: "IGNORED" },
];

/** 严重级别 + 状态筛选后的事件（ReTable 数据源） */
const filteredItems = computed(() => {
  let list = items.value;
  if (severityFilter.value) {
    list = list.filter((a) => a.severity === severityFilter.value);
  }
  if (statusFilter.value) {
    list = list.filter((a) => (a.status || "OPEN") === statusFilter.value);
  }
  return list;
});

/** 告警状态 tag 类型 */
function statusTag(status?: string): "success" | "warning" | "info" | "danger" {
  switch (status) {
    case "ACKNOWLEDGED": return "success";
    case "MUTED": return "warning";
    case "IGNORED": return "info";
    default: return "danger";
  }
}

const tabItems = [
  { name: "table", label: "表格视图" },
  { name: "timeline", label: "事件时间线" },
];

const criticalCount = computed(() => items.value.filter((a) => a.severity === "CRITICAL").length);
const warningCount = computed(() => items.value.filter((a) => a.severity === "WARNING").length);
const windowLabel = items.value.length ? "100 条内" : "0";

/** 时间线也应用严重级别筛选 */

const tableColumns: ReTableColumn[] = [
  { prop: "ts", label: "时间", width: 110, slot: "ts" },
  { prop: "metric", label: "指标", minWidth: 160, slot: "metric" },
  { prop: "current", label: "当前值", width: 90, align: "right", slot: "current" },
  { prop: "threshold", label: "阈值", width: 80, align: "right", slot: "threshold" },
  { prop: "severity", label: "级别", width: 90, align: "center", slot: "severity" },
  { prop: "status", label: "状态", width: 100, align: "center", slot: "status" },
  { prop: "message", label: "描述", minWidth: 200, slot: "message" },
  { prop: "actions", label: "操作", width: 90, align: "center", slot: "actions" },
];

const timelineItems = computed<TimelineItem[]>(() =>
  [...filteredItems.value]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30)
    .map((a, i) => ({
      id: i,
      title: a.metric,
      description: a.message,
      time: formatTime(a.ts),
      dotType: a.severity === "CRITICAL" ? "danger" : "warning",
      current: a.current,
      threshold: a.threshold,
    })),
);

function sevTag(sev: string): "danger" | "warning" {
  return sev === "CRITICAL" ? "danger" : "warning";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function timelineMeta(item: TimelineItem): { current: number; threshold: number } | null {
  if (item.current === undefined || item.threshold === undefined) return null;
  return { current: item.current, threshold: item.threshold };
}

async function load() {
  loading.value = true;
  try {
    items.value = await getAlerts(100);
  } catch {
    ElMessage.error("加载告警失败");
  } finally {
    loading.value = false;
  }
}

// ---- 规则管理 ----

const rulesVisible = ref(false);
const rules = ref<AlertRule[]>([]);
const addingRule = ref(false);
const newRule = ref({
  metric: "",
  threshold: 90,
  severity: "WARNING",
  debounceMs: 5000,
});

/** 打开规则管理抽屉并加载规则 */
async function openRules() {
  rulesVisible.value = true;
  try {
    rules.value = (await getAlertRules()) || [];
  } catch {
    ElMessage.error("加载规则失败");
  }
}

async function addRule() {
  const metric = newRule.value.metric.trim();
  if (!metric) {
    ElMessage.warning("请输入指标名");
    return;
  }
  addingRule.value = true;
  try {
    await addAlertRule({
      metric,
      threshold: newRule.value.threshold,
      severity: newRule.value.severity,
      debounceMs: newRule.value.debounceMs,
    });
    ElMessage.success(`已新增规则 ${metric}`);
    newRule.value.metric = "";
    rules.value = (await getAlertRules()) || [];
  } catch {
    ElMessage.error("新增规则失败");
  } finally {
    addingRule.value = false;
  }
}

/** 启停规则（前端先乐观更新，失败回滚） */
async function toggleRule(r: AlertRule) {
  const target = !r.enabled;
  const prev = r.enabled;
  r.enabled = target;
  try {
    await toggleAlertRule(r.metric, target);
    ElMessage.success(`${r.metric} 已${target ? "启用" : "停用"}`);
  } catch {
    r.enabled = prev;
    ElMessage.error("操作失败");
  }
}

async function deleteRule(r: AlertRule) {
  try {
    await deleteAlertRule(r.metric);
    rules.value = rules.value.filter((x) => x.metric !== r.metric);
    ElMessage.success(`已删除规则 ${r.metric}`);
  } catch {
    ElMessage.error("删除失败");
  }
}

// ---- 事件处置 ----

/** 处置告警：确认 / 静默 / 忽略 */
async function handleAction(row: Record<string, unknown>, action: "acknowledge" | "mute" | "ignore") {
  const alert = row as unknown as ApmAlert;
  const label = { acknowledge: "确认", mute: "静默", ignore: "忽略" }[action];
  try {
    const ok =
      action === "acknowledge" ? await acknowledgeAlert(alert.id)
      : action === "mute" ? await muteAlert(alert.id)
      : await ignoreAlert(alert.id);
    if (ok) {
      alert.status = action === "acknowledge" ? "ACKNOWLEDGED" : action === "mute" ? "MUTED" : "IGNORED";
      ElMessage.success(`已${label}告警事件`);
    }
  } catch {
    ElMessage.error(`${label}失败`);
  }
}

onMounted(() => {
  load();
  timer = window.setInterval(load, 10000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.match-hint {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
}

/* 严重级别筛选 */
.sev-filter {
  width: 130px;
}

/* 统计卡片行 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-row :deep(.re-stat-card) {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg（同详情卡档位） */
}

.stat-row :deep(.re-stat-card .re-stat-card__title) {
  color: var(--apm-muted);
}

.stat-row :deep(.re-stat-card .re-stat-card__value) {
  color: var(--apm-fg);
  font-variant-numeric: tabular-nums;
}

.stat-row :deep(.re-stat-card .re-stat-card__desc) {
  color: var(--apm-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格面板 */
.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px */
  padding: 8px;
}

.alert-tabs :deep(.el-tabs__item) {
  color: var(--apm-muted);
}

.alert-tabs :deep(.el-tabs__item.is-active) {
  color: var(--apm-fg);
}

.alert-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-5));
}

.alert-tabs :deep(.el-tabs__nav-wrap::after) {
  background: var(--apm-border);
}

.table-panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.metric-text {
  color: var(--apm-fg);
}

.critical-flag {
  margin-left: 8px;
}

.msg-text {
  color: var(--apm-fg);
}

/* 时间线视图（跟随 APM 主题令牌） */
.timeline-wrap {
  padding: 12px;
}

.timeline-wrap :deep(.re-timeline__title) {
  color: var(--apm-fg);
}

.timeline-wrap :deep(.re-timeline__time) {
  color: var(--apm-muted);
}

.timeline-wrap :deep(.re-timeline__description) {
  color: var(--apm-muted);
}

.timeline-desc {
  margin: 0;
}

.timeline-values {
  font-size: 12px;
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

/* ---- 规则管理抽屉 ---- */
.rule-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--apm-border);
  margin-bottom: 16px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 10px，取最近档 lg */
}

.rule-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.rule-metric {
  color: var(--apm-fg);
  font-weight: 600;
}

.rule-threshold {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}

/* 尊重系统「减少动态效果」偏好：
   本页自身无 transition/animation，需关掉的是骨架屏与 loading 的旋转动画（第三方组件根节点拿不到 scoped 属性，须走 :deep） */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
