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

// 万圣节主题
:global(html[data-skin="halloween"]) .layout-footer {
  color: rgba(255, 117, 24, 0.7) !important;

  a {
    color: #ff7518 !important;
    text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);

    &:hover {
      color: #76ff03 !important;
      text-shadow: 0 0 5px rgba(118, 255, 3, 0.5);
    }
  }
}
</style>
