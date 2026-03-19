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
import StatsSimpleLayout from "./layouts/StatsSimple.vue";
import TechLayout from "./layouts/Tech.vue";
import { getThemeConfig, type IotCardTheme } from "./themes";
import { useThemeComponent } from "../hooks/useThemeComponent";

type LayoutType = "default" | "media" | "header-content" | "panel-3d" | "compact" | "stats" | "stats-simple" | "tech" | "custom";

export default defineComponent({
  name: "ScCard",
  components: {
    ElCard,
    DefaultLayout,
    MediaLayout,
    HeaderContentLayout,
    Panel3D,
    CompactLayout,
    StatsLayout,
    StatsSimpleLayout,
    TechLayout,
  },
  props: {
    layout: {
      type: String as PropType<LayoutType>,
      default: "default",
      validator: (val: string) => ["default", "media", "header-content", "panel-3d", "compact", "stats", "stats-simple", "tech", "custom"].includes(val),
    },
    renderAs: {
      type: String as PropType<"el-card" | "div">,
      default: "div",
      validator: (val: string) => ["el-card", "div"].includes(val),
    },
    title: {
      type: String,
      default: "",
    },
    hoverable: {
      type: Boolean,
      default: false,
    },
    shadow: {
      type: String,
      default: "always",
      validator: (val: string) => ["always", "hover", "never"].includes(val),
    },
    size: {
      type: String as PropType<"small" | "normal" | "large">,
      default: "normal",
      validator: (val: string) => ["small", "normal", "large"].includes(val),
    },
    borderPosition: {
      type: String,
      default: "top",
      validator: (val: string) => ["top", "right", "bottom", "left", "none"].includes(val),
    },
    mediaPosition: {
      type: String,
      default: "left",
      validator: (val: string) => ["left", "right", "top"].includes(val),
    },
    mediaWidth: {
      type: [String, Number],
      default: "120px",
    },
    mediaHeight: {
      type: [String, Number],
      default: "120px",
    },
    mediaBgColor: {
      type: String,
      default: "",
    },
    headerHeight: {
      type: [String, Number],
      default: "120px",
    },
    headerBgColor: {
      type: String,
      default: "",
    },
    headerBgImage: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    theme: {
      type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "blue" | "green" | "purple" | "orange" | "cyan" | "red" | "custom">,
      default: "default",
    },
    iotTheme: {
      type: String as PropType<IotCardTheme>,
      default: undefined,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    depth: {
      type: Number,
      default: 10,
    },
    backgroundColor: {
      type: String,
      default: "",
    },
    borderColor: {
      type: String,
      default: "",
    },
    activeBorderColor: {
      type: String,
      default: "",
    },
    padding: {
      type: String,
      default: "20px",
    },
    subtitle: {
      type: String,
      default: "",
    },
    iconBgColor: {
      type: String,
      default: "",
    },
    value: {
      type: [String, Number],
      default: 0,
    },
    label: {
      type: String,
      default: "",
    },
    trendIcon: {
      type: String,
      default: "",
    },
    trendText: {
      type: String,
      default: "",
    },
    counting: {
      type: Boolean,
      default: false,
    },
    customComponent: {
      type: Object,
      default: null,
    },
  },
  emits: ["click"],
  setup(props, { emit }) {
    const { currentComponent } = useThemeComponent("ElCard");

    const iotThemeConfig = computed(() => {
      if (props.iotTheme) {
        return getThemeConfig(props.iotTheme);
      }
      return undefined;
    });

    const computedIcon = computed(() => iotThemeConfig.value?.icon ?? props.icon);
    const computedTitle = computed(() => iotThemeConfig.value?.title ?? props.title);
    const computedLayout = computed(() => iotThemeConfig.value?.layout ?? props.layout);

    const renderComponent = computed(() => {
      if (props.renderAs === "el-card") {
        return currentComponent.value || ElCard;
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
        case "stats-simple":
          return StatsSimpleLayout;
        case "tech":
          return TechLayout;
        case "custom":
          return props.customComponent || DefaultLayout;
        default:
          return DefaultLayout;
      }
    });

    const componentProps = computed(() => {
      const baseProps = {
        title: props.title,
        hoverable: props.hoverable,
        shadow: props.shadow,
        borderPosition: props.borderPosition,
      };

      if (props.renderAs === "el-card") {
        return {
          header: props.title,
          shadow: props.shadow,
          bodyStyle: props.padding ? { padding: props.padding } : {},
        };
      }

      switch (props.layout) {
        case "media":
          return {
            ...baseProps,
            mediaPosition: props.mediaPosition,
            mediaWidth: props.mediaWidth,
            mediaHeight: props.mediaHeight,
            mediaBgColor: props.mediaBgColor,
            theme: props.theme,
          };
        case "header-content":
          return {
            ...baseProps,
            headerHeight: props.headerHeight,
            headerBgColor: props.headerBgColor,
            headerBgImage: props.headerBgImage,
            theme: props.theme,
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
            padding: props.padding,
          };
        case "compact":
          return {
            ...baseProps,
            icon: props.icon,
            subtitle: props.subtitle,
            iconBgColor: props.iconBgColor,
            active: props.active,
            theme: props.theme,
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
            size: props.size === "normal" ? "small" : props.size,
          };
        case "stats-simple":
          return {
            ...baseProps,
            icon: props.icon,
            value: props.value,
            label: props.label,
            theme: props.theme,
          };
        case "tech": {
          const techThemeMap: Record<string, string> = {
            default: "default",
            primary: "primary",
            success: "green",
            warning: "orange",
            danger: "red",
            info: "blue",
            blue: "blue",
            green: "green",
            purple: "purple",
            orange: "orange",
            cyan: "cyan",
            red: "red",
            custom: "cyan",
          };
          return {
            ...baseProps,
            icon: props.icon,
            showHeader: props.showHeader,
            active: props.active,
            theme: techThemeMap[props.theme] || "cyan",
            padding: props.padding,
            showDataFlow: true,
          };
        }
        case "custom":
          return {
            ...baseProps,
            ...props,
            theme: props.theme,
          };
        default:
          return {
            ...baseProps,
            theme: props.theme,
          };
      }
    });

    const handleClick = (event: MouseEvent) => {
      emit("click", event);
    };

    return {
      renderComponent,
      componentProps,
      handleClick,
      iotThemeConfig,
      computedIcon,
      computedTitle,
      computedLayout,
    };
  },
});
</script>

<style lang="scss">
.sc-card-wrapper {
  display: block;
  width: 100%;
  height: 100%;

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
