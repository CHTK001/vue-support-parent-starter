<script setup lang="ts" name="OvxFlow">
import type { OvData } from "../types";

defineProps<{ data: OvData }>();
</script>

<template>
  <div class="ovx-ovx-stub ovx-flow-stub">
    <span>OvxFlow</span>
  </div>
</template>

<style scoped>
.ovx-ovx-stub {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--text-tertiary);
  background: var(--bg-container);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
}
</style>
