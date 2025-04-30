import { ref } from "vue";
import type { MapTypes, ToolItem, TrackPlayerConfig, TrackPlayerOptions } from ".";
import { 
  OVERVIEW_ICON, 
  MEASURE_ICON, 
  MARKER_ICON,
  POLYLINE_ICON, 
  RECTANGLE_ICON, 
  CIRCLE_ICON, 
  LOCATION_ICON, 
  LAYER_SWITCH_ICON, 
  SHOW_MARKERS_ICON as SHOW_MARKERS_LABEL_ICON, 
  HIDE_MARKERS_LABEL_ICON, 
  POLYGON_ICON, 
  CLUSTER_ICON, 
  TRACK_PLAY_ICON, 
  HIDDEN_MARKER_ICON, 
  MARKER_WITH_PLUS_ICON, 
  TRACK_ICON, 
  DEBUG_ICON, 
  MARKER_VISIBLE_ICON, 
  MARKER_HIDDEN_ICON 
} from "./icon";
import { DEFAULT_NORMAL_MAP_IMAGE, DEFAULT_ROAD_MAP_IMAGE, DEFAULT_SATELLITE_MAP_IMAGE, DEFAULT_TRAFFIC_MAP_IMAGE } from "./base64";

// 默认轨迹标记图标
export const DEFAULT_TRACK_MARKER_SVG = `
<svg t="1745928213341" class="icon" style="transform: rotate(90deg) scale(-1, 1)" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2890" width="32" height="32"><path d="M727.899188 473.53392c-4.592598 0-9.149381 0.148379-13.676487 0.412392l-50.779523-348.470553 124.430964 0c34.452673 0 71.532173 16.374946 71.532173 52.118008 0 13.060457-5.731538 25.421996-16.138562 34.634822-12.922311 11.437493-32.074509 17.483186-55.393611 17.483186-11.04966 0-20.008706 8.958022-20.008706 20.008706 0 11.050684 8.959046 20.008706 20.008706 20.008706 33.241079 0 61.568241-9.532097 81.917708-27.54638 18.832927-16.670681 29.632901-40.191374 29.632901-64.514339 0-24.322965-10.799974-47.853891-29.632901-64.524572-20.348444-18.015306-48.675606-27.577079-81.917708-27.577079L587.78401 85.566818c-11.04966 0-20.008706 8.903787-20.008706 19.954471s8.959046 19.954471 20.008706 19.954471l35.218106 0 38.350446 263.176958c-28.312836 5.465478-123.018801 28.897144-239.179404 113.158223-20.385283 14.786775-38.965453 30.568203-55.858192 46.735417L235.758492 273.854135l63.896262 0c11.04966 0 20.008706-8.903787 20.008706-19.954471s-8.959046-19.954471-20.008706-19.954471L137.582495 233.945193c-11.050684 0-20.008706 8.903787-20.008706 19.954471s8.958022 19.954471 20.008706 19.954471l53.927213 0c0.134053 0.325411 0.251733 0.654916 0.405229 0.976234L336.576665 579.204611c-4.835122 5.364171-9.494235 10.728342-13.980409 16.074094-23.435759-11.117199-49.622164-17.350157-77.239152-17.350157-99.710956 0-180.830485 81.120552-180.830485 180.830485s81.120552 180.830485 180.830485 180.830485 180.830485-81.120552 180.830485-180.830485c0-57.568137-27.04189-108.938108-69.088518-142.077879 24.26259-28.398794 53.634548-57.135278 88.572268-82.47848 106.884332-77.532841 195.115839-100.401688 221.464951-105.854886l7.481392 51.338249C571.716057 503.848343 494.870878 596.396155 494.870878 706.562231c0 128.492466 104.534821 233.028311 233.028311 233.028311s233.028311-104.534821 233.028311-233.028311S856.391654 473.53392 727.899188 473.53392zM386.170177 758.760057c0 77.644381-63.168692 140.813073-140.813073 140.813073S104.545054 836.403414 104.545054 758.760057 167.713746 617.946984 245.357104 617.946984c18.256806 0 35.713386 3.494591 51.736315 9.846252-47.602158 65.005526-69.019956 120.128985-70.436212 123.845633-3.931542 10.327206 1.252527 21.886473 11.579733 25.820062 2.342348 0.8913 4.750187 1.314948 7.116071 1.314948 8.063653 0 15.663748-4.910846 18.703991-12.894681 0.328481-0.861624 21.327748-54.909587 68.115354-117.913527C365.027647 673.767314 386.170177 713.841008 386.170177 758.760057zM727.899188 899.572106c-106.426915 0-193.009875-86.583984-193.009875-193.009875 0-90.045829 61.984726-165.881005 145.526421-187.094142l27.684526 189.979866c1.452071 9.955746 10.000771 17.125029 19.774369 17.125029 0.959861 0 1.932002-0.068562 2.911306-0.210801 10.93505-1.594311 18.506493-11.749602 16.914228-22.685675l-27.680433-189.951213c2.615571-0.105401 5.239328-0.173962 7.880481-0.173962 106.426915 0 193.009875 86.585007 193.009875 193.010899S834.32508 899.572106 727.899188 899.572106z" fill="#272636" p-id="2891"></path></svg>
`;

// 添加热力图图标到icon.ts文件中
export const HEATMAP_ICON = `
<svg viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.14-7-7 3.14-7 7-7z" fill="currentColor" fill-opacity="0.5"/>
  <circle cx="12" cy="12" r="5" fill="currentColor" fill-opacity="0.8"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>`;

// 默认工具列表
export const DEFAULT_TOOL_ITEMS = [
  {
    id: 'measure',
    name: '测距',
    icon: MEASURE_ICON,
    tooltip: '测量距离',
    active: false,
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
    id: 'toggleLabels',
    name: '显示/隐藏标签',
    icon: SHOW_MARKERS_LABEL_ICON,
    alternateIcon: HIDE_MARKERS_LABEL_ICON,
    tooltip: '显示/隐藏标记点标签',
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
    tooltip: '切换地图图层',
    active: false
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
  },
  {
    id: 'debug',
    name: '调试',
    icon: DEBUG_ICON,
    tooltip: '打开/关闭调试面板',
    multi: true
  },
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
