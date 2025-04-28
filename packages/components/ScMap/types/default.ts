import { ref } from "vue";
import type { MapTypes, ToolItem, TrackPlayerOptions } from ".";
import { OVERVIEW_ICON, MEASURE_ICON, MARKER_ICON, POLYLINE_ICON, RECTANGLE_ICON, CIRCLE_ICON, LOCATION_ICON, LAYER_SWITCH_ICON, SHOW_MARKERS_ICON, HIDE_MARKERS_ICON, POLYGON_ICON, CLUSTER_ICON, TRACK_PLAY_ICON } from "./icon";
import { DEFAULT_NORMAL_MAP_IMAGE, DEFAULT_ROAD_MAP_IMAGE, DEFAULT_SATELLITE_MAP_IMAGE, DEFAULT_TRAFFIC_MAP_IMAGE } from "./base64";

// 默认工具列表
export const DEFAULT_TOOL_ITEMS = [
  {
    id: 'measure',
    name: '测距',
    icon: MEASURE_ICON,
    tooltip: '点击开始测量距离'
  },
  {
    id: 'drawPoint',
    name: '标记点',
    icon: MARKER_ICON,
    tooltip: '点击添加标记点',
    multi: true
  },
  {
    id: 'cluster',
    name: '聚合',
    icon: CLUSTER_ICON,
    tooltip: '开启/关闭标记点聚合',
    multi: true
  },
  {
    id: 'drawCircle',
    name: '绘制圆',
    icon: CIRCLE_ICON,
    tooltip: '点击绘制圆形',
    multi: true
  },
  {
    id: 'drawRectangle',
    name: '绘制矩形',
    icon: RECTANGLE_ICON,
    tooltip: '点击绘制矩形',
    multi: true
  },
  {
    id: 'drawPolygon',
    name: '绘制多边形',
    icon: POLYGON_ICON,
    tooltip: '点击绘制多边形',
    multi: true
  },
  {
    id: 'drawPolyline',
    name: '绘制线段',
    icon: POLYLINE_ICON,
    tooltip: '点击绘制线段',
    multi: true
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
  },
  {
    id: 'overview',
    name: '鹰眼',
    icon: OVERVIEW_ICON,
    tooltip: '打开/关闭鹰眼地图',
    multi: true
  },
  {
    id: 'trackPlay',
    name: '轨迹回放',
    icon: TRACK_PLAY_ICON,
    tooltip: '轨迹回放',
    multi: true
  }
];

// 轨迹播放默认配置
export const DEFAULT_TRACK_PLAYER_OPTIONS: TrackPlayerOptions = {
  speed: 1,
  maxSpeed: 16,
  loop: false,
  autoPlay: false,
  followMarker: true,
  trackLineOptions: {
    isDraw: true,
    weight: 3,
    color: '#3388ff',
    opacity: 0.8,
    showArrow: true
  },
  passedLineOptions: {
    weight: 3,
    color: '#00ff00',
    opacity: 0.8
  },
  notPassedLineOptions: {
    weight: 3,
    color: '#ff0000',
    opacity: 0.5
  },
  trackPointOptions: {
    isDraw: false,
    radius: 4,
    color: '#3388ff',
    fillColor: '#3388ff',
    opacity: 0.6
  },
  markerOptions: {
    useImg: true,
    width: 24,
    height: 24,
    color: '#3388ff',
    fillColor: '#3388ff',
    rotate: true,
    rotationOffset: 0
  }
};

// 地图类型常量 - 所有使用高德地图
export const MAP_TYPES: MapTypes = {
  NORMAL: {
    name: "标准地图",
    url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>',
    image: DEFAULT_NORMAL_MAP_IMAGE
  },
  SATELLITE: {
    name: "卫星图",
    url: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>',
    image: DEFAULT_SATELLITE_MAP_IMAGE
  },
  TRAFFIC: {
    name: "交通图",
    url: "https://webrd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=7",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>',
    image: DEFAULT_TRAFFIC_MAP_IMAGE
  },
  ROAD: {
    name: "路网图",
    url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://amap.com">高德地图</a>',
    image: DEFAULT_ROAD_MAP_IMAGE
  },
};


export default MAP_TYPES;
