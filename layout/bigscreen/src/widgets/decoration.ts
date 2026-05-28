import type { WidgetTypeDefinition } from "../types/widget";

export const decorationWidgets: WidgetTypeDefinition[] = [
  {
    type: "decoration",
    label: "装饰线条",
    category: "decoration",
    icon: "ri:separator",
    description: "科技感装饰分隔线",
    variants: ["A1", "B1", "B2", "B3", "C1"],
    defaultVariant: "A1",
    defaultWidth: 400,
    defaultHeight: 20,
    minWidth: 100,
    minHeight: 10,
    supportsDataBinding: false,
    configFields: [
      { key: "decorationColorAlt", label: "替换颜色", type: "boolean", defaultValue: false, group: "外观" },
    ],
    defaultConfig: { opacity: 1 },
    renderComponent: (variant) => `ScifiDeco${variant}`,
  },
  {
    type: "panel-title",
    label: "面板标题",
    category: "decoration",
    icon: "ri:heading",
    description: "小标题装饰条",
    variants: ["A1", "A2", "A3"],
    defaultVariant: "A1",
    defaultWidth: 300,
    defaultHeight: 30,
    minWidth: 100,
    minHeight: 20,
    supportsDataBinding: false,
    configFields: [
      { key: "title", label: "标题文本", type: "text", defaultValue: "小标题", group: "内容" },
    ],
    defaultConfig: { title: "小标题" },
    renderComponent: (variant) => `ScifiPanelTitle${variant}`,
  },
];
