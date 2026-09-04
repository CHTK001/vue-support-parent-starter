<script setup lang="ts">
/**
 * 告警中心 —— design.md §4.4
 * P0~P4 级别 KPI 卡 + 事件流（FilterBar + 表格）+ 处理弹窗
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchAlarmEvents,
  handleAlarmEvent,
  alarmLevel,
  isUnhandled,
  type AlarmEvent,
} from "../monitorApi";

const loading = ref(false);
const loadError = ref("");
const events = ref<AlarmEvent[]>([]);

const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };
const LEVEL_HINTS: Record<string, string> = {
  P0: "立即响应",
  P1: "30 分钟",
  P2: "当班处理",
  P3: "计划内",
  P4: "通知",
};

const filterLevel = ref("");
const filterStatus = ref("");
const keyword = ref("");

const levelCounts = computed(() => {
  const map: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) map[alarmLevel(e)]++;
  return map;
});

const filtered = computed(() => {
  let list = events.value;
  if (filterLevel.value) list = list.filter(e => alarmLevel(e) === filterLevel.value);
  if (filterStatus.value) {
    if (filterStatus.value === "NEW") list = list.filter(isUnhandled);
    else list = list.filter(e => String(e.msMonitorAlarmEventStatus || "").toUpperCase() === filterStatus.value);
  }
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(
      e =>
        (e.msMonitorAlarmEventMonitorName || "").toLowerCase().includes(k) ||
        (e.msMonitorAlarmEventMetricName || "").toLowerCase().includes(k),
    );
  }
  return [...list].sort((a, b) =>
    (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""),
  );
});

function statusLabel(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "未处理";
  if (s === "FALSE" || s === "FALSE_ALARM") return "误报";
  if (s === "PROCESSED") return "已处理";
  return s || "—";
}
function statusClass(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "st-new";
  if (s === "PROCESSED") return "st-ok";
  return "st-info";
}

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    events.value = (await fetchAlarmEvents()) ?? [];
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

// ---- 处理弹窗 ----
const handleVisible = ref(false);
const handleTarget = ref<AlarmEvent | null>(null);
const handleRemark = ref("");
const handleFalseAlarm = ref(false);
const handleSubmitting = ref(false);

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
    ElMessage.success("处理完成");
    handleVisible.value = false;
    await fetchAll();
  } catch (err) {
    ElMessage.error(`处理失败：${String((err as Error)?.message ?? err)}`);
  } finally {
    handleSubmitting.value = false;
  }
}

onMounted(fetchAll);
</script>

<template>
  <div class="al">
    <header class="al-head">
      <div>
        <h1 class="al-title">告警中心</h1>
        <div class="al-sub">事件流 · 按级别响应</div>
      </div>
      <el-button size="small" :loading="loading" @click="fetchAll">刷新</el-button>
    </header>

    <div v-if="loadError" class="al-error">
      <span>数据加载失败：{{ loadError }}</span>
      <el-button size="small" type="primary" @click="fetchAll">重试</el-button>
    </div>

    <!-- 级别 KPI -->
    <section class="level-row">
      <div v-for="lv in LEVELS" :key="lv" :class="['level-card', `lc-${lv}`]" data-test="level-kpi">
        <div class="level-name">{{ lv }} {{ LEVEL_LABELS[lv] }}</div>
        <div class="level-value">{{ levelCounts[lv] }}</div>
        <div class="level-hint">{{ LEVEL_HINTS[lv] }}</div>
      </div>
    </section>

    <!-- 事件流 -->
    <div class="card">
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索主机 / 指标" clearable size="small" class="f-kw" />
        <el-select v-model="filterLevel" placeholder="级别" clearable size="small" class="f-sel">
          <el-option v-for="lv in LEVELS" :key="lv" :label="lv + ' ' + LEVEL_LABELS[lv]" :value="lv" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable size="small" class="f-sel">
          <el-option label="未处理" value="NEW" />
          <el-option label="已处理" value="PROCESSED" />
          <el-option label="误报" value="FALSE" />
        </el-select>
        <span class="f-count">{{ filtered.length }} 条</span>
      </div>

      <el-table :data="filtered" v-loading="loading" size="small" class="al-table" empty-text="暂无告警事件">
        <el-table-column label="时间" width="150">
          <template #default="{ row }">
            <span class="mono">{{ (row.msMonitorAlarmEventTriggerTime || "").slice(0, 19) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="70">
          <template #default="{ row }">
            <span :class="['lv-tag', `lv-${alarmLevel(row).toLowerCase()}`]">{{ alarmLevel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="msMonitorAlarmEventMonitorName" label="主机" min-width="140" show-overflow-tooltip />
        <el-table-column prop="msMonitorAlarmEventMetricName" label="指标" min-width="130" show-overflow-tooltip />
        <el-table-column label="当前值 / 阈值" width="120">
          <template #default="{ row }">
            <span class="mono">
              {{ row.msMonitorAlarmEventAlarmValue }}
              <span class="dim">/ {{ row.msMonitorAlarmEventThreshold }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['st-tag', statusClass(row)]">{{ statusLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isUnhandled(row)" link type="primary" size="small" @click="openHandle(row)">处理</el-button>
            <span v-else class="dim">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleVisible" title="处理告警事件" width="440px">
      <div v-if="handleTarget" class="dlg-meta">
        <span :class="['lv-tag', `lv-${alarmLevel(handleTarget).toLowerCase()}`]">{{ alarmLevel(handleTarget) }}</span>
        <b>{{ handleTarget.msMonitorAlarmEventMonitorName }}</b>
        <span class="dim">{{ handleTarget.msMonitorAlarmEventMetricName }} = {{ handleTarget.msMonitorAlarmEventAlarmValue }}（阈值 {{ handleTarget.msMonitorAlarmEventThreshold }}）</span>
      </div>
      <el-input v-model="handleRemark" type="textarea" :rows="3" placeholder="处理备注（可留空）" />
      <el-checkbox v-model="handleFalseAlarm" style="margin-top: 10px">标记为误报</el-checkbox>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleSubmitting" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.al {
  max-width: 1440px;
  padding: 24px;
}
.al-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}
.al-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.al-sub {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.al-error {
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

.level-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.level-card {
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-left-width: 3px;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  &.lc-p0 { border-left-color: #f04a5d; }
  &.lc-p1 { border-left-color: #f97316; }
  &.lc-p2 { border-left-color: #eab308; }
  &.lc-p3 { border-left-color: #22c55e; }
  &.lc-p4 { border-left-color: #94a3b8; }
}
.level-name {
  font-size: 12px;
  color: var(--text-secondary);
}
.level-value {
  margin-top: 2px;
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
}
.level-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

.card {
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.f-kw {
  width: 220px;
}
.f-sel {
  width: 140px;
}
.f-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
}

.mono {
  font-family: monospace;
  font-size: 12px;
}
.dim {
  color: var(--text-tertiary);
}
.lv-tag {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  border: 1px solid transparent;
  border-radius: 4px;
}
.st-tag {
  font-size: 12px;
  &.st-new {
    color: var(--pulse-alarm);
    &::before { content: "● "; font-size: 9px; }
  }
  &.st-ok { color: var(--pulse-online); }
  &.st-info { color: var(--text-tertiary); }
}
.dlg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}
</style>
