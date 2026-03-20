<script lang="ts" setup>
import FooterContent from "./components/FooterContent.vue";
</script>

<template>
<<<<<<< HEAD
  <footer class="layout-footer">
    <FooterContent />
=======
  <footer
    class="layout-footer text-[rgba(0,0,0,0.6)] dark:text-[rgba(220,220,242,0.8)]"
  >
    Copyright © 2020-present
    <a
      class="hover:text-primary"
      href="https://github.com/pure-admin"
      target="_blank"
      >&nbsp;{{ TITLE }}</a
    >
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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

<<<<<<< HEAD
// 春节 / 新年主题
=======
// 春节主题
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
:global(html[data-skin="spring-festival"]),
:global(html[data-skin="new-year"]) {
  .layout-footer {
    background: linear-gradient(180deg, rgba(107, 0, 0, 0.85), rgba(76, 0, 0, 0.9)) !important;
    border-top: 1px solid rgba(255, 215, 0, 0.3) !important;
    color: rgba(255, 215, 0, 0.8) !important;
  }
}

// 中秋主题
:global(html[data-skin="mid-autumn"]) .layout-footer {
  background: linear-gradient(180deg, rgba(26, 35, 126, 0.85), rgba(13, 16, 82, 0.9)) !important;
  border-top: 1px solid rgba(255, 213, 79, 0.3) !important;
  color: rgba(255, 213, 79, 0.8) !important;
}

// 圣诞主题
:global(html[data-skin="christmas"]) .layout-footer {
  background: linear-gradient(180deg, rgba(17, 70, 28, 0.85), rgba(10, 45, 18, 0.9)) !important;
  border-top: 1px solid rgba(255, 215, 0, 0.25) !important;
  color: rgba(255, 215, 0, 0.8) !important;
}

// 万圣节主题
:global(html[data-skin="halloween"]) .layout-footer {
  background: linear-gradient(180deg, rgba(44, 0, 62, 0.85), rgba(26, 0, 38, 0.9)) !important;
  border-top: 1px solid rgba(255, 117, 24, 0.3) !important;
  color: rgba(255, 117, 24, 0.8) !important;
}
<<<<<<< HEAD

// 未来科技主题
:global(html[data-skin="future-tech"]) .layout-footer {
  background: linear-gradient(180deg, rgba(5, 10, 31, 0.85), rgba(10, 26, 58, 0.9)) !important;
  border-top: 1px solid rgba(0, 255, 255, 0.3) !important;
  color: rgba(0, 255, 255, 0.7) !important;
}
=======
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
</style>
