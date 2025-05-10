/**
 * 地图相关配置
 */
import type { MapUrlConfig } from "./map";
import { MapType } from "./map";
import type { ToolbarConfig, ToolItem } from "./toolbar";
import type { CoordinateOptions } from "../composables/CoordinateObject";
import { OverviewMapConfig } from "../components/OverviewMap.vue";
export * from "./map";
export * from "./toolbar";
export * from "./marker";
export * from "./cluster";
export * from "./shape";
export * from "./track";
//图层类型
export enum MapTile {
  NORMAL = 'normal',
  SATELLITE = 'satellite',
  HYBRID = 'hybrid',
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
// 地图类型配置
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
  coordinateOptions?: CoordinateOptions;
  // 鹰眼地图配置
  overviewMapConfig?: OverviewMapConfig;
  // 是否显示比例尺
  showScaleLine?: boolean;
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
