<template>
  <div
    :class="{ 'fixed-header shadow-tab': set.fixedHeader }"
    :style="[set.hideTabs && layout.includes('horizontal') ? (isDark ? 'box-shadow: 0 1px 4px #0d0d0d' : 'box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)') : '']"
  >
    <!-- 纵向和混合布局的导航栏 -->
    <div v-if="!pureSetting.hiddenSideBar && (layout.includes('vertical') || layout.includes('mix') || layout.includes('hover'))">
      <LayNavbar v-if="defer(0)" />
    </div>

    <!-- 横向布局的导航栏 -->
    <div v-else-if="!pureSetting.hiddenSideBar && layout.includes('horizontal')">
      <NavHorizontal v-if="defer(1)" />
    </div>

    <!-- 隐藏侧边栏时只显示标签页 -->
    <div v-else class="header-only-tags">
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
// 现代化固定头部样式
.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 999;
  width: calc(100% - var(--pure-left-width));
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &.shadow-tab {
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
    transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 暗色主题适配
  .dark & {
    background: rgba(18, 18, 23, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    &.shadow-tab {
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
    }
  }

  // 响应式适配
  @media (max-width: 768px) {
    width: 100%;
    left: 0;
  }
}

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
    background: linear-gradient(90deg,
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
    background: linear-gradient(90deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.02) 100%
    );
  }

  .dark & {
    &::before {
      background: linear-gradient(90deg,
        rgba(64, 158, 255, 0.15) 0%,
        rgba(64, 158, 255, 0.25) 50%,
        rgba(64, 158, 255, 0.15) 100%
      );
    }

    &::after {
      background: linear-gradient(90deg,
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
    background: linear-gradient(90deg,
      rgba(0, 0, 0, 0.02) 0%,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.02) 100%
    );
  }

  .dark & {
    &::after {
      background: linear-gradient(90deg,
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
