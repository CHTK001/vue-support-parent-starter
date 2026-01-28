<template>
  <div
    class="sc-card-header-content"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`border-position--${borderPosition}`]: true
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
import { defineComponent, computed } from "vue";

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
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px 20px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(99, 102, 241, 0.15), transparent);
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
      background: linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), transparent);
    }
  }

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
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: linear-gradient(to top, rgba(255, 255, 255, 0.5), transparent);
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: rgba(99, 102, 241, 0.3);

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
