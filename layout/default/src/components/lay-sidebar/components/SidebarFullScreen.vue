<script setup lang="ts">
import { computed } from "vue";
import { useFullscreen } from "@vueuse/core";
import ExitFullscreenIcon from "@iconify-icons/ri/fullscreen-exit-fill";
import FullscreenIcon from "@iconify-icons/ri/fullscreen-fill";

const { isFullscreen, toggle } = useFullscreen();

const screenIcon = computed(() => 
  isFullscreen.value ? ExitFullscreenIcon : FullscreenIcon
);
</script>

<template>
  <span class="fullscreen-icon" @click="toggle">
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
  pointer-events: auto; /* Ensure clicks are captured */
  
  :deep(svg) {
    pointer-events: none; /* Pass clicks to parent span */
  }
}
</style>
