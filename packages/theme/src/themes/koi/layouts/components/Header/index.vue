<template>
  <div class="header-box">
    <div class="header-left">
      <!-- 左侧菜单展开和折叠图标 -->
      <ReCollapse></ReCollapse>
      <!-- 面包屑（app.yaml other.toolbar.breadcrumb 控制） -->
      <ReBreadCrumb v-if="showBreadCrumb && isToolbarVisible('breadcrumb')" class="<md:hidden"></ReBreadCrumb>
    </div>
    <!-- 工具栏（#header-extra 用于注入顶部操作入口，如大屏按钮） -->
    <ReToolbar>
      <template #header-extra>
        <slot name="header-extra"></slot>
      </template>
    </ReToolbar>
  </div>
</template>

<script setup lang="ts">
import ReCollapse from "@repo/theme/koi/layouts/components/Header/components/ReCollapse.vue";
import ReBreadCrumb from "@repo/theme/koi/layouts/components/Header/components/ReBreadCrumb.vue";
import ReToolbar from "@repo/theme/koi/layouts/components/Header/components/ReToolbar.vue";
import { isToolbarVisible } from "./toolbarPrefs";

withDefaults(
  defineProps<{
    /** 渐变布局等在主内容区展示面包屑时传 false，避免与折叠按钮同一行 */
    showBreadCrumb?: boolean;
  }>(),
  { showBreadCrumb: true }
);
</script>

<style lang="scss" scoped>
.header-box {
  position: relative; /* 为绝对定位的子元素提供参考 */
  display: flex;
  justify-content: space-between;
  height: $aside-header-height;

  .header-left {
    display: flex;
    flex: 1; /* 允许左侧区域伸缩 */
    align-items: center;
    min-width: 0; /* 重要：允许内容溢出 */
    overflow: hidden; /* 保留hidden防止内容溢出 */
    white-space: nowrap;
    z-index: 1; /* 确保在 Toolbar 下方 */
  }

  /* 让 Toolbar 覆盖在 header-left 上方（毛玻璃样式由 Toolbar 组件自身提供） */
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
