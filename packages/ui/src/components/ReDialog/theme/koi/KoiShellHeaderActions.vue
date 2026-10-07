<template>
  <div class="koi-shell-header-actions">
    <el-tooltip v-if="showMinimize" content="最小化" placement="bottom">
      <button type="button" class="koi-toolbar-btn" aria-label="最小化" @click="$emit('minimize')">
        <el-icon size="14"><Minus /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip v-if="showFullscreen" :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
      <button
        type="button"
        class="koi-toolbar-btn"
        :aria-label="isFullscreen ? '退出全屏' : '全屏'"
        @click="$emit('toggleFullscreen')"
      >
        <el-icon size="14" v-if="!isFullscreen"><FullScreen /></el-icon>
        <el-icon size="14" v-else><Aim /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip content="关闭" placement="bottom">
      <button type="button" class="koi-toolbar-btn koi-toolbar-btn--close" aria-label="关闭" @click="$emit('close')">
        <el-icon size="14"><Close /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { Minus, FullScreen, Close, Aim } from "@element-plus/icons-vue";

withDefaults(
  defineProps<{
    isFullscreen: boolean;
    /** 父级弹窗是否处于打开态 */
    enabled?: boolean;
    /** 是否显示最小化按钮（默认隐藏，靠 showMinimize 开关开启） */
    showMinimize?: boolean;
    /** 是否显示全屏按钮（默认隐藏，靠 showFullscreen 开关开启） */
    showFullscreen?: boolean;
  }>(),
  {
    enabled: true,
    showMinimize: false,
    showFullscreen: false,
  },
);

defineEmits<{
  minimize: [];
  toggleFullscreen: [];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.koi-shell-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

.koi-toolbar-btn {
  border: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  transition: all 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, var(--el-fill-color-light));
  }

  &.koi-toolbar-btn--close:hover {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger-light-9) 82%, var(--el-fill-color-light));
  }

  &:active {
    transform: scale(0.96);
  }

  :deep(.el-icon) {
    font-size: 13px;
  }
}
</style>
