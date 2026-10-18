<script setup lang="ts">
/**
 * ReFilePicker 右键菜单 —— 定位在鼠标右键处，样式对齐资源管理器的上下文菜单。
 *
 * <p>只负责「画菜单 + 收回事件」，菜单项由父级按开关与宿主回调拼好后传入；
 * 不挂在 DOM 里常驻（v-if + Teleport），因此关着的时候页面上没有任何多余可点元素。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from "vue";
import type { FilePickerContextMenuAction, FilePickerContextMenuItem } from "../types";

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible?: boolean;
    /** 菜单项（父级已按开关与可用性过滤） */
    items?: FilePickerContextMenuItem[];
    /** 鼠标右键坐标（clientX/clientY） */
    x?: number;
    y?: number;
  }>(),
  { visible: false, items: () => [], x: 0, y: 0 },
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "select", key: FilePickerContextMenuAction): void;
}>();

const menuRef = ref<HTMLElement | null>(null);

/** 菜单尺寸（用于贴边翻转，避免溢出视口） */
const menuSize = ref({ width: 200, height: 0 });
/** 尺寸测出来之前先不显示，免得第一帧闪到视口外 */
const placed = ref(false);

const menuStyle = computed<CSSProperties>(() => {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 720 : window.innerHeight;
  const gap = 6;
  const w = menuSize.value.width || 200;
  const h = menuSize.value.height || props.items.length * 32 + 8;
  let left = props.x;
  let top = props.y;
  if (left + w + gap > vw) left = Math.max(gap, props.x - w);
  if (top + h + gap > vh) top = Math.max(gap, props.y - h);
  return { left: `${left}px`, top: `${top}px`, visibility: placed.value ? "visible" : "hidden" };
});

const close = (): void => emit("update:visible", false);

const onSelect = (item: FilePickerContextMenuItem): void => {
  if (item.disabled) return;
  emit("select", item.key);
  close();
};

/** 点空白 / 再右键 / 滚轮 / Esc 都收回菜单 */
const onDocumentPointer = (event: MouseEvent): void => {
  if (!props.visible) return;
  if (menuRef.value?.contains(event.target as Node)) return;
  close();
};

const onKeydown = (event: KeyboardEvent): void => {
  if (props.visible && event.key === "Escape") {
    event.stopPropagation();
    close();
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      placed.value = false;
      return;
    }
    placed.value = false;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect();
      menuSize.value = { width: rect.width, height: rect.height };
    }
    placed.value = true;
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("mousedown", onDocumentPointer, true);
  document.addEventListener("contextmenu", onDocumentPointer, true);
  document.addEventListener("wheel", onDocumentPointer, true);
  document.addEventListener("keydown", onKeydown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocumentPointer, true);
  document.removeEventListener("contextmenu", onDocumentPointer, true);
  document.removeEventListener("wheel", onDocumentPointer, true);
  document.removeEventListener("keydown", onKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && items.length"
      ref="menuRef"
      class="rfp-ctx"
      role="menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <template v-for="(item, index) in items" :key="item.key">
        <span v-if="item.divided && index > 0" class="rfp-ctx__divider" aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          class="rfp-ctx__item"
          :class="{ 'is-disabled': item.disabled }"
          :disabled="item.disabled"
          :aria-label="item.label"
          @click="onSelect(item)"
        >
          <el-icon v-if="item.icon" :size="14" class="rfp-ctx__icon">
            <component :is="item.icon" />
          </el-icon>
          <span v-else class="rfp-ctx__icon" aria-hidden="true" />
          <span class="rfp-ctx__label">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
/* 资源管理器右键菜单：白底、细边框、轻投影、紧凑行高 */
.rfp-ctx {
  position: fixed;
  z-index: 3000;
  min-width: 176px;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter, #e4e4e7);
  border-radius: 6px;
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.16);
  color: var(--el-text-color-regular, #303133);
  font-size: 13px;
  user-select: none;
}

.rfp-ctx__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.15s);
}

.rfp-ctx__item:hover:not(.is-disabled) {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}

.rfp-ctx__item:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: -2px;
}

.rfp-ctx__item.is-disabled {
  color: var(--el-text-color-disabled, #c0c4cc);
  cursor: not-allowed;
}

.rfp-ctx__icon {
  flex-shrink: 0;
  width: 14px;
  display: inline-flex;
  justify-content: center;
  color: var(--el-text-color-secondary, #909399);
}

.rfp-ctx__item:hover:not(.is-disabled) .rfp-ctx__icon {
  color: inherit;
}

.rfp-ctx__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-ctx__divider {
  display: block;
  height: 1px;
  margin: 4px 6px;
  background: var(--el-border-color-lighter, #e4e4e7);
}
</style>
