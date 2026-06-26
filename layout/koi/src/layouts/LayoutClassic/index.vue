<template>
  <el-container class="layout-container layout-classic">
    <el-header class="layout-header">
      <div class="classic-header-left">
        <Logo :isCollapse="false" layout="classic" />
      </div>
      <div class="classic-header-center">
        <el-menu :default-active="activeMenu" mode="horizontal" :ellipsis="false" @select="handleMenuSelect">
          <AsideSubMenu :menuList="topMenuList" />
        </el-menu>
      </div>
      <div class="classic-header-right"><Header /></div>
    </el-header>
    <el-container>
      <el-aside v-if="showSidebar" class="classic-aside" width="220px">
        <el-menu :default-active="activeMenu">
          <AsideSubMenu :menuList="sidebarMenuList" />
        </el-menu>
      </el-aside>
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
import { useRoute, useRouter } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";

const route = useRoute(); const router = useRouter();
const authStore = useKoiAuthStore();
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path);
const topMenuList = computed(() => authStore.showMenuList.filter((m: any) => m.menuType === "1"));
const sidebarMenuList = ref<any[]>([]);
const showSidebar = computed(() => sidebarMenuList.value.length > 0);

function handleMenuSelect(index: string) {
  const item = authStore.recursiveMenuList.find((m: any) => m.path === index || m.menuId === index);
  sidebarMenuList.value = item?.children || [];
  if (item?.path) router.push(item.path);
}
</script>

<style scoped lang="scss">
.layout-container.layout-classic { width: 100vw; height: 100vh; }
.layout-header { height: 48px; display: flex; align-items: center; padding: 0 12px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); }
.classic-header-left { display: flex; align-items: center; flex-shrink: 0; }
.classic-header-center { flex: 1; display: flex; align-items: center; overflow: hidden; }
.classic-header-right { flex-shrink: 0; }
.classic-aside { border-right: 1px solid var(--el-border-color-light); }
</style>