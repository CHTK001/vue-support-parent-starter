<template>
  <div class="shell">
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(214, 142, 56, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(176, 65, 48, 0.18), transparent 30%),
    linear-gradient(135deg, #171410 0%, #241d17 42%, #f4efe7 42%, #f7f3ec 100%);
  color: #1f1a16;
}

.content {
  min-height: 100%;
  padding: 22px 48px;
}

@media (max-width: 720px) {
  .content {
    padding: 16px;
  }
}
</style>
