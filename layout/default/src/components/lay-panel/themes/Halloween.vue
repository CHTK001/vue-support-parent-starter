<script setup lang="ts">
import BasePanel from './BasePanel.vue';
</script>

<template>
  <BasePanel>
    <slot />
  </BasePanel>
</template>

<style lang="scss">
html[data-skin="halloween"] {
  .right-panel {
    background: linear-gradient(180deg, #2c003e 0%, #1a0026 100%) !important;
    border-left: 2px solid #ff7518 !important;
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.8) !important;
  }
}
</style>
