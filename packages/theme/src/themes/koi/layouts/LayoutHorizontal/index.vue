<template>
  <div
    class="layout-horizontal-host"
    :class="{
      'layout-horizontal-host--header-inverted':
        (globalStore.headerInverted || globalStore.asideInverted) && !globalStore.isDark
    }"
  >
    <div class="layout-horizontal-body">
      <header class="layout-horizontal-topbar">
        <div class="layout-horizontal-topbar-card">
          <Logo :layout="globalStore.layout" class="layout-horizontal-logo" />
          <div class="menu-container">
            <div class="horizontal-menu-wrapper">
              <el-menu
                mode="horizontal"
                class="horizontal-menu"
                :default-active="activeMenu"
                :router="false"
              >
                <template v-for="item in menuList" :key="item.path">
                  <el-sub-menu
                    v-if="item.children?.length"
                    :index="item.path + 'el-sub-menu'"
                    :key="item.path"
                  >
                    <template #title>
                      <div class="horizontal-menu-item-inner">
                        <ReIcon
                          :name="item.meta?.icon || menuDefaultIcon"
                          size="18"
                        />
                        <span class="menu-ellipsis" v-text="getMenuLanguage(item.meta.title)" />
                      </div>
                    </template>
                    <ReHorizontalSubMenu :menuList="item.children" />
                  </el-sub-menu>
                  <el-menu-item
                    v-else
                    :index="item.path"
                    :key="item.path + 'el-menu-item'"
                    @click="handleMenuRouter(item)"
                  >
                    <div class="horizontal-menu-item-inner">
                      <ReIcon
                        :name="item.meta?.icon || menuDefaultIcon"
                        size="18"
                      />
                      <span class="menu-ellipsis" v-text="getMenuLanguage(item.meta.title)" />
                    </div>
                  </el-menu-item>
                </template>
              </el-menu>
            </div>
          </div>
          <div class="layout-horizontal-toolbar-wrap">
            <ReToolbar />
          </div>
        </div>
      </header>
      <Main class="layout-horizontal-main" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { msgWarning } from "@repo/core";
import Logo from "@repo/theme/koi/layouts/components/Logo/index.vue";
import ReToolbar from "@repo/theme/koi/layouts/components/Header/components/ReToolbar.vue";
import ReHorizontalSubMenu from "@repo/theme/koi/layouts/components/Menu/ReHorizontalSubMenu.vue";
import Main from "@repo/theme/koi/layouts/components/Main/index.vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";
import { getMenuLanguage } from "@repo/languages";
import { resolveMenuDefaultIcon } from "@repo/config";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

// 缺省菜单图标：菜单未配置 meta.icon 时兜底，避免图标位空白
const menuDefaultIcon = resolveMenuDefaultIcon();

const menuList = computed(() => authStore.showMenuList);

const handleMenuRouter = (value: any) => {
  if (value.meta?.linkUrl) {
    if (/^https?:\/\//.test(value.meta?.linkUrl)) {
      return window.open(value.meta.linkUrl, "_blank");
    }
    msgWarning("非正确链接地址，禁止跳转");
    return;
  }
  router.push(value.path);
};

const activeMenu = computed(
  () => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string
);
</script>

<style lang="scss" scoped>
.layout-horizontal-host {
  --grad-glass-blur: 28px;
  --grad-glass-saturate: 1.12;
  --grad-panel-bg-light: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14) 0%,
      rgba(255, 255, 255, 0.05) 100%
    ),
    radial-gradient(
      ellipse 560px 420px at 85% 18%,
      color-mix(in srgb, var(--el-color-primary) 6.75%, transparent) 0%,
      transparent 70%
    ),
    rgba(248, 248, 248, 0.22);
  --grad-panel-bg-dark: linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.1) 100%),
    radial-gradient(ellipse 560px 420px at 85% 18%, rgba(255, 255, 255, 0.26), transparent 70%),
    rgba(3, 2, 12, 0.38);
  --grad-panel-bg: var(--grad-panel-bg-light);
  --grad-chrome-bg-dark: linear-gradient(180deg, rgba(0, 0, 0, 0.13) 0%, rgba(0, 0, 0, 0.052) 100%),
    radial-gradient(ellipse 92% 72% at 100% 6%, rgba(255, 255, 255, 0.12), transparent 52%),
    rgba(5, 6, 17, 0.52);

  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  background: radial-gradient(
      ellipse 560px 420px at 85% 18%,
      color-mix(in srgb, var(--el-color-primary) 7.75%, transparent) 0%,
      transparent 70%
    ),
    radial-gradient(
      460px circle at 20% 80%,
      color-mix(in srgb, var(--el-color-primary) 6.25%, transparent) 0%,
      transparent 65%
    ),
    #f8f8f8;

  html.dark & {
    --grad-panel-bg: var(--grad-panel-bg-dark);
    background: radial-gradient(ellipse 560px 420px at 85% 18%, rgba(255, 255, 255, 0.34), transparent 70%),
      radial-gradient(460px circle at 20% 80%, rgba(255, 255, 255, 0.3), transparent 65%), #03020c;
  }
}

.layout-horizontal-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.layout-horizontal-topbar {
  flex-shrink: 0;
  padding: 0 14px 6px;
}

/** Logo + 菜单 + 工具栏：同一行 flex，工具栏不绝对定位 */
.layout-horizontal-topbar-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: calc(#{$aside-header-height} + 8px);
  padding: 6px 10px 6px 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 36%, transparent);
  border-top: none;
  border-radius: 0 0 22px 22px;
  background: var(--grad-panel-bg);
  backdrop-filter: blur(var(--grad-glass-blur)) saturate(var(--grad-glass-saturate));
  -webkit-backdrop-filter: blur(var(--grad-glass-blur)) saturate(var(--grad-glass-saturate));
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);

  html.dark & {
    background: var(--grad-chrome-bg-dark);
    box-shadow: 0 12px 32px rgb(0 0 0 / 38%);
    border-color: color-mix(in srgb, var(--el-border-color) 44%, transparent);
  }

  .layout-horizontal-host--header-inverted & {
    --grad-panel-bg: var(--grad-panel-bg-dark);
    --grad-glass-blur: 30px;
    background: var(--el-header-bg-color);
    backdrop-filter: blur(30px) saturate(var(--grad-glass-saturate));
    -webkit-backdrop-filter: blur(30px) saturate(var(--grad-glass-saturate));
    box-shadow: 0 14px 36px rgb(0 0 0 / 38%);
    border-color: var(--el-header-toolbar-border-color);
  }
}

.layout-horizontal-host--header-inverted .layout-horizontal-toolbar-wrap {
  border-left-color: var(--el-header-toolbar-border-color);
}

.layout-horizontal-logo {
  flex-shrink: 1;
  min-width: 0;
}

.menu-container {
  flex: 1;
  min-width: 0;
  height: $aside-header-height;
  overflow: hidden;
}

.horizontal-menu-wrapper {
  width: 100%;
  height: 100%;
}

.horizontal-menu {
  display: flex;
  align-items: center;
  height: 100%;
  border-bottom: none !important;
  background: transparent !important;
}

.horizontal-menu-item-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  font-weight: 500;
  color: inherit;
}

.menu-ellipsis {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-horizontal-toolbar-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  align-self: center;
  height: $aside-header-height;
  padding-left: 6px;
  margin-left: 2px;
  border-left: 1px solid color-mix(in srgb, var(--el-border-color) 42%, transparent);
}

.layout-horizontal-toolbar-wrap :deep(.header-right) {
  position: static;
  top: auto;
  right: auto;
  z-index: auto;
  height: auto;
  transform: none;
  flex-shrink: 0;
}

.layout-horizontal-main {
  flex: 1;
  min-height: 0;
}

:deep(.horizontal-menu.el-menu--horizontal) {
  --el-menu-bg-color: transparent;

  > .el-menu-item,
  > .el-sub-menu .el-sub-menu__title {
    height: 36px !important;
    line-height: 36px !important;
    margin: 0 2px;
    padding: 0 12px !important;
    border: none !important;
    border-radius: 9px !important;
    color: var(--el-menu-text-color);
    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    .el-sub-menu__icon-arrow {
      color: var(--el-menu-text-color);
    }
  }

  > .el-sub-menu .el-sub-menu__title {
    padding-right: 26px !important;

    .el-sub-menu__icon-arrow {
      right: 8px !important;
    }
  }

  > .el-menu-item:hover,
  > .el-sub-menu:hover > .el-sub-menu__title {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color) !important;

    .el-sub-menu__icon-arrow {
      color: var(--el-menu-hover-text-color);
    }
  }

  > .el-menu-item.is-active,
  > .el-sub-menu.is-active > .el-sub-menu__title {
    color: var(--el-menu-active-text-color) !important;
    background: var(--el-menu-active-bg-color) !important;
    font-weight: 600;

    .el-sub-menu__icon-arrow {
      color: var(--el-menu-active-text-color);
    }
  }
}

.layout-horizontal-main :deep(.main-content) {
  background-color: transparent;

  html.dark & {
    background-color: transparent;
  }
}
</style>
