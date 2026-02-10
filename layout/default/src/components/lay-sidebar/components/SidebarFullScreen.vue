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

const toggle = async () => {
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
  } catch (err: any) {
    console.error("Fullscreen error:", err);
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
  <div class="fullscreen-icon" @click.stop="toggle">
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
  pointer-events: auto; /* Ensure clicks are captured */
  
  :deep(svg) {
    pointer-events: none; /* Pass clicks to parent span */
  }
}
</style>
