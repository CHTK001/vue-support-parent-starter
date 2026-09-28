<!--
  ReStatCard —— 统计卡片（Dashboard 概览）
  布局：图标区 + 文案区（标题/数值/描述）。标准档下两区上下堆叠，
        compact 档启用横排（详见样式段注释）。
  Props:
    - title: 标题
    - value: 主数值（slot 也可）
    - desc: 描述
    - icon: 右侧图标
    - iconColor: 图标颜色（CSS color 值）
    - size: 尺寸档位。default 为标准尺寸；compact 用于「一行并排 4~5 张」的密集
            概览，收紧内距、缩小数值与图标圆，并把文档里写的横排布局真正启用
            （icon 在左、文案在右），避免宽而矮的卡片留白过大
  Slots:
    - value: 自定义主数值渲染（如 ReTag）
    - icon: 自定义右侧图标
-->
<template>
  <!-- re-surface 基类提供圆角/边框/投影/悬停（见 components/shared/re-surface.css） -->
  <div
    class="re-stat-card re-surface re-surface--hover"
    :class="{ 're-stat-card--compact': size === 'compact' }"
  >
    <!-- 图标在左：渐变圆 + 柔光；数值/描述在右 -->
    <div class="re-stat-card__aside">
      <slot name="icon">
        <span v-if="icon" class="re-stat-card__icon" :style="iconStyle">
          <el-icon :size="iconSize"><component :is="icon" /></el-icon>
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
    /** 尺寸档位：default（标准）/ compact（密集概览） */
    size?: "default" | "compact";
  }>(),
  {
    value: "",
    desc: "",
    icon: undefined,
    iconColor: "var(--el-color-primary)",
    size: "default",
  },
);

/** 是否紧凑档；模板与图标尺寸共用，避免两处各判一次 */
const isCompact = computed(() => props.size === "compact");

/** 图标字形大小：紧凑档跟着图标圆一起缩，否则 24px 字形会撑破 32px 圆 */
const iconSize = computed(() => (isCompact.value ? 16 : 24));

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

/* ---------------- 紧凑档 ----------------
   只覆写 re-surface 的令牌与自身排版，不新增投影/圆角声明：
   圆角与内距继续由基线类消费，避免出现第二套卡片外壳规格。

   顺带补上本组件文档里写的横排布局（"左栏 数值 · 右栏 图标"）：
   标准档实际没有 `display: flex`，图标与数值是上下堆叠的，图标这一行
   要独占 30~56px 高度。宽而矮的概览卡（如 280x139 里放一个 0）因此留白过大。
   这里只在紧凑档启用横排 —— 改默认档会让既有 10+ 个调用方一起变样。 */
.re-stat-card--compact {
  --re-surface-padding: 10px 12px;
  --re-surface-radius: var(--el-border-radius-lg, 12px);
  display: flex;
  align-items: center;
  gap: 10px;
}

.re-stat-card--compact .re-stat-card__body {
  gap: 2px;
}

.re-stat-card--compact .re-stat-card__value {
  font-size: 20px;
  min-height: 22px;
  /* 有意不写 nowrap/ellipsis：概览里同排会出现「0 毫秒」和「2026/9/28 08:47:30」
     这种长度悬殊的值，用省略号截断会把「最后检测」的秒数永久藏起来 ——
     那种"变小"是拿丢信息换的。宁可让长值在空格处折成两行。 */
}

.re-stat-card--compact .re-stat-card__title {
  font-size: 12px;
}

.re-stat-card--compact .re-stat-card__icon {
  width: 32px;
  height: 32px;
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
