<template>
  <div class="header-box">
    <div class="header-left">
      <!-- 左侧菜单展开和折叠图标 -->
      <Collapse v-if="showCollapseButton"></Collapse>
      <!-- 面包屑 -->
      <BreadCrumb v-if="showBreadCrumb" class="<md:hidden"></BreadCrumb>
    </div>
    <!-- 工具栏 -->
    <Toolbar v-if="showToolbar"></Toolbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Collapse from "../../../layouts/components/Header/components/Collapse.vue";
import BreadCrumb from "../../../layouts/components/Header/components/BreadCrumb.vue";
import Toolbar from "../../../layouts/components/Header/components/Toolbar.vue";
import { getConfig } from "@repo/config";
import settings from "../../../settings";

const props = withDefaults(
  defineProps<{
    /** 渐变布局等在主内容区展示面包屑时传 false，避免与折叠按钮同一行 */
    showBreadCrumb?: boolean;
  }>(),
  { showBreadCrumb: true }
);

const config = getConfig() || {};

/** 折叠按钮：ShowCollapse (默认 true) */
const showCollapseButton = computed(() => {
  const v = config.ShowCollapse ?? settings.showCollapseButton;
  return v !== false;
});

/** 工具栏：ShowBarSetting (默认 true) */
const showToolbar = computed(() => {
  const v = config.ShowBarSetting ?? settings.showHeaderToolbar;
  return v !== false;
});

/** 面包屑：ShowBreadcrumb (默认 true)，叠加 prop 短路 */
const showBreadCrumb = computed(() => {
  const v = config.ShowBreadcrumb ?? settings.showBreadCrumb;
  return props.showBreadCrumb !== false && v !== false;
});
</script>

<style lang="scss" scoped>
.header-box {
  position: relative;
  display: flex;
  justify-content: space-between;
  height: var(--koi-header-height, $aside-header-height);

  .header-left {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    z-index: 1;
  }

  :deep(.header-right) {
    position: absolute;
    top: 50%;
    right: 0px;
    z-index: 10;
    height: 40px;
    transform: translateY(-50%);
  }
}
</style>
