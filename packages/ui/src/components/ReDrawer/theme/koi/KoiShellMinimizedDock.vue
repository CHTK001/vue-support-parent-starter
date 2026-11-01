<template>
  <Teleport to="body">
    <!-- v-if 而非 v-show：未最小化时不留空按钮占位。
         每个 ReDialog/ReDrawer 实例都会 Teleport 一个，v-show 会留下一堆
         display:none 的 <button class="koi-shell-minimized-dock"> 常驻 body。 -->
    <button
      v-if="visible"
      type="button"
      class="koi-shell-minimized-dock"
      :title="title || tooltip"
      :aria-label="tooltip"
      :style="dockStyle"
      @click="$emit('restore')"
    >
      <el-icon class="koi-shell-minimized-dock__icon"><Files /></el-icon>
      <span class="koi-shell-minimized-dock__title">{{ title }}</span>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Files } from "@element-plus/icons-vue";
import {
  KOI_MINIMIZED_DOCK_EDGE,
  KOI_MINIMIZED_DOCK_STEP,
} from "./useKoiWindowShell";

const props = defineProps<{
  visible: boolean;
  title: string;
  tooltip: string;
  stackIndex: number;
}>();

defineEmits<{
  restore: [];
}>();

const dockStyle = computed(() => {
  const i = Math.max(0, props.stackIndex);
  return {
    bottom: `${KOI_MINIMIZED_DOCK_EDGE + i * KOI_MINIMIZED_DOCK_STEP}px`,
    zIndex: 3000 + i,
  };
});
</script>

<style lang="scss" scoped>
.koi-shell-minimized-dock {
  position: fixed;
  left: 16px;
  right: auto;
  box-sizing: border-box;
  width: max-content;
  max-width: min(220px, calc(100vw - 32px));
  min-width: 0;
  min-height: 32px;
  margin: 0;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow);
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color));
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
}

.koi-shell-minimized-dock__icon {
  flex-shrink: 0;
  font-size: 15px;
  color: var(--el-text-color-regular);

  :deep(svg) {
    width: 1em;
    height: 1em;
  }
}

.koi-shell-minimized-dock__title {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.35;
}
</style>
