<script setup lang="ts">
/**
 * 监控配置 —— 告警策略 / 告警规则 管理（"设置推送"入口）
 * 基于后端 /ms/monitor/alarm/policy + /rule 的真实 CRUD。
 * 推送渠道(webhook/邮件) 依赖后端补推送渠道，此处先落策略/规则配置。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { useDialogPrerender } from "../utils/dialogPrerender";
import {
  fetchAlarmPolicies,
  saveAlarmPolicy,
  delAlarmPolicy,
  fetchAlarmRules,
  saveAlarmRule,
  delAlarmRule,
  testAlarmRule,
  fetchAlarmWindows,
  saveAlarmWindow,
  delAlarmWindow,
  fetchMonitors,
  type AlarmPolicy,
  type AlarmRule,
  type AlarmMaintenanceWindow,
} from "../api/monitorApi";
import { ReFormItem } from "@repo/ui/re-kit";

const tab = ref<"policy" | "rule" | "window">("policy");
const policies = ref<AlarmPolicy[]>([]);
const rules = ref<AlarmRule[]>([]);
const windows = ref<AlarmMaintenanceWindow[]>([]);
const monitors = ref<{ id: number; monitorName: string }[]>([]);
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

async function fetchAll(): Promise<void> {
  loading.value = true;
  try {
    const [p, r, m, w] = await Promise.all([fetchAlarmPolicies(), fetchAlarmRules(), fetchMonitors(), fetchAlarmWindows()]);
    policies.value = p ?? [];
    rules.value = r ?? [];
    windows.value = w ?? [];
    monitors.value = (m ?? []).map(x => ({ id: x.id, monitorName: x.monitorName }));
  } catch (e) {
    message.error(`加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

const rulePolicyName = (pid: number): string =>
  policies.value.find(p => p.id === pid)?.msMonitorAlarmPolicyName ?? `策略#${pid}`;

/**
 * 告警条件表达式中文描述
 * @param c 条件表达式
 */
function condText(c: string): string {
  return CONDITIONS.find(x => x.value === c)?.label ?? c;
}
const ruleMonitorName = (mid: number | null): string => {
  if (mid == null) return "全部目标";
  return monitors.value.find(m => m.id === mid)?.monitorName ?? `目标#${mid}`;
};
/**
 * 策略启用状态文案
 * @param enabled 启用标记
 */
function policyStatus(enabled: number): string {
  return enabled === 1 ? "运行中" : "已停用";
}

// ---- 策略弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const policyVisible = ref(false);
useDialogPrerender(policyVisible);
const policySaving = ref(false);
const policyForm = ref<Partial<AlarmPolicy>>({ msMonitorAlarmPolicyName: "", msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: "" });
/**
 * 打开新建策略弹窗
 */
function openPolicyAdd(): void {
  policyForm.value = { msMonitorAlarmPolicyName: "", msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: "" };
  policyVisible.value = true;
}
/**
 * 打开编辑策略弹窗
 * @param p 策略
 */
function openPolicyEdit(p: AlarmPolicy): void {
  policyForm.value = { ...p };
  policyVisible.value = true;
}
async function submitPolicy(): Promise<void> {
  if (!policyForm.value.msMonitorAlarmPolicyName?.trim()) {
    message.warning("请输入策略名称");
    return;
  }
  policySaving.value = true;
  try {
    await saveAlarmPolicy(policyForm.value.id ?? null, policyForm.value);
    message.success("保存成功");
    policyVisible.value = false;
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    policySaving.value = false;
  }
}
async function removePolicy(p: AlarmPolicy): Promise<void> {
  await ElMessageBox.confirm(`删除策略「${p.msMonitorAlarmPolicyName}」将级联删除其所有规则，确认？`, "删除确认", { type: "warning" });
  try {
    await delAlarmPolicy(p.id);
    message.success("已删除");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

// ---- 规则弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const ruleVisible = ref(false);
useDialogPrerender(ruleVisible);
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
/**
 * 打开新建规则弹窗
 * @param policyId 所属策略 ID
 */
function openRuleAdd(policyId?: number): void {
  ruleForm.value = {
    msMonitorAlarmRulePolicyId: policyId ?? policies.value[0]?.id ?? 0,
    msMonitorAlarmRuleMonitorId: null,
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
/**
 * 打开编辑规则弹窗
 * @param r 规则
 */
function openRuleEdit(r: AlarmRule): void {
  ruleForm.value = { ...r };
  ruleVisible.value = true;
}
async function submitRule(): Promise<void> {
  ruleSaving.value = true;
  try {
    await saveAlarmRule(ruleForm.value.id ?? null, ruleForm.value);
    message.success("保存成功");
    ruleVisible.value = false;
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    ruleSaving.value = false;
  }
}
async function removeRule(r: AlarmRule): Promise<void> {
  await ElMessageBox.confirm(`删除该规则（${r.msMonitorAlarmRuleMetricName} ${condText(r.msMonitorAlarmRuleCondition)} ${r.msMonitorAlarmRuleThreshold}）？`, "删除确认", { type: "warning" });
  try {
    await delAlarmRule(r.id);
    message.success("已删除");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}
async function runRuleTest(r: AlarmRule): Promise<void> {
  ruleTesting.value = true;
  try {
    const hit = await testAlarmRule(r.id, r.msMonitorAlarmRuleMetricName, Number(r.msMonitorAlarmRuleThreshold) + 1);
    message.success(hit ? `触发：模拟值 ${Number(r.msMonitorAlarmRuleThreshold) + 1} > 阈值，会告警` : "未触发（条件不满足）");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    ruleTesting.value = false;
  }
}

// ---- 维护窗口弹窗（后端在产生告警事件前按 启用+级别+星期+每日时段 命中即跳过） ----
const WEEKDAYS = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];
const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

const windowVisible = ref(false);
useDialogPrerender(windowVisible);
const windowSaving = ref(false);
const windowForm = ref<Partial<AlarmMaintenanceWindow>>({});
const windowDays = ref<string[]>([]);
/**
 * 打开新建维护窗口弹窗
 */
function openWindowAdd(): void {
  windowForm.value = {
    windowName: "",
    msMonitorAlarmMaintenanceWindowLevel: "P1",
    startTime: "00:00",
    endTime: "06:00",
    msMonitorAlarmMaintenanceWindowEnabled: 1,
    remark: "",
  };
  windowDays.value = [];
  windowVisible.value = true;
}
/**
 * 打开编辑维护窗口弹窗
 * @param w 维护窗口
 */
function openWindowEdit(w: AlarmMaintenanceWindow): void {
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
    await saveAlarmWindow(f.id ?? null, {
      ...f,
      msMonitorAlarmMaintenanceWindowLevel: f.msMonitorAlarmMaintenanceWindowLevel ?? "",
      weekdays: windowDays.value.join(","),
    });
    message.success("保存成功");
    windowVisible.value = false;
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    windowSaving.value = false;
  }
}
async function removeWindow(w: AlarmMaintenanceWindow): Promise<void> {
  await ElMessageBox.confirm(`删除维护窗口「${w.windowName}」？删除后该时段将不再静默告警。`, "删除确认", { type: "warning" });
  try {
    await delAlarmWindow(w.id);
    message.success("已删除");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}
/**
 * 窗口的星期展示文本
 * @param w 维护窗口
 */
function windowDaysText(w: AlarmMaintenanceWindow): string {
  const days = (w.weekdays ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (days.length === 0) return "每天";
  return days.map(d => WEEKDAYS.find(x => x.value === d)?.label ?? `?${d}`).join("、");
}
/**
 * 窗口的级别展示文本（空级别为全局静默，命中任意级别的规则）
 * @param w 维护窗口
 */
function windowLevelText(w: AlarmMaintenanceWindow): string {
  return w.msMonitorAlarmMaintenanceWindowLevel || "全局（所有级别）";
}

/** 窗口「当前生效」徽章的刷新节拍，避免长时间失真又不至于每分钟全量重渲染 */
const WINDOW_TICK_MS = 30_000;
const now = ref(new Date());
let windowTimer: number | undefined;

/**
 * 判定维护窗口此刻是否命中，口径与后端触发前的静默检查一致
 * @param w 维护窗口
 */
function windowActiveNow(w: AlarmMaintenanceWindow): boolean {
  if (w.msMonitorAlarmMaintenanceWindowEnabled !== 1) return false;
  const d = now.value;
  const weekday = String(d.getDay()); // 与后端 getValue() % 7 一致：周日=0、周一=1……周六=6
  const days = (w.weekdays ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (days.length > 0 && !days.includes(weekday)) return false;
  const [sh, sm] = (w.startTime ?? "").split(":").map(Number);
  const [eh, em] = (w.endTime ?? "").split(":").map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return false;
  const cur = d.getHours() * 60 + d.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

// 规则按策略分组
const rulesGrouped = computed(() => {
  const map = new Map<number, AlarmRule[]>();
  for (const r of rules.value) {
    if (!map.has(r.msMonitorAlarmRulePolicyId)) map.set(r.msMonitorAlarmRulePolicyId, []);
    map.get(r.msMonitorAlarmRulePolicyId)!.push(r);
  }
  return [...map.entries()];
});

onMounted(() => {
  fetchAll();
  windowTimer = window.setInterval(() => { now.value = new Date(); }, WINDOW_TICK_MS);
});
onUnmounted(() => {
  if (windowTimer !== undefined) window.clearInterval(windowTimer);
});
</script>

<template>
  <div class="cf tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">告警策略</h1>
        <p class="page-desc">策略 · 规则 · 维护窗口 —— 决定「什么情况下该响」；通知渠道当前仅日志实现（webhook/邮件待补）</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true"  :loading="loading" @click="fetchAll">刷新</ReButton>
      </div>
    </div>

    <div class="tabs">
      <ReButton :class="['tab-btn', { active: tab === 'policy' }]"  :show-text="true" @click="tab = 'policy'">告警策略</ReButton>
      <ReButton :class="['tab-btn', { active: tab === 'rule' }]"  :show-text="true" @click="tab = 'rule'">告警规则</ReButton>
      <ReButton :class="['tab-btn', { active: tab === 'window' }]"  :show-text="true" @click="tab = 'window'">维护窗口</ReButton>
    </div>

    <!-- 策略 -->
    <ReCard v-if="tab === 'policy'" :radius="12" shadow="never">
      <template #header>
        <div class="card-bar">
          <span class="card-title">策略总览</span>
          <ReButton icon="Plus" :show-text="true" type="primary"  @click="openPolicyAdd">新增策略</ReButton>
        </div>
      </template>
      <ReEmpty v-if="policies.length === 0" description="暂无策略 —— 策略是规则的逻辑容器，停用即整组失效" style="padding: 36px 0" />
      <div v-else class="p-list">
        <div v-for="p in policies" :key="p.id" class="p-row">
          <div class="p-main">
            <ReStatusIndicator :type="p.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" :pulse="p.msMonitorAlarmPolicyEnabled === 1" />
            <b class="p-name">{{ p.msMonitorAlarmPolicyName }}</b>
            <ReTag :type="p.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" >{{ policyStatus(p.msMonitorAlarmPolicyEnabled) }}</ReTag>
            <span class="p-hint">{{ p.msMonitorAlarmPolicyRemark || "—" }}</span>
          </div>
          <div class="p-ops">
            <ReButton icon="Plus" layout="square"  title="新增规则" @click="openRuleAdd(p.id)" />
            <ReButton icon="EditPen" layout="square"  title="编辑策略" @click="openPolicyEdit(p)" />
            <ReButton icon="Delete" layout="square"  type="danger" title="删除策略" @click="removePolicy(p)" />
          </div>
        </div>
      </div>
    </ReCard>

    <!-- 规则 -->
    <ReCard v-if="tab === 'rule'" :radius="12" shadow="never">
      <template #header>
        <div class="card-bar">
          <span class="card-title">规则总览</span>
          <ReButton icon="Plus" :show-text="true" type="primary"  @click="openRuleAdd()">新增规则</ReButton>
        </div>
      </template>
      <ReEmpty v-if="rules.length === 0" description="暂无规则 —— 选指标 + 阈值 + 级别定义触发条件" style="padding: 36px 0" />
      <div v-else class="r-list">
        <template v-for="[pid, list] in rulesGrouped" :key="pid">
          <div class="r-grp-title">{{ rulePolicyName(pid) }}</div>
          <div v-for="r in list" :key="r.id" class="r-row">
            <div class="r-main">
              <ReTag :type="(r.msMonitorAlarmRuleLevel==='P0'||r.msMonitorAlarmRuleLevel==='P1')?'danger':r.msMonitorAlarmRuleLevel==='P2'?'warning':'success'" effect="dark" >{{ r.msMonitorAlarmRuleLevel }}</ReTag>
              <span class="r-metric mono">{{ r.msMonitorAlarmRuleMetricName }}</span>
              <span class="r-cond mono">{{ condText(r.msMonitorAlarmRuleCondition) }} {{ r.msMonitorAlarmRuleThreshold }}</span>
              <span class="r-meta">{{ ruleMonitorName(r.msMonitorAlarmRuleMonitorId) }}</span>
              <span class="r-meta dim">连续 {{ r.msMonitorAlarmRuleConsecutiveCount }} 次 · 静默 {{ r.msMonitorAlarmRuleSilenceMinutes }}m</span>
              <ReTag :type="r.msMonitorAlarmRuleEnabled === 1 ? 'success' : 'info'" >{{ r.msMonitorAlarmRuleEnabled === 1 ? "启用" : "停用" }}</ReTag>
            </div>
            <div class="r-ops">
              <ReButton icon="VideoPlay" layout="square"  title="测试规则" :loading="ruleTesting" @click="runRuleTest(r)" />
              <ReButton icon="EditPen" layout="square"  title="编辑规则" @click="openRuleEdit(r)" />
              <ReButton icon="Delete" layout="square"  type="danger" title="删除规则" @click="removeRule(r)" />
            </div>
          </div>
        </template>
      </div>
    </ReCard>

    <!-- 维护窗口 -->
    <ReCard v-if="tab === 'window'" :radius="12" shadow="never">
      <template #header>
        <div class="card-bar">
          <span class="card-title">告警静默时段</span>
          <ReButton icon="Plus" :show-text="true" type="primary"  @click="openWindowAdd">新增窗口</ReButton>
        </div>
      </template>
      <ReEmpty v-if="windows.length === 0" description="暂无维护窗口 —— 命中窗口时段的告警不产生事件，用于发布/巡检静默" style="padding: 36px 0" />
      <div v-else class="p-list">
        <div v-for="w in windows" :key="w.id" class="p-row">
          <div class="p-main">
            <ReStatusIndicator :type="w.msMonitorAlarmMaintenanceWindowEnabled === 1 ? 'success' : 'info'" :pulse="windowActiveNow(w)" />
            <b class="p-name">{{ w.windowName }}</b>
            <ReTag :type="w.msMonitorAlarmMaintenanceWindowLevel ? 'warning' : 'info'"  effect="dark">{{ windowLevelText(w) }}</ReTag>
            <span class="r-meta mono">{{ w.startTime || "—" }} ~ {{ w.endTime || "—" }}</span>
            <span class="r-meta">{{ windowDaysText(w) }}</span>
            <ReTag v-if="windowActiveNow(w)" type="success" >此刻生效</ReTag>
            <span class="p-hint">{{ w.remark || "—" }}</span>
          </div>
          <div class="p-ops">
            <ReButton icon="EditPen" layout="square"  title="编辑窗口" @click="openWindowEdit(w)" />
            <ReButton icon="Delete" layout="square"  type="danger" title="删除窗口" @click="removeWindow(w)" />
          </div>
        </div>
      </div>
    </ReCard>

    <!-- 策略弹窗 -->
    <ReDialog v-model="policyVisible" :title="policyForm.id ? '编辑策略' : '新增策略'" width="440px">
      <ReForm label-width="80px">
        <ReFormItem label="名称"><ReInput v-model="policyForm.msMonitorAlarmPolicyName" placeholder="如 服务器基础告警" /></ReFormItem>
        <ReFormItem label="状态">
          <ReSwitch v-model="policyForm.msMonitorAlarmPolicyEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </ReFormItem>
        <ReFormItem label="备注"><ReInput v-model="policyForm.msMonitorAlarmPolicyRemark" type="textarea" :rows="2" placeholder="可选" /></ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="policyVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="policySaving" @click="submitPolicy">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 规则弹窗 -->
    <ReDialog v-model="ruleVisible" :title="ruleForm.id ? '编辑规则' : '新增规则'" width="520px">
      <ReForm label-width="96px">
        <ReFormItem label="所属策略">
          <ReSelect v-model="ruleForm.msMonitorAlarmRulePolicyId"  style="width: 100%" :options="policies.map(p => ({ label: p.msMonitorAlarmPolicyName, value: p.id }))" />
        </ReFormItem>
        <ReFormItem label="目标">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleMonitorId"  clearable style="width: 100%" :options="[
            { label: '全部目标', value: null as any },
            ...monitors.map(m => ({ label: m.monitorName, value: m.id })),
          ]" />
        </ReFormItem>
        <ReFormItem label="指标">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleMetricName"  filterable allow-create style="width: 100%" :options="METRICS.map(mt => ({ label: mt, value: mt }))" />
        </ReFormItem>
        <ReFormItem label="条件">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleCondition"  style="width: 120px" class="mr" :options="CONDITIONS.map(c => ({ label: c.label, value: c.value }))" />
          <ReInputNumber v-model="ruleForm.msMonitorAlarmRuleThreshold"  :min="0" :step="5" style="width: 140px" />
        </ReFormItem>
        <ReFormItem label="级别">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleLevel"  style="width: 120px" :options="LEVELS.map(lv => ({ label: lv + ' ' + lv, value: lv }))" />
        </ReFormItem>
        <ReFormItem label="连续次数"><ReInputNumber v-model="ruleForm.msMonitorAlarmRuleConsecutiveCount"  :min="1" :max="20" /></ReFormItem>
        <ReFormItem label="静默(分钟)"><ReInputNumber v-model="ruleForm.msMonitorAlarmRuleSilenceMinutes"  :min="0" :max="1440" /></ReFormItem>
        <ReFormItem label="状态"><ReSwitch v-model="ruleForm.msMonitorAlarmRuleEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" /></ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="ruleVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="ruleSaving" @click="submitRule">保存</ReButton>
      </template>
    </ReDialog>
    <!-- 维护窗口弹窗 -->
    <ReDialog v-model="windowVisible" :title="windowForm.id ? '编辑维护窗口' : '新增维护窗口'" width="480px">
      <ReForm label-width="92px">
        <ReFormItem label="名称"><ReInput v-model="windowForm.windowName" placeholder="如 夜间发布静默" /></ReFormItem>
        <ReFormItem label="级别">
          <ReSelect v-model="windowForm.msMonitorAlarmMaintenanceWindowLevel"  clearable style="width: 100%" :options="LEVELS.map(lv => ({ label: lv, value: lv }))" />
          <div class="w-hint">只静默该级别的规则；留空表示全局静默（命中所有级别）</div>
        </ReFormItem>
        <ReFormItem label="每日时段">
          <ReInput v-model="windowForm.startTime"  placeholder="22:00" style="width: 104px" class="mr" />
          <span class="w-sep">至</span>
          <ReInput v-model="windowForm.endTime"  placeholder="06:00" style="width: 104px" class="ml" />
          <div class="w-hint">格式 HH:mm，支持跨午夜（22:00 ~ 06:00）；起止相同表示全天静默</div>
        </ReFormItem>
        <ReFormItem label="星期">
          <ReSelect v-model="windowDays"  multiple clearable collapse-tags style="width: 100%" :options="WEEKDAYS" placeholder="不选表示每天" />
        </ReFormItem>
        <ReFormItem label="备注"><ReInput v-model="windowForm.remark" type="textarea" :rows="2" placeholder="可选" /></ReFormItem>
        <ReFormItem label="状态">
          <ReSwitch v-model="windowForm.msMonitorAlarmMaintenanceWindowEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="windowVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="windowSaving" @click="submitWindow">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.cf-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.cf-tab { background: var(--bg-container); border: 1px solid var(--border-subtle); }
.cf-tab.active { color: var(--text-inverse); background: var(--brand-500); border-color: var(--brand-500); }
.card-bar { display: flex; align-items: center; justify-content: space-between; }

.p-list, .r-list { display: flex; flex-direction: column; }
.p-row, .r-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--bg-container);
  transition: border-color 0.15s var(--ease-out, ease), box-shadow 0.15s, transform 0.15s;
  &:hover { border-color: var(--brand-100); box-shadow: var(--shadow-2); transform: translateY(-1px); }
  &:last-child { margin-bottom: 0; }
}
.p-main, .r-main { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
.p-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; &.on { background: var(--pulse-online); } &.off { background: var(--pulse-offline); } }
.p-name { font-weight: 600; font-size: 14px; }
.p-hint { flex: 1; overflow: hidden; color: var(--text-tertiary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.p-ops, .r-ops { display: flex; gap: 4px; }

.r-grp-title { padding: 10px 6px 4px; font-size: 12px; font-weight: 600; color: var(--brand-600); letter-spacing: 0.02em; }
.r-metric { font-weight: 600; }
.r-cond { color: var(--brand-500); font-weight: 700; }
.r-meta { font-size: 12px; color: var(--text-secondary); }
.dim { color: var(--text-tertiary); }
.mono { font-family: monospace; font-size: 12px; }
.st-tag { font-size: 12px; &.st-ok { color: var(--pulse-online); } &.st-info { color: var(--text-tertiary); } }
.lv-tag { padding: 0 6px; font-size: 11px; font-weight: 700; font-family: monospace; border: 1px solid transparent; border-radius: 4px; }
.mr { margin-right: 8px; }
.ml { margin-left: 8px; }
.w-sep { font-size: 12px; color: var(--text-tertiary); margin: 0 8px; }
.w-hint { width: 100%; margin-top: 4px; font-size: 11px; line-height: 1.5; color: var(--text-tertiary); }
</style>
