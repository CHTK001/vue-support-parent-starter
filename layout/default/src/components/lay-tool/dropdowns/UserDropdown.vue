<script setup lang="ts">
import { router } from "@repo/core";
import { useNav } from "../../../hooks/useNav";
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import LayAvatar from "../../lay-avatar/index.vue";
import ScDropdown from "@repo/components/ScDropdown";
import ScDropdownItem from "@repo/components/ScDropdownItem";
import ScDropdownMenu from "@repo/components/ScDropdownMenu";
import { ScText } from "@repo/components/ScText";

const { t } = useTranslationLang();
const { logout, username, userAvatar, avatarsStyle } = useNav();

/**
 * 跳转到账户设置页面
 */
const gotoAccountSetting = (pane = "profile") => {
  router.push({
    name: "AccountSettings",
    query: {
      pane,
    },
  });
};

</script>

<template>
  <ScDropdown
    trigger="click"
    class="user-dropdown"
    popper-class="user-dropdown-popper"
    placement="bottom-end"
    :popper-options="{
      strategy: 'fixed',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 16,
            altAxis: true,
            tether: false
          }
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
            padding: 16
          }
        },
        {
          name: 'offset',
          options: {
            offset: [0, 8]
          }
        }
      ]
    }"
  >
    <div class="user-trigger">
      <div class="avatar-container">
        <LayAvatar :src="userAvatar" :style="avatarsStyle" class="avatar-img" />
        <span class="status-dot"></span>
      </div>
      <div v-if="username" class="user-info">
        <ScText class="user-name fe-sensitive">{{ username }}</ScText>
        <ScText class="user-role">在线</ScText>
      </div>
      <span class="dropdown-arrow-wrapper">
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-arrow" />
      </span>
    </div>
    <template #dropdown>
      <ScDropdownMenu class="user-menu">
        <!-- 用户信息头部 -->
        <div class="menu-header">
          <LayAvatar
            :src="userAvatar"
            :style="avatarsStyle"
            class="header-avatar"
          />
          <div class="header-info">
            <ScText class="header-name fe-sensitive">{{ username }}</ScText>
            <ScText class="header-status">当前在线</ScText>
          </div>
        </div>

        <!-- 菜单项容器 -->
        <div class="menu-body">
          <ScDropdownItem
            v-menu="['AccountSettings']"
            class="menu-item"
            @click="gotoAccountSetting('profile')"
          >
            <div class="item-icon account-icon">
              <IconifyIconOnline icon="ri:user-settings-line" />
            </div>
            <div class="item-content">
              <ScText class="item-title">{{
                t("buttons.accountSetting")
              }}</ScText>
              <ScText class="item-desc">管理账户信息与偏好设置</ScText>
            </div>
            <IconifyIconOnline
              icon="ri:arrow-right-s-line"
              class="item-arrow"
            />
          </ScDropdownItem>

          <ScDropdownItem
            v-menu="['AccountSettings']"
            class="menu-item"
            @click="gotoAccountSetting('password')"
          >
            <div class="item-icon cache-icon">
              <IconifyIconOnline icon="ri:lock-password-line" />
            </div>
            <div class="item-content">
              <ScText class="item-title">{{ t("buttons.password") }}</ScText>
              <ScText class="item-desc">复用账户中心密码修改链路</ScText>
            </div>
            <IconifyIconOnline
              icon="ri:arrow-right-s-line"
              class="item-arrow"
            />
          </ScDropdownItem>

          <ScDropdownItem
            v-menu="['AccountSettings']"
            class="menu-item"
            @click="gotoAccountSetting('agreement')"
          >
            <div class="item-icon account-icon">
              <IconifyIconOnline icon="ri:file-list-3-line" />
            </div>
            <div class="item-content">
              <ScText class="item-title">{{
                t("buttons.userAgreement")
              }}</ScText>
              <ScText class="item-desc">查看当前账号的使用协议说明</ScText>
            </div>
            <IconifyIconOnline
              icon="ri:arrow-right-s-line"
              class="item-arrow"
            />
          </ScDropdownItem>

          <ScDropdownItem
            v-menu="['AccountSettings']"
            class="menu-item"
            @click="gotoAccountSetting('helpFeedback')"
          >
            <div class="item-icon cache-icon">
              <IconifyIconOnline icon="ri:customer-service-2-line" />
            </div>
            <div class="item-content">
              <ScText class="item-title">{{
                t("buttons.helpFeedback")
              }}</ScText>
              <ScText class="item-desc">统一入口查看帮助、反馈与消息</ScText>
            </div>
            <IconifyIconOnline
              icon="ri:arrow-right-s-line"
              class="item-arrow"
            />
          </ScDropdownItem>
        </div>

        <!-- 退出登录 -->
        <div class="menu-footer">
          <ScDropdownItem class="logout-item" @click="logout">
            <IconifyIconOnline
              icon="ri:logout-circle-r-line"
              class="logout-icon"
            />
            <ScText>{{ t("buttons.pureLoginOut") }}</ScText>
          </ScDropdownItem>
        </div>
      </ScDropdownMenu>
    </template>
  </ScDropdown>
</template>

<style lang="scss" scoped>
// 用户下拉触发器
.user-dropdown {
  margin-left: 0;
  --lay-user-trigger-bg: linear-gradient(
    135deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-fill-color-light) 100%
  );
  --lay-user-trigger-border: var(--el-border-color-lighter);
  --lay-user-trigger-hover-bg: linear-gradient(
    135deg,
    var(--el-fill-color-light) 0%,
    var(--el-fill-color) 100%
  );
  --lay-user-trigger-hover-border: rgba(var(--el-color-primary-rgb), 0.3);
  --lay-user-trigger-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 4px 10px 4px 4px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--lay-user-trigger-bg);
  border: 1px solid var(--lay-user-trigger-border);
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: var(--lay-user-trigger-hover-bg);
    border-color: var(--lay-user-trigger-hover-border);
    box-shadow: var(--lay-user-trigger-shadow);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }

    .avatar-img {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .dropdown-arrow-wrapper {
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
  }
}

html.dark .user-dropdown {
  --lay-user-trigger-bg: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.82) 0%,
    rgba(30, 41, 59, 0.88) 100%
  );
  --lay-user-trigger-border: rgba(148, 163, 184, 0.2);
  --lay-user-trigger-hover-bg: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.18) 0%,
    rgba(15, 23, 42, 0.94) 100%
  );
  --lay-user-trigger-hover-border: rgba(var(--el-color-primary-rgb), 0.3);
  --lay-user-trigger-shadow:
    0 12px 28px rgba(2, 8, 23, 0.35),
    0 4px 12px rgba(var(--el-color-primary-rgb), 0.16);
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
  border-radius: 12px;
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
  line-height: 1.05;
  min-width: 0;
  max-width: 72px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.dropdown-arrow-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
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
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  transition: all 0.3s ease;
}
</style>

<style lang="scss">
.user-dropdown-popper {
  min-width: 320px;
  max-width: min(360px, calc(100vw - 20px));

  .user-menu {
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
    box-shadow:
      0 24px 48px rgba(15, 23, 42, 0.12),
      0 10px 22px rgba(15, 23, 42, 0.06);
  }

  .menu-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 18px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    background:
      radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.14), transparent 44%),
      rgba(255, 255, 255, 0.7);
  }

  .header-avatar {
    flex-shrink: 0;
  }

  .header-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .header-status {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .menu-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid transparent;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.08);
      border-color: rgba(var(--el-color-primary-rgb), 0.16);
      transform: translateX(2px);
    }
  }

  .item-icon {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
    background: rgba(var(--el-color-primary-rgb), 0.12);
    color: var(--el-color-primary);
  }

  .item-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .item-desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    white-space: normal;
  }

  .item-arrow {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
    font-size: 18px;
  }

  .menu-footer {
    padding: 0 12px 12px;
  }

  .logout-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 18px;
    color: var(--el-color-danger);
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.12);
  }

  .logout-icon {
    font-size: 18px;
  }
}

html.dark .user-dropdown-popper {
  .user-menu {
    border-color: rgba(148, 163, 184, 0.18);
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 8, 23, 0.98));
    box-shadow:
      0 28px 60px rgba(2, 8, 23, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.04);
  }

  .menu-header {
    border-color: rgba(148, 163, 184, 0.12);
    background:
      radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.22), transparent 46%),
      rgba(15, 23, 42, 0.78);
  }

  .header-name,
  .item-title {
    color: #f8fafc;
  }

  .header-status,
  .item-desc,
  .item-arrow {
    color: #94a3b8;
  }

  .menu-item {
    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.14);
      border-color: rgba(var(--el-color-primary-rgb), 0.24);
    }
  }

  .item-icon {
    background: rgba(var(--el-color-primary-rgb), 0.16);
    color: #e2e8f0;
  }

  .logout-item {
    background: rgba(127, 29, 29, 0.28);
    border-color: rgba(248, 113, 113, 0.18);
    color: #fecaca;
  }
}
</style>
