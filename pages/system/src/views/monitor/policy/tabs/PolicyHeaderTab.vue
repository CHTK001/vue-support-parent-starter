<script setup lang="ts">
/**
 * 消息头拦截页签
 *
 * <p>按请求消息头（主要是 User-Agent）拦爬虫与自动化客户端。规则解析或匹配出异常时一律放行，
 * 不会因为策略本身的 bug 打挂整站。命中次数按「头名|命中的那个特征」归因，
 * 所以行级总数由本组件自己把各特征的命中数加总。</p>
 *
 * <p>状态、列定义、请求与弹窗都在本组件内闭环；命中统计是整页共用的，
 * 走 {@link usePolicyHitContext} 注入的同一份数据，不在这里自己拉。</p>
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReDialog from "@repo/ui/re-dialog";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import {
  deletePolicyConfig,
  listHeaderPresets,
  listHeaderRules,
  refreshHeaderRules,
  savePolicyConfig,
  togglePolicyConfig,
  updatePolicyConfig,
} from "../../../../api/systemApi";
import type { HeaderMatchType, HeaderPresets, HeaderRuleRow, PolicyConfig } from "../../../../api/types";
import { TABLE_TOOLBAR } from "../shared/policyTable";
import { usePolicyHitContext } from "../composables/policyHitContext";
import PolicyHitCell from "../components/PolicyHitCell.vue";

const { t } = useI18n();
const { hitCountOf, loadHitCounts } = usePolicyHitContext();

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

const tableRef = ref<TableReloadRef>();
const total = ref(0);
const pageSize = ref(10);
const page = ref(1);
const toggleLoadingId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const presets = ref<HeaderPresets>({ groups: {}, flat: [] });
const form = ref({
  sysPolicyConfigId: null as number | null,
  headerName: "User-Agent",
  matchType: "CONTAINS" as HeaderMatchType,
  patternsText: "",
  blockStatus: 403,
  message: "",
  status: 1,
  remark: "",
});

const matchOptions = computed<Array<{ value: HeaderMatchType; label: string; hint: string }>>(() => [
  { value: "CONTAINS", label: t("policy.header.match.CONTAINS.label"), hint: t("policy.header.match.CONTAINS.hint") },
  { value: "EQUALS", label: t("policy.header.match.EQUALS.label"), hint: t("policy.header.match.EQUALS.hint") },
  { value: "PREFIX", label: t("policy.header.match.PREFIX.label"), hint: t("policy.header.match.PREFIX.hint") },
  { value: "REGEX", label: t("policy.header.match.REGEX.label"), hint: t("policy.header.match.REGEX.hint") },
]);

const matchHint = computed(() => matchOptions.value.find((o) => o.value === form.value.matchType)?.hint ?? "");

/**
 * 把「每行一个」的文本框拆成特征数组
 *
 * @param text 原始文本
 * @returns 去空行后的特征数组
 */
function patternsOf(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 拼一条规则的命中键
 *
 * <p><b>头名必须转小写</b>：后端 {@code PolicyCacheService.projectHeaderRule} 投影时
 * 头名已小写化，键对不上会一直显示 0 次命中。</p>
 *
 * @param row 规则行
 * @param pattern 指定特征；不传取第一个
 * @returns 命中统计的键
 */
function hitKeyOf(row: HeaderRuleRow, pattern?: string): string {
  const name = (row.headerName ?? "").toLowerCase();
  const p = pattern ?? (row.patterns ?? [])[0] ?? "";
  return `${name}|${p}`;
}

/**
 * 一条规则的命中次数 = 它各个特征的命中数之和
 *
 * <p>后端按「头名|命中的那个特征」归因，所以行级总数要自己加；
 * 这样既能看规则整体拦了多少，也能点进去看是哪条特征在拦。</p>
 *
 * @param row 规则行
 * @returns 命中次数合计
 */
function hitCount(row: HeaderRuleRow): number {
  const list = row.patterns ?? [];
  if (!list.length) {
    return hitCountOf("HEADER", (row.headerName ?? "").toLowerCase());
  }
  return list.reduce((sum, p) => sum + hitCountOf("HEADER", hitKeyOf(row, p)), 0);
}

const columns = computed<ReTableColumn[]>(() => [
  { prop: "headerName", label: t("policy.header.col.headerName"), minWidth: 150 },
  { prop: "matchType", label: t("policy.header.col.matchType"), width: 120, slot: "matchType", align: "center" },
  // patterns 必须显式写 slot: ReTable 按 col.slot（缺省是 `col-${prop}`）找插槽，
  // 不写就找不到 <template #patterns>，直接回退到 prop 渲染 —— 数组会变成
  // 默认的逗号拼接，`.policy-header-patterns` 的单行省略也一并失效。
  { prop: "patterns", label: t("policy.header.col.patterns"), minWidth: 320, slot: "patterns", showOverflowTooltip: true },
  { prop: "blockStatus", label: t("policy.header.col.blockStatus"), width: 100, align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "status", label: t("policy.header.col.active"), width: 100, slot: "status", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 180, showOverflowTooltip: true },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

/**
 * 加载消息头规则分页
 *
 * <p>数据量极小（通常个位数），本地分页即可，也不值得再打一次接口。</p>
 *
 * @param params ReTable 传入的分页参数
 * @returns 分页结果
 */
async function load(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await listHeaderRules();
  const rows = res.data ?? [];
  total.value = rows.length;
  const curPage = params?.page ?? page.value;
  const curSize = params?.pageSize ?? pageSize.value;
  const start = (curPage - 1) * curSize;
  return {
    total: rows.length,
    data: rows.slice(start, start + curSize) as unknown as Record<string, unknown>[],
  };
}

/** 拉取爬虫 / 自动化客户端的 UA 特征预设 */
async function loadPresets(): Promise<void> {
  try {
    const res = await listHeaderPresets();
    presets.value = res.data ?? { groups: {}, flat: [] };
  } catch {
    presets.value = { groups: {}, flat: [] };
  }
}

/** 一键填入全部预置特征 */
function handleFillPresets(): void {
  const flat = presets.value.flat ?? [];
  if (!flat.length) {
    ElMessage.warning(t("policy.header.errPresets"));
    return;
  }
  form.value.patternsText = flat.join("\n");
  ElMessage.success(t("policy.header.presetFilled", { count: flat.length }));
}

/** 打开新增规则弹窗 */
function handleAdd(): void {
  isEdit.value = false;
  form.value = {
    sysPolicyConfigId: null,
    headerName: "User-Agent",
    matchType: "CONTAINS",
    patternsText: "",
    blockStatus: 403,
    message: t("policy.header.defaultMessage"),
    status: 1,
    remark: "",
  };
  dialogVisible.value = true;
}

/** 打开编辑规则弹窗 */
function handleEdit(row: Record<string, unknown>): void {
  const r = row as HeaderRuleRow;
  isEdit.value = true;
  form.value = {
    sysPolicyConfigId: r.sysPolicyConfigId ?? null,
    headerName: r.headerName ?? "User-Agent",
    matchType: (r.matchType ?? "CONTAINS") as HeaderMatchType,
    patternsText: (r.patterns ?? []).join("\n"),
    blockStatus: r.blockStatus ?? 403,
    message: r.message ?? t("policy.header.defaultMessage"),
    status: r.status ?? 1,
    remark: r.remark ?? "",
  };
  dialogVisible.value = true;
}

/** 序列化成存进 config 字段的 JSON */
function ruleConfig(): string {
  return JSON.stringify({
    matchType: form.value.matchType,
    patterns: patternsOf(form.value.patternsText),
    action: "BLOCK",
    status: form.value.blockStatus,
    message: form.value.message,
  });
}

/** 保存规则（新增或更新） */
async function handleSubmit(): Promise<void> {
  const headerName = form.value.headerName.trim();
  if (!headerName) {
    ElMessage.warning(t("policy.header.errNameBlank"));
    return;
  }
  const patterns = patternsOf(form.value.patternsText);
  if (!patterns.length) {
    ElMessage.warning(t("policy.header.errPatternsEmpty"));
    return;
  }
  const payload: PolicyConfig = {
    type: "HEADER",
    bizKey: headerName,
    dimension: "",
    listType: 0,
    status: form.value.status,
    sort: 0,
    config: ruleConfig(),
    remark: form.value.remark,
  };
  if (isEdit.value && form.value.sysPolicyConfigId != null) {
    payload.sysPolicyConfigId = form.value.sysPolicyConfigId;
  }
  saving.value = true;
  try {
    if (isEdit.value && payload.sysPolicyConfigId != null) {
      await updatePolicyConfig(payload);
      ElMessage.success(t("policy.header.saved"));
    } else {
      await savePolicyConfig(payload);
      ElMessage.success(t("policy.header.created"));
    }
    dialogVisible.value = false;
    await tableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    saving.value = false;
  }
}

/**
 * 切换规则启停
 *
 * @param row 当前行
 * @param value 开关新值
 */
async function handleToggle(row: Record<string, unknown>, value: boolean | string | number): Promise<void> {
  const r = row as HeaderRuleRow;
  if (r.sysPolicyConfigId == null) {
    return;
  }
  toggleLoadingId.value = r.sysPolicyConfigId;
  try {
    await togglePolicyConfig(r.sysPolicyConfigId, value ? 1 : 0);
    ElMessage.success(value ? t("policy.header.enabledNow") : t("policy.header.stoppedNow"));
    await tableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.toggleFailed"));
  } finally {
    toggleLoadingId.value = null;
  }
}

/** 删除规则 */
async function handleDelete(row: Record<string, unknown>): Promise<void> {
  const r = row as HeaderRuleRow;
  if (r.sysPolicyConfigId == null) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      t("policy.header.deleteBody", { name: r.headerName }),
      t("policy.common.deleteConfirm"),
      { type: "warning" },
    );
  } catch {
    return;
  }
  deleteLoadingId.value = r.sysPolicyConfigId;
  try {
    await deletePolicyConfig(r.sysPolicyConfigId);
    ElMessage.success(t("policy.header.deletedNow"));
    await tableRef.value?.reload();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    deleteLoadingId.value = null;
  }
}

/** 重新从库装载全部规则（手工改过库之后用） */
async function handleRefresh(): Promise<void> {
  try {
    const res = await refreshHeaderRules();
    ElMessage.success(t("policy.header.reloaded", { count: res.data?.policyCount ?? 0 }));
    await tableRef.value?.reload();
    void loadHitCounts();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.reloadFailed"));
  }
}

loadPresets();

defineExpose({ reload: () => tableRef.value?.reload() });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">HEADER POLICY</span>
        <h2>{{ t("policy.nav.header.label") }}</h2>
        <i18n-t keypath="policy.header.desc" tag="p">
          <template #ua><code>User-Agent</code></template>
          <template #immediate><b>{{ t("policy.header.termImmediate") }}</b></template>
        </i18n-t>
      </div>
      <div class="policy-head-actions">
        <ReButton layout="modern" icon="Refresh" @click="handleRefresh">{{ t("policy.header.reload") }}</ReButton>
        <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">{{ t("policy.header.add") }}</ReButton>
      </div>
    </div>

    <div class="policy-contract">
      <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
      <div>
        <b>{{ t("policy.header.ruleTitle") }}</b>
        <span>
          <i18n-t keypath="policy.header.ruleDesc" tag="span">
            <template #bot><code>Googlebot</code></template>
            <template #headless><code>HeadlessChrome</code></template>
            <template #python><code>python-requests</code></template>
            <template #before><b>{{ t("policy.header.termBefore") }}</b></template>
            <template #pass><b>{{ t("policy.header.termPass") }}</b></template>
          </i18n-t>
        </span>
      </div>
      <ReTag effect="plain" round size="small">/v2/policy/header/list</ReTag>
    </div>

    <ReTable
      :layout-switch="false"
      ref="tableRef"
      table-id="policy-header"
      :loader="load"
      :columns="columns"
      :pagination="true"
      :total="total"
      v-model:page="page"
      v-model:page-size="pageSize"
      :toolbar-config="TABLE_TOOLBAR"
      row-key="sysPolicyConfigId"
      :empty-text="t('policy.header.empty')"
    >
      <template #matchType="{ row }">
        <ReTag effect="light" round size="small" :type="(row as HeaderRuleRow).parsed === false ? 'danger' : 'info'">
          {{ matchOptions.find((o) => o.value === (row as HeaderRuleRow).matchType)?.label ?? t("policy.header.match.CONTAINS.label") }}
        </ReTag>
      </template>
      <template #patterns="{ row }">
        <span class="policy-header-patterns">
          {{ ((row as HeaderRuleRow).patterns ?? []).join("、") || "-" }}
        </span>
      </template>
      <template #hit="{ row }">
        <PolicyHitCell
          type="HEADER"
          :hit-key="hitKeyOf(row as HeaderRuleRow)"
          :count="hitCount(row as HeaderRuleRow)"
          :label="t('policy.header.hitTitle', { name: (row as HeaderRuleRow).headerName ?? '' })"
        />
      </template>
      <template #status="{ row }">
        <ReSwitch
          layout="square"
          :model-value="(row as HeaderRuleRow).status === 1"
          :disabled="toggleLoadingId === (row as HeaderRuleRow).sysPolicyConfigId"
          :aria-label="t('policy.common.activeOf', { name: (row as HeaderRuleRow).headerName ?? '' })"
          @update:model-value="(v: boolean | string | number) => handleToggle(row, v)"
        />
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: (row as HeaderRuleRow).headerName ?? '' })" @click="handleEdit(row)" />
        <ReButton
          layout="square"
          type="danger"
          icon="Delete"
          :tip="t('policy.common.deleteOf', { name: (row as HeaderRuleRow).headerName ?? '' })"
          :loading="deleteLoadingId === (row as HeaderRuleRow).sysPolicyConfigId"
          @click="handleDelete(row)"
        />
      </template>
    </ReTable>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? t('policy.header.form.dialogEdit') : t('policy.header.form.dialogAdd')"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item :label="t('policy.header.form.name')" required>
          <ReInput
            v-model="form.headerName"
            layout="modern"
            maxlength="128"
            :disabled="isEdit"
            placeholder="User-Agent"
          />
          <i18n-t keypath="policy.header.form.nameDesc" tag="p" class="policy-form-tip">
            <template #ua><code>User-Agent</code></template>
          </i18n-t>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.matchType')">
          <el-radio-group v-model="form.matchType">
            <el-radio v-for="opt in matchOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
          <p class="policy-form-tip">{{ matchHint }}</p>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.patterns')" required>
          <ReInput
            v-model="form.patternsText"
            layout="modern"
            type="textarea"
            :rows="8"
            :placeholder="t('policy.header.phPatterns')"
          />
          <div class="policy-header-preset">
            <ReButton layout="text" type="primary" icon="MagicStick" @click="handleFillPresets">
              {{ t("policy.header.presetFill", { count: presets.flat.length }) }}
            </ReButton>
            <div v-if="Object.keys(presets.groups).length" class="policy-header-preset__groups">
              <span v-for="(items, group) in presets.groups" :key="group" class="policy-header-preset__group">
                <b>{{ group }}</b>
                <span>{{ items.join("、") }}</span>
              </span>
            </div>
          </div>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.blockStatus')">
          <el-select
            v-model="form.blockStatus"
            class="policy-header-status-select"
            :aria-label="t('policy.header.form.blockStatus')"
          >
            <el-option :value="403" :label="t('policy.header.form.blockDefault')" />
            <el-option :value="406" label="406 Not Acceptable" />
            <el-option :value="429" label="429 Too Many Requests" />
            <el-option :value="503" label="503 Service Unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.header.form.message')">
          <ReInput
            v-model="form.message"
            layout="modern"
            maxlength="200"
            :placeholder="t('policy.header.form.messagePh')"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('policy.header.form.active')">
          <ReSwitch v-model="form.status" layout="square" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="form.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
        <i18n-t keypath="policy.header.form.desc" tag="p" class="policy-global-form__tip">
          <template #immediate><b>{{ t("policy.header.termImmediateAll") }}</b></template>
        </i18n-t>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
        <ReButton
          type="primary"
          :loading="saving"
          :disabled="saving"
          @click="handleSubmit"
        >
          {{ t("policy.common.save") }}
        </ReButton>
      </template>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架（.policy-view / .policy-view__head / .policy-contract* /
   .policy-head-actions / 表格归一）由各页签共用，规则必须一致，
   放在这里由 PolicyGrayTab.vue 等组件一起引。 */
@use "../policyShared.scss";
</style>

<style scoped>
/* 以下都是消息头页签独有的版式。原先写在 PolicyTask.vue 的 scoped 块里，
   组件拆出来之后父级的 scoped 选择器一条都匹配不上（子组件模板里的元素带的是
   子组件自己的 scope id），所以必须跟着组件走。 */

/* 特征可能有几十条，表格里只给一行，鼠标悬停看全文 */
.policy-header-patterns {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-form-tip {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.policy-header-preset {
  margin-top: 6px;
}

.policy-header-preset__groups {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding: 6px 8px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 4px);
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  max-height: 150px;
  overflow: auto;
}
/* 只有里面的 b 有样式，.policy-header-preset__group 自身没有盒子样式 —— 这是有意的：
   它只是个分组标签的纯文本 span，装样子的边框/内边距都由外层 .policy-header-preset__groups 承担。
   样式归属审计会把它报成 ORPHAN（只在祖先位被引用），属预期结果，不要"补规则" */
.policy-header-preset__group b {
  color: var(--el-text-color-regular);
  margin-right: 4px;
}

.policy-header-status-select {
  width: 100%;
}
</style>
