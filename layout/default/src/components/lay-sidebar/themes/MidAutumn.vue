<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
</script>

<template>
  <div class="mid-autumn-sidebar-wrapper">
    <BaseSidebar theme-class="mid-autumn-sidebar" />
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-blue: #1a237e;           // 深蓝夜空
$mid-blue-light: #283593;     // 浅夜空
$mid-gold: #ffd54f;           // 月光金
$mid-gold-light: #ffecb3;     // 浅金色
$mid-cyan: #00bcd4;           // 青色点缀
$mid-border: rgba(255, 213, 79, 0.3);

.mid-autumn-sidebar-wrapper {
  height: 100%;
  
  :deep(.mid-autumn-sidebar) {
    background: linear-gradient(135deg, rgba($mid-blue, 0.98) 0%, rgba($mid-blue-light, 0.98) 100%) !important;
    border-right: 3px solid $mid-border !important;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.2),
      inset -1px 0 0 rgba($mid-gold, 0.2) !important;
    position: relative;
    
    // 星空装饰纹样
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 2px;
      height: 100%;
      background: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent 15px,
        rgba($mid-gold, 0.2) 15px,
        rgba($mid-gold, 0.2) 16px
      );
      z-index: 1;
    }
    
    // Logo 区域样式 - 中秋主题（使用月饼替换 Logo）
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(13, 27, 66, 0.95) 0%, rgba($mid-blue, 0.95) 100%);
      border-bottom: 2px solid $mid-border;
      position: relative;
      
      // 金色顶边装饰
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $mid-gold 30%, $mid-gold-light 50%, $mid-gold 70%, transparent);
      }
      
      .sidebar-logo-link {
        position: relative;
        
        .sidebar-title {
          color: $mid-gold !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 10px rgba($mid-gold, 0.3);
          font-weight: 700;
          margin-left: 40px !important; // 给月饼腐出空间
        }
        
        // 隐藏原始 Logo
        img {
          opacity: 0;
          width: 0 !important;
          height: 0 !important;
          margin: 0 !important;
        }
        
        // 用伪元素显示月饼 Logo
        &::before {
          content: '🥮';
          font-size: 32px;
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          filter: drop-shadow(0 2px 6px rgba($mid-gold, 0.6));
          animation: mooncakeFloat 3s ease-in-out infinite;
        }
        
        // 环境标识中秋风格
        .env-badge {
          background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
          color: $mid-blue !important;
          box-shadow: 0 2px 6px rgba($mid-gold, 0.5);
          border: 1px solid rgba($mid-blue, 0.3);
        }
      }
    }
    
    // 月饼浮动动画
    @keyframes mooncakeFloat {
      0%, 100% {
        transform: translateY(-50%);
      }
      50% {
        transform: translateY(calc(-50% - 3px));
      }
    }
    
    // 菜单样式
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .el-menu-item,
    .el-sub-menu__title {
      color: $mid-gold-light !important;
      background: linear-gradient(135deg, rgba(13, 27, 66, 0.7) 0%, rgba($mid-blue-light, 0.7) 100%) !important;
      margin: 4px 8px;
      border-radius: 8px;
      border: 1.5px solid rgba($mid-gold, 0.25) !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: linear-gradient(135deg, rgba($mid-blue, 0.9) 0%, rgba($mid-blue-light, 0.9) 100%) !important;
        color: #FFF !important;
        border-color: rgba($mid-gold, 0.5) !important;
        transform: translateX(4px) scale(1.02);
        box-shadow: 
          0 4px 12px rgba($mid-gold, 0.25),
          0 2px 8px rgba($mid-blue, 0.4);
      }
      
      .el-icon, svg {
        color: $mid-gold !important;
      }
      
      span, div {
        color: inherit !important;
      }
    }
    
    .el-menu-item.is-active {
      background: linear-gradient(135deg, $mid-gold 0%, $mid-gold-light 100%) !important;
      color: $mid-blue !important;
      border: 2px solid $mid-cyan !important;
      font-weight: 700;
      box-shadow: 
        0 4px 16px rgba($mid-gold, 0.5),
        0 0 20px rgba($mid-gold, 0.3);
      
      .el-icon, svg, span, div {
        color: $mid-blue !important;
      }
      
      // 左侧青色装饰条
      &::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 70%;
        background: linear-gradient(to bottom, $mid-cyan, #26c6da, $mid-cyan);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba($mid-cyan, 0.8);
      }
    }
    
    // 子菜单样式
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: #FFF !important;
      font-weight: 700;
    }
    
    // 底部折叠按钮 - 中秋主题
    .left-collapse {
      background: linear-gradient(135deg, rgba(13, 27, 66, 0.95) 0%, rgba($mid-blue, 0.95) 100%) !important;
      border-top: 2px solid $mid-border !important;
      box-shadow: 0 -2px 8px rgba($mid-blue, 0.3) !important;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $mid-gold 30%, $mid-gold-light 50%, $mid-gold 70%, transparent);
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba($mid-blue, 0.95) 0%, rgba($mid-blue-light, 0.95) 100%) !important;
        box-shadow: 0 -4px 12px rgba($mid-gold, 0.3) !important;
      }
      
      &.collapsed-state {
        background: linear-gradient(135deg, $mid-blue 0%, $mid-blue-light 100%) !important;
        border-top: 2px solid $mid-gold !important;
        
        &::before {
          background: $mid-gold;
          width: 30px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
      
      svg {
        color: $mid-gold !important;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      &:hover svg {
        color: #FFF !important;
      }
    }
    
    // 中间折叠按钮 - 中秋主题
    .center-collapse {
      background: linear-gradient(135deg, rgba(13, 27, 66, 0.95) 0%, rgba($mid-blue, 0.95) 100%) !important;
      border: 2px solid $mid-border !important;
      box-shadow: 0 2px 8px rgba($mid-blue, 0.4);
      
      &:hover {
        background: linear-gradient(135deg, rgba($mid-blue, 0.95) 0%, rgba($mid-blue-light, 0.95) 100%) !important;
        border-color: $mid-gold !important;
        box-shadow: 0 4px 12px rgba($mid-gold, 0.4);
      }
      
      svg {
        color: $mid-gold !important;
      }
      
      &:hover svg {
        color: #FFF !important;
      }
    }
  }
}
</style>
