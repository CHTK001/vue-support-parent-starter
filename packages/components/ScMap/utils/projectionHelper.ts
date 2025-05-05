/**
 * projectionHelper.ts
 * 地图投影辅助函数，用于在地图组件中应用投影
 */

import { ProjectionType } from '../types';
import { createCRS, getProjectionConfig } from './projection';
import L from 'leaflet';

/**
 * 根据投影类型和地图配置获取地图CRS
 * @param projectionType 投影类型
 * @param mapConfig 地图配置
 * @returns Leaflet CRS对象
 */
export function getMapCRS(projectionType: ProjectionType | string | undefined, mapConfig: any): L.CRS {
  // 如果地图配置中有指定投影类型，优先使用
  const mapProjectionType = mapConfig?.projectionType;
  const finalProjectionType = mapProjectionType || projectionType || ProjectionType.WebMercator;
  return createCRS(finalProjectionType);
}

/**
 * 检查是否需要重新创建地图
 * 当切换到不同投影系统的图层时，需要重新创建地图
 * @param currentCRS 当前CRS
 * @param newProjectionType 新的投影类型
 * @returns 是否需要重新创建地图
 */
export function needRecreateMap(currentCRS: L.CRS, newProjectionType: ProjectionType | string): boolean {
  // CRS.Simple是特殊情况
  if (currentCRS === L.CRS.Simple) {
    return true;
  }
  
  // WebMercator和EPSG3857是同一个坐标系统
  if ((currentCRS === L.CRS.EPSG3857 || currentCRS === L.CRS.EPSG900913) &&
      newProjectionType === ProjectionType.WebMercator) {
    return false;
  }
  
  // WGS84和EPSG4326是同一个坐标系统
  if (currentCRS === L.CRS.EPSG4326 && newProjectionType === ProjectionType.WGS84) {
    return false;
  }
  
  // 对于自定义投影，基于code比较
  if (currentCRS.code && newProjectionType) {
    return currentCRS.code !== getProjectionConfig(newProjectionType).code;
  }
  
  // 默认需要重新创建地图
  return true;
}

/**
 * 使用指定投影初始化地图
 * @param mapContainerElement 地图容器DOM元素
 * @param options 地图选项
 * @param projectionType 投影类型
 * @param mapTypeConfig 地图类型配置
 * @returns 创建的地图实例
 */
export function initMapWithProjection(
  mapContainerElement: HTMLElement,
  options: L.MapOptions,
  projectionType: ProjectionType | string | undefined,
  mapTypeConfig: any
): L.Map {
  // 获取合适的CRS
  const mapCRS = getMapCRS(projectionType, mapTypeConfig);
  
  // 合并选项
  const mergedOptions: L.MapOptions = {
    ...options,
    crs: mapCRS
  };
  
  // 创建地图实例
  return L.map(mapContainerElement, mergedOptions);
}

/**
 * 处理投影变更
 * 当切换到不同的投影系统时，需要销毁并重新创建地图
 * @param mapInstance 当前地图实例
 * @param newMapTypeConfig 新的地图类型配置
 * @param projectionType 全局投影类型
 * @param options 地图选项
 * @param mapContainerElement 地图容器DOM元素
 * @param onRecreateMap 地图重新创建后的回调
 * @returns 可能重新创建的地图实例
 */
export function handleProjectionChange(
  mapInstance: L.Map, 
  newMapTypeConfig: any,
  projectionType: ProjectionType | string | undefined,
  options: L.MapOptions,
  mapContainerElement: HTMLElement,
  onRecreateMap?: (map: L.Map) => void
): L.Map {
  // 如果没有地图实例或配置，直接返回
  if (!mapInstance) {
    return initMapWithProjection(mapContainerElement, options, projectionType, newMapTypeConfig);
  }
  
  // 获取当前和新的投影类型
  const currentCRS = mapInstance.options.crs as L.CRS;
  const newProjectionType = newMapTypeConfig?.projectionType || projectionType;
  
  // 检查是否需要重新创建地图
  if (!needRecreateMap(currentCRS, newProjectionType)) {
    return mapInstance; // 不需要重新创建
  }
  
  // 需要重新创建地图，保存当前状态
  const currentCenter = mapInstance.getCenter();
  const currentZoom = mapInstance.getZoom();
  
  // 销毁当前地图实例
  mapInstance.remove();
  
  // 使用新的投影创建地图
  const newMapOptions: L.MapOptions = {
    ...options,
    center: [currentCenter.lat, currentCenter.lng],
    zoom: currentZoom
  };
  
  // 创建新的地图实例
  const newMapInstance = initMapWithProjection(
    mapContainerElement,
    newMapOptions,
    newProjectionType,
    newMapTypeConfig
  );
  
  // 调用回调函数
  if (onRecreateMap) {
    onRecreateMap(newMapInstance);
  }
  
  return newMapInstance;
}

export default {
  getMapCRS,
  needRecreateMap,
  initMapWithProjection,
  handleProjectionChange
}; 