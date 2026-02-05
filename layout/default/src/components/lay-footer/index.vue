<script lang="ts" setup>
import { getConfig } from "@repo/config";

const TITLE = getConfig("Title");
</script>

<template>
  <footer class="layout-footer text-[rgba(0,0,0,0.6)] dark:text-[rgba(220,220,242,0.8)]">
    Copyright © 2020-present
    <a class="hover:text-primary" href="https://github.com/pure-admin" target="_blank">&nbsp;{{ TITLE }}</a>
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 0 8px;
  font-size: 14px;
  transition: color 0.3s ease;

  a {
    transition: color 0.3s ease;
  }
}

// 赛博朋克主题
:global(html[data-skin="cyberpunk"]) .layout-footer {
  color: rgba(0, 255, 255, 0.6) !important;

  a {
    color: #00ffff !important;
    text-shadow: 0 0 6px rgba(0, 255, 255, 0.4);

    &:hover {
      color: #ff00ff !important;
      text-shadow: 0 0 8px rgba(255, 0, 255, 0.5);
    }
  }
}

// 春节主题
:global(html[data-skin="spring-festival"]),
:global(html[data-skin="new-year"]) {
  .layout-footer {
    color: rgba(198, 40, 40, 0.7) !important;

    a {
      color: #e53935 !important;

      &:hover {
        color: #c62828 !important;
      }
    }
  }
}

// 中秋主题
:global(html[data-skin="mid-autumn"]) .layout-footer {
  color: rgba(255, 193, 7, 0.7) !important;

  a {
    color: #ffc107 !important;

    &:hover {
      color: #ff9800 !important;
    }
  }
}

// 圣诞主题
:global(html[data-skin="christmas"]) .layout-footer {
  color: rgba(34, 139, 34, 0.7) !important;

  a {
    color: #c41e3a !important;

    &:hover {
      color: #228b22 !important;
    }
  }
}
</style>
