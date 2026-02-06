<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import LayBreadcrumb from "../../breadcrumb/index.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";
import LayTool from "../../lay-tool/index.vue";
import { useGlobal, useDark } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import { onBeforeUnmount, ref, computed } from "vue";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

const { isDark } = useDark();

const {
  layout,
  device,
  pureApp,
  toggleSideBar,
} = useNav();

const { $storage } = useGlobal<any>();
const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);

emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
});
</script>

<template>
  <div :class="['base-navbar', themeClass]">
    <!-- 装饰元素 -->
    <div class="decor-pattern"></div>
    
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <LayBreadcrumb
      v-if="layout !== 'mix' && device !== 'mobile' && showBreadcrumb"
      class="breadcrumb-container"
    />

    <LayNavMix v-if="layout === 'mix'" />

    <div
      v-if="
        layout === 'vertical' ||
        layout === 'hover' ||
        layout === 'card' ||
        layout === 'double'
      "
      class="vertical-header-right"
    >
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../../styles/mixins.scss";

// 基础布局样式 - 所有主题共用
.base-navbar {
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  // height: 48px; // Removed, used in mixin
  @include lay-header-style;
  
  .decor-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  
  .hamburger-container {
    z-index: 10;
  }
  
  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    padding-right: 16px; // 调整为 16px
    gap: 16px; // 调整间距
    margin-left: auto;
    
    // 24px 分隔线
    &::before {
      content: "";
      width: 1px;
      height: 24px;
      background: #e5e7eb;
      margin-right: 8px;
      
      :global(.dark) & {
        background: #4c4d4f;
      }
    }
  }

  .breadcrumb-container {
    margin-left: 20px;
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    z-index: 10;
  }
}
</style>
