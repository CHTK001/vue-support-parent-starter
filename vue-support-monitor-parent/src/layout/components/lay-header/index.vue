<template>
  <div
    :class="{ 'fixed-header shadow-tab': set.fixedHeader }"
    :style="[set.hideTabs && layout.includes('horizontal') ? (isDark ? 'box-shadow: 0 1px 4px #0d0d0d' : 'box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)') : '']"
  >
    <div v-if="!pureSetting.hiddenSideBar && (layout.includes('vertical') || layout.includes('mix'))">
      <LayNavbar />
    </div>
    <div v-else-if="!pureSetting.hiddenSideBar && layout.includes('horizontal')">
      <NavHorizontal />
    </div>
    <div v-else>
      <LayTag />
    </div>
  </div>
</template>
<script setup lang="ts">
import LayNavbar from "@/layout/components/lay-navbar/index.vue";
import NavHorizontal from "@/layout/components/lay-sidebar/NavHorizontal.vue";
import LayTag from "@/layout/components/lay-tag/index.vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useDark, useGlobal } from "@pureadmin/utils";
import { computed, reactive } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { setType } from "../../types";
const { layout } = useLayout();
const { isDark } = useDark();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const pureSetting = useSettingStoreHook();

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
      mobile: set.device === "mobile"
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  })
});
</script>
