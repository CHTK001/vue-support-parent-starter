<script setup lang="ts">
import { useGlobal } from "@pureadmin/utils";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "../../../hooks/useNav";

import MenuFold from "@iconify-icons/ri/menu-fold-fill";

interface Props {
  isActive: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false,
});

const { t } = useI18n();
const { tooltipEffect } = useNav();

const iconStyle = computed(() => ({
  width: "16px",
  height: "16px",
}));

const iconClass = computed(() => {
  return [
    "inline-block",
    "align-middle",
    "cursor-pointer",
    "duration-100",
  ];
});

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeColor = computed(() => $storage.layout?.themeColor);

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

const toggleClick = () => {
  emit("toggleClick");
};
</script>

<template>
  <div class="left-collapse" :class="{ 'collapsed-state': !isActive }">
    <IconifyIconOffline
      v-tippy="{
        content: isActive
          ? t('buttons.pureClickCollapse')
          : t('buttons.pureClickExpand'),
        theme: tooltipEffect,
        hideOnClick: 'toggle',
        placement: 'right',
      }"
      :icon="MenuFold"
      :class="[iconClass, themeColor === 'light' ? '' : 'text-primary']"
      :style="{ ...iconStyle, transform: isActive ? 'none' : 'rotateY(180deg)' }"
      @click="toggleClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.left-collapse {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 0 6px -3px var(--el-color-primary);
  z-index: 100;
  pointer-events: auto;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  &.collapsed-state {
    background: var(--el-color-primary-light-8);
    border-top: 2px solid var(--el-color-primary);
    box-shadow: 0 0 8px -2px var(--el-color-primary);

    &::before {
      content: "";
      position: absolute;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: var(--el-color-primary);
      border-radius: 1px;
    }

    &:hover {
      background: var(--el-color-primary-light-7);
      box-shadow: 0 0 12px -1px var(--el-color-primary);
    }
  }
}
</style>

<!-- 主题适配样式 -->
<style lang="scss">

// Tech 主题 - 科技风格
html[data-skin="tech"] {
  .left-collapse {
    background: linear-gradient(
      180deg,
      rgba(5, 10, 31, 0.95),
      rgba(10, 26, 58, 0.9)
    ) !important;
    border-top: 2px solid rgba(0, 255, 255, 0.4) !important;
    box-shadow: 0 -2px 10px rgba(0, 255, 255, 0.1) !important;
    position: relative;
    overflow: hidden;

    // 扫描线装饰
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00ffff, transparent);
      box-shadow: 0 0 10px #00ffff;
      animation: techScan 3s linear infinite;
    }

    :deep(svg) {
      color: rgba(0, 255, 255, 0.7) !important;
      filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
    }

    &:hover {
      background: rgba(0, 255, 255, 0.15) !important;
      box-shadow: 0 -2px 15px rgba(0, 255, 255, 0.3) !important;

      :deep(svg) {
        color: #00ffff !important;
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
      }
    }

    &.collapsed-state {
      background: linear-gradient(
        180deg,
        rgba(5, 10, 31, 0.95),
        rgba(10, 26, 58, 0.9)
      ) !important;
      border-top: 2px solid #00ffff !important;
      box-shadow: 0 -2px 15px rgba(0, 255, 255, 0.3) !important;

      &::after {
        animation: techScan 2s linear infinite;
      }

      :deep(svg) {
        color: #00ffff !important;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
      }

      &::before {
        background: #00ffff;
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.8);
      }

      &:hover {
        background: rgba(0, 255, 255, 0.2) !important;
        box-shadow: 0 -2px 20px rgba(0, 255, 255, 0.5) !important;
      }
    }
  }

  @keyframes techScan {
    0% {
      left: -100%;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      left: 100%;
      opacity: 0;
    }
  }
}
</style>
