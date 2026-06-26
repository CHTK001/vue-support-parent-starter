<template>
  <el-container class="layout-container layout-vertical">
    <el-aside class="layout-aside layout-vertical-aside" :style="{ width: !globalStore.isCollapse ? globalStore.menuWidth + 'px' : '56px' }">
      <Logo :isCollapse="globalStore.isCollapse" layout="vertical" />
      <div class="layout-vertical-menu-scroller">
        <div class="layout-vertical-menu-pad">
          <el-menu :default-active="activeMenu" :collapse="globalStore.isCollapse" :collapse-transition="false" :unique-opened="globalStore.uniqueOpened" :router="false">
            <AsideSubMenu :menuList="menuList" />
          </el-menu>
        </div>
      </div>
    </el-aside>
    <el-container>
      <el-header class="layout-header"><Header /></el-header>
      <Main />
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
import { useKoiGlobalStore } from "../../stores/global";
import { useKoiAuthStore } from "../../stores/auth";

const route = useRoute();
const globalStore = useKoiGlobalStore();
const authStore = useKoiAuthStore();

const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path);
</script>

<style scoped lang="scss">
.layout-container.layout-vertical {
  width: 100vw; height: 100vh; overflow: hidden;
  .layout-vertical-aside {
    display: flex; flex-direction: column; height: 100vh; min-height: 0;
    padding-left: 4px; padding-right: 0;
    background-color: var(--el-menu-bg-color);
    border-right: 1px solid var(--el-border-color-light);
    box-sizing: border-box; user-select: none;
  }
  .layout-header { height: 48px; background-color: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); }
  .layout-vertical-menu-scroller { flex: 1; min-height: 0; width: 100%; overflow-x: hidden; overflow-y: auto; }
  .layout-vertical-menu-pad { padding-right: 4px; box-sizing: border-box; }
}
</style>