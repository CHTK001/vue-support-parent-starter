<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <Logo :layout="globalStore.layout" class="flex-shrink-0"></Logo>
      <Header class="header m-l-8px"></Header>
    </el-header>
    <el-container class="layout-container-aside">
      <el-aside
        class="layout-classic-aside transition-all"
        :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : '56px' }"
      >
        <div class="layout-classic-menu-scroller">
          <div class="layout-classic-menu-pad">
            <el-menu
              :default-active="activeMenu"
              :collapse="globalStore.isCollapse"
              :collapse-transition="false"
              :uniqueOpened="globalStore.uniqueOpened"
              :router="false"
            >
              <AsideSubMenu :menuList="menuList"></AsideSubMenu>
            </el-menu>
          </div>
        </div>
      </el-aside>
      <el-container class="flex flex-col">
        <Main></Main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Logo from "../../components/Logo/index.vue";
import Header from "../../components/Header/index.vue";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import Main from "../../components/Main/index.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";
import { useKoiGlobalStore } from "../../stores/global";

const route = useRoute();
const authStore = useKoiAuthStore();
const globalStore = useKoiGlobalStore();

const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.layout-container {
  display: flex; flex-direction: column; width: 100vw; height: 100vh; overflow: hidden;
  .layout-container-aside {
    flex: 1; min-height: 0; overflow: hidden;
    .layout-classic-aside {
      display: flex; flex-direction: column; height: 100%; min-height: 0;
      padding-left: $aside-menu-padding-left; padding-right: 0;
      background-color: var(--el-menu-bg-color);
      border-right: 1px solid var(--el-aside-border-right-color);
      box-sizing: border-box; user-select: none;
    }
  }
  .layout-header {
    display: flex; height: $aside-header-height; overflow: hidden;
    background-color: var(--el-header-bg-color);
    .header { flex-grow: 1; overflow: hidden; white-space: nowrap; }
  }
}

.layout-classic-menu-scroller {
  flex: 1; min-height: 0; width: 100%;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
}
.layout-classic-menu-pad { padding-right: $aside-menu-padding-right; box-sizing: border-box; }
.layout-classic-aside :deep(.el-menu) { height: auto; min-height: 0; max-height: none; border-right: none; box-sizing: border-box; }
.layout-classic-aside :deep(.el-menu.el-menu--collapse) { width: 100%; max-width: 100%; box-sizing: border-box; }
</style>
