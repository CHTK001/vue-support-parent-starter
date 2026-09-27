<script setup lang="ts">
/**
 * ReButton —— 按钮组件
 *
 * 透传 el-button 全部 props / emits / slots。
 * 增强能力：
 *   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库字符串 / HTTP URL，
 *           自动用 ReIcon 渲染（无需手动包 ReIcon）；
 *           也支持具名插槽 <template #icon> 手动放任意图标（插槽优先于 icon 属性）
 *   - auth：传入权限标识，配合全局权限函数（provide 注入）控制显隐
 *   - click 自动防抖：传 `debounce` 时，300ms 内多次点击只触发一次
 *   - layout：布局变体，"el"（默认，el-button）/ "modern"（现代化扁平按钮，异步加载）/ "square"（正方形图标按钮，异步加载）
 *   - showText：默认 undefined=自动（有插槽文字就显示，没有则仅图标+tooltip）；
 *                显式 false=强制仅图标+tooltip（文字只做悬浮提示）；显式 true=强制显示文字
 *   - iconSize：按钮宽高（默认 32px，仅 iconOnly 时生效）
 * 维护约束：模板必须保持单根，v-if/v-else-if 分支之间不得放顶层注释 ——
 *   dev 下编译器会保留注释并把条件链拆成多根 Fragment，$el 不再是按钮元素，
 *   外层 el-popconfirm / el-tooltip 便解析不到触发元素（确认框弹不出来）。
 *
 * 【square 布局注意】"square" 是纯图标正方形按钮，不允许带文字：
 *   - 传入的文字不会渲染到按钮上，仅作为 tooltip 悬浮提示与 aria-label 辅助信息
 *   - 需要"图标 + 文字"展示时，请使用默认 layout（带 show-text）或 modern 布局
 *
 * 用法：
 *   <ReButton icon="Search" type="primary" @click="onSearch">查询</ReButton>
 *   <ReButton icon="Plus" show-text type="primary">新增用户</ReButton>   <!-- 图标+文字 -->
 *   <ReButton icon="Refresh" class="icon-only" @click="reload" />          <!-- 纯图标 -->
 *   <ReButton layout="square" icon="Refresh" @click="reload" />            <!-- 纯图标正方形，文字仅做 tooltip -->
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
    /**
     * 是否显示文字：
     *   默认 undefined = 自动（插槽有文字就显示，没有则仅图标+tooltip）
     *   false = 强制仅图标+tooltip（文字只做悬浮提示）
     *   true  = 强制显示文字
     */
    showText?: boolean;
    /** 图标按钮宽高 px（仅 iconOnly 时生效，默认 32） */
    iconSize?: number;
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
    // showText 不给默认值：undefined = 自动（有文字则显示），见 iconOnly
    showText: undefined,
    iconSize: 32,
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
    .join("")
    .trim();
});

/**
 * 纯图标按钮：有 icon 且（无文字内容 或 显式 showText=false）
 * ⚠️ 这里不能用 `!props.showText` —— showText 默认是 undefined（自动），
 *    那样会让所有带 icon 的按钮都变成 icon-only，把插槽文字吞成 tooltip。
 */
const iconOnly = computed<boolean>(
  () => Boolean(props.icon) && (labelText.value.trim() === "" || props.showText === false),
);

/** 图标是组件对象时直接渲染组件，字符串走 ReIcon */
const iconIsComponent = computed<boolean>(() => typeof props.icon !== "string" && props.icon != null);
const iconName = computed<string>(() => (typeof props.icon === "string" ? props.icon : ""));

/** 全局权限函数 */
const authFn = inject<ReAuthFn | null>(RE_AUTH_KEY, null);

/** 是否显示按钮 */
const visible = computed<boolean>(() => {
  if (!props.auth) return true;
  if (!authFn) return true;
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

  <ElTooltip
    v-else-if="visible && iconOnly && props.showText === false && labelText"
    :content="labelText"
    placement="top"
  >
    <ElButton
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
      :aria-label="labelText"
      :style="iconOnly ? { width: props.iconSize + 'px', height: props.iconSize + 'px' } : undefined"
      :class="{ 're-button--icon-only': iconOnly }"
      v-bind="$attrs"
      @click="onClick"
    >
      <slot name="icon">
        <ReIcon v-if="icon && !iconIsComponent" :name="iconName" class="re-button__icon" />
        <ElIcon v-else-if="iconIsComponent" class="re-button__icon">
          <component :is="icon" />
        </ElIcon>
      </slot>
    </ElButton>
  </ElTooltip>

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
    <slot name="icon">
      <ReIcon v-if="icon && !iconIsComponent" :name="iconName" class="re-button__icon" />
      <ElIcon v-else-if="iconIsComponent" class="re-button__icon">
        <component :is="icon" />
      </ElIcon>
    </slot>
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
/* 纯图标按钮：默认 32x32 正方形 */
.re-button--icon-only {
  padding: 0;
}
.re-button--icon-only .re-button__icon {
  margin-right: 0;
}
.re-button--icon-only :deep(.el-icon) {
  font-size: 14px;
}
</style>