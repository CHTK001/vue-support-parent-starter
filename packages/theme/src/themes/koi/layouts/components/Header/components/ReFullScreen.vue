<template>
  <!-- 全屏 -->
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i" @click="toggle">
    <el-tooltip :content="globalStore.isFullScreen === false ? $t('header.fullScreen') : $t('header.exitFullScreen')">
      <ReIcon name="koi-maximize" size="18" v-if="!globalStore.isFullScreen" />
      <ReIcon name="koi-fullscreen-exit" size="19" v-else />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useFullscreen } from "@vueuse/core";
import { watch } from "vue";
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();
// @vueuse/core 处理是否全屏
const { isFullscreen, toggle } = useFullscreen();

watch(isFullscreen, () => {
  if (isFullscreen.value) {
    globalStore.setGlobalState("isFullScreen", true);
  } else {
    globalStore.setGlobalState("isFullScreen", false);
  }
});
</script>

<style lang="scss" scoped></style>
