<template>
  <el-menu-item class="sc-menu-item" :index="index" :route="route" :disabled="disabled" v-bind="$attrs">
    <slot />
  </el-menu-item>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  index: { type: String, required: true },
  route: { type: Object as PropType<any>, default: null },
  disabled: { type: Boolean, default: false },
});
</script>

<style scoped>
.sc-menu-item {
  width: 100%;
}
</style>
