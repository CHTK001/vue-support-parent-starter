<template>
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
    @click="handleToggleCollapse"
  >
    <el-icon :size="20">
      <Fold v-if="!globalStore.isCollapse" />
      <Expand v-if="globalStore.isCollapse" />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { Fold, Expand } from "@element-plus/icons-vue";
import { useKoiGlobalStore } from "../../../stores/global";

const globalStore = useKoiGlobalStore();

const handleToggleCollapse = () => {
  globalStore.isCollapse = !globalStore.isCollapse;
};
</script>

<style lang="scss" scoped></style>
