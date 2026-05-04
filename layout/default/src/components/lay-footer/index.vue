<script lang="ts" setup>
import FooterContent from "./components/FooterContent.vue";
</script>

<template>
  <footer class="layout-footer">
    <FooterContent />
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 100%;
  height: 48px;
  font-size: 13px;
  // 毛玻璃背景
  background: var(--glass-bg, rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  border-top: 1px solid var(--dt-border-color, rgba(0, 0, 0, 0.06));
  transition:
    background var(--dt-transition-normal, 0.3s ease),
    color var(--dt-transition-normal, 0.3s ease),
    border-color var(--dt-transition-normal, 0.3s ease);

  // 深色模式
  html.dark & {
    background: var(--glass-bg, rgba(20, 20, 30, 0.7));
    border-top-color: rgba(255, 255, 255, 0.06);
  }
}


</style>
