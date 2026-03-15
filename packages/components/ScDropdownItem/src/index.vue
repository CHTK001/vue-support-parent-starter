<template>
  <el-dropdown-item v-bind="$attrs"><slot /></el-dropdown-item>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
