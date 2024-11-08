<script setup lang="ts">
import { markRaw } from "vue";
import Layout from "./layout.vue";
const IndexLayout = markRaw(Layout);
</script>

<template>
  <div class="main">
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
