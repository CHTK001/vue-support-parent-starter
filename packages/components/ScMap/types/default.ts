import { ref } from "vue";
import type { MapTypes, ToolItem, TrackPlayerConfig, TrackPlayerOptions } from ".";
import { OVERVIEW_ICON, MEASURE_ICON, MARKER_ICON, POLYLINE_ICON, RECTANGLE_ICON, CIRCLE_ICON, LOCATION_ICON, LAYER_SWITCH_ICON, SHOW_MARKERS_ICON, HIDE_MARKERS_ICON, POLYGON_ICON, CLUSTER_ICON, TRACK_PLAY_ICON, HIDDEN_MARKER_ICON, MARKER_WITH_PLUS_ICON, TRACK_ICON } from "./icon";
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
    icon: TRACK_ICON,
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
  // 播放速度（默认为1，表示实际速度）
  speed: 1,
  // 最大播放速度
  maxSpeed: 4,
  // 是否循环播放
  loop: false,
  // 是否自动播放
  autoPlay: false,
  // 是否跟随播放标记移动地图
  followMarker: true,
  // 是否自动跟随轨迹镜头移动（追踪视角）
  followCamera: false,
  // 是否自动将地图中心设置到轨迹起点
  autoCenter: false,
  // 轨迹线样式
  trackLineOptions: {
    // 是否绘制轨迹线
    isDraw: true,
    // 线宽
    weight: 10,
    // 线颜色
    color: '#0066ff',
    // 线透明度
    opacity: 0.9,
    // 是否绘制轨迹箭头
    showArrow: true
  },
  // 已播放轨迹线样式
  passedLineOptions: {
    // 线宽
    weight: 4,
    // 线颜色
    color: '#22cc66',
    // 线透明度
    opacity: 0.95
  },
  // 未播放轨迹线样式
  notPassedLineOptions: {
    // 线宽
    weight: 3,
    // 线颜色
    color: '#999999',
    // 线透明度
    opacity: 0.8
  },
  // 轨迹点样式
  trackPointOptions: {
    // 是否绘制轨迹点
    isDraw: true,
    // 点半径
    radius: 5,
    // 点颜色
    color: '#0066ff',
    // 点填充颜色
    fillColor: '#ffffff',
    // 点透明度
    opacity: 0.95
  },
  // 标记点样式
  markerOptions: {
    // 是否使用图片
    useImg: false,
    // 图片URL
    imgUrl: '',
    // 宽度
    width: 24,
    // 高度
    height: 24,
    // 颜色（useImg为false时有效）
    color: '#1890ff',
    // 填充颜色（useImg为false时有效）
    fillColor: '#ffffff',
    // 是否根据方向旋转标记
    rotate: true,
    // 旋转偏移量
    rotationOffset: 0
  }
};

export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfig = {
  // 位置
  position: 'topright',
  // 轨迹列表
  trackList: []
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
