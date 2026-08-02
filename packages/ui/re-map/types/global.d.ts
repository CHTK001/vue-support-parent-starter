/* eslint-disable @typescript-eslint/no-explicit-any */

// Leaflet 插件类型扩展
import 'leaflet';

declare module 'leaflet' {
  // 使 LeafletMouseEvent 兼容 Event
  interface LeafletMouseEvent extends Event {
    [key: string]: any;
  }

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
    [key: string]: any;
  }
  interface HeatLayer extends Layer {
    setLatLngs(latlngs: Array<[number, number, number?] | LatLng>): this;
    redraw(): this;
    options: any;
    setOptions?(options: HeatLayerOptions): this;
    addLatLng?(latlng: LatLng | [number, number]): this;
    [key: string]: any;
  }
  function heatLayer(latlngs: Array<[number, number, number?] | LatLng>, options?: HeatLayerOptions): HeatLayer;

  // 扩展 Layer - 添加索引签名使所有子类型兼容
  interface Layer {
    setStyle?(style: any): this;
    getElement?(): HTMLElement;
    [key: string]: any;
  }

  // 扩展 Map
  interface Map {
    editTools?: any;
    getView?: () => any;
    un?: (event: string, handler: any) => this;
    _animatingZoom?: boolean;
    MarkerClusterGroup?: any;
    _container?: HTMLElement;
    _mapPane?: HTMLElement;
    forEachFeatureAtPixel?: (pixel: Point, callback: (feature: any, layer: any) => void, options?: any) => void;
    getCoordinateFromPixel?: (pixel: Point) => LatLng;
    [key: string]: any;
  }

  // 扩展 MarkerOptions
  interface MarkerOptions {
    [key: string]: any;
  }

  // 扩展 PolylineOptions 和 CircleMarkerOptions
  interface PolylineOptions {
    id?: string;
    [key: string]: any;
  }
  interface CircleMarkerOptions {
    id?: string;
    [key: string]: any;
  }
  interface LayerOptions {
    id?: string;
    [key: string]: any;
  }

  // 其他插件类型
  namespace control {
    function minimap(options?: any): any;
  }
  const Editable: any;
  const MarkerClusterGroup: any;
  const TrackPlayer: any;

  // Default 图标
  class Default {
    _getIconUrl?(): string;
  }
}

declare module 'leaflet-ant-path' { const _: any; export default _; }
declare module 'leaflet-editable' { const _: any; export default _; }
declare module 'leaflet-minimap' { const _: any; export default _; }
declare module 'leaflet-polylinedecorator' { const _: any; export default _; }
declare module 'leaflet-rotatedmarker' { const _: any; export default _; }
declare module 'leaflet-trackplayer' { const _: any; export default _; }
declare module 'leaflet-wind' { const _: any; export default _; }
declare module 'leaflet.heat' { const _: any; export default _; }
declare module 'leaflet.markercluster' { const _: any; export default _; }
declare module '@joakimono/echarts-extension-leaflet' { const _: any; export default _; }
declare module '@sintef/prune-cluster' { const _: any; export default _; }
declare module 'mapv' { const _: any; export default _; }
declare module 'ngeohash' { const _: any; export default _; }
declare module 'ol/proj.js' { export * from 'ol/proj'; }
declare module 'ol/style.js' { export * from 'ol/style'; }
declare module 'ol/geom.js' { export * from 'ol/geom'; }
declare module 'ol/proj/proj4.js' { const _: any; export default _; }
declare module 'ol-ext/style/FontSymbol.js' { const _: any; export default _; }
declare module 'ol-ext/style/Shadow.js' { const _: any; export default _; }
declare module 'ol-ext/style/Photo.js' { const _: any; export default _; }
declare module 'ol-echarts' { const _: any; export default _; }
declare module 'gcoord' { const _: any; export default _; }
declare module 'h3-js' { const _: any; export default _; }
declare module 'uuid' { const _: any; export default _; }
declare module 'proj4' { const _: any; export default _; }

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
