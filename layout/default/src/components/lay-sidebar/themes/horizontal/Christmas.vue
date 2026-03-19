<script setup lang="ts">
import BaseCustomHorizontal from "./BaseCustomHorizontal.vue";
import ChristmasCustomSidebarItem from "../../components/custom-menu/themes/ChristmasCustomSidebarItem.vue";
import "../../components/custom-menu/themes/christmas.scss";
</script>

<template>
  <BaseCustomHorizontal
    theme-class="default-horizontal christmas-horizontal"
    popper-class="christmas-custom-popper"
    :sidebar-item-component="ChristmasCustomSidebarItem"
  />
</template>
