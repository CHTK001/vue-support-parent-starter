/**
 * 地图相关配置
 */


// 直接在此处定义MapType，避免循环依赖
export enum MapType {
  GAODE = 'GAODE',
  TIANDITU = 'TIANDITU',
  BAIDU = 'BAIDU',
  OSM = 'OSM',
  BING = 'BING'
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
  [MapType.TIANDITU]: {
    normal: {
      url: 'https://t{0-7}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '标准地图',
      projection: 'EPSG:4490'
    },
    satellite: {
      url: 'https://t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '卫星地图',
      projection: 'EPSG:4490'
    },
    hybrid: {
      url: 'https://t{0-7}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      attribution: '© 天地图',
      name: '混合地图',
      projection: 'EPSG:4490'
    }
  },
  [MapType.OSM]: {
    normal: {
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: '标准地图',
      projection: 'EPSG:3857'
    }
  },
  [MapType.BAIDU]: {
    normal: {
      url: 'https://online{0-3}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&udt=20220221',
      attribution: '© 百度地图',
      name: '标准地图',
      projection: 'BD09'
    },
    satellite: {
      url: 'https://shangetu{0-3}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46&udt=20220221',
      attribution: '© 百度地图',
      name: '卫星地图',
      projection: 'BD09'
    }
  },
  [MapType.BING]: {
    normal: {
      url: 'https://t{0-1}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{x}_{y}_{z}?mkt=zh-cn&it=G,L&og=1330&n=z',
      attribution: '© 必应地图',
      name: '街道地图',
      projection: 'EPSG:3857'
    },
    satellite: {
      url: 'https://t{0-1}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{x}_{y}_{z}?mkt=zh-cn&it=A&og=1330&n=z',
      attribution: '© 必应地图',
      name: '卫星地图',
      projection: 'EPSG:3857'
    },
    aerial: {
      url: 'https://t{0-1}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{x}_{y}_{z}?mkt=zh-cn&it=A,G,L&og=1330&n=z',
      attribution: '© 必应地图',
      name: '鸟瞰地图',
      projection: 'EPSG:3857'
    },
    road: {
      url: 'https://t{0-1}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{x}_{y}_{z}?mkt=zh-cn&it=G,L&og=1330&n=z',
      attribution: '© 必应地图',
      name: '街道地图',
      projection: 'EPSG:3857'
    }
  }
};

// 添加默认导出
export default {
  MapType,
  DEFAULT_MAP_CONFIG
};
