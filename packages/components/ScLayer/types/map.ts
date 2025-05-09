/**
 * 地图相关配置
 */
// 直接在此处定义MapType，避免循环依赖
export enum MapType {
  GAODE = 'GAODE',
  TIANDI = 'TIANDI',
  OSM = 'OSM'
}

// 地图配置
export interface MapTypeConfig {
  name: string;
  type: string;
  map: {
    [key: string]: MapUrlConfig
  }
}
// 地图配置
export interface MapUrlConfig {
  url: string;
  attribution: string;
  name: string;
  projection?: string; // 可选的投影参数，默认使用"EPSG:3857"
}
// 地图key配置
export interface MapKeyConfig {
  [key: string]: string
}

// 默认瓦片服务配置，与MapType.ts保持一致
export const DEFAULT_MAP_CONFIG: { [key in MapType]: { [key: string]: MapUrlConfig } } = {
  [MapType.GAODE]: {
    normal: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '标准地图',
      projection: 'EPSG:3857'
    },
    satellite: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '卫星地图',
      projection: 'EPSG:3857'
    },
    hybrid: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '混合地图',
      projection: 'EPSG:3857'
    },
    dark: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=3&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '深色地图',
      projection: 'EPSG:3857'
    },
    light: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=4&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '浅色地图',
      projection: 'EPSG:3857'
    }
  },
  [MapType.TIANDI]: {
    normal: {
      url: 'https://t{0-7}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '标准地图',
      projection: 'EPSG:4326'
    },
    satellite: {
      url: 'https://t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '卫星地图',
      projection: 'EPSG:4326'
    },
    hybrid: {
      url: 'https://t{0-7}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '混合地图',
      projection: 'EPSG:4326'
    }
  },
  [MapType.OSM]: {
    normal: {
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: '标准地图',
      projection: 'EPSG:3857'
    }
  }
};
