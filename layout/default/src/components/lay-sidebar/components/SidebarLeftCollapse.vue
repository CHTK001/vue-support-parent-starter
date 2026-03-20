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

const iconClass = computed(() => {
  return [
    "w-[16px]",
    "h-[16px]",
    "inline-block",
    "align-middle",
    "cursor-pointer",
    "duration-&lsqb;100ms&rsqb",
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
      :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
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
// 春节主题 - 春联样式
html[data-skin="spring-festival"] {
  .left-collapse {
    background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%);
    border-top: 2px solid #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    position: relative;
    overflow: hidden;

    // 春联装饰
    &::after {
      content: "🧧";
      position: absolute;
      font-size: 18px;
      opacity: 0.9;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    :deep(svg) {
      color: #ffd700 !important;
    }

    &:hover {
      background: linear-gradient(135deg, #a00000 0%, #ff1744 100%);
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);

      &::after {
        transform: scale(1.1);
      }
    }

    &.collapsed-state {
      background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
      border-top: 2px solid #dc143c;

      &::after {
        content: "🏅";
      }

      :deep(svg) {
        color: #8b0000 !important;
      }

      &::before {
        background: #dc143c;
      }

      &:hover {
        background: linear-gradient(135deg, #ffe44d 0%, #ffb732 100%);
      }
    }
  }
}

// 中秋主题 - 月亮样式
html[data-skin="mid-autumn"] {
  .left-collapse {
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    border-top: 2px solid #ffd54f;
    box-shadow: 0 0 10px rgba(255, 213, 79, 0.2);
    position: relative;

    // 月亮装饰
    &::after {
      content: "🌙";
      position: absolute;
      font-size: 18px;
      right: 10px;
      filter: drop-shadow(0 0 6px rgba(255, 213, 79, 0.8));
      animation: moonFloat 3s ease-in-out infinite;
    }

    :deep(svg) {
      color: #ffd54f !important;
    }

    &:hover {
      background: linear-gradient(135deg, #283593 0%, #3949ab 100%);
      box-shadow: 0 0 15px rgba(255, 213, 79, 0.4);
    }

    &.collapsed-state {
      background: linear-gradient(135deg, #ffd54f 0%, #ffca28 100%);
      border-top: 2px solid #1a237e;

      &::after {
        content: "🌕";
        filter: drop-shadow(0 0 8px rgba(255, 213, 79, 1));
      }

      :deep(svg) {
        color: #1a237e !important;
      }

      &::before {
        background: #1a237e;
      }

      &:hover {
        background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
      }
    }
  }

  @keyframes moonFloat {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }
}

// 圣诞主题 - 圣诞树样式
html[data-skin="christmas"] {
  .left-collapse {
    background: linear-gradient(135deg, #165b33 0%, #1e7b46 100%);
    border-top: 2px solid #bb2528;
    box-shadow: 0 0 10px rgba(187, 37, 40, 0.2);
    position: relative;

    // 圣诞树装饰
    &::after {
      content: "🎄";
      position: absolute;
      font-size: 18px;
      right: 10px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      animation: treeGlow 2s ease-in-out infinite;
    }

    :deep(svg) {
      color: #f8b229 !important;
    }

    &:hover {
      background: linear-gradient(135deg, #1e7b46 0%, #2a9d5c 100%);
      box-shadow: 0 0 15px rgba(187, 37, 40, 0.4);
    }

    &.collapsed-state {
      background: linear-gradient(135deg, #bb2528 0%, #d42a2d 100%);
      border-top: 2px solid #165b33;

      &::after {
        content: "⭐";
        filter: drop-shadow(0 0 6px rgba(248, 178, 41, 0.8));
      }

      :deep(svg) {
        color: #f8b229 !important;
      }

      &::before {
        background: #f8b229;
      }

      &:hover {
        background: linear-gradient(135deg, #d42a2d 0%, #e53935 100%);
      }
    }
  }

  @keyframes treeGlow {
    0%,
    100% {
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 8px rgba(248, 178, 41, 0.6));
    }
  }
}

// 新年主题 - 雪花样式
html[data-skin="new-year"] {
  .left-collapse {
    background: linear-gradient(
      135deg,
      rgba(240, 248, 255, 0.95) 0%,
      rgba(224, 240, 255, 0.95) 100%
    );
    border-top: 2px solid #60a5fa;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.2);
    position: relative;

    // 雪花装饰
    &::after {
      content: "❄️";
      position: absolute;
      font-size: 16px;
      right: 12px;
      color: #60a5fa;
      animation: snowFall 2s ease-in-out infinite;
    }

    :deep(svg) {
      color: #3b82f6 !important;
    }

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(248, 250, 255, 0.98) 0%,
        rgba(232, 245, 255, 0.98) 100%
      );
      box-shadow: 0 0 15px rgba(96, 165, 250, 0.3);
    }

    &.collapsed-state {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      border-top: 2px solid #1d4ed8;

      &::after {
        content: "✨";
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
      }

      :deep(svg) {
        color: #fff !important;
      }

      &::before {
        background: #fff;
      }

      &:hover {
        background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
      }
    }
  }

  @keyframes snowFall {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-2px) rotate(15deg);
    }
  }
}

// FutureTech 主题 - 科技风格
html[data-skin="future-tech"] {
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
