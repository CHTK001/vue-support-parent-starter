<template>
  <!-- 设置：icons-animated 动画齿轮（hover/focus 播放），故去掉 koi-rotate-i 整圈自转 -->
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
    @click="handleThemeDialog"
  >
    <el-tooltip :content="$t('header.settings')">
      <ReIcon name="anim:tabler:settings" size="20" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { mittBus } from "@repo/utils";

/** 打开主题配置 */
const handleThemeDialog = () => {
   mittBus.emit("handleThemeConfig");
};
</script>

<style lang="scss" scoped></style>
