<script setup lang="ts">
import { ref, watch } from "vue";
import { useNav } from "../../../hooks/useNav";

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
</script>

<template>
  <div class="fullscreen-icon navbar-bg-hover text-[16px] cursor-pointer" @click="toggle">
    <IconifyIconOffline :icon="screenIcon" />
  </div>
</template>
