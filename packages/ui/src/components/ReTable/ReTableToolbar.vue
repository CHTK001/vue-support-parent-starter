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
 * 分区模式（mode）：
 *   - "batch"  仅左侧批量操作按钮（用于表格上方的工具栏）
 *   - "tools"  仅右侧工具区（刷新 / 列设置 / 表格设置，用于分页行）
 *   - "full"   左右两侧都渲染（默认，兼容旧用法）
 *
 * 每个按钮可单独配置图标和 tip。
 */
import { computed } from "vue";
import { ElPopconfirm, ElBadge } from "element-plus";
import { Delete, Edit, Check, Select, Search, View, Hide } from "@element-plus/icons-vue";
import ReButton from "../ReButton/ReButton.vue";
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
    size?: "default" | "small" | "mini";
    /** 列设置触发文字 */
    columnsTriggerText?: string;
    /** 表格设置触发文字 */
    settingsTriggerText?: string;
    /** 分区模式：batch=仅批量按钮(表格上方)，tools=仅工具区(分页行)，full=全部(默认) */
    mode?: "batch" | "tools" | "full";
    /** 是否显示搜索开关按钮 */
    showSearch?: boolean;
    /** 搜索区当前是否显示 */
    searchVisible?: boolean;
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
    mode: "full",
    showSearch: false,
    searchVisible: true,
  },
);

const emit = defineEmits<{
  (e: "batch-delete", rows: Record<string, unknown>[]): void;
  (e: "batch-edit"): void;
  (e: "batch-save", rows: Record<string, unknown>[]): void;
  (e: "batch-select-toggle"): void;
  (e: "refresh"): void;
  (e: "toggle-search"): void;
  (e: "column-settings"): void;
  (e: "table-settings"): void;
}>();

/** 工具按钮尺寸：ReButton 只有 large/default/small，mini 归一为 small */
const btnSize = computed<"large" | "default" | "small">(() =>
  props.size === "mini" ? "small" : props.size ?? "default",
);

/** 解析批量删除配置（enabled: false 时不显示） */
const batchDeleteConfig = computed<ReTableToolbarBatchDelete | null>(() => {
  const cfg = props.config.batchDelete;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true, handler: () => {} };
  if (cfg.enabled === false) return null;
  return cfg;
});

/** 解析批量选择配置（enabled: false 时不显示） */
const batchSelectConfig = computed<ReTableToolbarBatchSelect | null>(() => {
  const cfg = props.config.batchSelect;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true };
  if (cfg.enabled === false) return null;
  return cfg;
});

/** 解析批量修改配置（enabled: false 时不显示） */
const batchEditConfig = computed<ReTableToolbarBatchEdit | null>(() => {
  const cfg = props.config.batchEdit;
  if (!cfg) return null;
  if (cfg === true) return { enabled: true, handler: () => {} };
  if (cfg.enabled === false) return null;
  return cfg;
});

/**
 * 把「布尔 | 按钮配置对象」归一成 { enabled, tip, icon, handler }。
 *
 * <p>三个工具按钮（刷新 / 列设置 / 表格设置）与批量按钮统一成同一套写法：
 * 传 true/false 是开关，传对象就能挂 handler 与覆盖文案/图标。</p>
 *
 * @param value 配置值
 * @returns 归一后的按钮配置
 */
function normalizeBtn(value: unknown): {
  enabled: boolean;
  tip?: string;
  icon?: any;
  handler?: () => void | Promise<void>;
} {
  if (value === false) return { enabled: false };
  if (value === true || value === undefined) return { enabled: true };
  const v = value as {
    enable?: boolean;
    tip?: string;
    icon?: any;
    handler?: () => void | Promise<void>;
  };
  return { enabled: v.enable !== false, tip: v.tip, icon: v.icon, handler: v.handler };
}

/** 刷新按钮配置 */
const refreshBtn = computed(() => normalizeBtn(props.config.refresh));
/** 列设置按钮配置 */
const columnBtn = computed(() => normalizeBtn(props.config.columnSettings));
/** 表格设置按钮配置 */
const tableBtn = computed(() => normalizeBtn(props.config.tableSettings));

/** 是否显示刷新 */
const showRefresh = computed(() => refreshBtn.value.enabled);

/** 是否显示列设置 */
const showColumnSettings = computed(() => columnBtn.value.enabled);

/** 是否显示表格设置 */
const showTableSettings = computed(() => tableBtn.value.enabled);

/**
 * 点击刷新：配了 handler 就交给调用方，否则走组件内置的 refresh 事件
 * （ReTable 收到后执行 reload）。
 */
async function onRefreshClick(): Promise<void> {
  const handler = refreshBtn.value.handler;
  if (handler) {
    await handler();
    return;
  }
  emit("refresh");
}

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

/** 图标组件：刷新 / 列设置 / 表格设置已改用 anim: 动画图标（见模板），这里只留还在用的。 */
</script>

<template>
  <div class="re-table-toolbar" :class="`re-table-toolbar--${mode}`">
    <!-- 左侧：批量操作区（mode=batch/full，右对齐） -->
    <div v-if="mode !== 'tools'" class="re-table-toolbar__left">
      <!-- 批量选择切换 -->
      <ElBadge
        v-if="batchSelectConfig"
        :value="hasSelected ? selectedCount : 0"
        :max="99"
        :hidden="!hasSelected"
        class="re-table-toolbar__select-badge"
      >
        <ReButton
          :size="btnSize"
          :type="hasSelected ? 'primary' : 'default'"
          layout="square"
          :icon="batchSelectConfig.icon || Select"
          @click="emit('batch-select-toggle')"
        >
          {{ batchSelectConfig.tip || '批量选择' }}
        </ReButton>
      </ElBadge>

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
          <ReButton
            :size="btnSize"
            type="danger"
            layout="square"
            :disabled="deleteDisabled"
            :loading="processing"
            :icon="batchDeleteConfig.icon || Delete"
          >
            {{ batchDeleteConfig.tip || '批量删除' }}
          </ReButton>
        </template>
      </ElPopconfirm>

      <!-- 批量修改 / 保存 -->
      <ReButton
        v-if="batchEditConfig"
        :size="size"
        :type="editing ? 'success' : 'primary'"
        layout="square"
        :disabled="editDisabled"
        :loading="processing && editing"
        :icon="editing ? (batchEditConfig.saveIcon || Check) : (batchEditConfig.icon || Edit)"
        @click="editing ? emit('batch-save', []) : emit('batch-edit')"
      >
        {{ editing ? (batchEditConfig.saveTip || '保存') : (batchEditConfig.tip || '批量修改') }}
      </ReButton>
    </div>

    <!-- 右侧：工具区（mode=tools/full）；工具区属于分页行，表格上方工具栏只放批量按钮 -->
    <div v-if="mode !== 'batch'" class="re-table-toolbar__right">
      <!-- 列设置：动画栅格图标（hover 播上游动效） -->
      <slot name="column-settings" v-if="showColumnSettings">
        <ReButton :size="size" layout="square" :icon="columnBtn.icon || 'anim:tabler:layout-grid'" :anim-icon-size="16" :tip="columnBtn.tip || columnsTriggerText" />
      </slot>

      <!-- 表格设置：动画齿轮图标 -->
      <slot name="table-settings" v-if="showTableSettings">
        <ReButton :size="size" layout="square" :icon="tableBtn.icon || 'anim:tabler:settings'" :anim-icon-size="16" :tip="tableBtn.tip || settingsTriggerText" />
      </slot>

      <!-- 刷新：动画刷新图标（hover 播上游动效；loading 态保留图标并整体旋转）。
           配置了 handler 时点击走调用方自定义行为，不再触发内置 refresh。 -->
      <ReButton
        v-if="showRefresh"
        :size="size"
        layout="square"
        :icon="refreshBtn.icon || 'anim:tabler:refresh'"
        :anim-icon-size="16"
        :loading="loading"
        :tip="refreshBtn.tip || '刷新'"
        @click="onRefreshClick"
      />
    </div>
  </div>
</template>

<style scoped>
.re-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
/* tools 分区（分页行只保留工具区）：内容右对齐 */
.re-table-toolbar--tools {
  justify-content: flex-end;
}
/* batch 分区（表格上方只放批量按钮）：内容右对齐 */
.re-table-toolbar--batch {
  justify-content: flex-end;
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
.re-table-toolbar__select-badge {
  display: inline-flex;
}
</style>