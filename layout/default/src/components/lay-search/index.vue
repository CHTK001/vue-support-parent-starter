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
<style lang="scss">
// 基础样式（不使用 scoped 以支持主题覆盖）
.search-container {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.25s ease;

  svg {
    background: transparent !important;
    transition: all 0.25s ease;
  }
}
</style>
