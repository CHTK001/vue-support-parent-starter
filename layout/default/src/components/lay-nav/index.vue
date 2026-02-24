<template>
  <!-- 顶部导航区域：统一入口（按布局真实渲染，不使用 display 隐藏） -->
  <div v-if="shouldShowNavbar">
    <LayNavbar v-if="defer(0)" />
  </div>

  <div v-else-if="shouldShowHorizontal">
    <NavHorizontal v-if="defer(1)" />
  </div>

  <!-- 隐藏侧边栏 / 不展示导航时：只在未隐藏标签页时渲染 DOM -->
  <div v-else-if="!hideTabs" class="header-only-tags">
    <LayTag v-if="defer(2)" />
  </div>
</template>

<script setup lang="ts">
import LayNavbar from "../lay-navbar/index.vue";
import NavHorizontal from "../lay-sidebar/NavHorizontal.vue";
import LayTag from "../lay-tag/index.vue";
import { useSettingStoreHook } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { computed } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { useDefer } from "@repo/utils";

const { layout } = useLayout();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const pureSetting = useSettingStoreHook();
const defer = useDefer(3);

const hideTabs = computed(() => Boolean($storage?.configure.hideTabs));

/**
 * 是否渲染顶部 LayNavbar
 * - 悬停导航场景也需要顶部导航，避免只显示标签页
 */
const shouldShowNavbar = computed(() => {
  if (pureSetting.hiddenSideBar) {
    return false;
  }
  return (
    layout.value === "vertical" ||
    layout.value === "mix" ||
    layout.value === "double" ||
    layout.value === "mobile" ||
    layout.value === "hover"
  );
});

/** 是否渲染横向导航 */
const shouldShowHorizontal = computed(() => {
  if (pureSetting.hiddenSideBar) {
    return false;
  }
  return layout.value === "horizontal";
});
</script>

<style lang="scss" scoped>
.header-only-tags {
  position: relative;
  min-height: 48px;
  background: transparent;
}
</style>


