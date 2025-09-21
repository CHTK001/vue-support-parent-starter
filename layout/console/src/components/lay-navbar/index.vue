<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LayLogo from "../lay-sidebar/components/SidebarLogo.vue";
//@ts-ignore
import LogoutCircleRLine from "@iconify-icons/ri/menu-fill";
import LogoutCircleClose from "@iconify-icons/ri/close-fill";
import LayTool from "../lay-tool/index.vue";
import { defineExpose, shallowRef } from "vue";

const { layout, device, logout, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, clickClearRouter, gotoSecret, gotoAccountSetting, getDropdownItemStyle, getDropdownItemClass } = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const emit = defineEmits();
const showMenu = shallowRef(false);
const toggleMenu = async () => {
  showMenu.value = !showMenu.value;
  emit("toggleMenu", showMenu.value);
};

const triggerClose = async () => {
  showMenu.value = false;
  emit("toggleMenu", showMenu.value);
  emit("close");
};

const triggerCloseMenu = async () => {
  showMenu.value = false;
};

defineExpose({ triggerCloseMenu });
</script>

<template>
  <div class="navbar bg-[#fff] shadow-sm shadow-[rgba(0,21,41,0.08)] flex">
    <div class="vertical-header-left">
      <div class="hamburger-container" @click="toggleMenu">
        <div class="bg-menu">
          <IconifyIconOffline :icon="showMenu ? LogoutCircleClose : LogoutCircleRLine" class="bg-menu-icon" />
        </div>
        <div class="bg-logo">
          <LayLogo />
        </div>
        <el-divider direction="vertical" class="bg-line"></el-divider>
      </div>
    </div>
    <div class="vertical-header-right">
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: var(--navbar-height);
  overflow: hidden;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  .lay-menu {
    display: flex;
    position: fixed;
    top: calc(var(--navbar-height) + 1px);
    left: 0;
    height: calc(100vh - var(--navbar-height) - 5px);
    transition:
      transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
      left 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    width: 100vw;
    overflow: hidden;
  }

  .lay-menu-hidden {
    left: -100%;
  }

  .hamburger-container {
    float: left;
    display: flex;
    height: 100%;
    line-height: var(--navbar-height);
    cursor: pointer;
    align-items: center;

    .bg-logo {
      margin: 0 14px;
      color: var(--cb-color-bg-brand, #ff6a00);
      font-size: 12px;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .bg-line {
      height: var(--navbar-height);
      margin: 0 8px;
      opacity: 0.5;
    }

    .bg-menu {
      background-color: var(--el-color-primary, #ff6a00);
      padding: 7px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

      &::before {
        content: "";
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
        opacity: 0;
        transform: scale(0.5);
        transition:
          transform 0.5s ease,
          opacity 0.5s ease;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);

        &::before {
          opacity: 1;
          transform: scale(1);
          animation: pulse 1.5s infinite;
        }

        .bg-menu-icon {
          transform: rotate(180deg);
        }
      }

      &:active {
        transform: scale(0.95);
      }

      .bg-menu-icon {
        color: var(--el-text-color-primary);
        font-size: 12px;
        height: 32px;
        width: 32px;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }
  }

  .vertical-header-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 260px;
    height: var(--navbar-height);
    color: var(--el-text-color-primary);
    padding-left: 8px;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: calc(100vw - 260px);
    height: var(--navbar-height);
    color: var(--el-text-color-primary);
    padding-right: 16px;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--navbar-height);
      padding: 10px;
      color: var(--el-text-color-primary);
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 8px;

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05);
      }

      p {
        font-size: 14px;
        font-weight: 500;
        margin-right: 8px;
      }

      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 8px 40px;
    font-size: 14px;
  }

  .check-zh,
  .check-en {
    position: absolute;
    left: 20px;
    transition: transform 0.3s ease;
  }
}

.logout {
  width: 140px;
  border-radius: 8px;
  overflow: hidden;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    min-width: 100%;
    height: 42px;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(var(--el-color-primary-rgb), 0.05);
      padding-left: 24px;
    }
  }
}

/* 添加动画关键帧 */
@keyframes pulse {
  0% {
    opacity: 0.8;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

/* 暗黑模式适配 */
.dark {
  .navbar {
    background-color: var(--el-bg-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .bg-menu {
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4) !important;

    &:hover {
      box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.5) !important;
    }
  }

  .el-dropdown-link:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.1) !important;
  }
}

/* 添加毛玻璃效果支持 */
@supports (backdrop-filter: blur(8px)) {
  .navbar {
    background-color: rgba(var(--el-bg-color-rgb), 0.85);
    backdrop-filter: blur(8px);
  }

  .dark .navbar {
    background-color: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(10px);
  }
}
</style>
