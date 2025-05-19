/**
 * 地图类型定义
 * @description 定义地图类型和配置
 */

// 地图类型枚举
export enum MapType {
  GAODE = 'GAODE',     // 高德地图
  BAIDU = 'BAIDU',     // 百度地图
  GOOGLE = 'GOOGLE',   // 谷歌地图
  OSM = 'OSM',         // OpenStreetMap
  TENCENT = 'TENCENT', // 腾讯地图
  TIANDITU = 'TIANDITU', // 天地图
  CUSTOM = 'CUSTOM'    // 自定义地图
}

// 地图渲染模式枚举
export enum RenderMode {
  DOM = 'DOM',         // DOM渲染模式，使用HTML+CSS渲染地图元素，适合需要更多交互效果的场景
  CANVAS = 'CANVAS'    // Canvas渲染模式，使用HTML5 Canvas渲染地图，性能更好，适合海量数据场景
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

// 默认地图配置
export const DEFAULT_MAP_CONFIG: Record<string, any> = {
  // 高德地图配置
  GAODE: {
    normal: {
      url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'],
      attribution: '&copy; <a href="https://amap.com">高德地图</a>',
      minZoom: 3,
      maxZoom: 18
    },
    satellite: {
      url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'],
      attribution: '&copy; <a href="https://amap.com">高德地图</a>',
      minZoom: 3,
      maxZoom: 18
    }
  },
  // OpenStreetMap配置
  OSM: {
    normal: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 1,
      maxZoom: 19
    }
  },
  // 谷歌地图配置
  GOOGLE: {
    normal: {
      url: 'http://mt{s}.google.cn/vt/lyrs=m&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
      minZoom: 1,
      maxZoom: 19
    },
    satellite: {
      url: 'http://mt{s}.google.cn/vt/lyrs=s&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
      minZoom: 1,
      maxZoom: 19
    },
    terrain: {
      url: 'http://mt{s}.google.cn/vt/lyrs=p&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
      minZoom: 1,
      maxZoom: 19
    }
  },
  // 百度地图配置
  BAIDU: {
    normal: {
      url: 'https://maponline{s}.bdimg.com/starpic/?qt=satepc&u=x={x};y={y};z={z};v=009;type=sate&fm=46&app=webearth2&v=009',
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://map.baidu.com">百度地图</a>',
      minZoom: 1,
      maxZoom: 18
    },
    satellite: {
      url: 'https://maponline{s}.bdimg.com/starpic/?qt=satepc&u=x={x};y={y};z={z};v=009;type=sate&fm=46&app=webearth2&v=009',
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://map.baidu.com">百度地图</a>',
      minZoom: 1,
      maxZoom: 18
    }
  },
  // 天地图配置
  TIANDITU: {
    normal: {
      url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      attribution: '&copy; <a href="https://www.tianditu.gov.cn">天地图</a>',
      minZoom: 1,
      maxZoom: 18
    },
    satellite: {
      url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      attribution: '&copy; <a href="https://www.tianditu.gov.cn">天地图</a>',
      minZoom: 1,
      maxZoom: 18
    },
    terrain: {
      url: 'https://t{s}.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      attribution: '&copy; <a href="https://www.tianditu.gov.cn">天地图</a>',
      minZoom: 1,
      maxZoom: 18
    }
  }
};
