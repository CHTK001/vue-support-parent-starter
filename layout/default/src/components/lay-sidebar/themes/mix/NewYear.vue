<script setup lang="ts">
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="new-year-mix-wrapper">
    <BaseMix theme-class="new-year-mix" />
  </div>
</template>

<style lang="scss" scoped>
// 元旦主题颜色变量
$ice-lightest: #F5FBFF;
$ice-lighter: #E8F4FC;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;

.new-year-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.new-year-mix) {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98) 0%, rgba($frost-purple, 0.95) 100%) !important;
    border-bottom: 1px solid rgba($ice-medium, 0.25) !important;
    box-shadow: 0 2px 15px rgba($ice-deep, 0.1) !important;
    position: relative;
    backdrop-filter: blur(12px);
    
    // 顶部冰晶装饰线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $ice-medium 20%,
        $ice-primary 50%,
        $ice-medium 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-left {
      span {
        color: $ice-deep !important;
        text-shadow: 0 1px 2px rgba($ice-medium, 0.3);
        font-weight: 600;
      }
      
      img {
        filter: drop-shadow(0 2px 6px rgba($ice-primary, 0.25));
      }
    }
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $ice-darker !important;
        background: transparent !important;
        border-radius: 8px;
        margin: 0 4px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        font-weight: 500;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, $ice-primary, $ice-medium);
          transform: translateX(-50%);
          transition: width 0.3s ease;
          border-radius: 1px;
        }
        
        &:hover {
          background: rgba($ice-medium, 0.15) !important;
          color: $ice-deep !important;
          
          &::after {
            width: 80%;
          }
        }
        
        &.is-active {
          background: linear-gradient(135deg, rgba($ice-primary, 0.15), rgba($ice-medium, 0.1)) !important;
          color: $ice-deep !important;
          font-weight: 600;
          
          &::after {
            width: 100%;
            box-shadow: 0 0 8px rgba($ice-primary, 0.4);
          }
        }
        
        .el-icon, svg {
          color: $ice-primary !important;
        }
        
        &:hover .el-icon, &:hover svg {
          color: $ice-deep !important;
        }
      }
      
      .el-sub-menu.is-active > .el-sub-menu__title {
        color: $ice-deep !important;
        background: rgba($ice-medium, 0.12) !important;
      }
    }
    
    .horizontal-header-right {
      color: $ice-darker;
      
      .el-icon, svg {
        color: $ice-primary !important;
        
        &:hover {
          color: $ice-deep !important;
        }
      }
    }
  }
}
</style>
