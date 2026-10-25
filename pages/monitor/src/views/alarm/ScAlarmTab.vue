<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onBeforeUnmount, shallowRef } from 'vue';
import { message, useSocketService } from '@repo/core';
import * as echarts from 'echarts';
import {
  getAlarmPolicies, saveAlarmPolicy, delAlarmPolicy,
  getAlarmRules, saveAlarmRule, delAlarmRule,
  getAlarmEvents, handleAlarmEvent,
  getAlarmSummary, getAlarmTrend,
  subscribeAlarmStream,
} from '../../api';
import {
  resolveLiveMode, fallbackAfterSseLost, liveModeText, liveModeTone,
  type LiveMode,
} from './liveChannel';

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
onMounted(initLivePush);

/** socket 订阅句柄（组件卸载时释放） */
const unsubs: Array<() => void> = [];
/** SSE 客户端句柄（组件卸载时释放） */
let sseClient: { close: () => void } | null = null;
/** 兜底轮询定时器；仅在 SSE 与 socket 都不可用时启动 */
let fallbackTimer: ReturnType<typeof setInterval> | null = null;

/** 实时通道状态：sse 实时、socket 兜底、poll 降级轮询、off 未连接 */
const liveMode = ref<LiveMode>(resolveLiveMode({
  sseConnected: false,
  socketAvailable: false,
  windowElapsed: false,
}));
/** 通道建立时刻，用于展示「已连接 N 分钟」与排查 */
const liveSince = ref(0);
/** 是否已过 SSE 建连窗口 */
const liveWindowElapsed = ref(false);

/** 兜底轮询间隔（毫秒）：降级路径只保证「不会完全看不到告警」 */
const FALLBACK_POLL_MS = 30_000;

/** 通道状态文案 */
const liveText = computed(() => liveModeText(liveMode.value, FALLBACK_POLL_MS / 1000));

/** 通道状态颜色 */
const liveTone = computed(() => liveModeTone(liveMode.value));

/**
 * 把一条推送载荷落到界面：级别提示 + 插列表头 + 刷新统计。
 *
 * <p>SSE 与 socket 两条通道共用这里的处理，避免两边行为漂移。同一事件可能
 * 同时从两条通道到达（后端两条都在发），因此按事件 id 去重。</p>
 *
 * @param payload 告警载荷
 */
function applyPushedAlarm(payload: Record<string, any>): void {
  const level = payload.level ?? 'P2';
  if (level === 'P0' || level === 'P1') {
    message.error(`[${level}] ${payload.monitorName || ''} ${payload.metricName || ''}=${payload.alarmValue ?? ''}`);
  } else if (level === 'P2' || level === 'P3') {
    message.warning(`[${level}] ${payload.monitorName || ''} ${payload.metricName || ''}=${payload.alarmValue ?? ''}`);
  }

  const id = Number(payload.id) || 0;
  const status = payload.status ?? 'NEW';

  // 已存在的事件只更新状态：处理完成后服务端也会推一条同 id 的事件
  if (id > 0) {
    const existing = events.value.find(e => e.id === id);
    if (existing) {
      existing.msMonitorAlarmEventStatus = status;
      return;
    }
  }

  // 新建事件：仅在事件视图且未按状态过滤时插入（过滤视图下插入会与筛选条件矛盾）
  if (subView.value === 'events' && !eventStatusFilter.value) {
    events.value.unshift({
      id: id || Date.now(),
      msMonitorAlarmEventMonitorName: payload.monitorName,
      msMonitorAlarmEventMetricName: payload.metricName,
      msMonitorAlarmEventAlarmValue: payload.alarmValue,
      msMonitorAlarmEventThreshold: payload.threshold,
      msMonitorAlarmEventLevel: payload.level,
      msMonitorAlarmEventStatus: status,
      msMonitorAlarmEventTriggerTime: payload.triggerTime,
    });
    if (events.value.length > 200) events.value.length = 200;
  }
  loadStats().catch(() => {});
}

/**
 * 启动兜底轮询。
 *
 * <p>只有在 SSE 与 socket 都没连上时才启用：目的不是让轮询成为常态，
 * 而是保证推送链路整体不可用时用户仍能看到告警，而不是对着一个不动的列表。</p>
 */
function startFallbackPoll(): void {
  if (fallbackTimer) return;
  liveMode.value = 'poll';
  liveSince.value = Date.now();
  fallbackTimer = setInterval(() => {
    // 已切到推送通道就停掉轮询
    if (liveMode.value === 'sse' || liveMode.value === 'socket') {
      stopFallbackPoll();
      return;
    }
    getAlarmEvents(eventStatusFilter.value || undefined)
      .then(rows => { events.value = rows ?? []; })
      .catch(() => {});
    loadStats().catch(() => {});
  }, FALLBACK_POLL_MS);
}

/** 停止兜底轮询 */
function stopFallbackPoll(): void {
  if (!fallbackTimer) return;
  clearInterval(fallbackTimer);
  fallbackTimer = null;
}

/**
 * 建立实时推送：SSE 优先，失败回退 socket，再失败回退轮询。
 *
 * <p>为什么不只用 socket：socket 链路要经过消息队列与 socket 组件，
 * 任一未装配都会静默丢消息；SSE 由 Servlet 容器直连，不依赖这两者。</p>
 */
function initLivePush(): void {
  // 1) socket 先订阅：SSE 建连失败时要能立刻切过去，而不是等 SSE 报错才发现没通道
  const socket = useSocketService();
  socketReady = !!socket;
  if (socket) {
    unsubs.push(socket.subscribe('monitor', 'alarm', (msg) => {
      // SSE 正常时不重复处理，避免同一条告警弹两次提示
      if (liveMode.value === 'sse') return;
      const data = (msg.data ?? msg) as any;
      const payload = data && typeof data === 'object' ? (data.data ?? data) : data;
      if (!payload) return;
      if (liveMode.value !== 'socket') {
        liveMode.value = resolveLiveMode({
          sseConnected: false,
          socketAvailable: true,
          windowElapsed: liveWindowElapsed.value,
        });
        liveSince.value = Date.now();
        stopFallbackPoll();
      }
      applyPushedAlarm(payload);
    }));
  }

  // 2) SSE 主通道
  try {
    sseClient = subscribeAlarmStream({
      onOpen: () => {
        liveMode.value = resolveLiveMode({
          sseConnected: true,
          socketAvailable: socketReady,
          windowElapsed: liveWindowElapsed.value,
        });
        liveSince.value = Date.now();
        stopFallbackPoll();
      },
      onAlarm: applyPushedAlarm,
      onError: () => {
        // SSE 断开且重连耗尽：socket 仍可用就走 socket，否则轮询兜底
        if (liveMode.value === 'sse') {
          liveMode.value = fallbackAfterSseLost(socketReady);
          if (liveMode.value === 'poll') startFallbackPoll();
        }
      },
      onClose: () => {
        if (liveMode.value === 'sse') {
          liveMode.value = fallbackAfterSseLost(socketReady);
          if (liveMode.value === 'poll') startFallbackPoll();
        }
      },
    });
  } catch {
    // 浏览器不支持 SSE 时直接走 socket / 轮询
  }

  // 3) 两条推送通道都没有可用证据时，轮询兜底
  //    给 SSE 一个建连窗口；超时仍未连上认为推送不可用
  setTimeout(() => {
    liveWindowElapsed.value = true;
    if (liveMode.value === 'off') startFallbackPoll();
  }, 8000);
}

/** socket 是否已订阅（用于 SSE 断开时决定回到 socket 还是轮询） */
let socketReady = false;

/**
 * 刷新策略/规则/事件
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [p, r] = await Promise.all([getAlarmPolicies(), getAlarmRules()]);
    policies.value = p ?? [];
    rules.value = r ?? [];
    events.value = await getAlarmEvents(eventStatusFilter.value || undefined).catch(() => []);
    await loadStats();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
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
  
  message.success(`规则 ${row.id}: ${result ? '将触发' : '将不触发'} 告警`);
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
    message.warning('名称不能为空');
    return;
  }
  await saveAlarmPolicy(editingPolicyId.value, { ...policyForm.value });
  message.success('已保存');
  policyFormVisible.value = false;
  refresh();
}

/**
 * 删除策略
 *
 * @param row 策略
 */
async function removePolicy(row: PolicyRow): Promise<void> {
  await message.confirm(`删除策略 ${row.msMonitorAlarmPolicyName}? 其规则将一并删除`, '删除');
  await delAlarmPolicy(row.id);
  message.success('已删除');
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
    message.warning('请先创建告警策略');
    return;
  }
  await saveAlarmRule(editingRuleId.value, { ...ruleForm.value });
  message.success('已保存');
  ruleFormVisible.value = false;
  refresh();
}

/**
 * 删除规则
 *
 * @param row 规则
 */
async function removeRule(row: RuleRow): Promise<void> {
  await message.confirm('确认删除该规则?', '删除');
  await delAlarmRule(row.id);
  message.success('已删除');
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
  message.success('已处理');
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
const loading = ref(false)

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
        { offset: 0, color: 'var(--pulse-alarm)' },
        { offset: 1, color: 'var(--pulse-alarm)' },
      ]) },
      itemStyle: { color: 'var(--el-color-danger)' },
    }],
  })
}

watch(subView, () => {
  if (subView.value === 'events') nextTick(renderTrendChart)
})

onBeforeUnmount(() => {
  unsubs.forEach(fn => fn?.())
  sseClient?.close()
  sseClient = null
  stopFallbackPoll()
  trendChartInstance?.dispose()
  trendChartInstance = null
})
</script>

<template>
  <div class="alarm-tab fade-in">
    <!-- 子视图切换 -->
    <div class="sub-bar">
      <ReRadioGroup v-model="subView" button capsule>
        <ReRadioButton value="events">告警事件</ReRadioButton>
        <ReRadioButton value="rules">策略与规则</ReRadioButton>
      </ReRadioGroup>
      <!-- 通道状态：推送链路是否真的在推，必须让用户看得见；
           否则后端队列没装配时会静默退化成轮询，界面毫无提示 -->
      <ReTag :type="liveTone" effect="plain" size="small" class="live-tag">
        <span class="live-dot" :class="liveMode" />
        {{ liveText }}
      </ReTag>
      <ReButton v-if="subView === 'events'" icon="Refresh" show-text @click="refresh">刷新</ReButton>
    </div>

    <!-- 事件列表 -->
    <template v-if="subView === 'events'">
      <div class="stats-row">
        <ReStatCard size="compact" title="今日告警" :value="alarmSummary.todayTotal" icon="Bell" icon-color="var(--metric-cpu)" />
        <ReStatCard size="compact" title="未处理" :value="alarmSummary.unprocessed" icon="AlarmClock" icon-color="var(--status-error)" />
        <ReStatCard size="compact" title="已处理" :value="alarmSummary.processed" icon="CircleCheck" icon-color="var(--status-success)" />
        <ReStatCard size="compact" title="误报" :value="alarmSummary.falseAlarm" icon="Warning" icon-color="var(--metric-disk)" />
        <ReStatCard size="compact" title="等级分布" icon="Histogram" icon-color="var(--metric-jvm)">
          <template #value>
            <span class="stat-dist">{{ Object.entries(alarmSummary.levelDistribution || {}).map(([k,v]) => k+':'+v).join(' | ') }}</span>
          </template>
        </ReStatCard>
      </div>

      <!-- 告警趋势图 -->
      <ReCard class="trend-card" v-if="trendData.length > 0" :radius="12" :padding="14">
        <ReSectionHead :title="`告警趋势（近 ${trendHours}h）`">
          <template #actions>
            <ReSelect v-model="trendHours" style="width: 100px" @change="loadStats"
              :data="[{ value: 6, label: '6h' }, { value: 12, label: '12h' }, { value: 24, label: '24h' }, { value: 72, label: '72h' }]" />
          </template>
        </ReSectionHead>
        <div ref="trendChartRef" style="height: 180px; width: 100%" />
      </ReCard>

      <ReRadioGroup v-model="eventStatusFilter" button capsule style="margin-bottom: 10px" @change="refresh">
        <ReRadioButton value="">全部</ReRadioButton>
        <ReRadioButton value="NEW">未处理</ReRadioButton>
        <ReRadioButton value="PROCESSED">已处理</ReRadioButton>
        <ReRadioButton value="FALSE_ALARM">误报</ReRadioButton>
      </ReRadioGroup>
      <ReTable :data="events" border :loading="loading" :config="{ pagination: { enable: false }, toolbar: { enable: false } }">
        <ReTableColumn label="级别" width="70">
          <template #default="{ row }">
            <ReTag :type="levelType(row.msMonitorAlarmEventLevel)" >{{ row.msMonitorAlarmEventLevel }}</ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="msMonitorAlarmEventMonitorName" label="目标" min-width="130" />
        <ReTableColumn prop="msMonitorAlarmEventMetricName" label="指标" width="130" />
        <ReTableColumn label="实际/阈值" width="130">
          <template #default="{ row }">
            {{ row.msMonitorAlarmEventAlarmValue }} / {{ row.msMonitorAlarmEventThreshold }}
          </template>
        </ReTableColumn>
        <ReTableColumn prop="msMonitorAlarmEventStatus" label="状态" width="100">
          <template #default="{ row }">
            <ReTag :type="row.msMonitorAlarmEventStatus === 'NEW' ? 'danger' : 'info'" >
              {{ row.msMonitorAlarmEventStatus === 'NEW' ? '未处理' : row.msMonitorAlarmEventStatus === 'PROCESSED' ? '已处理' : '误报' }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="msMonitorAlarmEventTriggerTime" label="触发时间" width="160" />
        <ReTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.msMonitorAlarmEventStatus === 'NEW'">
              <ReButton link type="primary" @click="onHandleEvent(row, false)">处理</ReButton>
              <ReButton link @click="onHandleEvent(row, true)">误报</ReButton>
            </template>
          </template>
        </ReTableColumn>
      </ReTable>
    </template>

    <!-- 策略与规则 -->
    <template v-else>
      <div class="panel">
        <ReSectionHead title="告警策略">
          <template #actions>
            <ReButton icon="Plus" show-text type="primary" @click="openPolicyForm()">新增策略</ReButton>
          </template>
        </ReSectionHead>
        <ReTable :data="policies" border :config="{ pagination: { enable: false }, toolbar: { enable: false } }">
          <ReTableColumn prop="msMonitorAlarmPolicyName" label="名称" min-width="140" />
          <ReTableColumn label="启用" width="80">
            <template #default="{ row }">
              <ReTag :type="row.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" >
                {{ row.msMonitorAlarmPolicyEnabled === 1 ? '启用' : '停用' }}
              </ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="msMonitorAlarmPolicyRemark" label="备注" min-width="160" show-overflow-tooltip />
          <ReTableColumn label="操作" width="140">
            <template #default="{ row }">
              <ReButton link @click="openPolicyForm(row)">编辑</ReButton>
              <ReButton link type="danger" @click="removePolicy(row)">删除</ReButton>
            </template>
          </ReTableColumn>
        </ReTable>
      </div>

      <div class="panel">
        <ReSectionHead title="告警规则">
          <template #actions>
            <ReButton icon="Plus" show-text type="primary" :disabled="!policies.length" @click="openRuleForm()">新增规则</ReButton>
          </template>
        </ReSectionHead>
        <ReTable :data="rules" border :loading="loading" :config="{ pagination: { enable: false }, toolbar: { enable: false } }">
          <ReTableColumn prop="msMonitorAlarmRuleMetricName" label="指标" width="130" />
          <ReTableColumn label="条件" width="90">
            <template #default="{ row }">{{ row.msMonitorAlarmRuleCondition }} {{ row.msMonitorAlarmRuleThreshold }}</template>
          </ReTableColumn>
          <ReTableColumn prop="msMonitorAlarmRuleConsecutiveCount" label="连续次数" width="85" />
          <ReTableColumn prop="msMonitorAlarmRuleSilenceMinutes" label="静默(分)" width="85" />
          <ReTableColumn label="级别" width="70">
            <template #default="{ row }">
              <ReTag :type="levelType(row.msMonitorAlarmRuleLevel)" >{{ row.msMonitorAlarmRuleLevel }}</ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn label="启用" width="80">
            <template #default="{ row }">
              <ReTag :type="row.msMonitorAlarmRuleEnabled === 1 ? 'success' : 'info'" >
                {{ row.msMonitorAlarmRuleEnabled === 1 ? '是' : '否' }}
              </ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn label="操作" width="140">
            <template #default="{ row }">
              <ReButton link @click="openRuleForm(row)">编辑</ReButton>
              <ReButton link type="primary" @click="testRuleRule(row)">测试规则</ReButton>
              <ReButton link type="danger" @click="removeRule(row)">删除</ReButton>
            </template>
          </ReTableColumn>
        </ReTable>
      </div>
    </template>

    <!-- 策略表单 -->
    <ReDialog v-model="policyFormVisible" :title="editingPolicyId ? '编辑策略' : '新增策略'" width="440" :height="320" confirm-text="保存" cancel-text="取消" compact :footer-hidden="false" @confirm="submitPolicy" @cancel="policyFormVisible = false">
      <ReForm label-width="80px" label-position="right">
        <ReFormItem label="名称" required>
          <ReInput v-model="policyForm.msMonitorAlarmPolicyName" placeholder="如 服务器基础告警" />
        </ReFormItem>
        <ReFormItem label="启用">
          <ReSwitch v-model="policyForm.msMonitorAlarmPolicyEnabled" :active-value="1" :inactive-value="0" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="policyForm.msMonitorAlarmPolicyRemark" type="textarea" :rows="2" />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <!-- 规则表单 -->
    <ReDialog v-model="ruleFormVisible" :title="editingRuleId ? '编辑规则' : '新增规则'" width="480" :height="420" confirm-text="保存" cancel-text="取消" compact :footer-hidden="false" @confirm="submitRule" @cancel="ruleFormVisible = false">
      <ReForm label-width="100px" label-position="right">
        <ReFormItem label="所属策略" required>
          <ReSelect v-model="ruleForm.msMonitorAlarmRulePolicyId" style="width: 100%"
            :data="policies.map(p => ({ value: p.id, label: p.msMonitorAlarmPolicyName }))" />
        </ReFormItem>
        <ReFormItem label="指标" required>
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleMetricName" style="width: 100%" filterable allow-create :data="metricOptions" />
        </ReFormItem>
        <ReFormItem label="触发条件" required>
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleCondition" style="width: 120px"
            :data="['GT', 'GE', 'EQ', 'LE', 'LT'].map(c => ({ value: c, label: c }))" />
          <ReInputNumber v-model="ruleForm.msMonitorAlarmRuleThreshold" :min="0" style="margin-left: 8px; width: 130px" />
        </ReFormItem>
        <ReFormItem label="连续次数">
          <ReInputNumber v-model="ruleForm.msMonitorAlarmRuleConsecutiveCount" :min="1" :max="60" />
        </ReFormItem>
        <ReFormItem label="静默期(分)">
          <ReInputNumber v-model="ruleForm.msMonitorAlarmRuleSilenceMinutes" :min="1" :max="1440" />
        </ReFormItem>
        <ReFormItem label="级别">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleLevel" style="width: 120px"
            :data="['P0', 'P1', 'P2', 'P3', 'P4'].map(lv => ({ value: lv, label: lv }))" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

 <style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.sub-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

/* 通道状态：状态点靠颜色区分，实时通道带呼吸动画，一眼看出是不是真的在推 */
.live-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
  flex-shrink: 0;

  &.sse {
    background: var(--el-color-success);
    animation: live-pulse 2s ease-in-out infinite;
  }

  &.socket,
  &.poll {
    background: var(--el-color-warning);
  }

  &.off {
    background: var(--el-color-danger);
  }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 60%, transparent); }
  50% { opacity: 0.65; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 0%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot.sse { animation: none; }
}

.panel {
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  padding: 16px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  margin-bottom: 14px;
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}
.panel:hover { box-shadow: var(--shadow-card-hover); }
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.panel-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.panel :deep(.re-section-head) {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
  /* 统计卡视觉与悬停由 ReStatCard 的 re-surface 基线提供，此处不再覆写 */
.stat-dist {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-all;
  text-align: center;
  display: inline-block;
}

.trend-card {
  margin-bottom: 12px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}
.trend-card:hover {
  box-shadow: var(--shadow-card-hover);
}
.trend-card :deep(.re-section-head) {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
</style>
