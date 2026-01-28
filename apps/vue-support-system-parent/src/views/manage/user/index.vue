<script setup lang="ts">
import { defineAsyncComponent, markRaw } from "vue";
const IndexLayout = defineAsyncComponent(() => import("./layout.vue"));
</script>

<template>
  <div class="system-container main">
    <IndexLayout />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
