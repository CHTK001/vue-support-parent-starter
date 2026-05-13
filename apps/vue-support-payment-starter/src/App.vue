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
    radial-gradient(ellipse at 15% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 15%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(79, 70, 229, 0.04) 0%, transparent 50%),
    linear-gradient(180deg, #f4f6fb 0%, #f8fafe 50%, #f0f4fe 100%);
  color: #1a2332;
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
