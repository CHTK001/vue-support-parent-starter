<script setup lang="ts">
/**
 * ReFilePicker 工具条 —— 对齐 Windows 资源管理器文件对话框顶栏：
 * 左侧后退 / 刷新按钮，中间地址栏（面包屑），右侧搜索框。
 */
import { ArrowLeft, FolderOpened, Refresh, Search } from "@element-plus/icons-vue";
import type { FilePickerCrumb } from "../utils";

defineProps<{
  breadcrumb: FilePickerCrumb[];
  loading: boolean;
  canBack: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "refresh"): void;
  (e: "navigate", path: string): void;
}>();

/** 搜索词由宿主双向绑定 */
const search = defineModel<string>({ default: "" });
</script>

<template>
  <div class="rfp__toolbar re-file-picker__toolbar">
    <div class="rfp__nav-btns">
      <button
        type="button"
        class="rfp-icon-btn"
        title="后退"
        aria-label="后退"
        :disabled="!canBack"
        @click="emit('back')"
      >
        <el-icon :size="16"><ArrowLeft /></el-icon>
      </button>
      <button
        type="button"
        class="rfp-icon-btn"
        title="刷新"
        aria-label="刷新"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <el-icon :size="16" :class="{ 'is-spin': loading }"><Refresh /></el-icon>
      </button>
    </div>

    <nav class="rfp__address re-file-picker__bread rfp__crumbs" aria-label="地址栏">
      <el-icon class="rfp__address-icon" aria-hidden="true"><FolderOpened /></el-icon>
      <span
        v-for="(seg, i) in breadcrumb"
        :key="seg.path || 'root'"
        class="re-file-picker__bread-item rfp__crumb"
        :class="{ 'is-active': i === breadcrumb.length - 1 }"
        role="button"
        tabindex="0"
        :title="seg.path"
        @click="emit('navigate', seg.path)"
        @keydown.enter="emit('navigate', seg.path)"
      >
        {{ seg.name }}
        <span v-if="i < breadcrumb.length - 1" class="rfp__crumb-sep" aria-hidden="true">›</span>
      </span>
    </nav>

    <div class="rfp__search">
      <el-input
        v-model="search"
        size="small"
        placeholder="搜索"
        clearable
        aria-label="搜索文件或目录"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
  </div>
</template>

<style scoped>
/* 工具条 = 资源管理器的地址栏行：窗口底色 + 白色地址栏 + 右侧搜索 */
.rfp__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rfp-border);
  background: var(--rfp-chrome);
}

.rfp__nav-btns {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 图标按钮：扁平、圆角、悬停方底 —— 同资源管理器导航按钮 */
.rfp-icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--rfp-radius);
  background: transparent;
  color: var(--rfp-text);
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.15s), color var(--el-transition-duration, 0.15s);
}

.rfp-icon-btn:hover:not(:disabled) {
  background: var(--rfp-hover);
  color: var(--rfp-accent);
}

.rfp-icon-btn:active:not(:disabled) {
  background: var(--rfp-select-bg);
}

.rfp-icon-btn:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
}

.rfp-icon-btn .is-spin {
  animation: rfp-spin 0.8s linear infinite;
}

/* 地址栏：白色圆角条，内部横向滚动（长路径不裁切） */
.rfp__address {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--rfp-border);
  border-radius: var(--rfp-radius);
  background: var(--rfp-surface);
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  font-size: 13px;
  color: var(--rfp-text);
  scrollbar-width: none;
}

.rfp__address::-webkit-scrollbar {
  height: 0;
}

.rfp__address:focus-within {
  border-color: var(--rfp-accent);
  box-shadow: 0 0 0 2px var(--rfp-select-bg);
}

.rfp__address-icon {
  flex-shrink: 0;
  margin-right: 6px;
  color: var(--rfp-folder);
}

/* 面包屑段：悬停浅蓝底，当前段加粗 */
.rfp__crumb {
  flex-shrink: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 3px 6px;
  border-radius: 3px;
  color: var(--rfp-text-weak);
  font-weight: 400;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.15s), color var(--el-transition-duration, 0.15s);
}

.rfp__crumb:hover:not(.is-active) {
  background: var(--rfp-hover);
  color: var(--rfp-text);
}

.rfp__crumb.is-active {
  color: var(--rfp-text);
  font-weight: 600;
  cursor: default;
}

.rfp__crumb-sep {
  margin-left: 4px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.rfp__search {
  flex-shrink: 0;
  width: 200px;
}

.rfp__search :deep(.el-input__wrapper) {
  border-radius: var(--rfp-radius);
}

@keyframes rfp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rfp-icon-btn,
  .rfp__crumb {
    transition: none;
  }
}
</style>
