<template>
  <div class="re-ribbon-wrapper" :class="{ 're-ribbon-wrapper--relative': !absolute }">
    <slot />
    <div
      v-if="!hidden"
      :class="[
        're-ribbon',
        `re-ribbon--${position}`,
        `re-ribbon--${size}`,
        `re-ribbon--${type}`,
        { 're-ribbon--folded': folded },
      ]"
      :style="ribbonStyle"
    >
      <span class="re-ribbon__text">
        <slot name="content">{{ text }}</slot>
      </span>
      <!-- 折角 -->
      <span v-if="folded" :class="['re-ribbon__fold', `re-ribbon__fold--${position}`]" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReRibbon —— 绸带组件
 *
 * 在父容器角落显示斜向绸带标签，常用于卡片/图片/商品的状态标记。
 *
 * 用法：
 *   <ReRibbon text="HOT" type="danger" position="top-right">
 *     <div class="card">...</div>
 *   </ReRibbon>
 *
 *   <ReRibbon text="新品" type="primary" position="top-left" folded>
 *     <img src="..." />
 *   </ReRibbon>
 *
 * 位置：top-left / top-right / bottom-left / bottom-right
 * 类型：primary / success / warning / danger / info
 * 尺寸：small / default / large
 * 支持自定义颜色、是否显示折角、是否隐藏等。
 */
import { computed } from "vue";
import type { CSSProperties } from "vue";

defineOptions({ name: "ReRibbon", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 绸带文案 */
    text?: string;
    /** 位置 */
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** 类型 */
    type?: "primary" | "success" | "warning" | "danger" | "info";
    /** 尺寸 */
    size?: "small" | "default" | "large";
    /** 自定义背景色（覆盖 type 颜色） */
    color?: string;
    /** 自定义文字色 */
    textColor?: string;
    /** 是否显示折角效果 */
    folded?: boolean;
    /** 是否隐藏 */
    hidden?: boolean;
    /** 是否使用绝对定位（默认 true，包裹子元素） */
    absolute?: boolean;
  }>(),
  {
    text: "",
    position: "top-right",
    type: "primary",
    size: "default",
    color: "",
    textColor: "",
    folded: true,
    hidden: false,
    absolute: true,
  },
);

/** 内联样式（自定义颜色覆盖） */
const ribbonStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {};
  if (props.color) {
    (s as Record<string, string>)["--ribbon-bg"] = props.color;
  }
  if (props.textColor) {
    (s as Record<string, string>)["--ribbon-text"] = props.textColor;
  }
  return s;
});
</script>

<style scoped>
.re-ribbon-wrapper {
  position: relative;
  overflow: hidden;
}
.re-ribbon-wrapper--relative {
  /* no change, just explicit */
}

.re-ribbon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}

/* ===== 尺寸 ===== */
.re-ribbon--small {
  --ribbon-h: 22px;
  --ribbon-font: 11px;
  --ribbon-offset: 18px;
}
.re-ribbon--default {
  --ribbon-h: 28px;
  --ribbon-font: 12px;
  --ribbon-offset: 24px;
}
.re-ribbon--large {
  --ribbon-h: 34px;
  --ribbon-font: 14px;
  --ribbon-offset: 30px;
}

/* ===== 类型颜色 ===== */
.re-ribbon--primary {
  --ribbon-bg: var(--el-color-primary, #409eff);
  --ribbon-fold: var(--el-color-primary-dark-2, #337ecc);
}
.re-ribbon--success {
  --ribbon-bg: var(--el-color-success, #67c23a);
  --ribbon-fold: var(--el-color-success-dark-2, #529b2e);
}
.re-ribbon--warning {
  --ribbon-bg: var(--el-color-warning, #e6a23c);
  --ribbon-fold: var(--el-color-warning-dark-2, #b88230);
}
.re-ribbon--danger {
  --ribbon-bg: var(--el-color-danger, #f56c6c);
  --ribbon-fold: var(--el-color-danger-dark-2, #c45656);
}
.re-ribbon--info {
  --ribbon-bg: var(--el-color-info, #909399);
  --ribbon-fold: var(--el-color-info-dark-2, #73767a);
}

/* ===== 位置 ===== */
.re-ribbon--top-left {
  top: var(--ribbon-offset);
  left: calc(-1 * var(--ribbon-offset));
  transform: rotate(-45deg);
  transform-origin: center;
}
.re-ribbon--top-right {
  top: var(--ribbon-offset);
  right: calc(-1 * var(--ribbon-offset));
  transform: rotate(45deg);
  transform-origin: center;
}
.re-ribbon--bottom-left {
  bottom: var(--ribbon-offset);
  left: calc(-1 * var(--ribbon-offset));
  transform: rotate(45deg);
  transform-origin: center;
}
.re-ribbon--bottom-right {
  bottom: var(--ribbon-offset);
  right: calc(-1 * var(--ribbon-offset));
  transform: rotate(-45deg);
  transform-origin: center;
}

/* ===== 绸带本体 ===== */
.re-ribbon__text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--ribbon-h);
  min-width: 80px;
  padding: 0 20px;
  background: var(--ribbon-bg);
  color: var(--ribbon-text, #fff);
  font-size: var(--ribbon-font);
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* ===== 折角效果 ===== */
.re-ribbon__fold {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.re-ribbon__fold--top-left {
  bottom: -4px;
  left: 0;
  border-width: 4px 0 0 4px;
  border-color: transparent transparent transparent var(--ribbon-fold);
}
.re-ribbon__fold--top-right {
  bottom: -4px;
  right: 0;
  border-width: 0 0 4px 4px;
  border-color: transparent transparent var(--ribbon-fold) transparent;
}
.re-ribbon__fold--bottom-left {
  top: -4px;
  left: 0;
  border-width: 0 4px 4px 0;
  border-color: transparent var(--ribbon-fold) transparent transparent;
}
.re-ribbon__fold--bottom-right {
  top: -4px;
  right: 0;
  border-width: 4px 4px 0 0;
  border-color: var(--ribbon-fold) transparent transparent transparent;
}
</style>
