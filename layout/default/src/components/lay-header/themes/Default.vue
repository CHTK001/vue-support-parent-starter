<template>
  <HeaderWrapper :fixed="set.fixedHeader">
    <div class="header-container">
      <LayNav />

      <!-- 标签页：在非移动模式下显示，且未隐藏标签页 -->
      <div v-if="layout !== 'mobile' && !set.hideTabs" class="header-tags">
        <LayTag v-if="defer(2)" />
      </div>
    </div>
  </HeaderWrapper>
</template>

<script setup lang="ts">
import LayTag from "../../lay-tag/index.vue";
import LayNav from "../../lay-navbar/index.vue";
import HeaderWrapper from "../components/HeaderWrapper.vue";
import { useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { computed, reactive } from "vue";
import { useLayout } from "../../../hooks/useLayout";
import { setType } from "../../../types";
import { useDefer } from "@repo/utils";

const { layout } = useLayout();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const pureSetting = useSettingStoreHook();

const appStore = useAppStoreHook();
const defer = useDefer(3);

const set: setType = reactive({
  sidebar: computed(() => appStore.sidebar),
  device: computed(() => appStore.device),
  fixedHeader: computed(() => pureSetting.fixedHeader),
  classes: computed(() => ({
    hideSidebar: !set.sidebar.opened,
    openSidebar: set.sidebar.opened,
    withoutAnimation: set.sidebar.withoutAnimation,
    mobile: set.device === "mobile",
  })),
  hideTabs: computed(() => $storage?.configure.hideTabs),
});
</script>

<style lang="scss" scoped>
.header-container {
  position: relative;
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  border-bottom: 1px solid var(--dt-glass-border-light);
  transition: background var(--dt-transition-slow), border-color var(--dt-transition-slow);

  html.dark & {
    background: var(--dt-glass-bg-dark);
    backdrop-filter: var(--dt-glass-blur-dark);
    -webkit-backdrop-filter: var(--dt-glass-blur-dark);
    border-bottom-color: var(--dt-glass-border-dark);
  }
}
</style>
