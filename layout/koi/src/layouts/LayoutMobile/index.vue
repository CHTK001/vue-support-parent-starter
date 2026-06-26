<template>
  <el-container class="layout-container layout-mobile">
    <el-header class="layout-mobile-header">
      <el-button text @click="showDrawer = !showDrawer">
        <el-icon><Menu /></el-icon>
      </el-button>
      <span class="mobile-title">KOI-UI</span>
    </el-header>
    <Main />
    <el-drawer v-model="showDrawer" size="70%" direction="ltr" :with-header="false">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <AsideSubMenu :menuList="menuList" />
      </el-menu>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import Main from "../../components/Main/index.vue";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";
import { Menu } from "@element-plus/icons-vue";

const route = useRoute(); const router = useRouter();
const authStore = useKoiAuthStore();
const showDrawer = ref(false);
const menuList = computed(() => authStore.showMenuList);
const activeMenu = computed(() => (route.meta?.activeMenu as string) || route.path);

function handleMenuSelect(index: string) {
  showDrawer.value = false;
  router.push(index);
}
</script>

<style scoped lang="scss">
.layout-container.layout-mobile { width: 100vw; height: 100vh; }
.layout-mobile-header { height: 48px; display: flex; align-items: center; gap: 8px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); }
.mobile-title { font-size: 16px; font-weight: 600; }
</style>