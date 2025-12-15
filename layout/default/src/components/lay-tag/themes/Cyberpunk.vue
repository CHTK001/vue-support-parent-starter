<script setup lang="ts">
import BaseTag from './BaseTag.vue';
import ThemeDecoration from '../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../themes/decorations';
import type { DecorationConfig } from '../../../themes/decorations';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { emitter } from '@repo/core';
import { localStorageProxy } from '@repo/utils';
import type { StorageConfigs } from '@repo/config';
import { responsiveStorageNameSpace } from '@repo/config';

// 当前主题
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);

// 获取装饰配置
const tagDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-tag');
});

onMounted(() => {
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<template>
  <div class="cyberpunk-tag-wrapper">
    <BaseTag theme-class="cyberpunk-tag" />
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in tagDecorations"
      :key="`tag-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.cyberpunk-tag-wrapper {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
// 导入基础样式
@use './default.scss';

// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-dark-light: #12121f;
$cyber-border: rgba(0, 255, 255, 0.25);
$cyber-border-hover: rgba(0, 255, 255, 0.45);

// 赛博朋克主题样式
html[data-skin="cyberpunk"] {
  // Tags 容器
  .tags-view,
  .cyberpunk-tag {
    background: linear-gradient(135deg, rgba(10, 14, 25, 0.95), rgba(15, 20, 35, 0.95)) !important;
    border-top: 1px solid $cyber-border !important;
    box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.08) !important;
    position: relative;

    // 顶部霓虹边线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent);
      z-index: 1;
    }
  }

  // 左右箭头按钮
  .arrow-left,
  .arrow-right,
  .arrow-down {
    background: rgba(0, 0, 0, 0.6) !important;
    color: $cyber-cyan !important;
    border: 1px solid $cyber-border !important;
    width: 32px !important;
    height: 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    transition: all 0.25s ease !important;

    svg {
      color: $cyber-cyan !important;
      filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
    }

    &:hover {
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: $cyber-border-hover !important;
      transform: scale(1.08) !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;

      svg {
        filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.6));
      }
    }
  }

  // 标签项 - 通用样式
  .scroll-item,
  .chrome-item,
  .modern-item,
  .card-item,
  .smart-item {
    background: rgba(10, 10, 18, 0.6) !important;
    color: $cyber-cyan !important;
    border: 1px solid rgba(0, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    margin: 0 4px !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    position: relative;
    overflow: hidden;
    font-family: 'Rajdhani', 'Roboto', sans-serif;

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
      transition: left 0.4s ease;
    }

    &:hover {
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: $cyber-border-hover !important;
      transform: translateY(-2px) !important;
      box-shadow: 
        0 0 15px rgba(0, 255, 255, 0.25),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;

      &::before {
        left: 100%;
      }
    }

    // 激活状态
    &.is-active,
    &.active {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.12) 100%) !important;
      color: #fff !important;
      border: 1px solid $cyber-cyan !important;
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 0.35),
        0 0 40px rgba(255, 0, 255, 0.15),
        inset 0 0 15px rgba(0, 255, 255, 0.1) !important;

      // 左侧霓虹指示条
      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 50%;
        background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
        border-radius: 2px;
        box-shadow: 0 0 8px $cyber-cyan, 0 0 15px $cyber-magenta;
      }

      .tag-title,
      .tag-text,
      span {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }
    }

    // 图标和文字
    .tag-icon,
    .tag-title,
    .tag-text {
      color: inherit !important;
    }

    .tag-icon {
      filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
    }

    // 关闭按钮
    .el-icon-close,
    .close-icon,
    [class*="close"] {
      color: $cyber-cyan !important;
      opacity: 0.7;
      transition: all 0.2s ease;

      &:hover {
        color: #fff !important;
        opacity: 1;
        background: rgba(0, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
      }
    }
  }

  // 固定标签特殊样式
  .is-fixed,
  .fixed-tag {
    border-left: 2px solid $cyber-magenta !important;

    &::after {
      background: linear-gradient(to bottom, $cyber-magenta, $cyber-cyan, $cyber-magenta) !important;
      box-shadow: 0 0 8px $cyber-magenta, 0 0 15px $cyber-cyan !important;
    }
  }

  // 右键菜单样式
  .tags-context-menu,
  .contextmenu {
    background: rgba(10, 14, 25, 0.96) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 10px !important;
    box-shadow:
      0 0 30px rgba(0, 255, 255, 0.2),
      0 0 60px rgba(255, 0, 255, 0.1),
      0 15px 50px rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(16px);
    overflow: hidden;
    padding: 6px !important;

    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent);
    }

    li,
    .context-menu-item {
      color: $cyber-cyan !important;
      background: rgba(10, 10, 18, 0.5) !important;
      border: 1px solid transparent !important;
      border-radius: 6px !important;
      margin: 2px 0 !important;
      transition: all 0.25s ease !important;

      &:hover {
        background: rgba(0, 255, 255, 0.12) !important;
        border-color: $cyber-cyan !important;
        color: #fff !important;
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.2) !important;
      }

      .el-icon,
      svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
      }
    }

    // 分隔线
    .divider,
    hr {
      border-color: $cyber-border !important;
      background: linear-gradient(90deg, transparent, $cyber-cyan 50%, transparent) !important;
      height: 1px !important;
    }
  }

  // 更多标签下拉菜单
  .tags-dropdown,
  .el-dropdown-menu.tags-menu {
    background: rgba(10, 14, 25, 0.96) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 10px !important;
    box-shadow:
      0 0 25px rgba(0, 255, 255, 0.2),
      0 15px 50px rgba(0, 0, 0, 0.5) !important;

    .el-dropdown-menu__item {
      color: $cyber-cyan !important;
      transition: all 0.25s ease !important;

      &:hover {
        background: rgba(0, 255, 255, 0.12) !important;
        color: #fff !important;
      }
    }
  }
}

// ==================== 右侧功能按钮下拉菜单 (Teleport 到 body) ====================
html[data-skin="cyberpunk"] .tag-function-dropdown-popper {
  // 赛博朋克颜色变量
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-border: rgba(0, 255, 255, 0.25);

  .el-dropdown-menu {
    background: rgba(10, 14, 25, 0.96) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 10px !important;
    box-shadow:
      0 0 30px rgba(0, 255, 255, 0.2),
      0 0 60px rgba(255, 0, 255, 0.1),
      0 15px 50px rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(16px);
    overflow: hidden;
    padding: 6px !important;
    position: relative;

    // 顶部霓虹线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent);
      z-index: 1;
    }

    // 扫描线效果
    &::after {
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
  }

  .el-dropdown-menu__item {
    color: $cyber-cyan !important;
    background: rgba(10, 10, 18, 0.5) !important;
    border: 1px solid transparent !important;
    border-radius: 6px !important;
    margin: 2px 0 !important;
    padding: 8px 16px !important;
    transition: all 0.25s ease !important;
    position: relative;
    z-index: 1;
    font-family: 'Rajdhani', 'Roboto', sans-serif;
    letter-spacing: 0.5px;

    // 图标样式
    .el-icon,
    svg {
      color: $cyber-cyan !important;
      filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
      margin-right: 8px;
    }

    &:hover:not(.is-disabled) {
      background: rgba(0, 255, 255, 0.12) !important;
      border-color: $cyber-cyan !important;
      color: #fff !important;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.2) !important;
      transform: translateX(3px);

      .el-icon,
      svg {
        color: #fff !important;
        filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.6));
      }
    }

    // 禁用状态
    &.is-disabled {
      color: rgba(0, 255, 255, 0.35) !important;
      background: rgba(10, 10, 18, 0.3) !important;
      cursor: not-allowed;

      .el-icon,
      svg {
        color: rgba(0, 255, 255, 0.35) !important;
        filter: none;
      }
    }

    // 分隔线样式
    &--divided {
      margin-top: 6px !important;
      
      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 8px;
        right: 8px;
        height: 1px;
        background: linear-gradient(90deg, transparent, $cyber-border 20%, $cyber-magenta 50%, $cyber-border 80%, transparent) !important;
      }
    }
  }
}
</style>
