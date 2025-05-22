import { MapType } from '.';
import { CoordSystem } from '../utils/coordUtils';
import type { BoundaryOptions } from './boundary';
import type { SearchBoxConfig } from './search';
import type { IconSpeedGroup, TrackPlayerConfigOptions } from './track';
//@ts-ignore
import marker from '@repo/assets/images/marker.png';

// 默认轨迹播放器配置
export const DEFAULT_TRACK_PLAYER_CONFIG: TrackPlayerConfigOptions = {
  loop: false,          // 是否循环播放
  speed: 50,            // 默认播放速度(km/h)
  withCamera: false,     // 是否跟随相机
  speedFactor: 1.0,     // 速度因子
  showNodes: true,     // 是否显示节点（静态点位）
  showNodeAnchors: false,// 是否显示节点锚点（当showNodes设置为true时有效）
  showNodeNames: false, // 是否显示节点名称（静态点位名称）
  showPointNames: true, // 是否显示点位名称（移动点位名称）
  showSpeed: true,      // 是否显示移动速度
  showNodeSpeed: true,   // 是否显示节点速度
  updateFrequency: 100,   // 更新频率(毫秒)，默认100毫秒，高频更新
  stabilizeViewport: false // 是否稳定视口，防止播放过程中缩放抖动
};

// 默认搜索框配置
export const DEFAULT_SEARCH_BOX_CONFIG: SearchBoxConfig = {
  type: 'input',
  placeholder: '请输入搜索关键词',
  debounceTime: 300,
  position: 'top-right',
  projection: CoordSystem.EPSG3857,
  mapType: MapType.GAODE,
  searchUrl: 'https://restapi.amap.com/v3/place/text'
};
// 默认配置
export const DEFAULT_BOUNDARY_OPTIONS: BoundaryOptions = {
  position: 'top-right',
  fillBoundary: true,
  strokeColor: '#1677ff',
  strokeWidth: 2,
  fillColor: '#1677ff',
  fillOpacity: 0.2,
  zIndex: 10,
  showLabel: false,
  labelOptions: {
    fontSize: 12,
    fontColor: '#333',
    offset: [0, 0]
  }
}; 
export const DEFAULT_CESIUM_BASE_URL = 'https://unpkg.com/cesium@1.109.0/Build/Cesium/';
//@ts-ignore
window.CESIUM_BASE_URL = DEFAULT_CESIUM_BASE_URL;

// 默认的交通工具基于速度的图标分组配置
export const DEFAULT_TRACK_SPEED_GROUPS = [
  // 行人图标 (0-6 km/h)
  {
    speed: 0,
    icon: 'https://img.icons8.com/?size=100&id=sYaA2JXjiIXq&format=png&color=000000',
    iconType: 'photo'
  },
  // 自行车图标 (6-20 km/h)
  {
    speed: 6,
    icon: 'https://img.icons8.com/?size=100&id=c5rlo5IAWvhQ&format=png&color=000000',
    iconType: 'photo'
  },
  // 摩托车图标 (20-30 km/h)
  {
    speed: 20,
    icon: 'https://img.icons8.com/?size=100&id=R6Cd7o14KhEg&format=png&color=000000', // 替换为合适的摩托车图标URL
    iconType: 'photo'
  },
  // 汽车图标 (30-100 km/h)
  {
    speed: 30,
    icon: 'https://banner2.cleanpng.com/20240115/ytk/transparent-cartoon-car-red-compact-car-with-white-tires-and-streamlined-1710921959100.webp',
    iconType: 'photo'
  },
  // 动车/高铁图标 (100-300 km/h)
  {
    speed: 100,
    icon: 'https://img.icons8.com/color/48/000000/high-speed-train.png',
    iconType: 'photo'
  },
  // 飞机图标 (>300 km/h)
  {
    speed: 300,
    icon: 'https://img.icons8.com/color/48/000000/airplane-mode-on.png',
    iconType: 'photo'
  }
] as IconSpeedGroup[];

export const DEFAULT_ICON = marker;
/**
 * 默认标记点图标配置
 */
export const DEFAULT_MARKER_ICON = {
  // 默认图标
  default: {
    url: marker,
    size: [24, 24],
    anchor: [16, 32],
    offset: [0, 0]
  },
  // 选中状态图标
  selected: {
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y1MjUyNSIgZD0iTTE2IDJDNi40NzcgMiAwIDguNDc3IDAgMTZjMCA5LjM5MyA4LjIxNyAxNi4xMTYgMTUuOTk5IDI5Ljk5NkMyMy43ODMgMzIuMTE2IDMyIDI1LjM5MyAzMiAxNmMwLTcuNTIzLTYuNDc3LTE0LTE2LTE0em0wIDRjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6Ii8+PC9zdmc+',
    size: [32, 32],
    anchor: [16, 32],
    offset: [0, 0]
  }
};