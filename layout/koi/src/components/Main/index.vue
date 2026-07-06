<template>
  <div class="main-wrapper">
    <Maximize />
    <Tabs v-if="globalStore.showTabs" />
    <el-main class="main-content">
      <router-view v-slot="{ Component, route }">
        <transition :name="transition" mode="out-in" appear>
          <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
        </transition>
      </router-view>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeUnmount } from "vue";
import Maximize from "../Main/components/Maximize.vue";
import Tabs from "../Tabs/index.vue";
import { storeToRefs } from "pinia";
import { useKoiKeepAliveStore } from "../../stores/keepAlive";
import { useKoiGlobalStore } from "../../stores/global";

const globalStore = useKoiGlobalStore();
const { transition } = storeToRefs(globalStore);
const keepAliveStore = useKoiKeepAliveStore();

const isRouterShow = ref(true);
const refreshCurrentPage = (val: boolean) => (isRouterShow.value = val);
provide("refresh", refreshCurrentPage);

watch(
  () => globalStore.maximize,
  () => {
    const app = document.getElementById("app") as HTMLElement;
    if (globalStore.maximize) app.classList.add("main-maximize");
    else app.classList.remove("main-maximize");
    window.dispatchEvent(new Event("resize"));
  },
  { deep: true, immediate: true }
);

const screenWidth = ref(0);
const listeningWindow = () => {
  screenWidth.value = document.body.clientWidth;
  if (!globalStore.isCollapse && screenWidth.value < 1200) globalStore.setGlobalState("isCollapse", true);
  if (globalStore.isCollapse && screenWidth.value > 1200) globalStore.setGlobalState("isCollapse", false);
};

window.addEventListener("resize", listeningWindow, false);
onBeforeUnmount(() => window.removeEventListener("resize", listeningWindow));
</script>

<style lang="scss" scoped>
@use "../../styles/transition.scss";

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

  .dark & { background-color: #000000; }
}
</style>
