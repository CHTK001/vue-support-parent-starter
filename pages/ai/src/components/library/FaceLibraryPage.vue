<template>
  <!--
    人脸库（全页，路由 /face-library）

    与「设置中心 → 底库 → 人脸底库」是**同一个组件**（FaceLibraryPanel），
    这里只补一层页面外壳：内容区滚动 + 与其它管理页一致的 24px 内边距。

    为什么要有独立路由：底库是日常要增删的东西，只藏在设置中心里时，
    用户从主页侧栏找不到入口（2026-11-16 用户口径：底库三项单独成组）。
    面板自己带页头（人脸底库 / 统计 / 登记入口），所以这里不再加 PageHeader。
  -->
  <div class="lib-standalone" data-page="face-library">
    <FaceLibraryPanel />
  </div>
</template>

<script setup lang="ts">
import FaceLibraryPanel from '../setting/FaceLibraryPanel.vue'
</script>

<style scoped>
.lib-standalone {
  height: 100%;
  overflow: auto;
  padding: 24px;
  box-sizing: border-box;
  background: var(--bg-page, var(--el-bg-color-page, #f6f7f9));
}
</style>
