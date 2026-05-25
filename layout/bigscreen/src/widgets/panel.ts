import type { WidgetTypeDefinition } from "../types/widget";

const PANEL_VARIANTS = ["A1", "A2", "A3", "B1", "B2", "B3", "B4"];
const DATAVIEW_VARIANTS = ["DV1", "DV2", "DV3", "DV4", "DV5", "DV6", "DV7", "DV8", "DV9"];

export const panelWidgets: WidgetTypeDefinition[] = [
  {
    type: "panel",
    label: "SciFi 面板",
    category: "panel",
    icon: "ri:layout-grid-line",
    description: "通用容器面板，支持 7 种样式变体",
    variants: PANEL_VARIANTS,
    defaultVariant: "A1",
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 200,
    minHeight: 150,
    supportsDataBinding: true,
    configFields: [
      { key: "title", label: "标题", type: "text", defaultValue: "面板标题", group: "外观" },
      { key: "glow", label: "发光效果", type: "boolean", defaultValue: true, group: "外观" },
      { key: "glowOpacity", label: "发光透明度", type: "slider", defaultValue: 0.5, min: 0, max: 1, step: 0.1, group: "外观" },
      { key: "backgroundOpacity", label: "背景透明度", type: "slider", defaultValue: 0.5, min: 0, max: 1, step: 0.1, group: "外观" },
      { key: "decorationColorAlt", label: "替换装饰色", type: "boolean", defaultValue: false, group: "外观" },
    ],
    defaultConfig: { title: "面板标题", glow: true, glowOpacity: 0.5, backgroundOpacity: 0.5 },
    renderComponent: (variant) => `scifiPanel${variant}`,
  },
  {
    type: "dataview-panel",
    label: "数据面板",
    category: "panel",
    icon: "ri:bar-chart-box-line",
    description: "数据可视化专用面板，9 种变体",
    variants: DATAVIEW_VARIANTS,
    defaultVariant: "DV1",
    defaultWidth: 500,
    defaultHeight: 350,
    minWidth: 250,
    minHeight: 200,
    supportsDataBinding: true,
    configFields: [
      { key: "title", label: "标题", type: "text", defaultValue: "数据面板", group: "外观" },
      { key: "glow", label: "发光效果", type: "boolean", defaultValue: true, group: "外观" },
      { key: "glowOpacity", label: "发光透明度", type: "slider", defaultValue: 0.5, min: 0, max: 1, step: 0.1, group: "外观" },
    ],
    defaultConfig: { title: "数据面板", glow: true },
    renderComponent: (variant) => `scifiPanel${variant}`,
  },
];
