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
import { router, emitter } from "@repo/core";
import { ref, onBeforeUnmount } from "vue";
import { useGlobal } from "@pureadmin/utils";

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

// 获取当前主题
const { $storage } = useGlobal<GlobalPropertiesApi>();
const currentTheme = ref<string>($storage.configure?.systemTheme || 'default');

// 监听主题切换
emitter.on("systemThemeChange", (themeKey: string) => {
  currentTheme.value = themeKey;
});

// 判断是否为春节主题
const isSpringFestival = () => currentTheme.value === 'spring-festival';

// 清理事件监听
onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});

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
      :class="['tool-item', 'setting-btn', { 'fu-setting': isSpringFestival() }]"
      :title="t('buttons.pureOpenSystemSet')"
      @click="onPanel"
    >
      <template v-if="isSpringFestival()">福</template>
      <IconifyIconOffline v-else :icon="Setting" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
.tool-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
}

.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 18px;

  /* 光泽层 */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
    color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.1);
  }
}

.setting-btn {
  font-size: 20px;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.15) 0%,
      rgba(var(--el-color-primary-rgb), 0.08) 100%
    );

    :deep(svg) {
      animation: spin 3s linear infinite;
    }
  }
}

.fu-setting {
  font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
  font-size: 18px;
  font-weight: 900;
  color: #DC143C;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(220, 20, 60, 0.1));
  border: 1.5px solid rgba(220, 20, 60, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3), rgba(220, 20, 60, 0.15));
    color: #B22222;
    border-color: rgba(220, 20, 60, 0.5);
    animation: fu-glow 2s ease-in-out infinite;
  }
}

/* 春节主题下的福字设置按钮 - 增强对比度 */
html.theme-spring-festival .fu-setting,
html[data-skin="spring-festival"] .fu-setting {
  color: #FFD700 !important;
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.85)) !important;
  border: 2px solid rgba(255, 215, 0, 0.6) !important;
  text-shadow: 
    0 0 8px rgba(255, 215, 0, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.5) !important;
  box-shadow: 
    0 2px 8px rgba(220, 20, 60, 0.4),
    inset 0 1px 2px rgba(255, 215, 0, 0.3) !important;

  &:hover {
    background: radial-gradient(circle, rgba(220, 20, 60, 0.95), rgba(139, 0, 0, 0.9)) !important;
    color: #FFF !important;
    border-color: rgba(255, 215, 0, 0.9) !important;
    box-shadow: 
      0 4px 16px rgba(255, 215, 0, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
  }
}

/* 春节主题下的搜索按钮 - 与设置按钮一致 */
html[data-skin="spring-festival"] #header-search {
  color: #FFD700 !important;
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.85)) !important;
  border: 2px solid rgba(255, 215, 0, 0.6) !important;
  box-shadow: 
    0 2px 8px rgba(220, 20, 60, 0.4),
    inset 0 1px 2px rgba(255, 215, 0, 0.3) !important;

  svg {
    color: #FFD700 !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
  }

  &:hover {
    background: radial-gradient(circle, rgba(220, 20, 60, 0.95), rgba(139, 0, 0, 0.9)) !important;
    color: #FFF !important;
    border-color: rgba(255, 215, 0, 0.9) !important;
    transform: translateY(-2px) !important;
    box-shadow: 
      0 4px 16px rgba(255, 215, 0, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;

    svg {
      color: #FFF !important;
      filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6)) !important;
    }
  }

  &:active {
    transform: translateY(0) !important;
  }
}

/* 春节主题下的全屏按钮 - 与设置按钮一致 */
html[data-skin="spring-festival"] #full-screen {
  color: #FFD700 !important;
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.85)) !important;
  border: 2px solid rgba(255, 215, 0, 0.6) !important;
  box-shadow: 
    0 2px 8px rgba(220, 20, 60, 0.4),
    inset 0 1px 2px rgba(255, 215, 0, 0.3) !important;

  svg {
    color: #FFD700 !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
  }

  &:hover {
    background: radial-gradient(circle, rgba(220, 20, 60, 0.95), rgba(139, 0, 0, 0.9)) !important;
    color: #FFF !important;
    border-color: rgba(255, 215, 0, 0.9) !important;
    transform: translateY(-2px) !important;
    box-shadow: 
      0 4px 16px rgba(255, 215, 0, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;

    svg {
      color: #FFF !important;
      filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6)) !important;
    }
  }

  &:active {
    transform: translateY(0) !important;
  }
}

@keyframes fu-glow {
  0%, 100% {
    text-shadow: 0 0 8px rgba(220, 20, 60, 0.6), 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  50% {
    text-shadow: 0 0 16px rgba(220, 20, 60, 0.8), 0 0 24px rgba(255, 215, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.2);
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
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 28px;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-fill-color-light) 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* 光泽效果 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }
  }
}

.avatar-container {
  position: relative;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.user-trigger:hover .avatar-img {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  animation: pulse-status 2s infinite;
}

@keyframes pulse-status {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}

.user-role {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.dropdown-arrow-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--el-fill-color) 0%,
    var(--el-fill-color-light) 100%
  );
  margin-left: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-arrow {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  transition: all 0.3s ease;
}

.user-trigger:hover .dropdown-arrow-wrapper {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-8) 0%,
    var(--el-color-primary-light-9) 100%
  );
  box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);

  .dropdown-arrow {
    color: var(--el-color-primary);
  }
}

.user-dropdown:focus-within .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown:focus-within .dropdown-arrow-wrapper {
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

  .dropdown-arrow {
    color: #fff;
  }
}
</style>

<style lang="scss">
// 语言下拉菜单样式（全局）
.lang-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 20px;
    border: none;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 240px;
    backdrop-filter: blur(20px);
  }
}

.lang-menu {
  padding: 0 !important;

  .lang-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
  }

  .lang-item {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding: 24px !important;
    margin: 8px 10px;
    margin-bottom: 8px;
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      &::before {
        opacity: 1;
      }

      .lang-flag {
        transform: scale(1.1);
      }
    }

    &.active {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.12) 0%,
        rgba(var(--el-color-primary-rgb), 0.06) 100%
      );
      border: 1px solid rgba(var(--el-color-primary-rgb), 0.2);

      .lang-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }

      .lang-check {
        animation: check-pop 0.3s ease;
      }
    }

    .lang-item-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .lang-flag {
      font-size: 28px;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .lang-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
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
      font-size: 20px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    }
  }
}

@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

// 用户下拉菜单样式（全局）
.user-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 24px;
    border: none;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.18),
      0 10px 30px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 300px;
    backdrop-filter: blur(20px);
  }
}

.user-menu {
  padding: 0 !important;

  .menu-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 28px 24px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 50%,
      var(--el-color-primary-light-5) 100%
    );
    position: relative;
    overflow: hidden;

    /* 装饰纹理 */
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }

    .header-avatar {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.95);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.25),
        0 0 0 4px rgba(255, 255, 255, 0.1);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .header-name {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header-status {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      &::before {
        content: "";
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        border-radius: 50%;
        box-shadow:
          0 0 0 3px rgba(74, 222, 128, 0.3),
          0 0 12px rgba(74, 222, 128, 0.6);
        animation: pulse-online 2s infinite;
      }
    }
  }

  .menu-body {
    padding: 14px 10px;
  }

  .menu-item {
    display: flex !important;
    align-items: center;
    gap: 16px;
    margin-bottom: 6px;
    padding: 28px !important;
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.06) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      &::before {
        opacity: 1;
      }

      .item-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .item-arrow {
        transform: translateX(6px);
        opacity: 1;
        color: var(--el-color-primary);
      }
    }

    .item-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      position: relative;
    }

    .account-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #fff;
      box-shadow:
        0 6px 16px rgba(59, 130, 246, 0.35),
        0 2px 6px rgba(59, 130, 246, 0.2);
    }

    .cache-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      box-shadow:
        0 6px 16px rgba(245, 158, 11, 0.35),
        0 2px 6px rgba(245, 158, 11, 0.2);
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.3;
    }

    .item-arrow {
      font-size: 20px;
      color: var(--el-text-color-placeholder);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .menu-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
  }

  .logout-item {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px !important;
    margin: 0;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.1) 0%,
        rgba(239, 68, 68, 0.05) 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .logout-icon {
      font-size: 20px;
      transition: transform 0.3s ease;
    }

    &:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
      transform: scale(1.02);

      &::before {
        opacity: 1;
      }

      .logout-icon {
        color: #ef4444;
        transform: translateX(-2px);
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@keyframes pulse-online {
  0%,
  100% {
    box-shadow:
      0 0 0 3px rgba(74, 222, 128, 0.3),
      0 0 12px rgba(74, 222, 128, 0.6);
  }
  50% {
    box-shadow:
      0 0 0 5px rgba(74, 222, 128, 0.15),
      0 0 16px rgba(74, 222, 128, 0.4);
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
