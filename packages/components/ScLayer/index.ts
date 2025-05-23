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
import { MapTile, MapType } from './types/map';
import { Shape } from './types/shape';
import { GridManager, GridType } from './composables/GridManager';
import type { GridConfig } from './composables/GridManager';
import { GeoHashGridObject } from './composables/GeoHashGridObject';
import { HexagonGridObject } from './composables/HexagonGridObject';
import { GcoordObject } from './composables/GcoordObject';
import { GcoordUtils } from './utils/GcoordUtils';
import { CoordType, GeoPoint, CoordinateInfo } from './types/coordinate';
import { TileLayer } from './layers/TileLayer';
import { BaseLayer, LayerType } from './layers/BaseLayer';

// 导出类型
export * from './types';
export { GridType, MapTile, MapType, LogLevel, CoordType, LayerType };
export type { GridConfig, TrackPlayer, Shape, GeoPoint, CoordinateInfo };

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
  GcoordUtils,
  BaseLayer,
  TileLayer
};

export default ScLayer;

