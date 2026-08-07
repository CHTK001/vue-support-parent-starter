<template>
  <aside class="widget-library">
    <div class="widget-library__header">
      <div class="widget-library__title">系统组件</div>
      <div class="widget-library__hint">点击添加</div>
    </div>
    <ul class="widget-library__list">
      <li
        v-for="item in visibleCatalog"
        :key="item.type"
        class="widget-library__item"
        @click="emit('add', item.type)"
      >
        <div class="widget-library__icon">
          <el-icon :size="20">
            <component :is="resolveIcon(item.icon)" />
          </el-icon>
        </div>
        <div class="widget-library__meta">
          <div class="widget-library__item-title">{{ item.title }}</div>
          <div class="widget-library__item-desc">{{ item.description }}</div>
        </div>
        <div class="widget-library__add" aria-hidden="true">+</div>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts" name="WidgetLibrary">
/**
 * 系统组件面板（编辑模式右侧）
 *
 * 展示可放置的 widget 目录。点击触发 add 事件，由父组件决定位置。
 * 已按当前用户权限过滤的 catalog 由父组件传入，未传则显示全量。
 */
import { computed } from "vue";
import {
  DataAnalysis,
  Sunny,
  Cloudy,
  List,
  Bell,
  Monitor,
  TrendCharts,
  Calendar,
  Memo,
} from "@element-plus/icons-vue";
import { WIDGET_CATALOG } from "./widgets";
import type { WidgetCatalogItem, WidgetType } from "./types";

const props = withDefaults(
  defineProps<{ catalog?: WidgetCatalogItem[] }>(),
  { catalog: () => WIDGET_CATALOG },
);
const emit = defineEmits<{ (e: "add", type: WidgetType): void }>();

const visibleCatalog = computed<WidgetCatalogItem[]>(() => props.catalog);

const ICON_MAP: Record<string, unknown> = {
  DataAnalysis,
  Sunny,
  Cloudy,
  List,
  Bell,
  Monitor,
  TrendCharts,
  Calendar,
  Memo,
};

function resolveIcon(name: string): unknown {
  return ICON_MAP[name] ?? DataAnalysis;
}
</script>

<style lang="scss" scoped>
.widget-library {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}

.widget-library__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.widget-library__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.widget-library__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.widget-library__list {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 8px;
  list-style: none;
}

.widget-library__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.widget-library__item:hover {
  background: var(--el-fill-color-light);
}

.widget-library__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-fill-color-blank));
  color: var(--el-color-primary);
}

.widget-library__meta {
  flex: 1;
  min-width: 0;
}

.widget-library__item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.widget-library__item-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.widget-library__add {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  font-weight: 600;
}
</style>
