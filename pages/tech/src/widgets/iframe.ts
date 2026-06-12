import type { WidgetTypeDefinition } from "../types/widget";

export const iframeWidgets: WidgetTypeDefinition[] = [
  {
    type: "iframe",
    label: "网页嵌入",
    category: "iframe",
    icon: "ri:global-line",
    description: "嵌入外部网页内容",
    variants: ["default"],
    defaultVariant: "default",
    defaultWidth: 600,
    defaultHeight: 400,
    minWidth: 200,
    minHeight: 200,
    supportsDataBinding: false,
    configFields: [
      { key: "iframeSrc", label: "网页地址", type: "text", defaultValue: "", group: "内容" },
      { key: "iframeAllowFullscreen", label: "允许全屏", type: "boolean", defaultValue: false, group: "行为" },
    ],
    defaultConfig: {
      iframe: { src: "", allowFullscreen: false, sandbox: "allow-scripts allow-same-origin" },
    },
    renderComponent: () => "BigScreenIframe",
  },
];
