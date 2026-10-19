<script setup lang="ts">
/**
 * 告警中心 —— 对齐 prototype §PAGE-ALARM（ReSectionHead + ReCard + ReTag + ReButton(square)）
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { fetchAlarmEvents, handleAlarmEvent, alarmLevel, isUnhandled, type AlarmEvent } from "../monitorApi";
import { useDialogPrerender } from "../utils/dialogPrerender";

const loading = ref(false);
const loadError = ref("");
const events = ref<AlarmEvent[]>([]);
const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;

/** 实时时钟 */
const liveTime = ref("");
let timer: ReturnType<typeof setInterval> | null = null;
function updateTime() {
  const now = new Date();
  liveTime.value = now.toTimeString().slice(0, 8);
}
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };
const filterLevel = ref("");
const filterStatus = ref("");
const keyword = ref("");

const levelCounts = computed(() => {
  const m: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) m[alarmLevel(e)]++;
  return m;
});

const totalAlarms = computed(() => events.value.length);
const unhandledCount = computed(() => events.value.filter(isUnhandled).length);

// KPI 色条 tone（pages.css .kpi.c-*）
const TONES: Record<string, string> = { P0: "red", P1: "red", P2: "amber", P3: "green", P4: "gray" };
const SEV_HINTS: Record<string, string> = { P0: "立即响应", P1: "30 分钟", P2: "当班处理", P3: "计划内", P4: "通知" };
/**
 * KPI 色条 tone 映射
 * @param lv 告警级别
 */
function kpiTone(lv: string): string { return TONES[lv] ?? "gray"; }
/**
 * 级别标签映射
 * @param lv 告警级别
 */
function sevLabel(lv: string): string { return SEV_HINTS[lv] ?? ""; }
/**
 * 级别处理建议提示
 * @param lv 告警级别
 */
function sevHint(lv: string): string { return SEV_HINTS[lv] ?? ""; }

const filtered = computed(() => {
  let list = events.value;
  if (filterLevel.value) list = list.filter(e => alarmLevel(e) === filterLevel.value);
  if (filterStatus.value) {
    if (filterStatus.value === "NEW") list = list.filter(isUnhandled);
    else list = list.filter(e => String(e.msMonitorAlarmEventStatus || "").toUpperCase() === filterStatus.value);
  }
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(e => (e.msMonitorAlarmEventMonitorName || "").toLowerCase().includes(k) || (e.msMonitorAlarmEventMetricName || "").toLowerCase().includes(k));
  }
  return [...list].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""));
});

/**
 * 告警状态中文标签
 * @param e 告警事件
 */
function statusLabel(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "未处理";
  if (s === "FALSE" || s === "FALSE_ALARM") return "误报";
  if (s === "PROCESSED") return "已处理";
  return s || "—";
}
/**
 * 告警状态对应的 el-tag 类型
 * @param e 告警事件
 */
function statusType(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "danger";
  if (s === "PROCESSED") return "success";
  return "info";
}

/** ReTable 列定义 */
const alarmColumns = computed(() => [
  { prop: "timeText", label: "时间", width: 150, slot: "time" },
  { prop: "msMonitorAlarmEventLevel", label: "级别", width: 74, slot: "level" },
  { prop: "msMonitorAlarmEventMonitorName", label: "主机", minWidth: 130, showOverflowTooltip: true },
  { prop: "msMonitorAlarmEventMetricName", label: "指标", minWidth: 130, showOverflowTooltip: true },
  { prop: "valueText", label: "当前值 / 阈值", width: 118, slot: "value" },
  { prop: "msMonitorAlarmEventStatus", label: "状态", width: 84, slot: "status" },
  { prop: "id", label: "操作", width: 62, fixed: "right", align: "right", slot: "op" },
]);

/** 行级格式化辅助（供 slot 使用） */
function timeText(e: AlarmEvent): string { return (e.msMonitorAlarmEventTriggerTime || "").slice(0, 16); }
/**
 * 当前值/阈值展示文本
 * @param e 告警事件
 */
function valueText(e: AlarmEvent): string { return `${e.msMonitorAlarmEventAlarmValue} / ${e.msMonitorAlarmEventThreshold}`; }
/**
 * 告警行样式类：级别色条 + P0/P1 高亮背景
 */
function rowClass(e: AlarmEvent): Record<string, boolean> {
  const lv = alarmLevel(e);
  return {
    [`level-bar-${lv.toLowerCase()}`]: true,
    "row-critical": lv === "P0" || lv === "P1",
  };
}

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try { events.value = (await fetchAlarmEvents()) ?? []; }
  catch (e) { loadError.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}

// 处理弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts）
const handleVisible = ref(false);
useDialogPrerender(handleVisible);
const handleTarget = ref<AlarmEvent | null>(null);
const handleRemark = ref("");
const handleFalseAlarm = ref(false);
const handleSubmitting = ref(false);
/**
 * 打开告警处理弹窗
 * @param e 告警事件
 */
function openHandle(e: AlarmEvent): void {
  handleTarget.value = e;
  handleRemark.value = "";
  handleFalseAlarm.value = false;
  handleVisible.value = true;
}
async function submitHandle(): Promise<void> {
  if (!handleTarget.value) return;
  handleSubmitting.value = true;
  try {
    await handleAlarmEvent(handleTarget.value.id, handleRemark.value || (handleFalseAlarm.value ? "误报" : "已处理"), handleFalseAlarm.value);
    message.success("处理完成");
    handleVisible.value = false;
    await fetchAll();
  } catch (e) { message.error(String((e as Error)?.message ?? e)); }
  finally { handleSubmitting.value = false; }
}

onMounted(fetchAll);
</script>

<template>
  <div class="al tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">告警中心</h1>
        <p class="page-desc">
          事件流 · 按级别响应 · 24h 触发 <b>{{ totalAlarms }}</b> 次 · 未处理 <b>{{ unhandledCount }}</b>
          <span class="live-clock"><span class="pulse-dot"></span>{{ liveTime }}</span>
        </p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true"  :loading="loading" @click="fetchAll">刷新</ReButton>
      </div>
    </div>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary"  :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- 级别 KPI 行（左色条对齐告警级别色） -->
    <section class="kpi-row cols-5">
      <div class="kpi" :class="`c-${kpiTone(lv)}`" v-for="lv in LEVELS" :key="lv">
        <div class="kpi-head">
          <ReButton icon="Warning" layout="square" decorative />
          <span class="kpi-label">{{ lv }} {{ LEVEL_LABELS[lv] }}</span>
          <span class="tag" :class="`sev-${lv}`">{{ sevLabel(lv) }}</span>
        </div>
        <div class="kpi-value">{{ levelCounts[lv] }}</div>
        <div class="kpi-sub">{{ sevHint(lv) }}</div>
      </div>
    </section>

    <!-- 过滤栏 -->
    <div class="filter-panel">
      <ReInput v-model="keyword" placeholder="搜索主机 / 指标" clearable  class="f-kw" />
      <ReSelect v-model="filterLevel" placeholder="级别" clearable  class="f-sel" :options="LEVELS.map(lv => ({ label: lv + ' ' + LEVEL_LABELS[lv], value: lv }))" />
      <ReSelect v-model="filterStatus" placeholder="状态" clearable  class="f-sel" :options="[
        { label: '未处理', value: 'NEW' },
        { label: '已处理', value: 'PROCESSED' },
        { label: '误报', value: 'FALSE_ALARM' },
      ]" />
      <span class="f-count">{{ filtered.length }} 条</span>
    </div>

    <!-- 事件流。布局切换器显式开启（ReTable 默认 false、页面按需开启的产品口径），
         告警页视图/卡片走组件兜底模板，渲染全部字段 -->
    <ReCard :radius="12" shadow="never">
      <ReTable
        :data="filtered"
        :pagination="false"
        :columns="alarmColumns"
        :loading="loading"
        :border="false"
        :layout-switch="true"
        empty-text="暂无告警事件"
        table-id="monitor-alarms"
        :row-class="rowClass"
      >
        <template #col-time="{ row }"><span class="mono">{{ timeText(row) }}</span></template>
        <template #col-level="{ row }">
          <div :class="`level-indicator level-${alarmLevel(row).toLowerCase()}`">{{ alarmLevel(row) }}</div>
        </template>
        <template #col-value="{ row }"><span class="mono">{{ valueText(row) }}</span></template>
        <template #col-status="{ row }"><span :class="['status-tag', { 'is-unhandled': statusLabel(row) === '未处理' }]">{{ statusLabel(row) }}</span></template>
        <template #col-op="{ row }">
          <ReButton v-if="isUnhandled(row)" icon="Check" layout="square"  type="primary" @click="openHandle(row)" title="处理" />
          <span v-else class="dim">—</span>
        </template>
      </ReTable>
    </ReCard>

    <!-- 处理弹窗 -->
    <ReDialog v-model="handleVisible" title="处理告警事件" width="440px">
      <div v-if="handleTarget" class="dlg-meta">
        <ReTag :type="(alarmLevel(handleTarget)==='P0'||alarmLevel(handleTarget)==='P1')?'danger':'warning'" effect="dark">{{ alarmLevel(handleTarget) }}</ReTag>
        <b>{{ handleTarget.msMonitorAlarmEventMonitorName }}</b>
        <span class="dim">{{ handleTarget.msMonitorAlarmEventMetricName }} = {{ handleTarget.msMonitorAlarmEventAlarmValue }}（阈值 {{ handleTarget.msMonitorAlarmEventThreshold }}）</span>
      </div>
      <ReInput v-model="handleRemark" type="textarea" :rows="3" placeholder="处理备注（可留空）" />
      <ReSwitch v-model="handleFalseAlarm" active-text="误报" style="margin-top: 10px" />
      <template #footer>
        <ReButton @click="handleVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="handleSubmitting" @click="submitHandle" icon="Check" :show-text="true">确认处理</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* 依赖全局 pages.css 的 .page-header/.kpi-row/.kpi/.card/.filter/.t */
.dim { color: var(--text-tertiary); }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
.as-error { display:flex; align-items:center; gap:12px; padding:10px 14px; font-size:13px; color:var(--status-error-text); background:var(--status-error-bg); border:1px solid var(--status-error-border); border-radius: var(--radius-sm); }
.dlg-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; }
/* 独立过滤栏：水平排列，与 card 分离避免双层背景 */
.filter-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--tel-panel, #fff);
  border: 1px solid var(--tel-border, #e2e8f0);
  border-radius: 12px 12px 0 0;
  border-bottom: none;
  margin-bottom: 0;
}
.filter-panel :deep(.re-input),
.filter-panel :deep(.re-select) {
  width: 100%;
}
.f-kw { width: 260px; flex-shrink: 0; }
.f-sel { width: 150px; flex-shrink: 0; }
.f-count { margin-left: auto; font-size: 12px; color: var(--text-tertiary); white-space: nowrap; flex-shrink: 0; }
/* ReCard 与过滤栏衔接：去除自身 header，圆角只保留下半 */
:deep(.re-card) { background: transparent; border: none; box-shadow: none; }
:deep(.re-card__body) {
  padding: 0;
  background: var(--tel-panel, #fff);
  border: 1px solid var(--tel-border, #e2e8f0);
  border-radius: 0 0 12px 12px;
  border-top: none;
}

/* 实时时钟 */
.live-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 13px;
  color: var(--el-color-success);
  font-weight: 600;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-success);
  animation: pulse-green 1.5s ease-in-out infinite;
}
@keyframes pulse-green {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(10, 207, 107, 0.5); }
  50% { opacity: 0.7; transform: scale(1.1); box-shadow: 0 0 0 6px rgba(10, 207, 107, 0); }
}

/* 告警行样式 */
:deep(.el-table__row) {
  transition: background-color 0.15s ease;
}
:deep(.el-table__row:hover) {
  background-color: var(--bg-fill) !important;
}
:deep(.el-table__row.row-critical) {
  background-color: color-mix(in srgb, var(--el-color-danger) 5%, transparent) !important;
}
:deep(.el-table__row.row-critical:hover) {
  background-color: color-mix(in srgb, var(--el-color-danger) 8%, var(--bg-fill)) !important;
}

/* 级别色条指示器 */
.level-indicator {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  position: relative;
}
.level-indicator::before {
  content: '';
  display: block;
  width: 3px;
  height: 16px;
  border-radius: 2px;
  margin-right: 6px;
}
.level-p0 { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 10%, transparent); }
.level-p0::before { background: var(--el-color-danger); }
.level-p1 { color: #e6a23c; background: color-mix(in srgb, #e6a23c 10%, transparent); }
.level-p1::before { background: #e6a23c; }
.level-p2 { color: #e6a23c; background: color-mix(in srgb, #e6a23c 8%, transparent); }
.level-p2::before { background: #e6a23c; }
.level-p3 { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 8%, transparent); }
.level-p3::before { background: var(--el-color-success); }
.level-p4 { color: var(--text-tertiary); background: var(--bg-fill); }
.level-p4::before { background: var(--text-tertiary); }

/* 未处理状态脉冲 */
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-tag.is-unhandled {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  position: relative;
}
.status-tag.is-unhandled::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
  animation: pulse-red 1.2s ease-in-out infinite;
}
@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
</style>
