<template>
  <div class="main-wrapper">
    <ReMaximize />
    <RePerfMonitor />
    <ReAiCharacter />
<Tabs v-if="globalStore.isTabsShown" />
    <AnnouncementBar position="default" load-mode="single" />
    <RePerfMonitor />
    <el-main class="main-content">
      <router-view v-slot="{ Component, route }">
        <template v-if="isNoneTransition">
          <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
        </template>
        <transition v-else :name="transition" mode="out-in" appear>
          <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
        </transition>
      </router-view>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeUnmount, computed } from "vue";
import ReMaximize from "@repo/theme/koi/layouts/components/Main/components/ReMaximize.vue";
import { useDebounceFn } from "@vueuse/core";
import Tabs from "@repo/theme/koi/layouts/components/Tabs/index.vue";
import AnnouncementBar from "@repo/theme/koi/layouts/components/AnnouncementBar/index.vue";
import RePerfMonitor from "@repo/theme/koi/layouts/components/RePerfMonitor.vue";
import ReAiCharacter from "@repo/theme/koi/layouts/components/ReAiCharacter.vue";
import { storeToRefs } from "pinia";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();

// 璺敱鍔ㄧ敾
const { transition } = storeToRefs(globalStore);
// 鏃犲姩鐢伙紙transition 涓虹┖鎴?"none"锛?
const isNoneTransition = computed(() => !transition.value || transition.value === "none");
const keepAliveStore = useKeepAliveStore();

// 鍒锋柊褰撳墠璺敱椤甸潰缂撳瓨鏂规硶
const isRouterShow = ref(true);

const refreshCurrentPage = (val: boolean) => (isRouterShow.value = val);

provide("refresh", refreshCurrentPage);

/** 鐩戝惉褰撳墠椤甸潰鏄惁鏈€澶у寲锛屽姩鎬佹坊鍔?class */
watch(
  () => globalStore.maximize,
  () => {
    const app = document.getElementById("app") as HTMLElement;
    if (globalStore.maximize) app.classList.add("main-maximize");
    else app.classList.remove("main-maximize");
    // 娴忚鍣ㄦ病鏈夊疄闄呭彉鍖栫殑鎯呭喌涓嬶紝瑙﹀彂涓€娆℃祻瑙堝櫒灏哄彉鍖栫殑閫昏緫銆備繚璇佸叏灞忓垏鎹㈢殑鏃跺€欙紝琛ㄦ牸闃斾互杩涜鑷€傚簲銆?
    const event = new Event("resize");
    window.dispatchEvent(event);
  },
  { deep: true, immediate: true }
);

const screenWidth = ref(0);
const showTabs = ref(true);

/** 鐩戝惉绐楀彛澶у皬鍙樺寲锛屾姌鍙犱晶杈规爮 */
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
  // 鏈€灏忓寲鏍峰紡锛屽彧璁剧疆蹇呰鐨勫竷灞€灞炴€?
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; // 闃叉楂樺害婧㈠嚭
}

.main-content {
  overflow-x: hidden;
  flex: 1;
  margin: 0;
  background-color: var(--el-bg-color-page);
  min-height: 0;
  
  // 鏆楄壊妯″紡
  .dark & {
    background-color: var(--el-bg-color-page);
  }
}
</style>