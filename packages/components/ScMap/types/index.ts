import type { Component } from 'vue';
// 单个地图类型接口
export interface MapTypeItem {
  name: string;       // 地图类型名称
  url: string;        // 瓦片图URL
  attribution: string; // 版权信息
}

// 地图类型集合接口
export interface MapTypes {
  [key: string]: MapTypeItem;
}

// 地图类型常量 - 所有使用高德地图
export const MAP_TYPES: MapTypes = {
  NORMAL: {
    name: "标准地图",
    url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>'
  },
  SATELLITE: {
    name: "卫星图",
    url: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>'
  },
  HYBRID: {
    name: "混合地图",
    url: "https://webst01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>'
  },
  TRAFFIC: {
    name: "交通图",
    url: "https://webrd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=7",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>'
  },
  ROAD: {
    name: "路网图",
    url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>'
  },
};

// 组件属性
export interface ScMapProps {
  // 地图高度
  height?: string;
  // 地图类型对象
  mapType?: Record<string, any>;
  // 当前图层类型
  layerType?: string;
  // 自定义URL（优先级高于mapType）
  url?: string;
  // 中心点
  center?: [number, number];
  // 缩放级别
  zoom?: number;
  // 是否可拖动
  dragging?: boolean;
  // 是否允许滚轮缩放
  scrollWheelZoom?: boolean;
  // API密钥（如果瓦片服务需要）
  apiKey?: string;
  // 是否显示工具栏
  showToolbar?: boolean;
  // 工具栏位置
  toolbarPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // 工具栏方向
  toolbarDirection?: 'horizontal' | 'vertical';
  // 每行/列显示的工具数量
  toolbarItemsPerLine?: number;
  // 工具栏按钮大小
  toolbarSize?: number;
  // 自定义工具列表
  toolbar?: ToolItem[];
}

// 工具按钮接口
export interface ToolItem {
  id: string;
  name: string;
  icon: string | Component;
  active?: boolean;
  tooltip?: string;
  handler?: () => void;
}

// 面板位置类型
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 面板方向类型
export type ToolbarDirection = 'horizontal' | 'vertical';

// 添加自定义工具
export interface AddToolOptions extends ToolItem {
  index?: number;
}
// 图层类型枚举
export enum LayerType {
  NORMAL = 'NORMAL',
  SATELLITE = 'SATELLITE',
  HYBRID = 'HYBRID',
  TRAFFIC = 'TRAFFIC',
  ROAD = 'ROAD'
}

export default MAP_TYPES;
