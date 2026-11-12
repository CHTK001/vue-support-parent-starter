<template>
  <el-container class="layout-container">
    <el-header class="layout-header flex flex-items-center flex-justify-between">
      <div class="layout-mobile-header-brand flex flex-items-center">
        <div v-show="showLogo" class="flex flex-items-center" @click="handleOpenMobileMenu">
          <el-image :src="logoUrl" fit="cover" class="layout-mobile-header-logo-img">
            <template #error>
              <el-icon class="layout-mobile-header-logo-img text-[--el-color-primary]" :size="32">
                <CircleCloseFilled />
              </el-icon>
            </template>
          </el-image>
        </div>
        <div class="layout-mobile-header-menu-group flex flex-items-center">
          <span class="layout-mobile-header-divider" aria-hidden="true" />
          <div
            class="layout-mobile-menu-trigger hover:bg-[--el-header-icon-hover-bg-color] w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
            @click="handleOpenMobileMenu"
          >
            <ReIcon name="koi-align-left" width="19" height="19" />
          </div>
        </div>
      </div>
      <div class="layout-mobile-header-actions flex flex-items-center h-100%">
        <ReDark></ReDark>
        <span class="layout-mobile-header-divider" aria-hidden="true" />
        <ReUser></ReUser>
      </div>
    </el-header>
    <!-- 路由页面 -->
    <Main></Main>
  </el-container>

  <!-- 左侧抽屉菜单 -->
  <el-drawer
    v-model="mobileDrawerVisible"
    class="layout-mobile-drawer"
    direction="ltr"
    size="230"
    :with-header="false"
    :close-on-click-modal="true"
  >
    <div class="mobile-drawer-inner">
      <div class="mobile-drawer-logo">
        <Logo layout="mobile"></Logo>
      </div>
      <div class="mobile-drawer-menu-scroller">
        <div class="mobile-drawer-menu-pad">
          <el-menu
            :default-active="activeMenu"
            :collapse-transition="false"
            :uniqueOpened="globalStore.uniqueOpened"
            :router="false"
            :class="menuAnimate"
          >
            <ReColumnSubMenu :menuList="menuList"></ReColumnSubMenu>
          </el-menu>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import settings from "@repo/theme/koi/settings.ts";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";
import { CircleCloseFilled } from "@element-plus/icons-vue";
import ReUser from "@repo/theme/koi/layouts/components/Header/components/ReUser.vue";
import ReDark from "@repo/theme/koi/layouts/components/Header/components/ReDark.vue";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import ReColumnSubMenu from "@repo/theme/koi/layouts/components/Menu/ReColumnSubMenu.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";

const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

const mobileDrawerVisible = ref(false);
const showLogo = settings.logoShow;

const logoUrl = computed(() => {
  const cfg = getConfig();
  const url = cfg.login?.logoUrl;
  return url ? resolveAssetUrl(url) : fallbackLogoUrl;
});

const handleOpenMobileMenu = () => {
  mobileDrawerVisible.value = true;
};

/** 路由切换后收起抽屉，避免遮挡新页面 */
watch(
  () => route.fullPath,
  () => {
    mobileDrawerVisible.value = false;
  }
);

// 动态绑定左侧菜单animate动画（路由动画关闭时菜单动画同步关闭）
const menuAnimate = computed(() => (!globalStore.transition || globalStore.transition === "none" ? "" : settings.menuAnimate));
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
.mobile-drawer-inner {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding-left: $aside-menu-padding-left;
  background-color: var(--el-menu-bg-color);
}

.mobile-drawer-logo {
  flex-shrink: 0;
  box-sizing: border-box;
}

.mobile-drawer-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.mobile-drawer-menu-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}

.mobile-drawer-inner :deep(.el-menu) {
  height: auto;
  min-height: 0;
  max-height: none;
  border-right: none;
  box-sizing: border-box;
}

/* 若抽屉菜单日后开启 collapse，与纵向布局一致避免窄宽度裁掉右侧留白 */
.mobile-drawer-inner :deep(.el-menu.el-menu--collapse) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.layout-mobile-header-brand {
  gap: 10px;
  min-width: 0;
}

.layout-mobile-header-menu-group {
  gap: 4px;
}

.layout-mobile-header-actions {
  gap: 4px;
}

.layout-mobile-menu-trigger {
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.layout-mobile-header-divider {
  flex-shrink: 0;
  width: 1px;
  height: 18px;
  background-color: var(--el-border-color);
}

.layout-mobile-header-logo-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: block;
}

.layout-container {
  width: 100vw;
  height: 100vh;
  .layout-header {
    height: $aside-header-height;
    overflow: hidden;
    background-color: var(--koi-surface-header);
  }
}
</style>

<!-- 抽屉 teleport 到 body，scoped 无法命中；且 .layout-mobile-drawer 与 .el-drawer 在同一节点，不能用后代选择器 -->
<style lang="scss">
.layout-mobile-drawer.el-drawer {
  --el-drawer-padding-primary: 0px;
}

.layout-mobile-drawer.el-drawer .el-drawer__body {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  margin: 0 !important;
  /* 顶贴边；底部留 6px。左右间距由内部容器控制，避免与 menu-pad 叠加导致不对称 */
  padding: 0 0 6px !important;
  overflow: hidden;
}
</style>

