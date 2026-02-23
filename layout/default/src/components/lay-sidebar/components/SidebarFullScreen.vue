<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import ExitFullscreenIcon from "@iconify-icons/ri/fullscreen-exit-fill";
import FullscreenIcon from "@iconify-icons/ri/fullscreen-fill";
import { message } from "@repo/utils";

const isFullscreen = ref(false);

const updateState = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

const toggle = async (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const element = document.documentElement;
  try {
    if (isFullscreen.value) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } else {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    }
    // 手动更新状态，确保立即反映变化
    setTimeout(() => {
      updateState();
    }, 100);
  } catch (err: any) {
    console.error("全屏切换错误:", err);
    message(`全屏切换失败: ${err.message || "不支持全屏或被浏览器拦截"}`, { type: "error" });
  }
};

onMounted(() => {
  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange"
  ];
  events.forEach(event => document.addEventListener(event, updateState));
  updateState();
});

onUnmounted(() => {
  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange"
  ];
  events.forEach(event => document.removeEventListener(event, updateState));
});

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
