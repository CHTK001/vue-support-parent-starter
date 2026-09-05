<script setup lang="ts">
/**
 * ReTreeSelect —— 树形下拉（el-tree-select 薄封装）
 *
 * 统一走 re-inputs.css 的 34px 输入风格；
 * data/props 结构：{ children, label, value }（可通过 props 覆盖）。
 */
import { ElTreeSelect } from "element-plus";

defineOptions({ name: "ReTreeSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: null });

withDefaults(
  defineProps<{
    data?: any[];
    props?: Record<string, any>;
    nodeKey?: string;
    placeholder?: string;
    clearable?: boolean;
    filterable?: boolean;
    multiple?: boolean;
    checkStrictly?: boolean;
    checkOnClickNode?: boolean;
    defaultExpandAll?: boolean;
    size?: "large" | "default" | "small";
    disabled?: boolean;
  }>(),
  {
    data: () => [],
    props: () => ({ children: "children", label: "label", value: "value" }),
    nodeKey: "",
    placeholder: "请选择",
    clearable: false,
    filterable: false,
    multiple: false,
    checkStrictly: false,
    checkOnClickNode: false,
    defaultExpandAll: false,
    size: "default",
    disabled: false,
  },
);
</script>

<template>
  <ElTreeSelect
    v-model="model"
    v-bind="$attrs"
    :data="data"
    :props="props"
    :node-key="nodeKey"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :check-strictly="checkStrictly"
    :check-on-click-node="checkOnClickNode"
    :default-expand-all="defaultExpandAll"
    :size="size"
    :disabled="disabled"
    class="re-tree-select"
  >
    <slot />
  </ElTreeSelect>
</template>