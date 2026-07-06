<template>
  <el-container class="layout-container">
    <div class="layout-column" :class="{ 'is-collapse': isFirstColumnCollapse }" :style="{ width: isFirstColumnCollapse ? '64px' : '80px' }">
      <el-scrollbar class="column-scrollbar">
        <el-tooltip
          v-for="(item, index) in topLevelMenus"
          :key="item.meta?.menuId || index"
          :content="item.meta?.title"
          :show-after="isFirstColumnCollapse ? 0 : 1500"
          placement="right"
        >
          <div
            class="left-column"
            :class="{ 'is-active': activeTopMenuId == item.meta?.menuId }"
            @click="handleTopMenuClick(item)"
          >
            <KoiGlobalIcon v-if="item.meta?.icon" :name="item.meta?.icon" size="18"></KoiGlobalIcon>
            <span v-if="!isFirstColumnCollapse" class="title line-clamp-2">{{ item.meta?.title }}</span>
          </div>
        </el-tooltip>
      </el-scrollbar>
    </div>
    <el-aside
      class="layout-aside layout-columns-second-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : '56px' }"
      v-if="currentSubMenuTree.length > 0"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout"></Logo>
      <div class="layout-columns-second-menu-scroller">
        <div class="layout-columns-second-menu-pad">
          <el-menu
            :default-active="activeMenu"
            :collapse="globalStore.isCollapse"
            :collapse-transition="false"
            :uniqueOpened="globalStore.uniqueOpened"
            :router="false"
          >
            <AsideSubMenu :menuList="currentSubMenuTree"></AsideSubMenu>
          </el-menu>
        </div>
      </div>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <Header></Header>
      </el-header>
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Logo from "../../components/Logo/index.vue";
import Header from "../../components/Header/index.vue";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import Main from "../../components/Main/index.vue";
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";
import { useKoiGlobalStore } from "../../stores/global";

const route = useRoute();
const router = useRouter();
const authStore = useKoiAuthStore();
const globalStore = useKoiGlobalStore();

const isFirstColumnCollapse = computed(() => globalStore.isColumnFirstCollapse);
const topLevelMenus = computed(() => authStore.showMenuList.filter((item: any) => item.meta?.isVisible == "1"));

const activeTopMenuId = ref<any>();
const currentSubMenuTree = ref<any[]>([]);
const activeMenu = computed(() => (route.meta?.activeMenu ? route.meta?.activeMenu : route.path) as string);

const containsActiveMenu = (menu: any, activeMenu: string): boolean => {
  if (menu.path == String(activeMenu)) return true;
  if (menu.children?.length) {
    for (const child of menu.children) {
      if (containsActiveMenu(child, activeMenu)) return true;
    }
  }
  return false;
};

const findMenuByActiveMenu = (routes: any[], activeMenu: any) => {
  for (const route of routes) {
    if (route.path == String(activeMenu)) return route;
    if (route.children?.length && containsActiveMenu(route, activeMenu)) return route;
  }
  return null;
};

const getSubMenuTree = (topMenuId: number | string) => {
  const topMenu = topLevelMenus.value.find((item: any) => item.meta.menuId === topMenuId);
  return topMenu?.children || [];
};

const handleTopMenuClick = (route: any) => {
  if (route.meta?.linkUrl) {
    if (/^https?:\/\//.test(route.meta?.linkUrl)) return window.open(route.meta.linkUrl, "_blank");
    return;
  }
  if (!route?.children?.length) {
    activeTopMenuId.value = route.meta?.menuId;
    currentSubMenuTree.value = [];
    router.push({ path: route.path || "/home" });
    return;
  }
  activeTopMenuId.value = route.meta?.menuId;
  currentSubMenuTree.value = getSubMenuTree(route.meta?.menuId);
};

const toggleFirstColumn = () => globalStore.setColumnFirstCollapse(!globalStore.isColumnFirstCollapse);

const initMenu = () => {
  if (!topLevelMenus.value.length) return;
  activeTopMenuId.value = topLevelMenus.value[0]?.meta?.menuId;
  currentSubMenuTree.value = getSubMenuTree(activeTopMenuId.value);
};

onMounted(() => initMenu());
watch(() => route, () => initMenu(), { deep: true });
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.layout-column {
  display: flex; flex-direction: column; height: 100%; flex-shrink: 0;
  transition: width 0.25s ease; user-select: none;
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-aside-border-right-color);
  position: relative; padding-bottom: 48px; box-sizing: border-box;

  .column-scrollbar { flex: 1; min-height: 0; }

  :deep(.el-scrollbar__bar.is-vertical) { width: 4px; right: 2px; }
  :deep(.el-scrollbar__bar.is-vertical .el-scrollbar__thumb) { background: color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent); border-radius: 999px; }

  .left-column {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: auto; min-height: 56px; margin: 4px 6px; padding: 4px 6px;
    color: var(--el-menu-text-color); cursor: pointer;
    border-radius: 8px; border: 1px solid transparent; transition: all 0.2s ease;
    &:hover { color: var(--el-menu-hover-text-color); background: var(--el-menu-hover-bg-color); }
    &.is-active { color: var(--el-menu-active-text-color); background: var(--el-menu-active-bg-color); }
    .title { margin-top: 6px; font-size: 12px; font-weight: $aside-menu-font-weight; line-height: 14px; text-align: center; }
  }
  &.is-collapse .left-column { min-height: 48px; padding: 4px 0; }
}

.layout-container {
  width: 100vw; height: 100vh; overflow: hidden;

  .layout-columns-second-aside {
    display: flex; flex-direction: column; height: 100vh; min-height: 0;
    padding-left: $column-menu-padding-left; padding-right: 0;
    background-color: var(--el-menu-bg-color);
    border-right: 1px solid var(--el-aside-border-right-color);
    box-sizing: border-box; user-select: none;
  }

  .layout-columns-second-aside :deep(.el-menu) { height: auto; min-height: 0; max-height: none; border-right: none; box-sizing: border-box; }
  .layout-columns-second-aside :deep(.el-menu.el-menu--collapse) { width: 100%; max-width: 100%; box-sizing: border-box; }
  .layout-header { height: $aside-header-height; background-color: var(--el-header-bg-color); }
}

.layout-columns-second-menu-scroller {
  flex: 1; min-height: 0; width: 100%;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
}

.layout-columns-second-menu-pad { padding-right: $column-menu-padding-right; box-sizing: border-box; }
</style>
