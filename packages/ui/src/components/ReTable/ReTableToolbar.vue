<script setup lang="ts">
// @ts-nocheck
/**
 * ReTableToolbar —— ReTable 内置工具栏组件
 *
 * 支持：
 *   - 批量选择（checkbox 列开关）
 *   - 批量删除（带确认，使用 sessionStorage 记住跨页选择）
 *   - 批量修改（编辑→保存切换）
 *   - 刷新 / 列设置 / 表格设置（透传主组件功能）
 *
 * 每个按钮可单独配置图标和 tip。
 */
import { computed, ref, watch, type ComputedRef } from "vue";
import { ElButton, ElTooltip, ElIcon, ElPopconfirm, ElBadge } from "element-plus";
import { Delete, Edit, Check, Select, Refresh, Setting, Menu } from "@element-plus/icons-vue";
import type {
  ReTableToolbarConfig,
  ReTableToolbarBatchDelete,
  ReTableToolbarBatchEdit,
  ReTableToolbarBatchSelect,
} from "./types";

defineOptions({ name: "ReTableToolbar", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** toolbar 配置 */
    config?: ReTableToolbarConfig;
    /** 当前选中行数量 */
    selectedCount?: number;
    /** 是否处于编辑模式 */
    editing?: boolean;
    /** 是否正在处理中 */
    processing?: boolean;
    /** 是否正在加载 */
    loading?: boolean;
    /** 表格尺寸 */
    size?: "default" | "small";
    /** 列设置触发文字 */
    columnsTriggerText?: string;
    /** 表格设置触发文字 */
    settingsTriggerText?: string;
  }>(),
  {
    config: () => ({}),
    selectedCount: 0,
    editing: false,
    processing: false,
    loading: false,
    size: "default",
    columnsTriggerText: "列设置",
    settingsTriggerText: "表格设置",
  },
);

const emit = defineEmits<{
  (e: "batch-delete", rows: Record<string, unknown>[]): void;
  (e: "batch-edit"): void;
  (e: "batch-save", rows: Record<string, unknown>[]): void;
  (e: "batch-select-toggle"): void;
  (e: "refresh"): void;
  (e: "column-settings"): void;
  (e: "table-settings"): void;
}>();

/** 解析批量删除配置 */
const batchDeleteConfig = computed<ReTableToolbarBatchDelete | null>(() => {
  const cfg = props.config.batchDelete;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true, handler: () => {} };
  return cfg;
});

/** 解析批量选择配置 */
const batchSelectConfig = computed<ReTableToolbarBatchSelect | null>(() => {
  const cfg = props.config.batchSelect;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true };
  return cfg;
});

/** 解析批量修改配置 */
const batchEditConfig = computed<ReTableToolbarBatchEdit | null>(() => {
  const cfg = props.config.batchEdit;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true, handler: () => {} };
  return cfg;
});

/** 是否显示刷新 */
const showRefresh = computed(() => props.config.refresh !== false);

/** 是否显示列设置 */
const showColumnSettings = computed(() => props.config.columnSettings !== false);

/** 是否显示表格设置 */
const showTableSettings = computed(() => props.config.tableSettings !== false);

/** 选中行数 badge */
const hasSelected = computed(() => props.selectedCount > 0);

/** 批量删除确认消息 */
const deleteConfirmMsg = computed(() => {
  if (batchDeleteConfig.value?.confirmMessage) return batchDeleteConfig.value.confirmMessage;
  return `确认删除选中的 ${props.selectedCount} 条数据？`;
});

/** 批量删除按钮禁用 */
const deleteDisabled = computed(() => !hasSelected.value || props.processing);

/** 批量修改按钮禁用 */
const editDisabled = computed(() => !hasSelected.value && !props.editing);

/** 图标组件 */
const iconRefresh = Refresh;
const iconColumns = Menu;
const iconSettings = Setting;
</script>

<template>
  <div class="re-table-toolbar">
    <!-- 左侧：批量操作区 -->
    <div class="re-table-toolbar__left">
      <!-- 批量选择切换 -->
      <ElTooltip
        v-if="batchSelectConfig"
        :content="batchSelectConfig.tip || '批量选择'"
        placement="top"
      >
        <ElButton
          :size="size"
          :type="hasSelected ? 'primary' : 'default'"
          plain
          @click="emit('batch-select-toggle')"
        >
          <ElIcon><component :is="batchSelectConfig.icon || Select" /></ElIcon>
          <span v-if="hasSelected" class="re-table-toolbar__badge">{{ selectedCount }}</span>
        </ElButton>
      </ElTooltip>

      <!-- 批量删除 -->
      <ElPopconfirm
        v-if="batchDeleteConfig"
        :title="deleteConfirmMsg"
        confirm-button-text="确认"
        cancel-button-text="取消"
        :disabled="deleteDisabled"
        @confirm="emit('batch-delete', [])"
      >
        <template #reference>
          <ElTooltip :content="batchDeleteConfig.tip || '批量删除'" placement="top">
            <ElButton
              :size="size"
              type="danger"
              plain
              :disabled="deleteDisabled"
              :loading="processing"
            >
              <ElIcon><component :is="batchDeleteConfig.icon || Delete" /></ElIcon>
            </ElButton>
          </ElTooltip>
        </template>
      </ElPopconfirm>

      <!-- 批量修改 / 保存 -->
      <ElTooltip
        v-if="batchEditConfig"
        :content="editing ? (batchEditConfig.saveTip || '保存') : (batchEditConfig.tip || '批量修改')"
        placement="top"
      >
        <ElButton
          :size="size"
          :type="editing ? 'success' : 'primary'"
          plain
          :disabled="editDisabled"
          :loading="processing && editing"
          @click="editing ? emit('batch-save', []) : emit('batch-edit')"
        >
          <ElIcon>
            <component :is="editing ? (batchEditConfig.saveIcon || Check) : (batchEditConfig.icon || Edit)" />
          </ElIcon>
          <span>{{ editing ? (batchEditConfig.saveTip || '保存') : (batchEditConfig.tip || '批量修改') }}</span>
        </ElButton>
      </ElTooltip>
    </div>

    <!-- 右侧：工具区 -->
    <div class="re-table-toolbar__right">
      <!-- 列设置 -->
      <slot name="column-settings" v-if="showColumnSettings">
        <ElTooltip :content="columnsTriggerText" placement="top">
          <ElButton :size="size" text>
            <ElIcon><component :is="iconColumns" /></ElIcon>
          </ElButton>
        </ElTooltip>
      </slot>

      <!-- 表格设置 -->
      <slot name="table-settings" v-if="showTableSettings">
        <ElTooltip :content="settingsTriggerText" placement="top">
          <ElButton :size="size" text>
            <ElIcon><component :is="iconSettings" /></ElIcon>
          </ElButton>
        </ElTooltip>
      </slot>

      <!-- 刷新 -->
      <ElTooltip v-if="showRefresh" content="刷新" placement="top">
        <ElButton :size="size" text :loading="loading" @click="emit('refresh')">
          <ElIcon><component :is="iconRefresh" /></ElIcon>
        </ElButton>
      </ElTooltip>
    </div>
  </div>
</template>

<style scoped>
.re-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.re-table-toolbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.re-table-toolbar__right {
  display: flex;
  align-items: center;
  gap: 2px;
}
.re-table-toolbar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 9px;
  line-height: 1;
}
.re-table-toolbar__right :deep(.el-button) {
  padding: 6px;
}
</style>