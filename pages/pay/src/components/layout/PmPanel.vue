<template>
  <section class="pm-panel">
    <div v-if="title || $slots.head" class="pm-panel__head">
      <div>
        <h2 v-if="title" class="pm-panel__title">{{ title }}</h2>
        <p v-if="description" class="pm-panel__desc">{{ description }}</p>
        <slot name="head" />
      </div>
      <slot name="head-actions" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>
