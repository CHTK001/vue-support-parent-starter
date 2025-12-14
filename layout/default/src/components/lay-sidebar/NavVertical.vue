<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultSidebar from "./themes/Default.vue";
import SpringFestivalSidebar from "./themes/SpringFestival.vue";
import CyberpunkSidebar from "./themes/Cyberpunk.vue";

// 主题组件映射
const themeComponents = {
  'default': DefaultSidebar,
  'spring-festival': SpringFestivalSidebar,
  'cyberpunk': CyberpunkSidebar,
  // 其他主题组件
  // 'christmas': ChristmasSidebar,
  // 'mid-autumn': MidAutumnSidebar,
  // 'new-year': NewYearSidebar,
  // 'valentines-day': ValentinesDaySidebar,
};

const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultSidebar);
</script>

<template>
  <component :is="CurrentComponent" :key="currentTheme" />
</template>

<style lang="scss" scoped>
// 样式已移至 BaseSidebar.vue
.sidebar-container {
  position: relative;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.98)
  );
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  transition: none !important; // 禁用过渡动画
  overflow: hidden;
  z-index: 10;

  &.has-logo {
    .scrollbar-wrapper {
      height: calc(100% - 60px);
    }
  }

  &.no-logo {
    .scrollbar-wrapper {
      height: 100%;
    }
  }

  .dark & {
    background: linear-gradient(
      180deg,
      rgba(28, 28, 35, 0.95),
      rgba(30, 30, 40, 0.98)
    );
    border-right: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.sidebar-custom {
  --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  box-shadow:
    var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);

  .dark & {
    --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

:deep(.el-loading-mask) {
  opacity: 0.45;
  backdrop-filter: blur(4px);
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;

  &.mobile {
    .el-scrollbar__view {
      padding-bottom: 60px;
    }
  }

  .el-scrollbar__bar {
    opacity: 0.2;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-5);
    border-radius: 10px;

    &:hover {
      background-color: var(--el-color-primary);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

:deep(.el-menu) {
  border-right: none;
  background: transparent; /* 折叠状态下菜单样式修复 */
  &.el-menu--collapse {
    /* 隐藏折叠状态下的箭头图标 */
    .el-sub-menu__icon-arrow {
      display: none !important;
    }

    /* 有子菜单的菜单项样式 */
    .el-sub-menu > .el-sub-menu__title {
      padding: 0 !important;
      justify-content: center;

      > .sub-menu-icon {
        margin: 0 !important;
      }
    }

    /* 没有子菜单的菜单项样式修复 - 与有子菜单的保持一致 */
    .el-menu-item.submenu-title-noDropdown {
      padding: 0 !important;
      justify-content: center;

      > div {
        width: 100% !important;
        flex: none !important;
        display: block;
      }

      .sub-menu-icon {
        margin: 0 !important;
      }
    }

    /* 没有子菜单的选中状态样式 - 左侧小竖条 */
    .el-menu-item.is-active.submenu-title-noDropdown {
      position: relative;
      background: transparent !important;

      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        content: "";
        background: linear-gradient(
          to bottom,
          var(--pure-theme-menu-active-before),
          var(--el-color-primary)
        );
        border-radius: 0 4px 4px 0;
      }

      .el-icon,
      svg,
      i {
        color: var(--el-color-primary) !important;
      }
    }
  }

  .el-menu-item,
  .el-sub-menu__title {
    height: 46px;
    margin: 4px 8px;
    padding: 0 16px;
    color: var(--app-text-primary); /* 未选中状态为黑色 */
    background-color: transparent !important;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--app-text-primary) !important; /* 悬停时保持黑色 */
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    div,
    span {
      height: 46px;
      line-height: 46px;
      font-size: 14px;
      letter-spacing: 0.3px;
      color: var(--app-text-primary); /* 未选中状态为黑色 */
    }
  }

  .el-sub-menu {
    &.is-active {
      > .el-sub-menu__title {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    .el-menu {
      .el-menu-item {
        &.is-active {
          background: var(--el-color-primary) !important;
          color: var(--pure-menu-active-text-color) !important;

          .el-icon,
          svg,
          i,
          span,
          div,
          .el-text {
            color: var(--pure-menu-active-text-color) !important;
          }
        }
      }
    }
  }
}

.outer-most {
  user-select: none;
}
</style>

<style lang="scss">
// 垂直导航菜单选中状态颜色确保为白色
.pure-sidebar-container {
  :deep(.el-menu) {
    .el-menu-item,
    .el-sub-menu__title {
      height: 46px;
      margin: 4px 8px;
      padding: 0 16px;
      color: var(--app-text-primary); /* 未选中状态为黑色 */
      background-color: transparent !important;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        color: var(--app-text-primary) !important; /* 悬停时保持黑色 */
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      div,
      span {
        height: 46px;
        line-height: 46px;
        font-size: 14px;
        letter-spacing: 0.3px;
        color: var(--app-text-primary); /* 未选中状态为黑色 */
      }
    }

    .el-sub-menu {
      &.is-active {
        > .el-sub-menu__title {
          color: var(--el-color-primary);
          font-weight: 500;
        }
      }

      .el-menu {
        .el-menu-item {
          &.is-active {
            background: var(--el-color-primary) !important;
            color: var(--pure-menu-active-text-color) !important;

            .el-icon,
            svg,
            i,
            div,
            span,
            .el-text {
              color: var(--pure-menu-active-text-color) !important;
            }
          }
        }
      }
    }
  }
}
</style>
