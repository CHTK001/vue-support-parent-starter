<script setup lang="ts">
/**
 * ReFilePicker 内容区 —— 详细信息列表 + 大/中/小图标视图：
 * 详细信息对齐资源管理器（灰色表头 + 列排序），图标视图按单元格平铺。
 *
 * <p>「..」由父级传入（参与排序/过滤之外），行点击/双击分别对外抛
 * activate/open，键盘高亮行由 activeIndex 驱动并自动滚入可视区。</p>
 */
import { nextTick, ref, watch } from "vue";
import {
  Document,
  Files,
  Folder,
  FolderOpened,
  Headset,
  Loading,
  Picture,
  VideoPlay,
  WarningFilled,
} from "@element-plus/icons-vue";
import type { FilePickerColumn, FilePickerItem, FilePickerSortKey, FilePickerViewMode } from "../types";
import { fileKindOf, fileTypeText, formatSize, formatTime } from "../utils";

const props = defineProps<{
  rows: FilePickerItem[];
  columns: FilePickerColumn[];
  parentEntry: FilePickerItem | null;
  loading: boolean;
  loadError: string;
  searching: boolean;
  sortKey: FilePickerSortKey;
  sortAsc: boolean;
  activeIndex: number;
  isSelected: (item: FilePickerItem) => boolean;
  /** 该条目当前是否可选（目录模式下文件仅展示） */
  canSelect: (item: FilePickerItem) => boolean;
  /** 视图模式：详细信息 / 大图标 / 中图标 / 小图标 */
  viewMode: FilePickerViewMode;
}>();

const emit = defineEmits<{
  (e: "sort", key: FilePickerSortKey): void;
  (e: "activate", item: FilePickerItem, index: number, event?: MouseEvent): void;
  (e: "open", item: FilePickerItem): void;
  (e: "navigate", path: string): void;
  /** 键盘二维导航回传高亮位 */
  (e: "move-active", index: number): void;
}>();

const detailsRef = ref<HTMLElement | null>(null);

const sortArrow = (key: FilePickerSortKey): string =>
  props.sortKey === key ? (props.sortAsc ? "↑" : "↓") : "";

/** 键盘高亮行变化时滚入可视区（焦点同步由 moveActive 负责） */
watch(
  () => props.activeIndex,
  async (index) => {
    if (index < 0) return;
    await nextTick();
    detailsRef.value?.querySelector<HTMLElement>(`[data-row-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  },
);

type MoveDirection = "up" | "down" | "left" | "right";

/**
 * 按方向找下一个高亮项。
 *
 * <p>详细信息视图是单列，↑/↓ 按 DOM 顺序线性移动，←/→ 不动作；
 * 图标视图按单元格矩形做二维寻路：←/→ 走同一行，↑/↓ 走相邻行，
 * 边缘没有候选时返回 null（不越界回绕），列数由布局自己决定，
 * 不依赖固定列数。</p>
 */
const findNextIndex = (direction: MoveDirection): number | null => {
  const container = detailsRef.value;
  if (!container) return null;
  const cells = Array.from(container.querySelectorAll<HTMLElement>(".re-file-picker__item"));
  if (!cells.length) return null;

  // 高亮位优先；activeIndex 为 -1（Tab 进来 / 程序聚焦）时退回当前 DOM 焦点所在格
  const focused = document.activeElement as HTMLElement | null;
  const focusedCell =
    focused && focused.classList.contains("re-file-picker__item") && container.contains(focused) ? focused : null;
  const current =
    props.activeIndex >= 0
      ? cells.find((el) => Number(el.dataset.rowIndex) === props.activeIndex) ?? focusedCell
      : focusedCell;

  // 还没有高亮项：↓/→ 落到第一项，↑/← 落到最后一项
  if (!current) {
    const fallback = direction === "up" || direction === "left" ? cells[cells.length - 1] : cells[0];
    return Number(fallback.dataset.rowIndex);
  }

  if (props.viewMode === "details") {
    if (direction === "left" || direction === "right") return null;
    const currentIndex = cells.indexOf(current);
    const nextIndex = direction === "down" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= cells.length) return null;
    return Number(cells[nextIndex].dataset.rowIndex);
  }

  const currentRect = current.getBoundingClientRect();
  const cx = currentRect.left + currentRect.width / 2;
  const cy = currentRect.top + currentRect.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const cell of cells) {
    if (cell === current) continue;
    const rect = cell.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - cx;
    const dy = rect.top + rect.height / 2 - cy;
    let primary: number;
    let secondary: number;
    if (direction === "up") {
      if (dy >= -1) continue;
      primary = -dy;
      secondary = Math.abs(dx);
    } else if (direction === "down") {
      if (dy <= 1) continue;
      primary = dy;
      secondary = Math.abs(dx);
    } else if (direction === "left") {
      if (dx >= -1) continue;
      primary = -dx;
      secondary = Math.abs(dy);
    } else {
      if (dx <= 1) continue;
      primary = dx;
      secondary = Math.abs(dy);
    }
    // 主轴距离为主、横向错位加权重：相邻单元格总是比斜对角更近
    const score = primary + secondary * 4;
    if (score < bestScore) {
      bestScore = score;
      best = cell;
    }
  }

  return best ? Number(best.dataset.rowIndex) : null;
};

/**
 * 键盘导航入口，由父组件调用。
 *
 * <p>focus=false 时只移动高亮、不抢输入框焦点（搜索框里边输入边看结果）；
 * focus=true 时把 DOM 焦点同步到高亮项，回车才会作用在正确的那一行。</p>
 */
const moveActive = (direction: MoveDirection, focus = true): void => {
  const next = findNextIndex(direction);
  if (next == null) return;
  emit("move-active", next);
  if (!focus) return;
  void nextTick(() => {
    const el = detailsRef.value?.querySelector<HTMLElement>(`[data-row-index="${next}"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest" });
  });
};

defineExpose({ moveActive });
</script>

<template>
  <main class="rfp-main" :class="{ 'is-loading': loading }" :aria-busy="loading">
    <div v-if="loading" class="rfp-main__progress" aria-hidden="true" />

    <div v-if="loadError" class="rfp-main__state rfp-main__state--error">
      <el-icon :size="26"><WarningFilled /></el-icon>
      <div>
        <b>目录加载失败</b>
        <span>{{ loadError }}</span>
      </div>
    </div>

    <template v-else-if="rows.length || (parentEntry && !searching)">
      <!-- 详细信息 -->
      <template v-if="viewMode === 'details'">
        <div class="rfp-details__head" role="row">
          <button
            v-for="col in columns"
            :key="col.key"
            type="button"
            class="rfp-details__head-cell"
            :class="[col.className, { 'is-sorted': sortKey === col.key }]"
            :aria-label="`排序：${col.label}`"
            @click="emit('sort', col.key)"
          >
            {{ col.label }}
            <span class="rfp-sort-arrow">{{ sortArrow(col.key) }}</span>
          </button>
        </div>

        <div ref="detailsRef" class="rfp-details">
          <button
            v-if="parentEntry"
            type="button"
            class="rfp-details__row rfp-details__row--parent rfp-parent"
            title="返回上级目录"
            @click="emit('navigate', parentEntry.key)"
          >
            <span class="rfp-details__name">
              <el-icon :size="16" class="rfp-file-icon rfp-file-icon--dir"><FolderOpened /></el-icon>
              <span>..</span>
            </span>
            <span class="rfp-details__time">-</span>
            <span class="rfp-details__type">上级目录</span>
            <span class="rfp-details__size">-</span>
          </button>

          <button
            v-for="(item, i) in rows"
            :key="item.key"
            type="button"
            class="rfp-details__row re-file-picker__item"
            :class="{
              'is-selected': isSelected(item),
              'is-active': i === activeIndex,
              'is-dir': item.isDir,
              'is-disabled': !item.isDir && !canSelect(item),
            }"
            :data-row-index="i"
            :title="item.key"
            :aria-label="item.name"
            :aria-pressed="isSelected(item)"
            :aria-disabled="!item.isDir && !canSelect(item)"
            @click="emit('activate', item, i, $event)"
            @dblclick="emit('open', item)"
          >
            <span class="rfp-details__name">
              <img v-if="!item.isDir && item.thumbnail" :src="item.thumbnail" class="rfp-details__thumb" alt="" />
              <el-icon v-else-if="item.isDir" :size="16" class="rfp-file-icon rfp-file-icon--dir"><Folder /></el-icon>
              <el-icon v-else-if="fileKindOf(item) === 'image'" :size="16" class="rfp-file-icon rfp-file-icon--image"><Picture /></el-icon>
              <el-icon v-else-if="fileKindOf(item) === 'video'" :size="16" class="rfp-file-icon rfp-file-icon--video"><VideoPlay /></el-icon>
              <el-icon v-else-if="fileKindOf(item) === 'audio'" :size="16" class="rfp-file-icon rfp-file-icon--audio"><Headset /></el-icon>
              <el-icon v-else-if="fileKindOf(item) === 'pdf'" :size="16" class="rfp-file-icon rfp-file-icon--pdf"><Document /></el-icon>
              <el-icon v-else :size="16" class="rfp-file-icon"><Files /></el-icon>
              <span class="rfp-details__name-text" :class="{ 'is-dir': item.isDir }">{{ item.name }}</span>
            </span>
            <span class="rfp-details__time">{{ formatTime(item.updatedAt) }}</span>
            <span class="rfp-details__type">{{ item.isDir ? "文件夹" : fileTypeText(item.name) }}</span>
            <span class="rfp-details__size">{{ item.isDir ? "-" : formatSize(item.size) }}</span>
          </button>
        </div>
      </template>

      <!-- 大 / 中 / 小图标 -->
      <div v-else ref="detailsRef" class="rfp-grid" :class="`rfp-grid--${viewMode}`">
        <button
          v-if="parentEntry"
          type="button"
          class="rfp-grid__cell rfp-grid__cell--parent"
          title="返回上级目录"
          @click="emit('navigate', parentEntry.key)"
        >
          <span class="rfp-grid__thumb">
            <el-icon class="rfp-grid__icon rfp-file-icon rfp-file-icon--dir"><FolderOpened /></el-icon>
          </span>
          <span class="rfp-grid__name is-dir">..</span>
          <span v-if="viewMode !== 'smallIcons'" class="rfp-grid__meta">上级目录</span>
        </button>

        <button
          v-for="(item, i) in rows"
          :key="item.key"
          type="button"
          class="rfp-grid__cell re-file-picker__item"
          :class="{
            'is-selected': isSelected(item),
            'is-active': i === activeIndex,
            'is-dir': item.isDir,
            'is-disabled': !item.isDir && !canSelect(item),
          }"
          :data-row-index="i"
          :title="item.key"
          :aria-label="item.name"
          :aria-pressed="isSelected(item)"
          :aria-disabled="!item.isDir && !canSelect(item)"
          @click="emit('activate', item, i, $event)"
          @dblclick="emit('open', item)"
        >
          <span class="rfp-grid__thumb">
            <img
              v-if="!item.isDir && item.thumbnail && viewMode !== 'smallIcons'"
              :src="item.thumbnail"
              class="rfp-grid__thumb-img rfp-details__thumb"
              alt=""
            />
            <el-icon v-else-if="item.isDir" class="rfp-grid__icon rfp-file-icon rfp-file-icon--dir"><Folder /></el-icon>
            <el-icon v-else-if="fileKindOf(item) === 'image'" class="rfp-grid__icon rfp-file-icon rfp-file-icon--image"><Picture /></el-icon>
            <el-icon v-else-if="fileKindOf(item) === 'video'" class="rfp-grid__icon rfp-file-icon rfp-file-icon--video"><VideoPlay /></el-icon>
            <el-icon v-else-if="fileKindOf(item) === 'audio'" class="rfp-grid__icon rfp-file-icon rfp-file-icon--audio"><Headset /></el-icon>
            <el-icon v-else-if="fileKindOf(item) === 'pdf'" class="rfp-grid__icon rfp-file-icon rfp-file-icon--pdf"><Document /></el-icon>
            <el-icon v-else class="rfp-grid__icon rfp-file-icon"><Files /></el-icon>
          </span>
          <span class="rfp-grid__name" :class="{ 'is-dir': item.isDir }">{{ item.name }}</span>
          <span v-if="viewMode !== 'smallIcons'" class="rfp-grid__meta">
            {{ item.isDir ? "" : formatSize(item.size) }}
          </span>
        </button>
      </div>

      <div v-if="!rows.length && !searching" class="rfp-main__hint">当前目录为空</div>
    </template>

    <div v-else-if="!loading" class="rfp-main__state">
      <slot name="empty">
        <el-icon :size="40" class="rfp-main__empty-icon"><FolderOpened /></el-icon>
        <span>{{ searching ? "未找到匹配项" : "当前目录为空" }}</span>
      </slot>
    </div>

    <div v-if="loading && !rows.length && !loadError" class="rfp-main__state">
      <el-icon :size="22" class="is-spin"><Loading /></el-icon>
      <span>加载中…</span>
    </div>
  </main>
</template>

<style scoped>
/* 内容区：白色细节视图面板 */
.rfp-main {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--rfp-surface);
  overflow: hidden;
}

/* 加载进度条：顶部细线，不遮挡内容（不影响命中测试） */
.rfp-main__progress {
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    var(--rfp-accent),
    transparent
  );
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: rfp-progress 1.1s ease-in-out infinite;
}

/* 加载期间旧列表只作为占位，不接受点击：避免在过渡窗口里又点进另一层目录 */
.rfp-main.is-loading .rfp-details,
.rfp-main.is-loading .rfp-grid {
  pointer-events: none;
  opacity: 0.65;
}

@keyframes rfp-progress {
  0% {
    background-position: -40% 0;
  }
  100% {
    background-position: 140% 0;
  }
}

.rfp-main__state {
  flex: 1;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--rfp-text-weak);
  font-size: 13px;
}

.rfp-main__empty-icon {
  color: var(--el-text-color-placeholder);
}

.rfp-main__state .is-spin {
  animation: rfp-spin 0.8s linear infinite;
}

.rfp-main__state--error {
  color: var(--el-color-danger);
  text-align: center;
  padding: 24px;
}

.rfp-main__state--error div {
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rfp-main__state--error span {
  color: var(--rfp-text-weak);
  font-size: 12px;
  word-break: break-all;
}

/* 空目录：保留「..」入口的同时给一行提示，别让用户以为列表没渲染 */
.rfp-main__hint {
  flex-shrink: 0;
  padding: 14px 16px 18px;
  text-align: center;
  color: var(--rfp-text-weak);
  font-size: 12px;
}

@keyframes rfp-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 详细信息列表：四列网格（名称 / 修改时间 / 类型 / 大小） */
.rfp-details__head,
.rfp-details__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 148px 96px 88px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 13px;
}

/* 表头：浅灰底、细下边线，列可点排序 */
.rfp-details__head {
  flex-shrink: 0;
  height: 32px;
  border-bottom: 1px solid var(--rfp-border);
  background: var(--rfp-head);
  font-size: 12px;
  font-weight: 600;
  color: var(--rfp-text-weak);
}

.rfp-details__head-cell {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 100%;
  padding: 0 4px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  user-select: none;
}

.rfp-details__head-cell.rfp-details__size {
  justify-content: flex-end;
}

.rfp-details__head-cell:hover,
.rfp-details__head-cell.is-sorted {
  color: var(--rfp-accent);
}

.rfp-details__head-cell:focus-visible {
  outline: 2px solid var(--rfp-accent);
  outline-offset: -2px;
}

.rfp-sort-arrow {
  color: var(--rfp-accent);
  font-weight: 700;
}

.rfp-details {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 0 6px;
}

/* 行：紧凑行高 + 悬停/选中浅蓝（资源管理器观感） */
.rfp-details__row {
  width: 100%;
  min-height: 32px;
  border: 1px solid transparent;
  border-radius: var(--rfp-radius);
  background: transparent;
  color: var(--rfp-text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.12s), border-color var(--el-transition-duration, 0.12s);
}

.rfp-details__row:hover {
  background: var(--rfp-hover);
}

/* 目录模式下的文件：仅用于确认「目标目录里有什么」，不可选 */
.rfp-details__row.is-disabled {
  opacity: 0.55;
  cursor: default;
}

.rfp-details__row.is-disabled:hover {
  background: transparent;
}

.rfp-details__row.is-active {
  background: var(--rfp-hover);
}

.rfp-details__row.is-selected {
  border-color: var(--rfp-select-border);
  background: var(--rfp-select-bg);
}

.rfp-details__row:focus-visible {
  outline: 2px solid var(--rfp-accent);
  outline-offset: -2px;
}

.rfp-details__row--parent {
  color: var(--rfp-text-weak);
}

.rfp-details__name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* 图标按类型着色：文件夹暖黄、图片绿、视频紫、音频橙、PDF 红 */
.rfp-file-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.rfp-file-icon--dir {
  color: var(--rfp-folder);
}

.rfp-file-icon--image {
  color: var(--el-color-success);
}

.rfp-file-icon--video {
  color: #8b5cf6;
}

.rfp-file-icon--audio {
  color: var(--el-color-warning);
}

.rfp-file-icon--pdf {
  color: var(--el-color-danger);
}

.rfp-details__name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-details__name-text.is-dir {
  color: var(--rfp-text);
  font-weight: 600;
}

.rfp-details__thumb {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 3px;
  background: var(--el-fill-color-light);
}

.rfp-details__type,
.rfp-details__time {
  color: var(--rfp-text-weak);
}

.rfp-details__size {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.rfp-details__time {
  font-variant-numeric: tabular-nums;
}

/* ==================== 图标视图（大 / 中 / 小） ==================== */

.rfp-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px 16px;
  align-content: start;
}

.rfp-grid--largeIcons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.rfp-grid--mediumIcons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 6px;
}

.rfp-grid--smallIcons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 2px;
}

.rfp-grid__cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px 10px;
  border: 1px solid transparent;
  border-radius: var(--rfp-radius);
  background: transparent;
  color: var(--rfp-text);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.rfp-grid__cell:hover,
.rfp-grid__cell.is-active {
  background: var(--rfp-hover);
}

.rfp-grid__cell.is-selected {
  border-color: var(--rfp-select-border);
  background: var(--rfp-select-bg);
}

.rfp-grid__cell.is-disabled {
  opacity: 0.55;
  cursor: default;
}

.rfp-grid__cell.is-disabled:hover {
  background: transparent;
}

.rfp-grid__cell:focus-visible {
  outline: 2px solid var(--rfp-accent);
  outline-offset: -2px;
}

.rfp-grid__thumb {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rfp-grid__thumb-img {
  width: 100%;
  height: 100%;
}

.rfp-grid__icon {
  flex-shrink: 0;
}

.rfp-grid--largeIcons .rfp-grid__icon {
  font-size: 68px;
}

.rfp-grid--mediumIcons .rfp-grid__thumb {
  width: 50px;
  height: 50px;
}

.rfp-grid--mediumIcons .rfp-grid__icon {
  font-size: 42px;
}

.rfp-grid__name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.rfp-grid__name.is-dir {
  font-weight: 600;
}

.rfp-grid__meta {
  width: 100%;
  min-height: 15px;
  line-height: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rfp-text-weak);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

/* 小图标：紧凑横向行 */
.rfp-grid--smallIcons .rfp-grid__cell {
  min-height: 36px;
  flex-direction: row;
  gap: 8px;
  padding: 0 8px;
  text-align: left;
}

.rfp-grid--smallIcons .rfp-grid__thumb {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.rfp-grid--smallIcons .rfp-grid__icon {
  font-size: 16px;
}

.rfp-grid--smallIcons .rfp-grid__name {
  width: auto;
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .rfp-details__row,
  .rfp-grid__cell,
  .rfp-main__progress {
    transition: none;
    animation: none;
  }
}
</style>
