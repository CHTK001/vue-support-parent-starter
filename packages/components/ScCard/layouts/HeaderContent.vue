<template>
  <div
    class="sc-card-header-content"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true,
      [`theme--${theme}`]: true
    }"
  >
    <div class="sc-card-header-content__header" :style="headerStyle">
      <slot name="header">
        <div v-if="title" class="sc-card-header-content__title">{{ title }}</div>
      </slot>
    </div>

    <div class="sc-card-header-content__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="sc-card-header-content__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";

export default defineComponent({
  name: "HeaderContentLayout",
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
    },
    /**
     * 头部高度
     */
    headerHeight: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 头部背景色
     */
    headerBgColor: {
      type: String,
      default: ""
    },
    /**
     * 头部背景图
     */
    headerBgImage: {
      type: String,
      default: ""
    },
    /**
     * 主题色
     */
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info">,
      default: "primary"
    }
  },
  setup(props) {
    const headerStyle = computed(() => {
      const style: Record<string, string> = {};

      style.height = typeof props.headerHeight === "number" ? `${props.headerHeight}px` : props.headerHeight;

      if (props.headerBgColor) {
        style.backgroundColor = props.headerBgColor;
      }

      if (props.headerBgImage) {
        style.backgroundImage = `url(${props.headerBgImage})`;
        style.backgroundSize = "cover";
        style.backgroundPosition = "center";
      }

      return style;
    });

    return {
      headerStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-card-header-content {
  border-radius: var(--stitch-lay-radius-md);
  border: 1px solid var(--stitch-lay-border);
  background: var(--stitch-lay-bg-panel);
  backdrop-filter: blur(10px);
  overflow: hidden;
  color: var(--stitch-lay-text-main);
  transition: var(--stitch-lay-transition);
  position: relative;
  box-shadow: var(--stitch-lay-shadow-sm);

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
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px 20px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, var(--el-color-primary-light-8), transparent);
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(to right, transparent, var(--el-color-primary-light-5), transparent);
    }
  }

  // 主题变体混合宏
  @mixin theme-variant($type) {
    &::before {
      background: linear-gradient(135deg, var(--el-color-#{$type}) 0%, var(--el-color-#{$type}-light-3) 100%);
    }

    .sc-card-header-content__header {
      background: linear-gradient(135deg, var(--el-color-#{$type}-light-9) 0%, var(--el-color-#{$type}-light-8) 100%);

      &::before {
        background: linear-gradient(to bottom, var(--el-color-#{$type}-light-8), transparent);
      }

      &::after {
        background: linear-gradient(to right, transparent, var(--el-color-#{$type}-light-5), transparent);
      }
    }
  }

  &.theme--primary { @include theme-variant('primary'); }
  &.theme--success { @include theme-variant('success'); }
  &.theme--warning { @include theme-variant('warning'); }
  &.theme--danger { @include theme-variant('danger'); }
  &.theme--info { @include theme-variant('info'); }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-align: center;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;

    &::after {
      content: "";
      display: block;
      width: 50px;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--el-color-primary), transparent);
      margin: 12px auto 0;
      border-radius: 2px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
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

      .sc-card-header-content__header {
        &::before {
          opacity: 1;
        }
      }

      .sc-card-header-content__title::after {
        width: 80px;
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
