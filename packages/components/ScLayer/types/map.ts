/**
 * 地图相关配置
 */
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
}
// 地图key配置
export interface MapKeyConfig {
  [key: string]: string
}

// 默认瓦片服务配置，与MapType.ts保持一致
export const DEFAULT_MAP_CONFIG = {
  'GAODE': {
    normal: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '标准地图'
    },
    satellite: {
      url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      attribution: '© 高德地图',
      name: '卫星地图'
    }
  },
  'TIANDI': {
    normal: {
      url: 'https://t{0-7}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '标准地图'
    },
    satellite: {
      url: 'https://t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '卫星地图'
    }
  }
};
