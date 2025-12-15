<script setup lang="ts">
import BaseSidebar from './BaseSidebar.vue';
</script>

<template>
  <div class="cyberpunk-sidebar-wrapper">
    <BaseSidebar theme-class="cyberpunk-sidebar" />
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-dark-light: #12121f;
$cyber-glass: rgba(10, 10, 18, 0.95);
$cyber-border: rgba(0, 255, 255, 0.3);
$cyber-shadow: rgba(0, 255, 255, 0.4);

.cyberpunk-sidebar-wrapper {
  height: 100%;
  
  :deep(.cyberpunk-sidebar) {
    background: $cyber-glass !important;
    border-right: 2px solid $cyber-border !important;
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.15),
      inset -1px 0 0 rgba(255, 0, 255, 0.1) !important;
    position: relative;
    overflow: visible !important;
    
    // 扫描线动画背景
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.02) 2px,
        rgba(0, 255, 255, 0.02) 4px
      );
      pointer-events: none;
      z-index: 0;
    }
    
    // 右侧霓虹边线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: -2px;
      width: 2px;
      height: 100%;
      background: linear-gradient(
        to bottom,
        $cyber-cyan,
        $cyber-magenta 50%,
        $cyber-cyan
      );
      animation: cyber-line-pulse 3s ease-in-out infinite;
      z-index: 1;
    }
    
    // Logo 区域样式 - 赛博朋克主题
    .sidebar-logo-container {
      background: linear-gradient(135deg, rgba(10, 10, 18, 0.98) 0%, rgba(18, 18, 31, 0.98) 100%);
      border-bottom: 1px solid $cyber-border;
      position: relative;
      z-index: 1;
      
      // 底部霓虹线
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent, 
          $cyber-cyan 20%, 
          $cyber-magenta 50%, 
          $cyber-cyan 80%, 
          transparent
        );
        animation: cyber-glow-line 2s ease-in-out infinite;
      }
      
      .sidebar-logo-link {
        .sidebar-title {
          color: $cyber-cyan !important;
          text-shadow: 
            0 0 5px rgba(0, 255, 255, 0.5),
            0 0 10px rgba(0, 255, 255, 0.3);
          font-weight: 700;
          font-family: 'Orbitron', 'Rajdhani', monospace;
          letter-spacing: 1px;
        }
        
        img {
          filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.5));
        }
        
        // 环境标识赛博朋克风格
        .env-badge {
          background: linear-gradient(135deg, $cyber-cyan, $cyber-magenta) !important;
          color: $cyber-dark !important;
          box-shadow: 
            0 0 10px rgba(0, 255, 255, 0.5),
            0 0 20px rgba(255, 0, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          text-transform: uppercase;
        }
      }
    }
    
    // 滚动区域
    .el-scrollbar {
      position: relative;
      z-index: 1;
    }
    
    // 菜单样式
    .el-menu {
      background: transparent !important;
      border-right: none;
    }
    
    .el-menu-item,
    .el-sub-menu__title {
      color: $cyber-cyan !important;
      background: rgba(10, 10, 18, 0.6) !important;
      margin: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      font-weight: 500;
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      // 悬停闪烁背景
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(0, 255, 255, 0.1),
          transparent
        );
        transition: left 0.5s ease;
      }
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        color: #fff !important;
        border-color: $cyber-cyan !important;
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.1);
        transform: translateX(4px);
        
        &::before {
          left: 100%;
        }
      }
      
      .el-icon, svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
      }
      
      span, div {
        color: inherit !important;
      }
    }
    
    // 激活状态
    .el-menu-item.is-active {
      background: linear-gradient(135deg, 
        rgba(0, 255, 255, 0.2) 0%, 
        rgba(255, 0, 255, 0.15) 100%
      ) !important;
      color: #fff !important;
      border: 1px solid $cyber-cyan !important;
      font-weight: 700;
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 0.4),
        0 0 40px rgba(255, 0, 255, 0.2),
        inset 0 0 20px rgba(0, 255, 255, 0.1);
      
      .el-icon, svg, span, div {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
      }
      
      .el-icon, svg {
        filter: drop-shadow(0 0 6px $cyber-cyan);
      }
      
      // 左侧霓虹指示条
      &::after {
        content: '';
        position: absolute;
        left: -1px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
        border-radius: 2px;
        box-shadow: 0 0 10px $cyber-cyan, 0 0 20px $cyber-magenta;
        animation: cyber-indicator-pulse 1.5s ease-in-out infinite;
      }
    }
    
    // 子菜单样式
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: #fff !important;
      font-weight: 700;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      border-color: rgba(0, 255, 255, 0.4) !important;
      background: rgba(0, 255, 255, 0.08) !important;
    }
    
    // 垂直导航展开的子菜单容器 - 保持默认尺寸，只修改颜色
    .el-sub-menu .el-menu {
      background: rgba(5, 5, 12, 0.6) !important;
      
      // 子菜单项 - 只修改颜色样式
      .el-menu-item {
        color: $cyber-cyan !important;
        background: transparent !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #fff !important;
        }
        
        &.is-active {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.15) 100%) !important;
          color: #fff !important;
          
          .el-icon, svg, span, div {
            color: #fff !important;
          }
        }
        
        .el-icon, svg {
          color: $cyber-cyan !important;
        }
        
        span, div {
          color: inherit !important;
        }
      }
      
      // 嵌套子菜单标题
      .el-sub-menu__title {
        color: $cyber-cyan !important;
        background: transparent !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #fff !important;
        }
      }
    }
    
    // 底部折叠按钮 - 赛博朋克主题
    .left-collapse {
      background: linear-gradient(135deg, rgba(10, 10, 18, 0.98) 0%, rgba(18, 18, 31, 0.98) 100%) !important;
      border-top: 1px solid $cyber-border !important;
      box-shadow: 0 -2px 15px rgba(0, 255, 255, 0.15) !important;
      position: relative;
      z-index: 1;
      
      &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, $cyber-cyan 30%, $cyber-magenta 50%, $cyber-cyan 70%, transparent);
      }
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        box-shadow: 0 -4px 20px rgba(0, 255, 255, 0.3) !important;
      }
      
      &.collapsed-state {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(255, 0, 255, 0.1) 100%) !important;
        border-top: 1px solid $cyber-cyan !important;
        
        &::before {
          background: $cyber-cyan;
          width: 30px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px $cyber-cyan;
        }
      }
      
      svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
      }
      
      &:hover svg {
        color: #fff !important;
        filter: drop-shadow(0 0 8px $cyber-cyan);
      }
    }
    
    // 中间折叠按钮 - 赛博朋克主题
    .center-collapse {
      z-index: 9999 !important;
      background: linear-gradient(135deg, rgba(10, 10, 18, 0.98) 0%, rgba(18, 18, 31, 0.98) 100%) !important;
      border: 1px solid $cyber-border !important;
      border-radius: 4px !important;
      box-shadow: 
        0 0 15px rgba(0, 255, 255, 0.2),
        2px 0 8px rgba(0, 0, 0, 0.3),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      
      &:hover {
        background: rgba(0, 255, 255, 0.15) !important;
        border-color: $cyber-cyan !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.4),
          0 0 40px rgba(255, 0, 255, 0.2),
          2px 0 12px rgba(0, 0, 0, 0.4) !important;
      }
      
      svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
      }
      
      &:hover svg {
        color: #fff !important;
        filter: drop-shadow(0 0 8px $cyber-cyan);
      }
    }
  }
}

// 动画定义
@keyframes cyber-line-pulse {
  0%, 100% {
    opacity: 0.6;
    box-shadow: 0 0 5px $cyber-cyan;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 15px $cyber-cyan, 0 0 25px $cyber-magenta;
  }
}

@keyframes cyber-glow-line {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
    filter: brightness(1.3);
  }
}

@keyframes cyber-indicator-pulse {
  0%, 100% {
    opacity: 0.8;
    height: 60%;
  }
  50% {
    opacity: 1;
    height: 70%;
  }
}
</style>

<style lang="scss">
// 子菜单弹出层全局样式（teleport 到 body，必须是全局样式）
// 仅在赛博朋克主题下生效
html[data-skin="cyberpunk"] {
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-border: rgba(0, 255, 255, 0.3);

  // 子菜单弹出层容器
  .pure-scrollbar.el-menu--vertical,
  .el-menu--popup-container .el-menu--popup,
  .el-menu--popup {
    background: rgba(10, 10, 18, 0.96) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 8px !important;
    box-shadow:
      0 0 25px rgba(0, 255, 255, 0.2),
      0 0 50px rgba(255, 0, 255, 0.1),
      0 15px 40px rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(16px);
    overflow: hidden !important;
    padding: 6px !important;
    position: relative;

    // 扫描线纹理
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.02) 2px,
        rgba(0, 255, 255, 0.02) 4px
      );
      pointer-events: none;
      z-index: 0;
    }

    // 顶部霓虹边线
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent);
      z-index: 1;
    }

    // 子菜单项 - 与一级菜单统一样式
    .el-menu-item {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 4px !important;
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      color: $cyber-cyan !important;
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;
      overflow: hidden;

      // 悬停闪烁效果
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(0, 255, 255, 0.1),
          transparent
        );
        transition: left 0.5s ease;
        z-index: -1;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        color: #fff !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;

        &::before {
          left: 100%;
        }
      }

      // 图标样式
      .el-icon,
      svg,
      .sub-menu-icon {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        margin-right: 8px;
      }

      // 文字
      span,
      .el-text {
        color: inherit !important;
      }

      // 激活状态 - 与一级菜单统一
      &.is-active {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.15) 100%) !important;
        border: 1px solid $cyber-cyan !important;
        color: #fff !important;
        font-weight: 700;
        box-shadow:
          0 0 20px rgba(0, 255, 255, 0.4),
          0 0 40px rgba(255, 0, 255, 0.2),
          inset 0 0 20px rgba(0, 255, 255, 0.1) !important;

        .el-icon,
        svg,
        .sub-menu-icon {
          filter: drop-shadow(0 0 6px $cyber-cyan);
        }

        span, .el-text {
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
        }

        // 左侧霓虹指示条
        &::after {
          content: '';
          position: absolute;
          left: -1px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
          border-radius: 2px;
          box-shadow: 0 0 10px $cyber-cyan, 0 0 20px $cyber-magenta;
          animation: cyber-submenu-indicator 1.5s ease-in-out infinite;
        }
      }
    }

    // 嵌套子菜单标题 - 与一级菜单统一
    .el-sub-menu__title {
      margin: 4px 6px !important;
      padding: 0 16px !important;
      height: 40px !important;
      line-height: 40px !important;
      border-radius: 4px !important;
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(0, 255, 255, 0.2) !important;
      color: $cyber-cyan !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      z-index: 1;

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        color: #fff !important;
        transform: translateX(4px) !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
      }

      .el-icon,
      svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
      }

      span {
        color: inherit !important;
      }

      // 展开箭头
      .el-sub-menu__icon-arrow {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
      }
    }

    // 激活的子菜单标题
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: #fff !important;
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: rgba(0, 255, 255, 0.4) !important;
      font-weight: 700;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
    }
  }

  // 子菜单指示条动画
  @keyframes cyber-submenu-indicator {
    0%, 100% {
      opacity: 0.8;
      height: 60%;
    }
    50% {
      opacity: 1;
      height: 70%;
    }
  }
}
</style>
