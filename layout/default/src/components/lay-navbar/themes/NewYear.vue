<script setup lang="ts">
/**
 * 元旦主题导航栏 - 冰雪蓝白清新现代风
 * 设计理念：清透玻璃感、轻盈纯净
 */
import BaseNavbar from './BaseNavbar.vue';
</script>

<template>
  <div class="new-year-navbar-wrapper">
    <BaseNavbar theme-class="new-year-navbar" />
  </div>
</template>

<style lang="scss" scoped>
// 冰雪主题颜色变量
$ice-lightest: #F5FBFF;
$ice-lighter: #E8F4FC;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;

.new-year-navbar-wrapper {
  width: 100%;
  
  :deep(.new-year-navbar) {
    background: linear-gradient(135deg, rgba($ice-lightest, 0.95) 0%, rgba($ice-lighter, 0.92) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba($ice-medium, 0.25);
    box-shadow: 0 2px 16px rgba($ice-deep, 0.08);
    
    // 工具栏按钮样式
    .navbar-btn {
      color: $ice-deep;
      transition: all 0.3s ease;
      
      &:hover {
        color: $ice-primary;
        background: rgba($ice-medium, 0.15);
      }
    }
    
    // 面包屑样式
    .breadcrumb-link {
      color: $ice-darker;
      transition: all 0.3s ease;
      
      &:hover {
        color: $ice-primary;
      }
    }
    
    .breadcrumb-current {
      color: $ice-deep;
      font-weight: 600;
    }
    
    // 工具栏按钮组
    .vertical-header-right {
      .tool-item {
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba($ice-medium, 0.2);
        color: $ice-deep;
        border-radius: 8px;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: $ice-primary;
          color: $ice-primary;
          box-shadow: 0 4px 12px rgba($ice-primary, 0.15);
        }
        
        svg {
          color: $ice-primary;
        }
      }
      
      #header-search, #full-screen {
        color: $ice-deep;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba($ice-medium, 0.2);
        
        &:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: $ice-primary;
          
          svg {
            color: $ice-primary;
          }
        }
        
        svg {
          color: $ice-primary;
        }
      }
    }
    
    // 面包屑容器
    .breadcrumb-container {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba($ice-medium, 0.15);
      border-radius: 8px;
      backdrop-filter: blur(8px);
      
      :deep(.el-breadcrumb__inner) {
        color: $ice-deep;
        font-weight: 500;
      }
      
      :deep(.el-breadcrumb__separator) {
        color: $ice-medium;
      }
    }
  }
}
</style>
