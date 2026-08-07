<template>
  <div class="home-editor__preview">
    <div class="home-editor__preview-header">
      <div class="home-editor__preview-title">实时预览</div>
      <div class="home-editor__preview-hint">
        拖拽组件调整位置，编辑后「保存」即可生效
      </div>
    </div>
    <div class="home-editor__preview-body">
      <GridLayout
        v-model:layout="layout"
        :is-draggable="true"
        :is-resizable="true"
        :cols="12"
        :row-height="80"
        :margin="[12, 12]"
        :use-css-transforms="true"
        :vertical-compact="true"
        :prevent-collision="false"
        class="home-editor__grid"
      >
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :i="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :min-w="2"
          :min-h="2"
          class="home-editor__item"
        >
          <div class="home-editor__item-shell">
            <slot :widget="resolveWidget(item.i)" />
            <button
              type="button"
              class="home-editor__remove"
              title="移除组件"
              aria-label="移除"
              @click.stop="emit('remove', item.i)"
            >
              ×
            </button>
          </div>
        </GridItem>
      </GridLayout>

      <div v-if="!hasWidgets" class="home-editor__empty">
        <div class="home-editor__empty-title">从右侧添加组件开始</div>
        <div class="home-editor__empty-desc">点击右侧组件即可添加到预览中</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="HomePreview">
/**
 * 编辑模式左侧实时预览
 *
 * 渲染当前正在编辑的 widget 网格（可拖拽 / 可缩放）。
 * 位置即"实际位置"——保存后 home 视图就按此 layout 渲染。
 */
import { computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import type { GridPosition, WidgetItem } from "./types";

const props = defineProps<{
  widgets: WidgetItem[];
  grid: GridPosition[];
}>();

const emit = defineEmits<{
  (e: "update:grid", v: GridPosition[]): void;
  (e: "remove", id: string): void;
}>();

const layout = computed<GridPosition[]>({
  get: () => props.grid,
  set: (v) => emit("update:grid", v),
});

const widgetById = computed(() => {
  const m = new Map<string, WidgetItem>();
  props.widgets.forEach((w) => m.set(w.id, w));
  return m;
});

const hasWidgets = computed(() => props.widgets.length > 0);

function resolveWidget(id: string): WidgetItem {
  return widgetById.value.get(id) ?? { id, type: "stats", title: id };
}
</script>

<style lang="scss" scoped>
.home-editor__preview {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}

.home-editor__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.home-editor__preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.home-editor__preview-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home-editor__preview-body {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  position: relative;
}

.home-editor__grid {
  background: var(--el-fill-color-light);
  border-radius: 10px;
  padding: 4px;
}

.home-editor__item {
  display: flex;
  flex-direction: column;
}

.home-editor__item-shell {
  position: relative;
  height: 100%;
  width: 100%;
}

.home-editor__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--el-color-danger);
  color: var(--el-color-white, #fff);
  font-size: 14px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.home-editor__item-shell:hover .home-editor__remove {
  opacity: 1;
}

.home-editor__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

.home-editor__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.home-editor__empty-desc {
  font-size: 12px;
}
</style>
