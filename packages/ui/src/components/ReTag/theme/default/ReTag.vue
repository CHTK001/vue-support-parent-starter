<script setup lang="ts">
/**
 * ReTag —— 标签组件
 *
 * 透传 el-tag 全部能力，增加 value 颜色映射能力：
 *   <ReTag :value="1" :map="{ 1: { label: '启用', type: 'success' } }" />
 */
import { computed } from "vue";
import { ElTag } from "element-plus";
import ReIcon from "../../../ReIcon/theme/default/ReIcon.vue";

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
    /** 值 → { label, type, color, icon } 映射 */
    map?: Record<string, { label?: string; type?: "primary" | "success" | "warning" | "info" | "danger" | ""; color?: string; icon?: string }>;
    /** 左侧图标名（map 命中项的 icon 优先） */
    icon?: string;
    /** 状态小圆点 */
    dot?: boolean;
    /** 圆点颜色，留空则用 color / 主色 */
    dotColor?: string;
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
    icon: "",
    dot: false,
    dotColor: "",
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
const displayIcon = computed(() => mapped.value?.icon || props.icon);
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
    <span v-if="dot" class="re-tag__dot" :style="{ background: dotColor || color || 'var(--el-color-primary)' }" />
    <ReIcon v-if="displayIcon" :name="displayIcon" class="re-tag__icon" />
    <slot>{{ displayText }}</slot>
  </ElTag>
</template>

<style scoped>
.re-tag__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 50%;
}
.re-tag__icon {
  margin-right: 4px;
  vertical-align: middle;
}
</style>
