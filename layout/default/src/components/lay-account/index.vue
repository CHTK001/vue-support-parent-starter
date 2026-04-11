<script setup lang="ts">
import { ScAvatar } from "@repo/components/ScAvatar";
import { IconifyIconOffline, IconifyIconOnline } from "@repo/components/ReIcon";

import { getMine, useUserStore } from "@repo/core";
import { deviceDetection, useGlobal } from "@pureadmin/utils";
import { computed, onBeforeMount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";
import { useDataThemeChange } from "../../hooks/useDataThemeChange";

import AccountManagement from "./components/AccountManagement.vue";
import Profile from "./components/Profile.vue";
import ThirdParty from "./components/thirdParty.vue";
import SecurityLog from "./components/SecurityLog.vue";
import Password from "./components/password.vue";
import Totp from "./components/Totp.vue";
import UserAgreement from "./components/UserAgreement.vue";
import HelpFeedback from "./components/HelpFeedback.vue";

import leftLine from "@iconify-icons/ri/arrow-left-s-line";
import UnLock from "@iconify-icons/ri/lock-unlock-line";
import Lock from "@iconify-icons/ri/lock-2-fill";
import AccountManagementIcon from "@iconify-icons/ri/profile-line";
import ProfileIcon from "@iconify-icons/ri/user-3-line";
import SecurityLogIcon from "@iconify-icons/ri/window-line";

defineOptions({
  name: "AccountSettings",
});

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const isMobile = deviceDetection();
const isOpen = ref(!isMobile);
const { $storage } = useGlobal<GlobalPropertiesApi>();

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

const userInfo = ref<Record<string, any>>({
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
      { key: "profile", label: t("buttons.profile") || "个人信息", icon: ProfileIcon, component: Profile },
      { key: "AccountManagement", label: t("buttons.AccountManagement") || "账号管理", icon: AccountManagementIcon, component: AccountManagement },
      { key: "bind", label: t("buttons.thirdparty") || "三方管理", icon: UnLock, component: ThirdParty },
    ],
  },
  {
    name: t("buttons.dataManage") || "数据管理",
    panel: [
      { key: "securityLog", label: t("buttons.securityLog") || "安全日志", icon: SecurityLogIcon, component: SecurityLog },
    ],
  },
  {
    name: t("buttons.security") || "安全管理",
    panel: [
      { key: "password", label: t("buttons.password") || "密码管理", icon: Lock, component: Password },
      { key: "totp", label: t("buttons.totp") || "双因素认证", icon: Lock, component: Totp },
    ],
  },
  {
    name: t("buttons.support") || "服务支持",
    panel: [
      { key: "agreement", label: t("buttons.userAgreement") || "用户协议", icon: UnLock, component: UserAgreement },
      { key: "helpFeedback", label: t("buttons.helpFeedback") || "帮助与反馈", icon: SecurityLogIcon, component: HelpFeedback },
    ],
  },
];

const witchPane = ref("profile");
const paneKeys = computed(() =>
  groups.flatMap((group) => group.panel.map((item) => item.key)),
);

const syncPaneFromRoute = () => {
  const pane = typeof route.query.pane === "string" ? route.query.pane : "";
  witchPane.value = paneKeys.value.includes(pane) ? pane : "profile";
};

const switchPane = (key: string) => {
  witchPane.value = key;
  router.replace({
    name: "AccountSettings",
    query: {
      ...route.query,
      pane: key,
    },
  });
  if (isMobile) {
    isOpen.value = false;
  }
};

getMine().then((res) => {
  userInfo.value = res.data;
  useUserStore().upgrade(userInfo.value as any);
});

const onUpdated = (data) => {
  userInfo.value = data;
  useUserStore().upgrade(userInfo.value as any);
};

const findComponent = () => {
  return groups
    .find((g) => g.panel.some((i) => i.key === witchPane.value))
    ?.panel.find((i) => i.key === witchPane.value)?.component;
};

watch(
  () => route.query.pane,
  () => syncPaneFromRoute(),
  { immediate: true },
);
</script>

<template>
  <div class="account-page">
    <div class="account-layout">
      <!-- 左侧边栏 -->
      <aside class="sidebar" v-if="isOpen" :width="isMobile ? '240px' : '260px'">
        <div class="sidebar-header">
          <button class="back-btn" @click="router.go(-1)">
            <IconifyIconOffline :icon="leftLine" />
            <span>{{ $t("buttons.back") }}</span>
          </button>
        </div>

        <div class="user-card">
          <div class="avatar-wrap">
            <ScAvatar :size="60" :src="userInfo.avatar" />
            <span class="online-dot"></span>
          </div>
          <div class="info">
            <h3 class="nickname">{{ userInfo.sysUserNickname }}</h3>
            <p class="username">@{{ userInfo.sysUserUsername }}</p>
          </div>
        </div>

        <nav class="nav">
          <div v-for="group in groups" :key="group.name" class="nav-group">
            <h4 class="group-title">{{ group.name }}</h4>
            <ul>
              <li
                v-for="item in group.panel"
                :key="item.key"
                :class="{ active: witchPane === item.key }"
                @click="switchPane(item.key)"
              >
                <IconifyIconOffline :icon="item.icon" class="nav-icon" />
                <span class="nav-text">{{ item.label }}</span>
                <IconifyIconOnline icon="ri:arrow-right-s-line" class="arrow" />
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- 右侧主内容 -->
      <main class="main">
        <LaySidebarTopCollapse
          v-if="isMobile"
          class="mobile-bar"
          :is-active="isOpen"
          @toggle-click="isOpen = !isOpen"
        />
        <div class="content-box">
          <component
            :is="findComponent()"
            :userInfo="userInfo"
            @updated:user="onUpdated"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.account-page {
  width: 100%;
  height: 100vh;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

.account-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧边栏 */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  height: 100%;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.user-card {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.online-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid #fff;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.username {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

/* 导航 */
.nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.nav-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 8px 12px;
  margin: 0;
}

.nav li {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 4px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}

.nav li.active {
  background: var(--el-color-primary);
  color: #fff;
}

.nav-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.arrow {
  margin-left: auto;
  opacity: 0;
}

.nav li.active .arrow {
  opacity: 1;
}

/* 右侧内容 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.mobile-bar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.content-box {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: var(--el-bg-color);
}

/* 移动端 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 999;
    height: 100%;
  }
  .content-box {
    padding: 20px;
  }
}
</style>
