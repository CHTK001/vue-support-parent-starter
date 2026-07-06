<template>
  <div class="header-right" :class="{ 'is-header-inverted': isHeaderInverted }">
    <SearchMenu />
    <Refresh />
    <Dark />
    <Language />
    <FullScreen />
    <ThemeSetting />
    <HeaderClock />
    <User />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useKoiGlobalStore } from "../../../stores/global";
import User from "./User.vue";
import FullScreen from "./FullScreen.vue";
import Dark from "./Dark.vue";
import ThemeSetting from "./ThemeSetting.vue";
import Refresh from "./Refresh.vue";
import Language from "./Language.vue";
import SearchMenu from "./SearchMenu.vue";
import HeaderClock from "./HeaderClock.vue";

const globalStore = useKoiGlobalStore();
const { headerInverted, asideInverted, layout, isDark } = storeToRefs(globalStore);

const isHeaderInverted = computed(() => {
  if (isDark.value) return false;
  if (headerInverted.value) return true;
  return layout.value === "horizontal" && asideInverted.value;
});
</script>

<style lang="scss" scoped>
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 100%;
  position: relative;
  z-index: 2;
  padding: 2px 6px;
  gap: 4px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  &.is-header-inverted {
    background-color: var(--el-header-bg-color);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1px solid var(--el-header-toolbar-border-color);
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  }

  html.dark & {
    background: rgba(30, 30, 30, 0.65);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
}
</style>
