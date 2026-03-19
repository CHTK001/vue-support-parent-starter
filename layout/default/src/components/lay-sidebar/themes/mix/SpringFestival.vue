<script setup lang="ts">
import BaseCustomMix from "./BaseCustomMix.vue";
import "../../components/custom-menu/themes/spring-festival.scss";
</script>

<template>
  <div class="spring-festival-mix-wrapper">
    <BaseCustomMix
      theme-class="default-mix spring-festival-mix"
      popper-class="spring-festival-custom-popper"
      menu-item-class="spring-festival-mix-item"
    />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-mix-wrapper {
  width: 100%;
  height: 100%;

  :deep(.spring-festival-mix) {
    .spring-festival-mix-item,
    .more-menu > .custom-sub-menu__title {
      --custom-menu-text-color: #ffd76a;
      --custom-menu-item-bg: transparent;
      --custom-menu-item-hover-bg: linear-gradient(
        135deg,
        rgba(255, 215, 106, 0.12),
        rgba(179, 0, 27, 0.22)
      );
      --custom-menu-item-hover-color: #fff1c4;
      --custom-menu-item-active-bg: linear-gradient(135deg, #8b0000, #b3001b);
      --custom-menu-item-active-color: #fff1c4;
      --custom-menu-item-active-shadow:
        0 10px 18px -14px rgba(0, 0, 0, 0.62),
        inset 0 1px 0 rgba(255, 233, 168, 0.14);
      color: #ffd76a !important;
      border: 1px solid transparent;
      border-radius: 8px;
    }

    .spring-festival-mix-item:hover,
    .more-menu > .custom-sub-menu__title:hover {
      border-color: rgba(255, 215, 106, 0.26);
    }

    .spring-festival-mix-item.is-active,
    .more-menu.is-active > .custom-sub-menu__title {
      border-color: rgba(255, 215, 106, 0.42);
    }

    .spring-festival-mix-item .menu-icon,
    .more-menu .menu-icon,
    .more-menu .custom-sub-menu__icon-arrow {
      color: #ffd76a !important;
    }

    .spring-festival-mix-item:hover .menu-icon,
    .spring-festival-mix-item:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .menu-icon,
    .more-menu > .custom-sub-menu__title:hover .menu-title,
    .more-menu > .custom-sub-menu__title:hover .custom-sub-menu__icon-arrow {
      color: #fff1c4 !important;
    }

    .spring-festival-mix-item.is-active .menu-icon,
    .spring-festival-mix-item.is-active .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .menu-icon,
    .more-menu.is-active > .custom-sub-menu__title .menu-title,
    .more-menu.is-active > .custom-sub-menu__title .custom-sub-menu__icon-arrow {
      color: #fff1c4 !important;
    }
  }
}
</style>
