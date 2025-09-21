<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/src/offlineIcon";
import { initRouter, useAppStoreHook, useConfigStore, useSettingStoreHook } from "@repo/core";
import { useI18n } from "vue-i18n";
import { useDataThemeChange } from "./hooks/useDataThemeChange";
import { useLayout } from "./hooks/useLayout";
import { setType } from "./types";

import { deviceDetection, useDark, useGlobal, useResizeObserver } from "@pureadmin/utils";
import { computed, defineAsyncComponent, defineComponent, h, markRaw, onBeforeMount, onMounted, reactive, ref } from "vue";
//@ts-ignore
import BackTopIcon from "@repo/assets/svg/back_top.svg?component";
import { getConfig } from "@repo/config";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import LayNavbar from "./components/lay-navbar/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import NavHorizontalLayout from "./components/lay-sidebar/NavHorizontal.vue";
import NavHoverLayout from "./components/lay-sidebar/NavHover.vue";
import NavVerticalLayout from "./components/lay-sidebar/NavVertical.vue";
import NavDoubleLayout from "./components/lay-sidebar/NavDouble.vue";
import LayTag from "./components/lay-tag/index.vue";
window.onload = () => {
  registerRequestIdleCallback(() => {
    createFingerprint((finger) => {
      localStorageProxy().setItem("visitId", finger);
    });
  });
};
const CardNavigation = defineAsyncComponent(() => import("./components/lay-sidebar/components/CardNavigation.vue"));
const LayContent = defineAsyncComponent(() => import("./components/lay-content/index.vue"));
const NavVertical = markRaw(NavVerticalLayout);
const NavHorizontal = markRaw(NavHorizontalLayout);
const NavHover = markRaw(NavHoverLayout);
const NavDouble = markRaw(NavDoubleLayout);
const { t } = useI18n();
const appWrapperRef = ref();
const { isDark } = useDark();
const { layout } = useLayout();
const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<any>();

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

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}

// 判断是否可自动关闭菜单栏
let isAutoCloseSidebar = true;

useResizeObserver(appWrapperRef, (entries) => {
  if (isMobile) return;
  const entry = entries[0];
  const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;
  useAppStoreHook().setViewportSize({ width, height });
  width <= 760 ? setTheme("vertical") : setTheme(useAppStoreHook().layout);
  /** width app-wrapper类容器宽度
   * 0 < width <= 760 隐藏侧边栏
   * 760 < width <= 990 折叠侧边栏
   * width > 990 展开侧边栏
   */
  if (width > 0 && width <= 760) {
    toggle("mobile", false);
    isAutoCloseSidebar = true;
  } else if (width > 760 && width <= 990) {
    if (isAutoCloseSidebar) {
      toggle("desktop", false);
      isAutoCloseSidebar = false;
    }
  } else if (width > 990 && !set.sidebar.isClickCollapse) {
    toggle("desktop", true);
    isAutoCloseSidebar = true;
  } else {
    toggle("desktop", false);
    isAutoCloseSidebar = false;
  }
});

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

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header shadow-tab": set.fixedHeader },
        style: [set.hideTabs && layout.value.includes("horizontal") ? (isDark.value ? "box-shadow: 0 1px 4px #0d0d0d" : "box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)") : ""],
      },
      {
        default: () => [
          !pureSetting.hiddenSideBar && (layout.value.includes("vertical") || layout.value.includes("mix") || layout.value.includes("hover") || layout.value.includes("card") || layout.value.includes("double")) ? h(LayNavbar) : null,
          !pureSetting.hiddenSideBar && layout.value.includes("horizontal") ? h(NavHorizontal) : null,
          h(markRaw(LayTag)),
        ],
      }
    );
  },
});
</script>

<template>
  <div ref="appWrapperRef" :class="['app-wrapper', set.classes]">
    <!-- 卡片导航模式：直接渲染CardNavigation组件 -->
    <template v-if="layout.includes('card')">
      <Suspense>
        <template #default>
          <CardNavigation />
        </template>
        <template #fallback>
          <div class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        </template>
      </Suspense>
    </template>

    <!-- 双栏导航模式：特殊布局 -->
    <template v-else-if="layout.includes('double')">
      <div v-show="set.device === 'mobile' && set.sidebar.opened" class="app-mask" @click="useAppStoreHook().toggleSideBar()" />
      <div class="double-layout-container">
        <NavDouble v-show="!pureSetting.hiddenSideBar" />
        <div :class="['main-container', 'double-main', pureSetting.hiddenSideBar ? 'main-hidden' : '']">
          <div v-if="set.fixedHeader">
            <LayHeader />
            <!-- 主体内容 -->
            <Suspense>
              <template #default>
                <div>
                  <LayContent :fixed-header="set.fixedHeader" />
                </div>
              </template>
            </Suspense>
          </div>
          <el-scrollbar v-else>
            <el-backtop :title="t('buttons.pureBackTop')" target=".main-container .el-scrollbar__wrap">
              <BackTopIcon />
            </el-backtop>
            <LayHeader />
            <!-- 主体内容 -->
            <Suspense>
              <template #default>
                <div>
                  <LayContent :fixed-header="set.fixedHeader" />
                </div>
              </template>
            </Suspense>
          </el-scrollbar>
        </div>
      </div>
    </template>

    <!-- 其他导航模式：原有逻辑 -->
    <template v-else>
      <div v-show="set.device === 'mobile' && set.sidebar.opened && (layout.includes('vertical') || layout.includes('hover'))" class="app-mask" @click="useAppStoreHook().toggleSideBar()" />
      <NavVertical v-show="!pureSetting.hiddenSideBar && (layout.includes('vertical') || layout.includes('mix'))" />
      <NavHover v-show="!pureSetting.hiddenSideBar && layout.includes('hover')" />
      <div :class="['main-container', pureSetting.hiddenSideBar ? 'main-hidden' : '']">
        <div v-if="set.fixedHeader">
          <LayHeader />
          <!-- 主体内容 -->
          <Suspense>
            <template #default>
              <div>
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </template>
          </Suspense>
        </div>
        <el-scrollbar v-else>
          <el-backtop :title="t('buttons.pureBackTop')" target=".main-container .el-scrollbar__wrap">
            <BackTopIcon />
          </el-backtop>
          <LayHeader />
          <!-- 主体内容 -->
          <Suspense>
            <template #default>
              <div>
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </template>
          </Suspense>
        </el-scrollbar>
      </div>
    </template>

    <!-- 系统设置 -->
    <LaySetting v-if="pureSetting.ShowBarSetting" />
  </div>
</template>

<style lang="scss" scoped>
.shadow-tab {
  --un-shadow: var(--tab-box-shadow-v2);
  box-shadow: var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);
}

.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;

  &::after {
    display: table;
    clear: both;
    content: "";
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

:deep(.bg-layout > div > .el-card__body) {
  padding: 0;
}

.bg-bg_color {
  background-color: var(--el-bg-color);
}

.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}

.bg-bg_color {
  background-color: var(--el-bg-color) !important;
}

// 双栏导航布局容器
.double-layout-container {
  display: flex;
  height: 100%;
  width: 100%;
  
  .double-main {
    flex: 1;
    min-width: 0;
    margin-left: 0 !important;
  }
}

// 异步组件加载状态样式
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: var(--el-bg-color-overlay);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
