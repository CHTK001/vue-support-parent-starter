<script setup lang="ts">
import { router } from "@repo/core";
import { useNav } from "../../../hooks/useNav";
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Restore from "@iconify-icons/line-md/backup-restore";

const { t } = useTranslationLang();
const { logout, username, userAvatar, avatarsStyle, clickClearRouter } = useNav();

/**
 * 跳转到账户设置页面
 */
const gotoAccountSetting = () => {
  router.push("/AccountSettings");
};
</script>

<template>
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
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-arrow" />
      </span>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="user-menu">
        <!-- 用户信息头部 -->
        <div class="menu-header">
          <img :src="userAvatar" :style="avatarsStyle" class="header-avatar" />
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
              <span class="item-title">{{ t("buttons.accountSetting") }}</span>
              <span class="item-desc">管理账户信息与偏好设置</span>
            </div>
            <IconifyIconOnline icon="ri:arrow-right-s-line" class="item-arrow" />
          </el-dropdown-item>

          <el-dropdown-item class="menu-item" @click="clickClearRouter">
            <div class="item-icon cache-icon">
              <IconifyIconOffline :icon="Restore" />
            </div>
            <div class="item-content">
              <span class="item-title">{{ t("buttons.pureClearRouter") }}</span>
              <span class="item-desc">清除本地缓存数据</span>
            </div>
            <IconifyIconOnline icon="ri:arrow-right-s-line" class="item-arrow" />
          </el-dropdown-item>
        </div>

        <!-- 退出登录 -->
        <div class="menu-footer">
          <el-dropdown-item class="logout-item" @click="logout">
            <IconifyIconOffline :icon="LogoutCircleRLine" class="logout-icon" />
            <span>{{ t("buttons.pureLoginOut") }}</span>
          </el-dropdown-item>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
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
  background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-1px);

    &::before { left: 100%; }

    .avatar-img {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .dropdown-arrow-wrapper {
      background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
      .dropdown-arrow { color: var(--el-color-primary); }
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
  border-radius: 4px; // 4px 圆角
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease; // 0.2s ease 过渡
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
  0%, 100% { box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }
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
  background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-light) 100%);
  margin-left: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-arrow {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  transition: all 0.3s ease;
}
</style>
