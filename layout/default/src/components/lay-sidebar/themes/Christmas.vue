<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
import ChristmasSidebarItem from "../components/themes/ChristmasSidebarItem.vue";
</script>

<template>
  <BaseSidebar
    theme-class="default-sidebar christmas-sidebar"
    :sidebar-item-component="ChristmasSidebarItem"
  />
</template>
