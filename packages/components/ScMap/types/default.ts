import { ref } from "vue";
import type { ToolItem } from ".";
import { MEASURE_ICON } from "./icon";

// 默认工具列表
export const DEFAULT_TOOL_ITEMS = ref<ToolItem[]>([
  {
    id: 'measure',
    name: '测距',
    icon: MEASURE_ICON,
    tooltip: '点击开始测量距离',
    active: false
  }
]);