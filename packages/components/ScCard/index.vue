<template>
  <component :is="renderComponent" v-bind="componentProps" @click="handleClick">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </component>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { ElCard } from "element-plus";
import DefaultLayout from "./layouts/Default.vue";
import MediaLayout from "./layouts/Media.vue";
import HeaderContentLayout from "./layouts/HeaderContent.vue";
import Panel3D from "./layouts/Panel3D.vue";
import CompactLayout from "./layouts/Compact.vue";
import StatsLayout from "./layouts/Stats.vue";

// 布局类型
type LayoutType = "default" | "media" | "header-content" | "panel-3d" | "compact" | "stats" | "custom";

export default defineComponent({
  name: "ScCard",
  components: {
    ElCard,
    DefaultLayout,
    MediaLayout,
    HeaderContentLayout,
    Panel3D,
    CompactLayout,
    StatsLayout
  },
  props: {
    /**
     * 卡片布局类型
     */
    layout: {
      type: String as PropType<LayoutType>,
      default: "default",
      validator: (val: string) => ["default", "media", "header-content", "panel-3d", "compact", "stats", "custom"].includes(val)
    },
    /**
     * 渲染模式，可以选择使用 el-card 或自定义 div
     */
    renderAs: {
      type: String as PropType<"el-card" | "div">,
      default: "div",
      validator: (val: string) => ["el-card", "div"].includes(val)
    },
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
      default: "always",
      validator: (val: string) => ["always", "hover", "never"].includes(val)
    },
    /**
     * 卡片尺寸
     */
    size: {
      type: String as PropType<"small" | "normal" | "large">,
      default: "normal",
      validator: (val: string) => ["small", "normal", "large"].includes(val)
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
     * 媒体位置（仅在 layout="media" 时有效）
     */
    mediaPosition: {
      type: String,
      default: "left",
      validator: (val: string) => ["left", "right", "top"].includes(val)
    },
    /**
     * 媒体宽度（仅在 layout="media" 时有效）
     */
    mediaWidth: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 媒体高度（仅在 layout="media" 时有效）
     */
    mediaHeight: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 媒体背景色（仅在 layout="media" 时有效）
     */
    mediaBgColor: {
      type: String,
      default: ""
    },
    /**
     * 头部高度（仅在 layout="header-content" 时有效）
     */
    headerHeight: {
      type: [String, Number],
      default: "120px"
    },
    /**
     * 头部背景色（仅在 layout="header-content" 时有效）
     */
    headerBgColor: {
      type: String,
      default: ""
    },
    /**
     * 头部背景图（仅在 layout="header-content" 时有效）
     */
    headerBgImage: {
      type: String,
      default: ""
    },
    /**
     * 3D面板图标（仅在 layout="panel-3d" 时有效）
     */
    icon: {
      type: String,
      default: ""
    },
    /**
     * 主题色（panel-3d/compact/stats 布局有效）
     */
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "blue" | "green" | "purple" | "orange" | "custom">,
      default: "default"
    },
    /**
     * 是否显示头部（仅在 layout="panel-3d" 时有效）
     */
    showHeader: {
      type: Boolean,
      default: true
    },
    /**
     * 是否激活状态（仅在 layout="panel-3d" 时有效）
     */
    active: {
      type: Boolean,
      default: false
    },
    /**
     * 3D效果强度（仅在 layout="panel-3d" 时有效）
     */
    depth: {
      type: Number,
      default: 10
    },
    /**
     * 背景色（仅在 layout="panel-3d" 时有效）
     */
    backgroundColor: {
      type: String,
      default: ""
    },
    /**
     * 边框颜色（仅在 layout="panel-3d" 时有效）
     */
    borderColor: {
      type: String,
      default: ""
    },
    /**
     * 激活时边框颜色（仅在 layout="panel-3d" 时有效）
     */
    activeBorderColor: {
      type: String,
      default: ""
    },
    /**
     * 内边距
     */
    padding: {
      type: String,
      default: "20px"
    },
    /**
     * 副标题（仅在 layout="compact" 时有效）
     */
    subtitle: {
      type: String,
      default: ""
    },
    /**
     * 图标背景色（仅在 layout="compact" 时有效）
     */
    iconBgColor: {
      type: String,
      default: ""
    },
    /**
     * 数值（仅在 layout="stats" 时有效）
     */
    value: {
      type: [String, Number],
      default: ""
    },
    /**
     * 标签（仅在 layout="stats" 时有效）
     */
    label: {
      type: String,
      default: ""
    },
    /**
     * 趋势图标（仅在 layout="stats" 时有效）
     */
    trendIcon: {
      type: String,
      default: ""
    },
    /**
     * 趋势文本（仅在 layout="stats" 时有效）
     */
    trendText: {
      type: String,
      default: ""
    },
    /**
     * 是否正在计数动画（仅在 layout="stats" 时有效）
     */
    counting: {
      type: Boolean,
      default: false
    },
    /**
     * 自定义组件（仅在 layout="custom" 时有效）
     */
    customComponent: {
      type: Object,
      default: null
    }
  },
  emits: ["click"],
  setup(props, { emit }) {
    // 根据布局类型和渲染模式决定使用哪个组件
    const renderComponent = computed(() => {
      if (props.renderAs === "el-card") {
        return "el-card";
      }

      switch (props.layout) {
        case "media":
          return MediaLayout;
        case "header-content":
          return HeaderContentLayout;
        case "panel-3d":
          return Panel3D;
        case "compact":
          return CompactLayout;
        case "stats":
          return StatsLayout;
        case "custom":
          return props.customComponent || DefaultLayout;
        default:
          return DefaultLayout;
      }
    });

    // 根据不同的组件类型，传递不同的属性
    const componentProps = computed(() => {
      const baseProps = {
        title: props.title,
        hoverable: props.hoverable,
        shadow: props.shadow,
        borderPosition: props.borderPosition
      };

      if (props.renderAs === "el-card") {
        return {
          header: props.title,
          shadow: props.shadow,
          bodyStyle: props.padding ? { padding: props.padding } : {}
        };
      }

      switch (props.layout) {
        case "media":
          return {
            ...baseProps,
            mediaPosition: props.mediaPosition,
            mediaWidth: props.mediaWidth,
            mediaHeight: props.mediaHeight,
            mediaBgColor: props.mediaBgColor
          };
        case "header-content":
          return {
            ...baseProps,
            headerHeight: props.headerHeight,
            headerBgColor: props.headerBgColor,
            headerBgImage: props.headerBgImage
          };
        case "panel-3d":
          return {
            ...baseProps,
            icon: props.icon,
            showHeader: props.showHeader,
            active: props.active,
            depth: props.depth,
            theme: props.theme,
            backgroundColor: props.backgroundColor,
            borderColor: props.borderColor,
            activeBorderColor: props.activeBorderColor,
            padding: props.padding
          };
        case "compact":
          return {
            ...baseProps,
            icon: props.icon,
            subtitle: props.subtitle,
            iconBgColor: props.iconBgColor,
            active: props.active,
            theme: props.theme
          };
        case "stats":
          return {
            ...baseProps,
            icon: props.icon,
            value: props.value,
            label: props.label,
            trendIcon: props.trendIcon,
            trendText: props.trendText,
            counting: props.counting,
            active: props.active,
            theme: props.theme,
            size: props.size === "normal" ? "small" : props.size
          };
        case "custom":
          return {
            ...baseProps,
            ...props
          };
        default:
          return baseProps;
      }
    });

    // 点击事件处理
    const handleClick = (event: MouseEvent) => {
      emit("click", event);
    };

    return {
      renderComponent,
      componentProps,
      handleClick
    };
  }
});
</script>

<style lang="scss">
// 全局样式，确保组件在不同场景下的一致性
.sc-card-wrapper {
  display: block;
  width: 100%;
  height: 100%;

  // 支持Element Plus变量
  --el-color-primary: var(--el-color-primary);
  --el-color-primary-light-3: var(--el-color-primary-light-3);
  --el-color-primary-light-5: var(--el-color-primary-light-5);
  --el-color-primary-light-7: var(--el-color-primary-light-7);
  --el-color-primary-light-9: var(--el-color-primary-light-9);
  --el-color-primary-rgb: var(--el-color-primary-rgb);
  --el-border-color: var(--el-border-color);
  --el-border-color-light: var(--el-border-color-light);
  --el-border-color-lighter: var(--el-border-color-lighter);
  --el-text-color-primary: var(--el-text-color-primary);
  --el-text-color-regular: var(--el-text-color-regular);
  --el-text-color-secondary: var(--el-text-color-secondary);
  --el-bg-color: var(--el-bg-color);
  --el-bg-color-overlay: var(--el-bg-color-overlay);
  --el-fill-color-light: var(--el-fill-color-light);
  --el-fill-color-blank: var(--el-fill-color-blank);
  --el-box-shadow-light: var(--el-box-shadow-light);
  --el-box-shadow: var(--el-box-shadow);
}
</style>
