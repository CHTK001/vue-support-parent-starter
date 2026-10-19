<script setup lang="ts">
/**
 * ReFilePicker 分栏视图（对齐 macOS Finder 的列视图）。
 *
 * <p>每一列是一个目录的内容，点目录在右侧展开下一列，点文件选中它；
 * 列从左到右就是沿路径逐级下钻。数据按列懒加载，复用 composable 的
 * {@code fetchItems} + {@code prepareItems}，所以 accept / 搜索 / 排序
 * 口径与其它视图完全一致。</p>
 *
 * <p>选中仍交给外层 composable（{@code pick} 事件 → selectItem），
 * 本组件只维护「列栈」和每列的高亮行。</p>
 */
import { nextTick, ref, watch } from "vue";
import { ArrowRight, Document, Files, Folder, Headset, Picture, VideoPlay } from "@element-plus/icons-vue";
import type { FilePickerItem } from "../types";
import { fileKindOf } from "../utils";

const props = defineProps<{
  /** 第一列的目录（= 当前目录） */
  basePath: string;
  /** 变化时整栈重载（刷新 / 重新打开） */
  reloadKey: number;
  /** 拉取某目录原始条目 */
  fetchItems: (path: string) => Promise<FilePickerItem[]>;
  /** accept + 搜索 + 排序后的可见条目 */
  prepareItems: (list: FilePickerItem[]) => FilePickerItem[];
  isSelected: (item: FilePickerItem) => boolean;
  canSelect: (item: FilePickerItem) => boolean;
}>();

const emit = defineEmits<{
  /** 选中一项（目录模式下目录可选、文件不可选；修饰键交给外层 selectItem 处理） */
  (e: "pick", item: FilePickerItem, event?: MouseEvent): void;
  /** 打开文件（双击 / 回车），外层按单选/多选决定是否确认 */
  (e: "open", item: FilePickerItem): void;
}>();

interface Column {
  path: string;
  raw: FilePickerItem[];
  loading: boolean;
  error: string;
  /** 该列当前高亮行的 key */
  activeKey: string;
}

const rootRef = ref<HTMLElement | null>(null);
const columns = ref<Column[]>([]);
/** 当前键盘操作所在的列 */
const activeCol = ref(0);
/** 每列的加载序号：晚到的响应不许覆盖新目录 */
const tokens: number[] = [];

const visibleItems = (index: number): FilePickerItem[] => {
  const col = columns.value[index];
  return col ? props.prepareItems(col.raw) : [];
};

const focusRow = (columnIndex: number, rowIndex: number): void => {
  void nextTick(() => {
    const el = rootRef.value?.querySelector<HTMLElement>(
      `.rfp-columns__col[data-col="${columnIndex}"] [data-row-index="${rowIndex}"]`,
    );
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
};

const loadColumn = async (index: number, path: string): Promise<void> => {
  const token = (tokens[index] = (tokens[index] ?? 0) + 1);
  try {
    const raw = await props.fetchItems(path);
    if (tokens[index] !== token) return;
    const col = columns.value[index];
    if (!col) return;
    col.raw = raw;
    col.loading = false;
    col.error = "";
  } catch (err) {
    if (tokens[index] !== token) return;
    const col = columns.value[index];
    if (!col) return;
    col.raw = [];
    col.loading = false;
    col.error = err instanceof Error ? err.message : String(err);
  }
};

/** 打开第 index 列（截断右侧旧列），focusAfter 用于键盘 → 打开后聚焦首行 */
const openColumn = async (index: number, path: string, focusAfter = false): Promise<void> => {
  columns.value = columns.value.slice(0, index);
  tokens.length = index;
  columns.value.push({ path, raw: [], loading: true, error: "", activeKey: "" });
  await loadColumn(index, path);
  if (focusAfter && visibleItems(index).length) focusRow(index, 0);
};

const resetTo = (path: string): void => {
  tokens.length = 0;
  columns.value = [{ path, raw: [], loading: true, error: "", activeKey: "" }];
  activeCol.value = 0;
  void loadColumn(0, path);
};

watch(
  () => [props.basePath, props.reloadKey] as const,
  () => resetTo(props.basePath),
  { immediate: true },
);

/** 单击：目录展开下一列（目录可选时同时选中），文件选中并收起右侧列 */
const onRowClick = (columnIndex: number, item: FilePickerItem, event: MouseEvent): void => {
  const col = columns.value[columnIndex];
  if (col) col.activeKey = item.key;
  activeCol.value = columnIndex;
  if (item.isDir) {
    emit("pick", item, event);
    void openColumn(columnIndex + 1, item.key);
    return;
  }
  // 文件：右侧更深列已无意义，收起
  columns.value = columns.value.slice(0, columnIndex + 1);
  emit("pick", item, event);
};

const onRowDblClick = (item: FilePickerItem): void => {
  if (!item.isDir) emit("open", item);
};

/* ---------- 键盘：↑↓ 列内移动，←→ 跨列，回车进入/打开 ---------- */

/**
 * 把「当前列」对齐到 DOM 焦点所在的行。
 *
 * <p>点击会让 {@code activeCol} 跟着走，但 Tab / {@code focus()} 只挪 DOM 焦点；
 * 不补这一步，用户 Tab 到第 3 列再按 ↑ 会在第 1 列里动，观感是「键盘不跟手」。</p>
 */
const syncActiveFromDom = (): void => {
  const root = rootRef.value;
  const focused = document.activeElement as HTMLElement | null;
  if (!root || !focused || !root.contains(focused)) return;
  const colEl = focused.closest<HTMLElement>(".rfp-columns__col");
  if (!colEl) return;
  const columnIndex = Number(colEl.dataset.col);
  if (Number.isNaN(columnIndex)) return;
  activeCol.value = columnIndex;
  const rowIndex = Number(focused.dataset.rowIndex);
  const col = columns.value[columnIndex];
  const item = col && rowIndex >= 0 ? visibleItems(columnIndex)[rowIndex] : undefined;
  if (col && item) col.activeKey = item.key;
};

const moveVertical = (delta: number, focus: boolean): void => {
  const columnIndex = activeCol.value;
  const col = columns.value[columnIndex];
  if (!col) return;
  const items = visibleItems(columnIndex);
  if (!items.length) return;
  let index = items.findIndex((item) => item.key === col.activeKey);
  index =
    index < 0
      ? delta > 0
        ? 0
        : items.length - 1
      : Math.min(items.length - 1, Math.max(0, index + delta));
  col.activeKey = items[index].key;
  if (focus) focusRow(columnIndex, index);
};

const moveHorizontal = (delta: number, focus: boolean): void => {
  if (delta < 0) {
    if (activeCol.value <= 0) return;
    activeCol.value -= 1;
    const columnIndex = activeCol.value;
    const col = columns.value[columnIndex];
    const items = visibleItems(columnIndex);
    const index = Math.max(0, items.findIndex((item) => item.key === col?.activeKey));
    if (focus && items.length) focusRow(columnIndex, index);
    return;
  }
  const columnIndex = activeCol.value;
  const col = columns.value[columnIndex];
  const item = visibleItems(columnIndex).find((row) => row.key === col?.activeKey);
  if (!item || !item.isDir) return;
  emit("pick", item);
  activeCol.value = columnIndex + 1;
  void openColumn(columnIndex + 1, item.key, focus);
};

/** 键盘入口：外层在分栏模式下把方向键/回车交给它，focus=false 保留输入框焦点 */
const handleKey = (event: KeyboardEvent, focus = true): boolean => {
  if (focus) syncActiveFromDom();
  switch (event.key) {
    case "ArrowDown":
      moveVertical(1, focus);
      return true;
    case "ArrowUp":
      moveVertical(-1, focus);
      return true;
    case "ArrowLeft":
      moveHorizontal(-1, focus);
      return true;
    case "ArrowRight":
      moveHorizontal(1, focus);
      return true;
    case "Enter": {
      const columnIndex = activeCol.value;
      const col = columns.value[columnIndex];
      const item = visibleItems(columnIndex).find((row) => row.key === col?.activeKey);
      if (!item) return false;
      if (item.isDir) {
        emit("pick", item);
        activeCol.value = columnIndex + 1;
        void openColumn(columnIndex + 1, item.key, focus);
      } else {
        emit("open", item);
      }
      return true;
    }
    default:
      return false;
  }
};

defineExpose({ handleKey });
</script>

<template>
  <div ref="rootRef" class="rfp-columns" role="group" aria-label="分栏文件列表">
    <section
      v-for="(col, ci) in columns"
      :key="ci"
      class="rfp-columns__col"
      :data-col="ci"
      :aria-busy="col.loading"
    >
      <div v-if="col.loading" class="rfp-columns__state">加载中…</div>
      <div v-else-if="col.error" class="rfp-columns__state is-error">{{ col.error }}</div>
      <div v-else-if="!visibleItems(ci).length" class="rfp-columns__state">空文件夹</div>

      <template v-else>
        <button
          v-for="(item, i) in visibleItems(ci)"
          :key="item.key"
          type="button"
          class="rfp-columns__row re-file-picker__item"
          :class="{
            'is-selected': isSelected(item),
            'is-active': item.key === col.activeKey,
            'is-dir': item.isDir,
            'is-disabled': !item.isDir && !canSelect(item),
          }"
          :data-row-index="i"
          :title="item.key"
          :aria-label="item.name"
          :aria-pressed="isSelected(item)"
          :aria-disabled="!item.isDir && !canSelect(item)"
          @click="onRowClick(ci, item, $event)"
          @dblclick="onRowDblClick(item)"
        >
          <el-icon v-if="item.isDir" :size="15" class="rfp-file-icon rfp-file-icon--dir"><Folder /></el-icon>
          <el-icon v-else-if="fileKindOf(item) === 'image'" :size="15" class="rfp-file-icon rfp-file-icon--image"><Picture /></el-icon>
          <el-icon v-else-if="fileKindOf(item) === 'video'" :size="15" class="rfp-file-icon rfp-file-icon--video"><VideoPlay /></el-icon>
          <el-icon v-else-if="fileKindOf(item) === 'audio'" :size="15" class="rfp-file-icon rfp-file-icon--audio"><Headset /></el-icon>
          <el-icon v-else-if="fileKindOf(item) === 'pdf'" :size="15" class="rfp-file-icon rfp-file-icon--pdf"><Document /></el-icon>
          <el-icon v-else :size="15" class="rfp-file-icon"><Files /></el-icon>
          <span class="rfp-columns__name">{{ item.name }}</span>
          <el-icon v-if="item.isDir" :size="13" class="rfp-columns__chevron"><ArrowRight /></el-icon>
        </button>
      </template>
    </section>
  </div>
</template>

<style scoped>
/* 分栏：横向排列的列，每列一个目录；列多时整体横向滚动 */
.rfp-columns {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--rfp-surface);
  scrollbar-width: thin;
}

.rfp-columns__col {
  flex: 0 0 216px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 6px;
  border-right: 1px solid var(--rfp-border);
  overflow-y: auto;
  overflow-x: hidden;
}

.rfp-columns__col:last-child {
  flex-grow: 1;
}

.rfp-columns__state {
  padding: 14px 10px;
  color: var(--rfp-text-weak);
  font-size: 12px;
}

.rfp-columns__state.is-error {
  color: var(--el-color-danger);
  word-break: break-all;
}

/* 行：与详细信息行同观；选中用同一套「主色左条 + 淡底 + 轻投影」语言 */
.rfp-columns__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--rfp-radius);
  background: transparent;
  color: var(--rfp-text);
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.12s), border-color var(--el-transition-duration, 0.12s),
    box-shadow var(--el-transition-duration, 0.12s);
}

.rfp-columns__row:hover,
.rfp-columns__row.is-active {
  background: var(--rfp-hover);
}

.rfp-columns__row.is-selected {
  border-color: var(--rfp-select-border);
  background: linear-gradient(
    to right,
    var(--rfp-select-bg),
    color-mix(in srgb, var(--rfp-accent) 7%, transparent)
  );
  box-shadow: 0 1px 4px color-mix(in srgb, var(--rfp-accent) 12%, transparent);
}

.rfp-columns__row.is-selected::before {
  content: "";
  position: absolute;
  left: 1px;
  top: 5px;
  bottom: 5px;
  width: 3px;
  border-radius: 2px;
  background: var(--rfp-accent);
  box-shadow: 0 0 6px var(--rfp-glow);
}

.rfp-columns__row.is-disabled {
  opacity: 0.55;
  cursor: default;
}

.rfp-columns__row.is-disabled:hover {
  background: transparent;
}

.rfp-columns__row:focus-visible {
  outline: 2px solid var(--rfp-accent);
  outline-offset: -2px;
}

.rfp-columns__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-columns__row.is-dir .rfp-columns__name {
  font-weight: 600;
}

.rfp-columns__chevron {
  flex-shrink: 0;
  color: var(--rfp-text-weak);
}

@media (max-width: 760px) {
  .rfp-columns__col {
    flex-basis: 168px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rfp-columns__row {
    transition: none;
  }
}
</style>
