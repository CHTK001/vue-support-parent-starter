<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="eight-bit-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="8bit"],
html.theme-8bit {
  .eight-bit-setting-wrapper {
    .right-panel {
      image-rendering: pixelated;
    }
  }
}
</style>
