<template>
  <el-container class="layout-container layout-vertical">
    <el-aside
      class="layout-aside layout-vertical-aside transition-all"
      :style="{ width: asideWidth, '--koi-header-height': headerHeight }"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout"></Logo>
      <!-- 滚动在最外层；菜单内层保留右侧内边距，与滚动条分离 -->
      <div class="layout-vertical-menu-scroller">
        <div class="layout-vertical-menu-pad">
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
    <el-container>
      <el-header class="layout-header" :style="{ height: headerHeight }">
        <Header></Header>
      </el-header>
      <!-- 路由页面 -->
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import settings from "../../settings.ts";
import { getConfig } from "@repo/config";
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

const cfg = getConfig() || {};
const koiConfig = useKoiConfig();

/**
 * 菜单展开宽度：优先读取运行时配置 menuWidth，否则使用 settings.menuWidth，否则 210px
 */
const expandedWidth = computed(() => {
  const value = koiConfig.cfgNumber("menuWidth", settings.menuWidth ?? 210);
  return typeof value === "number" ? `${value}px` : value;
});

const asideWidth = computed(() =>
  !globalStore.isCollapse ? expandedWidth.value : settings.asideMenuCollapseWidth
);

const headerHeight = computed(() => {
  const value = koiConfig.cfgNumber("headerHeight", settings.headerHeight ?? 56);
  return typeof value === "number" ? `${value}px` : value;
});

/** 顶部 Logo 标题文本：项目标题(可被 app.yaml Title 覆盖) */
const headerTitle = computed(() => koiConfig.cfgString("Title", "vue-support"));

/** Aside 滚动条行为控制 */
const scrollBehavior = computed(() => koiConfig.cfgString("AsideScrollBehavior", "smooth"));

const menuAnimate = ref(settings.menuAnimate);
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
.layout-container.layout-vertical {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .layout-vertical-aside {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
    padding-left: $aside-menu-padding-left;
    padding-right: 0;
    background-color: var(--el-menu-bg-color);
    border-right: 1px solid var(--el-aside-border-right-color);
    box-sizing: border-box;
    user-select: none;
  }

  .layout-header {
    height: $aside-header-height;
    background-color: var(--el-header-bg-color);
  }

  .layout-vertical-aside :deep(.el-menu) {
    height: auto;
    min-height: 0;
    max-height: none;
    border-right: none;
    box-sizing: border-box;
  }

  /* 收缩宽度(如 56px)小于 EP 默认折叠菜单宽度(~64px)时会横向溢出，裁掉 menu-pad 的右侧留白 */
  .layout-vertical-aside :deep(.el-menu.el-menu--collapse) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}

.layout-vertical-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-vertical-menu-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}
</style>
