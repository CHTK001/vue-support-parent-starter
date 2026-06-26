<template>
  <el-container class="layout-container layout-horizontal">
    <el-header class="layout-header">
      <div class="horizontal-header-left">
        <Logo :isCollapse="false" layout="horizontal" />
      </div>
      <div class="horizontal-header-center">
        <el-menu :default-active="activeMenu" mode="horizontal" :ellipsis="false">
          <AsideSubMenu :menuList="menuList" />
        </el-menu>
      </div>
      <div class="horizontal-header-right"><Header /></div>
    </el-header>
    <Main />
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

const route = useRoute();
const authStore = useKoiAuthStore();
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path);
</script>

<style scoped lang="scss">
.layout-container.layout-horizontal { width: 100vw; height: 100vh; }
.layout-header { height: 48px; display: flex; align-items: center; padding: 0 12px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); }
.horizontal-header-left { display: flex; align-items: center; flex-shrink: 0; }
.horizontal-header-center { flex: 1; display: flex; align-items: center; overflow: hidden; }
.horizontal-header-right { flex-shrink: 0; }
</style>