<template>
  <!--
    采集管理（/edu/collect）—— 复用 @pages/collect 的门面页面。
    CollectorView 依赖较多（采集器列表 / 流程弹窗 / 调度表格等），
    用通用 ReAsync 封装异步加载 + 骨架动画 + 淡入过渡，避免白屏突然出现。
  -->
  <div class="collector-page">
    <ReAsync
      :loader="loadCollector"
      min-height="100%"
      skeleton-height="300px"
      fill-height
    />
  </div>
</template>

<script setup lang="ts">
const loadCollector = () => import("@pages/collect/src/views/CollectorView.vue");
</script>

<style scoped>
.collector-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
