/**
 * ScLayer组件入口文件
 * 导出地图组件和相关类型
 */
import ScLayer from './index.vue';
import { LogLevel } from './composables/LogObject';
import { MapType, MapTile } from './types';
import { ConfigObject } from './composables/ConfigObject';
import { MapObject } from './composables/MapObject';
import { ToolbarObject } from './composables/ToolbarObject';
import { MarkerObject } from './composables/MarkerObject';
import { ShapeObject } from './composables/ShapeObject';
import type { ToolbarConfig, ToolItem } from './types/toolbar';
import type { MapConfig } from './types';
import type { MarkerOptions } from './composables/MarkerObject';
import type { ShapeType, ShapeStyle } from './composables/ShapeObject';
import { Shape, ShapeOption } from './types/shape';

// 导出组件
export default ScLayer;

// 导出相关类型和常量
export {
  LogLevel,
  MapType,
  MapTile,
  ConfigObject,
  MapObject,
  ToolbarObject,
  MarkerObject,
  ShapeObject,
  Shape
};

// 导出类型定义
export type {
  ToolbarConfig,
  ToolItem,
  MapConfig,
  MarkerOptions,
  ShapeType,
  ShapeStyle,
  ShapeOption
}; 