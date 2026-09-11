<script setup lang="ts">
/**
 * 监控配置 —— 告警策略 / 告警规则 管理（"设置推送"入口）
 * 基于后端 /ms/monitor/alarm/policy + /rule 的真实 CRUD。
 * 推送渠道(webhook/邮件) 依赖后端补推送渠道，此处先落策略/规则配置。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDialogPrerender } from "../utils/dialogPrerender";
import {
  fetchAlarmPolicies,
  saveAlarmPolicy,
  delAlarmPolicy,
  fetchAlarmRules,
  saveAlarmRule,
  delAlarmRule,
  testAlarmRule,
  fetchMonitors,
  type AlarmPolicy,
  type AlarmRule,
} from "../monitorApi";
import { ReFormItem } from "@repo/ui/re-kit";

const tab = ref<"policy" | "rule">("policy");
const policies = ref<AlarmPolicy[]>([]);
const rules = ref<AlarmRule[]>([]);
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
    const [p, r, m] = await Promise.all([fetchAlarmPolicies(), fetchAlarmRules(), fetchMonitors()]);
    policies.value = p ?? [];
    rules.value = r ?? [];
    monitors.value = (m ?? []).map(x => ({ id: x.id, monitorName: x.monitorName }));
  } catch (e) {
    ElMessage.error(`加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

const rulePolicyName = (pid: number): string =>
  policies.value.find(p => p.id === pid)?.msMonitorAlarmPolicyName ?? `策略#${pid}`;

function condText(c: string): string {
  return CONDITIONS.find(x => x.value === c)?.label ?? c;
}
const ruleMonitorName = (mid: number | null): string => {
  if (mid == null) return "全部目标";
  return monitors.value.find(m => m.id === mid)?.monitorName ?? `目标#${mid}`;
};
function policyStatus(enabled: number): string {
  return enabled === 1 ? "运行中" : "已停用";
}

// ---- 策略弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const policyVisible = ref(false);
useDialogPrerender(policyVisible);
const policySaving = ref(false);
const policyForm = ref<Partial<AlarmPolicy>>({ msMonitorAlarmPolicyName: "", msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: "" });
function openPolicyAdd(): void {
  policyForm.value = { msMonitorAlarmPolicyName: "", msMonitorAlarmPolicyEnabled: 1, msMonitorAlarmPolicyRemark: "" };
  policyVisible.value = true;
}
function openPolicyEdit(p: AlarmPolicy): void {
  policyForm.value = { ...p };
  policyVisible.value = true;
}
async function submitPolicy(): Promise<void> {
  if (!policyForm.value.msMonitorAlarmPolicyName?.trim()) {
    ElMessage.warning("请输入策略名称");
    return;
  }
  policySaving.value = true;
  try {
    await saveAlarmPolicy(policyForm.value.id ?? null, policyForm.value);
    ElMessage.success("保存成功");
    policyVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    policySaving.value = false;
  }
}
async function removePolicy(p: AlarmPolicy): Promise<void> {
  await ElMessageBox.confirm(`删除策略「${p.msMonitorAlarmPolicyName}」将级联删除其所有规则，确认？`, "删除确认", { type: "warning" });
  try {
    await delAlarmPolicy(p.id);
    ElMessage.success("已删除");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
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
function openRuleEdit(r: AlarmRule): void {
  ruleForm.value = { ...r };
  ruleVisible.value = true;
}
async function submitRule(): Promise<void> {
  ruleSaving.value = true;
  try {
    await saveAlarmRule(ruleForm.value.id ?? null, ruleForm.value);
    ElMessage.success("保存成功");
    ruleVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    ruleSaving.value = false;
  }
}
async function removeRule(r: AlarmRule): Promise<void> {
  await ElMessageBox.confirm(`删除该规则（${r.msMonitorAlarmRuleMetricName} ${condText(r.msMonitorAlarmRuleCondition)} ${r.msMonitorAlarmRuleThreshold}）？`, "删除确认", { type: "warning" });
  try {
    await delAlarmRule(r.id);
    ElMessage.success("已删除");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}
async function runRuleTest(r: AlarmRule): Promise<void> {
  ruleTesting.value = true;
  try {
    const hit = await testAlarmRule(r.id, r.msMonitorAlarmRuleMetricName, Number(r.msMonitorAlarmRuleThreshold) + 1);
    ElMessage.success(hit ? `触发：模拟值 ${Number(r.msMonitorAlarmRuleThreshold) + 1} > 阈值，会告警` : "未触发（条件不满足）");
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    ruleTesting.value = false;
  }
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

onMounted(fetchAll);
</script>

<template>
  <div class="cf">
    <div class="page-header">
      <div>
        <h1 class="page-title">监控配置</h1>
        <p class="page-desc">告警策略与规则管理 · 推送渠道依赖后端补全</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
      </div>
    </div>

    <div class="tabs">
      <ReButton :class="['tab-btn', { active: tab === 'policy' }]" size="small" :show-text="true" @click="tab = 'policy'">告警策略</ReButton>
      <ReButton :class="['tab-btn', { active: tab === 'rule' }]" size="small" :show-text="true" @click="tab = 'rule'">告警规则</ReButton>
    </div>

    <!-- 策略 -->
    <ReCard v-if="tab === 'policy'" :radius="12" shadow="never">
      <template #header>
        <div class="card-bar">
          <span class="card-title">策略总览</span>
          <ReButton icon="Plus" :show-text="true" type="primary" size="small" @click="openPolicyAdd">新增策略</ReButton>
        </div>
      </template>
      <ReEmpty v-if="policies.length === 0" description="暂无策略 —— 策略是规则的逻辑容器，停用即整组失效" style="padding: 36px 0" />
      <div v-else class="p-list">
        <div v-for="p in policies" :key="p.id" class="p-row">
          <div class="p-main">
            <ReStatusIndicator :type="p.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" :pulse="p.msMonitorAlarmPolicyEnabled === 1" />
            <b class="p-name">{{ p.msMonitorAlarmPolicyName }}</b>
            <ReTag :type="p.msMonitorAlarmPolicyEnabled === 1 ? 'success' : 'info'" size="small">{{ policyStatus(p.msMonitorAlarmPolicyEnabled) }}</ReTag>
            <span class="p-hint">{{ p.msMonitorAlarmPolicyRemark || "—" }}</span>
          </div>
          <div class="p-ops">
            <ReButton icon="Plus" layout="square" size="small" title="新增规则" @click="openRuleAdd(p.id)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑策略" @click="openPolicyEdit(p)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除策略" @click="removePolicy(p)" />
          </div>
        </div>
      </div>
    </ReCard>

    <!-- 规则 -->
    <ReCard v-if="tab === 'rule'" :radius="12" shadow="never">
      <template #header>
        <div class="card-bar">
          <span class="card-title">规则总览</span>
          <ReButton icon="Plus" :show-text="true" type="primary" size="small" @click="openRuleAdd()">新增规则</ReButton>
        </div>
      </template>
      <ReEmpty v-if="rules.length === 0" description="暂无规则 —— 选指标 + 阈值 + 级别定义触发条件" style="padding: 36px 0" />
      <div v-else class="r-list">
        <template v-for="[pid, list] in rulesGrouped" :key="pid">
          <div class="r-grp-title">{{ rulePolicyName(pid) }}</div>
          <div v-for="r in list" :key="r.id" class="r-row">
            <div class="r-main">
              <ReTag :type="(r.msMonitorAlarmRuleLevel==='P0'||r.msMonitorAlarmRuleLevel==='P1')?'danger':r.msMonitorAlarmRuleLevel==='P2'?'warning':'success'" effect="dark" size="small">{{ r.msMonitorAlarmRuleLevel }}</ReTag>
              <span class="r-metric mono">{{ r.msMonitorAlarmRuleMetricName }}</span>
              <span class="r-cond mono">{{ condText(r.msMonitorAlarmRuleCondition) }} {{ r.msMonitorAlarmRuleThreshold }}</span>
              <span class="r-meta">{{ ruleMonitorName(r.msMonitorAlarmRuleMonitorId) }}</span>
              <span class="r-meta dim">连续 {{ r.msMonitorAlarmRuleConsecutiveCount }} 次 · 静默 {{ r.msMonitorAlarmRuleSilenceMinutes }}m</span>
              <ReTag :type="r.msMonitorAlarmRuleEnabled === 1 ? 'success' : 'info'" size="small">{{ r.msMonitorAlarmRuleEnabled === 1 ? "启用" : "停用" }}</ReTag>
            </div>
            <div class="r-ops">
              <ReButton icon="VideoPlay" layout="square" size="small" title="测试规则" :loading="ruleTesting" @click="runRuleTest(r)" />
              <ReButton icon="EditPen" layout="square" size="small" title="编辑规则" @click="openRuleEdit(r)" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除规则" @click="removeRule(r)" />
            </div>
          </div>
        </template>
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
          <ReSelect v-model="ruleForm.msMonitorAlarmRulePolicyId" size="small" style="width: 100%" :options="policies.map(p => ({ label: p.msMonitorAlarmPolicyName, value: p.id }))" />
        </ReFormItem>
        <ReFormItem label="目标">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleMonitorId" size="small" clearable style="width: 100%" :options="[
            { label: '全部目标', value: null as any },
            ...monitors.map(m => ({ label: m.monitorName, value: m.id })),
          ]" />
        </ReFormItem>
        <ReFormItem label="指标">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleMetricName" size="small" filterable allow-create style="width: 100%" :options="METRICS.map(mt => ({ label: mt, value: mt }))" />
        </ReFormItem>
        <ReFormItem label="条件">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleCondition" size="small" style="width: 120px" class="mr" :options="CONDITIONS.map(c => ({ label: c.label, value: c.value }))" />
          <ReInputNumber v-model="ruleForm.msMonitorAlarmRuleThreshold" size="small" :min="0" :step="5" style="width: 140px" />
        </ReFormItem>
        <ReFormItem label="级别">
          <ReSelect v-model="ruleForm.msMonitorAlarmRuleLevel" size="small" style="width: 120px" :options="LEVELS.map(lv => ({ label: lv + ' ' + lv, value: lv }))" />
        </ReFormItem>
        <ReFormItem label="连续次数"><ReInputNumber v-model="ruleForm.msMonitorAlarmRuleConsecutiveCount" size="small" :min="1" :max="20" /></ReFormItem>
        <ReFormItem label="静默(分钟)"><ReInputNumber v-model="ruleForm.msMonitorAlarmRuleSilenceMinutes" size="small" :min="0" :max="1440" /></ReFormItem>
        <ReFormItem label="状态"><ReSwitch v-model="ruleForm.msMonitorAlarmRuleEnabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" /></ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="ruleVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="ruleSaving" @click="submitRule">保存</ReButton>
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
</style>