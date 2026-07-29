<template>
  <div class="main-wrapper">
    <Maximize />
    <Tabs v-if="showTabsBar"></Tabs>
    <el-main class="main-content">
      <router-view v-slot="{ Component, route }">
        <transition :name="transition" mode="out-in" appear>
          <keep-alive v-if="keepAliveEnabled" :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
          <component v-else :is="Component" :key="route.fullPath" v-if="isRouterShow" />
        </transition>
      </router-view>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeUnmount, computed } from "vue";
import Maximize from "../../../layouts/components/Main/components/Maximize.vue";
import { useDebounceFn } from "@vueuse/core";
import Tabs from "../../../layouts/components/Tabs/index.vue";
import { storeToRefs } from "pinia";
import useKeepAliveStore from "../../../stores/modules/keepAlive.ts";
import useGlobalStore from "../../../stores/modules/global.ts";
import { getConfig } from "@repo/config";

const globalStore = useGlobalStore();
const config = getConfig() || {};

/** 路由动画 */
const { transition } = storeToRefs(globalStore);

const keepAliveStore = useKeepAliveStore();

/** 多页签是否启用（app.yaml ShowModel 配置） */
const showTabsBar = computed(() => config.ShowModel === "chrome");

/** KeepAlive 开关（app.yaml KeepAlive 配置，缺省 true） */
const keepAliveEnabled = computed(() => config.KeepAlive !== false);

/** 内容区背景色（支持 light/dark 与自定义 hex） */
const contentTheme = computed(() => config.Theme || "light");

// 刷新当前路由页面缓存方法
const isRouterShow = ref(true);

const refreshCurrentPage = (val: boolean) => (isRouterShow.value = val);

provide("refresh", refreshCurrentPage);

/** 监听当前页面是否最大化，动态添加 class */
watch(
  () => globalStore.maximize,
  () => {
    const app = document.getElementById("app") as HTMLElement;
    if (globalStore.maximize) app.classList.add("main-maximize");
    else app.classList.remove("main-maximize");
    const event = new Event("resize");
    window.dispatchEvent(event);
  },
  { deep: true, immediate: true }
);

const screenWidth = ref(0);
const showTabs = ref(true);

/** 监听窗口大小变化，折叠侧边栏 */
const listeningWindow = useDebounceFn(() => {
  screenWidth.value = document.body.clientWidth;
  if (!globalStore.isCollapse && screenWidth.value < 1200) globalStore.setGlobalState("isCollapse", true);
  if (globalStore.isCollapse && screenWidth.value > 1200) globalStore.setGlobalState("isCollapse", false);
  showTabs.value = screenWidth.value >= 520;
}, 100);

window.addEventListener("resize", listeningWindow, false);

onBeforeUnmount(() => {
  window.removeEventListener("resize", listeningWindow);
});
</script>

<style lang="scss" scoped>
@use "../../../styles/transition.scss";

.main-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.main-content {
  overflow-x: hidden;
  flex: 1;
  padding: 0;
  margin: 0;
  background-color: #FAFBFC;
  min-height: 0;

  .dark & {
    background-color: #000000;
  }

  :global([data-theme="dark"]) & {
    background-color: var(--el-bg-color);
  }
}
</style>
