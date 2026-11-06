<script setup lang="ts">
/**
 * 主机告警策略 —— 以主机为单位的告警策略 / 规则 / 维护窗口管理
 *
 * <p>从独立菜单「告警策略」合并到主机右键菜单，作为工作区页签打开。
 * 策略与规则全局共享，但规则按主机过滤：只显示绑定到当前主机监控项的规则，
 * 新建规则时预选当前主机监控项。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import { http, unwrapResult } from "@repo/utils";

const props = defineProps<{
  /** 当前上下文主机 id */
  hostId: number;
  /** 当前上下文主机名 */
  hostName: string;
  /** 主机平台标识（未使用，仅兼容统一传参） */
  platform?: string;
}>();

/* ==================== 类型 ==================== */

interface AlarmPolicy {
  id: number;
  msMonitorAlarmPolicyName: string;
  msMonitorAlarmPolicyEnabled: number;
  msMonitorAlarmPolicyRemark: string;
  /** 归属主机 id（空 = 全局策略） */
  msServerHostId?: number | null;
  /** 更新时置为全局策略（后端只读入参） */
  globalScope?: boolean;
}
interface AlarmRule {
  id: number;
  msMonitorAlarmRulePolicyId: number;
  msMonitorAlarmRuleMonitorId: number | null;
  msMonitorAlarmRuleMetricName: string;
  msMonitorAlarmRuleCondition: string;
  msMonitorAlarmRuleThreshold: number;
  msMonitorAlarmRuleConsecutiveCount: number;
  msMonitorAlarmRuleSilenceMinutes: number;
  msMonitorAlarmRuleLevel: string;
  msMonitorAlarmRuleEnabled: number;
}
interface AlarmWindow {
  id: number;
  windowName: string;
  msMonitorAlarmMaintenanceWindowLevel: string;
  startTime: string;
  endTime: string;
  weekdays: string;
  msMonitorAlarmMaintenanceWindowEnabled: number;
  remark: string;
}
interface MonitorItem {
  id: number;
  monitorName: string;
  monitorHost: string;
  monitorPort: number;
  serviceType: string;
  serverType: string;
  monitorEnabled: number;
}

/* ==================== 状态 ==================== */

const tab = ref<"policy" | "rule" | "window">("policy");
const policies = ref<AlarmPolicy[]>([]);
const rules = ref<AlarmRule[]>([]);
const windows = ref<AlarmWindow[]>([]);
const monitors = ref<MonitorItem[]>([]);
const loading = ref(false);

const CONDITIONS = [
  { value: "GT", label: ">" },
  { value: "GE", label: "≥" },
  { value: "EQ", label: "=" },
  { value: "LE", label: "≤" },
  { value: "LT", label: "<" },
];
const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const METRICS = ["cpu_usage", "memory_usage", "disk_usage", "network_rx", "network_tx", "jvm_heap"];

/* ==================== API ==================== */

const API = "/ms/monitor";

async function fetchAll(): Promise<void> {
  loading.value = true;
  try {
    const [p, r, m, w] = await Promise.all([
      // 不带 hostId：一次取全量，前端按「本主机 / 全局」分组展示 ——
      // 主机面板既要能改自己的策略，也要能看见生效于本机的全局策略。
      http().get(`${API}/alarm/policy`).then(r => unwrapResult<AlarmPolicy[]>(r)),
      http().get(`${API}/alarm/rule`).then(r => unwrapResult<AlarmRule[]>(r)),
      http().get(`${API}`).then(r => unwrapResult<MonitorItem[]>(r)),
      http().get(`${API}/alarm/window`).then(r => unwrapResult<AlarmWindow[]>(r)),
    ]);
    policies.value = p ?? [];
    rules.value = r ?? [];
    monitors.value = (m ?? []).filter(x => x.monitorEnabled === 1);
    windows.value = w ?? [];
  } catch (e: any) {
    message.error(`加载失败：${e?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

/** 本主机专属策略（msServerHostId === 当前主机） */
const hostPolicies = computed(() =>
  policies.value.filter(p => Number(p.msServerHostId ?? 0) === Number(props.hostId)),
);

/** 全局策略（msServerHostId 为空，对所有主机生效） */
const globalPolicies = computed(() =>
  policies.value.filter(p => p.msServerHostId == null || Number(p.msServerHostId) === 0),
);

/** 当前主机匹配的监控项 */
const hostMonitor = computed(() =>
  monitors.value.find(m =>
    m.monitorHost === props.hostName ||
    m.monitorHost.includes(props.hostName),
  ),
);

/** 按主机过滤的规则：只显示属于「本机策略」或「全局策略」的规则 + 未指定监控项的全局规则 */
const hostRules = computed(() => {
  const scopeIds = new Set([...hostPolicies.value, ...globalPolicies.value].map(p => p.id));
  const hm = hostMonitor.value;
  return rules.value.filter(r => {
    if (!scopeIds.has(r.msMonitorAlarmRulePolicyId)) return false;
    if (!hm) return true;
    return r.msMonitorAlarmRuleMonitorId === hm.id || r.msMonitorAlarmRuleMonitorId === null;
  });
});

/** 新建 / 编辑规则时可选的策略：本机策略在前，全局策略在后 */
const selectablePolicies = computed(() => [...hostPolicies.value, ...globalPolicies.value]);

function policyName(pid: number): string {
  return policies.value.find(p => p.id === pid)?.msMonitorAlarmPolicyName ?? `策略#${pid}`;
}
function condText(c: string): string {
  return CONDITIONS.find(x => x.value === c)?.label ?? c;
}
function ruleMonitorName(mid: number | null): string {
  if (mid == null) return "全部目标";
  return monitors.value.find(m => m.id === mid)?.monitorName ?? `目标#${mid}`;
}
function policyStatus(enabled: number): string {
  return enabled === 1 ? "运行中" : "已停用";
}

/* ==================== 策略弹窗 ==================== */

const policyVisible = ref(false);
const policySaving = ref(false);
const policyForm = ref<Partial<AlarmPolicy>>({
  msMonitorAlarmPolicyName: "", msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: "",
  msServerHostId: props.hostId,
});
/** 编辑时是否勾选「全局策略」（作用于所有主机） */
const policyGlobal = ref(false);

function openPolicyAdd(): void {
  policyForm.value = {
    msMonitorAlarmPolicyName: "",
    msMonitorAlarmPolicyEnabled: 1,
    msMonitorAlarmPolicyRemark: "",
    msServerHostId: props.hostId,
  };
  policyGlobal.value = false;
  policyVisible.value = true;
}
function openPolicyEdit(p: AlarmPolicy): void {
  policyForm.value = { ...p };
  policyGlobal.value = p.msServerHostId == null || Number(p.msServerHostId) === 0;
  policyVisible.value = true;
}
async function submitPolicy(): Promise<void> {
  if (!policyForm.value.msMonitorAlarmPolicyName?.trim()) {
    message.warning("请输入策略名称");
    return;
  }
  policySaving.value = true;
  try {
    // 归属主机由面板决定：不勾全局就归本机，勾了就把归属清空（globalScope 是后端认可的清空开关）
    const payload: Record<string, unknown> = {
      ...policyForm.value,
      msServerHostId: policyGlobal.value ? null : props.hostId,
      globalScope: policyGlobal.value,
    };
    await http().post(`${API}/alarm/policy`).data(payload).then(r => unwrapResult(r));
    message.success("保存成功");
    policyVisible.value = false;
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  } finally {
    policySaving.value = false;
  }
}
async function removePolicy(p: AlarmPolicy): Promise<void> {
  await ElMessageBox.confirm(`删除策略「${p.msMonitorAlarmPolicyName}」将级联删除其所有规则，确认？`, "删除确认", { type: "warning" });
  try {
    await http().delete(`${API}/alarm/policy/${p.id}`).then(r => unwrapResult(r));
    message.success("已删除");
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  }
}

/* ==================== 规则弹窗 ==================== */

const ruleVisible = ref(false);
const ruleSaving = ref(false);
const ruleTesting = ref(false);
const ruleForm = ref<Partial<AlarmRule>>({
  msMonitorAlarmRulePolicyId: undefined as unknown as number,
  msMonitorAlarmRuleMonitorId: null,
  msMonitorAlarmRuleMetricName: "cpu_usage",
  msMonitorAlarmRuleCondition: "GT",
  msMonitorAlarmRuleThreshold: 80,
  msMonitorAlarmRuleConsecutiveCount: 3,
  msMonitorAlarmRuleSilenceMinutes: 10,
  msMonitorAlarmRuleLevel: "P2",
  msMonitorAlarmRuleEnabled: 1,
});

function openRuleAdd(policyId?: number): void {
  ruleForm.value = {
    msMonitorAlarmRulePolicyId: policyId ?? hostPolicies.value[0]?.id ?? globalPolicies.value[0]?.id ?? 0,
    // 预选当前主机监控项
    msMonitorAlarmRuleMonitorId: hostMonitor.value?.id ?? null,
    msMonitorAlarmRuleMetricName: "cpu_usage",
    msMonitorAlarmRuleCondition: "GT",
    msMonitorAlarmRuleThreshold: 80,
    msMonitorAlarmRuleConsecutiveCount: 3,
    msMonitorAlarmRuleSilenceMinutes: 10,
    msMonitorAlarmRuleLevel: "P2",
    msMonitorAlarmRuleEnabled: 1,
  };
  ruleVisible.value = true;
}
function openRuleEdit(r: AlarmRule): void {
  ruleForm.value = { ...r };
  ruleVisible.value = true;
}
async function submitRule(): Promise<void> {
  ruleSaving.value = true;
  try {
    await http().post(`${API}/alarm/rule`).data(ruleForm.value).then(r => unwrapResult(r));
    message.success("保存成功");
    ruleVisible.value = false;
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  } finally {
    ruleSaving.value = false;
  }
}
async function removeRule(r: AlarmRule): Promise<void> {
  await ElMessageBox.confirm(`删除该规则（${r.msMonitorAlarmRuleMetricName} ${condText(r.msMonitorAlarmRuleCondition)} ${r.msMonitorAlarmRuleThreshold}）？`, "删除确认", { type: "warning" });
  try {
    await http().delete(`${API}/alarm/rule/${r.id}`).then(r => unwrapResult(r));
    message.success("已删除");
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  }
}
async function runRuleTest(r: AlarmRule): Promise<void> {
  ruleTesting.value = true;
  try {
    const hit = await http().post(`${API}/alarm/rule/${r.id}/test`)
      .query({ metric: r.msMonitorAlarmRuleMetricName, value: Number(r.msMonitorAlarmRuleThreshold) + 1 })
      .then(r => unwrapResult<boolean>(r));
    message.success(hit ? `触发：模拟值 ${Number(r.msMonitorAlarmRuleThreshold) + 1} > 阈值，会告警` : "未触发（条件不满足）");
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  } finally {
    ruleTesting.value = false;
  }
}

/* ==================== 维护窗口弹窗 ==================== */

const WEEKDAYS = [
  { value: "1", label: "周一" }, { value: "2", label: "周二" }, { value: "3", label: "周三" },
  { value: "4", label: "周四" }, { value: "5", label: "周五" }, { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];
const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

const windowVisible = ref(false);
const windowSaving = ref(false);
const windowForm = ref<Partial<AlarmWindow>>({});
const windowDays = ref<string[]>([]);

function openWindowAdd(): void {
  windowForm.value = {
    windowName: "", msMonitorAlarmMaintenanceWindowLevel: "P1",
    startTime: "00:00", endTime: "06:00", msMonitorAlarmMaintenanceWindowEnabled: 1, remark: "",
  };
  windowDays.value = [];
  windowVisible.value = true;
}
function openWindowEdit(w: AlarmWindow): void {
  windowForm.value = { ...w };
  windowDays.value = (w.weekdays ?? "").split(",").map(s => s.trim()).filter(Boolean);
  windowVisible.value = true;
}
async function submitWindow(): Promise<void> {
  const f = windowForm.value;
  if (!f.windowName?.trim()) {
    message.warning("请输入窗口名称");
    return;
  }
  if (!HHMM.test(f.startTime ?? "") || !HHMM.test(f.endTime ?? "")) {
    message.warning("时段须为 HH:mm（如 22:00）");
    return;
  }
  windowSaving.value = true;
  try {
    await http().post(`${API}/alarm/window`).data({
      ...f,
      msMonitorAlarmMaintenanceWindowLevel: f.msMonitorAlarmMaintenanceWindowLevel ?? "",
      weekdays: windowDays.value.join(","),
    }).then(r => unwrapResult(r));
    message.success("保存成功");
    windowVisible.value = false;
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  } finally {
    windowSaving.value = false;
  }
}
async function removeWindow(w: AlarmWindow): Promise<void> {
  await ElMessageBox.confirm(`删除维护窗口「${w.windowName}」？删除后该时段将不再静默告警。`, "删除确认", { type: "warning" });
  try {
    await http().delete(`${API}/alarm/window/${w.id}`).then(r => unwrapResult(r));
    message.success("已删除");
    await fetchAll();
  } catch (e: any) {
    message.error(String(e?.message ?? e));
  }
}

/* ==================== 生命周期 ==================== */

onMounted(fetchAll);
</script>

<template>
  <div class="ap">
    <!-- 页头 -->
    <div class="ap-head">
      <span class="ap-title">告警策略</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span class="lb-spacer" />
      <button type="button" class="lb-btn" :disabled="loading" @click="fetchAll">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
    </div>

    <!-- 子标签 -->
    <div class="ap-tabs">
      <button type="button" class="ap-tab" :class="{ 'is-active': tab === 'policy' }" @click="tab = 'policy'">
        <ReIcon name="SetUp" :size="12" />策略
      </button>
      <button type="button" class="ap-tab" :class="{ 'is-active': tab === 'rule' }" @click="tab = 'rule'">
        <ReIcon name="Bell" :size="12" />规则
      </button>
      <button type="button" class="ap-tab" :class="{ 'is-active': tab === 'window' }" @click="tab = 'window'">
        <ReIcon name="Clock" :size="12" />维护窗口
      </button>
    </div>

    <!-- 内容区 -->
    <div class="ap-body">
      <!-- 策略列表 -->
      <template v-if="tab === 'policy'">
        <div v-if="loading && !policies.length" v-loading="true" class="ap-loading" />
        <template v-else>
          <div class="ap-toolbar">
            <button type="button" class="lb-btn is-primary" @click="openPolicyAdd">
              <ReIcon name="Plus" :size="11" />新建策略
            </button>
            <span class="lb-dim" style="font-size: 10.5px">
              {{ hostPolicies.length }} 个本机策略 · {{ globalPolicies.length }} 个全局策略
            </span>
          </div>
          <div class="ap-list">
            <div v-for="p in policies" :key="p.id" class="ap-item">
              <i class="lb-dot" :class="p.msMonitorAlarmPolicyEnabled === 1 ? 'lb-ok' : 'lb-dim'" />
              <div class="ap-item__info">
                <b>{{ p.msMonitorAlarmPolicyName }}</b>
                <span class="lb-dim" style="font-size: 10.5px">{{ p.msMonitorAlarmPolicyRemark || "—" }}</span>
              </div>
              <span class="lb-pill" :class="p.msServerHostId == null ? 'lb-info' : 'lb-ok'">
                {{ p.msServerHostId == null ? "全局" : "本机" }}
              </span>
              <span class="lb-pill" :class="p.msMonitorAlarmPolicyEnabled === 1 ? 'lb-ok' : 'lb-info'">
                {{ policyStatus(p.msMonitorAlarmPolicyEnabled) }}
              </span>
              <span class="lb-spacer" />
              <button type="button" class="lb-btn" title="编辑" @click="openPolicyEdit(p)">
                <ReIcon name="Edit" :size="11" />
              </button>
              <button type="button" class="lb-btn is-bad" title="删除" @click="removePolicy(p)">
                <ReIcon name="Delete" :size="11" />
              </button>
            </div>
            <div v-if="!policies.length" class="lb-empty">
              <ReIcon name="SetUp" :size="22" />
              <b>暂无策略</b>
              <span>点击「新建策略」创建</span>
            </div>
          </div>
        </template>
      </template>

      <!-- 规则列表 -->
      <template v-else-if="tab === 'rule'">
        <div class="ap-toolbar">
          <button type="button" class="lb-btn is-primary" @click="openRuleAdd()">
            <ReIcon name="Plus" :size="11" />新建规则
          </button>
          <span class="lb-dim" style="font-size: 10.5px">{{ hostRules.length }} 条规则</span>
        </div>
        <div class="ap-list">
          <div v-for="r in hostRules" :key="r.id" class="ap-item">
            <i class="lb-dot" :class="r.msMonitorAlarmRuleEnabled === 1 ? 'lb-ok' : 'lb-dim'" />
            <div class="ap-item__info">
              <b>{{ r.msMonitorAlarmRuleMetricName }} {{ condText(r.msMonitorAlarmRuleCondition) }} {{ r.msMonitorAlarmRuleThreshold }}</b>
              <span class="lb-dim" style="font-size: 10.5px">
                {{ policyName(r.msMonitorAlarmRulePolicyId) }} · {{ ruleMonitorName(r.msMonitorAlarmRuleMonitorId) }} · {{ r.msMonitorAlarmRuleLevel }}
              </span>
            </div>
            <span class="lb-spacer" />
            <button type="button" class="lb-btn" title="测试触发" :disabled="ruleTesting" @click="runRuleTest(r)">
              <ReIcon name="Aim" :size="11" />
            </button>
            <button type="button" class="lb-btn" title="编辑" @click="openRuleEdit(r)">
              <ReIcon name="Edit" :size="11" />
            </button>
            <button type="button" class="lb-btn is-bad" title="删除" @click="removeRule(r)">
              <ReIcon name="Delete" :size="11" />
            </button>
          </div>
          <div v-if="!hostRules.length" class="lb-empty">
            <ReIcon name="Bell" :size="22" />
            <b>暂无规则</b>
            <span>点击「新建规则」为当前主机创建告警规则</span>
          </div>
        </div>
      </template>

      <!-- 维护窗口列表 -->
      <template v-else>
        <div class="ap-toolbar">
          <button type="button" class="lb-btn is-primary" @click="openWindowAdd">
            <ReIcon name="Plus" :size="11" />新建窗口
          </button>
          <span class="lb-dim" style="font-size: 10.5px">{{ windows.length }} 个窗口</span>
        </div>
        <div class="ap-list">
          <div v-for="w in windows" :key="w.id" class="ap-item">
            <i class="lb-dot" :class="w.msMonitorAlarmMaintenanceWindowEnabled === 1 ? 'lb-ok' : 'lb-dim'" />
            <div class="ap-item__info">
              <b>{{ w.windowName }}</b>
              <span class="lb-dim" style="font-size: 10.5px">
                {{ w.startTime }}–{{ w.endTime }} · {{ w.msMonitorAlarmMaintenanceWindowLevel }} ·
                {{ (w.weekdays ?? "").split(",").filter(Boolean).map(d => WEEKDAYS.find(x => x.value === d)?.label ?? d).join(" ") || "每天" }}
              </span>
            </div>
            <span class="lb-spacer" />
            <button type="button" class="lb-btn" title="编辑" @click="openWindowEdit(w)">
              <ReIcon name="Edit" :size="11" />
            </button>
            <button type="button" class="lb-btn is-bad" title="删除" @click="removeWindow(w)">
              <ReIcon name="Delete" :size="11" />
            </button>
          </div>
          <div v-if="!windows.length" class="lb-empty">
            <ReIcon name="Clock" :size="22" />
            <b>暂无维护窗口</b>
            <span>创建窗口后该时段将静默告警</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 策略弹窗 -->
    <ReDialog v-model="policyVisible" :title="policyForm.id ? '编辑策略' : '新建策略'" width="520px"
      confirm-text="保存" cancel-text="取消" :confirm-loading="policySaving" :footer-hidden="false"
      @confirm="submitPolicy" @cancel="policyVisible = false">
      <div class="ap-form">
        <label class="ap-field">
          <span>策略名称</span>
          <input v-model="policyForm.msMonitorAlarmPolicyName" class="sw-input" placeholder="如：CPU 高负载" />
        </label>
        <label class="ap-field">
          <span>状态</span>
          <select v-model="policyForm.msMonitorAlarmPolicyEnabled" class="sw-input">
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select>
        </label>
        <label class="ap-field">
          <span>备注</span>
          <input v-model="policyForm.msMonitorAlarmPolicyRemark" class="sw-input" placeholder="可选" />
        </label>
        <label class="ap-field">
          <span>适用范围</span>
          <label class="ap-check">
            <input v-model="policyGlobal" type="checkbox" />
            全局策略（作用于所有主机，不勾则只对 {{ hostName }} 生效）
          </label>
        </label>
      </div>
    </ReDialog>

    <!-- 规则弹窗 -->
    <ReDialog v-model="ruleVisible" :title="ruleForm.id ? '编辑规则' : '新建规则'" width="580px"
      confirm-text="保存" cancel-text="取消" :confirm-loading="ruleSaving" :footer-hidden="false"
      @confirm="submitRule" @cancel="ruleVisible = false">
      <div class="ap-form">
        <label class="ap-field">
          <span>所属策略</span>
          <select v-model="ruleForm.msMonitorAlarmRulePolicyId" class="sw-input">
            <option v-for="p in selectablePolicies" :key="p.id" :value="p.id">
              {{ p.msMonitorAlarmPolicyName }}{{ p.msServerHostId == null ? "（全局）" : "" }}
            </option>
          </select>
        </label>
        <label class="ap-field">
          <span>监控目标</span>
          <select v-model="ruleForm.msMonitorAlarmRuleMonitorId" class="sw-input">
            <option :value="null">全部目标</option>
            <option v-for="m in monitors" :key="m.id" :value="m.id">{{ m.monitorName }} ({{ m.monitorHost }})</option>
          </select>
        </label>
        <div class="ap-field-row">
          <label class="ap-field">
            <span>指标</span>
            <select v-model="ruleForm.msMonitorAlarmRuleMetricName" class="sw-input">
              <option v-for="m in METRICS" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>
          <label class="ap-field" style="width: 80px">
            <span>条件</span>
            <select v-model="ruleForm.msMonitorAlarmRuleCondition" class="sw-input">
              <option v-for="c in CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </label>
          <label class="ap-field" style="width: 90px">
            <span>阈值</span>
            <input v-model.number="ruleForm.msMonitorAlarmRuleThreshold" type="number" class="sw-input" />
          </label>
        </div>
        <div class="ap-field-row">
          <label class="ap-field">
            <span>级别</span>
            <select v-model="ruleForm.msMonitorAlarmRuleLevel" class="sw-input">
              <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
            </select>
          </label>
          <label class="ap-field" style="width: 110px">
            <span>连续次数</span>
            <input v-model.number="ruleForm.msMonitorAlarmRuleConsecutiveCount" type="number" class="sw-input" />
          </label>
          <label class="ap-field" style="width: 110px">
            <span>静默分钟</span>
            <input v-model.number="ruleForm.msMonitorAlarmRuleSilenceMinutes" type="number" class="sw-input" />
          </label>
        </div>
        <label class="ap-field">
          <span>状态</span>
          <select v-model="ruleForm.msMonitorAlarmRuleEnabled" class="sw-input">
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select>
        </label>
      </div>
    </ReDialog>

    <!-- 维护窗口弹窗 -->
    <ReDialog v-model="windowVisible" :title="windowForm.id ? '编辑窗口' : '新建窗口'" width="520px"
      confirm-text="保存" cancel-text="取消" :confirm-loading="windowSaving" :footer-hidden="false"
      @confirm="submitWindow" @cancel="windowVisible = false">
      <div class="ap-form">
        <label class="ap-field">
          <span>窗口名称</span>
          <input v-model="windowForm.windowName" class="sw-input" placeholder="如：夜间维护" />
        </label>
        <div class="ap-field-row">
          <label class="ap-field" style="width: 100px">
            <span>级别</span>
            <select v-model="windowForm.msMonitorAlarmMaintenanceWindowLevel" class="sw-input">
              <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
            </select>
          </label>
          <label class="ap-field" style="width: 120px">
            <span>开始</span>
            <input v-model="windowForm.startTime" class="sw-input" placeholder="HH:mm" />
          </label>
          <label class="ap-field" style="width: 120px">
            <span>结束</span>
            <input v-model="windowForm.endTime" class="sw-input" placeholder="HH:mm" />
          </label>
        </div>
        <div class="ap-field">
          <span>适用星期</span>
          <div class="ap-days">
            <label v-for="d in WEEKDAYS" :key="d.value" class="ap-day">
              <input v-model="windowDays" type="checkbox" :value="d.value" />
              {{ d.label }}
            </label>
          </div>
        </div>
        <label class="ap-field">
          <span>状态</span>
          <select v-model="windowForm.msMonitorAlarmMaintenanceWindowEnabled" class="sw-input">
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select>
        </label>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../lab/_lab-kit.scss";

.ap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  padding: 12px 14px;
  box-sizing: border-box;
}
.ap-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.ap-title { font-size: 13px; font-weight: 700; }

/* 输入框（复用 ScSoftwareManager 的样式） */
.sw-input {
  height: 30px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 7px;
  outline: none;
}
.sw-input:focus {
  border-color: var(--el-color-primary, #6d5dfc);
  background: var(--el-bg-color, #fff);
}

.ap-tabs {
  display: flex;
  gap: 2px;
  flex: none;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.ap-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  &:hover { color: var(--el-color-primary); }
  &.is-active {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
    font-weight: 600;
  }
}

.ap-body { flex: 1; min-height: 0; overflow-y: auto; }
.ap-loading { display: flex; align-items: center; justify-content: center; height: 120px; }
.ap-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.ap-list { display: flex; flex-direction: column; }
.ap-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 4px 6px;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  &:hover { background: var(--el-fill-color-lighter); }
}
.ap-item__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.ap-item__info b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 表单 */
.ap-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}
.ap-field {
  display: flex;
  align-items: center;
  gap: 8px;
  span { font-size: 12px; color: var(--el-text-color-regular); white-space: nowrap; min-width: 60px; }
}
.ap-field-row {
  display: flex;
  gap: 10px;
}
.ap-field-row .ap-field { flex: 1; }
.ap-days {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ap-day {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  cursor: pointer;
}
.ap-check {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
</style>
