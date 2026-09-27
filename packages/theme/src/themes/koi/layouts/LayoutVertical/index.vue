<template>
  <el-container class="layout-container layout-vertical">
    <el-aside
      class="layout-aside layout-vertical-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : settings.asideMenuCollapseWidth }"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout"></Logo>

      <!-- 折叠为按钮模式（app.yaml menuConfig.collapseToButton，仅垂直布局）：
           折叠后不渲染 mini 菜单，整个菜单区只保留一个展开按钮 -->
      <div v-if="collapseToButtonMode" class="layout-vertical-collapse-panel">
        <el-tooltip content="展开菜单" placement="right" :show-after="200">
          <button
            type="button"
            class="menu-expand-btn"
            aria-label="展开菜单"
            @click="expandMenu"
          >
            <el-icon :size="20"><Menu /></el-icon>
          </button>
        </el-tooltip>
      </div>

      <!-- 滚动在最外层；菜单内层保留右侧内边距，与滚动条分离 -->
      <div v-else class="layout-vertical-menu-scroller">
        <div class="layout-vertical-menu-pad">
          <!-- :unique-opened="true" 子菜单不能同时展开 -->
          <el-menu
            :default-active="activeMenu"
            :collapse="globalStore.isCollapse"
            :collapse-transition="false"
            :uniqueOpened="globalStore.uniqueOpened"
            :router="false"
            :class="[menuAnimate, { 'is-group-nav': groupNav }]"
          >
            <ReAsideSubMenu :menuList="menuList"></ReAsideSubMenu>
          </el-menu>
        </div>
      </div>
      <!-- 底部系统配置入口（不作为菜单；仅纵向布局提供，横向布局不支持） -->
      <NavSettingEntry />
    </el-aside>
    <el-container>
      <el-header v-if="globalStore.isHeaderShown" class="layout-header">
        <Header></Header>
      </el-header>
      <!-- 路由页面 -->
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import settings from "@repo/theme/koi/settings.ts";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import Header from "@repo/theme/koi/layouts/components/Header/index.vue";
import ReAsideSubMenu from "@repo/theme/koi/layouts/components/Menu/ReAsideSubMenu.vue";
import NavSettingEntry from "@repo/theme/koi/layouts/components/Menu/NavSettingEntry.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Menu } from "@element-plus/icons-vue";
import { getConfig, resolveGroupNav } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";

const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

/**
 * 分组导航增强（menuConfig.groupNav，默认开启）：给 el-menu 挂 .is-group-nav，
 * 分组标题改按分区标题排版（加大、加粗、深色），底部显示带文字的「设置」条目。
 */
const groupNav = computed(() => resolveGroupNav());

/**
 * 折叠形态：true 时折叠后不渲染 mini 菜单，整个菜单收缩为一个「展开菜单」按钮。
 * 配置项 menuConfig.collapseToButton（app.yaml / 顶部设置抽屉），仅垂直布局生效。
 */
const collapseToButtonMode = computed(
  () => globalStore.isCollapse && getConfig().menu?.collapseToButton === true,
);

/** 展开菜单（点击收缩按钮 / 后续入口共用） */
function expandMenu() {
  globalStore.setCollapse(false);
}

// 动态绑定左侧菜单animate动画（路由动画关闭时菜单动画同步关闭）
const menuAnimate = computed(() => (!globalStore.transition || globalStore.transition === "none" ? "" : settings.menuAnimate));
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
// const menuHoverCollapse = ref(settings.asideMenuHoverCollapse);
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

/* 折叠为按钮模式：菜单区只保留一个展开按钮 */
.layout-vertical-collapse-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  justify-content: center;
  padding-top: 14px;
}

.menu-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--el-menu-text-color);
  font-family: inherit;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  transition:
    background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }

  &:active {
    transform: scale(0.96);
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
