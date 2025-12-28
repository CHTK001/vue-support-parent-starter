<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="christmas-setting-wrapper">
    <BaseSetting theme-class="christmas-setting" />
  </div>
</template>

<style lang="scss" scoped>
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-green-dark: #164d1a;   // darken($xmas-green, 5%)
$xmas-green-darker: #123f15; // darken($xmas-green, 8%)
$xmas-red: #c62828;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

.christmas-setting-wrapper {
  :deep(.christmas-setting) {
    background: linear-gradient(180deg, $xmas-green, $xmas-green-dark) !important;
    border-left: 3px solid rgba($xmas-gold, 0.4) !important;
    
    .el-drawer__header {
      background: linear-gradient(180deg, $xmas-green-dark, $xmas-green-darker) !important;
      border-bottom: 2px solid rgba($xmas-gold, 0.3) !important;
      color: $xmas-white !important;
    }
    
    .el-drawer__title {
      color: $xmas-gold !important;
    }
    
    .el-drawer__body {
      background: transparent !important;
      color: $xmas-white !important;
    }
  }
}
</style>
