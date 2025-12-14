<script setup lang="ts">
import { ref, watch } from "vue";
import { useNav } from "../../../hooks/useNav";
import { ElMessage } from "element-plus";

const screenIcon = ref();
const { toggle, isFullscreen, Fullscreen, ExitFullscreen } = useNav();

isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

watch(
  isFullscreen,
  (full) => {
    screenIcon.value = full ? ExitFullscreen : Fullscreen;
  },
  {
    immediate: true,
  }
);

// 处理全屏切换
const handleToggle = async () => {
  try {
    await toggle();
  } catch (error) {
    console.error('Full screen error:', error);
    ElMessage.warning('浏览器不支持全屏或全屏请求被拒绝');
  }
};
</script>

<template>
  <span class="fullscreen-icon navbar-bg-hover" @click="handleToggle">
    <IconifyIconOffline :icon="screenIcon" />
  </span>
</template>
