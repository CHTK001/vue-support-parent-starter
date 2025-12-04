<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../lay-sidebar/NavMix.vue";
//@ts-ignore
import LayTool from "../lay-tool/index.vue";
import { emitter } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { onBeforeUnmount, ref } from "vue";

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  toggleSideBar,
  clickClearRouter,
  gotoSecret,
  gotoAccountSetting,
  getDropdownItemStyle,
  getDropdownItemClass,
} = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();

// 全局配置
const { $storage } = useGlobal<any>();

// 面包屑导航显示控制
const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);

// 监听面包屑显示变更事件
emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
});
</script>

<template>
  <div class="modern-navbar">
    <!-- 移动端汉堡菜单 -->
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- 面包屑导航 -->
    <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile' && showBreadcrumb"
      class="breadcrumb-container"
    />

    <!-- 混合布局导航 -->
    <LayNavMix v-if="layout === 'mix'" />

    <!-- 纵向/悬停/卡片/双栏布局右侧工具栏 -->
    <div
      v-if="
        layout === 'vertical' ||
        layout === 'hover' ||
        layout === 'card' ||
        layout === 'double'
      "
      class="vertical-header-right"
    >
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
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
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
    background: linear-gradient(
      90deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      rgba(var(--el-color-primary-rgb), 0.3) 50%,
      rgba(var(--el-color-primary-rgb), 0.1) 100%
    );
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
      background: rgba(var(--el-color-primary-rgb), 0.08);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
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
    color: var(--el-text-color-primary);
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
      color: var(--el-text-color-primary);
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color-lighter);

      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.08);
        border-color: rgba(var(--el-color-primary-rgb), 0.2);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
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
        color: var(--el-text-color-primary);
      }

      // 头像样式美化
      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid var(--el-bg-color);

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
          border-color: rgba(var(--el-color-primary-rgb), 0.3);
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
  }
}

// 深色主题适配
html.dark {
  .modern-navbar {
    background: var(--el-bg-color);
    border-bottom-color: var(--el-border-color);

    &::before {
      background: linear-gradient(
        90deg,
        rgba(var(--el-color-primary-rgb), 0.15) 0%,
        rgba(var(--el-color-primary-rgb), 0.4) 50%,
        rgba(var(--el-color-primary-rgb), 0.15) 100%
      );
    }

    .hamburger-container {
      &:hover {
        background: rgba(var(--el-color-primary-rgb), 0.15);
      }
    }

    .vertical-header-right {
      .el-dropdown-link {
        background: var(--el-fill-color-dark);
        border-color: var(--el-border-color);

        &:hover {
          background: rgba(var(--el-color-primary-rgb), 0.15);
          border-color: rgba(var(--el-color-primary-rgb), 0.3);
        }

        p {
          color: var(--el-text-color-primary);
        }

        img {
          border-color: var(--el-border-color);
        }
      }
    }

    .breadcrumb-container {
      background: var(--el-fill-color-dark);

      &:hover {
        background: var(--el-fill-color);
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
