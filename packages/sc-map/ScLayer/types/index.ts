/**
 * 类型定义索引文件
 * 集中导出所有类型，组件只需从此文件导入
 */

// 从 map.ts 导入地图相关类型
import { MapType, DEFAULT_MAP_CONFIG } from './map';
import type { MapTypeConfig, MapUrlConfig, MapKeyConfig } from './map';

// 从 coordinate.ts 导入坐标相关类型
import type { GeoPoint } from './coordinate';
import { CoordSystem } from './coordinate';
import type { CoordinateInfo, CoordinatePosition } from '../composables/CoordinateObject';

// 从 marker.ts 导入标记点相关类型
import { MarkerClusterMode as MarkerClusterModeFromMarker } from './marker';
import type {
  MarkerConfig,
  MarkerStyleOptions,
  MarkerButton,
  MarkerOptions,
  MarkerAnimation,
  MarkerEventHandler,
  NavigationOptions
} from './marker';

// 从 shape.ts 导入图形相关类型
import { Shape, DEFAULT_SHAPE_STYLE } from './shape';
import type { ShapeStyle, ShapePoint, ShapeOption } from './shape';

// 从 toolbar.ts 导入工具栏相关类型
import { ToolbarPosition, ToolbarDirection, DEFAULT_TOOLBAR_CONFIG } from './toolbar';
import type { 
  ToolType, 
  ToolItem, 
  CoordinateToolConfig, 
  MeasureToolConfig, 
  ToolbarConfig, 
  AddToolOptions as ToolbarAddToolOptions 
} from './toolbar';

// 从 track.ts 导入轨迹相关类型
import type { 
  TrackPoint, 
  IconSpeedGroup, 
  TrackPlayer, 
  TrackPlayerConfigOptions, 
  Track, 
  TrackConfig 
} from './track';
import { DEFAULT_TRACK_CONFIG } from './track';

// 从 boundary.ts 导入区域边界相关类型
import type {
  BoundaryLevel,
  BoundaryItem,
  BoundaryCoordinate,
  BoundaryData,
  BoundaryOptions
} from './boundary';

// 从 search.ts 导入搜索相关类型
import type {
  SearchResult,
  SearchOptions,
  SearchApiResponse,
  PlaceDetailApiResponse,
  SearchBoxConfig,
  NavigationApiResponse
} from './search';

// 从 heatmap.ts 导入热力图相关类型
import type { HeatmapPoint, HeatmapConfig } from './heatmap';
import { DEFAULT_HEATMAP_CONFIG } from './heatmap';

// 从 flightline.ts 导入飞线图相关类型
import type { 
  FlightLinePoint, 
  FlightLineStyle, 
  FlightCoord, 
  FlightLineData, 
  FlightLineConfig 
} from './flightline';
import { DEFAULT_FLIGHTLINE_CONFIG } from './flightline';

// 从 wind.ts 导入风场相关类型
import type { WindData, WindConfig } from './wind';
import { DEFAULT_WIND_CONFIG } from './wind';

// 从 cluster.ts 导入聚合相关类型
import type { AggregationOptions } from './cluster';

// 从 default.ts 导入默认配置
import {
  DEFAULT_TRACK_PLAYER_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  DEFAULT_BOUNDARY_OPTIONS,
  DEFAULT_CESIUM_BASE_URL,
  DEFAULT_TRACK_SPEED_GROUPS,
  DEFAULT_ICON,
  DEFAULT_MARKER_ICON
} from './default';

// 导入 API URL 接口
import { DEFAULT_API_URLS, mergeApiUrls } from './api';
import type { ApiUrls } from './api';

// 图层类型枚举
export enum MapTile {
  NORMAL = 'normal',
  SATELLITE = 'satellite',
  HYBRID = 'hybrid',
  AERIAL = 'aerial',
  ROAD = 'road',
}

/**
 * 数据类型枚举
 */
export enum DataType {
  /** 标记点 */
  MARKER = 'marker',
  /** 图形 */
  SHAPE = 'shape',
  /** 轨迹 */
  TRACK = 'track',
  /** 轨迹点 */
  TRACK_POINT = 'track_point',
  /** 弹窗 */
  POPOVER = 'popover',
  /** 网格 */
  GRID = 'grid'
}

// 解决命名冲突
export const MarkerClusterMode = MarkerClusterModeFromMarker;

// 统一添加工具选项接口 (与 toolbar.ts 中的 AddToolOptions 相同)
export interface AddToolOptions extends ToolbarAddToolOptions { }

// 地图配置接口
export interface MapConfig {
  mapType: MapType;
  mapTile: MapTile;
  map: {
    [key in MapType]: {
      [key: string]: MapUrlConfig
    }
  };
  mapKey: {
    [key in MapType]?: string
  };
  height: number;
  center: [number, number];
  zoom: number;
  dragging: boolean;
  scrollWheelZoom: boolean;
  // 是否显示工具栏
  showToolbar?: boolean;
  // 工具栏配置
  toolbarConfig?: ToolbarConfig;
  // 向下兼容 - 自定义工具列表
  toolbar?: ToolItem[];
  // 坐标面板配置
  coordinateOptions?: {
    decimals: number;
    position: string;
    showProjected: boolean;
  };
  // 鹰眼地图配置
  overviewMapConfig?: any;
  // 是否显示比例尺
  showScaleLine?: boolean;
  // 区划配置
  boundaryConfig?: BoundaryOptions;
  // 是否显示搜索框
  showSearchBox?: boolean;
  // 搜索框配置
  searchBoxConfig?: SearchBoxConfig;
  // 初始工具状态
  initialToolState?: {
    measure?: boolean;
    coordinate?: boolean;
    overview?: boolean;
    'layer-switch'?: boolean;
    'marker-toggle'?: boolean;
    'label-toggle'?: boolean;
    cluster?: boolean;
    'draw-rectangle'?: boolean;
    'draw-circle'?: boolean;
    'draw-polygon'?: boolean;
    'draw-line'?: boolean;
    'draw-square'?: boolean;
    'clear-shapes'?: boolean;
    'edit-shape'?: boolean;
    'flightLine'?: boolean;
    'heatmap'?: boolean;
    'track-player'?: boolean;
    'boundary'?: boolean;
  };
  markerIcon?: string;
}

// 事件类型
export type MapEventType =
  | 'init'
  | 'click'
  | 'dblclick'
  | 'rightclick'
  | 'mousemove'
  | 'mouseover'
  | 'mouseout'
  | 'mousedown'
  | 'mouseup'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'zoomstart'
  | 'zoomend'
  | 'movestart'
  | 'moveend'
  | 'load'
  | 'unload'
  | 'viewreset'
  | 'resize'
  | 'autopanstart'
  | 'layeradd'
  | 'layerremove'
  | 'baselayerchange'
  | 'overlayadd'
  | 'overlayremove'
  | 'locationfound'
  | 'locationerror'
  | 'popupopen'
  | 'popupclose'
  | 'toolbar-tool-click'
  | 'toolbar-tool-activated'
  | 'toolbar-tool-deactivated'
  | 'toolbar-submenu-item-click'
  | 'map-initialized'
  | 'marker-click'
  | 'marker-create'
  | 'marker-update'
  | 'marker-delete'
  | 'shape-create'
  | 'shape-update'
  | 'shape-delete'
  | 'update:center'
  | 'update:zoom';

// 重新导出所有类型
export {
  MapType,
  DEFAULT_MAP_CONFIG,
  CoordSystem,
  Shape,
  DEFAULT_SHAPE_STYLE,
  ToolbarPosition,
  ToolbarDirection,
  DEFAULT_TOOLBAR_CONFIG,
  DEFAULT_TRACK_CONFIG,
  DEFAULT_HEATMAP_CONFIG,
  DEFAULT_FLIGHTLINE_CONFIG,
  DEFAULT_WIND_CONFIG,
  DEFAULT_TRACK_PLAYER_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  DEFAULT_BOUNDARY_OPTIONS,
  DEFAULT_CESIUM_BASE_URL,
  DEFAULT_TRACK_SPEED_GROUPS,
  DEFAULT_ICON,
  DEFAULT_MARKER_ICON,
  // 添加 API URL 相关导出
  ApiUrls,
  DEFAULT_API_URLS,
  mergeApiUrls
};

export type {
  MapTypeConfig,
  MapUrlConfig,
  MapKeyConfig,
  GeoPoint,
  CoordinateInfo,
  CoordinatePosition,
  MarkerConfig,
  MarkerStyleOptions,
  MarkerButton,
  MarkerOptions,
  MarkerAnimation,
  MarkerEventHandler,
  NavigationOptions,
  ShapeStyle,
  ShapePoint,
  ShapeOption,
  ToolType,
  ToolItem,
  CoordinateToolConfig,
  MeasureToolConfig,
  ToolbarConfig,
  TrackPoint,
  IconSpeedGroup,
  TrackPlayer,
  TrackPlayerConfigOptions,
  Track,
  TrackConfig,
  BoundaryLevel,
  BoundaryItem,
  BoundaryCoordinate,
  BoundaryData,
  BoundaryOptions,
  SearchResult,
  SearchOptions,
  SearchApiResponse,
  PlaceDetailApiResponse,
  SearchBoxConfig,
  NavigationApiResponse,
  HeatmapPoint,
  HeatmapConfig,
  FlightLinePoint,
  FlightLineStyle,
  FlightCoord,
  FlightLineData,
  FlightLineConfig,
  WindData,
  WindConfig,
  AggregationOptions
};

