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
  MARKER_HIDDEN_ICON,
  EDIT_ICON,
  DELETE_ICON
} from "./icon";
import { DEFAULT_NORMAL_MAP_IMAGE, DEFAULT_ROAD_MAP_IMAGE, DEFAULT_SATELLITE_MAP_IMAGE, DEFAULT_TRAFFIC_MAP_IMAGE } from "./base64";

// 默认轨迹标记图标
export const DEFAULT_TRACK_MARKER_SVG = `
<svg t="1746164583207" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9328" width="48" height="48"><path d="M496 0H522.666667c113.066667 0 204.8 91.733333 204.8 204.8v665.6c0 85.333333-68.266667 153.6-153.6 153.6H444.8c-85.333333 0-153.6-68.266667-153.6-153.6V204.8C291.2 91.733333 382.933333 0 496 0z" fill="#4699F1" p-id="9329"></path><path d="M414.933333 992h181.333334l-17.066667 32H432z" fill="#2E4270" p-id="9330"></path><path d="M299.733333 827.733333c0 85.333333 68.266667 153.6 153.6 153.6h110.933334c85.333333 0 153.6-68.266667 153.6-153.6v17.066667c0 85.333333-68.266667 153.6-153.6 153.6H453.333333c-85.333333 0-153.6-68.266667-153.6-153.6v-17.066667z" fill="#FFFFFF" p-id="9331"></path><path d="M684.8 352h41.6v501.333333l-25.6-2.133333-28.8 29.866667c-21.333333-41.6-32-105.6-33.066667-192s14.933333-199.466667 45.866667-337.066667z" fill="#1880EE" p-id="9332"></path><path d="M684.8 352h41.6v501.333333l-25.6-2.133333-28.8 29.866667c-21.333333-41.6-32-105.6-33.066667-192s14.933333-199.466667 45.866667-337.066667z" fill-opacity=".2" p-id="9333"></path><path d="M684.8 352h41.6v501.333333l-25.6-2.133333-28.8 29.866667c-21.333333-41.6-32-105.6-33.066667-192s14.933333-199.466667 45.866667-337.066667z" fill="#4699F1" p-id="9334"></path><path d="M332.053333 352h-41.6v501.333333l25.6-2.133333 28.8 29.866667c21.333333-41.6 32-105.6 33.066667-192s-14.933333-199.466667-45.866667-337.066667z" fill="#1880EE" p-id="9335"></path><path d="M332.053333 352h-41.6v501.333333l25.6-2.133333 28.8 29.866667c21.333333-41.6 32-105.6 33.066667-192s-14.933333-199.466667-45.866667-337.066667z" fill-opacity=".2" p-id="9336"></path><path d="M332.053333 352h-41.6v501.333333l25.6-2.133333 28.8 29.866667c21.333333-41.6 32-105.6 33.066667-192s-14.933333-199.466667-45.866667-337.066667z" fill="#4699F1" p-id="9337"></path><path d="M709.333333 352c-1.066667 305.066667-4.266667 471.466667-9.6 499.2-16-48-26.666667-80-34.133333-93.866667 1.066667-151.466667 3.2-243.2 8.533333-275.2 4.266667-32 11.733333-74.666667 21.333334-130.133333h13.866666zM308.266667 352c1.066667 305.066667 4.266667 471.466667 9.6 499.2C333.866667 803.2 344.533333 771.2 352 757.333333c-1.066667-151.466667-4.266667-243.2-8.533333-275.2s-11.733333-74.666667-21.333334-130.133333H308.266667zM334.933333 885.333333c53.333333 24.533333 112 36.266667 173.866667 36.266667S629.333333 909.866667 682.666667 885.333333l-28.8-100.266666H362.666667L334.933333 885.333333z" fill="#2E4270" opacity=".9" p-id="9338"></path><path d="M325.333333 320l66.133334-242.133333L456.533333 8.533333h104.533334l65.066666 69.333334L692.266667 320z" fill="#74B2F4" p-id="9339"></path><path d="M325.312 320C365.845333 265.6 426.645333 238.933333 508.778667 238.933333s142.933333 26.666667 183.466666 81.066667l-28.8 140.8c-43.733333-26.666667-96-40.533333-154.666666-40.533333S397.845333 434.133333 354.112 460.8L325.312 320z" fill="#2E4270" p-id="9340"></path><path d="M505.578667 238.933333c84.266667 0 147.2 26.666667 187.733333 78.933334l-28.8 142.933333h-5.333333c-33.066667-18.133333-69.333333-29.866667-109.866667-34.133333L501.312 238.933333h4.266667z" fill="#3C5484" opacity=".9" p-id="9341"></path><path d="M314.666667 326.4l4.266666-224-29.866666 42.666667-13.866667 125.866666L291.2 341.333333zM702.933333 326.4l-4.266666-224 29.866666 42.666667 12.8 125.866666-14.933333 70.4z" fill="#1880EE" p-id="9342"></path><path d="M331.733333 352l-6.4-32c-81.066667 42.666667-90.666667 60.8-28.8 54.4 18.133333-3.2 29.866667-10.666667 35.2-22.4zM684.8 352l6.4-32c81.066667 42.666667 90.666667 60.8 28.8 54.4-17.066667-3.2-28.8-10.666667-35.2-22.4z" fill="#74B2F4" p-id="9343"></path></svg>
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
    toggleState: true
  },
  {
    id: 'toggleLabels',
    name: '显示/隐藏标签',
    icon: SHOW_MARKERS_LABEL_ICON,
    alternateIcon: HIDE_MARKERS_LABEL_ICON,
    tooltip: '显示/隐藏标记点标签',
    multi: true,
    toggleState: true
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
    id: 'edit',
    name: '编辑',
    icon: EDIT_ICON,
    tooltip: '点击图形进行编辑',
    multi: true
  },
  {
    id: 'delete',
    name: '删除',
    icon: DELETE_ICON,
    tooltip: '点击图形或标记点进行删除',
    multi: true,
    className: 'delete-btn'
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
