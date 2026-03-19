<script setup lang="ts">
import BaseSidebar from "./BaseSidebar.vue";
import DefaultSidebarItem from "../components/themes/DefaultSidebarItem.vue";
</script>

<template>
  <BaseSidebar
    theme-class="default-sidebar 8bit-sidebar"
    :sidebar-item-component="DefaultSidebarItem"
  />
</template>
