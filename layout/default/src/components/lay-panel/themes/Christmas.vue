<script setup lang="ts">
import BasePanel from './BasePanel.vue';
</script>

<template>
  <div class="christmas-panel-wrapper">
    <BasePanel theme-class="christmas-panel" />
  </div>
</template>

<style lang="scss" scoped>
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

.christmas-panel-wrapper {
  :deep(.christmas-panel) {
    background: linear-gradient(180deg, $xmas-green, darken($xmas-green, 5%)) !important;
    border: 2px solid rgba($xmas-gold, 0.3) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    
    .panel-header {
      background: linear-gradient(180deg, darken($xmas-green, 5%), darken($xmas-green, 8%)) !important;
      border-bottom: 2px solid rgba($xmas-gold, 0.3) !important;
      color: $xmas-gold !important;
    }
    
    .panel-content {
      background: transparent !important;
      color: $xmas-white !important;
    }
  }
}
</style>
