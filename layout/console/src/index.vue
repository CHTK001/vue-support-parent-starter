<script setup lang="ts">
import "animate.css";

import { getConfig } from "@repo/config";
import Content from "./components/lay-content/index.vue";
import Header from "./components/lay-header/index.vue";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/src/offlineIcon";
import { initRouter, useAppStoreHook, useConfigStore, useSettingStoreHook } from "@repo/core";
import { useI18n } from "vue-i18n";
import LayMenu from "./components/lay-menu/index.vue";
import { useDataThemeChange } from "./hooks/useDataThemeChange";
import { useLayout } from "./hooks/useLayout";
import { setType } from "./types";
//@ts-ignore
import LaySetting from "./components/lay-setting/index.vue";

import { deviceDetection, useDark, useGlobal } from "@pureadmin/utils";
import { computed, onBeforeMount, onMounted, reactive, ref, shallowRef } from "vue";

const { t } = useI18n();
const layMenuRef = shallowRef();
const headerRef = shallowRef();
const appWrapperRef = ref();
const { isDark } = useDark();
const { layout } = useLayout();
const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<any>();

console.log(pureSetting.ShowBarSetting);

const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile",
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  }),
});

function setTheme(layoutModel: string) {
  window.document.body.setAttribute("layout", layoutModel);
  $storage.layout = {
    layout: `${layoutModel}`,
    theme: $storage.layout?.theme,
    darkMode: $storage.layout?.darkMode,
    sidebarStatus: $storage.layout?.sidebarStatus,
    epThemeColor: $storage.layout?.epThemeColor,
    themeColor: $storage.layout?.themeColor,
    overallStyle: $storage.layout?.overallStyle,
  };
}
/**
 * 获取系统默认配置
 */
const getDefaultSetting = async () => {
  useConfigStore().load();
  // await initRouter()
  //   .then(() => {})
  //   .catch((error) => {
  //     useUserStoreHook().logOut();
  //   });
};

onBeforeMount(async () => {
  await getDefaultSetting();
});

onMounted(async () => {
  if (isMobile) {
    toggle("mobile", false);
  }
});

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}
/**
 * //根据参数名去清除，可以多个
 */
function getNewUrl(reg) {
  let url = document.location.href;
  //let reg = /[^\w](url参数名|url参数名)=?([^&|^#]*)/g;
  url = url.replace(reg, "");
  reg = /&&/g;
  url = url.replace(reg, "");
  reg = /&#/g;
  url = url.replace(reg, "#");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  // url = url.replaceAll(document.domain,"");
  // url = url.replaceAll("http://","");
  // url = url.replaceAll("https://","");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  return url;
}
onBeforeMount(() => {
  let url = getNewUrl(/[^\w](redirectParam)=?([^&|^#]*)/g);
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
  if (url != document.location.href) {
    window.history.replaceState(null, null, url);
  }
  if (!getConfig().OpenAuth) {
    initRouter();
  }
});

const showMenu = shallowRef(false);
const toggleMenu = async (value) => {
  showMenu.value = value;
  if (!value) {
    layMenuRef.value.triggerClose();
    return;
  }
  layMenuRef.value.triggerOpen();
};

const triggerClose2 = async () => {
  showMenu.value = false;
  headerRef.value.triggerCloseMenu();
};
const triggerClose = async () => {
  showMenu.value = false;
  layMenuRef.value.triggerClose();
};
</script>

<template>
  <div class="overflow-hidden console">
    <Header class="lay-header" @toggleMenu="toggleMenu" @close="triggerClose" ref="headerRef"></Header>
    <Content class="lay-body"></Content>
    <LayMenu class="lay-menu" ref="layMenuRef" :class="{ 'lay-menu-hidden': !showMenu }" @close="triggerClose2"></LayMenu>
    <!-- 系统设置 -->
    <LaySetting v-if="pureSetting.ShowBarSetting" />
    <div :class="{ 'lay-menu-hidden-bg-hidden': !showMenu }" class="lay-menu-hidden-bg"></div>
  </div>
</template>
<style scoped lang="scss">
.lay-menu-hidden-bg-hidden {
  opacity: 0 !important;
  left: -100% !important;
  overflow: hidden;
  transition:
    opacity 300ms linear,
    left 310ms;
}
.lay-menu-hidden-bg {
  background-color: var(--cb-color-bg-backdrop, rgba(0, 0, 0, 0.2));
  opacity: 1;
  transition: opacity 300ms linear;
  z-index: 929;
  height: 100%;
  width: 100%;
  position: fixed;
  left: 0;
  top: 0;
}
.lay-body {
  height: calc(100vh - var(--navbar-height));
  margin-top: var(--navbar-height);
}
.bg-bg_color {
  background-color: var(--el-bg-color);
}
#app,
body {
  height: 100vh;
  color: #000;
}
.console {
  height: 100vh;
  width: 100vw;
}
.hamburger-container {
  float: left;
  height: 100%;
  line-height: 48px;
  cursor: pointer;
}

.vertical-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 280px;
  height: 48px;
  color: #000000d9;
}
.el-dropdown-link {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 48px;
  padding: 10px;
  color: #000000d9;
  cursor: pointer;

  p {
    font-size: 12px;
  }

  img {
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }
}

.breadcrumb-container {
  float: left;
  margin-left: 16px;
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
    height: 38px;
  }
}
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
