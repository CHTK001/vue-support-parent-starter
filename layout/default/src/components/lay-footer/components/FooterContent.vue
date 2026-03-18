<script setup lang="ts">
/**
 * FooterContent — 页脚内容区
 * 版权信息 + 项目链接
 */
import { getConfig } from "@repo/config";

const TITLE = getConfig("Title");
</script>

<template>
  <div class="footer-content">
    <span class="footer-copyright">Copyright © 2020-present</span>
    <a
      class="footer-link"
      href="https://github.com/pure-admin"
      target="_blank"
      rel="noopener noreferrer"
    >{{ TITLE }}</a>
  </div>
</template>

<style lang="scss" scoped>
.footer-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.footer-link {
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: color var(--dt-transition-fast, 0.15s ease);

  &:hover {
    color: var(--el-color-primary);
  }
}

// 春节 / 新年主题
:global(html[data-skin="spring-festival"]),
:global(html[data-skin="new-year"]) {
  .footer-link {
    color: #e53935;
    &:hover { color: #c62828; }
  }
}

// 中秋主题
:global(html[data-skin="mid-autumn"]) .footer-link {
  color: #ffc107;
  &:hover { color: #ff9800; }
}

// 圣诞主题
:global(html[data-skin="christmas"]) .footer-link {
  color: #c41e3a;
  &:hover { color: #228b22; }
}

// 万圣节主题
:global(html[data-skin="halloween"]) .footer-link {
  color: #ff7518;
  text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);
  &:hover {
    color: #76ff03;
    text-shadow: 0 0 5px rgba(118, 255, 3, 0.5);
  }
}
</style>
