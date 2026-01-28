<template>
  <div
    class="sc-card-media"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`media-position--${mediaPosition}`]: true,
      [`border-position--${borderPosition}`]: true
    }"
  >
    <div class="sc-card-media__media" :style="mediaStyle">
      <slot name="media" />
    </div>

    <div class="sc-card-media__content">
      <div v-if="$slots.header || title" class="sc-card-media__header">
        <slot name="header">
          <div class="sc-card-media__title">{{ title }}</div>
          <div v-if="$slots['media-subtitle']" class="sc-card-media__subtitle">
            <slot name="media-subtitle" />
          </div>
        </slot>
      </div>

      <div class="sc-card-media__body">
        <slot />
      </div>

      <div v-if="$slots['media-footer'] || $slots.footer" class="sc-card-media__footer">
        <slot name="media-footer">
          <slot name="footer" />
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "MediaLayout",
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
     * 媒体位置
     */
    mediaPosition: {
      type: String,
      default: "left",
      validator: (val: string) => ["left", "right", "top"].includes(val)
    },
    /**
     * 媒体宽度
     */
    mediaWidth: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 媒体高度
     */
    mediaHeight: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 媒体背景色
     */
    mediaBgColor: {
      type: String,
      default: ""
    }
  },
  setup(props) {
    const mediaStyle = computed(() => {
      const style: Record<string, string> = {};

      if (props.mediaPosition === "left" || props.mediaPosition === "right") {
        style.width = typeof props.mediaWidth === "number" ? `${props.mediaWidth}px` : props.mediaWidth;
      } else if (props.mediaPosition === "top") {
        style.height = typeof props.mediaHeight === "number" ? `${props.mediaHeight}px` : props.mediaHeight;
      }

      if (props.mediaBgColor) {
        style.backgroundColor = props.mediaBgColor;
      }

      return style;
    });

    return {
      mediaStyle
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-card-media {
  display: flex;
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

  &.media-position--left {
    flex-direction: row;

    .sc-card-media__media {
      border-right: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  &.media-position--right {
    flex-direction: row-reverse;

    .sc-card-media__media {
      border-left: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  &.media-position--top {
    flex-direction: column;

    .sc-card-media__media {
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  &__media {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__header {
    padding: 20px 24px 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
    letter-spacing: 0.3px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }

  &__body {
    padding: 16px 24px;
    flex: 1;
  }

  &__footer {
    padding: 0 24px 20px;
    margin-top: auto;
  }

  &.is-hoverable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: rgba(99, 102, 241, 0.3);

      .sc-card-media__media {
        transform: scale(1.02);
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
