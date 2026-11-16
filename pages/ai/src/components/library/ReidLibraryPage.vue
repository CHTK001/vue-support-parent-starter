<template>
  <!--
    人脸重识别库（全页，路由 /reid-library）

    与「设置中心 → 底库 → 重识别库」共用 ReidLibraryPanel。
    重识别页（/face-reid）看轨迹与观测结果，这里管底层数据（每行两套向量）。
  -->
  <div class="lib-standalone" data-page="reid-library">
    <ReidLibraryPanel />
  </div>
</template>

<script setup lang="ts">
import ReidLibraryPanel from '../setting/ReidLibraryPanel.vue'
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
