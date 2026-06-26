<template>
  <el-main class="main-container">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <keep-alive :include="keepAliveStore.keepAliveName">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </el-main>
</template>

<script setup lang="ts">
import { useKoiGlobalStore } from "../../stores/global";
import { useKoiKeepAliveStore } from "../../stores/keepAlive";
import { computed } from "vue";

const globalStore = useKoiGlobalStore();
const keepAliveStore = useKoiKeepAliveStore();
const transitionName = computed(() => globalStore.transition || "fade-default");
</script>

<style scoped>
.main-container { padding: 16px; min-height: 0; background: var(--el-bg-color-page); }
</style>