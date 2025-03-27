<template>
  {{ pureSetting.hiddenSideBar }}
  <div :class="{ 'fixed-header shadow-tab': set.fixedHeader }"
    :style="[set.hideTabs && layout.includes('horizontal') ? (isDark ? 'box-shadow: 0 1px 4px #0d0d0d' : 'box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)') : '']">
    <div v-if="!pureSetting.hiddenSideBar && (layout.includes('vertical') || layout.includes('mix'))">
      <LayNavbar v-if="defer(0)" />
    </div>
    <div v-else-if="!pureSetting.hiddenSideBar && layout.includes('horizontal')">
      <NavHorizontal v-if="defer(1)" />
    </div>
    <div v-else>
      <LayTag v-if="defer(2)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import LayNavbar from "../lay-navbar/index.vue";
import NavHorizontal from "../lay-sidebar/NavHorizontal.vue";
import LayTag from "../lay-tag/index.vue";
import { useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { useDark, useGlobal } from "@pureadmin/utils";
import { computed, reactive } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { setType } from "../../types";
import { useDefer } from "@repo/utils";

const { layout } = useLayout();
const { isDark } = useDark();
const { $storage } = useGlobal<any>();
const pureSetting = useSettingStoreHook();

const defer = useDefer(3);

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
</script>

<style lang="scss" scoped>
.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - var(--pure-left-width));
  overflow: hidden;
  transition: width 0.28s;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);

  &.shadow-tab {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    transition: box-shadow 0.3s ease;
  }

  .dark & {
    background: rgba(28, 28, 28, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &.shadow-tab {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
  }
}

:deep(.el-header) {
  padding: 0;
  height: auto;
  transition: all 0.3s;

  .header-container {
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 100%;

    .left-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .right-content {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }
}

.nav-container {
  position: relative;
  height: 48px;
  background: transparent;
  transition: all 0.3s;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.03) 50%, rgba(0, 0, 0, 0.01) 100%);
  }

  .dark & {
    &::after {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0.01) 100%);
    }
  }
}
</style>
