<template>
  <el-card ref="panelRef" class="sc-panel" :class="panelClass" :style="panelStyle" :shadow="shadow" :body-style="{ padding: 0 }">
    <!-- 头部 -->
    <template v-if="title || icon || $slots.header || collapsible || maximizable || closable" #header>
      <div class="sc-panel__header" :class="{ 'sc-panel__header--draggable': draggable }" @mousedown="startDrag" @dblclick="handleDoubleClick">
        <div v-if="collapsible" class="sc-panel__collapse-btn" @click.stop="toggleCollapse">
          <IconifyIconOnline :icon="isCollapsed ? 'ep:arrow-right' : 'ep:arrow-down'" />
        </div>
        <div class="sc-panel__title">
          <IconifyIconOnline v-if="icon" :icon="icon" class="sc-panel__icon" />
          <span v-if="title">{{ title }}</span>
          <slot name="header" />
        </div>
        <div class="sc-panel__actions">
          <slot name="extra" />
          <div v-if="maximizable" class="sc-panel__action-btn" @click.stop="toggleMaximize">
            <IconifyIconOnline :icon="isMaximized ? 'ep:copy-document' : 'ep:full-screen'" />
          </div>
          <div v-if="closable" class="sc-panel__action-btn sc-panel__action-btn--close" @click.stop="handleClose">
            <IconifyIconOnline icon="ep:close" />
          </div>
        </div>
      </div>
    </template>

    <!-- 内容 -->
    <el-collapse-transition>
      <div v-show="!isCollapsed" class="sc-panel__body" :style="bodyStyle">
        <slot />
      </div>
    </el-collapse-transition>

    <!-- 底部 -->
    <div v-if="$slots.footer && !isCollapsed" class="sc-panel__footer">
      <slot name="footer" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
/**
 * ScPanel 面板组件
 * 基于 el-card，支持多种主题
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */
import { ref, computed, watch, onUnmounted } from "vue";

defineOptions({ name: "ScPanel" });

export type PanelTheme = "default" | "tech" | "techui" | "glass" | "neon" | "modern" | "gradient";

const props = withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    theme?: PanelTheme;
    draggable?: boolean;
    collapsible?: boolean;
    collapsed?: boolean;
    maximizable?: boolean;
    maximized?: boolean;
    closable?: boolean;
    width?: string | number;
    height?: string | number;
    padding?: string | number;
    shadow?: "always" | "hover" | "never";
    borderColor?: string;
  }>(),
  {
    theme: "default",
    draggable: false,
    collapsible: false,
    collapsed: false,
    maximizable: false,
    maximized: false,
    closable: false,
    padding: 16,
    shadow: "always"
  }
);

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  "update:maximized": [value: boolean];
  close: [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const isCollapsed = ref(props.collapsed);
const isMaximized = ref(props.maximized);
const currentX = ref(0);
const currentY = ref(0);

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPosX = 0;
let dragStartPosY = 0;

const panelClass = computed(() => ({
  [`sc-panel--${props.theme}`]: props.theme !== "default",
  "sc-panel--collapsed": isCollapsed.value,
  "sc-panel--maximized": isMaximized.value,
  "sc-panel--draggable": props.draggable
}));

const panelStyle = computed(() => {
  const style: Record<string, string> = {};
  if (isMaximized.value) {
    return { position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: "2000", borderRadius: "0" };
  }
  if (props.width) style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  if (props.height && !isCollapsed.value) style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  if (props.borderColor) style["--panel-border-color"] = props.borderColor;
  if (props.draggable && (currentX.value || currentY.value)) {
    style.position = "absolute";
    style.left = `${currentX.value}px`;
    style.top = `${currentY.value}px`;
  }
  return style;
});

const bodyStyle = computed(() => ({
  padding: typeof props.padding === "number" ? `${props.padding}px` : props.padding
}));

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  emit("update:collapsed", isCollapsed.value);
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value;
  emit("update:maximized", isMaximized.value);
}

function handleDoubleClick() {
  if (props.draggable && props.maximizable) toggleMaximize();
}

function handleClose() {
  emit("close");
}

function startDrag(event: MouseEvent) {
  if (!props.draggable || isMaximized.value) return;
  if ((event.target as HTMLElement).closest(".sc-panel__action-btn, .sc-panel__collapse-btn")) return;
  event.preventDefault();
  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartPosX = currentX.value;
  dragStartPosY = currentY.value;
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "move";
  document.body.style.userSelect = "none";
}

function handleDrag(event: MouseEvent) {
  if (!isDragging) return;
  currentX.value = dragStartPosX + (event.clientX - dragStartX);
  currentY.value = dragStartPosY + (event.clientY - dragStartY);
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

watch(
  () => props.collapsed,
  val => {
    isCollapsed.value = val;
  }
);
watch(
  () => props.maximized,
  val => {
    isMaximized.value = val;
  }
);

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
});

defineExpose({ toggleCollapse, toggleMaximize });
</script>

<style lang="scss" scoped>
.sc-panel {
  &__header {
    display: flex;
    align-items: center;
    &--draggable {
      cursor: move;
    }
  }

  &__collapse-btn {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__title {
    flex: 1;
    display: flex;
    align-items: center;
    font-weight: 600;
  }

  &__icon {
    margin-right: 8px;
    font-size: 18px;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__action-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    &:hover {
      background: var(--el-fill-color);
      color: var(--el-color-primary);
    }
    &--close:hover {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }

  &__footer {
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &--maximized {
    border-radius: 0 !important;
  }

  // Tech 科技风格
  &--tech {
    background: linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(20, 40, 60, 0.9)) !important;
    border: 1px solid var(--panel-border-color, rgba(0, 200, 255, 0.4)) !important;
    position: relative;
    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid var(--panel-border-color, rgba(0, 200, 255, 0.6));
      pointer-events: none;
    }
    &::before {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }
    &::after {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }
    :deep(.el-card__header) {
      background: linear-gradient(90deg, rgba(0, 200, 255, 0.15), transparent);
      border-bottom-color: rgba(0, 200, 255, 0.2);
    }
    .sc-panel__title {
      color: #00d4ff;
      text-shadow: 0 0 10px rgba(0, 200, 255, 0.5);
    }
    .sc-panel__body {
      color: rgba(255, 255, 255, 0.85);
    }
    .sc-panel__action-btn {
      color: rgba(0, 200, 255, 0.7);
      &:hover {
        background: rgba(0, 200, 255, 0.2);
        color: #00d4ff;
      }
    }
  }

  // Glass 玻璃拟态
  &--glass {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  // Neon 霓虹
  &--neon {
    background: #0a0a0a !important;
    border: 2px solid var(--panel-border-color, #ff00ff) !important;
    box-shadow:
      0 0 15px var(--panel-border-color, rgba(255, 0, 255, 0.5)),
      inset 0 0 20px rgba(255, 0, 255, 0.1);
    animation: neon-pulse 2s ease-in-out infinite;
    .sc-panel__title {
      color: var(--panel-border-color, #ff00ff);
      text-shadow: 0 0 10px currentColor;
    }
    .sc-panel__body {
      color: #fff;
    }
    .sc-panel__action-btn {
      color: var(--panel-border-color, #ff00ff);
      &:hover {
        background: rgba(255, 0, 255, 0.2);
      }
    }
  }



  // TechUI 数据大屏风格
  &--techui {
    background: linear-gradient(135deg, #0c1929 0%, #0a1628 100%) !important;
    border: 1px solid rgba(0, 246, 255, 0.3) !important;
    position: relative;
    overflow: visible;
    &::before {
      content: "";
      position: absolute;
      top: -1px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00f6ff, transparent);
    }
    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00f6ff, transparent);
    }
    :deep(.el-card__header) {
      background: linear-gradient(90deg, rgba(0, 246, 255, 0.1), transparent);
      border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    }
    .sc-panel__title {
      color: #00f6ff;
      text-shadow: 0 0 15px rgba(0, 246, 255, 0.6);
      font-weight: 700;
      letter-spacing: 2px;
    }
    .sc-panel__icon {
      color: #00f6ff;
      filter: drop-shadow(0 0 6px rgba(0, 246, 255, 0.8));
    }
    .sc-panel__body {
      color: rgba(255, 255, 255, 0.9);
    }
    .sc-panel__action-btn {
      color: rgba(0, 246, 255, 0.7);
      &:hover {
        background: rgba(0, 246, 255, 0.15);
        color: #00f6ff;
      }
    }
    .sc-panel__footer {
      border-top-color: rgba(0, 246, 255, 0.2);
      background: rgba(0, 246, 255, 0.05);
    }
  }

  // Modern 现代简约
  &--modern {
    background: var(--el-bg-color) !important;
    border: none !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
    :deep(.el-card__header) {
      background: transparent;
      border-bottom: none;
      padding-bottom: 0;
    }
    .sc-panel__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
    .sc-panel__body {
      padding-top: 8px;
    }
    .sc-panel__footer {
      border-top: none;
      background: transparent;
    }
  }

  // Gradient 渐变主题
  &--gradient {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-7)) !important;
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.2) !important;
    :deep(.el-card__header) {
      background: transparent;
      border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.15);
    }
    .sc-panel__title {
      color: var(--el-color-primary);
      font-weight: 700;
    }
    .sc-panel__icon {
      color: var(--el-color-primary);
    }
    .sc-panel__action-btn {
      color: var(--el-color-primary-light-3);
      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.1);
        color: var(--el-color-primary);
      }
    }
  }
}

@keyframes neon-pulse {
  0%,
  100% {
    box-shadow:
      0 0 15px var(--panel-border-color, rgba(255, 0, 255, 0.5)),
      inset 0 0 20px rgba(255, 0, 255, 0.1);
  }
  50% {
    box-shadow:
      0 0 25px var(--panel-border-color, rgba(255, 0, 255, 0.8)),
      inset 0 0 30px rgba(255, 0, 255, 0.15);
  }
}
</style>
