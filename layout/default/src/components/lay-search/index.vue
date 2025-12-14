<script setup lang="ts">
import { useBoolean } from "../../hooks/useBoolean";
import SearchModal from "./components/SearchModal.vue";

const { bool: show, toggle } = useBoolean();
function handleSearch() {
  toggle();
}
</script>

<template>
  <div>
    <div class="search-container flex-c cursor-pointer navbar-bg-hover" @click="handleSearch">
      <IconifyIconOffline icon="ri:search-line" />
    </div>
    <SearchModal v-model:value="show" />
  </div>
</template>
<style scoped lang="scss">
.search-container {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.search-container,
:deep(.search-container) {
  svg {
    background: transparent !important;
  }
}
</style>
