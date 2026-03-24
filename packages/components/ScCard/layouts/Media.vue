<template>
  <div
    class="sc-card-media"
    :class="{
      'is-hoverable': hoverable,
      'is-shadow': shadow !== 'never',
      'is-shadow-always': shadow === 'always',
      [`media-position--${mediaPosition}`]: true,
      [`border-position--${borderPosition}`]: true,
      [`theme--${theme}`]: true
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

  // 主题变体混合宏
  @mixin theme-variant($type) {
    &::before {
      background: linear-gradient(135deg, var(--el-color-#{$type}) 0%, var(--el-color-#{$type}-light-3) 100%);
    }
    
    &.is-hoverable:hover {
      border-color: var(--el-color-#{$type}-light-5);
    }
  }

  &.theme--primary { @include theme-variant('primary'); }
  &.theme--success { @include theme-variant('success'); }
  &.theme--warning { @include theme-variant('warning'); }
  &.theme--danger { @include theme-variant('danger'); }
  &.theme--info { @include theme-variant('info'); }

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
      border-right: 1px solid var(--el-border-color-lighter);
    }
  }

  &.media-position--right {
    flex-direction: row-reverse;

    .sc-card-media__media {
      border-left: 1px solid var(--el-border-color-lighter);
    }
  }

  &.media-position--top {
    flex-direction: column;

    .sc-card-media__media {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }

  &__media {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
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
      box-shadow: var(--el-box-shadow);
      border-color: var(--el-color-primary-light-5);

      .sc-card-media__media {
        transform: scale(1.02);
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

  // 主题色混入
  @mixin theme-variant($color-name) {
    &::before {
      background: linear-gradient(135deg, var(--el-color-#{$color-name}) 0%, var(--el-color-#{$color-name}-light-3) 100%);
    }

    .sc-card-media__media {
      background: linear-gradient(135deg, var(--el-color-#{$color-name}-light-9) 0%, var(--el-color-#{$color-name}-light-8) 100%);
    }

    &.is-hoverable:hover,
    &.is-shadow:hover,
    &.is-shadow-always:hover {
      border-color: var(--el-color-#{$color-name}-light-5);
    }
  }

  &.theme--primary {
    @include theme-variant(primary);
  }

  &.theme--success {
    @include theme-variant(success);
  }

  &.theme--warning {
    @include theme-variant(warning);
  }

  &.theme--danger {
    @include theme-variant(danger);
  }

  &.theme--info {
    @include theme-variant(info);
  }
}
</style>
