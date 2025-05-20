/**
 * 区划边界对象
 * @description 处理区划边界的显示和管理
 */
import { Map as OlMap } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { BoundaryData, BoundaryItem, BoundaryLevel, BoundaryOptions, DEFAULT_BOUNDARY_OPTIONS, BoundaryImplementation } from '../types/boundary';
import logger from './LogObject';

export class BoundaryObject {
  private map: OlMap;
  private options: BoundaryOptions;
  private boundaryLayer: VectorLayer<VectorSource>;
  private boundarySource: VectorSource;
  private selectedBoundaries: Map<string, BoundaryData> = new Map();
  
  // 缓存已加载的区划数据，避免重复请求
  private boundaryCache: Map<string, BoundaryData> = new Map();
  
  /**
   * 构造函数
   * @param map OpenLayers地图实例
   * @param options 配置选项
   */
  constructor(map: OlMap, options?: Partial<BoundaryOptions>) {
    this.map = map;
    this.options = {...DEFAULT_BOUNDARY_OPTIONS, ...options};
    
    // 创建矢量图层源
    this.boundarySource = new VectorSource({
      features: []
    });
    
    // 创建矢量图层
    this.boundaryLayer = new VectorLayer({
      source: this.boundarySource,
      zIndex: this.options.zIndex,
      properties: {
        name: 'boundary-layer'
      }
    });
    
    // 将图层添加到地图
    this.map.addLayer(this.boundaryLayer);
    
    logger.debug('区划边界对象初始化完成');
  }
  
  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: Partial<BoundaryOptions>): void {
    this.options = {...this.options, ...options};
    
    // 更新所有已绘制的边界样式
    this.updateAllBoundariesStyle();
    
    logger.debug('区划边界配置已更新:', this.options);
  }
  
  /**
   * 获取配置选项
   * @returns 配置选项
   */
  public getOptions(): BoundaryOptions {
    return this.options;
  }
  
  /**
   * 加载区划数据
   * @param code 区划代码
   * @param level 区划级别
   * @returns 区划数据Promise
   */
  public async loadBoundary(code: string, level: BoundaryLevel): Promise<BoundaryData | null> {
    // 检查缓存
    const cacheKey = `${level}-${code}`;
    if (this.boundaryCache.has(cacheKey)) {
      logger.debug(`使用缓存的区划数据: ${cacheKey}`);
      return this.boundaryCache.get(cacheKey) || null;
    }
    
    try {
      // 根据实现方式选择不同的API请求方法
      let boundaryData: BoundaryData;
      
      if (this.options.implementation === BoundaryImplementation.AMAP) {
        boundaryData = await this.loadBoundaryFromAMap(code, level);
      } else if (this.options.implementation === BoundaryImplementation.CUSTOM && this.options.url) {
        boundaryData = await this.loadBoundaryFromCustomAPI(code, level);
      } else {
        throw new Error('未支持的区划实现方式或缺少自定义API URL');
      }
      
      // 缓存数据
      this.boundaryCache.set(cacheKey, boundaryData);
      
      return boundaryData;
    } catch (error) {
      logger.error('加载区划数据失败:', error);
      return null;
    }
  }
  
  /**
   * 从高德地图加载区划数据
   * @param code 区划代码
   * @param level 区划级别
   * @returns 区划数据Promise
   */
  private async loadBoundaryFromAMap(code: string, level: BoundaryLevel): Promise<BoundaryData> {
    // 构建API参数
    const keywords = code === '100000' ? '中国' : code;
    const subdistrict = level === BoundaryLevel.PROVINCE ? 0 : 
                         level === BoundaryLevel.CITY ? 1 : 2;
    
    try {
      // 动态加载高德地图API
      await this.loadAMapScript();
      
      return new Promise((resolve, reject) => {
        // @ts-ignore 高德地图API会在全局添加AMap对象
        const districtSearch = new AMap.DistrictSearch({
          subdistrict: subdistrict,
          extensions: 'all',
          level: level
        });
        
        districtSearch.search(keywords, (status: string, result: any) => {
          if (status === 'complete') {
            if (result.districtList && result.districtList.length > 0) {
              const district = result.districtList[0];
              const boundaries = district.boundaries;
              
              if (!boundaries || boundaries.length === 0) {
                reject(new Error('未找到区划边界数据'));
                return;
              }
              
              // 转换高德坐标系为WGS84坐标系
              const coordinates: BoundaryCoordinate[][] = boundaries.map((boundary: any[]) => {
                return boundary.map((point: any) => ({
                  lng: point.lng,
                  lat: point.lat
                }));
              });
              
              resolve({
                code: district.adcode,
                name: district.name,
                level: level,
                coordinates
              });
            } else {
              reject(new Error('未找到区划信息'));
            }
          } else {
            reject(new Error(`高德地图API请求失败: ${status}`));
          }
        });
      });
    } catch (error) {
      logger.error('从高德地图加载区划数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 从自定义API加载区划数据
   * @param code 区划代码
   * @param level 区划级别
   * @returns 区划数据Promise
   */
  private async loadBoundaryFromCustomAPI(code: string, level: BoundaryLevel): Promise<BoundaryData> {
    if (!this.options.url) {
      throw new Error('缺少自定义API URL');
    }
    
    try {
      // 构建API URL
      const url = `${this.options.url}?code=${code}&level=${level}`;
      
      // 发送请求
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 转换响应数据格式
      return {
        code: data.code,
        name: data.name,
        level: level,
        coordinates: data.coordinates
      };
    } catch (error) {
      logger.error('从自定义API加载区划数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 动态加载高德地图脚本
   * @returns Promise
   */
  private loadAMapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.AMap) {
        resolve();
        return;
      }
      
      // 加载高德地图API
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=e5e7e0972e8fad7aff2ca80331b29358';
      script.onerror = reject;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
  
  /**
   * 添加边界到地图
   * @param boundaryData 区划数据
   */
  public addBoundary(boundaryData: BoundaryData): void {
    // 先检查是否已经添加过该边界
    if (this.selectedBoundaries.has(boundaryData.code)) {
      logger.debug(`边界已存在: ${boundaryData.name}(${boundaryData.code})`);
      return;
    }
    
    // 保存数据
    this.selectedBoundaries.set(boundaryData.code, boundaryData);
    
    // 创建要素
    const features: Feature[] = [];
    
    // 为每个闭环创建一个多边形要素
    boundaryData.coordinates.forEach((ring, index) => {
      // 转换坐标为OpenLayers坐标系
      const coordinates = ring.map(coord => fromLonLat([coord.lng, coord.lat]));
      
      // 创建多边形
      const polygon = new Polygon([coordinates]);
      
      // 创建要素
      const feature = new Feature({
        geometry: polygon,
        properties: {
          code: boundaryData.code,
          name: boundaryData.name,
          level: boundaryData.level,
          ringIndex: index
        }
      });
      
      // 设置样式
      feature.setStyle(this.createBoundaryStyle(boundaryData.name, index === 0));
      
      features.push(feature);
    });
    
    // 添加要素到源
    this.boundarySource.addFeatures(features);
    
    logger.debug(`成功添加边界: ${boundaryData.name}(${boundaryData.code})`);
  }
  
  /**
   * 创建边界样式
   * @param name 区划名称
   * @param showLabel 是否显示标签
   * @returns 样式对象
   */
  private createBoundaryStyle(name: string, showLabel: boolean): Style {
    return new Style({
      stroke: new Stroke({
        color: this.options.strokeColor || '#1677ff',
        width: this.options.strokeWidth || 2
      }),
      fill: new Fill({
        color: this.options.fillBoundary 
          ? `rgba(${this.hexToRgb(this.options.fillColor || '#1677ff')}, ${this.options.fillOpacity || 0.2})`
          : 'transparent'
      }),
      text: showLabel && this.options.showLabel ? new Text({
        text: name,
        font: `${this.options.labelOptions?.fontSize || 12}px sans-serif`,
        fill: new Fill({
          color: this.options.labelOptions?.fontColor || '#333'
        }),
        offsetX: this.options.labelOptions?.offset?.[0] || 0,
        offsetY: this.options.labelOptions?.offset?.[1] || 0,
        padding: [5, 5, 5, 5],
        textAlign: 'center',
        overflow: true
      }) : undefined
    });
  }
  
  /**
   * 将十六进制颜色转为RGB
   * @param hex 十六进制颜色
   * @returns RGB颜色
   */
  private hexToRgb(hex: string): string {
    // 去除#号
    hex = hex.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }
  
  /**
   * 更新所有已添加边界的样式
   */
  private updateAllBoundariesStyle(): void {
    // 获取所有要素
    const features = this.boundarySource.getFeatures();
    
    // 更新每个要素的样式
    features.forEach(feature => {
      const properties = feature.get('properties');
      if (properties) {
        feature.setStyle(this.createBoundaryStyle(properties.name, properties.ringIndex === 0));
      }
    });
    
    logger.debug('已更新所有边界样式');
  }
  
  /**
   * 移除指定边界
   * @param code 区划代码
   */
  public removeBoundary(code: string): void {
    // 检查是否存在该边界
    if (!this.selectedBoundaries.has(code)) {
      logger.debug(`边界不存在: ${code}`);
      return;
    }
    
    // 获取要删除的要素
    const features = this.boundarySource.getFeatures().filter(feature => {
      const properties = feature.get('properties');
      return properties && properties.code === code;
    });
    
    // 删除要素
    features.forEach(feature => {
      this.boundarySource.removeFeature(feature);
    });
    
    // 从选中集合中移除
    this.selectedBoundaries.delete(code);
    
    logger.debug(`成功移除边界: ${code}`);
  }
  
  /**
   * 清除所有边界
   */
  public clearBoundaries(): void {
    // 清空源
    this.boundarySource.clear();
    
    // 清空选中集合
    this.selectedBoundaries.clear();
    
    logger.debug('已清除所有边界');
  }
  
  /**
   * 获取已选中的边界列表
   * @returns 已选中的边界数据列表
   */
  public getSelectedBoundaries(): BoundaryData[] {
    return Array.from(this.selectedBoundaries.values());
  }
  
  /**
   * 检查边界是否已添加
   * @param code 区划代码
   * @returns 是否已添加
   */
  public hasBoundary(code: string): boolean {
    return this.selectedBoundaries.has(code);
  }
  
  /**
   * 设置边界图层的可见性
   * @param visible 是否可见
   */
  public setVisible(visible: boolean): void {
    this.boundaryLayer.setVisible(visible);
  }
  
  /**
   * 获取边界图层的可见性
   * @returns 是否可见
   */
  public isVisible(): boolean {
    return this.boundaryLayer.getVisible();
  }
  
  /**
   * 销毁对象
   */
  public destroy(): void {
    // 从地图中移除图层
    this.map.removeLayer(this.boundaryLayer);
    
    // 清空数据
    this.boundarySource.clear();
    this.selectedBoundaries.clear();
    this.boundaryCache.clear();
    
    logger.debug('区划边界对象已销毁');
  }
}

// 扩展全局Window接口，添加高德地图声明
declare global {
  interface Window {
    AMap: any;
  }
} 