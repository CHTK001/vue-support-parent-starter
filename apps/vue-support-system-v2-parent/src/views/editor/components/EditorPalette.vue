<template>
  <aside class="editor-palette">
    <div class="editor-palette__header">
      <span class="editor-palette__title">组件库</span>
      <input
        v-model="search"
        class="editor-palette__search"
        type="text"
        placeholder="搜索组件..."
      />
    </div>
    <div class="editor-palette__body">
      <div
        v-for="cat in filteredCategories"
        :key="cat.key"
        class="palette-category"
      >
        <div class="palette-category__title" @click="toggleCollapse(cat.key)">
          <span>{{ cat.label }}</span>
          <span class="palette-category__count">{{ cat.items.length }}</span>
          <span class="palette-category__arrow" :class="{ collapsed: cat.collapsed }">▼</span>
        </div>
        <div v-show="!cat.collapsed" class="palette-category__body">
          <div
            v-for="item in cat.items"
            :key="item.key"
            class="palette-item"
            :draggable="true"
            :title="item.desc"
            @dragstart="onDragStart($event, item.type, item.variant)"
          >
            <div class="palette-item__preview">
              <span class="palette-item__preview-label">{{ item.variant }}</span>
            </div>
            <span class="palette-item__label">{{ item.label }}</span>
          </div>
        </div>
      </div>
      <div v-if="filteredCategories.length === 0" class="editor-palette__empty">
        无匹配组件
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { getAllWidgetTypes, getWidgetCategories } from "@layout/bigscreen";

const search = ref("");
const collapsedMap = ref<Record<string, boolean>>({});

const CATEGORY_LABELS: Record<string, string> = {
  panel: "面板",
  "panel-title": "面板标题",
  header: "头部",
  decoration: "装饰",
  geometry: "几何图形",
  chart: "图表",
  text: "文本",
  digital: "数字",
  iframe: "嵌入",
  custom: "自定义",
};

interface PaletteItem {
  key: string;
  type: string;
  variant: string;
  label: string;
  desc?: string;
}

interface PaletteCategory {
  key: string;
  label: string;
  collapsed: boolean;
  items: PaletteItem[];
}

const categories = computed<PaletteCategory[]>(() => {
  const cats = getWidgetCategories();
  return cats.map((cat) => {
    const types = getAllWidgetTypes().filter((t) => t.category === cat);
    const items: PaletteItem[] = types.flatMap((def) =>
      def.variants.map((v) => ({
        key: `${def.type}:${v}`,
        type: def.type,
        variant: v,
        label: v,
        desc: def.description,
      }))
    );
    return {
      key: cat,
      label: CATEGORY_LABELS[cat] || cat,
      collapsed: collapsedMap.value[cat] ?? true,
      items,
    };
  });
});

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return categories.value;
  return categories.value
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          i.variant.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
});

function toggleCollapse(key: string) {
  collapsedMap.value = { ...collapsedMap.value, [key]: !(collapsedMap.value[key] ?? true) };
}

function onDragStart(e: DragEvent, type: string, variant: string) {
  e.dataTransfer?.setData("widget-type", type);
  e.dataTransfer?.setData("widget-variant", variant);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
}
</script>

<style lang="scss" scoped>
.editor-palette {
  width: 220px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: rgba(8, 20, 40, 0.95);
  border-right: 1px solid rgba(0, 246, 255, 0.15);

  &__header {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.1);
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.8);
    display: block;
    margin-bottom: 8px;
  }

  &__search {
    width: 100%;
    padding: 5px 8px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    outline: none;

    &:focus {
      border-color: rgba(0, 246, 255, 0.4);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  &__empty {
    padding: 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
  }
}

.palette-category {
  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: rgba(0, 246, 255, 0.04);
    }
  }

  &__count {
    margin-left: auto;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.2);
  }

  &__arrow {
    font-size: 9px;
    transition: transform 0.15s;
    color: rgba(255, 255, 255, 0.2);

    &.collapsed {
      transform: rotate(-90deg);
    }
  }

  &__body {
    padding: 4px 8px 8px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(0, 246, 255, 0.1);
  border-radius: 5px;
  cursor: grab;
  transition: all 0.12s;
  background: rgba(0, 20, 40, 0.3);
  overflow: hidden;

  &:hover {
    background: rgba(0, 246, 255, 0.06);
    border-color: rgba(0, 246, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 246, 255, 0.1);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }

  &__preview {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    background: rgba(0, 10, 25, 0.5);
    border-radius: 4px 4px 0 0;
  }

  &__preview-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 9px;
    font-weight: 700;
    color: rgba(0, 246, 255, 0.6);
    text-shadow: 0 0 6px rgba(0, 246, 255, 0.2);
    pointer-events: none;
  }

  &__label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    line-height: 1.2;
    padding: 3px 2px 4px;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.preview-fallback {
  font-size: 10px;
  color: rgba(0, 246, 255, 0.4);
}
</style>
