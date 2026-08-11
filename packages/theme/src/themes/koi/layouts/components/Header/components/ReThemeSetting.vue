<template>
  <!-- 设置 -->
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-rotate-i"
    @click="handleThemeDialog"
  >
    <el-tooltip :content="$t('header.settings')">
      <ReIcon name="koi-setting" size="20" />
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
