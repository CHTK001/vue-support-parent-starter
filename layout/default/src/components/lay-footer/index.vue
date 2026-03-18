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
  transition: background var(--dt-transition-normal, 0.3s ease),
    color var(--dt-transition-normal, 0.3s ease),
    border-color var(--dt-transition-normal, 0.3s ease);

  // 深色模式
  html.dark & {
    background: var(--glass-bg, rgba(20, 20, 30, 0.7));
    border-top-color: rgba(255, 255, 255, 0.06);
  }
}

// 春节 / 新年主题
:global(html[data-skin="spring-festival"]),
:global(html[data-skin="new-year"]) {
  .layout-footer {
    color: rgba(198, 40, 40, 0.7) !important;
  }
}

// 中秋主题
:global(html[data-skin="mid-autumn"]) .layout-footer {
  color: rgba(255, 193, 7, 0.7) !important;
}

// 圣诞主题
:global(html[data-skin="christmas"]) .layout-footer {
  color: rgba(34, 139, 34, 0.7) !important;
}

// 万圣节主题
:global(html[data-skin="halloween"]) .layout-footer {
  color: rgba(255, 117, 24, 0.7) !important;
}
</style>
