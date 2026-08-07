<template>
  <div class="home-grid">
    <GridLayout
      v-model:layout="layout"
      :is-draggable="false"
      :is-resizable="false"
      :cols="12"
      :row-height="80"
      :margin="[12, 12]"
      :use-css-transforms="true"
      :vertical-compact="true"
      :prevent-collision="false"
      class="home-grid__layout"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :i="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :static="true"
        class="home-grid__item"
      >
        <slot :widget="resolveWidget(item.i)" />
      </GridItem>
    </GridLayout>

    <div v-if="!hasWidgets" class="home-grid__empty">
      <div class="home-grid__empty-inner">
        <el-icon class="home-grid__empty-icon"><DocumentRemove /></el-icon>
        <div class="home-grid__empty-title">尚未配置仪表板</div>
        <div class="home-grid__empty-desc">点击右上角「自定义布局」添加组件</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="HomeGridView">
/**
 * 主页仪表板视图（只读）
 *
 * 根据 useHomeLayout().state.grid 渲染已保存的 widget 布局。
 * 非编辑模式使用，drag/resize 关闭。
 */
import { computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { DocumentRemove } from "@element-plus/icons-vue";
import type { GridPosition, WidgetItem } from "./types";

const props = defineProps<{
  widgets: WidgetItem[];
  grid: GridPosition[];
}>();

const emit = defineEmits<{ (e: "update:grid", v: GridPosition[]): void }>();

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
.home-grid {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.home-grid__layout {
  background: transparent;
  flex: 1;
}

.home-grid__item {
  display: flex;
  flex-direction: column;
}

.home-grid__empty {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 56px 24px;
  border-radius: 8px;
  /* 与 home-card 共同的内层背景 */
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-grid__empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.home-grid__empty-icon {
  font-size: 36px;
  color: var(--el-text-color-placeholder);
}

.home-grid__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.home-grid__empty-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
