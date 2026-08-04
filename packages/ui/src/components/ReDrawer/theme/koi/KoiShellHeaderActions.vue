<template>
  <div class="koi-shell-header-actions">
    <template v-if="!closeOnly">
      <el-tooltip content="最小化" placement="bottom">
        <button type="button" class="koi-toolbar-btn" @click="$emit('minimize')">
          <el-icon size="18"><Minus /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
        <button type="button" class="koi-toolbar-btn" @click="$emit('toggleFullscreen')">
          <el-icon size="18" v-if="!isFullscreen"><FullScreen /></el-icon>
          <el-icon size="18" v-else><Aim /></el-icon>
        </button>
      </el-tooltip>
    </template>
    <el-tooltip content="关闭" placement="bottom">
      <button type="button" class="koi-toolbar-btn koi-toolbar-btn--close" @click="$emit('close')">
        <el-icon size="18"><Close /></el-icon>
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
    /** 仅保留关闭按钮（隐藏最小化/全屏），设置类抽屉使用 */
    closeOnly?: boolean;
  }>(),
  { enabled: true, closeOnly: false },
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
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

.koi-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  transition: all 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, var(--el-fill-color-light));
  }

  &.koi-toolbar-btn--close:hover {
    color: var(--el-color-danger);
    border-color: color-mix(in srgb, var(--el-color-danger) 42%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-color-danger-light-9) 82%, var(--el-fill-color-light));
  }

  &:active {
    transform: scale(0.96);
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}
</style>
