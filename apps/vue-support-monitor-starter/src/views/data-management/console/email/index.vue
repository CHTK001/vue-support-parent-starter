<template>
  <div class="page">
    <el-empty description="邮件控制台功能开发中" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
const id = computed(() => Number(useRoute().query.id));
</script>
<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
