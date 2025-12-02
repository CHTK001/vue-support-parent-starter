<template>
  <!-- Tech 主题模式：使用 scifiPanel -->
  <tech-panel
    v-if="theme === 'tech'"
    :title="title"
    :icon="icon"
    :disabled="disabled"
    :class="[
      `sc-panel--theme-${techTheme}`,
      {
        'is-active': isActive,
        'is-disabled': disabled
      }
    ]"
  >
    <!-- 面板头部 -->
    <div class="sc-panel__header" :class="{ 'is-clickable': !disabled }" @click="handleHeaderClick">
      <div class="sc-panel__header-content">
        <!-- 图标 -->
        <IconifyIconOnline v-if="icon" :icon="icon" class="sc-panel__icon" />

        <!-- 标题 -->
        <span class="sc-panel__title">{{ title || name }}</span>

        <!-- 自定义头部内容 -->
        <slot name="title" />
      </div>

      <div class="sc-panel__header-right">
        <!-- 额外内容 -->
        <slot name="extra" />

        <!-- 展开/收起图标 -->
        <IconifyIconOnline v-if="!disabled" :icon="isActive ? 'ep:arrow-up' : 'ep:arrow-down'" class="sc-panel__arrow" />
      </div>
    </div>

    <!-- 面板内容 -->
    <transition name="sc-panel-fade">
      <div v-show="isActive" class="sc-panel__body">
        <div class="sc-panel__content">
          <slot />
        </div>
      </div>
    </transition>

    <!-- Tech 装饰元素 -->
    <span class="sc-panel__tech-corner sc-panel__tech-corner--tl" />
    <span class="sc-panel__tech-corner sc-panel__tech-corner--tr" />
    <span class="sc-panel__tech-corner sc-panel__tech-corner--bl" />
    <span class="sc-panel__tech-corner sc-panel__tech-corner--br" />
    <span class="sc-panel__tech-line sc-panel__tech-line--top" />
    <span class="sc-panel__tech-line sc-panel__tech-line--bottom" />
  </div>

  <!-- Element Plus 原生模式 -->
  <el-collapse-item v-else :name="name" :title="title" :disabled="disabled">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <slot />
  </el-collapse-item>
</template>

<script setup lang="ts">
/**
 * ScPanel 面板组件
 * 封装 el-collapse-item 并支持 tech 主题
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { ref, computed, inject, watch } from "vue";
import { ElCollapseItem } from "element-plus";

interface Props {
  /** 面板名称，作为唯一标识 */
  name?: string | number;
  /** 面板标题 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 主题风格 */
  theme?: "default" | "tech";
  /** Tech 主题颜色 */
  techTheme?: "cyan" | "blue" | "green" | "purple" | "orange" | "red";
  /** 图标 */
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: "",
  title: "",
  disabled: false,
  theme: "default",
  techTheme: "cyan",
  icon: ""
});

const emit = defineEmits<{
  change: [active: boolean];
}>();

const activeNames = inject<any>("collapseActiveNames", ref([]));
const handleItemClick = inject<any>("collapseHandleItemClick", () => {});

const isActive = computed(() => {
  if (Array.isArray(activeNames.value)) {
    return activeNames.value.includes(props.name);
  }
  return activeNames.value === props.name;
});

const handleHeaderClick = () => {
  if (props.disabled) return;

  if (props.theme === "tech") {
    emit("change", !isActive.value);
  } else {
    handleItemClick(props.name);
  }
};

watch(isActive, val => {
  if (props.theme === "tech") {
    emit("change", val);
  }
});
</script>

<style lang="scss" scoped>
.sc-panel {
  position: relative;
  margin-bottom: 16px;

  &--tech {
    background: rgba(0, 20, 40, 0.8);
    border: 1px solid rgba(0, 246, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(rgba(0, 246, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 246, 255, 0.05) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
    }

    &.is-active {
      border-color: rgba(0, 246, 255, 0.6);
      box-shadow: 0 0 20px rgba(0, 246, 255, 0.3);

      .sc-panel__tech-corner {
        width: 12px;
        height: 12px;
        opacity: 1;
      }

      .sc-panel__tech-line {
        opacity: 1;
      }
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;

      .sc-panel__header {
        cursor: not-allowed;
      }
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: rgba(0, 30, 60, 0.6);
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;

    &.is-clickable {
      cursor: pointer;

      &:hover {
        background: rgba(0, 40, 80, 0.8);
        border-bottom-color: rgba(0, 246, 255, 0.4);
      }
    }

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, #00f6ff, transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover::after {
      opacity: 1;
    }
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    font-size: 20px;
    color: #00f6ff;
    filter: drop-shadow(0 0 5px rgba(0, 246, 255, 0.6));
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  &__arrow {
    font-size: 16px;
    color: #00f6ff;
    transition: transform 0.3s ease;
  }

  &__body {
    position: relative;
    z-index: 1;
  }

  &__content {
    padding: 20px;
    color: rgba(255, 255, 255, 0.9);
  }

  &__tech-corner {
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #00f6ff;
    transition: all 0.3s ease;
    opacity: 0.6;
    z-index: 2;

    &--tl {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    &--tr {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }

    &--bl {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }

    &--br {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }
  }

  &__tech-line {
    position: absolute;
    background: linear-gradient(90deg, transparent, #00f6ff, transparent);
    opacity: 0.3;
    transition: opacity 0.3s ease;
    z-index: 2;

    &--top {
      top: 0;
      left: 20px;
      right: 20px;
      height: 1px;
    }

    &--bottom {
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 1px;
    }
  }

  // 主题颜色变体
  &--theme-cyan {
    --panel-color: #00f6ff;
    --panel-glow: rgba(0, 246, 255, 0.5);
  }

  &--theme-blue {
    --panel-color: #1890ff;
    --panel-glow: rgba(24, 144, 255, 0.5);

    border-color: rgba(24, 144, 255, 0.3);

    .sc-panel__icon,
    .sc-panel__arrow,
    .sc-panel__tech-corner,
    .sc-panel__tech-line {
      color: #1890ff;
      border-color: #1890ff;
      background: linear-gradient(90deg, transparent, #1890ff, transparent);
    }

    .sc-panel__title {
      text-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
    }

    &.is-active {
      border-color: rgba(24, 144, 255, 0.6);
      box-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
    }
  }

  &--theme-green {
    --panel-color: #00ff88;
    --panel-glow: rgba(0, 255, 136, 0.5);

    border-color: rgba(0, 255, 136, 0.3);

    .sc-panel__icon,
    .sc-panel__arrow,
    .sc-panel__tech-corner,
    .sc-panel__tech-line {
      color: #00ff88;
      border-color: #00ff88;
      background: linear-gradient(90deg, transparent, #00ff88, transparent);
    }

    .sc-panel__title {
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    }

    &.is-active {
      border-color: rgba(0, 255, 136, 0.6);
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    }
  }

  &--theme-purple {
    --panel-color: #b37feb;
    --panel-glow: rgba(179, 127, 235, 0.5);

    border-color: rgba(179, 127, 235, 0.3);

    .sc-panel__icon,
    .sc-panel__arrow,
    .sc-panel__tech-corner,
    .sc-panel__tech-line {
      color: #b37feb;
      border-color: #b37feb;
      background: linear-gradient(90deg, transparent, #b37feb, transparent);
    }

    .sc-panel__title {
      text-shadow: 0 0 10px rgba(179, 127, 235, 0.5);
    }

    &.is-active {
      border-color: rgba(179, 127, 235, 0.6);
      box-shadow: 0 0 20px rgba(179, 127, 235, 0.3);
    }
  }

  &--theme-orange {
    --panel-color: #ff9500;
    --panel-glow: rgba(255, 149, 0, 0.5);

    border-color: rgba(255, 149, 0, 0.3);

    .sc-panel__icon,
    .sc-panel__arrow,
    .sc-panel__tech-corner,
    .sc-panel__tech-line {
      color: #ff9500;
      border-color: #ff9500;
      background: linear-gradient(90deg, transparent, #ff9500, transparent);
    }

    .sc-panel__title {
      text-shadow: 0 0 10px rgba(255, 149, 0, 0.5);
    }

    &.is-active {
      border-color: rgba(255, 149, 0, 0.6);
      box-shadow: 0 0 20px rgba(255, 149, 0, 0.3);
    }
  }

  &--theme-red {
    --panel-color: #ff4d4f;
    --panel-glow: rgba(255, 77, 79, 0.5);

    border-color: rgba(255, 77, 79, 0.3);

    .sc-panel__icon,
    .sc-panel__arrow,
    .sc-panel__tech-corner,
    .sc-panel__tech-line {
      color: #ff4d4f;
      border-color: #ff4d4f;
      background: linear-gradient(90deg, transparent, #ff4d4f, transparent);
    }

    .sc-panel__title {
      text-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
    }

    &.is-active {
      border-color: rgba(255, 77, 79, 0.6);
      box-shadow: 0 0 20px rgba(255, 77, 79, 0.3);
    }
  }
}

.sc-panel-fade-enter-active,
.sc-panel-fade-leave-active {
  transition: all 0.3s ease;
}

.sc-panel-fade-enter-from,
.sc-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
