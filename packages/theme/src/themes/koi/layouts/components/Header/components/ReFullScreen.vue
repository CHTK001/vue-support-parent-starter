<template>
  <!-- 全屏：icons-animated 动画箭头图标（hover/focus 播放），故去掉 koi-scale-i 容器缩放 -->
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center" @click="toggle">
    <el-tooltip :content="globalStore.isFullScreen === false ? $t('header.fullScreen') : $t('header.exitFullScreen')">
      <ReIcon name="anim:tabler:arrows-maximize" size="18" v-if="!globalStore.isFullScreen" />
      <ReIcon name="anim:tabler:arrows-minimize" size="18" v-else  />
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
