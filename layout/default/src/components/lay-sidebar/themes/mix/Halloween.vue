<script setup lang="ts">
import BaseCustomMix from "./BaseCustomMix.vue";
import "../../components/custom-menu/themes/halloween.scss";
</script>

<template>
  <div class="halloween-mix-wrapper">
    <BaseCustomMix
      theme-class="default-mix halloween-mix"
      popper-class="halloween-custom-popper"
      menu-item-class="halloween-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
.halloween-mix-wrapper {
  width: 100%;
  height: 100%;

  :deep(.halloween-mix) {
    // 混合导航背景 - 万圣节主题
    background: linear-gradient(180deg, rgba(44, 0, 62, 0.95), rgba(26, 0, 38, 0.9)) !important;
    border-bottom: 2px solid rgba(255, 117, 24, 0.4) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5) !important;

    .halloween-mix-item,
    .more-menu > .custom-sub-menu__title {
      --custom-menu-text-color: #ffb36a;
      --custom-menu-item-bg: transparent;
      --custom-menu-item-hover-bg: rgba(255, 117, 24, 0.15);
      --custom-menu-item-hover-color: #76ff03;
      --custom-menu-item-active-bg: linear-gradient(135deg, #ff7518, #ff9f5a);
      --custom-menu-item-active-color: #2c003e;
      --custom-menu-item-active-shadow: 0 0 10px rgba(255, 117, 24, 0.45);
      color: #ffb36a !important;
      border: 1px solid transparent;
      border-radius: 8px;
    }

    .halloween-mix-item:hover,
    .more-menu > .custom-sub-menu__title:hover {
      border-color: rgba(255, 117, 24, 0.26);
    }

    .halloween-mix-item .menu-icon,
    .more-menu .menu-icon,
    .more-menu .custom-sub-menu__icon-arrow {
      color: #ff7518 !important;
    }

    .halloween-mix-item:hover .menu-icon,
    .halloween-mix-item:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .menu-icon,
    .more-menu > .custom-sub-menu__title:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .custom-sub-menu__icon-arrow {
      color: #76ff03 !important;
    }

    .halloween-mix-item.is-active .menu-icon,
    .halloween-mix-item.is-active .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .menu-icon,
    .more-menu.is-active > .custom-sub-menu__title .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .custom-sub-menu__icon-arrow {
      color: #2c003e !important;
      font-weight: 700;
    }
  }
}

// 深色模式适配
:global(html.dark) {
  .halloween-mix-wrapper :deep(.halloween-mix) {
    background: linear-gradient(180deg, rgba(44, 0, 62, 0.98), rgba(26, 0, 38, 0.95)) !important;
    border-bottom: 2px solid rgba(255, 117, 24, 0.5) !important;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.7) !important;
  }
}
</style>
