<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LayLogo from "../lay-sidebar/components/SidebarLogo.vue";
//@ts-ignore
import LogoutCircleRLine from "@iconify-icons/ri/menu-fill";
import LogoutCircleClose from "@iconify-icons/ri/close-fill";
import LayTool from "../lay-tool/index.vue";
import { defineExpose, defineEmits, shallowRef } from "vue";

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

  .lay-menu {
    display: flex;
    position: fixed;
    top: calc(var(--navbar-height) + 1px);
    left: 0;
    height: calc(100vh - var(--navbar-height) - 5px);
    transition:
      transform 200ms linear 100ms,
      left 300ms;
    width: 100vw;
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
    .bg-logo {
      margin: 0 14px;
      color: var(--cb-color-bg-brand, #ff6a00);
      font-size: 12px;
    }
    .bg-line {
      height: var(--navbar-height);
    }
    .bg-menu {
      background-color: var(--el-color-primary, #ff6a00);
      padding: 7px;
      .bg-menu-icon {
        color: white;
        font-size: 12px;
        height: 32px;
        width: 32px;
        transition: 0.3s ease-out;
      }
    }
  }
  .vertical-header-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 260px;
    height: var(--navbar-height);
    color: #000000d9;
  }
  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: calc(100vw - 260px);
    height: var(--navbar-height);
    color: #000000d9;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--navbar-height);
      padding: 10px;
      color: #000000d9;
      cursor: pointer;

      p {
        font-size: 12px;
      }

      img {
        width: 22px;
        height: 22px;
        border-radius: 50%;
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
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
    height: 38px;
  }
}
</style>
