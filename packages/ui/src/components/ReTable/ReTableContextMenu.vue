<script setup lang="ts">
// @ts-nocheck
/**
 * ReTableContextMenu —— 右键自定义菜单
 *
 * 定位在鼠标右键位置，支持传入行/cell 上下文。
 * 菜单项可配置 icon、disabled、divided、children。
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import type { ReTableContextMenuItem, ReTableContextMenuContext } from "./types";

defineOptions({ name: "ReTableContextMenu", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible?: boolean;
    /** 菜单项列表 */
    items?: ReTableContextMenuItem[];
    /** 右键上下文（行/cell 信息） */
    context?: ReTableContextMenuContext;
    /** 菜单 x 坐标 */
    x?: number;
    /** 菜单 y 坐标 */
    y?: number;
  }>(),
  {
    visible: false,
    items: () => [],
    context: undefined,
    x: 0,
    y: 0,
  },
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "select", item: ReTableContextMenuItem, context: ReTableContextMenuContext): void;
}>();

const menuRef = ref<HTMLElement | null>(null);

/** 菜单定位样式（防止溢出屏幕） */
const menuStyle = computed(() => {
  let x = props.x;
  let y = props.y;
  // 简单防溢出：如果坐标超出视口，回退
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;
  // 预估菜单宽度 200px、高度按项目数估算
  const estW = 200;
  const estH = (props.items?.length || 0) * 36;
  if (x + estW > vw) x = vw - estW - 8;
  if (y + estH > vh) y = vh - estH - 8;
  if (x < 0) x = 8;
  if (y < 0) y = 8;
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

/** 判断菜单项是否禁用 */
function isDisabled(item: ReTableContextMenuItem): boolean {
  if (typeof item.disabled === "function" && props.context) {
    return item.disabled(props.context);
  }
  return Boolean(item.disabled);
}

/** 点击菜单项 */
function onItemClick(item: ReTableContextMenuItem) {
  if (isDisabled(item)) return;
  if (item.children && item.children.length > 0) return; // 有子菜单不触发
  if (props.context) {
    emit("select", item, props.context);
  }
  emit("update:visible", false);
}

/** 点击外部关闭 */
function onDocumentClick(e: MouseEvent) {
  if (!props.visible) return;
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit("update:visible", false);
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("contextmenu", onDocumentClick, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick, true);
  document.removeEventListener("contextmenu", onDocumentClick, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="re-ctx-fade">
      <div
        v-if="visible && items.length > 0"
        ref="menuRef"
        class="re-ctx-menu"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <template v-for="(item, idx) in items" :key="item.key">
          <div
            v-if="item.divided && idx > 0"
            class="re-ctx-menu__divider"
          />
          <div
            :class="[
              're-ctx-menu__item',
              {
                're-ctx-menu__item--disabled': isDisabled(item),
                're-ctx-menu__item--has-children': item.children && item.children.length > 0,
              },
            ]"
            @click.stop="onItemClick(item)"
          >
            <ElIcon v-if="item.icon" class="re-ctx-menu__icon">
              <component :is="item.icon" />
            </ElIcon>
            <span class="re-ctx-menu__label">{{ item.label }}</span>
            <span v-if="item.children && item.children.length > 0" class="re-ctx-menu__arrow">›</span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.re-ctx-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  max-width: 280px;
  padding: 4px;
  background: var(--bg-container, var(--el-bg-color-overlay, #fff));
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #ebeef5));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.re-ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.re-ctx-menu__item:hover:not(.re-ctx-menu__item--disabled) {
  background: var(--bg-hover, var(--el-fill-color, #f5f7fa));
}
.re-ctx-menu__item--disabled {
  color: var(--el-text-color-disabled, #c0c4cc);
  cursor: not-allowed;
}
.re-ctx-menu__item--has-children {
  padding-right: 12px;
}
.re-ctx-menu__icon {
  font-size: 14px;
  flex-shrink: 0;
}
.re-ctx-menu__label {
  flex: 1;
}
.re-ctx-menu__arrow {
  color: var(--el-text-color-secondary, #909399);
  font-size: 16px;
}
.re-ctx-menu__divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--el-border-color-lighter, #ebeef5);
}

/* 过渡动画 */
.re-ctx-fade-enter-active,
.re-ctx-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.re-ctx-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.re-ctx-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>