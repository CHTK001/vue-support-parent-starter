<script setup lang="ts">
import { computed } from "vue";
import { useFullscreen } from "@vueuse/core";
import ExitFullscreenIcon from "@iconify-icons/ri/fullscreen-exit-fill";
import FullscreenIcon from "@iconify-icons/ri/fullscreen-fill";
import { message } from "@repo/utils";

// 使用 @vueuse/core 提供的全屏控制，自动处理多浏览器兼容
const { isFullscreen, toggle: vueUseToggle } = useFullscreen();

const toggle = async (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    await vueUseToggle();
  } catch (err: any) {
    console.error("全屏切换错误:", err);
    message(
      `全屏切换失败: ${err?.message || "浏览器不支持或被拦截，可尝试按键盘 F11 进入全屏"}`,
      { type: "error" }
    );
  }
};

const screenIcon = computed(() =>
  isFullscreen.value ? ExitFullscreenIcon : FullscreenIcon
);
</script>

<template>
  <div class="fullscreen-icon" @click="toggle">
    <IconifyIconOffline :icon="screenIcon" />
  </div>
</template>

<style lang="scss" scoped>
.fullscreen-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  z-index: 100;
  user-select: none;
  -webkit-user-select: none;
  
  :deep(svg) {
    pointer-events: none;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}
</style>
