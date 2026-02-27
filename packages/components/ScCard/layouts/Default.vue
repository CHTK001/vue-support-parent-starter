<template>
  <div
    v-if="!currentComponent"
    class="sc-card-default h-full"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true,
      [`theme--${theme}`]: true
    }"
  >
    <div v-if="$slots.header || title" class="sc-card-default__header">
      <slot name="header">
        <div class="sc-card-default__title">{{ title }}</div>
      </slot>
    </div>

    <div class="sc-card-default__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="sc-card-default__footer">
      <slot name="footer" />
    </div>
  </div>

  <component
    :is="currentComponent"
    v-else
    v-bind="cardProps"
    class="sc-card-default h-full"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true,
      [`theme--${theme}`]: true
    }"
  >
    <template v-if="$slots.header || title" #header>
      <slot name="header">
        <div class="sc-card-default__title">{{ title }}</div>
      </slot>
    </template>

    <template #default>
      <slot />
    </template>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScCard Default Layout
 * 封装 Element Plus Card 与其他主题的 Card 组件
 * 在 data-skin 变化时自动切换为对应主题的卡片组件
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  /**
   * 卡片标题
   */
  title: {
    type: String,
    default: ""
  },
  /**
   * 是否可悬停
   */
  hoverable: {
    type: Boolean,
    default: false
  },
  /**
   * 阴影显示时机
   */
  shadow: {
    type: String,
    default: "hover",
    validator: (val: string) => ["always", "hover", "never"].includes(val)
  },
  /**
   * 边框加粗显示位置
   */
  borderPosition: {
    type: String,
    default: "top",
    validator: (val: string) => ["top", "right", "bottom", "left", "none"].includes(val)
  },
  /**
   * 主题色
   */
  theme: {
    type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info">,
    default: "default"
  }
});

const { currentComponent } = useThemeComponent("ElCard");

// 只在使用 ElCard 时传递 shadow 属性
const cardProps = computed(() => {
  const componentValue = currentComponent.value;
  if (componentValue && typeof componentValue !== "string") {
    return { shadow: props.shadow };
  }
  return {};
});
</script>

<style lang="scss" scoped>
.sc-card-default {
  border-radius: var(--stitch-lay-radius-md);
  border: 1px solid var(--stitch-lay-border);
  background: var(--stitch-lay-bg-panel);
  overflow: hidden;
  color: var(--stitch-lay-text-main);
  transition: var(--stitch-lay-transition);
  position: relative;
  box-shadow: var(--stitch-lay-shadow-sm);

  &::before {
    content: "";
    position: absolute;
    background: linear-gradient(135deg, var(--stitch-lay-primary) 0%, var(--stitch-lay-primary-light) 100%);
    transition: var(--stitch-lay-transition);
    z-index: 1;
  }

  // 主题变体混合宏
  @mixin theme-variant($type) {
    &::before {
      background: linear-gradient(135deg, var(--el-color-#{$type}) 0%, var(--el-color-#{$type}-light-3) 100%);
    }

    &.is-hoverable:hover {
      border-color: var(--el-color-#{$type}-light-5);
    }
  }

  &.theme--primary {
    @include theme-variant("primary");
  }
  &.theme--success {
    @include theme-variant("success");
  }
  &.theme--warning {
    @include theme-variant("warning");
  }
  &.theme--danger {
    @include theme-variant("danger");
  }
  &.theme--info {
    @include theme-variant("info");
  }

  // 边框位置样式
  &.border-position--top::before {
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    width: 100%;
  }

  &.border-position--right::before {
    top: 0;
    right: 0;
    bottom: 0;
    width: 3px;
    height: 100%;
  }

  &.border-position--bottom::before {
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    width: 100%;
  }

  &.border-position--left::before {
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    height: 100%;
  }

  &.border-position--none::before {
    display: none;
  }

  &__header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(to bottom, color-mix(in srgb, var(--el-bg-color), transparent 50%), transparent);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    letter-spacing: 0.3px;
  }

  &__body {
    padding: 24px;
  }

  &__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(to top, color-mix(in srgb, var(--el-bg-color), transparent 50%), transparent);
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--el-box-shadow);
      border-color: var(--el-color-primary-light-5);

      &::before {
        height: 4px;
      }

      &.border-position--right::before,
      &.border-position--left::before {
        width: 4px;
      }
    }
  }

  &.is-shadow {
    &:hover {
      box-shadow: var(--el-box-shadow);
      border-color: var(--el-color-primary-light-5);
    }
  }

  &.is-shadow-always {
    box-shadow: var(--el-box-shadow-light);

    &:hover {
      box-shadow: var(--el-box-shadow);
      border-color: var(--el-color-primary-light-5);
    }
  }
}
</style>
