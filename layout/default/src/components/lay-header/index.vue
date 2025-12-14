<template>
  <div
    class="header-container-with-decoration"
    :class="{ 'fixed-header': set.fixedHeader, 'shadow-tab': set.fixedHeader }"
    :style="[
      set.hideTabs && layout.includes('horizontal')
        ? 'box-shadow: var(--el-box-shadow-light)'
        : '',
    ]"
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
  
  // 确保 shadow-tab 的 padding 为 0
  &.shadow-tab {
    padding: 0 !important;
  }
  
  // 确保 fixed-header 和 shadow-tab 组合时 padding 也为 0
  &.fixed-header.shadow-tab {
    padding: 0 !important;
  }
}

// 头部容器样式优化
.header-only-tags {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  overflow: hidden;

  // 响应式适配
  @media (max-width: 768px) {
    width: 100%;
    left: 0;
  }
}
</style>
// 头部容器样式优化
.header-only-tags {
  position: relative;
  min-height: 48px;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(64, 158, 255, 0.1) 0%,
      rgba(64, 158, 255, 0.2) 50%,
      rgba(64, 158, 255, 0.1) 100%
    );
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.02) 100%
    );
  }

  .dark & {
    &::before {
      background: linear-gradient(
        90deg,
        rgba(64, 158, 255, 0.15) 0%,
        rgba(64, 158, 255, 0.25) 50%,
        rgba(64, 158, 255, 0.15) 100%
      );
    }

    &::after {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0.06) 50%,
        rgba(255, 255, 255, 0.02) 100%
      );
    }
  }
}

// 深度样式优化
:deep(.el-header) {
  padding: 0;
  height: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .header-container {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: 100%;
    min-height: 48px;

    .left-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .right-content {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 20px;
    }
  }
}

// 导航容器现代化样式
.nav-container {
  position: relative;
  min-height: 48px;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.02) 100%
    );
  }

  .dark & {
    &::after {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0.06) 50%,
        rgba(255, 255, 255, 0.02) 100%
      );
    }
  }
}

// 响应式设计优化
@media (max-width: 1024px) {
  :deep(.el-header) {
    .header-container {
      padding: 0 16px;
      gap: 12px;

      .left-content {
        gap: 12px;
      }

      .right-content {
        gap: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  :deep(.el-header) {
    .header-container {
      padding: 0 12px;

      .left-content {
        gap: 8px;
      }

      .right-content {
        gap: 12px;
      }
    }
  }
}

// 动画增强
.fixed-header {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
