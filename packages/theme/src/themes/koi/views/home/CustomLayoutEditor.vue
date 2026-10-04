<template>
  <div class="home-editor">
    <HomePreview
      :widgets="widgets"
      :grid="grid"
      @update:grid="(v) => emit('update:grid', v)"
      @remove="(id) => emit('remove', id)"
      @edit="(id) => emit('edit', id)"
    >
      <template #default="{ widget }">
        <slot name="widget" :widget="widget" />
      </template>
    </HomePreview>

    <WidgetLibrary :catalog="catalog" @add="(type) => emit('add', type)" />
  </div>
</template>

<script setup lang="ts" name="CustomLayoutEditor">
/**
 * 自定义布局编辑器（编辑模式容器）
 *
 * 左：实时预览（HomePreview，可拖拽 / 可缩放）
 * 右：系统组件目录（WidgetLibrary）
 *
 * 实际位置由 HomePreview 维护，保存后即生效。
 */
import HomePreview from "./HomePreview.vue";
import WidgetLibrary from "./WidgetLibrary.vue";
import { widgetCatalog } from "./registry";
import type { GridPosition, WidgetItem, WidgetType, WidgetCatalogItem } from "./types";

withDefaults(
  defineProps<{
    widgets: WidgetItem[];
    grid: GridPosition[];
    /** 已按当前用户权限过滤的组件目录（不传则用注册表的全量目录） */
    catalog?: WidgetCatalogItem[];
  }>(),
  { catalog: () => widgetCatalog.value },
);

const emit = defineEmits<{
  (e: "update:grid", v: GridPosition[]): void;
  (e: "remove", id: string): void;
  (e: "add", type: WidgetType): void;
  (e: "edit", id: string): void;
}>();
</script>

<style lang="scss" scoped>
/* 编辑态整体高度：必须在 .home-card（height:100% 的 flex 列）里增长。
   此前只有 min-height:520px、既不 flex 也不给确定高度，于是：
     .home-editor 内容驱动 → .home-editor__preview 拿不到确定高度
     → HomePreview 内部的 flex:1 与 useFillRowHeight 全部失效
     → 表现就是「浏览态吃满、点进自定义布局又没吃满」。 */
.home-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* 窄屏改为上下堆叠：此时预览与目录都要能各自滚动，
   否则目录会把 .home-editor 顶出 .home-card。 */
@media (max-width: 900px) {
  .home-editor {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
    overflow-y: auto;
  }
}
</style>
