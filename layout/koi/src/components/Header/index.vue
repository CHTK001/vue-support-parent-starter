<template>
  <div class="header-container">
    <div class="header-left">
      <el-button text @click="toggleCollapse">
        <el-icon :size="18"><Fold v-if="!globalStore.isCollapse" /><Expand v-else /></el-icon>
      </el-button>
    </div>
    <div class="header-center">
      <el-breadcrumb>
        <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">{{ item.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-button text circle @click="toggleDark"><el-icon :size="16"><Moon v-if="!globalStore.isDark" /><Sunny v-else /></el-icon></el-button>
      <el-button text circle @click="toggleFullscreen"><el-icon :size="16"><FullScreen /></el-icon></el-button>
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="user-dropdown">
          <el-avatar :size="28" icon="UserFilled" />
          <span class="user-name">Admin</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useKoiGlobalStore } from "../../stores/global";
import { useKoiAuthStore } from "../../stores/auth";
import { useDark, useToggle, useFullscreen } from "@vueuse/core";

const globalStore = useKoiGlobalStore();
const authStore = useKoiAuthStore();
const router = useRouter();

const isDark = useDark();
const toggleDark = useToggle(isDark);
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

const breadcrumbList = computed(() => {
  const list = authStore.getBreadcrumbList as any[];
  return list.filter((item: any) => item.title);
});

function toggleCollapse() { globalStore.setCollapse(!globalStore.isCollapse); }
function handleCommand(cmd: string) {
  if (cmd === "logout") { router.push("/login"); }
  if (cmd === "profile") { router.push("/system/personage"); }
}
</script>

<style scoped>
.header-container { display: flex; align-items: center; height: 100%; padding: 0 12px; gap: 8px; }
.header-left { display: flex; align-items: center; }
.header-center { flex: 1; overflow: hidden; }
.header-right { display: flex; align-items: center; gap: 4px; }
.user-dropdown { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.user-name { font-size: 13px; color: var(--el-text-color-primary); }
</style>