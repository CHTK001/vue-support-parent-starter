<template>
  <el-container class="layout-mobile">
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="260"
      :show-close="false"
      :with-header="false"
      class="layout-mobile-drawer"
    >
      <Logo :isCollapse="false" :layout="globalStore.layout"></Logo>
      <div class="layout-mobile-menu-scroller">
        <el-menu
          :default-active="activeMenu"
          :collapse="false"
          :collapse-transition="false"
          :uniqueOpened="globalStore.uniqueOpened"
          :router="false"
          @select="drawerVisible = false"
        >
          <AsideSubMenu :menuList="menuList"></AsideSubMenu>
        </el-menu>
      </div>
    </el-drawer>
    <el-container>
      <el-header class="layout-mobile-header">
        <div class="layout-mobile-header-left" @click="drawerVisible = true">
          <el-icon :size="20"><Operation /></el-icon>
        </div>
        <Logo :isCollapse="true" :layout="globalStore.layout" class="flex-1 min-w-0"></Logo>
      </el-header>
      <Main></Main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Operation } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
import Logo from "../../components/Logo/index.vue";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import Main from "../../components/Main/index.vue";
import { useKoiAuthStore } from "../../stores/auth";
import { useKoiGlobalStore } from "../../stores/global";

const route = useRoute();
const authStore = useKoiAuthStore();
const globalStore = useKoiGlobalStore();

const drawerVisible = ref(false);
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
.layout-mobile {
  width: 100vw; height: 100vh; overflow: hidden;
}

.layout-mobile-header {
  display: flex; align-items: center; height: 48px; padding: 0 12px;
  background-color: var(--el-header-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.layout-mobile-header-left {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; margin-right: 8px;
  cursor: pointer; border-radius: 6px;
  transition: background-color 0.2s;
  &:hover { background-color: var(--el-fill-color-light); }
}

.layout-mobile-menu-scroller {
  height: calc(100vh - 48px); overflow-y: auto;
}
</style>
