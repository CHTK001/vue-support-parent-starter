<template>
  <el-container class="sc-container" :class="containerClass" :style="containerStyle" :direction="direction">
    <!-- 头部 -->
    <el-header v-if="$slots.header" class="sc-container__header" :height="headerHeight">
      <slot name="header" />
    </el-header>

    <!-- 中间区域 -->
    <el-container class="sc-container__body">
      <!-- 左侧边栏 -->
      <el-aside v-if="$slots.aside" class="sc-container__aside" :width="asideWidth">
        <slot name="aside" />
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="sc-container__main">
        <slot />
      </el-main>

      <!-- 右侧边栏 -->
      <el-aside v-if="$slots.right" class="sc-container__right" :width="rightWidth">
        <slot name="right" />
      </el-aside>
    </el-container>

    <!-- 底部 -->
    <el-footer v-if="$slots.footer" class="sc-container__footer" :height="footerHeight">
      <slot name="footer" />
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
/**
 * ScContainer 布局容器组件
 * 提供 Header、Aside、Main、Footer 布局结构
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
import { computed } from "vue";

defineOptions({
  name: "ScContainer"
});

const props = withDefaults(
  defineProps<{
    /** 布局方向 */
    direction?: "horizontal" | "vertical";
    /** 容器宽度 */
    width?: string | number;
    /** 容器高度 */
    height?: string | number;
    /** 头部高度 */
    headerHeight?: string;
    /** 底部高度 */
    footerHeight?: string;
    /** 左侧边栏宽度 */
    asideWidth?: string;
    /** 右侧边栏宽度 */
    rightWidth?: string;
    /** 是否有边框 */
    border?: boolean;
    /** 是否有阴影 */
    shadow?: boolean;
    /** 是否圆角 */
    rounded?: boolean;
  }>(),
  {
    direction: "vertical",
    headerHeight: "60px",
    footerHeight: "60px",
    asideWidth: "200px",
    rightWidth: "200px",
    border: false,
    shadow: false,
    rounded: false
  }
);

/**
 * 容器样式类
 */
const containerClass = computed(() => ({
  "sc-container--border": props.border,
  "sc-container--shadow": props.shadow,
  "sc-container--rounded": props.rounded
}));

/**
 * 容器样式
 */
const containerStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  }
  return style;
});
</script>

<style lang="scss" scoped>
.sc-container {
  &--border {
    border: 1px solid var(--el-border-color-lighter);
  }

  &--shadow {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  &--rounded {
    border-radius: 8px;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__aside {
    background: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-lighter);
    overflow: auto;
  }

  &__right {
    background: var(--el-bg-color);
    border-left: 1px solid var(--el-border-color-lighter);
    overflow: auto;
  }

  &__main {
    flex: 1;
    overflow: auto;
    background: var(--el-bg-color-page);
  }

  &__footer {
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
