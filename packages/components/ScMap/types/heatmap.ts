import type { LayerGroup } from 'leaflet';

// 热力图配置接口
export interface HeatMapOptions {
  // 热力点半径，默认25
  radius?: number;
  // 模糊度，默认15
  blur?: number;
  // 最大不透明度，默认0.8
  maxOpacity?: number;
  // 最小不透明度，默认0.1
  minOpacity?: number;
  // 颜色渐变配置
  gradient?: {[key: string]: string};
  // 是否随地图缩放改变半径
  scaleRadius?: boolean;
  // 是否使用局部极值
  useLocalExtrema?: boolean;
  // 纬度字段名
  latField?: string;
  // 经度字段名
  lngField?: string;
  // 权重字段名
  valueField?: string;
  // 最大值，默认1.0
  max?: number;
  // 是否启用
  enabled?: boolean;
  // 相似半径（公里），小于此距离的点会被合并为一个点
  similarRadius?: number;
  // 权重字段名称
  weightField?: string;
  // 标记图层引用
  markerLayerGroup?: LayerGroup;
  // 是否包含隐藏的标记点
  includeHiddenMarkers?: boolean;
  // 选项配置
  options?: any;
}

// 热力点数据接口
export interface HeatPoint {
  // 纬度
  lat: number;
  // 经度
  lng: number;
  // 热力值
  value: number;
} 