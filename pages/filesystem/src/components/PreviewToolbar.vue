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
import { onBeforeUnmount, ref } from "vue";
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
}
defineExpose({ toggleHelp });

/** 快捷键列表 */
const shortcuts = [
  { keys: "+" , desc: "放大" },
  { keys: "-" , desc: "缩小" },
  { keys: "0 / R", desc: "重置缩放" },
  { keys: "F" , desc: "全屏切换" },
  { keys: "Esc", desc: "退出全屏 / 关闭弹窗" },
  { keys: "?" , desc: "显示/隐藏快捷键帮助" },
];

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
      <el-button :icon="ZoomOut" size="small" @click="zoomOut" :disabled="zoom <= 25" title="缩小 (-)" />
      <el-button size="small" class="!px-3" disabled>{{ zoom }}%</el-button>
      <el-button :icon="ZoomIn" size="small" @click="zoomIn" :disabled="zoom >= 300" title="放大 (+)" />
      <el-button :icon="RefreshRight" size="small" @click="zoomReset" title="重置 (0/R)" />
    </el-button-group>
    <el-button :icon="FullScreen" size="small" @click="emit('fullscreen')" title="全屏 (F)" />
    <el-popover
      placement="bottom"
      :width="280"
      :visible="shortcutPopoverVisible"
    >
      <template #reference>
        <el-button
          :icon="QuestionFilled"
          size="small"
          circle
          title="快捷键帮助 (?)"
          @click="shortcutPopoverVisible = !shortcutPopoverVisible"
        />
      </template>
      <div class="shortcut-help">
        <div class="shortcut-help__title">快捷键一览</div>
        <div v-for="s in shortcuts" :key="s.keys" class="shortcut-help__row">
          <kbd class="shortcut-help__keys">{{ s.keys }}</kbd>
          <span class="shortcut-help__desc">{{ s.desc }}</span>
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
  padding: 2px 0;
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
  box-shadow: 0 1px 0 var(--el-border-color);
}

.shortcut-help__desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
