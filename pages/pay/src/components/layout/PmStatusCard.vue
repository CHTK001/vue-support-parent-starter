<template>
  <div class="pm-status-card">
    <span class="pm-status-card__label">{{ label }}</span>
    <strong class="pm-status-card__value"><slot name="value" /></strong>
    <span v-if="hint" class="pm-status-card__hint">{{ hint }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
}>();
</script>
