<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
//@ts-ignore
import GlobalizationIcon from "@repo/assets/svg/globalization.svg?component";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import Check from "@iconify-icons/ep/check";
import Restore from "@iconify-icons/line-md/backup-restore";
import { getConfig } from "@repo/config";
import { useDefer } from "@repo/utils";

const {
  logout,
  onPanel,
  username,
  userAvatar,
  avatarsStyle,
  clickClearRouter,
  gotoAccountSetting,
  getDropdownItemStyle,
  getDropdownItemClass,
} = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const deferLang = useDefer(2);
</script>

<template>
  <div class="tool-bar">
    <!-- 搜索 -->
    <LaySearch
      v-if="getConfig().ShowBarSearch"
      id="header-search"
      class="tool-item"
    />

    <!-- 全屏 -->
    <LaySidebarFullScreen id="full-screen" class="tool-item" />

    <!-- 通知 -->
    <LayNotice
      v-if="getConfig().ShowBarNotice"
      id="header-notice"
      class="tool-item"
    />

    <!-- 语言切换 -->
    <el-dropdown
      v-if="getConfig().ShowLanguage"
      id="header-translation"
      trigger="click"
      class="tool-item"
    >
      <GlobalizationIcon class="tool-icon" />
      <template #dropdown>
        <el-dropdown-menu class="lang-dropdown">
          <el-dropdown-item
            v-if="deferLang(0)"
            :style="getDropdownItemStyle(locale, 'zh-CN')"
            :class="['lang-item', getDropdownItemClass(locale, 'zh-CN')]"
            @click="translationCh"
          >
            <IconifyIconOffline
              v-show="locale === 'zh-CN'"
              class="check-icon"
              :icon="Check"
            />
            <span>简体中文</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-if="deferLang(1)"
            :style="getDropdownItemStyle(locale, 'en-US')"
            :class="['lang-item', getDropdownItemClass(locale, 'en-US')]"
            @click="translationEn"
          >
            <IconifyIconOffline
              v-show="locale === 'en-US'"
              class="check-icon"
              :icon="Check"
            />
            <span>English</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 用户头像下拉菜单 -->
    <el-dropdown
      trigger="click"
      class="user-dropdown"
      popper-class="user-dropdown-popper"
    >
      <div class="user-trigger">
        <div class="avatar-container">
          <img :src="userAvatar" :style="avatarsStyle" class="avatar-img" />
          <span class="status-dot"></span>
        </div>
        <div v-if="username" class="user-info">
          <span class="user-name">{{ username }}</span>
          <span class="user-role">在线</span>
        </div>
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-arrow" />
      </div>
      <template #dropdown>
        <el-dropdown-menu class="user-menu">
          <!-- 用户信息头部 -->
          <div class="menu-header">
            <img
              :src="userAvatar"
              :style="avatarsStyle"
              class="header-avatar"
            />
            <div class="header-info">
              <span class="header-name">{{ username }}</span>
              <span class="header-status">当前在线</span>
            </div>
          </div>

          <div class="menu-divider"></div>

          <!-- 菜单项 -->
          <el-dropdown-item
            v-menu="['AccountSettings']"
            class="menu-item"
            @click="gotoAccountSetting"
          >
            <div class="item-icon account-icon">
              <IconifyIconOffline :icon="AccountSettingsIcon" />
            </div>
            <div class="item-content">
              <span class="item-title">{{ t("buttons.accountSetting") }}</span>
              <span class="item-desc">管理账户信息</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item class="menu-item" @click="clickClearRouter">
            <div class="item-icon cache-icon">
              <IconifyIconOffline :icon="Restore" />
            </div>
            <div class="item-content">
              <span class="item-title">{{ t("buttons.pureClearRouter") }}</span>
              <span class="item-desc">清除本地缓存</span>
            </div>
          </el-dropdown-item>

          <div class="menu-divider"></div>

          <!-- 退出登录 -->
          <el-dropdown-item class="menu-item logout-item" @click="logout">
            <div class="item-icon logout-icon">
              <IconifyIconOffline :icon="LogoutCircleRLine" />
            </div>
            <div class="item-content">
              <span class="item-title">退出登录</span>
              <span class="item-desc">安全退出当前账户</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 系统设置 -->
    <span
      v-if="getConfig().ShowBarSetting"
      class="tool-item setting-btn"
      :title="t('buttons.pureOpenSystemSet')"
      @click="onPanel"
    >
      <IconifyIconOffline :icon="Setting" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
.tool-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding: 0 8px;
}

.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }
}

.tool-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.setting-btn {
  font-size: 18px;

  &:hover {
    :deep(svg) {
      animation: spin 2s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 语言下拉菜单
.lang-dropdown {
  padding: 6px;
  border-radius: 12px;
  min-width: 140px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  margin: 2px 0;
  transition: all 0.2s ease;

  .check-icon {
    width: 16px;
    color: var(--el-color-primary);
  }

  &:hover {
    background: var(--el-fill-color-light);
  }
}

// 用户下拉触发器
.user-dropdown {
  margin-left: 8px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border-radius: 24px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

.avatar-container {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.user-role {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dropdown-arrow {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
}

.user-dropdown:focus-within .dropdown-arrow {
  transform: rotate(180deg);
}
</style>

<style lang="scss">
// 用户下拉菜单样式（全局）
.user-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 16px;
    border: none;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.12),
      0 2px 10px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    min-width: 260px;
  }
}

.user-menu {
  padding: 0 !important;

  .menu-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 16px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-8) 0%,
      var(--el-color-primary-light-9) 100%
    );

    .header-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .header-status {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: "";
        width: 6px;
        height: 6px;
        background: #22c55e;
        border-radius: 50%;
      }
    }
  }

  .menu-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 0;
  }

  .menu-item {
    display: flex !important;
    align-items: center;
    gap: 12px;
    padding: 12px 16px !important;
    margin: 4px 8px;
    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);

      .item-icon {
        transform: scale(1.1);
      }
    }

    .item-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .account-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #fff;
    }

    .cache-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .logout-item {
    margin-bottom: 8px;

    .logout-icon {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
    }

    &:hover {
      background: rgba(239, 68, 68, 0.08);

      .item-title {
        color: #ef4444;
      }
    }
  }
}

// 深色模式适配
html.dark {
  .user-trigger {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color-dark);

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .user-dropdown-popper .el-dropdown-menu {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .user-menu .menu-header {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.15) 0%,
      rgba(var(--el-color-primary-rgb), 0.08) 100%
    );
  }
}
</style>
