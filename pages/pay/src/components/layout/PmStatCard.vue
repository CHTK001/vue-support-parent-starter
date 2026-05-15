<template>
  <article class="pm-stat-card">
    <span class="pm-stat-card__label">{{ label }}</span>
    <strong class="pm-stat-card__value"><slot name="value" /></strong>
    <span v-if="$slots.sub || sub" class="pm-stat-card__sub">
      <slot name="sub">{{ sub }}</slot>
    </span>
    <span v-if="hint" class="pm-stat-card__hint">{{ hint }}</span>
    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
  sub?: string;
}>();
</script>

<style scoped>
.pm-stat-card__sub {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--pm-text-primary, #070b15);
  line-height: 1.2;
}
</style>
