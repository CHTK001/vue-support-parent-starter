/**
 * projection.ts
 * 地图投影工具类，用于定义和管理不同地图供应商的投影配置
 */

import { ProjectionType, ProjectionConfig } from '../types';
import L from 'leaflet';
// 尝试导入proj4leaflet
try {
  require('proj4leaflet');
} catch (e) {
  console.warn('导入proj4leaflet失败，将使用简化投影');
}

import proj4Support from './proj4-support';

// 检查Proj4Leaflet是否正确加载
const hasProjSupport = typeof L.Proj !== 'undefined' && proj4Support.hasProj4Support;
if (!hasProjSupport) {
  console.warn('警告: Proj4Leaflet未正确加载或proj4未找到，自定义投影将不可用');
  console.warn('将使用标准Web墨卡托投影(EPSG:3857)作为替代，这可能会导致坐标偏移');
}

// 默认的EPSG:3857 Web墨卡托投影（大多数在线地图使用）
const WEB_MERCATOR: ProjectionConfig = {
  type: ProjectionType.WebMercator,
  code: 'EPSG:3857',
  proj4def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  bounds: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  origin: [-20037508.34, 20037508.34],
  tileSize: 256,
  zoomLevels: [0, 22]
};

// WGS84投影(GPS标准)
const WGS84: ProjectionConfig = {
  type: ProjectionType.WGS84,
  code: 'EPSG:4326',
  proj4def: '+proj=longlat +datum=WGS84 +no_defs',
  bounds: [-180, -90, 180, 90],
  origin: [-180, 90],
  tileSize: 256,
  zoomLevels: [0, 22]
};

// 天地图投影 (CGCS2000)
const TIAN_DI_TU: ProjectionConfig = {
  type: ProjectionType.TianDiTu,
  code: 'EPSG:4490',
  proj4def: '+proj=longlat +ellps=GRS80 +no_defs',
  bounds: [-180, -90, 180, 90],
  origin: [-180, 90],
  tileSize: 256,
  zoomLevels: [0, 18]
};

// 高德地图(GCJ-02)投影 - 简化版本
const GCJ02: ProjectionConfig = {
  type: ProjectionType.GCJ02,
  code: 'EPSG:3857', // 使用标准Web墨卡托投影
  proj4def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  bounds: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  origin: [-20037508.34, 20037508.34],
  tileSize: 256,
  zoomLevels: [0, 18]
};

// 百度地图(BD-09)投影 - 简化版本
const BD09: ProjectionConfig = {
  type: ProjectionType.BD09,
  code: 'EPSG:3857', // 使用标准Web墨卡托投影
  proj4def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  bounds: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  origin: [-20037508.34, 20037508.34],
  tileSize: 256,
  zoomLevels: [0, 18]
};

// 投影配置集合
const PROJECTIONS: Record<ProjectionType, ProjectionConfig> = {
  [ProjectionType.WebMercator]: WEB_MERCATOR,
  [ProjectionType.WGS84]: WGS84,
  [ProjectionType.TianDiTu]: TIAN_DI_TU,
  [ProjectionType.GCJ02]: GCJ02,
  [ProjectionType.BD09]: BD09
};

/**
 * 创建投影的CRS对象
 * @param projectionType 投影类型
 * @returns Leaflet CRS对象
 */
export function createCRS(projectionType: ProjectionType | string): L.CRS {
  // 默认使用Web墨卡托投影
  if (!projectionType || !(projectionType in PROJECTIONS)) {
    return L.CRS.EPSG3857;
  }
  
  // 对于标准Web墨卡托投影，直接使用Leaflet内置CRS
  if (projectionType === ProjectionType.WebMercator) {
    return L.CRS.EPSG3857;
  }
  
  // 对于WGS84投影，直接使用Leaflet内置CRS
  if (projectionType === ProjectionType.WGS84) {
    return L.CRS.EPSG4326;
  }
  
  // 对于高德地图(GCJ02)，简化处理使用Web墨卡托投影
  if (projectionType === ProjectionType.GCJ02) {
    console.info('使用Web墨卡托投影(EPSG:3857)加载高德地图，地图显示正常但可能有约300-500米的坐标偏差');
    return L.CRS.EPSG3857;
  }
  
  // 百度地图使用Web墨卡托投影
  if (projectionType === ProjectionType.BD09) {
    console.info('使用Web墨卡托投影(EPSG:3857)加载百度地图，地图显示正常但可能有约500-1000米的坐标偏差');
    return L.CRS.EPSG3857;
  }
  
  // 天地图使用WGS84投影
  if (projectionType === ProjectionType.TianDiTu) {
    console.info('使用WGS84投影(EPSG:4326)加载天地图');
    return L.CRS.EPSG4326;
  }
  
  // 对于其他投影类型，使用Web墨卡托投影
  console.warn(`未知的投影类型: ${projectionType}，使用Web墨卡托投影(EPSG:3857)替代`);
  return L.CRS.EPSG3857;
}

/**
 * 创建基于proj4的CRS对象
 * @param config 投影配置
 * @returns Proj4Leaflet CRS对象
 */
function createProj4CRS(config: ProjectionConfig): L.CRS {
  const bounds = config.bounds ? 
    L.bounds([config.bounds[0], config.bounds[1]], [config.bounds[2], config.bounds[3]]) : 
    undefined;
  
  const origin = config.origin || [0, 0];
  
  try {
    // 创建基于proj4的坐标参考系统
    // @ts-ignore - 由于使用外部扩展库
    return new L.Proj.CRS(
      config.code || 'EPSG:3857',
      config.proj4def || '',
      {
        resolutions: config.resolutions,
        bounds: bounds,
        origin: origin,
        transformation: config.transformation ? 
          new L.Transformation(
            config.transformation.a,
            config.transformation.b,
            config.transformation.c,
            config.transformation.d
          ) : 
          new L.Transformation(1, 0, -1, 0)
      }
    );
  } catch (e) {
    console.error('创建Proj4 CRS失败:', e);
    // 如果创建失败，回退到标准Web Mercator投影
    return L.CRS.EPSG3857;
  }
}

/**
 * 创建百度地图专用CRS对象
 * @param config 百度地图投影配置
 * @returns 百度地图CRS对象
 */
function createBaiduCRS(config: ProjectionConfig): L.CRS {
  // @ts-ignore - 由于使用外部扩展库
  const BaiduCRS = new L.Proj.CRS(
    'EPSG:BD09',
    '+proj=merc +a=6378206 +b=6356584.314245179 +lat_ts=0.0 +lon_0=0.0 +x_0=0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
    {
      resolutions: config.resolutions,
      origin: [0, 0],
      bounds: L.bounds([0, 0], [0, 0])
    }
  );
  
  // 重写百度地图的坐标转换方法
  BaiduCRS.project = function(latlng: L.LatLng) {
    const projectedPoint = this.projection.project(latlng);
    const earthRad = 6370996.81;
    const scale = Math.pow(2, 18 - 10) / earthRad;
    return new L.Point(projectedPoint.x * scale, projectedPoint.y * scale);
  };
  
  BaiduCRS.unproject = function(point: L.Point) {
    const earthRad = 6370996.81;
    const scale = Math.pow(2, 18 - 10) / earthRad;
    const unprojectedPoint = new L.Point(point.x / scale, point.y / scale);
    return this.projection.unproject(unprojectedPoint);
  };
  
  return BaiduCRS;
}

/**
 * 根据投影类型获取投影配置
 * @param projectionType 投影类型
 * @returns 投影配置对象
 */
export function getProjectionConfig(projectionType: ProjectionType | string): ProjectionConfig {
  if (projectionType in PROJECTIONS) {
    return PROJECTIONS[projectionType as ProjectionType];
  }
  return WEB_MERCATOR; // 默认返回Web墨卡托投影
}

/**
 * 注册自定义投影
 * @param type 投影类型
 * @param config 投影配置
 */
export function registerProjection(type: string, config: ProjectionConfig): void {
  // @ts-ignore - 动态添加属性
  PROJECTIONS[type] = config;
}

export default PROJECTIONS; 