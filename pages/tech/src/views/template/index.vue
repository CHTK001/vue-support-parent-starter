<template>
  <TuiProvider>
    <div class="tech-template">
      <TuiThemeToggle class="theme-toggle" />
      <div class="template-content">
        <slot />
      </div>
    </div>
  </TuiProvider>
</template>

<script setup lang="ts">
defineOptions({ name: "TechTemplatePage" });
</script>

<style scoped>
.tech-template {
  min-height: 100vh;
  position: relative;
}
.theme-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}
.template-content {
  padding: 80px 24px 24px;
}
</style>
