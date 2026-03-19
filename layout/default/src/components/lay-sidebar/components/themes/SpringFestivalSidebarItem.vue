<script setup lang="ts">
import { provide } from "vue";
import type { MenuType } from "@repo/core";
import type { PropType } from "vue";
import BaseSidebarItem from "../BaseSidebarItem.vue";

defineProps({
  item: {
    type: Object as PropType<MenuType>,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: "",
  },
});

import SpringFestivalSidebarItem from "./SpringFestivalSidebarItem.vue";
provide("themeSidebarItem", SpringFestivalSidebarItem);
</script>

<template>
  <div class="spring-festival-sidebar-item-wrapper">
    <BaseSidebarItem :item="item" :is-nest="isNest" :base-path="basePath" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-sidebar-item-wrapper {
  --festival-red: #8b0000;
  --festival-red-light: #b3001b;
  --festival-gold: #ffd76a;
  --festival-gold-bright: #ffe9a8;

  :deep(.sidebar-menu-item),
  :deep(.el-sub-menu__title) {
    margin: 4px 8px;
    border-radius: 8px;
    border: 1px solid transparent;
    color: var(--festival-gold);
    transition: all 0.28s ease;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(255, 215, 106, 0.12),
        rgba(179, 0, 27, 0.24)
      );
      color: var(--festival-gold-bright);
      border-color: rgba(255, 215, 106, 0.26);
      box-shadow: 0 8px 16px -14px rgba(255, 215, 106, 0.7);
      transform: translateX(3px);

      .el-icon,
      .sub-menu-icon svg {
        color: var(--festival-gold-bright);
        transform: scale(1.08);
      }
    }

    .el-icon,
    .sub-menu-icon svg {
      color: var(--festival-gold);
      transition: all 0.28s ease;
    }
  }

  :deep(.sidebar-menu-item.is-active) {
    background: linear-gradient(
      135deg,
      rgba(139, 0, 0, 0.94),
      rgba(179, 0, 27, 0.9)
    ) !important;
    color: var(--festival-gold-bright) !important;
    border-color: rgba(255, 215, 106, 0.44) !important;
    box-shadow:
      0 10px 18px -14px rgba(0, 0, 0, 0.65),
      inset 0 1px 0 rgba(255, 233, 168, 0.18);
    font-weight: 700;

    .el-icon,
    .sub-menu-icon svg {
      color: var(--festival-gold-bright) !important;
      filter: drop-shadow(0 0 8px rgba(255, 215, 106, 0.45));
    }

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 66%;
      background: linear-gradient(180deg, #fff1c4, var(--festival-gold));
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 10px rgba(255, 215, 106, 0.45);
    }

    &::after {
      content: "福";
      position: absolute;
      right: 12px;
      font-size: 13px;
      font-family: "STKaiti", "KaiTi", serif;
      color: rgba(255, 233, 168, 0.78);
      text-shadow: 0 0 10px rgba(255, 215, 106, 0.35);
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    background: linear-gradient(
      135deg,
      rgba(139, 0, 0, 0.82),
      rgba(179, 0, 27, 0.74)
    ) !important;
    color: var(--festival-gold-bright) !important;
    border-color: rgba(255, 215, 106, 0.32) !important;
    font-weight: 700;

    .el-icon,
    .sub-menu-icon svg,
    .el-sub-menu__icon-arrow {
      color: var(--festival-gold-bright) !important;
    }
  }
}

:global(html[data-skin="spring-festival"]) {
  .el-menu--popup {
    background: linear-gradient(
      180deg,
      rgba(107, 0, 0, 0.98),
      rgba(72, 0, 0, 0.96)
    ) !important;
    border: 1px solid rgba(255, 215, 106, 0.34) !important;
    box-shadow:
      0 16px 36px rgba(0, 0, 0, 0.38),
      0 0 18px rgba(255, 215, 106, 0.18) !important;
    backdrop-filter: blur(16px);

    .el-menu-item {
      color: #ffd76a !important;

      &:hover {
        background: rgba(255, 215, 106, 0.12) !important;
        color: #fff1c4 !important;
      }

      &.is-active {
        background: linear-gradient(
          135deg,
          rgba(139, 0, 0, 0.92),
          rgba(179, 0, 27, 0.84)
        ) !important;
        color: #fff1c4 !important;
        border: 1px solid rgba(255, 215, 106, 0.28);
      }
    }
  }
}
</style>
