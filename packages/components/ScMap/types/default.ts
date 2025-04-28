import { ref } from "vue";
import type { MapTypes, ToolItem, TrackPlayerOptions } from ".";
import { OVERVIEW_ICON, MEASURE_ICON, MARKER_ICON, POLYLINE_ICON, RECTANGLE_ICON, CIRCLE_ICON, LOCATION_ICON, LAYER_SWITCH_ICON, SHOW_MARKERS_ICON, HIDE_MARKERS_ICON, POLYGON_ICON, CLUSTER_ICON, TRACK_PLAY_ICON, HIDDEN_MARKER_ICON, MARKER_WITH_PLUS_ICON } from "./icon";
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
    id: 'toggleMarkers',
    name: '显示/隐藏标记',
    icon: MARKER_ICON,
    alternateIcon: HIDDEN_MARKER_ICON,
    tooltip: '显示/隐藏地图标记点',
    multi: true,
    toggleState: false
  },
  {
    id: 'drawPoint',
    name: '标记点',
    icon: MARKER_WITH_PLUS_ICON,
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

// 轨迹播放器默认主题配置
export const TRACK_PLAYER_THEMES = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    textColor: '#333',
    buttonColor: '#666',
    buttonActiveColor: '#1890ff',
    buttonHoverColor: '#40a9ff',
    progressBarColor: '#1890ff',
    progressBarBackgroundColor: '#f0f0f0',
    borderColor: '#e8e8e8'
  },
  dark: {
    backgroundColor: 'rgba(42, 45, 56, 0.9)',
    textColor: '#f0f0f0',
    buttonColor: '#aaa',
    buttonActiveColor: '#1890ff',
    buttonHoverColor: '#40a9ff',
    progressBarColor: '#1890ff',
    progressBarBackgroundColor: '#555',
    borderColor: '#666'
  }
};

// 轨迹播放默认配置
export const DEFAULT_TRACK_PLAYER_OPTIONS: TrackPlayerOptions = {
  speed: 600,
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
    imgUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA4OGZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1tYXAtcGluIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyI+PC9jaXJjbGU+PC9zdmc+',
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
