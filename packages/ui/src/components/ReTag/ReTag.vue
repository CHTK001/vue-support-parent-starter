<script setup lang="ts">
/**
 * ReTag —— 标签组件
 *
 * 透传 el-tag 全部能力，增加：
 *   - value + map：根据值自动映射 { label, type, color, icon }
 *   - icon：左侧图标（自动用 ReIcon 渲染）
 *   - dot：是否显示小圆点（状态标识常用）
 *   - effect：dark / light / plain
 *
 * 说明：原 `layout="modern"` 变体（layouts/Modern.vue）经审计确认全仓无人使用，
 * 已随统一表面方案移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
 */
import { computed } from "vue";
import { ElTag } from "element-plus";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";

defineOptions({ name: "ReTag", inheritAttrs: true });

/** 值映射表的 type */
export interface ReTagMapItem {
  label?: string;
  type?: "primary" | "success" | "warning" | "info" | "danger" | "";
  color?: string;
  icon?: string;
}

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
    /** 值 → 标签属性映射 */
    map?: Record<string, ReTagMapItem>;
    /** 图标名（左侧） */
    icon?: string;
    /** 是否显示状态点 */
    dot?: boolean;
    /** dot 颜色 */
    dotColor?: string;
  }>(),
  {
    type: "",
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

/** 根据 value 匹配映射 */
const mapped = computed<ReTagMapItem | null>(() => {
  if (props.value === "" || props.value == null || !props.map) return null;
  const key = String(props.value);
  return props.map[key] ?? null;
});

const displayType = computed(() => {
  const type = mapped.value?.type ?? props.type;
  return type || undefined;
});
const displayColor = computed(() => mapped.value?.color ?? props.color);
const displayIcon = computed(() => mapped.value?.icon ?? props.icon);
const displayText = computed(() => mapped.value?.label);

const emit = defineEmits<{
  (e: "close", e2: MouseEvent): void;
  (e: "click", e2: MouseEvent): void;
}>();
</script>

<template>
  <!-- 透传 el-tag 全部能力 -->
  <ElTag
    v-bind="$attrs"
    :type="displayType"
    :size="size"
    :closable="closable"
    :disable-transitions="disableTransitions"
    :hit="hit"
    :color="displayColor"
    :effect="effect"
    :round="round"
    class="re-tag"
    @close="(e: MouseEvent) => emit('close', e)"
    @click="(e: MouseEvent) => emit('click', e)"
  >
    <span v-if="dot" class="re-tag__dot" :style="{ background: dotColor || displayColor || 'var(--el-color-primary)' }" />
    <ReIcon v-if="displayIcon" :name="displayIcon" class="re-tag__icon" />
    <slot>{{ displayText }}</slot>
  </ElTag>
</template>

<style scoped>
.re-tag__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.re-tag__icon {
  margin-right: 4px;
  vertical-align: middle;
}
</style>
