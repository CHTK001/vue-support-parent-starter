<script setup lang="ts">
/**
 * BulbIcon —— 内置「灯泡」两态图标（ReStateIcon 的 builtin 渲染器）
 *
 * <p>用途：开关类控件的「亮 / 灭」语义。相比两套不同图形（太阳/月亮），
 * 同一个灯泡在激活时点亮、在非激活时熄灭更贴合「开/关」的直觉。</p>
 *
 * <p><b>为什么不用两套 SVG 交叉淡入</b>：点亮与熄灭的差别就在
 * 「有没有光」—— 灯罩轮廓、灯丝、底座完全一样。用两张图交叉过渡会让
 * 轮廓在中途跳变（两图路径不同），观感像是闪了一下。这里只用<b>一张</b>图，
 * 发光与否由 CSS 的 {@code opacity} / {@code fill} 表达，
 * 于是切换是<b>瞬时</b>的，没有动画，也不会有中间态。</p>
 *
 * <p>发光色默认跟随 {@code currentColor}（即外层主题色），业务可用
 * {@code --re-bulb-glow-color} 覆盖成暖黄等固定色。</p>
 */
import { computed } from "vue";

defineOptions({ name: "BulbIcon", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 是否点亮 */
    active?: boolean;
    /** 尺寸（px 数字或 CSS 长度字符串） */
    size?: number | string;
  }>(),
  {
    active: false,
    size: 18,
  },
);

/** 尺寸写法：数字补 px，字符串原样 */
const sizeStyle = computed(() => (typeof props.size === "number" ? `${props.size}px` : props.size));
</script>

<template>
  <svg
    class="re-bulb-icon"
    :class="{ 're-bulb-icon--lit': active }"
    :style="{ width: sizeStyle, height: sizeStyle }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-bind="$attrs"
  >
    <!-- 灯罩轮廓（点亮前后完全一致） -->
    <path d="M9.2 17.4h5.6" />
    <path d="M10.3 20.4h3.4" />
    <path
      d="M12 2.6a6.3 6.3 0 0 0-3.6 11.3c.5.4.8 1 .8 1.6v.3h5.6v-.3c0-.6.3-1.2.8-1.6A6.3 6.3 0 0 0 12 2.6Z"
    />
    <!-- 灯丝 -->
    <path class="re-bulb-icon__filament" d="M12 8.4v4.8M10 10.4h4" />
    <!-- 内部光晕：点亮时才出现 -->
    <circle class="re-bulb-icon__core" cx="12" cy="10.6" r="3.1" />
    <!-- 四周射线：点亮时才出现 -->
    <g class="re-bulb-icon__rays">
      <path d="M12 1.4V.2" />
      <path d="M4.9 4.9 4.1 4.1" />
      <path d="M19.1 4.9l.8-.8" />
      <path d="M2.6 12H1.4" />
      <path d="M21.4 12h-1.2" />
    </g>
  </svg>
</template>

<style scoped>
.re-bulb-icon {
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
}

/* 未点亮：光晕与射线完全隐藏（不是透明残留，是不参与绘制） */
.re-bulb-icon__core {
  fill: currentColor;
  opacity: 0;
}

.re-bulb-icon__rays {
  opacity: 0;
}

/* 点亮：光晕半透明铺开 + 射线显现 + 外发光阴影 */
.re-bulb-icon--lit .re-bulb-icon__core {
  opacity: 0.22;
}

.re-bulb-icon--lit .re-bulb-icon__rays {
  opacity: 0.75;
}

.re-bulb-icon--lit {
  filter: drop-shadow(0 0 3px var(--re-bulb-glow-color, currentColor));
}
</style>
