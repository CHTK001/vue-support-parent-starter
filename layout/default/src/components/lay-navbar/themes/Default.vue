<script setup lang="ts">
import { emitter } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { onBeforeUnmount, ref } from "vue";
import { useNav } from "../../../hooks/useNav";
import CustomBreadcrumb from "../../breadcrumb/CustomBreadcrumb.vue";
import NavbarActions from "../components/NavbarActions.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";

const { layout, device, pureApp, toggleSideBar } = useNav();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);
const drawerMenuVisible = ref(false);

function toggleDrawerMenu() {
  drawerMenuVisible.value = !drawerMenuVisible.value;
  emitter.emit("drawerHamburgerToggle", drawerMenuVisible.value);
}

emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

emitter.on("drawerMenuClosed", () => {
  drawerMenuVisible.value = false;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
  emitter.off("drawerMenuClosed");
});
</script>

<template>
  <div class="default-navbar">
    <!-- 移动端汉堡按钮 -->
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- drawer 布局内联汉堡按钮 -->
    <button
      v-if="layout === 'drawer' && device !== 'mobile'"
      class="drawer-hamburger"
      :class="{ 'is-active': drawerMenuVisible }"
      aria-label="打开导航菜单"
      @click.stop="toggleDrawerMenu"
    >
      <span class="hamburger-line" />
      <span class="hamburger-line" />
      <span class="hamburger-line" />
    </button>

    <!-- mix 布局：顶部混合导航 -->
    <LayNavMix v-if="layout === 'mix'" />

    <!-- 非 mix/mobile 布局：面包屑 -->
    <CustomBreadcrumb
      v-if="
        layout !== 'mix' &&
        layout !== 'drawer' &&
        device !== 'mobile' &&
        showBreadcrumb
      "
      class="breadcrumb-container"
      :show-home="true"
      :show-icon="true"
      separator="arrow"
      :max-items="5"
      :enable-animation="true"
      :show-tooltip="true"
    />

    <!-- 右侧工具栏（vertical/hover/card/double/drawer 布局） -->
    <NavbarActions
      v-if="['vertical', 'hover', 'card', 'double', 'drawer'].includes(layout)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
