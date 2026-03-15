<template>
  <el-dropdown-menu v-bind="$attrs"><slot /></el-dropdown-menu>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
