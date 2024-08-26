<script setup lang="ts">
import DeptLayout from "./layout.vue";
</script>
<template>
  <div class="h-full">
    <el-container>
      <el-aside width="300px">
        <DeptLayout />
      </el-aside>
      <el-container>
        <el-header />
        <el-main class="nopadding" />
      </el-container>
    </el-container>
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
