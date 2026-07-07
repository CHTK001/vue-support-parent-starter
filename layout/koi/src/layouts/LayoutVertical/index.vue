<template>
  <el-container class="layout-container layout-vertical">
    <el-aside
      class="layout-aside layout-vertical-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : '56px' }"
    >
      <div class="koi-logo" :class="{ 'is-collapse': globalStore.isCollapse }">
        <img src="/logo.svg" class="koi-logo__img" alt="logo" />
        <span v-if="!globalStore.isCollapse" class="koi-logo__title">{{ appTitle }}</span>
      </div>
      <div class="layout-vertical-menu-scroller">
        <div class="layout-vertical-menu-pad">
          <el-menu
            :default-active="activeMenu"
            :collapse="globalStore.isCollapse"
            :collapse-transition="false"
            :uniqueOpened="globalStore.uniqueOpened"
            :router="false"
          >
            <AsideSubMenu :menuList="menuList" />
          </el-menu>
        </div>
      </div>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <Header :showBreadCrumb="globalStore.showBreadcrumb"></Header>
      </el-header>
      <Tabs v-if="globalStore.showTabs" />
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in" appear>
            <keep-alive :max="16">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";
import { useKoiGlobalStore } from "../../stores/global";
import { getConfig } from "@repo/config/src/config";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import Header from "../../components/Header/index.vue";
import Tabs from "../../components/Tabs/index.vue";

const route = useRoute();
const authStore = useKoiAuthStore();
const globalStore = useKoiGlobalStore();

const appTitle = getConfig().Title || "Koi Admin";
const menuList = computed(() => authStore.showMenuList || []);
const activeMenu = computed(() => (route.meta.activeMenu as string) || route.path);

onMounted(() => {
  if (globalStore.isDark) {
    document.documentElement.classList.add("dark");
  }
});
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.layout-container.layout-vertical {
  width: 100vw; height: 100vh; overflow: hidden;

  .layout-vertical-aside {
    display: flex; flex-direction: column;
    height: 100vh; min-height: 0;
    background-color: var(--el-menu-bg-color);
    border-right: 1px solid var(--el-border-color-light);
    box-sizing: border-box; user-select: none;
  }

  .layout-header {
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .layout-vertical-aside :deep(.el-menu) {
    height: auto; min-height: 0; max-height: none;
    border-right: none; box-sizing: border-box;
  }

  .layout-vertical-aside :deep(.el-menu.el-menu--collapse) {
    width: 100%; max-width: 100%; box-sizing: border-box;
  }
}

.layout-container.layout-vertical > .el-container {
  width: 100%;
  min-width: 0;
}

.koi-logo {
  display: flex; align-items: center; gap: 8px;
  height: $aside-header-height; padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-light);
  overflow: hidden; white-space: nowrap;
  background: var(--el-menu-bg-color);

  &.is-collapse {
    justify-content: center; padding: 0;
    .koi-logo__title { display: none; }
  }

  &__img {
    width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
    object-fit: cover;
  }

  &__title {
    font-size: 15px; font-weight: 700;
    color: var(--el-text-color-primary);
    overflow: hidden; text-overflow: ellipsis;
  }
}

.header-box { display: flex; align-items: center; height: 100%; }

.layout-vertical-menu-scroller {
  flex: 1; min-height: 0; width: 100%;
  overflow-x: hidden; overflow-y: auto;
  overscroll-behavior: contain;
}

.layout-vertical-menu-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}

.main-content {
  overflow-x: hidden; padding: 0; margin: 0;
  background-color: #FAFBFC;
  .dark & { background-color: #000; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
