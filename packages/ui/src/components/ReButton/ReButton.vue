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
 * 维护约束（2026-09-30 补充）：**每个分支解析到的根都必须是真实元素**，
 *   因此禁止把 ElTooltip / ElPopover 这类组件放在分支最外层当根。
 *   它们自身的根是 ElPopper（fragment），Vue 会判定「组件根节点不是元素」，
 *   导致挂在 <ReButton> 上的指令（v-admin / v-superadmin / v-role / v-perm / v-menu）
 *   拿不到真实元素而**静默失效**（实测：{@code v-admin} 的 display:none 根本没执行，
 *   非管理员能看到管理员专属按钮），并且每次渲染刷一条
 *   "Runtime directive used on component with non-element root node" 警告。
 *   需要 tooltip 时，把它放进布局组件内部（见 layouts/Square.vue 的 tip prop），
 *   或改用原生 title。
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
 *   <ReButton layout="square" icon="Delete" type="danger" tip="删除这条记录" @click="remove" />
 *                                                                       <!-- 操作列推荐写法：square + tip -->
 *   <ReButton auth="user:add" type="primary">新增用户</ReButton>
 *   <ReButton layout="modern" type="primary">现代按钮</ReButton>
 */
import { computed, defineAsyncComponent, inject, useSlots, type Component } from "vue";
import { ElButton, ElIcon, ElTooltip } from "element-plus";
import { useAttrs } from "vue";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";
import { RE_AUTH_KEY, type ReAuthFn } from "./auth";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));
/** Square 布局组件（按需异步加载） */
const SquareLayout = defineAsyncComponent(() => import("./layouts/Square.vue"));

defineOptions({ name: "ReButton", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-button）/ "modern"（现代化扁平按钮）/ "square"（正方形图标按钮） */
    layout?: "el" | "modern" | "square";
    type?: "primary" | "success" | "warning" | "info" | "danger" | "text" | "";
    /**
     * 尺寸档：large / default / small 直通 Element；
     * `mini` 是 square / modern 两个布局的额外档位（24px），用于塞进 mini 密度表格的操作列 ——
     * el 布局下等价于 small（Element 没有 mini 档，不能把 mini 透传给 el-button）。
     */
    size?: "large" | "default" | "small" | "mini";
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
    /**
     * 悬浮提示文案。
     *
     * 优先于插槽文字：square 布局本身就是「纯图标 + tooltip」，业务侧把提示语写在
     * tip 上，不必再塞进插槽（插槽文字只会被当 tooltip 用，不渲染到按钮上）。
     * 未提供 tip 时回落到插槽文字，再回落到原生 title。
     */
    tip?: string;
    /** 图标按钮宽高 px（仅 iconOnly 时生效，默认 32） */
    iconSize?: number;
    /**
     * 纯装饰：不渲染成可交互控件（square 布局下生效，降级为 <span aria-hidden>）。
     *
     * 见 {@link SquareLayout} 的 decorative 说明。默认 false，对既有调用零影响。
     */
    decorative?: boolean;
    /**
     * 动画图标（{@code anim:<lib>:<icon>}）的尺寸 px。
     *
     * <p>普通图标（element-plus / iconify）由字体决定大小，不需要这个；
     * 但动画图标是内联 SVG，尺寸必须显式给 —— 否则会退化成 ReIcon 的默认 18px，
     * 在小方钮里显得偏大或偏小。</p>
     */
    animIconSize?: number;
    /**
     * 两态图标切换（仅 square 布局）：激活态 / 非激活态各一套图标，
     * 由 ReStateIcon 做动画切换。三者任一非空即启用。
     *
     * <p>与 {@link icon} 的优先级：激活态 = activeIcon ?? 内置集.activeIcon ?? icon；
     * 非激活态 = inactiveIcon ?? 内置集.inactiveIcon ?? icon。</p>
     */
    activeIcon?: string;
    inactiveIcon?: string;
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
    /** 当前是否激活（配合 activeIcon / inactiveIcon / preset 使用） */
    active?: boolean;
  }>(),
  {
    layout: "el",
    type: undefined as undefined | "primary" | "success" | "warning" | "danger" | "info",
    size: undefined as undefined | "large" | "default" | "small" | "mini",
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
    tip: undefined,
    iconSize: 32,
    animIconSize: undefined,
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
    active: false,
    decorative: false,
  },
);

const emit = defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

const slots = useSlots();
/** 插槽文字（square 布局下只作提示语用，不渲染到按钮上） */
const slotText = computed<string>(() => {
  const nodes = slots.default?.();
  if (!nodes || nodes.length === 0) return "";
  return nodes
    .map((n) => (typeof n === "string" ? n : (typeof n.children === "string" ? n.children : "")))
    .join("")
    .trim();
});

/** 原生 title（未声明为 prop，落在 $attrs 里）作为最后回落 */
const attrs = useAttrs();
const attrTitle = computed<string>(() => {
  const t = (attrs as Record<string, unknown>).title;
  return typeof t === "string" ? t : "";
});

/**
 * 提示语文本：tip 优先，其次插槽文字，最后原生 title。
 *
 * 之前 labelText 只看插槽，导致「square + title=…」这种写法在有插槽时
 * 会用错提示语（插槽优先于 title）；加上 tip 后调用方可显式指定，
 * 且三者优先级明确可预期。
 */
const labelText = computed<string>(() => {
  if (props.tip != null && props.tip.trim() !== "") {
    return props.tip.trim();
  }
  if (slotText.value !== "") {
    return slotText.value;
  }
  return attrTitle.value;
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

/**
 * 透传给 el-button 的尺寸。
 *
 * <p>{@code mini} 是 square / modern 两个自绘布局的档位（24px，见各自样式的
 * {@code --size-mini}）；Element 只有 large / default / small 三档，直接透传
 * {@code size="mini"} 会落到一个不存在的档位（按钮尺寸回落到 default，反而更大）。
 * el 布局下 mini 就按 small 渲染。</p>
 */
const elSize = computed<"large" | "default" | "small" | undefined>(() =>
  props.size === "mini" ? "small" : props.size,
);

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
  <span
    v-if="layout === 'square' && visible && labelText && !decorative"
    class="re-button__tip-wrap"
  >
    <ElTooltip :content="labelText" placement="top">
      <SquareLayout
        :type="type"
        :size="size"
        :plain="plain"
        :loading="loading"
        :disabled="disabled"
        :icon="icon"
        :anim-icon-size="animIconSize"
        :active="active"
        :active-icon="activeIcon"
        :inactive-icon="inactiveIcon"
        :preset="preset"
        :native-type="nativeType"
        :aria-label="labelText"
        v-bind="$attrs"
        @click="onClick"
      />
    </ElTooltip>
  </span>
  <SquareLayout
    v-else-if="layout === 'square' && visible"
    :type="type"
    :size="size"
    :plain="plain"
    :loading="loading"
    :disabled="disabled"
    :icon="icon"
    :anim-icon-size="animIconSize"
    :active="active"
    :active-icon="activeIcon"
    :inactive-icon="inactiveIcon"
    :preset="preset"
    :native-type="nativeType"
    :decorative="decorative"
    v-bind="$attrs"
    @click="onClick"
  />
  <!-- 无提示语的 square（labelText 为空）：labelText 用作 aria-label 是唯一的无障碍名来源，
       $attrs 里即使有 title 也只是悬浮提示，不能替代可访问名，故这里保留。 -->

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

  <span
    v-else-if="visible && iconOnly && props.showText === false && labelText"
    class="re-button__tip-wrap"
  >
    <ElTooltip :content="labelText" placement="top">
      <ElButton
        :type="type"
        :size="elSize"
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
          <ReIcon v-if="icon && !iconIsComponent" :name="iconName" :size="animIconSize" class="re-button__icon" />
          <ElIcon v-else-if="iconIsComponent" class="re-button__icon">
            <component :is="icon" />
          </ElIcon>
        </slot>
      </ElButton>
    </ElTooltip>
  </span>

  <ElButton
    v-else-if="visible"
    :type="type"
    :size="elSize"
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
      <ReIcon v-if="icon && !iconIsComponent" :name="iconName" :size="animIconSize" class="re-button__icon" />
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
/* 两处 tooltip 分支的外壳（square + 提示语 / el 纯图标 + 提示语）。
   必须让根是真实元素：ElTooltip 的根是 ElPopper（fragment），直接当根会让挂在
   <ReButton> 上的权限指令拿不到元素、静默失效并每次渲染刷警告
   （见 script 顶部的维护约束）。
   外壳保持 inline-flex，占位行为与按钮一致；tooltip 触发器仍是**整个按钮**，
   悬浮热区不变。inheritAttrs 已置 false，调用方的 class/style 由各分支显式
   v-bind="$attrs" 落到真实按钮上，不会被这层外壳吃掉。 */
.re-button__tip-wrap {
  display: inline-flex;
  align-items: center;
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