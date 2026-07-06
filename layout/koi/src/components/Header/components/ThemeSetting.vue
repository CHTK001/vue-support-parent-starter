<template>
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-rotate-i" @click="handleThemeDialog">
    <el-tooltip content="Settings">
      <KoiGlobalIcon name="koi-setting" size="20" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import mittBus from "../../../utils/mittBus";

const handleThemeDialog = () => {
  mittBus.emit("handleThemeConfig");
};
</script>

<style lang="scss" scoped></style>
