<script setup lang="ts">
import Layout from "./layout.vue";
</script>

<template>
  <div class="main">
    <Layout />
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
