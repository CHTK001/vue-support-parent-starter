<script setup lang="ts">
/**
 * ReFilePicker 导航窗格 —— 对齐资源管理器左侧「导航窗格」：
 * 窗口底色、分区标题、文件夹图标、按层级缩进、选中浅蓝高亮。
 */
import { Folder } from "@element-plus/icons-vue";
import type { FilePickerItem, FilePickerTreeNode } from "../types";
import { samePath } from "../utils";

const props = defineProps<{
  nodes: FilePickerTreeNode[];
  dirs: FilePickerItem[];
  currentPath: string;
}>();

const emit = defineEmits<{ (e: "navigate", path: string): void }>();

const isCurrent = (path: string): boolean => samePath(path, props.currentPath);
</script>

<template>
  <aside class="rfp-nav">
    <div class="rfp-nav__title">位置</div>
    <button
      v-for="node in nodes"
      :key="node.key"
      type="button"
      class="rfp-nav__item"
      :class="{ 'is-active': isCurrent(node.key) }"
      :style="{ '--rfp-tree-depth': node.depth }"
      :title="node.key"
      @click="emit('navigate', node.key)"
    >
      <el-icon :size="15" class="rfp-nav__icon"><Folder /></el-icon>
      <span class="rfp-nav__label">{{ node.name }}</span>
    </button>

    <template v-if="dirs.length">
      <div class="rfp-nav__title rfp-nav__title--sub">当前目录</div>
      <button
        v-for="dir in dirs"
        :key="dir.key"
        type="button"
        class="rfp-nav__item rfp-nav__item--child"
        :class="{ 'is-active': isCurrent(dir.key) }"
        :title="dir.key"
        @click="emit('navigate', dir.key)"
      >
        <span class="rfp-nav__blank" aria-hidden="true" />
        <el-icon :size="15" class="rfp-nav__icon"><Folder /></el-icon>
        <span class="rfp-nav__label">{{ dir.name }}</span>
      </button>
    </template>
  </aside>
</template>

<style scoped>
/* 导航窗格：窗口底色，与右侧内容区用一条竖线分隔 */
.rfp-nav {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 6px;
  border-right: 1px solid var(--rfp-border);
  background: var(--rfp-chrome);
  overflow-y: auto;
}

.rfp-nav__title {
  padding: 8px 8px 4px;
  color: var(--rfp-text-weak);
  font-size: 12px;
  font-weight: 600;
}

.rfp-nav__title--sub {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--rfp-border);
}

/* 条目：资源管理器的紧凑行高 + 层级缩进 */
.rfp-nav__item {
  --rfp-tree-depth: 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  max-width: 100%;
  min-height: 30px;
  padding: 0 8px;
  padding-left: calc(8px + var(--rfp-tree-depth) * 14px);
  border: 1px solid transparent;
  border-radius: var(--rfp-radius);
  background: transparent;
  color: var(--rfp-text);
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.15s), border-color var(--el-transition-duration, 0.15s);
}

.rfp-nav__item:hover:not(.is-active) {
  background: var(--rfp-hover);
}

/* 选中：浅蓝底 + 左侧主色竖条（资源管理器选中态） */
.rfp-nav__item.is-active {
  background: var(--rfp-select-bg);
  border-color: var(--rfp-select-border);
  font-weight: 600;
}

.rfp-nav__item.is-active::before {
  content: "";
  position: absolute;
  left: calc(2px + var(--rfp-tree-depth) * 14px);
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--rfp-accent);
}

.rfp-nav__icon {
  flex-shrink: 0;
  color: var(--rfp-folder);
}

.rfp-nav__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-nav__blank {
  flex-shrink: 0;
  width: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .rfp-nav__item {
    transition: none;
  }
}
</style>
