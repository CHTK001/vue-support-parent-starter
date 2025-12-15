<script setup lang="ts">
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="mid-autumn-mix-wrapper">
    <BaseMix theme-class="mid-autumn-mix" />
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;

.mid-autumn-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.mid-autumn-mix) {
    background: linear-gradient(180deg, $mid-blue, $mid-blue-light) !important;
    border-bottom: 2px solid rgba($mid-gold, 0.3) !important;
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: rgba(255, 255, 255, 0.9) !important;
        
        &:hover {
          background: rgba($mid-gold, 0.15) !important;
          color: $mid-gold !important;
        }
        
        &.is-active {
          background: rgba($mid-gold, 0.2) !important;
          color: $mid-gold !important;
          border-bottom: 2px solid $mid-gold;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
