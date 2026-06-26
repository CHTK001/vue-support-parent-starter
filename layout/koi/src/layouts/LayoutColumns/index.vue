<template>
  <el-container class="layout-container layout-columns">
    <el-aside class="columns-first-aside" :style="{ width: globalStore.isColumnFirstCollapse ? '56px' : '180px' }">
      <Logo :isCollapse="globalStore.isColumnFirstCollapse" layout="columns" />
      <el-menu :default-active="activeMenu" :collapse="globalStore.isColumnFirstCollapse" :collapse-transition="false" @select="handleFirstMenuSelect">
        <AsideSubMenu :menuList="menuList" />
      </el-menu>
    </el-aside>
    <el-aside v-if="!globalStore.isColumnFirstCollapse" class="columns-second-aside" width="220px">
      <el-menu :default-active="activeMenu" @select="handleSecondMenuSelect">
        <AsideSubMenu :menuList="secondMenuList" />
      </el-menu>
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
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useKoiGlobalStore } from "../../stores/global";
import { useKoiAuthStore } from "../../stores/auth";

const route = useRoute();
const globalStore = useKoiGlobalStore();
const authStore = useKoiAuthStore();
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path);
const menuList = computed(() => authStore.showMenuList);
const secondMenuList = ref<any[]>([]);

function handleFirstMenuSelect(index: string) {
  const item = authStore.recursiveMenuList.find((m: any) => m.path === index || m.menuId === index);
  secondMenuList.value = item?.children || [];
}
function handleSecondMenuSelect(_index: string) {}
</script>

<style scoped lang="scss">
.layout-container.layout-columns { width: 100vw; height: 100vh; }
.columns-first-aside { display: flex; flex-direction: column; border-right: 1px solid var(--el-border-color-light); }
.columns-second-aside { border-right: 1px solid var(--el-border-color-light); }
.layout-header { height: 48px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); }
</style>