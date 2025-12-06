<template>
  <el-container class="sc-container" :class="containerClass" :style="containerStyle" :direction="direction">
    <!-- 头部 -->
    <el-header v-if="$slots.header" class="sc-container__header" :height="headerHeight">
      <slot name="header" />
    </el-header>

    <!-- 中间区域 -->
    <el-container class="sc-container__body">
      <!-- 左侧边栏 -->
      <template v-if="$slots.aside">
        <el-aside 
          v-show="!asideCollapsed" 
          class="sc-container__aside" 
          :width="currentAsideWidth"
          :style="{ width: currentAsideWidth }"
        >
          <slot name="aside" />
        </el-aside>
        
        <!-- 左侧拖拽分隔线 -->
        <div 
          v-if="resizable && !asideCollapsed"
          class="sc-container__resizer sc-container__resizer--left"
          @mousedown="startResizeAside"
        >
          <div class="resizer-handle">
            <span class="resizer-dots">
              <i></i><i></i><i></i>
            </span>
          </div>
        </div>
        
        <!-- 左侧折叠按钮 -->
        <div 
          v-if="collapsible"
          class="sc-container__collapse-btn sc-container__collapse-btn--left"
          :class="{ 'is-collapsed': asideCollapsed }"
          @click="toggleAsideCollapse"
        >
          <el-icon>
            <component :is="useRenderIcon(asideCollapsed ? 'ep:arrow-right' : 'ep:arrow-left')" />
          </el-icon>
        </div>
      </template>

      <!-- 主内容区 -->
      <el-main class="sc-container__main">
        <slot />
      </el-main>

      <!-- 右侧边栏 -->
      <template v-if="$slots.right">
        <!-- 右侧拖拽分隔线 -->
        <div 
          v-if="resizable && !rightCollapsed"
          class="sc-container__resizer sc-container__resizer--right"
          @mousedown="startResizeRight"
        >
          <div class="resizer-handle">
            <span class="resizer-dots">
              <i></i><i></i><i></i>
            </span>
          </div>
        </div>
        
        <!-- 右侧折叠按钮 -->
        <div 
          v-if="collapsible"
          class="sc-container__collapse-btn sc-container__collapse-btn--right"
          :class="{ 'is-collapsed': rightCollapsed }"
          @click="toggleRightCollapse"
        >
          <el-icon>
            <component :is="useRenderIcon(rightCollapsed ? 'ep:arrow-left' : 'ep:arrow-right')" />
          </el-icon>
        </div>
        
        <el-aside 
          v-show="!rightCollapsed" 
          class="sc-container__right" 
          :width="currentRightWidth"
          :style="{ width: currentRightWidth }"
        >
          <slot name="right" />
        </el-aside>
      </template>
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
 * 支持拖拽调整宽度和折叠功能
 * @author CH
 * @version 1.1.0
 * @since 2025-12-02
 */
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRenderIcon } from "../../ReIcon/src/hooks";

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
    /** 左侧边栏最小宽度 */
    asideMinWidth?: number;
    /** 左侧边栏最大宽度 */
    asideMaxWidth?: number;
    /** 右侧边栏最小宽度 */
    rightMinWidth?: number;
    /** 右侧边栏最大宽度 */
    rightMaxWidth?: number;
    /** 是否有边框 */
    border?: boolean;
    /** 是否有阴影 */
    shadow?: boolean;
    /** 是否圆角 */
    rounded?: boolean;
    /** 是否可拖拽调整宽度 */
    resizable?: boolean;
    /** 是否可折叠 */
    collapsible?: boolean;
    /** 左侧边栏默认折叠 */
    asideDefaultCollapsed?: boolean;
    /** 右侧边栏默认折叠 */
    rightDefaultCollapsed?: boolean;
  }>(),
  {
    direction: "vertical",
    headerHeight: "60px",
    footerHeight: "60px",
    asideWidth: "200px",
    rightWidth: "200px",
    asideMinWidth: 100,
    asideMaxWidth: 500,
    rightMinWidth: 100,
    rightMaxWidth: 500,
    border: false,
    shadow: false,
    rounded: false,
    resizable: false,
    collapsible: false,
    asideDefaultCollapsed: false,
    rightDefaultCollapsed: false
  }
);

const emit = defineEmits<{
  (e: "aside-resize", width: number): void;
  (e: "right-resize", width: number): void;
  (e: "aside-collapse", collapsed: boolean): void;
  (e: "right-collapse", collapsed: boolean): void;
}>();

// 拖拽状态
const isResizingAside = ref(false);
const isResizingRight = ref(false);
const currentAsideWidthPx = ref(parseInt(props.asideWidth) || 200);
const currentRightWidthPx = ref(parseInt(props.rightWidth) || 200);

// 折叠状态
const asideCollapsed = ref(props.asideDefaultCollapsed);
const rightCollapsed = ref(props.rightDefaultCollapsed);

// 计算当前宽度
const currentAsideWidth = computed(() => `${currentAsideWidthPx.value}px`);
const currentRightWidth = computed(() => `${currentRightWidthPx.value}px`);

/**
 * 容器样式类
 */
const containerClass = computed(() => ({
  "sc-container--border": props.border,
  "sc-container--shadow": props.shadow,
  "sc-container--rounded": props.rounded,
  "sc-container--resizing": isResizingAside.value || isResizingRight.value
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

// 拖拽相关方法
let startX = 0;
let startWidth = 0;

const startResizeAside = (e: MouseEvent) => {
  if (!props.resizable) return;
  e.preventDefault();
  isResizingAside.value = true;
  startX = e.clientX;
  startWidth = currentAsideWidthPx.value;
  document.addEventListener("mousemove", handleResizeAside);
  document.addEventListener("mouseup", stopResizeAside);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
};

const handleResizeAside = (e: MouseEvent) => {
  if (!isResizingAside.value) return;
  const diff = e.clientX - startX;
  let newWidth = startWidth + diff;
  newWidth = Math.max(props.asideMinWidth, Math.min(props.asideMaxWidth, newWidth));
  currentAsideWidthPx.value = newWidth;
  emit("aside-resize", newWidth);
};

const stopResizeAside = () => {
  isResizingAside.value = false;
  document.removeEventListener("mousemove", handleResizeAside);
  document.removeEventListener("mouseup", stopResizeAside);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
};

const startResizeRight = (e: MouseEvent) => {
  if (!props.resizable) return;
  e.preventDefault();
  isResizingRight.value = true;
  startX = e.clientX;
  startWidth = currentRightWidthPx.value;
  document.addEventListener("mousemove", handleResizeRight);
  document.addEventListener("mouseup", stopResizeRight);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
};

const handleResizeRight = (e: MouseEvent) => {
  if (!isResizingRight.value) return;
  const diff = startX - e.clientX;
  let newWidth = startWidth + diff;
  newWidth = Math.max(props.rightMinWidth, Math.min(props.rightMaxWidth, newWidth));
  currentRightWidthPx.value = newWidth;
  emit("right-resize", newWidth);
};

const stopResizeRight = () => {
  isResizingRight.value = false;
  document.removeEventListener("mousemove", handleResizeRight);
  document.removeEventListener("mouseup", stopResizeRight);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
};

// 折叠方法
const toggleAsideCollapse = () => {
  asideCollapsed.value = !asideCollapsed.value;
  emit("aside-collapse", asideCollapsed.value);
};

const toggleRightCollapse = () => {
  rightCollapsed.value = !rightCollapsed.value;
  emit("right-collapse", rightCollapsed.value);
};

// 清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleResizeAside);
  document.removeEventListener("mouseup", stopResizeAside);
  document.removeEventListener("mousemove", handleResizeRight);
  document.removeEventListener("mouseup", stopResizeRight);
});

// 暴露方法
defineExpose({
  toggleAsideCollapse,
  toggleRightCollapse,
  asideCollapsed,
  rightCollapsed,
  currentAsideWidthPx,
  currentRightWidthPx
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

  &--resizing {
    user-select: none;
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
    position: relative;
  }

  &__aside {
    background: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-lighter);
    overflow: auto;
    transition: width 0.3s ease;
    flex-shrink: 0;
  }

  &__right {
    background: var(--el-bg-color);
    border-left: 1px solid var(--el-border-color-lighter);
    overflow: auto;
    transition: width 0.3s ease;
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
    overflow: auto;
    background: var(--el-bg-color-page);
    min-width: 0;
  }

  &__footer {
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // 拖拽分隔线
  &__resizer {
    position: relative;
    width: 8px;
    flex-shrink: 0;
    cursor: col-resize;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: background-color 0.2s;

    &:hover {
      background: linear-gradient(to right, 
        transparent 0%, 
        var(--el-color-primary-light-8) 30%, 
        var(--el-color-primary-light-8) 70%, 
        transparent 100%
      );

      .resizer-handle {
        background: var(--el-color-primary);
        box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.4);
      }

      .resizer-dots i {
        background: #fff;
      }
    }

    &--left {
      margin-left: -4px;
      margin-right: -4px;
    }

    &--right {
      margin-left: -4px;
      margin-right: -4px;
    }

    .resizer-handle {
      width: 6px;
      height: 48px;
      border-radius: 3px;
      background: var(--el-border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .resizer-dots {
      display: flex;
      flex-direction: column;
      gap: 3px;

      i {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--el-text-color-placeholder);
        transition: background 0.2s;
      }
    }
  }

  // 折叠按钮
  &__collapse-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    z-index: 20;
    transition: all 0.2s ease;

    .el-icon {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      transition: color 0.2s;
    }

    &:hover {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    &--left {
      left: 0;
      border-radius: 0 4px 4px 0;
      border-left: none;

      &.is-collapsed {
        left: 0;
      }
    }

    &--right {
      right: 0;
      border-radius: 4px 0 0 4px;
      border-right: none;

      &.is-collapsed {
        right: 0;
      }
    }
  }
}

// 暗色模式
html.dark {
  .sc-container {
    &__resizer {
      &:hover {
        background: linear-gradient(to right, 
          transparent 0%, 
          rgba(var(--el-color-primary-rgb), 0.2) 30%, 
          rgba(var(--el-color-primary-rgb), 0.2) 70%, 
          transparent 100%
        );
      }

      .resizer-handle {
        background: var(--el-border-color-darker);
      }
    }
  }
}
</style>
