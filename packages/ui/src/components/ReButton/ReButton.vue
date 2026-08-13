<script setup lang="ts">
/**
 * ReButton —— 按钮组件
 *
 * 透传 el-button 全部 props / emits / slots。
 * 增强能力：
 *   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库字符串 / HTTP URL，
 *           自动用 ReIcon 渲染（无需手动包 ReIcon）
 *   - auth：传入权限标识，配合全局权限函数（provide 注入）控制显隐
 *   - click 自动防抖：传 `debounce` 时，300ms 内多次点击只触发一次
 *   - layout：布局变体，"el"（默认，el-button）/ "modern"（现代化扁平按钮，异步加载）
 *
 * 用法：
 *   <ReButton icon="Search" type="primary" @click="onSearch">查询</ReButton>
 *   <ReButton icon="ri:refresh-line" :loading="loading" @click="reload">刷新</ReButton>
 *   <ReButton auth="user:add" type="primary">新增用户</ReButton>
 *   <ReButton layout="modern" type="primary">现代按钮</ReButton>
 */
import { computed, defineAsyncComponent, inject, useSlots, type Component } from "vue";
import { ElButton, ElIcon, ElTooltip } from "element-plus";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";
import { RE_AUTH_KEY, type ReAuthFn } from "./auth";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));
/** Square 布局组件（按需异步加载） */
const SquareLayout = defineAsyncComponent(() => import("./layouts/Square.vue"));

defineOptions({ name: "ReButton", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-button）/ "modern"（现代化扁平按钮）/ "square"（正方形图标按钮） */
    layout?: "el" | "modern" | "square";
    type?: "primary" | "success" | "warning" | "info" | "danger" | "text" | "";
    size?: "large" | "default" | "small";
    plain?: boolean;
    round?: boolean;
    circle?: boolean;
    loading?: boolean;
    disabled?: boolean;
    /** 图标名（自动用 ReIcon 渲染，也可直接传图标组件对象） */
    icon?: string | Component;
    link?: boolean;
    text?: boolean;
    bg?: boolean;
    nativeType?: "button" | "submit" | "reset";
    /** 权限标识；提供 RE_AUTH_KEY 后生效，未通过时按钮不渲染 */
    auth?: string;
    /** 点击防抖时长（ms），0 关闭 */
    debounce?: number;
  }>(),
  {
    layout: "el",
    type: undefined as undefined | "primary" | "success" | "warning" | "danger" | "info",
    size: undefined as undefined | "large" | "default" | "small",
    plain: false,
    round: false,
    circle: false,
    loading: false,
    disabled: false,
    icon: "",
    link: false,
    text: false,
    bg: false,
    nativeType: "button",
    auth: "",
    debounce: 0,
  },
);

const emit = defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

const slots = useSlots();
const labelText = computed<string>(() => {
  const nodes = slots.default?.();
  if (!nodes || nodes.length === 0) return "";
  return nodes
    .map((n) => (typeof n === "string" ? n : (typeof n.children === "string" ? n.children : "")))
    .join("");
});

/** 纯图标按钮：有 icon 且无文字内容时，默认 30x30 正方形 */
const iconOnly = computed<boolean>(() => Boolean(props.icon) && labelText.value.trim() === "");

/** 图标是组件对象时直接渲染组件，字符串走 ReIcon */
const iconIsComponent = computed<boolean>(() => typeof props.icon !== "string" && props.icon != null);
const iconName = computed<string>(() => (typeof props.icon === "string" ? props.icon : ""));

/** 全局权限函数 */
const authFn = inject<ReAuthFn | null>(RE_AUTH_KEY, null);

/** 是否显示按钮 */
const visible = computed<boolean>(() => {
  if (!props.auth) return true;
  if (!authFn) return true; // 未注入权限函数时默认放行
  return authFn(props.auth);
});

/** 防抖控制 */
let lastClick = 0;
function onClick(e: MouseEvent): void {
  if (props.disabled || props.loading) return;
  if (props.debounce > 0) {
    const now = Date.now();
    if (now - lastClick < props.debounce) return;
    lastClick = now;
  }
  emit("click", e);
}
</script>

<template>
  <!-- Square 布局（正方形图标按钮） -->
  <ElTooltip
    v-if="layout === 'square' && visible && labelText"
    :content="labelText"
    placement="top"
  >
    <SquareLayout
      :type="type"
      :size="size"
      :plain="plain"
      :loading="loading"
      :disabled="disabled"
      :icon="icon"
      :native-type="nativeType"
      :aria-label="labelText"
      v-bind="$attrs"
      @click="onClick"
    />
  </ElTooltip>
  <SquareLayout
    v-else-if="layout === 'square' && visible"
    :type="type"
    :size="size"
    :plain="plain"
    :loading="loading"
    :disabled="disabled"
    :icon="icon"
    :native-type="nativeType"
    :aria-label="labelText"
    v-bind="$attrs"
    @click="onClick"
  />

  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-else-if="layout === 'modern' && visible"
    :type="type"
    :size="size"
    :plain="plain"
    :round="round"
    :circle="circle"
    :loading="loading"
    :disabled="disabled"
    :icon="icon"
    :link="link"
    :text="text"
    :bg="bg"
    :native-type="nativeType"
    v-bind="$attrs"
    @click="onClick"
  >
    <slot />
  </ModernLayout>

  <!-- 默认 el-button 布局 -->
  <ElButton
    v-else-if="visible"
    :type="type"
    :size="size"
    :plain="plain"
    :round="round"
    :circle="circle"
    :loading="loading"
    :disabled="disabled"
    :link="link"
    :text="text"
    :bg="bg"
    :native-type="nativeType"
    :class="{ 're-button--icon-only': iconOnly }"
    v-bind="$attrs"
    @click="onClick"
  >
    <ReIcon v-if="icon && !iconIsComponent" :name="iconName" class="re-button__icon" />
    <ElIcon v-else-if="iconIsComponent" class="re-button__icon">
      <component :is="icon" />
    </ElIcon>
    <slot />
  </ElButton>
</template>

<style scoped>
.re-button__icon {
  margin-right: 4px;
}
.re-button__icon + :slotted(*) {
  margin-left: 0;
}
:slotted(*) {
  vertical-align: middle;
}
:deep(.el-button) {
  margin: 0 4px;
}
/* 纯图标按钮：默认 30x30 正方形（size 不指定时） */
.re-button--icon-only {
  width: 30px;
  height: 30px;
  padding: 0;
}
.re-button--icon-only .re-button__icon {
  margin-right: 0;
}
.re-button--icon-only :deep(.el-icon) {
  font-size: 14px;
}
</style>