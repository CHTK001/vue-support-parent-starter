/**
 * 配置对象
 * @description 主要用于处理参数的默认值问题
 */
import { MapTile, type MapConfig } from "../types";
import { MapType, DEFAULT_MAP_CONFIG } from "../types/map";
import type { OverviewMapConfig } from "../components/OverviewMap.vue";

// 默认鹰眼地图配置
const DEFAULT_OVERVIEW_CONFIG: OverviewMapConfig = {
  width: 200,
  height: 150,
  opacity: 1,
  borderColor: "rgba(24, 144, 255, 0.8)",
  borderWidth: 2,
  backgroundColor: "#f5f5f5",
  boxColor: "rgba(24, 144, 255, 0.15)",
  boxOpacity: 0.15,
  boxBorderColor: "rgba(24, 144, 255, 1)",
  boxBorderWidth: 3,
  zoomOffset: 4,
  collapsedSize: 30,
  buttonSize: 30,
  buttonColor: "#fff",
  buttonBgColor: "rgba(24, 144, 255, 0.9)"
};

export class ConfigObject {
  public config: MapConfig;

  /**
   * 构造函数
   * @param options 用户传入的配置选项
   */
  constructor(options: Partial<MapConfig>) {
    // 创建默认配置
    const defaultConfig: MapConfig = {
      mapType: MapType.GAODE,
      mapTile: MapTile.NORMAL,
      map: DEFAULT_MAP_CONFIG,
      mapKey: {},
      height: 500,
      center: [39.92, 116.4],
      zoom: 12,
      dragging: true,
      scrollWheelZoom: true,
      showToolbar: true,
      overviewMapConfig: DEFAULT_OVERVIEW_CONFIG,
      showScaleLine: true // 默认显示比例尺
    };

    // 合并用户配置与默认配置
    this.config = {
      ...defaultConfig,
      ...options
    };
    if (Object.keys(this.config.map).length === 0) {
      this.config.map = DEFAULT_MAP_CONFIG;
    }

    // 合并鹰眼地图配置
    if (options.overviewMapConfig) {
      this.config.overviewMapConfig = {
        ...DEFAULT_OVERVIEW_CONFIG,
        ...options.overviewMapConfig
      };
    }
  }

  /**
   * 获取完整配置
   * @returns 完整配置对象
   */
  public getConfig(): MapConfig {
    return this.config;
  }

  /**
   * 更新配置
   * @param options 要更新的配置选项
   */
  public updateConfig(options: Partial<MapConfig>): void {
    this.config = {
      ...this.config,
      ...options
    };
    if (Object.keys(this.config.map).length === 0) {
      this.config.map = DEFAULT_MAP_CONFIG;
    }
  }

  /**
   * 获取地图类型
   * @returns 地图类型
   */
  public getMapType(): MapType {
    return this.config.mapType;
  }

  /**
   * 获取图层类型
   * @returns 图层类型
   */
  public getMapTile(): MapTile {
    return this.config.mapTile || MapTile.NORMAL;
  }

  /**
   * 获取地图API密钥
   * @returns 地图API密钥
   */
  public getMapKey(mapType: MapType): string {
    return this.config.mapKey[mapType] || "";
  }

  /**
   * 获取地图中心点
   * @returns 地图中心点 [纬度, 经度]
   */
  public getCenter(): [number, number] {
    return this.config.center;
  }

  /**
   * 获取地图缩放级别
   * @returns 地图缩放级别
   */
  public getZoom(): number {
    return this.config.zoom;
  }

  /**
   * 获取地图容器高度
   * @returns 地图容器高度
   */
  public getHeight(): number {
    return this.config.height;
  }

  /**
   * 检查是否允许拖动
   * @returns 是否允许拖动
   */
  public isDraggingEnabled(): boolean {
    return this.config.dragging;
  }

  /**
   * 检查是否允许滚轮缩放
   * @returns 是否允许滚轮缩放
   */
  public isScrollWheelZoomEnabled(): boolean {
    return this.config.scrollWheelZoom;
  }

  /**
   * 检查是否显示工具栏
   * @returns 是否显示工具栏
   */
  public isToolbarVisible(): boolean {
    return this.config.showToolbar;
  }

  /**
   * 获取地图配置
   * @returns 地图配置
   */
  public getMapConfig(): MapConfig["map"] {
    return this.config.map || DEFAULT_MAP_CONFIG;
  }

  /**
   * 设置地图类型
   * @param mapType 地图类型
   */
  public setMapType(mapType: MapType): void {
    this.config.mapType = mapType;
  }

  /**
   * 设置图层类型
   * @param mapTile 图层类型
   */
  public setMapTile(mapTile: MapTile): void {
    this.config.mapTile = mapTile;
  }

  /**
   * 设置中心点
   * @param center 中心点 [纬度, 经度]
   */
  public setCenter(center: [number, number]): void {
    this.config.center = center;
  }

  /**
   * 设置缩放级别
   * @param zoom 缩放级别
   */
  public setZoom(zoom: number): void {
    this.config.zoom = zoom;
  }

  /**
   * 检查是否显示比例尺
   * @returns 是否显示比例尺
   */
  public isScaleLineVisible(): boolean {
    return this.config.showScaleLine !== false; // 默认为true
  }

  /**
   * 设置是否显示比例尺
   * @param visible 是否显示
   */
  public setScaleLineVisible(visible: boolean): void {
    this.config.showScaleLine = visible;
  }
}
