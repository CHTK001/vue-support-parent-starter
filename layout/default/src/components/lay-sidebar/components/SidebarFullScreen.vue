<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import ExitFullscreenIcon from "@iconify-icons/ri/fullscreen-exit-fill";
import FullscreenIcon from "@iconify-icons/ri/fullscreen-fill";

const isFullscreen = ref(false);
const screenIcon = ref(FullscreenIcon);

// 检查当前是否全屏
const checkFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

// 更新状态
const updateState = () => {
  isFullscreen.value = checkFullscreen();
  screenIcon.value = isFullscreen.value ? ExitFullscreenIcon : FullscreenIcon;
};

// 进入全屏
const enterFullscreen = async () => {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    await el.requestFullscreen();
  } else if ((el as any).webkitRequestFullscreen) {
    await (el as any).webkitRequestFullscreen();
  } else if ((el as any).mozRequestFullScreen) {
    await (el as any).mozRequestFullScreen();
  } else if ((el as any).msRequestFullscreen) {
    await (el as any).msRequestFullscreen();
  }
};

// 退出全屏
const exitFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (e) {
    throw e;
  }
};

// 处理全屏切换
const handleToggle = async () => {
  try {
    if (checkFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
    ElMessage.warning('浏览器不支持全屏或全屏请求被拒绝');
  }
};

// 监听全屏变化事件
const handleFullscreenChange = () => {
  updateState();
};

onMounted(() => {
  updateState();
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});
</script>

<template>
  <span class="fullscreen-icon navbar-bg-hover" @click.stop="handleToggle">
    <IconifyIconOffline :icon="screenIcon" />
  </span>
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
  
  :deep(svg) {
    pointer-events: none;
  }
}
</style>
