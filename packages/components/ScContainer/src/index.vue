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

const headerRef = ref<any>();
const asideRef = ref<any>();
const footerRef = ref<any>();

/**
 * 获取组件的 DOM 元素
 */
function getElement(ref: any): HTMLElement | null {
  if (!ref) return null;
  return ref.$el || ref;
}

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
  event.stopPropagation();
  resizing = true;
  resizeArea = area;
  startX = event.clientX;
  startY = event.clientY;

  const headerEl = getElement(headerRef.value);
  const asideEl = getElement(asideRef.value);
  const footerEl = getElement(footerRef.value);

  if (area === "header" && headerEl) {
    startSize = headerEl.offsetHeight;
  } else if (area === "aside" && asideEl) {
    startSize = asideEl.offsetWidth;
  } else if (area === "footer" && footerEl) {
    startSize = footerEl.offsetHeight;
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
  const headerEl = getElement(headerRef.value);
  const asideEl = getElement(asideRef.value);
  const footerEl = getElement(footerRef.value);

  if (headerEl) {
    currentHeaderHeight.value = headerEl.offsetHeight;
  }
  if (asideEl) {
    currentAsideWidth.value = asideEl.offsetWidth;
  }
  if (footerEl) {
    currentFooterHeight.value = footerEl.offsetHeight;
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
    border: none;
  }

  &__header {
    border-bottom: none;
  }

  &__aside {
    border-right: none;
  }

  &__footer {
    border-top: none;
  }

  &__main {
    background: var(--el-bg-color-page);
    overflow: auto;
  }

  /* 拖拽手柄 - 与 JDBC 控制台一致的样式 */
  &__resize-handle {
    position: absolute;
    z-index: 999;
    background: transparent;
    transition: all 0.2s ease;

    /* 中心装饰条 */
    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: #cbd5e1;
      border-radius: 2px;
      transition: all 0.2s ease;
      pointer-events: none;
    }

    &:hover::before {
      background: var(--el-color-primary, #3b82f6);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    }

    /* 水平拖拽条（上下调整） */
    &--horizontal {
      left: 0;
      right: 0;
      height: 6px;
      bottom: -3px;
      cursor: ns-resize;

      &::before {
        width: 40px;
        height: 4px;
      }

      &:hover::before {
        width: 60px;
      }

      &.sc-container__resize-handle--top {
        top: -3px;
        bottom: auto;
      }
    }

    /* 垂直拖拽条（左右调整） */
    &--vertical {
      top: 0;
      bottom: 0;
      width: 6px;
      right: -3px;
      cursor: ew-resize;

      &::before {
        width: 4px;
        height: 40px;
      }

      &:hover::before {
        height: 60px;
      }
    }
  }

  &__resizable {
    overflow: visible;
  }
}

/* 深色模式适配 */
html.dark {
  .sc-container {
    &__resize-handle {
      &::before {
        background: #64748b;
      }

      &:hover::before {
        background: var(--el-color-primary);
      }
    }
  }
}
</style>
