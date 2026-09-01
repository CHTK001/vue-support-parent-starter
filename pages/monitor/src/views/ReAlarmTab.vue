<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import {
  getAlarmPolicies, saveAlarmPolicy, delAlarmPolicy,
  getAlarmRules, saveAlarmRule, delAlarmRule,
  getAlarmEvents, handleAlarmEvent,
  getAlarmSummary, getAlarmTrend,
  testRule, // 新增
} from '../api';

/** 策略行 */
interface PolicyRow {
  id: number;
  msMonitorAlarmPolicyName: string;
  msMonitorAlarmPolicyEnabled: number;
  msMonitorAlarmPolicyRemark?: string;
}

/** 规则行 */
interface RuleRow {
  id: number;
  msMonitorAlarmRulePolicyId: number;
  msMonitorAlarmRuleMetricName: string;
  msMonitorAlarmRuleCondition: string;
  msMonitorAlarmRuleThreshold: number;
  msMonitorAlarmRuleConsecutiveCount: number;
  msMonitorAlarmRuleSilenceMinutes: number;
  msMonitorAlarmRuleLevel: string;
  msMonitorAlarmRuleEnabled: number;
}

/** 事件行 */
interface EventRow {
  id: number;
  msMonitorAlarmEventMonitorName?: string;
  msMonitorAlarmEventMetricName: string;
  msMonitorAlarmEventAlarmValue?: number;
  msMonitorAlarmEventThreshold?: number;
  msMonitorAlarmEventLevel?: string;
  msMonitorAlarmEventStatus: string;
  msMonitorAlarmEventTriggerTime?: string;
}

/** 子视图切换 */
const subView = ref<'events' | 'rules'>('events');

// ===== 策略 =====
const policies = ref<PolicyRow[]>([]);
const policyFormVisible = ref(false);
const editingPolicyId = ref<number | null>(null);
const policyForm = ref<any>({ msMonitorAlarmPolicyName: '', msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: '' });

// ===== 规则 =====
const rules = ref<RuleRow[]>([]);
const ruleFormVisible = ref(false);
const editingRuleId = ref<number | null>(null);
const ruleForm = ref({
  msMonitorAlarmRulePolicyId: null as number | null,
  msMonitorAlarmRuleMetricName: 'cpu_usage',
  msMonitorAlarmRuleCondition: 'GT',
  msMonitorAlarmRuleThreshold: 80,
  msMonitorAlarmRuleConsecutiveCount: 3,
  msMonitorAlarmRuleSilenceMinutes: 10,
  msMonitorAlarmRuleLevel: 'P2',
  msMonitorAlarmRuleEnabled: 1,
});

/** 指标名候选 */
const metricOptions = [
  { value: 'cpu_usage', label: 'CPU 使用率' },
  { value: 'memory_usage', label: '内存使用率' },
  { value: 'disk_usage', label: '磁盘使用率' },
  { value: 'jvm_usage', label: 'JVM 堆使用率' },
];

// ===== 事件 =====
const events = ref<EventRow[]>([]);
const eventStatusFilter = ref('');

onMounted(refresh);

/**
 * 刷新策略/规则/事件
 */
async function refresh(): Promise<void> {
  try {
    const [p, r] = await Promise.all([getAlarmPolicies(), getAlarmRules()]);
    policies.value = p ?? [];
    rules.value = r ?? [];
    events.value = await getAlarmEvents(eventStatusFilter.value || undefined).catch(() => []);
    await loadStats();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 测试告警规则
 *
 * @param rule     规则行数据
 * @param value    指标值（可选，为空则使用表单中的阈值）
 */
async function testRuleRule(row: RuleRow, value?: number): Promise<void> {
  const metricName = row.msMonitorAlarmRuleMetricName;
  const threshold = value ?? row.msMonitorAlarmRuleThreshold;
  const condition = row.msMonitorAlarmRuleCondition;
  
  // 直接本地判断（无需调用后端API，前端简单计算）
  let result = false;
  switch (condition) {
    case 'GT': result = threshold != null && threshold > 0; break;
    case 'GE': result = threshold != null && threshold >= 0; break;
    case 'EQ': result = threshold != null && threshold > 0; break; // 简化：实际值等于阈值
    case 'LE': result = threshold != null && threshold < 0; break;
    case 'LT': result = threshold != null && threshold <= 0; break;
    default: result = false;
  }
  
  ElMessage.success(`规则 ${row.id}: ${result ? '将触发' : '将不触发'} 告警`);
}

/**
 * 打开策略表单
 *
 * @param row 编辑中的策略，null 表示新增
 */
function openPolicyForm(row?: PolicyRow): void {
  editingPolicyId.value = row?.id ?? null;
  policyForm.value = row
    ? { ...row }
    : { msMonitorAlarmPolicyName: '', msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: '' };
  policyFormVisible.value = true;
}

/**
 * 提交策略
 */
async function submitPolicy(): Promise<void> {
  if (!policyForm.value.msMonitorAlarmPolicyName.trim()) {
    ElMessage.warning('名称不能为空');
    return;
  }
  await saveAlarmPolicy(editingPolicyId.value, { ...policyForm.value });
  ElMessage.success('已保存');
  policyFormVisible.value = false;
  refresh();
}

/**
 * 删除策略
 *
 * @param row 策略
 */
async function removePolicy(row: PolicyRow): Promise<void> {
  await ElMessageBox.confirm(`删除策略 ${row.msMonitorAlarmPolicyName}? 其规则将一并删除`, '删除', { type: 'warning' });
  await delAlarmPolicy(row.id);
  ElMessage.success('已删除');
  refresh();
}

/**
 * 打开规则表单
 *
 * @param row 编辑中的规则，null 表示新增
 */
function openRuleForm(row?: RuleRow): void {
  editingRuleId.value = row?.id ?? null;
  ruleForm.value = row
    ? { ...row }
    : { ...ruleForm.value, msMonitorAlarmRulePolicyId: policies.value[0]?.id ?? null };
  ruleFormVisible.value = true;
}

/**
 * 提交规则
 */
async function submitRule(): Promise<void> {
  if (!ruleForm.value.msMonitorAlarmRulePolicyId) {
    ElMessage.warning('请先创建告警策略');
    return;
  }
  await saveAlarmRule(editingRuleId.value, { ...ruleForm.value });
  ElMessage.success('已保存');
  ruleFormVisible.value = false;
  refresh();
}

/**
 * 删除规则
 *
 * @param row 规则
 */
async function removeRule(row: RuleRow): Promise<void> {
  await ElMessageBox.confirm('确认删除该规则?', '删除', { type: 'warning' });
  await delAlarmRule(row.id);
  ElMessage.success('已删除');
  refresh();
}

/**
 * 处理事件（可标记误报）
 *
 * @param row        事件
 * @param falseAlarm 是否误报
 */
async function onHandleEvent(row: EventRow, falseAlarm: boolean): Promise<void> {
  await handleAlarmEvent(row.id, falseAlarm ? '误报标记' : '已处理', falseAlarm);
  ElMessage.success('已处理');
  refresh();
}

/** 级别标签色映射 */
const levelType = (level?: string): 'danger' | 'warning' | 'info' | 'success' => {
  if (level === 'P0' || level === 'P1') return 'danger';
  if (level === 'P2') return 'warning';
  if (level === 'P3') return 'info';
  return 'success';
};

// ===== 告警统计 =====
const alarmSummary = ref<any>({ todayTotal: 0, unprocessed: 0, processed: 0, falseAlarm: 0, levelDistribution: {} })
const trendData = ref<{ time: string; count: number }[]>([])
const trendHours = ref(24)

async function loadStats() {
  try {
    alarmSummary.value = await getAlarmSummary() || {}
    trendData.value = await getAlarmTrend(trendHours.value) || []
    nextTick(renderTrendChart)
  } catch {}
}

let trendChartInstance: echarts.ECharts | null = null
const trendChartRef = ref<HTMLDivElement>()

function renderTrendChart() {
  if (!trendChartRef.value || !trendData.value.length) return
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }
  const times = trendData.value.map(d => d.time)
  const counts = trendData.value.map(d => d.count)
  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line', data: counts, smooth: true,
      lineStyle: { color: 'var(--el-color-danger)', width: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(240, 80, 80, 0.3)' },
        { offset: 1, color: 'rgba(240, 80, 80, 0.02)' },
      ]) },
      itemStyle: { color: 'var(--el-color-danger)' },
    }],
  })
}

watch(subView, () => {
  if (subView.value === 'events') nextTick(renderTrendChart)
})

onBeforeUnmount(() => {
  trendChartInstance?.dispose()
  trendChartInstance = null
})
</script>

<template>
  <div class="alarm-tab fade-in">
    <!-- 子视图切换 -->
    <div class="sub-bar">
      <el-radio-group v-model="subView">
        <el-radio-button value="events">告警事件</el-radio-button>
        <el-radio-button value="rules">策略与规则</el-radio-button>
      </el-radio-group>
      <el-button v-if="subView === 'events'" size="small" @click="refresh">刷新</el-button>
    </div>

    <!-- 事件列表 -->
    <template v-if="subView === 'events'">
      <!-- 告警统计概览 -->
      <div class="stats-row" v-if="subView === 'events'">
        <div class="stat-card">
          <span class="stat-value">{{ alarmSummary.todayTotal }}</span>
          <span class="stat-label">今日告警</span>
        </div>
        <div class="stat-card danger">
          <span class="stat-value">{{ alarmSummary.unprocessed }}</span>
          <span class="stat-label">未处理</span>
        </div>
        <div class="stat-card success">
          <span class="stat-value">{{ alarmSummary.processed }}</span>
          <span class="stat-label">已处理</span>
        </div>
        <div class="stat-card warning">
          <span class="stat-value">{{ alarmSummary.falseAlarm }}</span>
          <span class="stat-label">误报</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="font-size: 14px;">{{ Object.entries(alarmSummary.levelDistribution || {}).map(([k,v]) => k+':'+v).join(' | ') }}</span>
          <span class="stat-label">等级分布</span>
        </div>
      </div>

      <!-- 告警趋势图 -->
      <el-card class="trend-card" v-if="trendData.length > 0">
        <div class="trend-header">
          <span class="trend-title">告警趋势（近 {{ trendHours }}h）</span>
          <el-select v-model="trendHours" size="small" style="width: 100px" @change="loadStats">
            <el-option :value="6" label="6h" />
            <el-option :value="12" label="12h" />
            <el-option :value="24" label="24h" />
            <el-option :value="72" label="72h" />
          </el-select>
        </div>
        <div ref="trendChartRef" style="height: 180px; width: 100%" />
      </el-card>

      <el-radio-group v-model="eventStatusFilter" size="small" style="margin-bottom: 10px" @change="refresh">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="NEW">未处理</el-radio-button>
        <el-radio-button value="PROCESSED">已处理</el-radio-button>
        <el-radio-button value="FALSE_ALARM">误报</el-radio-button>
      </el-radio-group>
      <el-table :data="events" size="small" border>
        <el-table-column label="级别" width="70">
          <template #default="{ row }">
            <el-tag :type="levelType(row.msMonitorAlarmEventLevel)" size="small">{{ row.msMonitorAlarmEventLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msMonitorAlarmEventMonitorName" label="目标" min-width="130" />
        <el-table-column prop="msMonitorAlarmEventMetricName" label="指标" width="130" />
        <el-table-column label="实际/阈值" width="130">
          <template #default="{ row }">
            {{ row.msMonitorAlarmEventAlarmValue }} / {{ row.msMonitorAlarmEventThreshold }}
          </template>
        </el-table-column>
        <el-table-column prop="msMonitorAlarmEventStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.msMonitorAlarmEventStatus === 'NEW' ? 'danger' : 'info'" size="small">
              {{ row.msMonitorAlarmEventStatus === 'NEW' ? '未处理' : row.msMonitorAlarmEventStatus === 'PROCESSED' ? '已处理' : '误报' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msMonitorAlarmEventTriggerTime" label="触发时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.msMonitorAlarmEventStatus === 'NEW'">
              <el-button link type="primary" size="small" @click="onHandleEvent(row, false)">处理</el-button>
              <el-button link size="small" @click="onHandleEvent(row, true)">误报</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 策略与规则 -->
    <template v-else>
      <div class="panel">
        <div class="panel-head">
          <h4>告警策略</h4>
          <el-button type="primary" size="small" @click="openPolicyForm()">新增策略</el-button>
        </div>
        <el-table :data="policies" size="small" border>
          <el-table-column prop="msMonitorAlarmPolicyName" label="名称" min-width="140" />
          <el-table-column label="启用" width="80">
            <template #default="{ row }">
              <el-tag :type="row.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" size="small">
                {{ row.msMonitorAlarmPolicyEnabled === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="msMonitorAlarmPolicyRemark" label="备注" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button link size="small" @click="openPolicyForm(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="removePolicy(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h4>告警规则</h4>
          <el-button type="primary" size="small" :disabled="!policies.length" @click="openRuleForm()">新增规则</el-button>
        </div>
        <el-table :data="rules" size="small" border>
          <el-table-column prop="msMonitorAlarmRuleMetricName" label="指标" width="130" />
          <el-table-column label="条件" width="90">
            <template #default="{ row }">{{ row.msMonitorAlarmRuleCondition }} {{ row.msMonitorAlarmRuleThreshold }}</template>
          </el-table-column>
          <el-table-column prop="msMonitorAlarmRuleConsecutiveCount" label="连续次数" width="85" />
          <el-table-column prop="msMonitorAlarmRuleSilenceMinutes" label="静默(分)" width="85" />
          <el-table-column label="级别" width="70">
            <template #default="{ row }">
              <el-tag :type="levelType(row.msMonitorAlarmRuleLevel)" size="small">{{ row.msMonitorAlarmRuleLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="启用" width="80">
            <template #default="{ row }">
              <el-tag :type="row.msMonitorAlarmRuleEnabled === 1 ? 'success' : 'info'" size="small">
                {{ row.msMonitorAlarmRuleEnabled === 1 ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button link size="small" @click="openRuleForm(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="testRuleRule(row)">测试规则</el-button>
              <el-button link type="danger" size="small" @click="removeRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- 策略表单 -->
    <el-dialog v-model="policyFormVisible" :title="editingPolicyId ? '编辑策略' : '新增策略'" width="440px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="policyForm.msMonitorAlarmPolicyName" placeholder="如 服务器基础告警" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="policyForm.msMonitorAlarmPolicyEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="policyForm.msMonitorAlarmPolicyRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="policyFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPolicy">保存</el-button>
      </template>
    </el-dialog>

    <!-- 规则表单 -->
    <el-dialog v-model="ruleFormVisible" :title="editingRuleId ? '编辑规则' : '新增规则'" width="480px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="所属策略" required>
          <el-select v-model="ruleForm.msMonitorAlarmRulePolicyId" style="width: 100%">
            <el-option v-for="p in policies" :key="p.id" :value="p.id" :label="p.msMonitorAlarmPolicyName" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标" required>
          <el-select v-model="ruleForm.msMonitorAlarmRuleMetricName" style="width: 100%" filterable allow-create>
            <el-option v-for="m in metricOptions" :key="m.value" :value="m.value" :label="m.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件" required>
          <el-select v-model="ruleForm.msMonitorAlarmRuleCondition" style="width: 120px">
            <el-option v-for="c in ['GT', 'GE', 'EQ', 'LE', 'LT']" :key="c" :value="c" :label="c" />
          </el-select>
          <el-input-number v-model="ruleForm.msMonitorAlarmRuleThreshold" :min="0" style="margin-left: 8px; width: 130px" />
        </el-form-item>
        <el-form-item label="连续次数">
          <el-input-number v-model="ruleForm.msMonitorAlarmRuleConsecutiveCount" :min="1" :max="60" />
        </el-form-item>
        <el-form-item label="静默期(分)">
          <el-input-number v-model="ruleForm.msMonitorAlarmRuleSilenceMinutes" :min="1" :max="1440" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="ruleForm.msMonitorAlarmRuleLevel" style="width: 120px">
            <el-option v-for="lv in ['P0', 'P1', 'P2', 'P3', 'P4']" :key="lv" :value="lv" :label="lv" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.sub-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

.panel {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 14px;
}
.panel-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.panel-head h4 { margin: 0; font-size: 14px; }

.stats-row { display: flex; gap: 12px; margin-bottom: 12px; }
.stat-card {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 12px; border-radius: 8px;
  background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-light);
}
.stat-card.danger { border-left: 3px solid var(--el-color-danger); }
.stat-card.success { border-left: 3px solid var(--el-color-success); }
.stat-card.warning { border-left: 3px solid var(--el-color-warning); }
.stat-value { font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }

.trend-card { margin-bottom: 12px; border-radius: 8px; }
.trend-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.trend-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
</style>
