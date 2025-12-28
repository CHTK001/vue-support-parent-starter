<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="new-year-setting-wrapper">
    <BaseSetting theme-class="new-year-setting" />
  </div>
</template>

<style lang="scss" scoped>
$ny-gold: #ffd700;
$ny-gold-light: #ffe066;
$ny-champagne: #f7e7ce;
$ny-dark: #1a1a2e;
$ny-dark-light: #16213e;
$ny-dark-darker: #141422;  // darken($ny-dark, 3%)
$ny-dark-darkest: #0f0f19; // darken($ny-dark, 6%)
$ny-white: #ffffff;

.new-year-setting-wrapper {
  :deep(.new-year-setting) {
    background: linear-gradient(180deg, $ny-dark, $ny-dark-light) !important;
    border-left: 3px solid rgba($ny-gold, 0.4) !important;
    
    .el-drawer__header {
      background: linear-gradient(180deg, $ny-dark-darker, $ny-dark-darkest) !important;
      border-bottom: 2px solid rgba($ny-gold, 0.3) !important;
      color: $ny-white !important;
    }
    
    .el-drawer__title {
      color: $ny-gold !important;
    }
    
    .el-drawer__body {
      background: transparent !important;
      color: $ny-champagne !important;
    }
  }
}
</style>
