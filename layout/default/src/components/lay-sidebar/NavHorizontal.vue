<script setup lang="ts">
import { isAllEmpty } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import { computed, nextTick, ref, watch } from "vue";
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarItem from "./components/SidebarItem.vue";
//@ts-ignore
import { getConfig } from "@repo/config";
import { useDefer } from "@repo/utils";
import LayTool from "../lay-tool/index.vue";

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

const defer = useDefer(usePermissionStoreHook().wholeMenus.length);
nextTick(() => {
  menuRef.value?.handleResize();
});
</script>

<template>
  <div
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    class="horizontal-header"
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
      <span
        v-for="(route, index) in usePermissionStoreHook().wholeMenus"
        :key="index"
      >
        <LaySidebarItem
          v-if="defer(index)"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </span>
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
