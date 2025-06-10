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
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  overflow: hidden;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    background-color: var(--el-color-primary);
    transition: all 0.3s ease;
  }

  // 边框位置样式
  &.border-position--top::before {
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    width: 100%;
  }

  &.border-position--right::before {
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    height: 100%;
  }

  &.border-position--bottom::before {
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    width: 100%;
  }

  &.border-position--left::before {
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    height: 100%;
  }

  &.border-position--none::before {
    display: none;
  }

  &__header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
  }

  &__body {
    padding: 20px;
  }

  &__footer {
    padding: 10px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary);
    }
  }

  &.is-shadow {
    &:hover {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary);
    }
  }

  &.is-shadow-always {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}
</style>
