<template>
  <el-aside v-bind="$attrs"><slot /></el-aside>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
