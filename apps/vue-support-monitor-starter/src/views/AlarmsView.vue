<script setup lang="ts">
/**
 * 告警中心 —— 对齐 prototype §PAGE-ALARM（ReSectionHead + ReCard + ReTag + ReButton(square)）
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchAlarmEvents, handleAlarmEvent, alarmLevel, isUnhandled, type AlarmEvent } from "../monitorApi";

const loading = ref(false);
const loadError = ref("");
const events = ref<AlarmEvent[]>([]);
const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };
const filterLevel = ref("");
const filterStatus = ref("");
const keyword = ref("");

const levelCounts = computed(() => {
  const m: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) m[alarmLevel(e)]++;
  return m;
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
    list = list.filter(e => (e.msMonitorAlarmEventMonitorName || "").toLowerCase().includes(k) || (e.msMonitorAlarmEventMetricName || "").toLowerCase().includes(k));
  }
  return [...list].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""));
});

function statusLabel(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "未处理";
  if (s === "FALSE" || s === "FALSE_ALARM") return "误报";
  if (s === "PROCESSED") return "已处理";
  return s || "—";
}
function statusType(e: AlarmEvent): string {
  const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
  if (s === "NEW") return "danger";
  if (s === "PROCESSED") return "success";
  return "info";
}

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try { events.value = (await fetchAlarmEvents()) ?? []; }
  catch (e) { loadError.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}

// 处理弹窗
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
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
  finally { handleSubmitting.value = false; }
}

onMounted(fetchAll);
</script>

<template>
  <div class="page-wrap al">
    <ReSectionHead description="事件流 · 按级别响应">
      <template #title>告警中心</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- 级别 KPI 行 -->
    <section class="kpi-grid">
      <ReCard v-for="lv in LEVELS" :key="lv" :radius="10" shadow="never" :padding="16" :body-style="{ borderLeft: `3px solid var(--sev-${lv.toLowerCase()}-fg, var(--text-secondary))` }">
        <div class="kpi-label">{{ lv }} {{ LEVEL_LABELS[lv] }}</div>
        <div class="kpi-value">{{ levelCounts[lv] }}</div>
      </ReCard>
    </section>

    <!-- 事件流 -->
    <ReCard :radius="12" shadow="never">
      <template #header>
        <div class="filter-bar">
          <ReInput v-model="keyword" placeholder="搜索主机 / 指标" clearable size="small" class="f-kw" />
          <ReSelect v-model="filterLevel" placeholder="级别" clearable size="small" class="f-sel">
            <el-option v-for="lv in LEVELS" :key="lv" :label="lv + ' ' + LEVEL_LABELS[lv]" :value="lv" />
          </ReSelect>
          <ReSelect v-model="filterStatus" placeholder="状态" clearable size="small" class="f-sel">
            <el-option label="未处理" value="NEW" />
            <el-option label="已处理" value="PROCESSED" />
            <el-option label="误报" value="FALSE" />
          </ReSelect>
          <span class="f-count">{{ filtered.length }} 条</span>
        </div>
      </template>
      <el-table :data="filtered" v-loading="loading" size="small" empty-text="暂无告警事件" border>
        <el-table-column label="时间" width="150"><template #default="{ row }"><span class="mono">{{ (row.msMonitorAlarmEventTriggerTime || "").slice(0, 16) }}</span></template></el-table-column>
        <el-table-column label="级别" width="70"><template #default="{ row }"><ReTag :type="(alarmLevel(row)==='P0'||alarmLevel(row)==='P1')?'danger':alarmLevel(row)==='P2'?'warning':'success'" effect="dark" size="small">{{ alarmLevel(row) }}</ReTag></template></el-table-column>
        <el-table-column prop="msMonitorAlarmEventMonitorName" label="主机" min-width="120" show-overflow-tooltip />
        <el-table-column prop="msMonitorAlarmEventMetricName" label="指标" min-width="120" show-overflow-tooltip />
        <el-table-column label="当前值 / 阈值" width="110"><template #default="{ row }"><span class="mono">{{ row.msMonitorAlarmEventAlarmValue }} <span class="dim">/ {{ row.msMonitorAlarmEventThreshold }}</span></span></template></el-table-column>
        <el-table-column label="状态" width="80"><template #default="{ row }"><ReTag :type="statusType(row)">{{ statusLabel(row) }}</ReTag></template></el-table-column>
        <el-table-column label="操作" width="60" fixed="right"><template #default="{ row }">
          <ReButton v-if="isUnhandled(row)" icon="Check" layout="square" size="small" type="primary" @click="openHandle(row)" title="处理" />
          <span v-else class="dim">—</span>
        </template></el-table-column>
      </el-table>
    </ReCard>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleVisible" title="处理告警事件" width="440px">
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
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { max-width: 1440px; padding: 24px; }
.as-error { display: flex; align-items: center; gap: 12px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #9b1c2e; background: #fdecef; border: 1px solid #fbc0c9; border-radius: 8px; }
.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
.kpi-label { font-size: 12px; color: var(--text-secondary); }
.kpi-value { margin-top: 2px; font-size: 26px; font-weight: 700; }
.filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 0; }
.f-kw { width: 200px; }
.f-sel { width: 120px; }
.f-count { margin-left: auto; font-size: 12px; color: var(--text-tertiary); }
.mono { font-family: monospace; font-size: 12px; }
.dim { color: var(--text-tertiary); }
.dlg-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; }
</style>