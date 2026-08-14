<script setup lang="ts">
/**
 * ReSearchToolbar —— ReSearch 内置操作按钮组
 *
 * 每个按钮均可通过 prop 配置显示 / 隐藏、文案、图标、类型，点击时向上派发对应事件：
 *   - 显示/隐藏过滤区（toggle）
 *   - 搜索（search）
 *   - 重置（reset）
 *   - 新增（add）
 *   - 批量删除（batch-delete）
 *   - 批量勾选（batch-select）
 *
 * 全部按钮复用 ReButton 渲染，保持与后台管理 UI 设计语言一致。
 */
import ReButton from "../ReButton/ReButton.vue";

defineOptions({ name: "ReSearchToolbar", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 过滤区当前是否可见（驱动显示/隐藏按钮文案） */
    filterVisible?: boolean;
    /** 按钮模式：icon=图标+tooltip，text=图标+文字 */
    btnMode?: "icon" | "text";
    /** 是否显示“显示/隐藏过滤区”按钮 */
    showToggle?: boolean;
    /** 是否显示“搜索”按钮 */
    showSearch?: boolean;
    /** 是否显示“重置”按钮 */
    showReset?: boolean;
    /** 是否显示“新增”按钮 */
    showAdd?: boolean;
    /** 是否显示“批量删除”按钮 */
    showBatchDelete?: boolean;
    /** 是否显示“批量勾选”按钮 */
    showBatchSelect?: boolean;
    searchText?: string;
    resetText?: string;
    addText?: string;
    batchDeleteText?: string;
    batchSelectText?: string;
    /** 批量删除按钮是否禁用 */
    batchDeleteDisabled?: boolean;
    /** 批量勾选是否激活（激活时切换文案为取消） */
    batchSelectActive?: boolean;
    batchSelectTextActive?: string;
    /** 加载中（搜索按钮 loading） */
    loading?: boolean;
  }>(),
  {
    filterVisible: true,
    btnMode: "icon",
    showToggle: true,
    showSearch: true,
    showReset: true,
    showAdd: false,
    showBatchDelete: false,
    showBatchSelect: false,
    searchText: "搜索",
    resetText: "重置",
    addText: "新增",
    batchDeleteText: "批量删除",
    batchSelectText: "批量勾选",
    batchDeleteDisabled: false,
    batchSelectActive: false,
    batchSelectTextActive: "取消勾选",
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "add"): void;
  (e: "batch-delete"): void;
  (e: "batch-select"): void;
}>();

function btnLayout(): "square" | "modern" {
  return props.btnMode === "icon" ? "square" : "modern";
}
function btnProps(): Record<string, unknown> {
  if (props.btnMode === "icon") {
    return { layout: "square", text: false, plain: false };
  }
  return { layout: "modern", text: false, plain: false };
}
</script>

<template>
  <div class="re-search-toolbar">
    <div class="re-search-toolbar__right">
      <ReButton
        v-if="showBatchSelect"
        v-bind="btnProps()"
        :type="batchSelectActive ? 'warning' : ''"
        :icon="batchSelectActive ? 'Close' : 'Select'"
        @click="emit('batch-select')"
      >
        {{ batchSelectActive ? batchSelectTextActive : batchSelectText }}
      </ReButton>
      <ReButton
        v-if="showBatchDelete"
        v-bind="btnProps()" type="danger" icon="Delete"
        :disabled="batchDeleteDisabled"
        @click="emit('batch-delete')"
      >
        {{ batchDeleteText }}
      </ReButton>
      <ReButton
        v-if="showAdd"
        v-bind="btnProps()" type="primary"
        icon="Plus"
        @click="emit('add')"
      >
        {{ addText }}
      </ReButton>
      <ReButton
        v-if="showReset"
        v-bind="btnProps()" type="danger" icon="Refresh"
        @click="emit('reset')"
      >
        {{ resetText }}
      </ReButton>
      <ReButton
        v-if="showSearch"
        v-bind="btnProps()" type="primary" icon="Search"
        :loading="loading"
        @click="emit('search')"
      >
        {{ searchText }}
      </ReButton>
      <ReButton
        v-if="showToggle"
        v-bind="btnProps()" :icon="filterVisible ? 'Hide' : 'View'"
        @click="emit('toggle')"
      >
        {{ filterVisible ? "隐藏" : "显示" }}
      </ReButton>
    </div>
  </div>
</template>

<style scoped>
.re-search-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}
.re-search-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
