<script setup lang="ts">
/**
 * 热更新配置页签
 *
 * <p>维护 hot_reload 分组的运行时设置：带 ID 保存为更新，无 ID 保存为新增。
 * 支持 string / number / boolean / json 四种值类型，事务提交后清理 hot_reload 缓存
 * 并通过 AOP 让读取方拿到最新值。</p>
 *
 * <p>状态、校验、请求与弹窗都在本组件内闭环，父级只负责「什么时候挂载我」。</p>
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import { listHotReload, reloadHotReload, saveHotReload, deleteHotReload } from "../../../../api/systemApi";
import type { HotReloadConfig } from "../../../../api/types";
import { TABLE_TOOLBAR, rowKeyOf, useFirstLoadGuard } from "../shared/policyTable";

const { t } = useI18n();
/** 首次加载返回前不展示空态，避免切进页签时闪一下「暂无热更新配置」 */
const { ready, markReady } = useFirstLoadGuard();

const list = ref<HotReloadConfig[]>([]);
const loading = ref(false);
const reloading = ref(false);
const info = ref<{ enabledCount: number; reloadTime: string } | null>(null);
const dialogVisible = ref(false);
const saving = ref(false);
/** 正在删除的配置主键；null 表示没有删除在进行 */
const deletingId = ref<number | null>(null);
const isEdit = ref(false);
const form = ref<HotReloadConfig>({});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "sysSettingName", label: t("policy.hotreload.col.name"), minWidth: 150 },
  { prop: "sysSettingCode", label: t("policy.hotreload.col.code"), minWidth: 180, showOverflowTooltip: true },
  { prop: "sysSettingValue", label: t("policy.hotreload.col.value"), minWidth: 180, slot: "value", showOverflowTooltip: true },
  { prop: "sysSettingValueType", label: t("policy.hotreload.col.type"), width: 100, slot: "type", align: "center" },
  { prop: "sysSettingRemark", label: t("policy.common.remark"), minWidth: 160, showOverflowTooltip: true },
  { prop: "action", label: t("policy.common.action"), width: 110, slot: "action", fixed: "right", align: "center" },
]);

/** 加载热更新配置 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const res = await listHotReload();
    list.value = res.data ?? [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.hotreload.loadFailed"));
  } finally {
    loading.value = false;
    markReady();
  }
}

/** 立即热重载：重载全部运行时配置并刷新列表 */
async function handleReload(): Promise<void> {
  if (reloading.value) return;
  reloading.value = true;
  try {
    const res = await reloadHotReload();
    info.value = {
      enabledCount: res.data?.enabledCount ?? 0,
      reloadTime: res.data?.reloadTime ?? new Date().toLocaleTimeString(),
    };
    ElMessage.success(t("policy.hotreload.reloaded", { count: info.value.enabledCount }));
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.hotreload.reloadFailed"));
  } finally {
    reloading.value = false;
  }
}

/** 打开新增弹窗 */
function handleAdd(): void {
  isEdit.value = false;
  form.value = { sysSettingValueType: "string", sysSettingStatus: 1 };
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: HotReloadConfig): void {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
}

/**
 * 删除热更新配置
 *
 * <p>其余 5 个策略页签都有删除入口，本页此前只有编辑（配错了清不掉）。2026-10-01 补齐。</p>
 *
 * @param row 配置行
 */
async function handleDelete(row: HotReloadConfig): Promise<void> {
  const id = row.sysSettingId;
  if (id == null || deletingId.value != null) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      t("policy.hotreload.deleteBody", { name: row.sysSettingName ?? row.sysSettingCode ?? "-" }),
      t("policy.hotreload.deleteTitle"),
      { type: "warning", confirmButtonText: t("policy.common.remove"), cancelButtonText: t("policy.common.cancel") },
    );
  } catch {
    return;
  }
  deletingId.value = id;
  try {
    const res = await deleteHotReload(id);
    if (res.data === false) {
      throw new Error(t("policy.hotreload.errNotDeleted"));
    }
    ElMessage.success(t("policy.hotreload.deleted"));
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    deletingId.value = null;
  }
}

/**
 * 按声明的类型校验值
 *
 * <p>类型是用户自己选的，不校验就会出现「声明 number 却存了 abc」这种脏数据，
 * 运行时按 number 读会得到 NaN，比直接拒绝难查得多。</p>
 *
 * @param value 原始值
 * @param type 声明的类型
 * @returns 错误文案；合法返回 null
 */
function validateValue(value: string | undefined, type: string | undefined): string | null {
  const raw = value ?? "";
  if (type === "number" && !Number.isFinite(Number(raw))) return t("policy.hotreload.errNotNumber");
  if (type === "boolean" && !["true", "false"].includes(raw)) return t("policy.hotreload.errNotBoolean");
  if (type === "json") {
    try {
      JSON.parse(raw);
    } catch {
      return t("policy.hotreload.errNotJson");
    }
  }
  return null;
}

/** 保存配置（新增或更新） */
async function handleSubmit(): Promise<void> {
  const name = form.value.sysSettingName?.trim() ?? "";
  const code = form.value.sysSettingCode?.trim() ?? "";
  if (!name || !code) {
    ElMessage.warning(t("policy.hotreload.errValue"));
    return;
  }
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(code)) {
    ElMessage.warning(t("policy.hotreload.errCode"));
    return;
  }
  const valueError = validateValue(form.value.sysSettingValue, form.value.sysSettingValueType);
  if (valueError) {
    ElMessage.warning(valueError);
    return;
  }

  saving.value = true;
  try {
    const res = await saveHotReload({ ...form.value, sysSettingName: name, sysSettingCode: code });
    if (res.data === false) throw new Error(t("policy.hotreload.errDuplicate"));
    ElMessage.success(isEdit.value ? t("policy.hotreload.saved") : t("policy.hotreload.created"));
    dialogVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    saving.value = false;
  }
}

void load();

defineExpose({ reload: load });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">HOT RELOAD</span>
        <h2>{{ t("policy.hotreload.title") }}</h2>
        <i18n-t keypath="policy.hotreload.desc" tag="p">
          <template #hotReload><code>hot_reload</code></template>
        </i18n-t>
      </div>
      <div class="policy-head-actions">
        <ReButton
          layout="modern"
          icon="Refresh"
          :loading="reloading"
          @click="handleReload"
        >
          {{ t("policy.hotreload.reloadNow") }}
        </ReButton>
        <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">{{ t("policy.hotreload.add") }}</ReButton>
      </div>
    </div>

    <div class="policy-contract">
      <div class="policy-contract__icon"><el-icon :size="18"><InfoFilled /></el-icon></div>
      <div>
        <b>{{ t("policy.hotreload.contract") }}</b>
        <span>
          {{ t("policy.hotreload.contractDesc") }}
          <template v-if="info">
            {{ t("policy.hotreload.lastReload", { time: info.reloadTime, count: info.enabledCount }) }}
          </template>
        </span>
      </div>
      <ReTag effect="plain" round >POST /v2/policy/hotreload/reload</ReTag>
    </div>

    <ReTable
      :layout-switch="false"
      :data="list"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      :toolbar-config="TABLE_TOOLBAR"
      row-key="sysSettingId"
      :empty-text="t('policy.hotreload.empty')"
    >
      <template #value="{ row }">
        <code class="policy-value">{{ (row as HotReloadConfig).sysSettingValue || "-" }}</code>
      </template>
      <template #type="{ row }">
        <ReTag effect="light" round >{{ (row as HotReloadConfig).sysSettingValueType || "string" }}</ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleEdit(row as HotReloadConfig)" />
        <ReButton
          layout="square"
          type="danger"
          icon="Delete"
          :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
          :loading="deletingId === (row as HotReloadConfig).sysSettingId"
          @click="handleDelete(row as HotReloadConfig)"
        />
      </template>
      <!-- 首次加载返回前不渲染空态，避免闪一下「暂无热更新配置」 -->
      <template #empty>
        <p v-if="ready" class="policy-table-empty">{{ t("policy.hotreload.empty") }}</p>
      </template>
    </ReTable>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? t('policy.hotreload.dialogEdit') : t('policy.hotreload.dialogAdd')"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false" @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <!-- 每个控件都补 aria-label：el-form-item 的 label 只是「视觉标签」，
             它不生成 for/id 关联，读屏拿不到控件名。 -->
        <el-form-item :label="t('policy.hotreload.col.name')" required>
          <ReInput v-model="form.sysSettingName" layout="modern" maxlength="100" :placeholder="t('policy.hotreload.phName')" :aria-label="t('policy.hotreload.col.name')" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.col.code')" required>
          <ReInput v-model="form.sysSettingCode" layout="modern" maxlength="100" placeholder="feature.flag" :aria-label="t('policy.hotreload.col.code')" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.col.value')">
          <ReInput v-model="form.sysSettingValue" layout="modern" type="textarea" :rows="3" :placeholder="t('policy.hotreload.phValue')" :aria-label="t('policy.hotreload.col.value')" />
        </el-form-item>
        <el-form-item :label="t('policy.hotreload.formValueType')">
          <el-select v-model="form.sysSettingValueType" style="width: 100%" :aria-label="t('policy.hotreload.formValueType')">
            <el-option :label="t('policy.hotreload.typeString')" value="string" />
            <el-option :label="t('policy.hotreload.typeNumber')" value="number" />
            <el-option :label="t('policy.hotreload.typeBoolean')" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="form.sysSettingRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架由各页签共用，规则必须一致，放在共享表里一起引。 */
@use "../policyShared.scss";
</style>
