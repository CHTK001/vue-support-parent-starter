<script setup lang="ts">
import BaseCustomMix from "./BaseCustomMix.vue";
import "../../components/custom-menu/themes/christmas.scss";
</script>

<template>
  <div class="christmas-mix-wrapper">
    <BaseCustomMix
      theme-class="default-mix christmas-mix"
      popper-class="christmas-custom-popper"
      menu-item-class="christmas-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
.christmas-mix-wrapper {
  width: 100%;
  height: 100%;

  :deep(.christmas-mix) {
    .christmas-mix-item,
    .more-menu > .custom-sub-menu__title {
      --custom-menu-text-color: #fffaf0;
      --custom-menu-item-bg: transparent;
      --custom-menu-item-hover-bg: linear-gradient(
        135deg,
        rgba(198, 40, 40, 0.72),
        rgba(229, 57, 53, 0.62)
      );
      --custom-menu-item-hover-color: #fff;
      --custom-menu-item-active-bg: linear-gradient(135deg, #c62828, #e53935);
      --custom-menu-item-active-color: #fff;
      --custom-menu-item-active-shadow: 0 3px 12px rgba(198, 40, 40, 0.4);
      color: #fffaf0 !important;
      border: 1px solid transparent;
      border-radius: 8px;
    }

    .christmas-mix-item:hover,
    .more-menu > .custom-sub-menu__title:hover {
      border-color: rgba(255, 215, 0, 0.24);
    }

    .christmas-mix-item.is-active,
    .more-menu.is-active > .custom-sub-menu__title {
      border-bottom: 2px solid #ffd700 !important;
    }

    .christmas-mix-item .menu-icon,
    .more-menu .menu-icon {
      color: #ffd700 !important;
    }

    .christmas-mix-item:hover .menu-icon,
    .christmas-mix-item:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .menu-icon,
    .more-menu > .custom-sub-menu__title:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .custom-sub-menu__icon-arrow,
    .christmas-mix-item.is-active .menu-icon,
    .christmas-mix-item.is-active .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .menu-icon,
    .more-menu.is-active > .custom-sub-menu__title .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .custom-sub-menu__icon-arrow {
      color: #fff !important;
    }
  }
}
</style>
