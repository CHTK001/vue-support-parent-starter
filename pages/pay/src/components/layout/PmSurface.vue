<template>
  <header class="pm-surface">
    <div>
      <p v-if="eyebrow" class="pm-surface__eyebrow">{{ eyebrow }}</p>
      <h1 v-if="title" class="pm-surface__title">{{ title }}</h1>
      <p v-if="description" class="pm-surface__desc">{{ description }}</p>
      <slot name="info" />
    </div>
    <div v-if="$slots.actions || actionsSlot" class="pm-surface__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title?: string;
  description?: string;
  actionsSlot?: boolean;
}>();
</script>
