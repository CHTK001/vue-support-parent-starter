<script setup lang="ts">
import { getMine, useUserStore } from "@repo/core";
import { ReText } from "@repo/components/ReText";
import { LaySidebarTopCollapse, useDataThemeChange } from "@layout/default";
import { deviceDetection, useGlobal } from "@pureadmin/utils";
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AccountManagement from "./components/AccountManagement.vue";
import Profile from "./components/Profile.vue";
import ThirdParty from "./components/thirdParty.vue";
import SecurityLog from "./components/SecurityLog.vue";
import Password from "./components/password.vue";
import { getConfig } from "@repo/config";
import leftLine from "@iconify-icons/ri/arrow-left-s-line";
import UnLock from "@iconify-icons/ri/lock-unlock-line";
import Lock from "@iconify-icons/ri/lock-2-fill";
import AccountManagementIcon from "@iconify-icons/ri/profile-line";
import ProfileIcon from "@iconify-icons/ri/user-3-line";
import SecurityLogIcon from "@iconify-icons/ri/window-line";
import Totp from "./components/Totp.vue";

defineOptions({
  name: "AccountSettings",
});

const { t } = useI18n();
const router = useRouter();
const isOpen = ref(!deviceDetection());
const { $storage } = useGlobal<GlobalPropertiesApi>();
onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

const userInfo: any = ref({
  sysUserId: 0,
  sysUserUsername: "",
  sysUserNickname: "",
  sysUserPhone: "",
  sysUserEmail: "",
  avatar: "",
  roles: [],
  perms: [],
});

interface Group {
  name: string;
  panel: GroupItem[];
}

interface GroupItem {
  key: string;
  label: string;
  icon: any;
  component: any;
}

const groups: Group[] = [
  {
    name: t("buttons.base") || "基本信息",
    panel: [
      {
        key: "profile",
        label: t("buttons.profile") || "个人信息",
        icon: ProfileIcon,
        component: Profile,
      },
      {
        key: "AccountManagement",
        label: t("buttons.AccountManagement") || "账号管理",
        icon: AccountManagementIcon,
        component: AccountManagement,
      },
      {
        key: "bind",
        label: t("buttons.thirdparty") || "三方管理",
        icon: UnLock,
        component: ThirdParty,
      },
      // {
      //   key: "pushSettings",
      //   label: t("buttons.pushSettings") || "通知设置",
      //   icon: Bell,
      //   component: PushSettings
      // }
    ],
  },
  {
    name: t("buttons.dataManage") || "数据管理",
    panel: [
      {
        key: "securityLog",
        label: t("buttons.securityLog") || "安全日志",
        icon: SecurityLogIcon,
        component: SecurityLog,
      },
    ],
  },
  {
    name: t("buttons.security") || "安全管理",
    panel: [
      {
        key: "password",
        label: t("buttons.password") || "密码管理",
        icon: Lock,
        component: Password,
      },
    ],
  },
];

groups[2].panel.push({
  key: "totp",
  label: t("buttons.totp") || "双因素认证",
  icon: Lock,
  component: Totp,
});
const witchPane = ref("profile");

getMine().then((res) => {
  userInfo.value = res.data;
  useUserStore().upgrade(userInfo.value);
});
const onUpdated = (data) => {
  userInfo.value = data;
  useUserStore().upgrade(userInfo.value);
};

const findComponent = () => {
  return groups
    .find((item) => item.panel.some((i) => i.key === witchPane.value))
    ?.panel.find((item) => item.key === witchPane.value)?.component;
};
</script>

<template>
  <div class="account-page">
    <el-container class="account-container">
      <!-- 侧边导航 -->
      <el-aside
        v-if="isOpen"
        class="account-sidebar"
        :width="deviceDetection() ? '200px' : '280px'"
      >
        <!-- 返回按钮 -->
        <div class="sidebar-header">
          <button class="back-btn" @click="router.go(-1)">
            <IconifyIconOffline :icon="leftLine" class="back-icon" />
            <span>{{ $t("buttons.back") }}</span>
          </button>
        </div>

        <!-- 用户信息卡片 -->
        <div class="user-card">
          <div class="user-avatar-wrapper">
            <ScAvatar :size="64" :src="userInfo?.avatar" class="user-avatar" />
            <span class="online-badge"></span>
          </div>
          <div class="user-details">
            <h3 class="user-nickname">{{ userInfo?.sysUserNickname }}</h3>
            <p class="user-username">@{{ userInfo?.sysUserUsername }}</p>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="nav-menu">
          <div v-for="group in groups" :key="group.name" class="nav-group">
            <h4 class="group-title">{{ group.name }}</h4>
            <ul class="group-items">
              <li
                v-for="item in group.panel"
                :key="item.key"
                :class="['nav-item', { active: witchPane === item.key }]"
                @click="
                  () => {
                    witchPane = item.key;
                    if (deviceDetection()) {
                      isOpen = !isOpen;
                    }
                  }
                "
              >
                <div class="item-icon">
                  <IconifyIconOffline :icon="item.icon" />
                </div>
                <span class="item-label">{{ item.label }}</span>
                <IconifyIconOnline
                  v-if="witchPane === item.key"
                  icon="ri:arrow-right-s-line"
                  class="item-arrow"
                />
              </li>
            </ul>
          </div>
        </nav>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="account-main">
        <LaySidebarTopCollapse
          v-if="deviceDetection()"
          class="mobile-toggle"
          :is-active="isOpen"
          @toggleClick="isOpen = !isOpen"
        />
        <div class="main-content">
          <component
            :is="findComponent()"
            :userInfo="userInfo"
            class="content-component"
            @updated:user="onUpdated"
          />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.account-page {
  height: 100vh;
  background: linear-gradient(
    135deg,
    var(--el-bg-color-page) 0%,
    var(--el-fill-color-lighter) 100%
  );
  position: relative;
  overflow: hidden;

  // 背景装饰
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 120%;
    background: radial-gradient(
      circle,
      rgba(var(--el-color-primary-rgb), 0.03) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
}

.account-container {
  height: 100%;
  position: relative;
  z-index: 1;
}

// 侧边栏样式
.account-sidebar {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-light) 0%,
    var(--el-fill-color-lighter) 100%
  );
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  border: 1px solid transparent;

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-color-primary-light-8) 100%
    );
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    .back-icon {
      transform: translateX(-4px);
    }
  }

  .back-icon {
    font-size: 18px;
    transition: transform 0.3s ease;
  }
}

// 用户卡片样式
.user-card {
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    180deg,
    var(--el-color-primary-light-9) 0%,
    transparent 100%
  );
  position: relative;

  // 装饰元素
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--el-color-primary-light-5),
      transparent
    );
  }
}

.user-avatar-wrapper {
  position: relative;
  margin-bottom: 16px;

  .user-avatar {
    border: 4px solid var(--el-bg-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }

  .online-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 16px;
    height: 16px;
    background: #22c55e;
    border: 3px solid var(--el-bg-color);
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
    animation: onlinePulse 2s ease-in-out infinite;
  }

  @keyframes onlinePulse {
    0%,
    100% {
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
    }
    50% {
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
    }
  }
}

.user-details {
  .user-nickname {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 4px 0;
  }

  .user-username {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

// 导航菜单样式
.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.nav-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
  margin: 0;
}

.group-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin: 6px 0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--el-text-color-regular);
  position: relative;
  overflow: hidden;

  // 左侧装饰条
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(
      180deg,
      var(--el-color-primary),
      var(--el-color-primary-light-3)
    );
    border-radius: 0 3px 3px 0;
    transition: height 0.3s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color-lighter) 100%
    );
    color: var(--el-text-color-primary);
    transform: translateX(4px);

    &::before {
      height: 60%;
    }

    .item-icon {
      transform: scale(1.1) rotate(5deg);
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9),
        var(--el-color-primary-light-8)
      );
    }
  }

  &.active {
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    color: #fff;
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
    transform: translateX(6px);

    &::before {
      height: 80%;
      background: rgba(255, 255, 255, 0.3);
    }

    .item-icon {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .item-arrow {
      opacity: 1;
    }
  }

  .item-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--el-fill-color-light);
    font-size: 18px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .item-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }

  .item-arrow {
    font-size: 18px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

// 主内容区样式
.account-main {
  background: var(--el-bg-color-page);
  padding: 0;
  overflow: hidden;
}

.mobile-toggle {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.main-content {
  height: 100%;
  padding: 40px 60px;
  overflow-y: auto;
  background: var(--el-bg-color);
  border-radius: 24px 0 0 0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 0;
  }
}

.content-component {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  height: auto !important;

  // 移除内容组件的卡片样式，让子组件自己控制
  :deep(h3) {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--el-border-color-lighter);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: var(--el-color-primary);
    }
  }

  :deep(.el-form) {
    .el-form-item {
      margin-bottom: 24px;
    }

    .el-form-item__label {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

// 深色模式适配
html.dark {
  .account-sidebar {
    background: var(--el-bg-color-overlay);
  }

  .user-card {
    background: linear-gradient(
      180deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      transparent 100%
    );
  }

  .user-avatar-wrapper .user-avatar {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .nav-item.active {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
  }
}
</style>
