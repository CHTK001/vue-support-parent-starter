<template>
  <article class="pm-stat-card">
    <span class="pm-stat-card__label">{{ label }}</span>
    <strong class="pm-stat-card__value"><slot name="value" /></strong>
    <span v-if="hint" class="pm-stat-card__hint">{{ hint }}</span>
    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
}>();
</script>
