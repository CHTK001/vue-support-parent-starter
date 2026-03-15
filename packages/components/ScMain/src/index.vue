<template>
  <el-main v-bind="$attrs"><slot /></el-main>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
