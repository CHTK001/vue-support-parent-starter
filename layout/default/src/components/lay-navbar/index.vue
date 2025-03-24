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
  <div class="navbar bg-[#fff] shadow-sm shadow-[rgba(0,21,41,0.08)]">
    <LaySidebarTopCollapse v-if="device === 'mobile'" class="hamburger-container" :is-active="pureApp.sidebar.opened" @toggleClick="toggleSideBar" />
    <LaySidebarBreadCrumb v-if="layout !== 'mix' && device !== 'mobile'" class="breadcrumb-container" />
    <LayNavMix v-if="layout === 'mix'" />
    <div v-if="layout === 'vertical'" class="vertical-header-right">
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 48px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 48px;
    cursor: pointer;
    padding: 0 16px;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: #000000d9;
    padding-right: 16px;
    gap: 8px;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 38px;
      padding: 0 12px;
      color: #000000d9;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }

      p {
        font-size: 13px;
        font-weight: 500;
        margin: 0 8px;
      }

      img {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
    height: 100%;
    display: flex;
    align-items: center;
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
