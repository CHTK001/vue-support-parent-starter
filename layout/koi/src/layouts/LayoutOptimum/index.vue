<template>
  <el-container class="layout-container">
    <el-aside
      class="layout-optimum-aside transition-all"
      :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : '56px' }"
      v-if="currentSubMenuTree.length > 0"
    >
      <Logo :isCollapse="globalStore.isCollapse" :layout="globalStore.layout"></Logo>
      <div class="layout-optimum-menu-scroller">
        <div class="layout-optimum-menu-pad">
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
        <div class="koi-header">
          <div class="header-left">
            <Collapse></Collapse>
            <div class="layout-row m-l-6px">
              <div
                v-for="item in topLevelMenus"
                :key="item.meta.menuId"
                class="left-row line-clamp-1"
                :class="{ 'is-active': activeTopMenuId == item.meta?.menuId }"
                @click="handleTopMenuClick(item)"
              >
                <el-tooltip :content="item.meta?.title" :show-after="1500" placement="right">
                  <div class="left-row-tooltip-trigger">
                    <KoiGlobalIcon v-if="item.meta.icon" :name="item.meta.icon" size="18"></KoiGlobalIcon>
                    <span class="title" v-text="item.meta?.title"></span>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </el-header>
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Logo from "../../components/Logo/index.vue";
import Collapse from "../../components/Header/components/Collapse.vue";
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
  for (const r of routes) {
    if (r.path == String(activeMenu)) return r;
    if (r.children?.length && containsActiveMenu(r, activeMenu)) return r;
  }
  return null;
};

const getSubMenuTree = (topMenuId: number | string) => {
  const topMenu = topLevelMenus.value.find((item: any) => item.meta.menuId === topMenuId);
  return topMenu?.children || [];
};

const handleTopMenuClick = (item: any) => {
  if (item.meta?.linkUrl) {
    if (/^https?:\/\//.test(item.meta?.linkUrl)) return window.open(item.meta.linkUrl, "_blank");
    return;
  }
  if (!item?.children) {
    activeTopMenuId.value = item.meta?.menuId;
    currentSubMenuTree.value = [];
    router.push({ path: item.path || "/home" });
    return;
  }
  activeTopMenuId.value = item.meta?.menuId;
  currentSubMenuTree.value = getSubMenuTree(item.meta?.menuId);
};

const initMenu = () => {
  if (!topLevelMenus.value.length) return;
  activeTopMenuId.value = topLevelMenus.value[0];
};

onMounted(() => initMenu());
watch(() => route, () => initMenu(), { deep: true });
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.koi-header {
  position: relative; display: flex; justify-content: space-between; height: $aside-header-height;
  .header-left { display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; z-index: 1; }
}

.layout-row {
  display: flex; height: 100%; flex: 1; min-width: 0; user-select: none;
  background-color: var(--el-header-bg-color); padding: 0 4px; box-sizing: border-box;
}

.left-row {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  flex-shrink: 0; min-width: 68px; max-width: 112px; height: 100%;
  padding: 4px 10px; cursor: pointer;
  border: 1px solid transparent; border-radius: 8px;
  color: var(--el-header-optimum-color); transition: color 0.18s ease, background-color 0.18s ease;

  .left-row-tooltip-trigger { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 2px; }
  .title { margin-top: 4px; font-size: 12px; font-weight: $aside-menu-font-weight; line-height: 14px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

  &:hover { color: var(--el-header-optimum-hover-color); background: var(--el-header-optimum-hover-bg-color); }
  &.is-active { color: var(--el-header-optimum-active-color); background: var(--el-header-optimum-active-bg-color); }
}

.layout-container {
  width: 100vw; height: 100vh; overflow: hidden;
  .layout-optimum-aside {
    display: flex; flex-direction: column; height: 100vh; min-height: 0;
    padding-left: $column-menu-padding-left; padding-right: 0;
    background-color: var(--el-menu-bg-color);
    border-right: 1px solid var(--el-aside-border-right-color);
    box-sizing: border-box; user-select: none;
  }
  .layout-optimum-aside :deep(.el-menu) { height: auto; min-height: 0; max-height: none; border-right: none; box-sizing: border-box; }
  .layout-optimum-aside :deep(.el-menu.el-menu--collapse) { width: 100%; max-width: 100%; box-sizing: border-box; }
  .layout-header { height: $aside-header-height; background-color: var(--el-header-bg-color); }
}

.layout-optimum-menu-scroller {
  flex: 1; min-height: 0; width: 100%;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
}
.layout-optimum-menu-pad { padding-right: $column-menu-padding-right; box-sizing: border-box; }
</style>
