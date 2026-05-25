import type { WidgetTypeDefinition } from "../types/widget";

export const scrollingTextWidgets: WidgetTypeDefinition[] = [
  {
    type: "scrolling-text",
    label: "滚动字幕",
    category: "text",
    icon: "ri:scroll-to-bottom-line",
    description: "水平/垂直滚动的文字公告",
    variants: ["default"],
    defaultVariant: "default",
    defaultWidth: 800,
    defaultHeight: 40,
    minWidth: 200,
    minHeight: 20,
    supportsDataBinding: true,
    configFields: [
      { key: "scrollContent", label: "滚动内容", type: "textarea", defaultValue: "这是一条滚动公告信息...", group: "内容" },
      { key: "scrollSpeed", label: "滚动速度 (px/s)", type: "number", defaultValue: 50, min: 10, max: 500, group: "行为" },
      { key: "scrollDirection", label: "滚动方向", type: "select", defaultValue: "left", options: [
        { label: "向左", value: "left" },
        { label: "向右", value: "right" },
      ], group: "行为" },
      { key: "fontSize", label: "字号", type: "number", defaultValue: 16, min: 10, max: 60, group: "外观" },
      { key: "color", label: "文字颜色", type: "color", defaultValue: "#00f6ff", group: "外观" },
    ],
    defaultConfig: {
      scrollingText: {
        content: "这是一条滚动公告信息...",
        speed: 50,
        direction: "left",
        fontSize: 16,
        color: "#00f6ff",
      },
    },
    renderComponent: () => "BigScreenScrollingText",
  },
];
