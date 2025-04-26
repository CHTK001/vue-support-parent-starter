import { ref } from "vue";
import type { ToolItem } from ".";
import { MEASURE_ICON, MARKER_ICON, POLYLINE_ICON } from "./icon";

// 默认工具列表
export const DEFAULT_TOOL_ITEMS = [
  {
    id: 'measure',
    name: '测距',
    icon: MEASURE_ICON,
    tooltip: '点击开始测量距离'
  },
  {
    id: 'marker',
    name: '标注',
    icon: MARKER_ICON,
    tooltip: '点击添加标记',
    multi: true
  },
  {
    id: 'polyline',
    name: '绘制线',
    icon: POLYLINE_ICON,
    tooltip: '点击绘制线段',
    show: false // 默认隐藏
  }
];