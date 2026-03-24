/**
 * 配置对象
 * @description 管理地图的配置信息
 */
import { MapType, DEFAULT_MAP_CONFIG, RenderMode } from '../types/map';
import { MapTile, MapConfig } from '../types';
import { OverviewMapConfig } from '../components/OverviewMap.vue';
import logger from './LogObject';

export class ConfigObject {
  private config: MapConfig;
  private overviewMapConfig: OverviewMapConfig;

  /**
   * 构造函数
   * @param config 地图配置
   */
  constructor(config: MapConfig, overviewMapConfig: OverviewMapConfig = {}) {
    // 合并默认配置和传入配置
    this.config = {
      height: config.height || 500,
      center: config.center || [39.90923, 116.397428],
      mapType: config.mapType || MapType.GAODE,
      mapTile: config.mapTile || MapTile.NORMAL,
      map: config.map || DEFAULT_MAP_CONFIG as any,
      mapKey: config.mapKey || {},
      zoom: config.zoom !== undefined ? config.zoom : 10,
      dragging: config.dragging !== undefined ? config.dragging : true,
      scrollWheelZoom: config.scrollWheelZoom !== undefined ? config.scrollWheelZoom : true,
      renderMode: config.renderMode || RenderMode.CANVAS, // 默认使用Canvas渲染
      showToolbar: config.showToolbar !== undefined ? config.showToolbar : true,
      showScaleLine: config.showScaleLine !== undefined ? config.showScaleLine : true,
      coordinateOptions: config.coordinateOptions || {
        decimals: 8,
        position: 'bottom-right',
        showProjected: false
      }
    };

    // 鹰眼地图配置
    this.overviewMapConfig = {
      ...overviewMapConfig
    };
    
    logger.debug('ConfigObject已初始化', this.config);
  }

  /**
   * 获取完整配置
   * @returns 地图配置
   */
  public getConfig(): MapConfig {
    return { ...this.config };
  }

  /**
   * 获取地图类型
   * @returns 地图类型
   */
  public getMapType(): MapType {
    return this.config.mapType;
  }

  /**
   * 设置地图类型
   * @param mapType 地图类型
   */
  public setMapType(mapType: MapType): void {
    this.config.mapType = mapType;
  }

  /**
   * 获取地图瓦片类型
   * @returns 地图瓦片类型
   */
  public getMapTile(): MapTile {
    return this.config.mapTile;
  }

  /**
   * 设置地图瓦片类型
   * @param mapTile 地图瓦片类型
   */
  public setMapTile(mapTile: MapTile): void {
    this.config.mapTile = mapTile;
  }

  /**
   * 获取渲染模式
   * @returns 渲染模式
   */
  public getRenderMode(): RenderMode {
    return this.config.renderMode || RenderMode.CANVAS;
  }

  /**
   * 获取地图配置
   * @returns 地图详细配置
   */
  public getMapConfig(): any {
    return this.config.map;
  }

  /**
   * 获取地图API密钥
   * @returns 地图API密钥
   */
  public getMapKey(): Record<string, string> {
    return this.config.mapKey;
  }

  /**
   * 获取中心点
   * @returns 中心点坐标
   */
  public getCenter(): [number, number] {
    return this.config.center;
  }

  /**
   * 获取缩放级别
   * @returns 缩放级别
   */
  public getZoom(): number {
    return this.config.zoom;
  }

  /**
   * 获取是否允许拖拽
   * @returns 是否允许拖拽
   */
  public getDragging(): boolean {
    return this.config.dragging;
  }

  /**
   * 获取是否允许滚轮缩放
   * @returns 是否允许滚轮缩放
   */
  public getScrollWheelZoom(): boolean {
    return this.config.scrollWheelZoom;
  }

  /**
   * 获取是否显示工具栏
   * @returns 是否显示工具栏
   */
  public getShowToolbar(): boolean {
    return this.config.showToolbar;
  }

  /**
   * 获取是否显示比例尺
   * @returns 是否显示比例尺
   */
  public getShowScaleLine(): boolean {
    return !!this.config.showScaleLine;
  }

  /**
   * 获取坐标选项
   * @returns 坐标选项
   */
  public getCoordinateOptions() {
    return this.config.coordinateOptions;
  }

  /**
   * 获取鹰眼地图配置
   * @returns 鹰眼地图配置
   */
  public getOverviewMapConfig(): OverviewMapConfig {
    return { ...this.overviewMapConfig };
  }
} 