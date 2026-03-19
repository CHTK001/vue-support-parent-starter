<script setup lang="ts">
import BaseCustomHorizontal from "./BaseCustomHorizontal.vue";
import DefaultCustomSidebarItem from "../../components/custom-menu/themes/DefaultCustomSidebarItem.vue";
import "../../components/custom-menu/themes/default.scss";
</script>

<template>
  <BaseCustomHorizontal
    theme-class="default-horizontal 8bit-horizontal"
    popper-class="default-custom-popper"
    :sidebar-item-component="DefaultCustomSidebarItem"
  />
</template>
