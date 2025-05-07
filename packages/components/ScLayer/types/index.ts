/**
 * 地图相关配置
 */
import type { MapUrlConfig } from "./map";
export * from "./map";
// 地图类型
export enum MapType {
  GAODE = 'GAODE',
  TIANDI = 'TIANDI',
  OSM = 'OSM'
}

//图层类型
export enum MapTile {
  NORMAL = 'NORMAL',
  SATELLITE = 'SATELLITE',
  HYBRID = 'HYBRID',
}
// 地图类型配置
export interface MapConfig {
  mapType: MapType;
  mapTile: MapTile;
  map: {
    [key: string]: MapUrlConfig
  },
  mapKey: {
    [key: string]: string
  },
  height: number,
  center: [number, number],
  zoom: number,
  dragging: boolean,
  scrollWheelZoom: boolean,
  showToolbar: boolean,
}
