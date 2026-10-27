<script setup lang="ts">
/**
 * ReStateIcon —— 两态图标切换
 *
 * 同一个图标位在「激活 / 非激活」两态间切换。两态图形的来源：
 *
 *   激活态   = activeIcon ?? 内置集.activeIcon ?? icon
 *   非激活态 = inactiveIcon ?? 内置集.inactiveIcon ?? icon
 *
 * 内置图标集见 {@link ./presets} 的 {@link STATE_ICON_PRESETS}，
 * 传 `preset` 选用；`preset="none"` 可关闭内置回落。
 *
 * 用法：
 *   <ReStateIcon :active="on" active-icon="Sunny" inactive-icon="Moon" />
 *   <ReStateIcon :active="on" preset="star" />
 *   <ReStateIcon :active="on" preset="bulb" />   <!-- 亮灯泡 / 灭灯泡 -->
 *   <ReStateIcon :active="on" icon="ep:star" />
 *
 * 说明：
 *   - 两态图形各占一层，用 CSS 交叉过渡切换（`opacity` / `transform`，
 *     合成层属性，不触发布局）；`animate` 默认关闭，瞬时切换；
 *   - 只有一态有图标时不叠层（否则非激活态会因 active 层 opacity:0 而消失）；
 *   - 尊重 `prefers-reduced-motion`。
 *
 * <p><b>层与图标的对应关系（易错点）</b>：层是<b>固定的</b> ——
 * {@code --active} 层永远渲染「激活态图标名」，{@code --inactive} 层永远渲染
 * 「非激活态图标名」，两者不随 {@code active} 翻转。只有 opacity 在换。
 * 早期版本反过来：层名固定但层内图标名跟着当前态走，于是两层内容互换、
 * 而 opacity 规则仍按层位置走 —— 结果两态显示的是同一个图标（都是激活态那个），
 * 只有过渡的一瞬才看得到另一个。</p>
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
    /**
     * 切换动画方式
     *
     * <p>只有两态图形<b>不同</b>时才有意义：两张图交叉淡入淡出。
     * 若两态是同一张图（如内置灯泡的「亮 / 灭」），这个参数不起作用 ——
     * 亮灭是图形自身的状态，不是图与图之间的过渡。</p>
     */
    mode?: "fade" | "scale" | "slide" | "rotate";
    /** 切换时长（ms） */
    duration?: number;
    /**
     * 是否播放切换动画。
     *
     * <p>默认 {@code false} —— 开关是个高频控件，状态本该「即时生效」；
     * 交叉淡入会让用户在一瞬间看到两个图形叠加（图标发虚），反而读不准状态。
     * 需要动效的场合（如首屏入场）再显式打开。</p>
     */
    animate?: boolean;
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
    animate: false,
  },
);

/**
 * 两态图标名（含内置回落）。
 *
 * <p><b>两层各绑定固定的图标名</b>：{@code --active} 层永远是激活态图标，
 * {@code --inactive} 层永远是非激活态图标。切换只发生在 opacity 上，
 * 图标名不跟着当前态走 —— 这样任何时刻渲染的都是「层所代表的那个图标」。</p>
 */
const icons = computed(() =>
  resolveStateIcons({
    icon: props.icon,
    activeIcon: props.activeIcon,
    inactiveIcon: props.inactiveIcon,
    preset: props.preset,
  }),
);

/** 激活态图标名（固定绑到 --active 层） */
const activeName = computed(() => icons.value.activeIcon);
/** 非激活态图标名（固定绑到 --inactive 层） */
const inactiveName = computed(() => icons.value.inactiveIcon);

/** 是否只有一态有图标（此时只渲染一层，不做交叉） */
const onlyOneLayer = computed(
  () => !activeName.value || !inactiveName.value || activeName.value === inactiveName.value,
);

/** 尺寸写法：数字补 px，字符串原样 */
const sizeStyle = computed(() => (typeof props.size === "number" ? `${props.size}px` : props.size));
</script>

<template>
  <span
    class="re-state-icon"
    :class="[
      `re-state-icon--${mode}`,
      { 'is-active': active, 're-state-icon--static': !animate },
    ]"
    :style="{
      width: sizeStyle,
      height: sizeStyle,
      '--rsi-duration': `${duration}ms`,
    }"
    v-bind="$attrs"
  >
    <!-- 只有一态有图标：直接渲染，不叠层（否则非激活态会因 active 层 opacity:0 而消失） -->
    <ReIcon v-if="onlyOneLayer" :name="active ? activeName : inactiveName" :size="size" />
    <template v-else>
      <span class="re-state-icon__layer re-state-icon__layer--active">
        <ReIcon v-if="activeName" :name="activeName" :size="size" />
      </span>
      <span class="re-state-icon__layer re-state-icon__layer--inactive">
        <ReIcon v-if="inactiveName" :name="inactiveName" :size="size" />
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

/* 静态模式（默认）：两态之间瞬时切换，不做交叉过渡。
   没有过渡就没有「两个图形叠在一起」的中间态，状态一眼可辨。 */
.re-state-icon--static .re-state-icon__layer {
  transition: none;
}
.re-state-icon--static .re-state-icon__layer--active {
  transform: none;
}
.re-state-icon--static .re-state-icon__layer--inactive {
  transform: none;
}
.re-state-icon--static.is-active .re-state-icon__layer--active {
  transform: none;
}
.re-state-icon--static.is-active .re-state-icon__layer--inactive {
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .re-state-icon__layer {
    transition: none;
  }
}
</style>
