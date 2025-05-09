/**
 * ScLayer组件入口文件
 * 导出地图组件和相关类型
 */
import { ConfigObject } from './composables/ConfigObject';
import { LogLevel } from './composables/LogObject';
import { MapObject } from './composables/MapObject';
import { MarkerObject } from './composables/MarkerObject';
import { ShapeObject } from './composables/ShapeObject';
import { ToolbarObject } from './composables/ToolbarObject';
import { TrackObject } from './composables/TrackObject';
import TrackPlayer from './components/TrackPlayer.vue';
import ScLayer from './index.vue';
import { MapTile, MapType } from './types';
import { Shape } from './types/shape';
import { Track, TrackPoint, TrackPlayer as TrackPlayerConfig } from './types/track';

// 导出组件
export default ScLayer;

// 导出相关类型和常量
export {
  ConfigObject, LogLevel, MapObject, MapTile, MapType, MarkerObject, Shape, ShapeObject, ToolbarObject,
  TrackObject, TrackPlayer, Track, TrackPoint, TrackPlayerConfig
};
