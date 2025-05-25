/**
 * ScLayer组件入口文件
 * 导出地图组件和相关类型
 */
import TrackPlayer from './components/TrackPlayer.vue';
import { ConfigObject } from './composables/ConfigObject';
import { LogLevel } from './composables/LogObject';
import { MapObject } from './composables/MapObject';
import { MarkerObject } from './composables/MarkerObject';
import { ShapeObject, ShapeType } from './composables/ShapeObject';
import { ToolbarObject } from './composables/ToolbarObject';
import { TrackObject } from './composables/TrackObject';
import ScLayer from './index.vue';
import { 
  // 所有枚举类型
  MapType, MapTile, CoordSystem, Shape, GridType, 
  // 基本类型
  type MapConfig, type GridConfig, type GeoPoint, type CoordinateInfo,
  // 工具栏相关类型
  type ToolbarConfig, type ToolItem,
  // 标记点相关类型
  type MarkerOptions, type MarkerConfig,
  // 图形相关类型
  type ShapeOption,
  // 轨迹相关类型
  type Track, type TrackPlayer, type TrackPoint,
  // 热力图相关类型
  type HeatmapConfig, type HeatmapPoint,
  // 聚合相关类型
  type AggregationOptions,
  // 边界相关类型
  type BoundaryOptions, type BoundaryData,
  // 搜索相关类型
  type SearchResult, type SearchBoxConfig
} from './types';
import { GridManager } from './composables/GridManager';
import { GeoHashGridObject } from './composables/GeoHashGridObject';
import { HexagonGridObject } from './composables/HexagonGridObject';
import { GcoordObject } from './composables/GcoordObject';
import { GcoordUtils } from './utils/GcoordUtils';
import { Map as OlMap } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// 统一导出所有类型
export { 
  // 所有枚举类型
  MapType, MapTile, CoordSystem, Shape, GridType, LogLevel,
};

// 导出类型
export type { 
  // 基本类型
  MapConfig, GridConfig, GeoPoint, CoordinateInfo,
  // 工具栏相关类型
  ToolbarConfig, ToolItem,
  // 标记点相关类型
  MarkerOptions, MarkerConfig,
  // 图形相关类型
  ShapeOption,
  // 轨迹相关类型
  Track, TrackPlayer, TrackPoint,
  // 热力图相关类型
  HeatmapConfig, HeatmapPoint,
  // 聚合相关类型
  AggregationOptions,
  // 边界相关类型
  BoundaryOptions, BoundaryData,
  // 搜索相关类型
  SearchResult, SearchBoxConfig
};

// 导出类
export { 
  MapObject, 
  ConfigObject, 
  ToolbarObject, 
  GridManager,
  GeoHashGridObject,
  HexagonGridObject,
  MarkerObject, 
  ShapeObject, 
  TrackObject,
  GcoordObject,
  GcoordUtils
};

export default ScLayer;

