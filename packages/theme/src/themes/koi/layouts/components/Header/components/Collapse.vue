<template>
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
    @click="handleToggleCollapse"
  >
    <el-icon :size="20">
      <ReIcon name="koi-left" width="20px" height="20px" v-if="!globalStore.isCollapse"></ReIcon>
      <ReIcon name="koi-right" width="20px" height="20px" v-if="globalStore.isCollapse"></ReIcon>
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();

/** 切换图标 */
const handleToggleCollapse = () => {
  // 定义图标切换变量[true-折叠 false-展开]
  globalStore.isCollapse = !globalStore.isCollapse;
};
</script>

<style lang="scss" scoped></style>
