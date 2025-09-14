<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../lay-sidebar/NavMix.vue";
//@ts-ignore
import LayTool from "../lay-tool/index.vue";

const { layout, device, logout, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, clickClearRouter, gotoSecret, gotoAccountSetting, getDropdownItemStyle, getDropdownItemClass } = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
</script>

<template>
  <div class="modern-navbar">
    <!-- 移动端汉堡菜单 -->
    <LaySidebarTopCollapse v-if="device === 'mobile'" class="hamburger-container" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />

    <!-- 面包屑导航 -->
    <LaySidebarBreadCrumb v-if="layout !== 'mix' && device !== 'mobile'" class="breadcrumb-container" />

    <!-- 混合布局导航 -->
    <LayNavMix v-if="layout === 'mix'" />

    <!-- 纵向/悬停/卡片/双栏布局右侧工具栏 -->
    <div v-if="layout === 'vertical' || layout === 'hover' || layout === 'card' || layout === 'double'" class="vertical-header-right">
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 现代化导航栏样式
.modern-navbar {
  width: 100%;
  height: 48px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  position: relative;

  // 添加顶部装饰线
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.3) 50%, rgba(64, 158, 255, 0.1) 100%);
  }

  // 暗色主题适配
  .dark & {
    background: rgba(18, 18, 23, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    &::before {
      background: linear-gradient(90deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.4) 50%, rgba(64, 158, 255, 0.15) 100%);
    }
  }

  // 保持向后兼容
  .navbar {
    @extend .modern-navbar;
  }

  // 汉堡菜单容器美化
  .hamburger-container {
    height: 100%;
    line-height: 48px;
    cursor: pointer;
    padding: 0 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 8px;
    margin: 0 8px;

    &:hover {
      background: rgba(64, 158, 255, 0.08);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // 右侧工具栏美化
  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: #303133;
    padding-right: 20px;
    gap: 12px;
    margin-left: auto;

    // 下拉链接美化
    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 40px;
      padding: 0 16px;
      color: #303133;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.06);

      &:hover {
        background: rgba(64, 158, 255, 0.08);
        border-color: rgba(64, 158, 255, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }

      &:active {
        transform: translateY(0);
      }

      // 文字样式优化
      p {
        font-size: 14px;
        font-weight: 500;
        margin: 0 8px;
        transition: color 0.3s;
      }

      // 头像样式美化
      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid rgba(255, 255, 255, 0.8);

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
          border-color: rgba(64, 158, 255, 0.3);
        }
      }
    }
  }

  // 面包屑容器美化
  .breadcrumb-container {
    margin-left: 20px;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-radius: 8px;
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .dark & {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(64, 158, 255, 0.3);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modern-navbar {
    .vertical-header-right {
      min-width: auto;
      padding-right: 12px;
      gap: 8px;
    }

    .breadcrumb-container {
      margin-left: 12px;
      padding: 0 12px;
    }

    .hamburger-container {
      padding: 0 12px;
      margin: 0 4px;
    }
  }
}

.translation {
  :deep(.el-dropdown-menu) {
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

    .el-dropdown-menu__item {
      padding: 8px 40px;
      border-radius: 4px;
      margin: 2px 0;
      transition: all 0.3s;

      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.1);
      }
    }
  }

  .check-zh,
  .check-en {
    position: absolute;
    left: 16px;
    color: var(--el-color-primary);
  }
}

.logout {
  width: 140px;

  :deep(.el-dropdown-menu__item) {
    display: inline-flex;
    align-items: center;
    min-width: 100%;
    height: 38px;
    padding: 0 16px;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.1);
    }
  }
}
</style>
