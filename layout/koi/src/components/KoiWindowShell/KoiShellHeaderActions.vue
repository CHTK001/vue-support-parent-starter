<template>
  <div class="koi-shell-header-actions" @mouseenter="resetTooltips">
    <el-tooltip
      v-bind="tooltipBind"
      :content="$t('button.minimize')"
      placement="bottom"
    >
      <button
        type="button"
        class="koi-toolbar-btn koi-toolbar-btn--minimize"
        @mousedown="suppressTooltips"
        @click="$emit('minimize')"
      >
        <el-icon size="18"><Minus /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip
      v-bind="tooltipBind"
      :content="isFullscreen ? $t('header.exitFullScreen') : $t('header.fullScreen')"
      placement="bottom"
    >
      <button
        type="button"
        class="koi-toolbar-btn koi-toolbar-btn--fullscreen"
        @mousedown="suppressTooltips"
        @click="$emit('toggleFullscreen')"
      >
        <el-icon size="18" v-if="!isFullscreen"><FullScreen /></el-icon>
        <KoiGlobalIcon name="koi-fullscreen-exit" size="18" v-else />
      </button>
    </el-tooltip>
    <el-tooltip v-bind="tooltipBind" :content="$t('button.close')" placement="bottom">
      <button
        type="button"
        class="koi-toolbar-btn koi-toolbar-btn--close"
        @mousedown="suppressTooltips"
        @click="$emit('close')"
      >
        <el-icon size="18"><Close /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Minus, FullScreen, Close } from "@element-plus/icons-vue";

const props = withDefaults(
  defineProps<{
    isFullscreen: boolean;
    /** 父级抽屉/弹窗是否处于打开态，关闭时禁用 tooltip 避免闪到左上角 */
    enabled?: boolean;
  }>(),
  { enabled: true }
);

defineEmits<{
  minimize: [];
  toggleFullscreen: [];
  close: [];
}>();

const tooltipsSuppressed = ref(false);

/** 不 teleport 到 body，随抽屉/弹窗一起销毁，避免关闭时定位丢失 */
const tooltipBind = computed(() => ({
  teleported: false,
  persistent: false,
  hideAfter: 0,
  disabled: !props.enabled || tooltipsSuppressed.value
}));

const suppressTooltips = () => {
  tooltipsSuppressed.value = true;
};

const resetTooltips = () => {
  tooltipsSuppressed.value = false;
};

watch(
  () => props.enabled,
  (open) => {
    if (open) {
      resetTooltips();
    } else {
      suppressTooltips();
    }
  }
);
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

  &.koi-toolbar-btn--minimize:hover {
    color: var(--el-color-warning);
    border-color: color-mix(in srgb, var(--el-color-warning) 42%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-color-warning-light-9) 82%, var(--el-fill-color-light));
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
