<template>
  <el-backtop v-bind="$attrs">
    <slot />
  </el-backtop>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
