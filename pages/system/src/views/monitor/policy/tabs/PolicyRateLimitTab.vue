<script setup lang="ts">
/**
 * 限流策略页签
 *
 * <p>三个维度（接口 / IP / 账号）共用一张规则表 + 一份「全局配置」。
 * 规则命中后使用 QPS 令牌桶；突发参数当前仅保存配置，不参与令牌桶容量计算 ——
 * 这一点在页面上明写了，免得以为 burst 已经在生效。</p>
 *
 * <p>白名单是「放行豁免」不是准入名单：命中的 IP 跳过限流，
 * 未列入任何名单的 IP 仍默认放行。</p>
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessageBox } from "element-plus";
import { Setting, WarningFilled } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReDialog from "@repo/ui/re-dialog";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  applyRateLimitGlobal,
  deleteRateLimit,
  getRateLimitGlobal,
  listRateLimit,
  saveRateLimit,
  updateRateLimit,
} from "../../../../api/systemApi";
import type { RateLimitGlobal, RateLimitRule } from "../../../../api/types";
import { TABLE_TOOLBAR, rowKeyOf, useFirstLoadGuard } from "../shared/policyTable";
import { usePolicyHitContext } from "../composables/policyHitContext";
import PolicyHitCell from "../components/PolicyHitCell.vue";

const { t } = useI18n();
const { rateHitKey, loadHitCounts } = usePolicyHitContext();
/** 首次加载返回前不展示空态，避免切进页签时闪一下「暂无接口规则」 */
const { ready, markReady } = useFirstLoadGuard();

type RateDimension = NonNullable<RateLimitRule["dimension"]>;

const dimension = ref<RateDimension>("interface");
const list = ref<RateLimitRule[]>([]);
const loading = ref(false);
const toggleLoadingId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
const globalConfig = ref<RateLimitGlobal>({ enabled: false, qps: 100, burstSize: 200, dimension: "global" });
const globalLoading = ref(false);
const globalApplying = ref(false);
const globalDialogVisible = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<RateLimitRule>({});

const dims = computed(() => [
  { name: "interface", label: t("policy.nav.rate.interface") },
  { name: "ip", label: t("policy.nav.rate.ip") },
  { name: "account", label: t("policy.nav.rate.account") },
]);

/** 当前维度的标题 / 说明 / 匹配目标提示 */
const meta = computed(() => {
  const map: Record<RateDimension, { title: string; description: string; target: string }> = {
    interface: {
      title: t("policy.rate.meta.interface.title"),
      description: t("policy.rate.meta.interface.description"),
      target: t("policy.rate.meta.interface.target"),
    },
    ip: {
      title: t("policy.rate.meta.ip.title"),
      description: t("policy.rate.meta.ip.description"),
      target: t("policy.rate.meta.ip.target"),
    },
    account: {
      title: t("policy.rate.meta.account.title"),
      description: t("policy.rate.meta.account.description"),
      target: t("policy.rate.meta.account.target"),
    },
  };
  return map[dimension.value];
});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "target", label: t("policy.common.matchTarget"), minWidth: 220, showOverflowTooltip: true },
  { prop: "qps", label: "QPS", width: 100, align: "center" },
  { prop: "burstSize", label: t("policy.common.burst"), width: 110, align: "center" },
  { prop: "enabled", label: t("policy.rate.col.runStatus"), width: 110, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 160, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), width: 170 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

/** 加载当前维度的规则 */
async function loadList(): Promise<void> {
  loading.value = true;
  try {
    const res = await listRateLimit(dimension.value);
    list.value = res.data ?? [];
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.rate.loadRulesFailed"));
  } finally {
    loading.value = false;
    markReady();
  }
}

/** 加载全局配置 */
async function loadGlobal(): Promise<void> {
  globalLoading.value = true;
  try {
    const res = await getRateLimitGlobal();
    globalConfig.value = res.data ?? { enabled: false, qps: 100, burstSize: 200, dimension: "global" };
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.rate.loadGlobalFailed"));
  } finally {
    globalLoading.value = false;
  }
}

/** 全量加载：全局配置 + 当前维度规则 */
async function load(): Promise<void> {
  await Promise.all([loadGlobal(), loadList()]);
}

/**
 * 校验 QPS 与突发值
 *
 * @param qps 每秒请求数
 * @param burstSize 突发容量
 * @returns 是否合法
 */
function validateValues(qps: number | undefined, burstSize: number | undefined): boolean {
  if (!Number.isInteger(qps) || (qps ?? 0) <= 0) {
    message.warning(t("policy.rate.errQps"));
    return false;
  }
  if (!Number.isInteger(burstSize) || (burstSize ?? -1) < 0) {
    message.warning(t("policy.rate.errBurst"));
    return false;
  }
  return true;
}

/** 应用全局配置 */
async function handleApplyGlobal(): Promise<boolean> {
  if (globalApplying.value) return false;
  if (!validateValues(globalConfig.value.qps, globalConfig.value.burstSize)) return false;

  globalApplying.value = true;
  try {
    const res = await applyRateLimitGlobal({
      ...globalConfig.value,
      qps: Number(globalConfig.value.qps),
      burstSize: Number(globalConfig.value.burstSize),
      dimension: globalConfig.value.dimension || "global",
    });
    message.success(res.data || t("policy.rate.globalApplied"));
    await loadGlobal();
    return true;
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.rate.globalApplyFailed"));
    return false;
  } finally {
    globalApplying.value = false;
  }
}

/** 应用全局配置并关闭弹窗 */
async function handleApplyGlobalAndClose(): Promise<void> {
  if (await handleApplyGlobal()) {
    globalDialogVisible.value = false;
  }
}

/** 打开新增规则弹窗 */
function handleAdd(): void {
  isEdit.value = false;
  form.value = { dimension: dimension.value, enabled: 1, qps: 100, burstSize: 200 };
  dialogVisible.value = true;
}

/** 打开编辑规则弹窗 */
function handleEdit(row: RateLimitRule): void {
  isEdit.value = true;
  form.value = { ...row, dimension: row.dimension ?? dimension.value, enabled: row.enabled === 1 ? 1 : 0 };
  dialogVisible.value = true;
}

/** 保存规则（新增或更新） */
async function handleSubmit(): Promise<void> {
  const target = form.value.target?.trim() ?? "";
  if (!target) {
    message.warning(meta.value.target);
    return;
  }
  if (target.length > 500) {
    message.warning(t("policy.rate.errTargetTooLong"));
    return;
  }
  if (!validateValues(form.value.qps, form.value.burstSize)) return;

  saving.value = true;
  try {
    const payload: RateLimitRule = {
      ...form.value,
      target,
      qps: Number(form.value.qps),
      burstSize: Number(form.value.burstSize),
      enabled: form.value.enabled === 1 ? 1 : 0,
    };
    const res = isEdit.value ? await updateRateLimit(payload) : await saveRateLimit(payload);
    if (res.data === false) throw new Error(isEdit.value ? t("policy.rate.errNotUpdated") : t("policy.rate.errNotCreated"));
    message.success(isEdit.value ? t("policy.rate.saved") : t("policy.rate.created"));
    dialogVisible.value = false;
    await loadList();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
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
async function handleToggle(row: RateLimitRule, value: boolean | string | number): Promise<void> {
  const id = row.sysRateLimitRuleId;
  if (id == null || toggleLoadingId.value != null) return;
  const enabled: 0 | 1 = value ? 1 : 0;
  toggleLoadingId.value = id;
  try {
    const res = await updateRateLimit({ ...row, enabled });
    if (res.data === false) throw new Error(t("policy.rate.errStatusNotUpdated"));
    message.success(enabled === 1 ? t("policy.rate.ruleEnabled") : t("policy.rate.ruleStopped"));
    await loadList();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.rate.statusFailed"));
  } finally {
    toggleLoadingId.value = null;
  }
}

/** 删除规则 */
async function handleDelete(row: RateLimitRule): Promise<void> {
  const id = row.sysRateLimitRuleId;
  if (id == null || deleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(
      t("policy.rate.deleteBody", { target: row.target ?? "-" }),
      t("policy.rate.deleteTitle"),
      { type: "warning", confirmButtonText: t("policy.common.remove"), cancelButtonText: t("policy.common.cancel") },
    );
  } catch {
    return;
  }
  deleteLoadingId.value = id;
  try {
    const res = await deleteRateLimit(id);
    if (res.data === false) throw new Error(t("policy.rate.errNotDeleted"));
    message.success(t("policy.rate.deleted"));
    await loadList();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    deleteLoadingId.value = null;
  }
}

/** 切换维度：换一张规则表，并重取一次命中统计（键随维度变） */
async function handleDimChange(): Promise<void> {
  await loadList();
  void loadHitCounts();
}

void load();

defineExpose({ reload: load });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">TRAFFIC CONTROL</span>
        <h2>{{ t("policy.nav.ratelimit.label") }}</h2>
        <p>{{ t("policy.rate.desc") }}</p>
      </div>
      <div class="policy-head-actions">
        <button
          type="button"
          class="policy-global-trigger"
          :class="{ 'is-on': globalConfig.enabled }"
          :aria-label="t('policy.rate.globalAria', { state: globalConfig.enabled ? t('policy.rate.on') : t('policy.rate.off') })"
          @click="globalDialogVisible = true"
        >
          <el-icon :size="18"><Setting /></el-icon>
          <span class="policy-global-trigger__body">
            <small>{{ t("policy.rate.global") }}</small>
            <b>{{ globalConfig.enabled ? t("policy.rate.on") : t("policy.rate.off") }}</b>
          </span>
          <span class="policy-global-trigger__meta">QPS {{ globalConfig.qps ?? "—" }}</span>
        </button>
      </div>
    </div>

    <ReTab
      v-model="dimension"
      :tabs="dims"
      variant="capsule"
      nav-only
      class="policy-subnav"
      @tab-change="handleDimChange"
    />

    <div class="policy-list-head">
      <div>
        <h3>{{ meta.title }}</h3>
        <p>{{ meta.description }}</p>
      </div>
      <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">{{ t("policy.rate.add") }}</ReButton>
    </div>

    <!-- 全局上限关着时的提示。两层限流是并列的（全局总上限 + 各规则自己的桶），
         不是闸门关系：规则读的是规则缓存，后端不读全局开关，
         所以「全局关闭」只意味着没有系统级总上限，规则照常生效。
         2026-10-01 实测确认（全局 enabled=false 时规则仍 429）。 -->
    <p v-if="!globalConfig.enabled" class="policy-gate-off-notice">
      <el-icon :size="14"><WarningFilled /></el-icon>
      <span>{{ t("policy.rate.globalOffNotice") }}</span>
    </p>

    <ReTable
      :layout-switch="false"
      :data="list"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      :toolbar-config="TABLE_TOOLBAR"
      row-key="sysRateLimitRuleId"
      :empty-text="t('policy.rate.empty', { name: meta.title })"
    >
      <template #status="{ row }">
        <ReSwitch
          layout="square"
          :model-value="(row as RateLimitRule).enabled === 1"
          :disabled="toggleLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
          :aria-label="t('policy.common.enableOf', { name: (row as RateLimitRule).target ?? '' })"
          @update:model-value="(value: boolean | string | number) => handleToggle(row as RateLimitRule, value)"
        />
      </template>
      <template #hit="{ row }">
        <PolicyHitCell
          type="RATE_LIMIT"
          :hit-key="rateHitKey(row as RateLimitRule)"
          :label="t('policy.rate.hitTitle', { target: (row as RateLimitRule).target ?? '' })"
        />
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleEdit(row as RateLimitRule)" />
        <ReButton
          layout="square"
          type="danger"
          icon="Delete"
          :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
          :loading="deleteLoadingId === (row as RateLimitRule).sysRateLimitRuleId"
          @click="handleDelete(row as RateLimitRule)"
        />
      </template>
      <!-- 首次加载返回前不渲染空态，避免闪一下「暂无XXX规则」 -->
      <template #empty>
        <p v-if="ready" class="policy-table-empty">{{ t("policy.rate.empty", { name: meta.title }) }}</p>
      </template>
    </ReTable>

    <!-- 全局限流配置弹窗 -->
    <ReDialog
      v-model="globalDialogVisible"
      :title="t('policy.rate.globalDialog.title')"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <div class="policy-global-form">
        <div class="policy-global-form__row">
          <div>
            <b>{{ t("policy.rate.globalDialog.enable") }}</b>
            <span>{{ t("policy.rate.globalDialog.enableDesc") }}</span>
          </div>
          <ReSwitch v-model="globalConfig.enabled" layout="square" :aria-label="t('policy.rate.globalDialog.enableAria')" />
        </div>
        <label class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.qps") }}</b>
          <ReInputNumber
            v-model="globalConfig.qps"
            :min="1"
            :precision="0"
            controls-position="right"
            :aria-label="t('policy.rate.globalDialog.qps')"
          />
        </label>
        <label class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.burst") }}</b>
          <ReInputNumber
            v-model="globalConfig.burstSize"
            :min="0"
            :precision="0"
            controls-position="right"
            :aria-label="t('policy.rate.globalDialog.burstAria')"
          />
        </label>
        <div class="policy-global-form__row">
          <b>{{ t("policy.rate.globalDialog.domain") }}</b>
          <ReTag effect="plain" round>global</ReTag>
        </div>
        <p class="policy-global-form__tip">
          {{ t("policy.rate.globalDialog.domainDesc") }}
        </p>
      </div>
      <template #footer>
        <ReButton @click="globalDialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
        <ReButton
          type="primary"
          :loading="globalApplying"
          :disabled="globalApplying"
          @click="handleApplyGlobalAndClose"
        >
          {{ t("policy.rate.globalDialog.apply") }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- 限流规则弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? t('policy.rate.dialogEdit') : t('policy.rate.dialogAdd')"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false" @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item :label="t('policy.rate.dimLabel')">
          <el-select v-model="form.dimension" style="width: 100%" :disabled="isEdit" :aria-label="t('policy.rate.dimLabel')">
            <el-option :label="t('policy.rate.dimInterface')" value="interface" />
            <el-option label="IP" value="ip" />
            <el-option :label="t('policy.rate.dimAccount')" value="account" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.common.matchTarget')" required>
          <ReInput v-model="form.target" layout="modern" maxlength="500" :placeholder="meta.target" :aria-label="t('policy.common.matchTarget')" />
        </el-form-item>
        <el-form-item label="QPS">
          <ReInputNumber v-model="form.qps" :min="1" :precision="0" controls-position="right" style="width: 100%" :aria-label="t('policy.rate.ruleQps')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.burst')">
          <ReInputNumber v-model="form.burstSize" :min="0" :precision="0" controls-position="right" style="width: 100%" :aria-label="t('policy.rate.ruleBurst')" />
        </el-form-item>
        <el-form-item :label="t('policy.rate.enableRule')">
          <div class="policy-switch-field">
            <ReSwitch
              layout="square"
              :model-value="form.enabled === 1"
              :aria-label="t('policy.rate.enableRuleAria')"
              @update:model-value="(value: boolean | string | number) => (form.enabled = value ? 1 : 0)"
            />
            <span>{{ form.enabled === 1 ? t("policy.rate.keepEnabled") : t("policy.rate.keepDisabled") }}</span>
          </div>
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="form.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架由各页签共用，规则必须一致，放在共享表里一起引。 */
@use "../policyShared.scss";
</style>

<style scoped>
/* 以下都是限流页签独有的版式，拆出来之后父级的 scoped 规则匹配不到，必须跟着组件走。 */

/* 全局闸门关闭时的横幅。用警示色而不复用 .policy-global-form__tip 的中性灰：
   那条是「解释」，这条说的是「你配的东西现在没在跑」，属于要处理的状态。
   图标与文字同一基线排布，窄屏时文字换行、图标不缩。 */
.policy-gate-off-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  font-size: 12px;
  line-height: 1.6;
}
.policy-gate-off-notice :deep(.el-icon) { margin-top: 2px; flex: none; }
.policy-gate-off-notice span { min-width: 0; }

/* 全局配置触发器：像一个可点开的设置入口，
   开关状态用左边框色与底色区分，不靠文字颜色（文字还有「开 / 关」两态） */
.policy-global-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.policy-global-trigger:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.policy-global-trigger.is-on {
  border-color: var(--el-color-success-light-7);
  background: var(--el-color-success-light-9);
}
.policy-global-trigger__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}
.policy-global-trigger__body small { color: var(--el-text-color-secondary); font-size: 11px; }
.policy-global-trigger__body b { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; }
.policy-global-trigger__meta {
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.policy-global-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.policy-global-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.policy-global-form__row:last-of-type { border-bottom: none; }
.policy-global-form__row b { color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; }
.policy-global-form__row span { display: block; margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; }
.policy-global-form__row :deep(.rm-input-number) { width: 180px; }

@media screen and (max-width: 768px) {
  .policy-global-form__row { flex-direction: column; align-items: flex-start; }
  .policy-global-form__row :deep(.rm-input-number) { width: 100%; }
}
</style>
