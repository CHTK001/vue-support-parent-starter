<template>
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i" @click="toggle">
    <el-tooltip :content="globalStore.isFullScreen === false ? 'Fullscreen' : 'Exit fullscreen'">
      <KoiGlobalIcon name="koi-maximize" size="18" v-if="!globalStore.isFullScreen" />
      <KoiGlobalIcon name="koi-fullscreen-exit" size="19" v-else />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useFullscreen } from "@vueuse/core";
import { watch } from "vue";
import { useKoiGlobalStore } from "../../../stores/global";

const globalStore = useKoiGlobalStore();
const { isFullscreen, toggle } = useFullscreen();

watch(isFullscreen, () => {
  globalStore.setGlobalState("isFullScreen", isFullscreen.value);
});
</script>

<style lang="scss" scoped></style>
