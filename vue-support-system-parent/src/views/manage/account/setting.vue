<script setup lang="ts">
import { getMine } from "@/api/user";
import { useRouter } from "vue-router";
import { ref, onBeforeMount } from "vue";
import { ReText } from "@/components/ReText";
import Profile from "./components/Profile.vue";
import Preferences from "./components/Preferences.vue";
import SecurityLog from "./components/SecurityLog.vue";
import { useGlobal, deviceDetection } from "@pureadmin/utils";
import AccountManagement from "./components/AccountManagement.vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import LaySidebarTopCollapse from "@/layout/components/lay-sidebar/components/SidebarTopCollapse.vue";

import leftLine from "@iconify-icons/ri/arrow-left-s-line";
import ProfileIcon from "@iconify-icons/ri/user-3-line";
import PreferencesIcon from "@iconify-icons/ri/settings-3-line";
import SecurityLogIcon from "@iconify-icons/ri/window-line";
import AccountManagementIcon from "@iconify-icons/ri/profile-line";

defineOptions({
  name: "AccountSettings"
});

const router = useRouter();
const isOpen = ref(deviceDetection() ? false : true);
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
  perms: []
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
    name: "基本信息",
    panel: [
      {
        key: "profile",
        label: "个人信息",
        icon: ProfileIcon,
        component: Profile
      }
    ]
  },
  {
    name: "数据管理",
    panel: [
      {
        key: "securityLog",
        label: "安全日志",
        icon: SecurityLogIcon,
        component: SecurityLog
      }
    ]
  }
];
const witchPane = ref("profile");

getMine().then(res => {
  userInfo.value = res.data;
});
const onUpdated = data => {
  userInfo.value = data;
};

const findComponent = () => {
  return groups
    .find(item => item.panel.some(i => i.key === witchPane.value))
    ?.panel.find(item => item.key === witchPane.value)?.component;
};
</script>

<template>
  <el-container class="h-full setting">
    <el-aside
      v-if="isOpen"
      class="pure-account-settings overflow-hidden px-2 dark:!bg-[var(--el-bg-color)] border-r-[1px] border-[var(--pure-border-color)]"
      :width="deviceDetection() ? '180px' : '240px'"
    >
      <el-menu :default-active="witchPane" class="pure-account-settings-menu">
        <el-menu-item
          class="hover:!transition-all hover:!duration-200 hover:!text-base !h-[50px]"
          @click="router.go(-1)"
        >
          <div class="flex items-center">
            <IconifyIconOffline :icon="leftLine" />
            <span class="ml-2">返回</span>
          </div>
        </el-menu-item>
        <div class="flex items-center ml-8 mt-4 mb-4">
          <el-avatar :size="48" :src="userInfo?.avatar" />
          <div class="ml-4 flex flex-col max-w-[130px]">
            <ReText class="font-bold !self-baseline">
              {{ userInfo?.sysUserNickname }}
            </ReText>
            <ReText class="!self-baseline" type="info">
              {{ userInfo?.sysUserUsername }}
            </ReText>
          </div>
        </div>
        <el-menu-item-group
          v-for="group in groups"
          :key="group.name"
          :title="group.name"
        >
          <el-menu-item
            v-for="item in group.panel"
            :key="item.key"
            :index="item.key"
            @click="
              () => {
                witchPane = item.key;
                if (deviceDetection()) {
                  isOpen = !isOpen;
                }
              }
            "
          >
            <div class="flex items-center z-10">
              <el-icon><IconifyIconOffline :icon="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </div>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>
    <el-main>
      <LaySidebarTopCollapse
        v-if="deviceDetection()"
        class="px-0"
        :is-active="isOpen"
        @toggleClick="isOpen = !isOpen"
      />
      <el-card class="h-full">
        <component
          :is="findComponent()"
          class="h-full"
          :class="[!deviceDetection() && 'ml-[120px]']"
          style="height: 90%"
          @updated:user="onUpdated"
        />
      </el-card>
    </el-main>
  </el-container>
</template>

<style lang="scss">
.pure-account-settings {
  background: $menuBg;
}

.pure-account-settings-menu {
  background-color: transparent;
  border: none;

  .el-menu-item {
    height: 48px !important;
    color: $menuText;
    background-color: transparent !important;
    transition: color 0.2s;

    &:hover {
      color: $menuTitleHover !important;
    }

    &.is-active {
      color: #fff !important;

      &:hover {
        color: #fff !important;
      }

      &::before {
        position: absolute;
        inset: 0 8px;
        margin: 4px 0;
        clear: both;
        content: "";
        background: var(--el-color-primary);
        border-radius: 3px;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
body[layout] {
  .el-menu--vertical .is-active {
    color: #fff !important;
    transition: color 0.2s;

    &:hover {
      color: #fff !important;
    }
  }
}
</style>
