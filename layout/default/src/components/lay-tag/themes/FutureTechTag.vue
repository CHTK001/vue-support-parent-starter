<script setup lang="ts">
import BaseTag from './BaseTag.vue';
</script>

<template>
  <BaseTag theme-class="future-tech-tag" />
</template>

<style lang="scss">
html[data-skin='future-tech'],
html.theme-future-tech {
  $ft-cyan: #00ffff;
  $ft-cyan-light: #4dfdfd;
  $ft-cyan-dark: #00cccc;
  $ft-bg-dark: #050a1f;
  $ft-bg-darker: #0a1a3a;
  $ft-border: rgba(0, 255, 255, 0.4);

  .future-tech-tag {
    background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
    border-top: 2px solid $ft-border !important;
    box-shadow: 
      0 -2px 20px rgba(0, 255, 255, 0.15),
      inset 0 1px 0 rgba(0, 255, 255, 0.2) !important;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;

    // 网格背景
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
      pointer-events: none;
    }

    // 扫描线效果
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $ft-cyan, transparent);
      animation: scanLine 4s linear infinite;
    }

    // 标签项样式
    .scroll-item {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      color: rgba(0, 255, 255, 0.7) !important;
      border-radius: 8px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.1) !important;

      // 网格背景
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 10px 10px;
        opacity: 0.2;
        pointer-events: none;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: rgba(0, 255, 255, 0.6) !important;
        color: $ft-cyan !important;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.3),
          inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        transform: translateY(-2px);
      }

      &.is-active {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(5, 10, 31, 0.6)) !important;
        border-color: $ft-cyan !important;
        color: $ft-cyan !important;
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.5),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        text-shadow: 
          0 0 10px rgba(0, 255, 255, 0.8),
          0 0 20px rgba(0, 255, 255, 0.4) !important;
        font-weight: 600;
        position: relative;

        // 左侧指示条
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: $ft-cyan;
          box-shadow: 0 0 10px $ft-cyan;
        }
      }

      // 关闭按钮
      .close-size {
        color: rgba(0, 255, 255, 0.6) !important;
        transition: all 0.3s ease;

        &:hover {
          color: $ft-cyan !important;
          background: rgba(0, 255, 255, 0.1) !important;
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.4) !important;
          transform: scale(1.1);
        }
      }

      // 图标
      .tag-icon {
        color: rgba(0, 255, 255, 0.7) !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
      }

      &.is-active .tag-icon {
        color: $ft-cyan !important;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
      }

      // Chrome 模式标签
      .chrome-tab {
        .tag-icon {
          color: rgba(0, 255, 255, 0.7) !important;
          filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
        }

        .chrome-close-btn {
          color: rgba(0, 255, 255, 0.6) !important;
          transition: all 0.3s ease;

          &:hover {
            color: $ft-cyan !important;
            background: rgba(0, 255, 255, 0.1) !important;
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.4) !important;
          }
        }
      }
    }

    // 滚动按钮
    .arrow-left,
    .arrow-right {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid $ft-border !important;
      color: $ft-cyan !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.2) !important;
      transition: all 0.3s ease;
      border-radius: 4px !important;

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $ft-cyan !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4) !important;
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    // 右侧功能按钮
    .tags-options {
      .arrow-down {
        background: rgba(0, 0, 0, 0.3) !important;
        border: 1px solid $ft-border !important;
        color: $ft-cyan !important;
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.2) !important;
        transition: all 0.3s ease;
        border-radius: 4px !important;

        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: $ft-cyan !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.4) !important;
        }
      }
    }

    // 右键菜单
    .contextmenu {
      background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
      border: 2px solid $ft-border !important;
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 0.4),
        0 0 40px rgba(0, 255, 255, 0.2) !important;
      backdrop-filter: blur(20px);

      li {
        color: rgba(0, 255, 255, 0.7) !important;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: $ft-cyan !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
      }
    }

    // 下拉菜单
    :deep(.tag-function-dropdown-popper) {
      .el-dropdown-menu {
        background: linear-gradient(180deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9)) !important;
        border: 2px solid $ft-border !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.4),
          0 0 40px rgba(0, 255, 255, 0.2) !important;
        backdrop-filter: blur(20px);
        border-radius: 8px !important;
        padding: 6px !important;
        overflow: hidden;
        position: relative;
      }

      .el-dropdown-menu::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $ft-cyan 20%, $ft-purple 50%, $ft-cyan 80%, transparent);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        z-index: 1;
      }

      .el-dropdown-menu__item {
        color: rgba(0, 255, 255, 0.7) !important;
        background: rgba(0, 255, 255, 0.05) !important;
        border: 1px solid transparent !important;
        border-radius: 4px !important;
        margin: 2px 0 !important;
        padding: 8px 16px !important;
        transition: all 0.3s ease !important;
        position: relative;
        z-index: 1;

        .el-icon,
        svg {
          color: $ft-cyan !important;
          margin-right: 8px;
        }

        &:hover:not(.is-disabled) {
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: rgba(0, 255, 255, 0.3) !important;
          color: $ft-cyan !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
          box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2) !important;
        }

        &.is-disabled {
          color: rgba(0, 255, 255, 0.3) !important;
          background: rgba(0, 255, 255, 0.02) !important;
          cursor: not-allowed;

          .el-icon,
          svg {
            color: rgba(0, 255, 255, 0.3) !important;
          }
        }

        &--divided {
          margin-top: 6px !important;

          &::before {
            content: '';
            position: absolute;
            top: -4px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          }
        }
      }
    }
  }
}

// 扫描线动画
@keyframes scanLine {
  0% {
    left: -100%;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}
</style>

