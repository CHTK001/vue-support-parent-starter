<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import LayMessage from "../lay-message/index.vue";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import Check from "@iconify-icons/ep/check";
import Restore from "@iconify-icons/line-md/backup-restore";
import { getConfig } from "@repo/config";
import { useDefer } from "@repo/utils";
import { router } from "@repo/core";

const {
  logout,
  onPanel,
  username,
  userAvatar,
  avatarsStyle,
  clickClearRouter,
} = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const deferLang = useDefer(2);

/**
 * 跳转到账户设置页面
 */
const gotoAccountSetting = () => {
  // 直接使用路径跳转，确保能正确导航
  router.push("/AccountSettings");
};
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

    <!-- 消息 -->
    <LayMessage
      v-if="getConfig().ShowBarMessage"
      v-menu="['MessageCenter']"
      id="header-message"
      class="tool-item"
    />

    <!-- 语言切换 -->
    <el-dropdown
      v-if="getConfig().ShowLanguage"
      id="header-translation"
      trigger="click"
      popper-class="lang-dropdown-popper"
    >
      <div class="user-trigger lang-style">
        <div class="lang-icon-wrapper">
          <IconifyIconOnline icon="ri:translate-2" class="lang-main-icon" />
        </div>
        <div class="user-info">
          <span class="user-name">{{
            locale === "zh-CN" ? "简体中文" : "English"
          }}</span>
          <span class="user-role">{{
            locale === "zh-CN" ? "语言" : "Language"
          }}</span>
        </div>
        <span class="dropdown-arrow-wrapper">
          <IconifyIconOnline
            icon="ri:arrow-down-s-line"
            class="dropdown-arrow"
          />
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu class="lang-menu">
          <div class="lang-header">
            <IconifyIconOnline icon="ri:global-line" />
            <span>选择语言</span>
          </div>
          <el-dropdown-item
            v-if="deferLang(0)"
            :class="['lang-item', { active: locale === 'zh-CN' }]"
            @click="translationCh"
          >
            <div class="lang-item-content">
              <span class="lang-flag">🇨🇳</span>
              <div class="lang-info">
                <span class="lang-name">简体中文</span>
                <span class="lang-desc">Simplified Chinese</span>
              </div>
            </div>
            <IconifyIconOffline
              v-show="locale === 'zh-CN'"
              class="lang-check"
              :icon="Check"
            />
          </el-dropdown-item>
          <el-dropdown-item
            v-if="deferLang(1)"
            :class="['lang-item', { active: locale === 'en-US' }]"
            @click="translationEn"
          >
            <div class="lang-item-content">
              <span class="lang-flag">🇺🇸</span>
              <div class="lang-info">
                <span class="lang-name">English</span>
                <span class="lang-desc">United States</span>
              </div>
            </div>
            <IconifyIconOffline
              v-show="locale === 'en-US'"
              class="lang-check"
              :icon="Check"
            />
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
        <span class="dropdown-arrow-wrapper">
          <IconifyIconOnline
            icon="ri:arrow-down-s-line"
            class="dropdown-arrow"
          />
        </span>
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

          <!-- 菜单项容器 -->
          <div class="menu-body">
            <el-dropdown-item
              v-menu="['AccountSettings']"
              class="menu-item"
              @click="gotoAccountSetting"
            >
              <div class="item-icon account-icon">
                <IconifyIconOffline :icon="AccountSettingsIcon" />
              </div>
              <div class="item-content">
                <span class="item-title">{{
                  t("buttons.accountSetting")
                }}</span>
                <span class="item-desc">管理账户信息与偏好设置</span>
              </div>
              <IconifyIconOnline
                icon="ri:arrow-right-s-line"
                class="item-arrow"
              />
            </el-dropdown-item>

            <el-dropdown-item class="menu-item" @click="clickClearRouter">
              <div class="item-icon cache-icon">
                <IconifyIconOffline :icon="Restore" />
              </div>
              <div class="item-content">
                <span class="item-title">{{
                  t("buttons.pureClearRouter")
                }}</span>
                <span class="item-desc">清除本地缓存数据</span>
              </div>
              <IconifyIconOnline
                icon="ri:arrow-right-s-line"
                class="item-arrow"
              />
            </el-dropdown-item>
          </div>

          <!-- 退出登录 -->
          <div class="menu-footer">
            <el-dropdown-item class="logout-item" @click="logout">
              <IconifyIconOffline
                :icon="LogoutCircleRLine"
                class="logout-icon"
              />
              <span>退出登录</span>
            </el-dropdown-item>
          </div>
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
  gap: 6px;
  height: 48px;
  padding: 0 12px;
}

.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }
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

// 语言切换触发器 - 统一为头像风格
.lang-style {
  .lang-icon-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

    .lang-main-icon {
      font-size: 16px;
      color: #fff;
    }
  }
}

// 保留旧的触发器样式作为备用
.lang-trigger-old {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 20px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
  }

  .lang-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }

  .lang-text {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .lang-arrow {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: transform 0.2s ease;
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

.dropdown-arrow-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--el-fill-color);
  margin-left: 4px;
  transition: all 0.2s ease;
}

.dropdown-arrow {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s ease;
}

.user-trigger:hover .dropdown-arrow-wrapper {
  background: var(--el-color-primary-light-8);

  .dropdown-arrow {
    color: var(--el-color-primary);
  }
}

.user-dropdown:focus-within .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown:focus-within .dropdown-arrow-wrapper {
  background: var(--el-color-primary-light-8);

  .dropdown-arrow {
    color: var(--el-color-primary);
  }
}
</style>

<style lang="scss">
// 语言下拉菜单样式（全局）
.lang-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 16px;
    border: none;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.12),
      0 2px 10px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    min-width: 220px;
  }
}

.lang-menu {
  padding: 0 !important;

  .lang-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .lang-item {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px !important;
    margin: 10px 12px;
    border-radius: 12px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.active {
      background: var(--el-color-primary-light-9);

      .lang-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    .lang-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lang-flag {
      font-size: 24px;
      line-height: 1;
    }

    .lang-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lang-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .lang-desc {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }

    .lang-check {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }
}

// 用户下拉菜单样式（全局）
.user-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 20px;
    border: none;
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    min-width: 280px;
  }
}

.user-menu {
  padding: 0 !important;

  .menu-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 20px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );

    .header-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header-name {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    .header-status {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: "";
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
      }
    }
  }

  .menu-body {
    padding: 12px 8px;
  }

  .menu-item {
    display: flex !important;
    align-items: center;
    gap: 14px;
    padding: 18px 18px !important;
    margin: 10px 0;
    border-radius: 14px;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);

      .item-icon {
        transform: scale(1.08);
      }

      .item-arrow {
        transform: translateX(4px);
        opacity: 1;
      }
    }

    .item-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .account-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .cache-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .item-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.3;
    }

    .item-arrow {
      font-size: 18px;
      color: var(--el-text-color-placeholder);
      opacity: 0;
      transition: all 0.2s ease;
    }
  }

  .menu-footer {
    padding: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
  }

  .logout-item {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px !important;
    margin: 0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    transition: all 0.2s ease;
    cursor: pointer;

    .logout-icon {
      font-size: 18px;
    }

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;

      .logout-icon {
        color: #ef4444;
      }
    }
  }
}

// 深色模式适配
html.dark {
  .lang-trigger {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color-dark);

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .user-trigger {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color-dark);

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  }

  .lang-menu .lang-header {
    background: var(--el-fill-color-dark);
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-dark-2) 0%,
        var(--el-color-primary) 100%
      );
    }

    .menu-footer {
      background: var(--el-fill-color-dark);
    }
  }
}
</style>
