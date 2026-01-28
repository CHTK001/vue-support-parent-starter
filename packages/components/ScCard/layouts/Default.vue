<template>
  <div
    class="sc-card-default"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true
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
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DefaultLayout",
  props: {
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
    }
  }
});
</script>

<style lang="scss" scoped>
.sc-card-default {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  overflow: hidden;
  color: var(--el-text-color-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &::before {
    content: "";
    position: absolute;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
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
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), transparent);
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
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(to top, rgba(255, 255, 255, 0.5), transparent);
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: rgba(99, 102, 241, 0.3);

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
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: rgba(99, 102, 241, 0.3);
    }
  }

  &.is-shadow-always {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

    &:hover {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: rgba(99, 102, 241, 0.3);
    }
  }
}
</style>
