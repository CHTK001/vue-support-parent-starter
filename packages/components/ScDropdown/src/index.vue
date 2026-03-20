<template>
  <el-dropdown v-bind="$attrs">
    <slot />
    <template v-if="$slots.dropdown" #dropdown>
      <slot name="dropdown" />
    </template>
  </el-dropdown>
</template>
<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
