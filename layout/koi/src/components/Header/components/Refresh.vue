<template>
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-rotate-i" @click="handleRefresh">
    <el-tooltip content="Refresh cache">
      <KoiGlobalIcon name="koi-refresh-arrow" size="17" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useKoiGlobalStore } from "../../../stores/global";

const globalStore = useKoiGlobalStore();
const handleRefresh = () => {
  globalStore.$reset();
  window.location.reload();
};
</script>

<style lang="scss" scoped></style>
