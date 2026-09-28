<script setup lang="ts">
/**
 * 预览工具栏组件。
 *
 * 提供缩放控制（25%-300%，步进 25%）和全屏切换按钮，
 * 用于 PDF、Office、Font 等 iframe 预览类型。
 *
 * @author Buffy
 * @since 2026/09/10
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { FullScreen, QuestionFilled, RefreshRight, ZoomIn, ZoomOut } from "@element-plus/icons-vue";

/** 缩放比例 */
const zoom = defineModel<number>("zoom", { default: 100 });

/** 放大 */
function zoomIn(): void {
  zoom.value = Math.min(zoom.value + 25, 300);
}
/** 缩小 */
function zoomOut(): void {
  zoom.value = Math.max(zoom.value - 25, 25);
}
/** 重置缩放 */
function zoomReset(): void {
  zoom.value = 100;
}

const emit = defineEmits<{
  fullscreen: [];
}>();

/** 快捷键一览表可见性 */
const shortcutPopoverVisible = ref(false);

/** 切换快捷键帮助弹窗（供父组件通过 ref 调用） */
function toggleHelp(): void {
  shortcutPopoverVisible.value = !shortcutPopoverVisible.value;
  if (!shortcutPopoverVisible.value) {
    shortcutSearch.value = "";
    debouncedSearch.value = "";
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  }
}
defineExpose({ toggleHelp });

/** 快捷键搜索关键词（输入框实时值） */
const shortcutSearch = ref("");
/** 防抖后的搜索关键词（用于过滤和高亮，300ms 延迟） */
const debouncedSearch = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(shortcutSearch, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val;
  }, 300);
});

onBeforeUnmount(() => { if (debounceTimer) clearTimeout(debounceTimer); });

/** 快捷键列表 */
const shortcuts = [
  { keys: "+" , desc: "放大" },
  { keys: "-" , desc: "缩小" },
  { keys: "0 / R", desc: "重置缩放" },
  { keys: "F" , desc: "全屏切换" },
  { keys: "Esc", desc: "退出全屏 / 关闭弹窗" },
  { keys: "?" , desc: "显示/隐藏快捷键帮助" },
];

/** 快捷键总数 */
const totalCount = shortcuts.length;

/** 按关键词过滤快捷键（使用防抖后的值） */
const filteredShortcuts = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase();
  if (!q) return shortcuts;
  return shortcuts.filter(s =>
    s.keys.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
  );
});

/** 是否正在搜索 */
const isSearching = computed(() => debouncedSearch.value.trim().length > 0);

/** 匹配计数文本 */
const matchCountText = computed(() => {
  return `${filteredShortcuts.value.length}/${totalCount} 匹配`;
});

/** 高亮匹配文本（使用防抖后的值） */
function highlight(text: string): string {
  const q = debouncedSearch.value.trim();
  if (!q) return text;
  // 转义正则特殊字符，然后全局匹配（大小写不敏感）
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return text.replace(re, '<mark class="shortcut-highlight">$1</mark>');
}

/** 点击外部关闭快捷键帮助 */
function onDocClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!target.closest(".preview-toolbar")) {
    shortcutPopoverVisible.value = false;
  }
}
document.addEventListener("click", onDocClick, true);
onBeforeUnmount(() => document.removeEventListener("click", onDocClick, true));
</script>

<template>
  <div class="preview-toolbar">
    <el-button-group>
      <el-button :icon="ZoomOut" @click="zoomOut" :disabled="zoom <= 25" title="缩小 (-)" />
      <el-button class="!px-3" disabled>{{ zoom }}%</el-button>
      <el-button :icon="ZoomIn" @click="zoomIn" :disabled="zoom >= 300" title="放大 (+)" />
      <el-button :icon="RefreshRight" @click="zoomReset" title="重置 (0/R)" />
    </el-button-group>
    <el-button :icon="FullScreen" @click="emit('fullscreen')" title="全屏 (F)" />
    <el-popover
      placement="bottom"
      :width="280"
      :visible="shortcutPopoverVisible"
      :teleported="false"
      transition="popover-fade-scale"
    >
      <template #reference>
        <el-button
          :icon="QuestionFilled"

          circle
          title="快捷键帮助 (?)"
          @click="shortcutPopoverVisible = !shortcutPopoverVisible"
        />
      </template>
      <div class="shortcut-help">
        <div class="shortcut-help__title">快捷键一览</div>
        <div class="shortcut-help__search-row">
          <el-input
            v-model="shortcutSearch"
            placeholder="搜索快捷键…"

            clearable
            class="shortcut-help__search"
          />
          <span v-if="isSearching" class="shortcut-help__match-count">{{ matchCountText }}</span>
        </div>
        <div class="shortcut-help__list">
          <div
            v-for="s in filteredShortcuts"
            :key="s.keys"
            class="shortcut-help__row"
          >
            <kbd class="shortcut-help__keys" v-html="highlight(s.keys)" />
            <span class="shortcut-help__desc" v-html="highlight(s.desc)" />
          </div>
          <div v-if="filteredShortcuts.length === 0" class="shortcut-help__empty">
            <el-icon class="shortcut-help__empty-icon" :size="28"><QuestionFilled /></el-icon>
            <span>未找到匹配的快捷键</span>
            <span class="shortcut-help__empty-hint">试试其他关键词？</span>
            <el-button
              type="primary"

              text
              @click="shortcutSearch = ''"
            >
              清空搜索
            </el-button>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 0;
  width: 100%;
}

.shortcut-help {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-help__search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.shortcut-help__search {
  flex: 1;
}

.shortcut-help__match-count {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.shortcut-help__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.shortcut-help__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 16px 0 8px;
}

.shortcut-help__empty-icon {
  color: var(--el-color-info-light-5);
}

.shortcut-help__empty-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.shortcut-help__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.shortcut-help__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: var(--el-radius-xs, 4px);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.shortcut-help__row:hover {
  background-color: var(--el-fill-color-light);
}

.shortcut-help__keys {
  display: inline-block;
  min-width: 52px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  text-align: center;
  /* 原来用 box-shadow: 0 1px 0 var(--el-border-color) 模拟按键下沿的立体感，
     但它自身已经有 1px 边框，阴影纯属冗余装饰（koi 规约：容器不加投影），故去掉 */
}

.shortcut-help__desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* ---- 弹窗弹出/收起 fade+scale 过渡 ---- */
.popover-fade-scale-enter-active,
.popover-fade-scale-leave-active {
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease, transform var(--el-transition-duration-fast, 0.2s) ease;
}

.popover-fade-scale-enter-from,
.popover-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

@keyframes highlightFadeIn {
  from {
    opacity: 0;
    background: transparent;
  }
  to {
    opacity: 1;
    background: var(--el-color-danger-light-9);
  }
}

.shortcut-help :deep(.shortcut-highlight) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  /* 搜索命中的高亮底纹，2px 比 koi 最小档 4px 还小，用 EP 自带的 --el-border-radius-small */
  border-radius: var(--el-border-radius-small, 2px);
  padding: 0 2px;
  font-weight: 600;
  animation: highlightFadeIn var(--el-transition-duration-fast, 0.2s) ease-out;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .shortcut-help__row {
    transition: none;
  }
  .popover-fade-scale-enter-active,
  .popover-fade-scale-leave-active {
    transition: none;
  }
  /* 命中高亮的淡入可以直接停：.shortcut-highlight 自身已经静态带着同一个浅红底色，
     关掉动画不会让「命中」这件事消失 */
  .shortcut-help :deep(.shortcut-highlight) {
    animation: none;
  }
}
</style>
