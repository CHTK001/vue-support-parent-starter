<script setup lang="ts">
import { isAllEmpty } from "@pureadmin/utils";
import { emitter, usePermissionStoreHook } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Component, provide } from "vue";
import { useNav } from "../../../../hooks/useNav";
import { useTranslationLang } from "../../../../hooks/useTranslationLang";
import DefaultSidebarItem from "../../components/themes/DefaultSidebarItem.vue";
import { getConfig, responsiveStorageNameSpace } from "@repo/config";
import type { StorageConfigs } from "@repo/config";
import { localStorageProxy } from "@repo/utils";
import LayTool from "../../../lay-tool/index.vue";

// 接收主题类名和主题 SidebarItem 组件
const props = defineProps<{
  themeClass?: string;
  sidebarItemComponent?: Component;
}>();

// 计算实际使用的 SidebarItem 组件
const ThemeSidebarItem = computed(() => props.sidebarItemComponent || DefaultSidebarItem);

// 提供给子组件（用于递归渲染）
provide('themeSidebarItem', ThemeSidebarItem);

const menuRef = ref();

const { t, route, locale, translationCh, translationEn } =
  useTranslationLang(menuRef);

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  getLogo,
  backTopMenu,
  resolvePath,
  getDivStyle,
  toggleSideBar,
  clickClearRouter,
  gotoSecret,
  gotoAccountSetting,
  getDropdownItemStyle,
  menuSelect,
} = useNav();

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

nextTick(() => {
  menuRef.value?.handleResize();
});
</script>

<template>
  <div
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    :class="['horizontal-header', themeClass]"
  >
    <div class="horizontal-header-left" @click="backTopMenu">
      <img :src="getLogo()" alt="logo" />
      <span>{{ getConfig().Title }}</span>
    </div>
    <el-menu
      ref="menuRef"
      router
      mode="horizontal"
      popper-class="pure-scrollbar horizontal-popper"
      class="horizontal-header-menu"
      :default-active="defaultActive"
    >
      <component
        :is="ThemeSidebarItem"
        v-for="(route, index) in usePermissionStoreHook().wholeMenus"
        :key="route.path"
        :item="route"
        :base-path="route.path"
      />
    </el-menu>
    <div class="horizontal-header-right">
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
