<!--
  ReStatCard —— 统计卡片（Dashboard 概览）
  布局：左栏 标题/数值/描述 纵向堆叠 · 右栏 圆形图标垂直居中
  Props:
    - title: 标题
    - value: 主数值（slot 也可）
    - desc: 描述
    - icon: 右侧图标
    - iconColor: 图标颜色（CSS color 值）
  Slots:
    - value: 自定义主数值渲染（如 ReTag）
    - icon: 自定义右侧图标
-->
<template>
  <!-- re-surface 基类提供圆角/边框/投影/悬停（见 components/shared/re-surface.css） -->
  <div class="re-stat-card re-surface re-surface--hover">
    <!-- 图标在左：渐变圆 + 柔光；数值/描述在右 -->
    <div class="re-stat-card__aside">
      <slot name="icon">
        <span v-if="icon" class="re-stat-card__icon" :style="iconStyle">
          <el-icon :size="24"><component :is="icon" /></el-icon>
        </span>
      </slot>
    </div>
    <div class="re-stat-card__body">
      <div class="re-stat-card__value">
        <slot name="value">{{ value }}</slot>
      </div>
      <span class="re-stat-card__title">{{ title }}</span>
      <div v-if="desc" class="re-stat-card__desc">{{ desc }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
// 卡片视觉基线（库级共享，本组件是规格源头）
import "../../../shared/re-surface.css";

const props = withDefaults(
  defineProps<{
    title: string;
    value?: string | number;
    desc?: string;
    icon?: Component;
    /** CSS 颜色值或 CSS 变量 */
    iconColor?: string;
  }>(),
  {
    value: "",
    desc: "",
    icon: undefined,
    iconColor: "var(--el-color-primary)",
  },
);

/**
 * 图标圆：iconColor 渐变实底 + 白色图标 + 同色柔和投影（对齐设计稿的"柔和层次感"）。
 * 颜色任意（CSS 变量 / hex）均可，经 color-mix 派生亮部与投影。
 */
const iconStyle = computed<Record<string, string>>(() => {
  const c = props.iconColor || "var(--el-color-primary)";
  return {
    background: `linear-gradient(140deg, color-mix(in srgb, ${c} 72%, var(--el-color-white)) 0%, ${c} 100%)`,
    color: "var(--el-color-white)",
    boxShadow: `0 10px 18px -8px color-mix(in srgb, ${c} 55%, transparent)`,
  };
});

defineOptions({ name: "ReStatCard", inheritAttrs: true });
</script>

<style scoped>
/* 卡片规格来自库级基线 components/shared/re-surface.css（ReStatCard 风格：
   16px 圆角、无实色边框、双层柔光投影、悬停上浮 2px）。
   本组件是这套规格的"源头"，基线由它抽出；此处只写本组件独有的排版，
   圆角/边框/投影一律走基线类，避免同一套规格在库里出现第二份定义。 */
.re-stat-card {
  /* 尺寸变量：基线未加载时（单独引入本组件）也能得到正确圆角 */
  border-radius: var(--re-surface-radius, var(--el-radius-xl, 16px));
}

.re-stat-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 数值主行：大号数字 +（插槽内自带的）小号单位 */
.re-stat-card__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-height: 30px;
}

.re-stat-card__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-stat-card__desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-stat-card__aside {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标圆：56px 渐变实底 + 白色图标（样式由 iconStyle 内联下发） */
.re-stat-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
