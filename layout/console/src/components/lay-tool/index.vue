<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LayNotice from "../lay-notice/index.vue";
import LaySearch from "../lay-search/index.vue";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
//@ts-ignore
import Check from "@iconify-icons/ep/check";
import Lock from "@iconify-icons/ep/lock";
import Restore from "@iconify-icons/line-md/backup-restore";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
//@ts-ignore
import GlobalizationIcon from "@repo/assets/svg/globalization.svg?component";
import { getConfig } from "@repo/config";
import { useDefer } from "@repo/utils";
import { defineAsyncComponent } from "vue";

const LayLogout = defineAsyncComponent(() => import("../lay-logout/index.vue"));

const { layout, device, logout, handleRefreshToken, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, clickClearRouter, gotoSecret, gotoAccountSetting, getDropdownItemStyle, getDropdownItemClass } = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const deferDropdown = useDefer(2);
const deferLang = useDefer(2);
</script>

<template>
  <div class="tool-bar">
    <LaySearch v-if="getConfig().ShowBarSearch" id="header-search" class="tool-item" />

    <div v-if="getConfig().ShowLanguage" class="tool-item">
      <el-dropdown id="header-translation" trigger="click">
        <GlobalizationIcon class="tool-icon" />
        <template #dropdown>
          <el-dropdown-menu class="tool-dropdown translation">
            <el-dropdown-item v-if="deferLang(0)" :style="getDropdownItemStyle(locale, 'zh-CN')" :class="['menu-item', getDropdownItemClass(locale, 'zh-CN')]" @click="translationCh">
              <IconifyIconOffline v-show="locale === 'zh-CN'" class="check-icon" :icon="Check" />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item v-if="deferLang(1)" :style="getDropdownItemStyle(locale, 'en-US')" :class="['menu-item', getDropdownItemClass(locale, 'en-US')]" @click="translationEn">
              <IconifyIconOffline v-show="locale === 'en-US'" class="check-icon" :icon="Check" />
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <LaySidebarFullScreen id="full-screen" class="tool-item" />
    <LayNotice v-if="getConfig().ShowBarNotice" id="header-notice" class="tool-item" />

    <el-dropdown trigger="click" class="user-dropdown tool-item">
      <span class="user-link">
        <div class="avatar-wrapper">
          <img :src="userAvatar" :style="avatarsStyle" class="user-avatar" />
        </div>
        <p v-if="username" class="user-name">{{ username }}</p>
      </span>
      <template #dropdown>
        <el-dropdown-menu class="user-menu">
          <el-dropdown-item v-menu="['secret']" class="menu-item" @click="gotoSecret">
            <IconifyIconOffline :icon="Lock" class="menu-icon" />
            <span>{{ t("buttons.secret") }}</span>
          </el-dropdown-item>

          <el-dropdown-item v-menu="['AccountSettings']" class="menu-item" @click="gotoAccountSetting">
            <IconifyIconOffline :icon="AccountSettingsIcon" class="menu-icon" />
            {{ t("buttons.accountSetting") }}
          </el-dropdown-item>

          <el-dropdown-item class="menu-item" @click="clickClearRouter">
            <IconifyIconOffline :icon="Restore" class="menu-icon" />
            {{ t("buttons.pureClearRouter") }}
          </el-dropdown-item>

          <template v-if="getConfig().openShowRefreshToken">
            <el-dropdown-item class="menu-item" @click="handleRefreshToken">
              <IconifyIconOffline :icon="LogoutCircleRLine" class="menu-icon" />
              {{ t("buttons.refreshToken") }}
            </el-dropdown-item>
          </template>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <LayLogout class="tool-item-1 logout-btn" @click="logout" />

    <span v-if="getConfig().ShowBarSetting" class="tool-item setting-btn" :title="t('buttons.pureOpenSystemSet')" @click="onPanel">
      <IconifyIconOffline :icon="Setting" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
.tool-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 48px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  .dark & {
    background: linear-gradient(to right, rgba(28, 28, 35, 0.95), rgba(28, 28, 35, 0.98));
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

svg {
  background: transparent;
}
.tool-item-1 {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}
.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary-light-8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.tool-icon {
  font-size: 20px;
  color: var(--el-text-color-primary);
  transition: all 0.3s;

  &:hover {
    transform: rotate(15deg) scale(1.1);
  }
}

.user-dropdown {
  .user-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px;

    .avatar-wrapper {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        border: 2px solid transparent;
        border-radius: 50%;
        transition: all 0.3s;
      }

      &:hover::after {
        border-color: var(--el-color-primary);
        transform: scale(1.1);
      }
    }

    .user-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1) rotate(5deg);
      }
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin: 0;
      transition: color 0.3s;
    }
  }
}

.tool-dropdown {
  border-radius: 12px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.05);

  .menu-item {
    margin: 4px;
    padding: 10px 16px;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      background: var(--el-color-primary-light-9);
      transform: translateX(4px);

      .menu-icon {
        color: var(--el-color-primary);
        transform: scale(1.1);
      }
    }
  }
}

.dark {
  .tool-bar {
    background: rgba(28, 28, 35, 0.95);
  }

  .tool-item {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .user-name {
    color: rgba(255, 255, 255, 0.85);
  }

  .tool-dropdown {
    background: rgba(28, 28, 35, 0.98);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
