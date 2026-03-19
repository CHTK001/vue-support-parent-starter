<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
import SpringFestivalSidebarItem from "../components/themes/SpringFestivalSidebarItem.vue";
</script>

<template>
  <BaseSidebar
    theme-class="default-sidebar spring-festival-sidebar"
    :sidebar-item-component="SpringFestivalSidebarItem"
  />
</template>
