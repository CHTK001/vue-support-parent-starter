<template>
  <div class="layout-horizontal-host">
    <div class="layout-horizontal-body">
      <header class="layout-horizontal-topbar">
        <div class="layout-horizontal-topbar-card">
          <Logo :layout="globalStore.layout" class="layout-horizontal-logo" />
          <div class="menu-container">
            <div class="horizontal-menu-wrapper">
              <el-menu mode="horizontal" class="horizontal-menu" :default-active="activeMenu" :router="false">
                <template v-for="item in menuList" :key="item.path">
                  <el-sub-menu v-if="item.children?.length" :index="item.path + 'el-sub-menu'">
                    <template #title>
                      <div class="horizontal-menu-item-inner">
                        <KoiGlobalIcon v-if="item.meta.icon" :name="item.meta.icon" size="18" />
                        <span class="menu-ellipsis" v-text="item.meta.title" />
                      </div>
                    </template>
                    <AsideSubMenu :menuList="item.children" />
                  </el-sub-menu>
                  <el-menu-item v-else :index="item.path" @click="handleMenuRouter(item)">
                    <div class="horizontal-menu-item-inner">
                      <KoiGlobalIcon v-if="item.meta.icon" :name="item.meta.icon" size="18" />
                      <span class="menu-ellipsis" v-text="item.meta.title" />
                    </div>
                  </el-menu-item>
                </template>
              </el-menu>
            </div>
          </div>
        </div>
      </header>
      <Main class="layout-horizontal-main" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Logo from "../../components/Logo/index.vue";
import AsideSubMenu from "../../components/Menu/AsideSubMenu.vue";
import Main from "../../components/Main/index.vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useKoiAuthStore } from "../../stores/auth";
import { useKoiGlobalStore } from "../../stores/global";

const route = useRoute();
const router = useRouter();
const authStore = useKoiAuthStore();
const globalStore = useKoiGlobalStore();

const menuList = computed(() => authStore.showMenuList);

const handleMenuRouter = (value: any) => {
  if (value.meta?.linkUrl) {
    if (/^https?:\/\//.test(value.meta?.linkUrl)) return window.open(value.meta.linkUrl, "_blank");
    return;
  }
  router.push(value.path);
};

const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.layout-horizontal-host {
  display: flex; flex-direction: column; width: 100vw; height: 100vh;
  overflow: hidden; box-sizing: border-box;
  background: radial-gradient(ellipse 560px 420px at 85% 18%, color-mix(in srgb, var(--el-color-primary) 7.75%, transparent) 0%, transparent 70%),
    radial-gradient(460px circle at 20% 80%, color-mix(in srgb, var(--el-color-primary) 6.25%, transparent) 0%, transparent 65%), #f8f8f8;
  html.dark & { background: radial-gradient(ellipse 560px 420px at 85% 18%, rgba(255, 255, 255, 0.34), transparent 70%),
    radial-gradient(460px circle at 20% 80%, rgba(255, 255, 255, 0.3), transparent 65%), #03020c; }
}

.layout-horizontal-body { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.layout-horizontal-topbar { flex-shrink: 0; padding: 0 14px 6px; }

.layout-horizontal-topbar-card {
  display: flex; align-items: center; gap: 10px;
  min-height: calc(#{$aside-header-height} + 8px);
  padding: 6px 10px 6px 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 36%, transparent);
  border-top: none; border-radius: 0 0 22px 22px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(28px) saturate(1.12);
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
  html.dark & { background: rgba(30, 30, 30, 0.65); box-shadow: 0 12px 32px rgb(0 0 0 / 38%); }
}

.layout-horizontal-logo { flex-shrink: 1; min-width: 0; }
.menu-container { flex: 1; min-width: 0; height: $aside-header-height; overflow: hidden; }
.horizontal-menu-wrapper { width: 100%; height: 100%; }

.horizontal-menu {
  display: flex; align-items: center; height: 100%;
  border-bottom: none !important; background: transparent !important;
}

.horizontal-menu-item-inner {
  display: inline-flex; align-items: center; gap: 8px; max-width: 100%;
  font-weight: 500; color: inherit;
}

.menu-ellipsis { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.layout-horizontal-main { flex: 1; min-height: 0; }

:deep(.horizontal-menu.el-menu--horizontal) {
  --el-menu-bg-color: transparent;
  > .el-menu-item, > .el-sub-menu .el-sub-menu__title {
    height: 36px !important; line-height: 36px !important; margin: 0 2px;
    padding: 0 12px !important; border: none !important; border-radius: 9px !important;
    color: var(--el-menu-text-color); transition: color 0.15s ease, background-color 0.15s ease;
  }
  > .el-menu-item:hover, > .el-sub-menu:hover > .el-sub-menu__title {
    color: var(--el-menu-hover-text-color); background: var(--el-menu-hover-bg-color) !important;
  }
  > .el-menu-item.is-active, > .el-sub-menu.is-active > .el-sub-menu__title {
    color: var(--el-menu-active-text-color) !important; background: var(--el-menu-active-bg-color) !important; font-weight: 600;
  }
}
</style>
