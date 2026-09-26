<template>
  <div class="re-album" :class="`re-album--${mode}`">
    <div
      v-if="mode === 'grid'"
      class="re-album__grid"
      :style="{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }"
    >
      <div
        v-for="(item, index) in data"
        :key="item.id"
        class="re-album-item"
        :class="{ 're-album-item--selected': isSelected(item.id) }"
        @click="handleClick(item, index)"
      >
        <div class="re-album-item__thumb" :style="{ aspectRatio: aspectRatio ? `${aspectRatio}` : undefined }">
          <img
            v-if="item.thumb || item.src"
            :src="item.thumb || item.src"
            :alt="item.title || ''"
            loading="lazy"
            @error="(e: Event) => (e.target as HTMLImageElement).src = fallbackImage"
          />
          <div v-else class="re-album-item__placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div v-if="selectable" class="re-album-item__select-overlay">
            <div class="re-album-item__checkbox" :class="{ 're-album-item__checkbox--checked': isSelected(item.id) }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
          </div>
        </div>
        <div v-if="item.title || item.description || item.tags?.length" class="re-album-item__info">
          <div v-if="item.title" class="re-album-item__title">{{ item.title }}</div>
          <div v-if="item.description" class="re-album-item__description">{{ item.description }}</div>
          <div v-if="item.tags?.length" class="re-album-item__tags">
            <span v-for="tag in item.tags" :key="tag" class="re-album-item__tag">{{ tag }}</span>
          </div>
          <div v-if="item.date" class="re-album-item__date">{{ item.date }}</div>
        </div>
      </div>
    </div>

    <div v-else class="re-album__list">
      <div
        v-for="(item, index) in data"
        :key="item.id"
        class="re-album-list-item"
        :class="{ 're-album-list-item--selected': isSelected(item.id) }"
        @click="handleClick(item, index)"
      >
        <div class="re-album-list-item__thumb">
          <img :src="item.thumb || item.src" :alt="item.title || ''" loading="lazy" />
        </div>
        <div class="re-album-list-item__content">
          <div class="re-album-list-item__title">{{ item.title }}</div>
          <div v-if="item.description" class="re-album-list-item__description">{{ item.description }}</div>
          <div v-if="item.tags?.length" class="re-album-list-item__tags">
            <span v-for="tag in item.tags" :key="tag" class="re-album-list-item__tag">{{ tag }}</span>
          </div>
        </div>
        <div v-if="item.date" class="re-album-list-item__date">{{ item.date }}</div>
      </div>
    </div>

    <div v-if="!data.length" class="re-album__empty">
      <slot name="empty">
        <span class="re-album__empty-text">暂无图片</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReAlbumItem } from "./types";
// 卡片视觉基线（库级共享）：圆角 / 投影 / 悬停令牌
import "../shared/re-surface.css";

const props = withDefaults(
  defineProps<{
    data: ReAlbumItem[];
    mode?: "grid" | "list";
    columns?: number;
    gap?: number;
    aspectRatio?: string;
    selectable?: boolean;
    selectedKeys?: (string | number)[];
    modelValue?: (string | number)[];
    fallbackImage?: string;
  }>(),
  {
    data: () => [],
    mode: "grid",
    columns: 3,
    gap: 12,
    aspectRatio: "",
    selectable: false,
    selectedKeys: () => [],
    modelValue: undefined,
    fallbackImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='%23ccc'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E",
  },
);

const emit = defineEmits<{
  (e: "item-click", payload: { item: ReAlbumItem; index: number; album: ReAlbumItem[] }): void;
  (e: "update:selectedKeys", keys: (string | number)[]): void;
  (e: "update:modelValue", keys: (string | number)[]): void;
}>();

const internalSelected = ref<(string | number)[]>([]);

const effectiveSelected = computed<(string | number)[]>(() => {
  return props.modelValue ?? props.selectedKeys ?? internalSelected.value;
});

function isSelected(id: string | number): boolean {
  return effectiveSelected.value.includes(id);
}

function handleClick(item: ReAlbumItem, index: number): void {
  if (props.selectable) {
    const list = [...effectiveSelected.value];
    const idx = list.indexOf(item.id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(item.id);
    }
    internalSelected.value = list;
    emit("update:selectedKeys", list);
    if (props.modelValue !== undefined) {
      emit("update:modelValue", list);
    }
  }
  emit("item-click", { item, index, album: props.data });
}
</script>

<script lang="ts">
import { computed, ref } from "vue";
export default { name: "ReAlbum" };
</script>

<style scoped>
.re-album__grid {
  display: grid;
}

.re-album__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Grid 模式条目：圆角 / 投影 / 悬停上浮走库级基线令牌
   （components/shared/re-surface.css），不再自写一套边框 + 阴影值；
   --selected 是组件特有状态，保留。 */
.re-album-item {
  border-radius: var(--re-surface-radius-dense, 8px);
  overflow: hidden;
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  box-shadow: var(--re-surface-shadow-dense);
  transition:
    transform var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;
}

.re-album-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--re-surface-shadow-dense-hover);
}

.re-album-item--selected {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.re-album-item__thumb {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--el-fill-color);
}

.re-album-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.re-album-item__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--el-text-color-placeholder);
}

.re-album-item__select-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.15s;
}

.re-album-item:hover .re-album-item__select-overlay {
  opacity: 1;
}

.re-album-item__checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, border-color 0.15s;
}

.re-album-item__checkbox--checked {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.re-album-item__info {
  padding: 10px 12px 12px;
}

.re-album-item__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-album-item__description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.re-album-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.re-album-item__tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.re-album-item__date {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

/* List mode */
.re-album-list-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  border: 1px solid var(--el-border-color-lighter);
}

.re-album-list-item:hover {
  background: var(--el-fill-color-light);
}

.re-album-list-item--selected {
  box-shadow: inset 0 0 0 2px var(--el-color-primary);
}

.re-album-list-item__thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--el-fill-color);
}

.re-album-list-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.re-album-list-item__content {
  flex: 1;
  min-width: 0;
}

.re-album-list-item__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.re-album-list-item__description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.re-album-list-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.re-album-list-item__tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.re-album-list-item__date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

/* Empty */
.re-album__empty {
  padding: 48px 0;
  text-align: center;
}

.re-album__empty-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
