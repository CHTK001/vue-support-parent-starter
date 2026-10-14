<script setup lang="ts">
/**
 * MarkingView —— 管理端「AI 阅卷」页
 *
 * <p>页面本体收敛到共享组件 {@link MarkingWorkbench}（mode=admin），
 * 与老师端「阅卷」tab 复用同一套 UI 与样式，避免两端各写一套排布后
 * 出现高度/溢出等样式不一致。</p>
 */
import MarkingWorkbench from '../components/marking/MarkingWorkbench.vue';
</script>

<template>
  <div class="marking-view">
    <MarkingWorkbench mode="admin" />
  </div>
</template>

<style scoped>
.marking-view {
  height: 100%;
}
</style>
