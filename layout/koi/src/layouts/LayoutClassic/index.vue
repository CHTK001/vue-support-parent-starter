<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <Logo :layout="globalStore.layout" class="flex-shrink-0"></Logo>
      <Header class="header m-l-8px"></Header>
    </el-header>
    <el-container class="layout-container-aside">
      <el-aside
        class="layout-classic-aside transition-all"
        :style="{ width: asideWidth }"
      >
        <div class="layout-classic-menu-scroller">
          <div class="layout-classic-menu-pad">
            <!-- :unique-opened="true" 子菜单不能同时展开 -->
            <el-menu
              :default-active="activeMenu"
              :collapse="globalStore.isCollapse"
              :collapse-transition="false"
              :uniqueOpened="globalStore.uniqueOpened"
              :router="false"
              :class="menuAnimate"
            >
              <AsideSubMenu :menuList="menuList"></AsideSubMenu>
            </el-menu>
          </div>
        </div>
      </el-aside>
      <el-container class="flex flex-col">
        <!-- 路由页面 -->
        <Main></Main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import settings from "../../settings.ts";
import { useKoiConfig } from "../../utils/useKoiConfig.ts";
import Logo from "../../layouts/components/Logo/index.vue";
import Header from "../../layouts/components/Header/index.vue";
import AsideSubMenu from "../../layouts/components/Menu/AsideSubMenu.vue";
import Main from "../../layouts/components/Main/index.vue";
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import useAuthStore from "../../stores/modules/auth.ts";
import useGlobalStore from "../../stores/modules/global.ts";

const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const koiConfig = useKoiConfig();

/** 菜单展开宽度：menuWidth → settings.menuWidth → 210 */
const expandedWidth = computed(() => {
  const v = koiConfig.cfgNumber("menuWidth", settings.menuWidth ?? 210);
  return typeof v === "number" ? `${v}px` : v;
});
const asideWidth = computed(() =>
  !globalStore.isCollapse ? expandedWidth.value : settings.asideMenuCollapseWidth
);

const menuAnimate = ref(settings.menuAnimate);
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  .layout-container-aside {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    .layout-classic-aside {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      padding-left: $aside-menu-padding-left;
      padding-right: 0;
      background-color: var(--el-menu-bg-color);
      border-right: 1px solid var(--el-aside-border-right-color);
      box-sizing: border-box;
      user-select: none;
    }
  }
  .layout-header {
    display: flex;
    height: $aside-header-height;
    overflow: hidden;
    background-color: var(--el-header-bg-color);
    .header {
      flex-grow: 1; // 占满剩余空间
      overflow: hidden; // 处理溢出内容
      white-space: nowrap; // 防止换行
    }
  }
}

.layout-classic-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-classic-menu-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}

.layout-classic-aside :deep(.el-menu) {
  height: auto;
  min-height: 0;
  max-height: none;
  border-right: none;
  box-sizing: border-box;
}

.layout-classic-aside :deep(.el-menu.el-menu--collapse) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
