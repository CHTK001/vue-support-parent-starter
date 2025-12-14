<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import LaySidebarBreadCrumb from "../../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";
//@ts-ignore
import LayTool from "../../lay-tool/index.vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import { onBeforeUnmount, ref } from "vue";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

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
  <div 
    :class="['base-navbar', themeClass]"
    :style="themeClass === 'spring-festival-navbar' ? 'background: linear-gradient(180deg, #DC143C, #B22222) !important; border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;' : ''"
  >
    <!-- 装饰元素 -->
    <div class="decor-pattern"></div>
    
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <LaySidebarBreadCrumb
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
// 基础布局样式 - 所有主题共用
.base-navbar {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  height: 48px;
  // 主题特定样式由全局 SCSS 控制
  
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
    padding-right: 20px; // 减少右侧 padding
    gap: 12px;
    margin-left: auto;
    z-index: 10;
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
