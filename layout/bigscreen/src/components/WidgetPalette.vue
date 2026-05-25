<template>
  <aside class="widget-palette">
    <div class="palette__header">
      <span class="palette__title">组件库</span>
      <span class="palette__count">{{ flatItems.length }}</span>
    </div>

    <div class="palette__search">
      <input
        v-model="searchQuery"
        type="text"
        class="palette__search-input"
        placeholder="搜索组件..."
      />
    </div>

    <div class="palette__list">
      <div
        v-for="category in filteredCategories"
        :key="category.key"
        class="palette__category"
      >
        <div
          class="palette__category-header"
          @click="toggleCategory(category.key)"
        >
          <IconifyIconOffline
            :icon="collapsed[category.key] ? 'ep:arrow-right' : 'ep:arrow-down'"
          />
          <span>{{ category.label }}</span>
          <span class="palette__category-count">{{ category.items.length }}</span>
        </div>

        <div v-if="!collapsed[category.key]" class="palette__items">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="palette__item"
            draggable="true"
            :title="item.description"
            @dragstart="onDragStart($event, item.type, item.variant)"
          >
            <IconifyIconOffline :icon="item.icon" class="palette__item-icon" />
            <span class="palette__item-label">{{ item.label }}</span>
            <span class="palette__item-variant">{{ item.variant }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { WidgetCategory } from "../types/widget";
import { getAllWidgetTypes, getWidgetCategories } from "../composables/useWidgetRegistry";
import { useDragDrop } from "../composables/useDragDrop";

const { startDrag } = useDragDrop();

const searchQuery = ref("");
const collapsed = ref<Record<string, boolean>>({});

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  panel: "面板",
  header: "头部",
  decoration: "装饰",
  geometry: "几何图形",
  chart: "图表",
  text: "文字",
  digital: "数字屏",
  iframe: "嵌入",
  custom: "自定义",
};

/** 将 WidgetTypeDefinition 按变体展开为独立项 */
const flatItems = computed(() => {
  return getAllWidgetTypes().flatMap((def) =>
    def.variants.map((variant) => ({
      id: `${def.type}:${variant}`,
      type: def.type,
      variant,
      label: def.label,
      icon: def.icon,
      description: def.description || "",
      category: def.category,
    }))
  );
});

const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase();
  const catKeys = getWidgetCategories();

  return catKeys
    .filter((key) => CATEGORY_LABELS[key])
    .map((key) => {
      const items = flatItems.value.filter((item) => {
        if (item.category !== key) return false;
        if (
          q &&
          !item.label.toLowerCase().includes(q) &&
          !item.type.toLowerCase().includes(q) &&
          !item.variant.toLowerCase().includes(q)
        )
          return false;
        return true;
      });
      return { key, label: CATEGORY_LABELS[key], items };
    })
    .filter((c) => c.items.length > 0);
});

function toggleCategory(key: string) {
  collapsed.value[key] = !collapsed.value[key];
}

function onDragStart(e: DragEvent, type: string, variant: string) {
  // 使用 dataTransfer（标准方式）
  e.dataTransfer?.setData("widget-type", type);
  e.dataTransfer?.setData("widget-variant", variant);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "copy";
  }
  // 模块级变量作为可靠 fallback
  startDrag(type);
}
</script>

<style lang="scss" scoped>
.widget-palette {
  width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(5, 15, 30, 0.9);
  border-right: 1px solid rgba(0, 246, 255, 0.15);
  flex-shrink: 0;
}

.palette__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);
}

.palette__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 246, 255, 0.9);
}

.palette__count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(0, 246, 255, 0.08);
  padding: 1px 7px;
  border-radius: 8px;
}

.palette__search {
  padding: 8px;

  &-input {
    width: 100%;
    padding: 6px 10px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: rgba(0, 246, 255, 0.4);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

.palette__list {
  flex: 1;
  overflow-y: auto;
}

.palette__category {
  border-bottom: 1px solid rgba(0, 246, 255, 0.06);
}

.palette__category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 246, 255, 0.05);
  }
}

.palette__category-count {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.palette__items {
  padding: 2px 8px 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.palette__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px 4px;
  background: rgba(0, 20, 40, 0.4);
  border: 1px solid rgba(0, 246, 255, 0.1);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.3);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }

  &-icon {
    font-size: 16px;
    color: #00f6ff;
  }

  &-label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    line-height: 1.2;
  }

  &-variant {
    font-size: 9px;
    font-family: "JetBrains Mono", monospace;
    color: rgba(0, 246, 255, 0.4);
    background: rgba(0, 246, 255, 0.06);
    padding: 0 5px;
    border-radius: 3px;
    line-height: 1.4;
  }
}
</style>
