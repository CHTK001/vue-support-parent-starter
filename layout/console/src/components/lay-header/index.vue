<template>
  <div :class="{ 'fixed-header': set.fixedHeader }" :style="[set.hideTabs && layout.includes('horizontal') ? (isDark ? 'box-shadow: 0 1px 4px var(--el-color-info-dark-2)' : 'box-shadow: 0 1px 4px var(--el-border-color-extra-light)') : '']">
    <LayNavbar ref="layNavbarRef" @toggleMenu="toggleMenu" @close="triggerClose" />
  </div>
</template>
<script setup lang="ts">
import { useDark, useGlobal } from "@pureadmin/utils";
import { useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { computed, reactive, shallowRef } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { setType } from "../../types";
import LayNavbar from "../lay-navbar/index.vue";

const emit = defineEmits();
const { layout } = useLayout();
const { isDark } = useDark();
const { $storage } = useGlobal<any>();
const pureSetting = useSettingStoreHook();
const layNavbarRef = shallowRef();
const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile",
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  }),
});

const toggleMenu = async (value) => {
  emit("toggleMenu", value);
};
const triggerClose = async (value) => {
  emit("close");
};

const triggerCloseMenu = async () => {
  layNavbarRef.value.triggerCloseMenu();
};
defineExpose({
  triggerCloseMenu,
});
</script>
<style scoped>
.fixed-header {
  z-index: 999;
  width: 100vw !important;
  box-shadow: 0 2px 4px 0 var(--cb-color-shadow, rgba(0, 0, 0, 0.16));
  font-size: 12px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-family: var(--cb-typo-font-family-base, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif);
  background-color: var(--cb-color-bg-primary, #fff);
  position: fixed;
  top: 0px;
  right: 0px;
  left: 0px;
}
</style>
