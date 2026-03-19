<script setup lang="ts">
import BaseCustomHorizontal from "./BaseCustomHorizontal.vue";
import SpringFestivalCustomSidebarItem from "../../components/custom-menu/themes/SpringFestivalCustomSidebarItem.vue";
import "../../components/custom-menu/themes/spring-festival.scss";
</script>

<template>
  <BaseCustomHorizontal
    theme-class="default-horizontal spring-festival-horizontal"
    popper-class="spring-festival-custom-popper"
    :sidebar-item-component="SpringFestivalCustomSidebarItem"
  />
</template>
