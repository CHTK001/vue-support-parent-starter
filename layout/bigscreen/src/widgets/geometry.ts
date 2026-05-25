import type { WidgetTypeDefinition } from "../types/widget";

const GEOMETRY_VARIANTS = ["Hexagon", "Circle", "Line", "Diamond", "Triangle"];

export const geometryWidgets: WidgetTypeDefinition[] = [
  {
    type: "geometry",
    label: "几何图形",
    category: "geometry",
    icon: "ri:shapes-line",
    description: "科技感几何装饰元素",
    variants: GEOMETRY_VARIANTS,
    defaultVariant: "Hexagon",
    defaultWidth: 120,
    defaultHeight: 120,
    minWidth: 40,
    minHeight: 40,
    supportsDataBinding: false,
    configFields: [
      { key: "glowOpacity", label: "发光透明度", type: "slider", defaultValue: 0.6, min: 0, max: 1, step: 0.1, group: "外观" },
      { key: "decorationColorAlt", label: "替换颜色", type: "boolean", defaultValue: false, group: "外观" },
    ],
    defaultConfig: { glowOpacity: 0.6 },
    renderComponent: (variant) => `scifiGeometry${variant}`,
  },
];
