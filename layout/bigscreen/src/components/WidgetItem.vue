<template>
  <div
    ref="el"
    class="widget-item"
    :class="{
      'widget-item--selected': isSelected,
      'widget-item--locked': widget.locked,
      'widget-item--edit': isEdit,
    }"
    :style="widgetStyle"
    @mousedown.stop="handleSelect"
  >
    <!-- Widget 内容 -->
    <div class="widget-item__body" :style="bodyStyle">
      <WidgetRenderer :widget="widget" :key="widget.variant + '-' + widget.type" />
    </div>

    <!-- 编辑模式覆盖层 -->
    <template v-if="isEdit">
      <!-- 拖拽手柄 -->
      <div class="widget-item__drag-handle" />

      <!-- 选中时的 resize 手柄 -->
      <template v-if="isSelected">
        <div
          v-for="handle in RESIZE_HANDLES"
          :key="handle"
          class="widget-item__resize-handle"
          :class="`widget-item__resize-handle--${handle}`"
          :data-handle="handle"
        />
      </template>

      <!-- 悬停时显示的操作按钮 -->
      <div v-if="isSelected" class="widget-item__actions">
        <button
          class="widget-item__action-btn"
          title="数据绑定"
          @click.stop="$emit('openDataBinding', widget.id)"
        >
          <IconifyIconOffline icon="ep:setting" />
        </button>
        <button
          class="widget-item__action-btn"
          title="删除"
          @click.stop="$emit('remove', widget.id)"
        >
          <IconifyIconOffline icon="ep:close" />
        </button>
        <button
          class="widget-item__action-btn"
          title="复制"
          @click.stop="$emit('duplicate', widget.id)"
        >
          <IconifyIconOffline icon="ep:copy-document" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import interact from "interactjs";
import type { WidgetConfig } from "../types/widget";
import WidgetRenderer from "./WidgetRenderer.vue";

const RESIZE_HANDLES = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "top",
  "bottom",
  "left",
  "right",
];

const props = defineProps<{
  widget: WidgetConfig;
  isEdit: boolean;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  remove: [id: string];
  duplicate: [id: string];
  openDataBinding: [id: string];
  updateRect: [rect: { x?: number; y?: number; width?: number; height?: number }];
}>();

const el = ref<HTMLElement | null>(null);
let interactInstance: ReturnType<typeof interact> | null = null;

const widgetStyle = computed(() => ({
  position: "absolute" as const,
  left: `${props.widget.rect.x}px`,
  top: `${props.widget.rect.y}px`,
  width: `${props.widget.rect.width}px`,
  height: `${props.widget.rect.height}px`,
  zIndex: props.widget.zIndex,
  opacity: props.widget.opacity,
  display: props.widget.visible ? "block" : "none",
}));

const bodyStyle = computed(() => {
  if (props.widget.customCSS?.enabled && props.widget.customCSS.styles) {
    return { cssText: props.widget.customCSS.styles };
  }
  return {};
});

function handleSelect() {
  if (props.isEdit) {
    emit("select", props.widget.id);
  }
}

function initInteract() {
  if (!el.value || !props.isEdit) return;

  interactInstance = interact(el.value);

  const parentEl = el.value.parentElement;

  const restrictBounds = () => {
    if (!parentEl) return { x: 0, y: 0, width: 1920, height: 1080 };
    return { x: 0, y: 0, width: parentEl.clientWidth, height: parentEl.clientHeight };
  };

  // 拖拽
  interactInstance.draggable({
    allowFrom: ".widget-item__drag-handle",
    inertia: false,
    modifiers: [
      interact.modifiers.restrict({
        restriction: restrictBounds,
        elementRect: { left: 0, top: 0, right: 1, bottom: 1 },
        endOnly: false,
      }),
    ],
    listeners: {
      start() {
        emit("select", props.widget.id);
      },
      move(event) {
        const dx = event.dx;
        const dy = event.dy;
        emit("updateRect", {
          x: props.widget.rect.x + dx,
          y: props.widget.rect.y + dy,
        });
      },
    },
  });

  // 缩放
  interactInstance.resizable({
    edges: {
      left: ".widget-item__resize-handle--left, .widget-item__resize-handle--top-left, .widget-item__resize-handle--bottom-left",
      right: ".widget-item__resize-handle--right, .widget-item__resize-handle--top-right, .widget-item__resize-handle--bottom-right",
      top: ".widget-item__resize-handle--top, .widget-item__resize-handle--top-left, .widget-item__resize-handle--top-right",
      bottom: ".widget-item__resize-handle--bottom, .widget-item__resize-handle--bottom-left, .widget-item__resize-handle--bottom-right",
    },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { width: 40, height: 30 },
      }),
      interact.modifiers.restrict({
        restriction: restrictBounds,
        endOnly: false,
      }),
    ],
    listeners: {
      start() {
        emit("select", props.widget.id);
      },
      move(event) {
        emit("updateRect", {
          x: props.widget.rect.x + event.deltaRect.left,
          y: props.widget.rect.y + event.deltaRect.top,
          width: event.rect.width,
          height: event.rect.height,
        });
      },
    },
  });
}

function destroyInteract() {
  if (interactInstance) {
    interactInstance.unset();
    interactInstance = null;
  }
}

watch(
  () => props.isEdit,
  (edit) => {
    if (edit) {
      initInteract();
    } else {
      destroyInteract();
    }
  }
);

onMounted(() => {
  if (props.isEdit) {
    initInteract();
  }
});

onUnmounted(() => {
  destroyInteract();
});
</script>

<style lang="scss" scoped>
.widget-item {
  position: absolute;
  cursor: default;
  box-sizing: border-box;
  transition: box-shadow 0.15s ease;

  &--edit {
    cursor: move;
  }

  &--selected {
    outline: 2px solid rgba(0, 246, 255, 0.8);
    outline-offset: -1px;
    box-shadow: 0 0 12px rgba(0, 246, 255, 0.3);
  }

  &--locked {
    cursor: not-allowed;
  }

  &__body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  &__drag-handle {
    position: absolute;
    inset: 0;
    z-index: 10;
  }

  &__resize-handle {
    position: absolute;
    z-index: 20;
    background: rgba(0, 246, 255, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.9);

    &--top-left,
    &--top-right,
    &--bottom-left,
    &--bottom-right {
      width: 8px;
      height: 8px;
    }

    &--top-left {
      top: -4px;
      left: -4px;
      cursor: nwse-resize;
    }

    &--top-right {
      top: -4px;
      right: -4px;
      cursor: nesw-resize;
    }

    &--bottom-left {
      bottom: -4px;
      left: -4px;
      cursor: nesw-resize;
    }

    &--bottom-right {
      bottom: -4px;
      right: -4px;
      cursor: nwse-resize;
    }

    &--top,
    &--bottom {
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 4px;
    }

    &--top {
      top: -2px;
      cursor: ns-resize;
    }

    &--bottom {
      bottom: -2px;
      cursor: ns-resize;
    }

    &--left,
    &--right {
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 24px;
    }

    &--left {
      left: -2px;
      cursor: ew-resize;
    }

    &--right {
      right: -2px;
      cursor: ew-resize;
    }
  }

  &__actions {
    position: absolute;
    top: -32px;
    right: 0;
    display: flex;
    gap: 4px;
    z-index: 30;
  }

  &__action-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 20, 40, 0.85);
    border: 1px solid rgba(0, 246, 255, 0.5);
    border-radius: 4px;
    color: rgba(0, 246, 255, 0.9);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    transition: all 0.15s;

    &:hover {
      background: rgba(255, 50, 50, 0.4);
      border-color: rgba(255, 50, 50, 0.8);
      color: #fff;
    }
  }
}
</style>
