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
          v-for="item in visibleLayout"
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
            <slot :widget="widgetById.get(item.i)!" />
            <div class="home-editor__overlay">
              <button
                type="button"
                class="home-editor__remove"
                title="移除组件"
                aria-label="移除"
                @click.stop="emit('remove', item.i)"
              >
                <el-icon class="home-editor__remove-icon"><DeleteFilled /></el-icon>
              </button>
              <button
                type="button"
                class="home-editor__config"
                title="设置组件"
                aria-label="设置"
                @click.stop="emit('edit', item.i)"
              >
                <el-icon class="home-editor__config-icon"><Setting /></el-icon>
                <span class="home-editor__config-text">设置</span>
              </button>
            </div>
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
// @ts-nocheck

// @ts-nocheck
/**
 * 编辑模式左侧实时预览
 *
 * 渲染当前正在编辑的 widget 网格（可拖拽 / 可缩放）。
 * 位置即"实际位置"——保存后 home 视图就按此 layout 渲染。
 */
import { computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { DeleteFilled, Setting } from "@element-plus/icons-vue";
import type { GridPosition, WidgetItem } from "./types";

const props = defineProps<{
  widgets: WidgetItem[];
  grid: GridPosition[];
}>();

const emit = defineEmits<{
  (e: "update:grid", v: GridPosition[]): void;
  (e: "remove", id: string): void;
  (e: "edit", id: string): void;
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

/**
 * 只渲染「grid 里有位置、且 widgets 里有对应条目」的格子。
 *
 * <p>与 {@link HomeGridView} 同一处修正：原来的兜底 `?? { id, type: "stats", title: id }`
 * 会凭空造出一个 {@code stats} 部件，而该类型早已从目录与加载表中下线，
 * 结果是稳定渲染出「加载失败 + 重试」、且重试必然再失败的坏卡片。
 * 改为直接过滤，没有对应 widget 的格子不占位。</p>
 */
const visibleLayout = computed<GridPosition[]>(() =>
  props.grid.filter((g) => widgetById.value.has(g.i)),
);
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

.home-editor__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  -webkit-backdrop-filter: blur(0px);
  backdrop-filter: blur(0px);
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, backdrop-filter 0.15s;
  pointer-events: none;
}

.home-editor__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.78);
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s, background 0.15s;
}

.home-editor__remove-icon {
  font-size: 30px;
}

.home-editor__remove:hover {
  transform: scale(1.06);
  background: rgba(220, 38, 38, 0.92);
}

.home-editor__config {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
  transition: background 0.15s, transform 0.15s;
}

.home-editor__config:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-50%) translateY(-2px);
}

.home-editor__item-shell:hover .home-editor__overlay {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
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
