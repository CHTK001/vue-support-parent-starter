<script setup lang="ts">
/**
 * ReStateIcon —— 两态图标切换（带动画）
 *
 * 同一个图标位在「激活 / 非激活」两态间切换，两套图标各占一层、
 * 用 CSS 交叉过渡完成切换。两态图标来源：
 *
 *   激活态   = activeIcon ?? 内置集.activeIcon ?? icon
 *   非激活态 = inactiveIcon ?? 内置集.inactiveIcon ?? icon
 *
 * 内置图标集见 {@link ./presets} 的 {@link STATE_ICON_PRESETS}（两套起步），
 * 传 `preset` 选用；`preset="none"` 可关闭内置回落。
 *
 * 用法：
 *   <ReStateIcon :active="on" active-icon="Sunny" inactive-icon="Moon" />
 *   <ReStateIcon :active="on" preset="star" />
 *   <ReStateIcon :active="on" icon="ep:star" />
 *
 * 说明：
 *   - 动画只走 `opacity` / `transform`（合成层属性），不触发布局；
 *   - 两态图标相同或只有一态时不会做无意义切换（调用方通常直接用 ReIcon）；
 *   - 尊重 `prefers-reduced-motion`。
 */
import { computed } from "vue";
import ReIcon from "../ReIcon";
import { resolveStateIcons } from "./presets";

defineOptions({ name: "ReStateIcon", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 当前是否激活 */
    active?: boolean;
    /** 通用图标（两态相同）；activeIcon / inactiveIcon 未配置时回落到它 */
    icon?: string;
    /** 激活态图标名 */
    activeIcon?: string;
    /** 非激活态图标名 */
    inactiveIcon?: string;
    /** 内置图标集名（见 presets.ts）；传 "none" 关闭内置回落 */
    preset?: string;
    /** 尺寸（px 数字或 CSS 长度字符串） */
    size?: number | string;
    /** 切换动画方式 */
    mode?: "fade" | "scale" | "slide" | "rotate";
    /** 切换时长（ms） */
    duration?: number;
  }>(),
  {
    active: false,
    icon: "",
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
    size: 18,
    mode: "fade",
    duration: 260,
  },
);

/** 两态图标名（含内置回落） */
const icons = computed(() =>
  resolveStateIcons({
    icon: props.icon,
    activeIcon: props.activeIcon,
    inactiveIcon: props.inactiveIcon,
    preset: props.preset,
  }),
);

/** 当前态应显示的图标：激活态用 activeIcon，否则 inactiveIcon */
const activeName = computed(() => (props.active ? icons.value.activeIcon : icons.value.inactiveIcon));
/** 非当前态应显示的图标（始终渲染，用于交叉过渡） */
const otherName = computed(() => (props.active ? icons.value.inactiveIcon : icons.value.activeIcon));

/** 是否只有一态有图标（此时只渲染一层，不做交叉） */
const onlyOneLayer = computed(
  () => !activeName.value || !otherName.value || activeName.value === otherName.value,
);

/** 尺寸写法：数字补 px，字符串原样 */
const sizeStyle = computed(() => (typeof props.size === "number" ? `${props.size}px` : props.size));
</script>

<template>
  <span
    class="re-state-icon"
    :class="[`re-state-icon--${mode}`, { 'is-active': active }]"
    :style="{
      width: sizeStyle,
      height: sizeStyle,
      '--rsi-duration': `${duration}ms`,
    }"
    v-bind="$attrs"
  >
    <!-- 只有一态有图标：直接渲染，不叠层（否则非激活态会因 active 层 opacity:0 而消失） -->
    <ReIcon v-if="onlyOneLayer" :name="activeName" :size="size" />
    <template v-else>
      <span class="re-state-icon__layer re-state-icon__layer--active">
        <ReIcon v-if="activeName" :name="activeName" :size="size" />
      </span>
      <span class="re-state-icon__layer re-state-icon__layer--inactive">
        <ReIcon v-if="otherName" :name="otherName" :size="size" />
      </span>
    </template>
  </span>
</template>

<style scoped>
.re-state-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 图标本身可能是 1em 的字体图标，也可能被设为固定宽高；统一按 size 撑住盒子 */
  flex: none;
  line-height: 0;
  vertical-align: middle;
  font-size: inherit;
}

/* 两层图标绝对定位叠放：切换时只改 opacity / transform，不触发布局 */
.re-state-icon__layer {
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity var(--rsi-duration, 260ms) ease,
    transform var(--rsi-duration, 260ms) cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: opacity, transform;
}

/* 非当前态：淡出 + 退场缩放；当前态：完全显示 */
.re-state-icon__layer--active {
  opacity: 0;
  transform: var(--rsi-out, scale(0.45) rotate(-12deg));
}
.re-state-icon__layer--inactive {
  opacity: 1;
  transform: none;
}
.re-state-icon.is-active .re-state-icon__layer--active {
  opacity: 1;
  transform: none;
}
.re-state-icon.is-active .re-state-icon__layer--inactive {
  opacity: 0;
  transform: var(--rsi-out, scale(0.45) rotate(12deg));
}

/* 各模式的退场形态：只改 --rsi-out，上面的规则自动生效 */
.re-state-icon--fade {
  --rsi-out: none;
}
.re-state-icon--scale {
  --rsi-out: scale(0.4);
}
.re-state-icon--slide {
  --rsi-out: translateX(22%) scale(0.75);
}
.re-state-icon--rotate {
  --rsi-out: rotate(-100deg) scale(0.55);
}

@media (prefers-reduced-motion: reduce) {
  .re-state-icon__layer {
    transition: none;
  }
}
</style>
