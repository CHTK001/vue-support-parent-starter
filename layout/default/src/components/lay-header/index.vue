<template>
  <div
    class="header-container-with-decoration"
    :class="{ 'fixed-header': set.fixedHeader }"
  >
    <!-- 纵向和混合布局的导航栏 -->
    <div
      v-if="
        !pureSetting.hiddenSideBar &&
        (layout.includes('vertical') ||
          layout.includes('mix') ||
          layout.includes('hover'))
      "
    >
      <LayNavbar v-if="defer(0)" />
    </div>

    <!-- 横向布局的导航栏 -->
    <div
      v-else-if="!pureSetting.hiddenSideBar && layout.includes('horizontal')"
    >
      <NavHorizontal v-if="defer(1)" />
    </div>

    <!-- 隐藏侧边栏时只显示标签页 -->
    <div v-else class="header-only-tags">
      <LayTag v-if="defer(2)" />
    </div>
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in headerDecorations"
      :key="`header-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>
<script setup lang="ts">
import LayNavbar from "../lay-navbar/index.vue";
import NavHorizontal from "../lay-sidebar/NavHorizontal.vue";
import LayTag from "../lay-tag/index.vue";
import { emitter, useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { useDark, useGlobal } from "@pureadmin/utils";
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { setType } from "../../types";
import { useDefer } from "@repo/utils";

// 导入主题装饰功能
import ThemeDecoration from "../ThemeDecoration.vue";
import { getComponentDecorations } from "../../themes/decorations";
import type { DecorationConfig } from "../../themes/decorations";

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

// === 主题装饰功能 ===
const currentTheme = ref<string>($storage.configure?.systemTheme || 'default');
const headerDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-header');
});

emitter.on("systemThemeChange", (themeKey: string) => {
  currentTheme.value = themeKey;
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<script lang="ts">
// 导入集中的主题皮肤样式
import '@repo/skin';
</script>

<style lang="scss" scoped>
// 基础容器样式
.header-container-with-decoration {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: var(--el-bg-color);
}

// 头部容器样式优化
.header-only-tags {
  position: relative;
  min-height: 48px;
  background: transparent;
}
</style>

