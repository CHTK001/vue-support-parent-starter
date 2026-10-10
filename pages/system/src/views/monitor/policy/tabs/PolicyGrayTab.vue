<script setup lang="ts">
/**
 * 灰度配置页签
 *
 * <p>按业务键维护灰度规则：权重决定放量比例，命中策略以 JSON 描述用户/角色/IP 等条件。
 * 一行为一条配置，存于统一策略表 {@code type=GRAY}。</p>
 *
 * <p>状态、列定义、请求与弹窗都在本组件内闭环，父级只负责「什么时候挂载我」。</p>
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReDialog from "@repo/ui/re-dialog";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import {
  deletePolicyConfig,
  pagePolicyConfig,
  savePolicyConfig,
  togglePolicyConfig,
  updatePolicyConfig,
} from "../../../../api/systemApi";
import type { PolicyConfig } from "../../../../api/types";
import { TABLE_TOOLBAR, rowKeyOf, useFirstLoadGuard } from "../shared/policyTable";

const { t } = useI18n();
/** 首次 loader 返回前不展示空态，避免切进页签时闪一下「暂无灰度配置」 */
const { ready, markReady } = useFirstLoadGuard();

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

const tableRef = ref<TableReloadRef>();
const list = ref<PolicyConfig[]>([]);
const loading = ref(false);
const total = ref(0);
const toggleLoadingId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<PolicyConfig>({});
const query = ref({ page: 1, pageSize: 10, bizKey: "" });

const columns = computed<ReTableColumn[]>(() => [
  { prop: "bizKey", label: t("policy.gray.col.bizKey"), minWidth: 200, showOverflowTooltip: true },
  { prop: "weight", label: t("policy.gray.col.weight"), width: 100, align: "center" },
  { prop: "config", label: t("policy.gray.col.hitStrategy"), minWidth: 240, showOverflowTooltip: true },
  { prop: "status", label: t("policy.common.status"), width: 100, slot: "status", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: t("policy.common.action"), width: 190, slot: "action", fixed: "right", align: "center" },
]);

/**
 * 加载灰度配置分页
 *
 * <p>必须返回 {@link RePageResult}：ReTable 只认 loader 的返回值，不读外部 ref；
 * 写成 {@code Promise<void>} + 往本地 ref 塞数据会让表格永远空白。</p>
 *
 * @param params ReTable 传入的分页参数
 * @returns 分页结果
 */
async function load(params?: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const res = await pagePolicyConfig({
      type: "GRAY",
      page: params?.page ?? query.value.page,
      pageSize: params?.pageSize ?? query.value.pageSize,
      bizKey: query.value.bizKey || undefined,
    });
    const records = (res.data?.records ?? []) as PolicyConfig[];
    list.value = records;
    total.value = res.data?.total ?? 0;
    return { total: res.data?.total ?? 0, data: records as Record<string, unknown>[] };
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.gray.loadFailed"));
    throw error;
  } finally {
    loading.value = false;
    markReady();
  }
}

/** 打开新增灰度弹窗 */
function handleAdd(): void {
  isEdit.value = false;
  form.value = { type: "GRAY", dimension: "", listType: 0, status: 1, weight: 10, config: "{}", sort: 0 };
  dialogVisible.value = true;
}

/** 打开编辑灰度弹窗 */
function handleEdit(row: PolicyConfig): void {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
}

/** 保存灰度配置 */
async function handleSubmit(): Promise<void> {
  if (!form.value.bizKey) {
    message.warning(t("policy.gray.errKeyBlank"));
    return;
  }
  if (form.value.config) {
    try {
      JSON.parse(form.value.config);
    } catch {
      message.warning(t("policy.gray.errNotJson"));
      return;
    }
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updatePolicyConfig(form.value);
      message.success(t("policy.gray.saved"));
    } else {
      await savePolicyConfig(form.value);
      message.success(t("policy.gray.created"));
    }
    dialogVisible.value = false;
    // 走 ReTable 实例 reload()；直接调 load() 不会让表格重绘
    await tableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    saving.value = false;
  }
}

/**
 * 切换灰度启停
 *
 * @param row 当前行
 * @param value 开关新值
 */
async function handleToggle(row: PolicyConfig, value: boolean | string | number): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  toggleLoadingId.value = row.sysPolicyConfigId;
  try {
    await togglePolicyConfig(row.sysPolicyConfigId, value ? 1 : 0);
    message.success(value ? t("policy.common.enabled") : t("policy.common.stopped"));
    await tableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.toggleFailed"));
  } finally {
    toggleLoadingId.value = null;
  }
}

/** 删除灰度配置 */
async function handleDelete(row: PolicyConfig): Promise<void> {
  if (row.sysPolicyConfigId == null) return;
  try {
    await ElMessageBox.confirm(
      t("policy.gray.deleteBody", { key: row.bizKey }),
      t("policy.common.deleteConfirm"),
      { type: "warning" },
    );
  } catch {
    return;
  }
  deleteLoadingId.value = row.sysPolicyConfigId;
  try {
    await deletePolicyConfig(row.sysPolicyConfigId);
    message.success(t("policy.common.deleted"));
    await load();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    deleteLoadingId.value = null;
  }
}

defineExpose({ reload: () => tableRef.value?.reload() });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">GRAY RELEASE</span>
        <h2>{{ t("policy.nav.gray.label") }}</h2>
        <p>{{ t("policy.gray.desc") }}</p>
      </div>
      <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">{{ t("policy.gray.add") }}</ReButton>
    </div>

    <div class="policy-contract">
      <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
      <div>
        <b>{{ t("policy.gray.landing") }}</b>
        <span>
          <i18n-t keypath="policy.gray.landingDesc" tag="span">
            <template #table><code>type=GRAY</code></template>
          </i18n-t>
        </span>
      </div>
      <ReTag effect="plain" round>/v2/policy/config/page?type=GRAY</ReTag>
    </div>

    <ReTable
      :layout-switch="false"
      ref="tableRef"
      :loader="load"
      :columns="columns"
      :pagination="true"
      :params="query"
      row-key="sysPolicyConfigId"
      :total="total"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :toolbar-config="TABLE_TOOLBAR"
      :empty-text="t('policy.gray.empty')"
    >
      <template #status="{ row }">
        <ReSwitch
          layout="square"
          :model-value="(row as PolicyConfig).status === 1"
          :disabled="toggleLoadingId === (row as PolicyConfig).sysPolicyConfigId"
          :aria-label="t('policy.gray.enableOf', { key: (row as PolicyConfig).bizKey ?? '' })"
          @update:model-value="(v: boolean | string | number) => handleToggle(row as PolicyConfig, v)"
        />
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleEdit(row as PolicyConfig)" />
        <ReButton
          layout="square"
          type="danger"
          icon="Delete"
          :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
          :loading="deleteLoadingId === (row as PolicyConfig).sysPolicyConfigId"
          @click="handleDelete(row as PolicyConfig)"
        />
      </template>
      <!-- 首次 loader 返回前不渲染空态，避免闪一下「暂无灰度配置」 -->
      <template #empty>
        <p v-if="ready" class="policy-table-empty">{{ t("policy.gray.empty") }}</p>
      </template>
    </ReTable>



    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? t('policy.gray.form.dialogEdit') : t('policy.gray.form.dialogAdd')"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
    >
      <el-form label-width="110px" label-position="right">
        <el-form-item :label="t('policy.gray.form.bizKey')" required>
          <ReInput v-model="form.bizKey" layout="modern" maxlength="255" :disabled="isEdit" :placeholder="t('policy.gray.form.bizKeyPh')" :aria-label="t('policy.gray.form.bizKey')" />
        </el-form-item>
        <el-form-item :label="t('policy.gray.form.weight')">
          <ReInputNumber v-model="form.weight" :min="0" :max="100" :precision="0" controls-position="right" :aria-label="t('policy.gray.form.weight')" />
        </el-form-item>
        <el-form-item :label="t('policy.gray.form.sort')">
          <ReInputNumber v-model="form.sort" :min="0" :precision="0" controls-position="right" :aria-label="t('policy.gray.form.sort')" />
        </el-form-item>
        <el-form-item :label="t('policy.gray.form.hitStrategy')">
          <ReInput v-model="form.config" layout="modern" type="textarea" :rows="4" :placeholder="t('policy.gray.form.hitStrategyPh')" :aria-label="t('policy.gray.form.hitStrategy')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.enable')">
          <ReSwitch v-model="form.status" layout="square" :active-value="1" :inactive-value="0" :aria-label="t('policy.common.enable')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="form.remark" layout="modern" type="textarea" :rows="2" maxlength="500" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">{{ t("policy.common.cancel") }}</ReButton>
        <ReButton type="primary" :loading="saving" :disabled="saving" @click="handleSubmit">{{ t("policy.common.save") }}</ReButton>
      </template>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：本组件的模板里渲染 .policy-view / .policy-view__head /
   .policy-section__eyebrow / .policy-contract*，而这些规则原先写在
   PolicyTask.vue 的 <style scoped> 里。scoped 只对本组件模板的元素生效，
   父组件的规则匹配不到子组件内部 —— 拆出来就是裸排版。
   所以共用规则放全局共享表，各组件用非 scoped 的 style 块引进来。 */
@use "../policyShared.scss";
</style>
