<script setup lang="ts">
/**
 * ReTag —— 标签组件
 *
 * 透传 el-tag 全部能力，增加 value 颜色映射能力：
 *   <ReTag :value="1" :map="{ 1: { label: '启用', type: 'success' } }" />
 */
import { computed } from "vue";
import { ElTag } from "element-plus";

defineOptions({ name: "ReTag", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "info" | "danger" | "";
    size?: "large" | "default" | "small";
    closable?: boolean;
    disableTransitions?: boolean;
    hit?: boolean;
    color?: string;
    effect?: "dark" | "light" | "plain";
    round?: boolean;
    /** 当前值（配合 map 使用） */
    value?: string | number;
    /** 值 → { label, type } 映射 */
    map?: Record<string, { label?: string; type?: "primary" | "success" | "warning" | "info" | "danger" | "" }>;
  }>(),
  {
    type: undefined as undefined | "primary" | "success" | "warning" | "info" | "danger",
    size: undefined as undefined | "large" | "default" | "small",
    closable: false,
    disableTransitions: false,
    hit: false,
    color: "",
    effect: "light",
    round: false,
    value: "",
    map: () => ({}),
  },
);

/** 根据 value 匹配映射后的展示 */
const mapped = computed(() => {
  if (props.value === "" || !props.map) return null;
  const key = String(props.value);
  return props.map[key] ?? null;
});

const displayType = computed(() => (mapped.value?.type || props.type) as "primary" | "success" | "warning" | "info" | "danger" | undefined);
const displayText = computed(() => mapped.value?.label ?? undefined);
</script>

<template>
  <ElTag
    v-bind="$attrs"
    :type="displayType"
    :size="size"
    :closable="closable"
    :disable-transitions="disableTransitions"
    :hit="hit"
    :color="color"
    :effect="effect"
    :round="round"
  >
    <slot>{{ displayText }}</slot>
  </ElTag>
</template>
