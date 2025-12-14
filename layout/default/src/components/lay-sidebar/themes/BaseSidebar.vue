<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  usePermissionStoreHook,
} from "@repo/core";
import { useNav } from "../../../hooks/useNav";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import LaySidebarLogo from "../components/SidebarLogo.vue";
import LaySidebarItem from "../components/SidebarItem.vue";
import LaySidebarLeftCollapse from "../components/SidebarLeftCollapse.vue";
import LaySidebarCenterCollapse from "../components/SidebarCenterCollapse.vue";
import { localStorageProxy, useDefer } from "@repo/utils";

// 导入主题装饰功能
import ThemeDecoration from "../../ThemeDecoration.vue";
import { getComponentDecorations } from "../../../themes/decorations";
import type { DecorationConfig } from "../../../themes/decorations";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.showLogo ?? true
);

const {
  device,
  pureApp,
  isCollapse,
  tooltipEffect,
  menuSelect,
  toggleSideBar,
} = useNav();

const subMenuData = ref([]);

const menuData = computed(() => {
  return pureApp?.layout === "mix" && device.value !== "mobile"
    ? subMenuData.value
    : usePermissionStoreHook().wholeMenus;
});

const loading = computed(() =>
  pureApp?.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

function getSubMenuData() {
  let path = "";
  path = defaultActive.value;
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(
    path,
    usePermissionStoreHook().wholeMenus
  );
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(
    parentPathArr[0] || path,
    usePermissionStoreHook().wholeMenus
  );
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(newPath);
  },
  {
    immediate: true,
  }
);

watch(
  () => usePermissionStoreHook().wholeMenus,
  () => {
    getSubMenuData();
  },
  {
    deep: true,
  }
);

// === 主题装饰功能 ===
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);
const sidebarDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-sidebar');
});

onMounted(() => {
  getSubMenuData();

  emitter.on("logoChange", (key) => {
    showLogo.value = key;
  });
  
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  // 解绑`logoChange`公共事件,防止多次触发
  emitter.off("logoChange");
  emitter.off("systemThemeChange");
});
const defer = useDefer(menuData.value.length);
</script>

<template>
  <div
    v-loading="loading"
    :class="[
      'base-sidebar',
      'sidebar-container-with-decoration',
      'sidebar-custom',
      'sidebar-container',
      themeClass,
      showLogo ? 'has-logo' : 'no-logo',
    ]"
    @mouseenter.prevent="isShow = true"
    @mouseleave.prevent="isShow = false"
  >
    <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <el-menu
        router
        mode="vertical"
        popper-class="pure-scrollbar"
        class="outer-most select-none"
        :collapse="isCollapse"
        :collapse-transition="false"
        :popper-effect="tooltipEffect"
        :default-active="defaultActive"
      >
        <span v-for="(routes, index) in menuData" :key="index">
          <LaySidebarItem
            :key="routes.path"
            :item="routes"
            :base-path="routes.path"
            class="outer-most select-none"
          />
        </span>
      </el-menu>
    </el-scrollbar>
    <LaySidebarCenterCollapse
      v-if="device !== 'mobile' && (isShow || isCollapse)"
      :is-active="pureApp?.sidebar?.opened"
      @toggleClick="toggleSideBar"
    />
    <LaySidebarLeftCollapse
      v-if="device !== 'mobile'"
      :is-active="pureApp?.sidebar?.opened"
      @toggleClick="toggleSideBar"
    />
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in sidebarDecorations"
      :key="`sidebar-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式 - 只保留结构，主题样式由全局 SCSS 控制
.base-sidebar {
  position: relative;
  height: 100%;
  transition: none !important;
  overflow: hidden;
  z-index: 10;

  &.has-logo {
    :deep(.scrollbar-wrapper) {
      height: calc(100% - 60px);
    }
  }

  &.no-logo {
    :deep(.scrollbar-wrapper) {
      height: 100%;
    }
  }
}

.sidebar-custom {
  --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  box-shadow:
    var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);

  .dark & {
    --un-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

:deep(.el-loading-mask) {
  opacity: 0.45;
  backdrop-filter: blur(4px);
}

.outer-most {
  user-select: none;
}
</style>
