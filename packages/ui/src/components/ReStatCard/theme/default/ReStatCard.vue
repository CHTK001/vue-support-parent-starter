<!--
  ReStatCard —— 统计卡片（Dashboard 概览）
  设计风格：Vercel / Linear · 卡片化 · 极简
  Props:
    - title: 标题
    - value: 主数值（slot 也可）
    - desc: 描述
    - icon: 头部右侧图标
    - iconColor: 图标颜色（CSS color 值）
  Slots:
    - value: 自定义主数值渲染（如 ReTag）
    - icon: 自定义头部右侧图标
-->
<template>
  <div class="re-stat-card card-modern">
    <div class="re-stat-card__head">
      <span class="re-stat-card__title text-el-text-secondary">{{ title }}</span>
      <slot name="icon">
        <el-icon v-if="icon" :size="16" :style="{ color: iconColor }">
          <component :is="icon" />
        </el-icon>
      </slot>
    </div>
    <div class="re-stat-card__value text-el-text-primary">
      <slot name="value">{{ value }}</slot>
    </div>
    <div v-if="desc" class="re-stat-card__desc text-el-text-secondary">{{ desc }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

withDefaults(
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
    iconColor: "var(--el-text-color-secondary)",
  },
);

defineOptions({ name: "ReStatCard", inheritAttrs: true });
</script>

<style scoped>
.re-stat-card {
  padding: 20px;
}

.re-stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.re-stat-card__title {
  font-size: 14px;
}

.re-stat-card__value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 8px;
  min-height: 34px;
  display: flex;
  align-items: center;
}

.re-stat-card__desc {
  font-size: 12px;
}
</style>
