<template>
  <el-container class="sc-container" :direction="direction" :style="containerStyle">
    <!-- Header -->
    <el-header v-if="$slots.header" ref="headerRef" class="sc-container__header" :class="{ 'sc-container__resizable': resizable }" :style="headerStyle">
      <slot name="header" />
      <div v-if="resizable" class="sc-container__resize-handle sc-container__resize-handle--horizontal" @mousedown="startResize($event, 'header')" />
    </el-header>

    <el-container :direction="innerDirection">
      <!-- Aside -->
      <el-aside v-if="$slots.aside" ref="asideRef" class="sc-container__aside" :class="{ 'sc-container__resizable': resizable }" :style="asideStyle">
        <slot name="aside" />
        <div v-if="resizable" class="sc-container__resize-handle sc-container__resize-handle--vertical" @mousedown="startResize($event, 'aside')" />
      </el-aside>

      <!-- Main -->
      <el-main class="sc-container__main">
        <slot />
      </el-main>
    </el-container>

    <!-- Footer -->
    <el-footer v-if="$slots.footer" ref="footerRef" class="sc-container__footer" :class="{ 'sc-container__resizable': resizable }" :style="footerStyle">
      <div v-if="resizable" class="sc-container__resize-handle sc-container__resize-handle--horizontal sc-container__resize-handle--top" @mousedown="startResize($event, 'footer')" />
      <slot name="footer" />
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
/**
 * ScContainer 容器布局组件
 * 封装 el-container，支持拖拽调整各区域大小
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    /** 容器方向 */
    direction?: "horizontal" | "vertical";
    /** 内部方向 */
    innerDirection?: "horizontal" | "vertical";
    /** 是否可调整大小 */
    resizable?: boolean;
    /** Header 高度 */
    headerHeight?: string | number;
    /** Aside 宽度 */
    asideWidth?: string | number;
    /** Footer 高度 */
    footerHeight?: string | number;
    /** 最小 Header 高度 */
    minHeaderHeight?: number;
    /** 最小 Aside 宽度 */
    minAsideWidth?: number;
    /** 最小 Footer 高度 */
    minFooterHeight?: number;
  }>(),
  {
    direction: "vertical",
    innerDirection: "horizontal",
    resizable: true,
    headerHeight: "60px",
    asideWidth: "200px",
    footerHeight: "60px",
    minHeaderHeight: 40,
    minAsideWidth: 150,
    minFooterHeight: 40
  }
);

const emit = defineEmits<{
  resize: [area: string, size: number];
}>();

const headerRef = ref<HTMLElement>();
const asideRef = ref<HTMLElement>();
const footerRef = ref<HTMLElement>();

const currentHeaderHeight = ref<number>(0);
const currentAsideWidth = ref<number>(0);
const currentFooterHeight = ref<number>(0);

const containerStyle = computed(() => ({
  height: "100%",
  width: "100%"
}));

const headerStyle = computed(() => ({
  height: currentHeaderHeight.value ? `${currentHeaderHeight.value}px` : props.headerHeight
}));

const asideStyle = computed(() => ({
  width: currentAsideWidth.value ? `${currentAsideWidth.value}px` : props.asideWidth
}));

const footerStyle = computed(() => ({
  height: currentFooterHeight.value ? `${currentFooterHeight.value}px` : props.footerHeight
}));

let resizing = false;
let resizeArea = "";
let startX = 0;
let startY = 0;
let startSize = 0;

/**
 * 开始调整大小
 */
function startResize(event: MouseEvent, area: string): void {
  if (!props.resizable) return;

  event.preventDefault();
  resizing = true;
  resizeArea = area;
  startX = event.clientX;
  startY = event.clientY;

  if (area === "header" && headerRef.value) {
    startSize = headerRef.value.offsetHeight;
  } else if (area === "aside" && asideRef.value) {
    startSize = asideRef.value.offsetWidth;
  } else if (area === "footer" && footerRef.value) {
    startSize = footerRef.value.offsetHeight;
  }

  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.cursor = area === "aside" ? "ew-resize" : "ns-resize";
  document.body.style.userSelect = "none";
}

/**
 * 处理调整大小
 */
function handleResize(event: MouseEvent): void {
  if (!resizing) return;

  if (resizeArea === "header") {
    const deltaY = event.clientY - startY;
    const newHeight = Math.max(props.minHeaderHeight, startSize + deltaY);
    currentHeaderHeight.value = newHeight;
    emit("resize", "header", newHeight);
  } else if (resizeArea === "aside") {
    const deltaX = event.clientX - startX;
    const newWidth = Math.max(props.minAsideWidth, startSize + deltaX);
    currentAsideWidth.value = newWidth;
    emit("resize", "aside", newWidth);
  } else if (resizeArea === "footer") {
    const deltaY = event.clientY - startY;
    const newHeight = Math.max(props.minFooterHeight, startSize - deltaY);
    currentFooterHeight.value = newHeight;
    emit("resize", "footer", newHeight);
  }
}

/**
 * 停止调整大小
 */
function stopResize(): void {
  resizing = false;
  resizeArea = "";
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

onMounted(() => {
  // 初始化尺寸
  if (headerRef.value) {
    currentHeaderHeight.value = headerRef.value.offsetHeight;
  }
  if (asideRef.value) {
    currentAsideWidth.value = asideRef.value.offsetWidth;
  }
  if (footerRef.value) {
    currentFooterHeight.value = footerRef.value.offsetHeight;
  }
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
});

// 暴露方法
defineExpose({
  resetSize: () => {
    currentHeaderHeight.value = 0;
    currentAsideWidth.value = 0;
    currentFooterHeight.value = 0;
  }
});
</script>

<style lang="scss" scoped>
.sc-container {
  position: relative;

  &__header,
  &__aside,
  &__footer {
    position: relative;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
  }

  &__header {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__aside {
    border-right: 1px solid var(--el-border-color-lighter);
  }

  &__footer {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__main {
    background: var(--el-bg-color-page);
    overflow: auto;
  }

  &__resize-handle {
    position: absolute;
    z-index: 10;
    background: transparent;
    transition: background 0.2s;

    &:hover {
      background: var(--el-color-primary-light-7);
    }

    &--horizontal {
      left: 0;
      right: 0;
      height: 4px;
      bottom: -2px;
      cursor: ns-resize;

      &.sc-container__resize-handle--top {
        top: -2px;
        bottom: auto;
      }
    }

    &--vertical {
      top: 0;
      bottom: 0;
      width: 4px;
      right: -2px;
      cursor: ew-resize;
    }
  }

  &__resizable {
    &:hover {
      .sc-container__resize-handle {
        background: var(--el-color-primary-light-8);
      }
    }
  }
}
</style>
