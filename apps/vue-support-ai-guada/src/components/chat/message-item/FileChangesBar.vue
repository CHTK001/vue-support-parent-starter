<template>
  <div class="file-changes-bar">
    <!-- 折叠态：摘要行 -->
    <div class="fcb__header" @click="expanded = !expanded">
      <span class="fcb__summary">
        {{ t('chat.fileChanges.summary', { count: changes.length }) }}
      </span>
      <span class="fcb__stats">
        <span class="fcb__added">+{{ totalAdded }}</span>
        <span class="fcb__removed">−{{ totalRemoved }}</span>
      </span>
    </div>

    <!-- 展开态：文件列表 -->
    <transition name="fcb-expand">
      <div v-if="expanded" class="fcb__list">
        <div
          v-for="entry in changes"
          :key="entry.filePath"
          class="fcb__file-row"
          @click="openFile(entry.filePath)"
        >
          <span class="fcb__file-path" :title="entry.filePath">{{ entry.fileName }}</span>
          <span class="fcb__file-dir">{{ dirPath(entry.filePath) }}</span>
          <span class="fcb__file-stats">
            <span class="fcb__added" v-if="entry.totalAdded">+{{ entry.totalAdded }}</span>
            <span class="fcb__removed" v-if="entry.totalRemoved">−{{ entry.totalRemoved }}</span>
          </span>
          <button
            class="fcb__diff-btn"
            :title="t('chat.fileChanges.viewDiff')"
            @click.stop="$emit('openDiff', entry)"
          >
            <DiffIcon class="fcb__diff-icon" />
            <span>Diff</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import { useI18n } from "vue-i18n";
import {
  ChevronDown12Regular,
  ChevronRight12Regular,
} from "@vicons/fluent";
import { previewFile } from "@/utils/workspacePreview";
import type { FileChangeEntry } from "@/composables/useFileChanges";

const { t } = useI18n();

// Inline diff icon (simple SVG, no extra dep)
const DiffIcon = () =>
  h("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, [
    h("path", {
      d: "M4 2v12M4 2L2 4M4 2l2 2M12 14V2M12 14l2-2M12 14l-2-2",
      stroke: "currentColor",
      "stroke-width": "1.3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);

const props = defineProps<{
  changes: FileChangeEntry[];
  /**
   * 列表是否默认展开。
   * 消息气泡里由用户点击摘要行展开；会话工作状态面板外层已有折叠头，
   * 传 true 让文件列表直接可见，省掉一层重复的折叠。
   */
  defaultExpanded?: boolean;
}>();

defineEmits<{
  openDiff: [entry: FileChangeEntry];
}>();

const expanded = ref(props.defaultExpanded ?? false);

const totalAdded = computed(() =>
  props.changes.reduce((sum, e) => sum + e.totalAdded, 0),
);
const totalRemoved = computed(() =>
  props.changes.reduce((sum, e) => sum + e.totalRemoved, 0),
);

function dirPath(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function openFile(filePath: string) {
  previewFile(filePath);
}
</script>

<style scoped>
.file-changes-bar {
  margin-top: 8px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  overflow: hidden;
  background: var(--el-bg-color);
  font-size: 12px;
}

.fcb__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.fcb__header:hover {
  background: var(--color-surface-hover);
}

.fcb__icon {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fcb__doc-icon {
  width: 15px;
  height: 15px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.fcb__summary {
  font-size: 13px;
  color: var(--el-text-color-regular);
  flex: 1;
}

.fcb__stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

.fcb__added {
  color: var(--el-color-success);
}

.fcb__removed {
  color: var(--el-color-danger);
}

.fcb__list {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 4px 0;
}

.fcb__file-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.fcb__file-row:hover {
  background: var(--el-fill-color);
}

.fcb__file-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.fcb__file-path {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  white-space: nowrap;
}

.fcb__file-dir {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.fcb__file-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  flex-shrink: 0;
}

.fcb__diff-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border: 1px solid var(--el-border-color);
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  transition: all 0.15s;
  flex-shrink: 0;
}

.fcb__diff-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.fcb__diff-icon {
  width: 12px;
  height: 12px;
}

.fcb__ops {
  color: var(--el-text-color-placeholder);
}

/* 展开动画 */
.fcb-expand-enter-active,
.fcb-expand-leave-active {
  transition: all 0.2s ease;
  max-height: 500px;
  opacity: 1;
}

.fcb-expand-enter-from,
.fcb-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 动效降级：系统开启「减少动态效果」时，悬停底色与展开高度直接到位。
   逐个列出，不写 `*` / `.file-changes-bar *` 通配，
   避免把 el-button / el-icon 内部 Element Plus 组件的合法过渡一起掐掉。
   展开动画的终态（max-height: 500px / opacity: 1）是静态声明，
   停掉过渡后展开与折叠照样成立。 */
@media (prefers-reduced-motion: reduce) {
  .fcb__header,
  .fcb__file-row,
  .fcb__diff-btn,
  .fcb-expand-enter-active,
  .fcb-expand-leave-active {
    transition: none;
  }
}

/* 键盘焦点可见性：摘要行与文件行都是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环。指针样式两者原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 外层 .file-changes-bar 底色是 --el-bg-color，
   深浅两套主题下都只是一档主色描边，12% 足够可见。 */
.fcb__header,
.fcb__file-row {
  outline: none;
}

.fcb__header:focus-visible,
.fcb__file-row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
