<template>
  <el-container class="layout-container layout-group">
    <el-aside
      class="layout-group-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? settings.groupMenuWidth : settings.asideMenuCollapseWidth }"
    >
      <Logo :isCollapse="globalStore.isCollapse" layout="group"></Logo>
      <!-- 滚动在最外层；菜单内层保留右侧内边距，与滚动条分离 -->
      <div class="layout-group-menu-scroller">
        <div class="layout-group-menu-pad">
          <!-- 分组导航菜单：菜单顶层 meta.isGroup 项渲染为分组标题 + 组内平铺 items（ReAsideSubMenu） -->
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
      <!-- 底部系统配置入口（不作为菜单） -->
      <NavSettingEntry />
    </el-aside>
    <el-container>
      <el-header v-if="globalStore.isHeaderShown" class="layout-group-header">
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
import { computed, provide } from "vue";
import { useRoute } from "vue-router";
import { resolveGroupNav } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";

/**
 * Group 布局（导航模式第 7 种）—— 分组导航风格
 *
 * 左侧：分组轨（如 工作台/监控/资产/系统 分区，由菜单数据顶层 meta.isGroup 驱动，
 * 组内条目平铺、无子菜单箭头，仅支持 分组→条目 两级；空分组自动隐藏）；支持 isCollapse 图标轨
 * 顶部：56px koi Header（面包屑/搜索/通知/主题/用户）
 * 右侧：路由内容区（Main）
 *
 * 菜单数据源与其他布局一致：authStore.showMenuList（静态菜单 + 动态菜单合并）。
 */
const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
// 向递归菜单组件下发「分组导航」标记：含子项的父节点渲染为分组标题 + 组内平铺（无折叠箭头）
provide("koi-group-menu-mode", true);

/**
 * 分组导航增强（menuConfig.groupNav，默认开启）：给 el-menu 挂 .is-group-nav，
 * 分组标题改按分区标题排版（加大、加粗、深色），底部显示带文字的「设置」条目。
 */
const groupNav = computed(() => resolveGroupNav());

// 动态绑定左侧菜单animate动画（路由动画关闭时菜单动画同步关闭）
const menuAnimate = computed(() => (!globalStore.transition || globalStore.transition === "none" ? "" : settings.menuAnimate));
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
.layout-container.layout-group {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .layout-group-aside {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
    padding-left: $aside-menu-padding-left;
    padding-right: 0;
    background-color: var(--koi-surface-aside);
    border-right: 1px solid var(--el-aside-border-right-color);
    box-sizing: border-box;
    user-select: none;
  }

  .layout-group-header {
    height: $aside-header-height; /* 56px 顶栏 */
    background-color: var(--koi-surface-header);
  }

  .layout-group-aside :deep(.el-menu) {
    height: auto;
    min-height: 0;
    max-height: none;
    border-right: none;
    box-sizing: border-box;
  }

  /* 收缩宽度小于 EP 默认折叠菜单宽度(~64px)时会横向溢出，裁掉 menu-pad 的右侧留白 */
  .layout-group-aside :deep(.el-menu.el-menu--collapse) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* 分组标题排版统一由 Menu/ReAsideSubMenu.vue 的全局 .el-menu.is-group-nav 规则负责，
     此处不再覆盖：避免与那条规则特异性打平而依赖源码顺序。 */

  /* ===== 折叠态适配：窄轨只显示图标 ===== */
  /* 折叠态分组之间：细分隔线 + 间距替代标题做分区（颜色用变量，适配深色） */
  .layout-group-aside :deep(.el-menu--collapse .el-menu-item-group + .el-menu-item-group) {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  /* 折叠态图标项在窄轨内居中 */
  .layout-group-aside :deep(.el-menu--collapse .el-menu-item) {
    margin-left: auto;
    margin-right: auto;
  }
}

.layout-group-menu-scroller {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -ms-scroll-chaining: none;
}

.layout-group-menu-pad {
  padding-right: $aside-menu-padding-right;
  box-sizing: border-box;
}
</style>
