<script setup lang="ts">
import BaseMix from './BaseMix.vue';
</script>

<template>
  <div class="cyberpunk-mix-wrapper">
    <BaseMix theme-class="cyberpunk-mix" />
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-border: rgba(0, 255, 255, 0.25);

.cyberpunk-mix-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  
  :deep(.cyberpunk-mix) {
    background: linear-gradient(
      180deg,
      rgba(10, 10, 18, 0.98) 0%,
      rgba(18, 18, 31, 0.98) 100%
    ) !important;
    border-bottom: 1px solid $cyber-border !important;
    box-shadow: 
      0 2px 20px rgba(0, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 255, 255, 0.2) !important;
    position: relative;
    
    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $cyber-cyan 20%,
        $cyber-magenta 50%,
        $cyber-cyan 80%,
        transparent 100%
      );
      z-index: 10;
    }
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: $cyber-cyan !important;
        border-radius: 4px;
        margin: 0 4px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, $cyber-cyan, $cyber-magenta);
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #fff !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.2),
            inset 0 0 15px rgba(0, 255, 255, 0.05);
          
          &::after {
            width: 80%;
          }
        }
        
        &.is-active {
          background: rgba(0, 255, 255, 0.15) !important;
          color: #fff !important;
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.3),
            inset 0 0 20px rgba(0, 255, 255, 0.08);
          
          &::after {
            width: 100%;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          }
        }
        
        .el-icon, svg {
          color: $cyber-cyan !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        }
      }
    }
    
    .horizontal-header-right {
      color: $cyber-cyan;
      
      .el-icon, svg {
        color: $cyber-cyan !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: #fff !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
        }
      }
    }
  }
}
</style>
