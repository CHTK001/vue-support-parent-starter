import type { ExtractPropTypes, PropType } from "vue";
import type { IotCardTheme } from "./themes";

export type ScCardLayoutType =
  | "default"
  | "media"
  | "header-content"
  | "panel-3d"
  | "compact"
  | "stats"
  | "stats-simple"
  | "tech"
  | "custom";

export const scCardProps = {
  layout: {
    type: String as PropType<ScCardLayoutType>,
    default: "default",
    validator: (val: string) => [
      "default",
      "media",
      "header-content",
      "panel-3d",
      "compact",
      "stats",
      "stats-simple",
      "tech",
      "custom",
    ].includes(val),
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
    type: String as PropType<
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "blue"
      | "green"
      | "purple"
      | "orange"
      | "cyan"
      | "red"
      | "custom"
    >,
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
} as const;

export type ScCardProps = ExtractPropTypes<typeof scCardProps>;
