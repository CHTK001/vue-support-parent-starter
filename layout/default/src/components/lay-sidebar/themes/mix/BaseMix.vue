<script setup lang="ts">
import { useNav } from "../../../../hooks/useNav";
import {
  findRouteByPath,
  getParentPaths,
  usePermissionStoreHook,
} from "@repo/core";
import { isAllEmpty } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig, transformI18n } from "@repo/config";
import { nextTick, onMounted, ref, toRaw, watch } from "vue";
import { useTranslationLang } from "../../../../hooks/useTranslationLang";
import LaySidebarExtraIcon from "../../components/SidebarExtraIcon.vue";
import { useDefer } from "@repo/utils";
import LayTool from "../../../lay-tool/index.vue";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

const menuRef = ref();
const defaultActive = ref(null);

// 提取 store 到顶层避免重复调用
const permissionStore = usePermissionStoreHook();

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
  getDropdownItemClass,
  menuSelect,
} = useNav();

function getDefaultActive(routePath) {
  const wholeMenus = permissionStore.wholeMenus;
  /** 当前路由的父级路径 */
  const parentRoutes = getParentPaths(routePath, wholeMenus)[0];
  defaultActive.value = !isAllEmpty(route.meta?.activePath)
    ? route.meta.activePath
    : findRouteByPath(parentRoutes, wholeMenus)?.children[0]?.path;
}

onMounted(() => {
  getDefaultActive(route.path);
});

nextTick(() => {
  menuRef.value?.handleResize();
});

watch(
  () => [route.path, permissionStore.wholeMenus],
  () => {
    getDefaultActive(route.path);
  }
);
const deferDropdown = useDefer(4);
</script>

<template>
  <div
    v-if="device !== 'mobile'"
    v-loading="permissionStore.wholeMenus.length === 0"
    :class="['horizontal-header', themeClass]"
  >
    <el-menu
      ref="menuRef"
      router
      mode="horizontal"
      popper-class="pure-scrollbar horizontal-popper"
      class="horizontal-header-menu"
      :default-active="defaultActive"
    >
      <el-menu-item
        v-for="route in permissionStore.wholeMenus"
        :key="route.path"
        :index="resolvePath(route) || route.redirect"
      >
        <template #title>
          <div
            v-if="toRaw(route.meta.icon)"
            :class="['sub-menu-icon', route.meta.icon]"
          >
            <component
              :is="useRenderIcon(route.meta && toRaw(route.meta.icon))"
            />
          </div>
          <div :style="getDivStyle">
            <span class="select-none">
              {{ transformI18n(route.meta.i18nKey || route.meta.title) }}
            </span>
            <LaySidebarExtraIcon :extraIcon="route.meta.extraIcon" />
          </div>
        </template>
      </el-menu-item>
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
