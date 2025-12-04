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
//@ts-ignore
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
            <el-avatar :size="64" :src="userInfo?.avatar" class="user-avatar" />
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
  background: var(--el-bg-color-page);
}

.account-container {
  height: 100%;
}

// 侧边栏样式
.account-sidebar {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);

    .back-icon {
      transform: translateX(-4px);
    }
  }

  .back-icon {
    font-size: 18px;
    transition: transform 0.2s ease;
  }
}

// 用户卡片样式
.user-card {
  padding: 24px 20px;
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
}

.user-avatar-wrapper {
  position: relative;
  margin-bottom: 12px;

  .user-avatar {
    border: 3px solid var(--el-bg-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .online-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    background: #22c55e;
    border: 3px solid var(--el-bg-color);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
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
  padding: 12px 14px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--el-text-color-regular);

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);

    .item-icon {
      transform: scale(1.1);
    }
  }

  &.active {
    background: var(--el-color-primary);
    color: #fff;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

    .item-icon {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
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
  padding: 24px 32px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.content-component {
  max-width: 800px;
  margin: 0 auto;
  height: auto !important;
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
