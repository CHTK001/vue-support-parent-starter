import type { WidgetTypeDefinition } from "../types/widget";

export const headerWidgets: WidgetTypeDefinition[] = [
  {
    type: "header",
    label: "SciFi 头部",
    category: "header",
    icon: "ri:layout-top-line",
    description: "大屏顶部标题栏",
    variants: ["A1", "A2", "B1", "B2"],
    defaultVariant: "A1",
    defaultWidth: 1920,
    defaultHeight: 80,
    minWidth: 400,
    minHeight: 50,
    supportsDataBinding: false,
    configFields: [
      { key: "title", label: "主标题", type: "text", defaultValue: "数据可视化大屏", group: "内容" },
      { key: "subTitle", label: "副标题", type: "text", defaultValue: "DATA VISUALIZATION", group: "内容" },
      { key: "glowOpacity", label: "发光透明度", type: "slider", defaultValue: 0.8, min: 0, max: 1, step: 0.1, group: "外观" },
    ],
    defaultConfig: { title: "数据可视化大屏" },
    renderComponent: (variant) => `scifiHeader${variant}`,
  },
];
