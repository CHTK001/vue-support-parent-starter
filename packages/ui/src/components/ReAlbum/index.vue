<template>
  <div class="re-album" :class="{ 're-album--loading': loading }">
    <div class="re-album__toolbar" v-if="toolbar">
      <el-button plain @click="handleUpload" v-if="uploadable">上传图片</el-button>
      <slot name="toolbar-extra" />
      <div class="re-album__spacer" />
      <el-select v-if="selectable" v-model="selectMode" class="re-album__select-mode">
        <el-option label="多选" :value="true" />
        <el-option label="预览" :value="false" />
      </el-select>
    </div>

    <div class="re-album__grid" :style="gridStyle">
      <div
        v-for="(item, index) in items"
        :key="item.id ?? index"
        class="re-album__item"
        :class="{
          're-album__item--selected': selectedSet.has(item.id ?? index),
          're-album__item--selecting': selectMode,
        }"
        @click="handleItemClick(item, index)"
      >
        <div class="re-album__image-wrapper">
          <img
            v-if="getSrc(item)"
            :src="getSrc(item)"
            :alt="getLabel(item)"
            class="re-album__image"
            loading="lazy"
            @click.stop="handlePreview(item, index)"
          />
          <div v-else class="re-album__placeholder">
            <slot name="placeholder" :item="item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </slot>
          </div>

          <div v-if="selectMode" class="re-album__check" :class="{ 'is-checked': selectedSet.has(item.id ?? index) }">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.36 5.14l-4 4a.5.5 0 0 1-.7 0l-2-2a.5.5 0 0 1 .7-.7L7 9.29l3.65-3.65a.5.5 0 0 1 .7.7z"/>
            </svg>
          </div>

          <div v-if="!selectMode" class="re-album__overlay">
            <slot name="overlay" :item="item" :index="index">
              <el-button circle @click.stop="handlePreview(item, index)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </el-button>
            </slot>
          </div>
        </div>

        <div class="re-album__info" v-if="getLabel(item) || $slots.info">
          <slot name="info" :item="item" :index="index">
            <span class="re-album__label">{{ getLabel(item) }}</span>
          </slot>
        </div>

        <slot name="actions" :item="item" :index="index" :remove="() => handleRemove(item, index)" />
      </div>

      <div v-if="showUploadSlot" class="re-album__item re-album__item--uploader" @click="handleUpload">
        <div class="re-album__uploader">
          <slot name="uploader">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <span>上传</span>
          </slot>
        </div>
      </div>
    </div>

    <div class="re-album__footer" v-if="pagination">
      <el-pagination
        v-if="totalPages > 1"
        background
        layout="prev, pager, next"
        :total="totalPages * 10"
        :page-size="10"
        :current-page="currentPage"
        @current-change="(p: number) => $emit('page-change', p)"
      />
    </div>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewUrls"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElButton, ElSelect, ElOption, ElPagination } from "element-plus";

export interface ReAlbumItem {
  id?: string | number;
  src?: string;
  thumb?: string;
  label?: string;
  [key: string]: unknown;
}

interface Props {
  items: ReAlbumItem[];
  srcField?: string;
  labelField?: string;
  columns?: number;
  gap?: number;
  aspectRatio?: string;
  loading?: boolean;
  toolbar?: boolean;
  uploadable?: boolean;
  selectable?: boolean;
  showUploadSlot?: boolean;
  pagination?: boolean;
  totalPages?: number;
  currentPage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  srcField: "src",
  labelField: "label",
  columns: 4,
  gap: 12,
  aspectRatio: "1",
  loading: false,
  toolbar: false,
  uploadable: false,
  selectable: false,
  showUploadSlot: false,
  pagination: false,
  totalPages: 1,
  currentPage: 1,
});

const emit = defineEmits<{
  (e: "item-click", item: ReAlbumItem, index: number): void;
  (e: "preview", item: ReAlbumItem, index: number): void;
  (e: "remove", item: ReAlbumItem, index: number): void;
  (e: "upload"): void;
  (e: "page-change", page: number): void;
  (e: "selection-change", items: ReAlbumItem[]): void;
}>();

const selectMode = ref(false);
const selectedSet = ref<Set<string | number>>(new Set());
const previewVisible = ref(false);
const previewIndex = ref(0);

function getSrc(item: ReAlbumItem): string {
  return String(item[props.srcField] ?? item.thumb ?? "");
}

function getLabel(item: ReAlbumItem): string {
  return String(item[props.labelField] ?? "");
}

const previewUrls = computed(() =>
  props.items.map((item) => getSrc(item)).filter(Boolean),
);

const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: `${props.gap}px`,
}));

function handleItemClick(item: ReAlbumItem, index: number) {
  if (selectMode.value) {
    const key = item.id ?? index;
    if (selectedSet.value.has(key)) {
      selectedSet.value.delete(key);
    } else {
      selectedSet.value.add(key);
    }
    selectedSet.value = new Set(selectedSet.value);
    const selected = props.items.filter((it, i) => selectedSet.value.has(it.id ?? i));
    emit("selection-change", selected);
    return;
  }
  emit("item-click", item, index);
}

function handlePreview(item: ReAlbumItem, index: number) {
  const urls = previewUrls.value;
  if (urls.length === 0) return;
  previewIndex.value = index;
  previewVisible.value = true;
  emit("preview", item, index);
}

function handleUpload() {
  emit("upload");
}

function handleRemove(item: ReAlbumItem, index: number) {
  emit("remove", item, index);
}
</script>

<style scoped>
.re-album {
  color: var(--el-text-color-primary);
}

.re-album--loading {
  opacity: 0.6;
  pointer-events: none;
}

.re-album__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.re-album__spacer {
  flex: 1;
}

.re-album__select-mode {
  width: 100px;
}

.re-album__grid {
  display: grid;
}

.re-album__item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  background: var(--el-fill-color-light);
}

.re-album__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.re-album__item--selected {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.re-album__item--selecting {
  cursor: pointer;
}

.re-album__image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: v-bind(aspectRatio);
  overflow: hidden;
  background: var(--el-fill-color);
}

.re-album__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.re-album__item:hover .re-album__image {
  transform: scale(1.05);
}

.re-album__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-placeholder);
}

.re-album__check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.15s;
}

.re-album__check.is-checked {
  background: var(--el-color-primary);
}

.re-album__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.re-album__item:hover .re-album__overlay {
  opacity: 1;
}

.re-album__info {
  padding: 8px 10px;
  background: var(--el-bg-color);
}

.re-album__label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.re-album__item--uploader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 2px dashed var(--el-border-color);
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.re-album__item--uploader:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.re-album__uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.re-album__footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
