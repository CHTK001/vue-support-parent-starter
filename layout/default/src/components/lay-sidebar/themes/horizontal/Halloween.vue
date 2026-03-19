<script setup lang="ts">
import BaseCustomHorizontal from "./BaseCustomHorizontal.vue";
import HalloweenCustomSidebarItem from "../../components/custom-menu/themes/HalloweenCustomSidebarItem.vue";
import "../../components/custom-menu/themes/halloween.scss";
</script>

<template>
  <BaseCustomHorizontal
    theme-class="default-horizontal halloween-horizontal"
    popper-class="halloween-custom-popper"
    :sidebar-item-component="HalloweenCustomSidebarItem"
  />
</template>
