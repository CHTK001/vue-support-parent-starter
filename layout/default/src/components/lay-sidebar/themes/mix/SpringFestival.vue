<script setup lang="ts">
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="spring-festival-mix-wrapper">
    <BaseMix theme-class="spring-festival-mix" />
  </div>
</template>

<style lang="scss" scoped>
// 春节主题颜色变量
$spring-red: #DC143C;
$spring-red-dark: #B22222;
$spring-gold: #FFD700;

.spring-festival-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.spring-festival-mix) {
    background: linear-gradient(180deg, $spring-red, $spring-red-dark) !important;
    border-bottom: 2px solid rgba($spring-gold, 0.3) !important;
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: rgba(255, 255, 255, 0.9) !important;
        
        &:hover {
          background: rgba($spring-gold, 0.15) !important;
          color: $spring-gold !important;
        }
        
        &.is-active {
          background: rgba($spring-gold, 0.2) !important;
          color: $spring-gold !important;
          border-bottom: 2px solid $spring-gold;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
