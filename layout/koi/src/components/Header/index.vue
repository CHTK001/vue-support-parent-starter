<template>
  <div class="header-box">
    <div class="header-left">
      <Collapse></Collapse>
      <BreadCrumb v-if="showBreadCrumb" class="<md:hidden"></BreadCrumb>
    </div>
    <Toolbar></Toolbar>
  </div>
</template>

<script setup lang="ts">
import Collapse from "./components/Collapse.vue";
import BreadCrumb from "./components/BreadCrumb.vue";
import Toolbar from "./components/Toolbar.vue";

withDefaults(
  defineProps<{
    showBreadCrumb?: boolean;
  }>(),
  { showBreadCrumb: true }
);
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;
.header-box {
  position: relative;
  display: flex;
  justify-content: space-between;
  height: $aside-header-height;
  .header-left { display: flex; flex: 1; align-items: center; min-width: 0; overflow: hidden; white-space: nowrap; margin-right: 8px; }
}
</style>
