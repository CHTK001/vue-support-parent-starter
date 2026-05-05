<template>
  <section class="pm-toolbar">
    <div class="pm-toolbar__row">
      <div class="pm-toolbar__form">
        <slot name="form" />
      </div>
      <div class="pm-toolbar__actions">
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
