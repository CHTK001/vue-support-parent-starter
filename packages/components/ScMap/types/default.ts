import { ref } from "vue";
import type { ToolItem } from ".";
import { MEASURE_ICON, MARKER_ICON, POLYLINE_ICON, LOCATION_ICON, LAYER_SWITCH_ICON } from "./icon";

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
  },
  {
    id: 'coordinate',
    name: '坐标定位',
    icon: LOCATION_ICON,
    tooltip: '显示鼠标位置的坐标',
    multi: true
  },
  {
    id: 'layerSwitch',
    name: '图层切换',
    icon: LAYER_SWITCH_ICON,
    tooltip: '切换地图图层类型',
    multi: true
  }
];