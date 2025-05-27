/**
 * 区划边界对象
 * @description 处理区划边界的显示和管理
 */
import { Map as OlMap } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { BoundaryData, BoundaryItem, BoundaryLevel, BoundaryOptions, BoundaryCoordinate } from '../types/boundary';
import { DEFAULT_BOUNDARY_OPTIONS } from '../types/default';
import logger from './LogObject';
import { fetchGaodeDistrictTree } from '../api/district';
import GeoJSON from 'ol/format/GeoJSON';
import { MapType } from '../types/map';
import { CoordSystem } from '../types/coordinate';
import { getCoordSystemByMapType, convertCoordSystemToProjection, wgs84ToGcj02, gcj02ToWgs84, GcoordUtils } from '../utils/GcoordUtils';
import { MapObject } from './MapObject';
import { GeoPoint } from '../types/coordinate';
import { indexedDBProxy } from '@repo/utils';
import { BoundaryDataProviderFactory, BoundaryDataFormat, CoordinatePoint } from '../interfaces/BoundaryDataProvider';
import { registerAllProviders } from '../interfaces/providers';

// 扩展全局Window接口，添加高德地图声明
declare global {
  interface Window {
    AMap: any;
  }
}

export class BoundaryObject {
  private map: OlMap;
  private options: BoundaryOptions;
  private boundaryLayer: VectorLayer<VectorSource>;
  private boundarySource: VectorSource;
  private selectedBoundaries: Map<string, BoundaryData> = new Map();
  
  // 缓存已加载的区划数据，避免重复请求
  private boundaryCache: Map<string, BoundaryData> = new Map();
  
  // 引用MapObject实例以访问GcoordObject
  private mapObject: MapObject;
  
  // 当前显示的行政级别
  private currentLevel: string = 'country';
  
  // 行政区划历史记录，用于返回上级
  private boundaryHistory: BoundaryData[] = [];
  
  // 钻取回调函数
  private drillCallback: ((data: BoundaryData, isBack: boolean) => void) | null = null;
  
  /**
   * 构造函数
   * @param mapObject MapObject实例
   * @param options 配置选项
   */
  constructor(mapObject: MapObject, options?: Partial<BoundaryOptions>) {
    this.mapObject = mapObject;
    this.map = mapObject.getMapInstance()!;
    this.options = { ...DEFAULT_BOUNDARY_OPTIONS, ...options };
    // 注册所有提供者
    registerAllProviders();
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
    
    // 初始化点击事件
    this.initClickEvent();
    
    logger.debug('区划边界对象初始化完成');
  }
  
  /**
   * 设置配置选项
   * @param options 配置选项
   */
  public setOptions(options: Partial<BoundaryOptions>): void {
    this.options = {...this.options, ...options};
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
   * 添加边界到地图
   * @param boundaryData 区划数据
   */
  public addBoundary(boundaryData: BoundaryData): void {
    // 先检查是否已经添加过该边界
    if (this.selectedBoundaries.has(boundaryData.code)) {
      logger.debug(`边界已存在，不再重复添加: ${boundaryData.name}(${boundaryData.code})`);
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
    // 根据名称生成随机但固定的颜色
    const getColorByName = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      return `hsla(${hue}, 70%, 60%, 0.6)`;
    };

    // 创建基础样式
    const baseStyle = {
      stroke: new Stroke({
        color: this.options.strokeColor || '#1677ff',
        width: this.options.strokeWidth || 2,
        lineDash: this.options.strokeStyle === 'dashed' ? [5, 5] : 
                  this.options.strokeStyle === 'dotted' ? [1, 3] : 
                  this.options.strokeDashArray || undefined,
        lineCap: this.options.strokeLineCap || 'round',
        lineJoin: this.options.strokeLineJoin || 'round'
      }),
      fill: new Fill({
        color: this.options.fillBoundary 
          ? getColorByName(name)
          : 'transparent'
      })
    };

    // 创建文本样式
    const textStyle = showLabel && this.options.showLabel ? new Text({
      text: name,
      font: `${this.options.labelOptions?.fontWeight || 'normal'} ${this.options.labelOptions?.fontSize || 14}px ${this.options.labelOptions?.fontFamily || 'sans-serif'}`,
      fill: new Fill({
        color: this.options.labelOptions?.fontColor || '#333'
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 3
      }),
      backgroundFill: this.options.labelOptions?.backgroundColor ? new Fill({
        color: `rgba(${this.hexToRgb(this.options.labelOptions.backgroundColor)}, ${this.options.labelOptions.backgroundOpacity || 0.8})`
      }) : undefined,
      padding: this.options.labelOptions?.padding || [5, 5, 5, 5],
      offsetX: this.options.labelOptions?.offset?.[0] || 0,
      offsetY: this.options.labelOptions?.offset?.[1] || 0,
      textAlign: this.options.labelOptions?.textAlign || 'center',
      textBaseline: this.options.labelOptions?.textBaseline || 'middle',
      overflow: true
    }) : undefined;

    // 返回样式
    return new Style({
      ...baseStyle,
      text: textStyle,
      zIndex: this.options.zIndex || 0
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
  public updateAllBoundariesStyle(): void {
    logger.debug('开始更新所有边界样式');
    
    // 获取所有要素
    const features = this.boundarySource.getFeatures();
    
    // 更新每个要素的样式
    features.forEach(feature => {
      const properties = feature.getProperties();
      if (properties) {
        feature.setStyle(this.createBoundaryStyle(properties.name, properties.ringIndex === 0));
      }
    });
    
    logger.debug(`已更新 ${features.length} 个边界要素的样式`);
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
    
    // 移除点击事件
    if (this.clickListener) {
      this.map.un('click', this.clickListener);
      this.clickListener = null;
    }
    
    logger.debug('区划边界对象已销毁');
  }
  
  /**
   * 通过行政区划代码添加边界
   * @param adcode 行政区划代码
   */
  public async addBoundaryByAdcode(adcode: string, options: BoundaryOptions = {}): Promise<boolean> {
    try {
      // 首先检查是否已经添加过该边界
      if (this.selectedBoundaries.has(adcode)) {
        logger.debug(`边界已存在，不再重复添加: ${adcode}`);
        // 如果已经存在，直接返回成功
        return true;
      }

      // 获取区划数据（已转换为高德格式）
      const data = await this.fetchBoundaryData(adcode, options);
      if (!data) {
        return false;
      }

      // 将数据创建区划，并确保坐标系统为EPSG:3857
      return this.createBoundary(data, {
        ...options,
        projection: CoordSystem.EPSG3857 // 强制使用EPSG:3857坐标系
      });
    } catch (error) {
      console.error('添加区划失败:', error);
      return false;
    }
  }

  /**
   * 获取区划数据
   * @param adcode 行政区划代码
   * @param options 区划配置选项
   * @returns 区划数据（统一转换为高德格式）
   */
  private async fetchBoundaryData(adcode: string, options: BoundaryOptions): Promise<BoundaryDataFormat | null> {
    try {
      // 获取当前地图服务商
      const provider = this.options.provider || MapType.GAODE;
      
      // 1. 先查缓存 - 使用包含地图提供商的缓存键以区分不同来源的数据
      const cacheKey = `boundary-${provider}-${adcode}`;
      const db = indexedDBProxy();
      let boundaryResponseData = await db.getItem(cacheKey) as any;
      
      if (!boundaryResponseData) {
        // 2. 缓存没有，使用区划数据提供者获取数据
        try {
          
          // 从工厂获取对应的区划数据提供者
          const dataProvider = BoundaryDataProviderFactory.getProvider(provider.toLowerCase());
          
          // 优先使用 apiUrls.boundary，然后是旧的 boundaryUrl 属性
          const boundaryUrl = options.apiUrls?.boundary || options.boundaryUrl || this.options.apiUrls?.boundary || this.options.boundaryUrl;
          
          // 使用提供者获取区划数据
          boundaryResponseData = await dataProvider.fetchBoundaryData(
            adcode,
            this.options.mapKey?.[provider] || '',
            boundaryUrl
          );
          
          logger.debug(`成功获取区划数据: ${adcode} (提供者: ${provider})`);
          
          // 3. 写入缓存
          if (boundaryResponseData) {
            await db.setItem(cacheKey, boundaryResponseData);
          }
        } catch (error) {
          logger.error(`获取区划数据失败: ${adcode} (提供者: ${provider})`, error);
          return null;
        }
      }

      // 4. 使用提供者的转换功能将数据转换为统一的高德格式
      if (boundaryResponseData) {
        try {
          // 获取对应的提供者
          const dataProvider = BoundaryDataProviderFactory.getProvider(provider.toLowerCase());
          
          // 转换数据为高德格式
          const convertedData = dataProvider.convertToGaodeFormat(boundaryResponseData, options);
          logger.debug(`区划数据已转换为高德格式: ${adcode}`);
          return convertedData;
        } catch (error) {
          logger.error(`转换区划数据失败: ${adcode}`, error);
          // 如果转换失败但原始数据存在，返回原始数据
          return boundaryResponseData;
        }
      }

      return null;
    } catch (error) {
      logger.error(`获取区划数据失败: ${adcode}`, error);
      return null;
    }
  }

  /**
   * 解析高德 polyline 字符串为 OpenLayers Feature[]
   * @param polyline 高德API返回的 polyline 字符串
   * @param projection 目标投影坐标系（统一使用EPSG:3857）
   * @returns OpenLayers Feature 数组
   */
  private parseGaodePolylineToFeatures(polyline: string, projection: CoordSystem, data?: any): Feature[] {
    if (!polyline) {
      logger.warn('无效的polyline字符串');
      return [];
    }
    
    // 获取坐标转换对象
    const gcoordUtils = GcoordUtils;
    const gcoordObject = this.mapObject.getGcoordObject();
    
    // 确定源坐标系统类型 - 优先使用转换器提供的sourceCoordType
    let sourceCoordType: CoordSystem;
    if (data && data.sourceCoordType) {
      // 如果转换器已经提供了源坐标系统类型，则直接使用
      sourceCoordType = data.sourceCoordType;
    } else {
      // 否则根据地图类型推断
      const mapType = this.options.provider?.toUpperCase() || 'GAODE';
      switch (mapType) {
        case 'BAIDU':
          sourceCoordType = CoordSystem.BD09;
          break;
        case 'GAODE':
        case 'AMAP':
        case 'TENCENT':
          sourceCoordType = CoordSystem.GCJ02;
          break;
        case 'TIANDITU':
          sourceCoordType = CoordSystem.EPSG4490; // 天地图使用2000国家大地坐标系
          break;
        default:
          sourceCoordType = CoordSystem.WGS84; // 默认使用WGS84
      }
    }
    
    logger.debug(`解析区划数据: 源坐标系统=${sourceCoordType}, 目标坐标系统=EPSG:3857`);

    const features: Feature[] = [];
    // 按 '|' 分隔不同的多边形部分
    const parts = polyline.split('|');
    parts.forEach(part => {
      if (!part.trim()) return;
      // 每个part是一个多边形（可能有内环）
      const rings: number[][][] = [];
      // 按 ';' 分隔多边形的环
      const ringStrs = part.split(';');
      const coords: number[][] = [];
      ringStrs.forEach(ringStr => {
        if (!ringStr.trim()) return;
        // 每个ringStr是"lng1,lat1,lng2,lat2,..."
        const pointPairs = ringStr.split(',');
        if (pointPairs.length % 2 !== 0) {
          logger.warn('坐标点格式不正确:', ringStr);
          return;
        }
        for (let i = 0; i < pointPairs.length; i += 2) {
          const lng = parseFloat(pointPairs[i]);
          const lat = parseFloat(pointPairs[i + 1]);
          if (!isNaN(lng) && !isNaN(lat)) {
            // 将坐标点转换为EPSG:3857坐标系
            // 1. 首先，根据地图服务商判断源坐标系统
            // 2. 然后统一转换到EPSG:3857
            let mercatorCoord;
            try {
              // 直接使用GcoordUtils进行坐标转换
              const epsg3857Point = gcoordUtils.anyToEpsg3857({
                lng: lng,
                lat: lat
              }, sourceCoordType);
              
              // 确保以对象形式访问坐标
              const coordObj = GcoordUtils.toObject(epsg3857Point);
              
              // 使用OpenLayers的fromLonLat转换为EPSG:3857
              mercatorCoord = fromLonLat([coordObj.lng, coordObj.lat], 'EPSG:3857');
            } catch (error) {
              // 转换失败时的回退方案
              logger.warn('坐标转换失败，使用备用方法:', error);
              // 根据源坐标系统选择适当的转换方法
              let wgs84Point;
              switch (sourceCoordType) {
                case CoordSystem.GCJ02:
                  wgs84Point = GcoordUtils.gcj02ToWgs84ByLngLat(lng, lat);
                  break;
                case CoordSystem.BD09:
                  wgs84Point = GcoordUtils.bd09ToWgs84ByLngLat(lng, lat);
                  break;
                case CoordSystem.EPSG4490:
                case CoordSystem.WGS84:
                default:
                  wgs84Point = [lng, lat]; // WGS84或近似WGS84的坐标系不需要转换
                  break;
              }
              // 使用OpenLayers的fromLonLat将WGS84转换为EPSG:3857
              mercatorCoord = fromLonLat(wgs84Point, 'EPSG:3857');
            }
            
            coords.push(mercatorCoord);
          }
        }
      });
      if (coords.length > 2) {
        // 闭合多边形
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push([...first]);
        }
        rings.push(coords);
      }
      if (rings.length > 0) {
        // 创建多边形要素
        const polygon = new Polygon(rings);
        const feature = new Feature({ geometry: polygon });
        features.push(feature);
      }
    });
    
    logger.debug(`成功解析区划数据，生成 ${features.length} 个要素`);
    return features;
  }
  
  /**
   * 加载行政区划树数据
   * @param mapKey 地图密钥（可选）
   * @param districtUrl 自定义区划数据URL（可选）
   * @returns 行政区划树数据Promise
   */
  public async loadDistrictTree(mapKey?: Record<string, string>, districtUrl?: string): Promise<any[]> {
    try {
      let districts;
      // 优先使用传入的 districtUrl，然后是 options 中的 apiUrls.district，最后是旧的 districtUrl 属性
      const url = districtUrl || this.options.apiUrls?.district || this.options.districtUrl;
      
      if (url) {
        // 如果配置了URL，从URL获取数据
        // 优先使用传入的 mapKey，然后是 options 中的 mapKey
        const key = (mapKey || this.options.mapKey)?.[this.options.provider || 'GAODE'] || '';
        
        districts = await fetchGaodeDistrictTree({
          key: key,
          url: url,
          keywords: '',
          subdistrict: 2,
          extensions: 'base'
        });
      } else {
        // 如果URL为空，使用本地JSON数据
        // 动态导入本地JSON，避免打包所有区划数据
        const gaodeDistrictData = (await import('../data/districts.json')).default;
        districts = [{
          adcode: '100000',
          name: '中国',
          level: 'country',
          districts: gaodeDistrictData
        }];
      }

      // 返回格式化后的数据
      return districts;

    } catch (error) {
      logger.error('加载行政区划树失败:', error);
      return [];
    }
  }

  /**
   * 格式化区划节点数据，使其符合el-tree的要求
   * @param d 区划数据
   * @returns 格式化后的节点数据
   */
  private formatDistrictNode(d: any) {
    return {
      adcode: d.adcode,
      name: d.name,
      level: d.level,
      children: d.districts ? d.districts.map(this.formatDistrictNode) : [] // 递归格式化子节点
    };
  }

  /**
   * 设置钻取回调函数
   * @param callback 钻取回调函数
   */
  public setDrillCallback(callback: (data: BoundaryData, isBack: boolean) => void): void {
    this.drillCallback = callback;
    logger.debug('已设置区划钻取回调函数');
  }

  /**
   * 钻取到指定行政区划
   * @param adcode 行政区划代码
   * @param isBack 是否为返回上级操作
   */
  public async drillToBoundary(adcode: string, isBack: boolean = false): Promise<void> {
    if (!isBack) {
      // 如果不是返回上级，记录当前边界到历史
      const currentBoundaries = this.getSelectedBoundaries();
      if (currentBoundaries.length > 0) {
        // 只保存第一个边界到历史
        this.boundaryHistory.push(currentBoundaries[0]);
      }
    }

    try {
      // 清除现有的所有边界，防止重复显示
      this.clearBoundaries();
      
      // 加载新的边界
      await this.addBoundaryByAdcode(adcode);

      // 如果已加载边界，获取当前边界信息
      const loadedBoundaries = this.getSelectedBoundaries();
      if (loadedBoundaries.length > 0) {
        const boundaryData = loadedBoundaries[0];
        
        // 更新当前级别
        this.currentLevel = boundaryData.level;
        
        // 触发回调
        if (this.drillCallback) {
          this.drillCallback(boundaryData, isBack);
        }
      }
    } catch (error) {
      logger.error(`钻取到区划 ${adcode} 失败:`, error);
    }
  }

  /**
   * 返回上级行政区划
   * @returns 是否成功返回上级
   */
  public drillUp(): boolean {
    if (this.boundaryHistory.length === 0) {
      logger.warn('没有上级行政区划可返回');
      return false;
    }

    // 获取上一级边界
    const prevBoundary = this.boundaryHistory.pop();
    if (!prevBoundary) {
      return false;
    }

    // 钻取到上级边界
    this.drillToBoundary(prevBoundary.code, true);
    return true;
  }

  /**
   * 获取边界历史记录
   * @returns 边界历史记录
   */
  public getBoundaryHistory(): BoundaryData[] {
    return [...this.boundaryHistory];
  }

  /**
   * 平移地图到指定边界
   * @param code 行政区划代码
   */
  public fitToBoundary(code: string): void {
    logger.debug(`开始定位到边界: ${code}`);
    
    const features = this.boundarySource.getFeatures().filter(feature => {
      const properties = feature.getProperties();
      return properties && properties.code === code;
    });

    if (features.length === 0) {
      logger.warn(`找不到边界 ${code} 的要素`);
      return;
    }

    logger.debug(`找到 ${features.length} 个边界要素`);

    // 计算所有要素的总范围
    const extent = features[0].getGeometry()!.getExtent();
    features.forEach(feature => {
      const geometry = feature.getGeometry();
      if (geometry) {
        const featureExtent = geometry.getExtent();
        // 合并范围
        extent[0] = Math.min(extent[0], featureExtent[0]);
        extent[1] = Math.min(extent[1], featureExtent[1]);
        extent[2] = Math.max(extent[2], featureExtent[2]);
        extent[3] = Math.max(extent[3], featureExtent[3]);
      }
    });

    // 添加边界缓冲区
    const buffer = 0.5;  // 缓冲系数
    const width = extent[2] - extent[0];
    const height = extent[3] - extent[1];
    extent[0] -= width * buffer;
    extent[1] -= height * buffer;
    extent[2] += width * buffer;
    extent[3] += height * buffer;

    logger.debug(`计算的边界范围:`, extent);

    // 平移地图
    this.map.getView().fit(extent, {
      duration: 1000,  // 动画持续时间
      padding: [20, 20, 20, 20]  // 边距
    });
    
    logger.debug(`完成地图定位`);
  }

  /**
   * 设置区划点击事件
   * @param enable 是否启用点击事件
   */
  public enableClickEvent(enable: boolean): void {
    if (enable) {
      // 添加点击事件
      if (!this.clickListener) {
        // 添加用于处理双击检测的变量
        let lastClickTime = 0;
        const doubleClickDelay = 300; // 300ms内的两次点击视为双击
        
        this.clickListener = this.map.on('click', (event) => {
          // 检查是否是双击 - 如果与上次点击时间间隔小于设定值，则跳过此次点击处理
          const now = new Date().getTime();
          if (now - lastClickTime < doubleClickDelay) {
            // 更新点击时间但不处理此次点击
            lastClickTime = now;
            return;
          }
          
          // 更新最后点击时间
          lastClickTime = now;
          
          // 延迟处理点击事件，以便能检测到双击
          setTimeout(() => {
            // 再次检查，如果间隔时间短于设定值，说明发生了双击，不处理此次点击
            if (new Date().getTime() - lastClickTime >= doubleClickDelay) {
              const feature = this.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
              if (!feature) return;

              const layer = this.map.forEachFeatureAtPixel(event.pixel, 
                (feature, layer) => layer);
              
              // 确保点击的是区划图层的要素
              if (layer !== this.boundaryLayer) return;

              const properties = feature.get('properties') || feature.getProperties();
              if (properties && properties.code) {
                // 如果是省级行政区，钻取到该区域
                logger.debug(`点击了边界: ${properties.name}(${properties.code})`);
                this.drillToBoundary(properties.code);
              }
            }
          }, doubleClickDelay);
        });
      }
    } else {
      // 移除点击事件
      if (this.clickListener) {
        this.map.un('click', this.clickListener);
        this.clickListener = null;
      }
    }
  }

  // 在类的其他位置声明clickListener属性
  private clickListener: any = null;

  /**
   * 初始化点击事件
   */
  private initClickEvent(): void {
    if (!this.map) return;

    // 创建一个Overlay用于显示popup
    const container = document.createElement('div');
    container.className = 'boundary-popup';
    container.style.cssText = `
      position: absolute;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 200px;
      transform: translate(-50%, -100%);
      margin-top: -10px;
      opacity: 0;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    const overlay = new Overlay({
      element: container,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -10]
    });

    this.map.addOverlay(overlay);

    // 添加双击事件监听
    this.map.on('dblclick', (event) => {
      const features = this.map!.getFeaturesAtPixel(event.pixel, {
        layerFilter: (layer) => layer === this.boundaryLayer
      });

      if (features && features.length > 0) {
        const feature = features[0];
        const props = feature.getProperties();
        
        // 如果存在区划代码，则定位到该区划
        if (props && props.code) {
          logger.debug(`双击定位到边界: ${props.name}(${props.code})`);
          
          // 阻止事件传播，防止触发单击事件
          event.stopPropagation();
          event.preventDefault();
          
          // 定位到该区划
          this.fitToBoundary(props.code);
          
          // 显示提示信息
          const geometry = feature.getGeometry() as Polygon;
          const coordinate = geometry.getInteriorPoint().getCoordinates();
          
          // 临时提示信息
          const tempTip = document.createElement('div');
          tempTip.className = 'boundary-location-tip';
          tempTip.textContent = `已定位到: ${props.name}`;
          tempTip.style.cssText = `
            position: absolute;
            background: rgba(24, 144, 255, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transform: translate(-50%, -50%);
            z-index: 9999;
            pointer-events: none;
            animation: fade-out 2s forwards;
          `;
          
          document.body.appendChild(tempTip);
          
          // 设置提示信息位置
          const mapElement = this.map!.getTargetElement();
          const mapRect = mapElement.getBoundingClientRect();
          const pixelPosition = this.map!.getPixelFromCoordinate(coordinate);
          
          if (pixelPosition) {
            tempTip.style.left = `${mapRect.left + pixelPosition[0]}px`;
            tempTip.style.top = `${mapRect.top + pixelPosition[1]}px`;
          }
          
          // 2秒后移除提示信息
          setTimeout(() => {
            if (tempTip.parentNode) {
              tempTip.parentNode.removeChild(tempTip);
            }
          }, 2000);
          
          return;
        }
      }
    });

    // 添加点击事件监听
    this.map.on('click', (event) => {
      const features = this.map!.getFeaturesAtPixel(event.pixel, {
        layerFilter: (layer) => layer === this.boundaryLayer
      });

      if (features && features.length > 0) {
        const feature = features[0];
        const props = feature.getProperties();
        const geometry = feature.getGeometry() as Polygon;
        const coordinate = geometry.getInteriorPoint().getCoordinates();

        // 计算面积（平方公里）
        const area = geometry.getArea() / 1000000; // 转换为平方公里
        const formattedArea = area.toFixed(2);

        // 更新popup内容
        container.innerHTML = `
          <div style="
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 12px;
          ">
            <div style="
              font-size: 16px;
              font-weight: 600;
              color: #333;
              margin-bottom: 4px;
            ">${props.name}</div>
            <div style="
              font-size: 12px;
              color: #666;
              background: #f5f5f5;
              padding: 2px 8px;
              border-radius: 4px;
              display: inline-block;
            ">${props.level}</div>
          </div>
          <div style="
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px;
            font-size: 13px;
            color: #666;
          ">
            <div style="color: #999;">区划代码:</div>
            <div>${props.code}</div>
            <div style="color: #999;">面积:</div>
            <div>
              <span style="
                color: #1677ff;
                font-weight: 500;
              ">${formattedArea}</span>
              <span style="color: #999; margin-left: 4px;">平方公里</span>
            </div>
            <div style="color: #999; grid-column: 1/-1; margin-top: 8px; font-style: italic; font-size: 12px;">
              提示: 双击可定位到此区域
            </div>
          </div>
        `;

        overlay.setPosition(coordinate);
        // 显示动画
        requestAnimationFrame(() => {
          container.style.opacity = '1';
          container.style.transform = 'translate(-50%, -100%) scale(1)';
        });
      } else {
        // 隐藏动画
        container.style.opacity = '0';
        container.style.transform = 'translate(-50%, -100%) scale(0.95)';
        setTimeout(() => {
          overlay.setPosition(undefined);
        }, 300);
      }
    });

    // 添加鼠标移动事件，改变鼠标样式
    this.map.on('pointermove', (event) => {
      const hit = this.map!.hasFeatureAtPixel(event.pixel, {
        layerFilter: (layer) => layer === this.boundaryLayer
      });
      this.map!.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
  }

  /**
   * 根据区划数据创建边界
   * @param data 区划数据
   * @param options 区划配置选项
   * @returns 是否成功创建
   */
  private createBoundary(data: BoundaryDataFormat, options: BoundaryOptions): boolean {
    if (!data || !data.polyline) {
      logger.warn(`未获取到区划边界数据或缺少polyline`);
      return false;
    }

    // 再次检查是否已存在该边界，防止重复添加
    if (this.selectedBoundaries.has(data.adcode)) {
      logger.debug(`边界已存在，跳过重复创建: ${data.name}(${data.adcode})`);
      return true; // 返回true，因为边界已经存在
    }

    try {
      // 解析 polyline 并转换为 OpenLayers Features，确保使用EPSG:3857坐标系
      let features: Feature[] = [];
      
      // 处理不同格式的 polyline
      if (typeof data.polyline === 'string') {
        // 旧格式：字符串格式的 polyline
        features = this.parseGaodePolylineToFeatures(data.polyline, CoordSystem.EPSG3857, data);
      } else if (Array.isArray(data.polyline)) {
        // 新格式：CoordinatePoint[][] 格式的 polyline
        features = this.parseCoordinatePointsToFeatures(data.polyline);
      }

      if (features && features.length > 0) {
        // 为每个feature设置属性和样式，并添加到源
        features.forEach((feature, index) => {
          // 设置属性
          feature.setProperties({
            code: data.adcode,
            name: data.name,
            level: this.convertToBoundaryLevel(data.level),
            ringIndex: index
          });

          // 设置样式
          feature.setStyle(this.createBoundaryStyle(data.name, index === 0));

          // 添加到源
          this.boundarySource.addFeature(feature);
          logger.debug(`成功添加边界 feature: ${data.name}(${data.adcode})`);
        });

        // 将区划数据添加到选中集合
        const boundaryData: BoundaryData = {
          code: data.adcode,
          name: data.name,
          level: this.convertToBoundaryLevel(data.level),
          coordinates: [] // 暂时置空，或者根据需要从features提取
        };
        this.selectedBoundaries.set(data.adcode, boundaryData);

        return true;
      } else {
        logger.warn(`解析 polyline 未生成有效 features`);
        return false;
      }
    } catch (error) {
      logger.error(`创建区划失败`, error);
      return false;
    }
  }

  /**
   * 将坐标点数组转换为 OpenLayers Feature[]
   * @param polylineArray 坐标点数组
   * @returns OpenLayers Feature 数组
   */
  private parseCoordinatePointsToFeatures(polylineArray: CoordinatePoint[][]): Feature[] {
    if (!polylineArray || polylineArray.length === 0) {
      logger.warn('无效的坐标点数组');
      return [];
    }
    
    const features: Feature[] = [];
    
    // 处理每个闭合环
    polylineArray.forEach(ring => {
      if (!ring || ring.length === 0) return;
      
      // 提取坐标点
      const coordinates: number[][] = ring.map(point => {
        // 坐标已经是EPSG:3857，直接使用
        return [point.lng, point.lat];
      });
      
      // 创建多边形几何
      const polygon = new Polygon([coordinates]);
      
      // 创建要素
      const feature = new Feature({
        geometry: polygon
      });
      
      features.push(feature);
    });
    
    return features;
  }

  /**
   * 将字符串级别转换为 BoundaryLevel 枚举
   * @param level 级别字符串或枚举值
   * @returns BoundaryLevel 枚举值
   */
  private convertToBoundaryLevel(level: string | BoundaryLevel): BoundaryLevel {
    if (typeof level === 'string') {
      switch (level.toLowerCase()) {
        case 'province':
          return BoundaryLevel.PROVINCE;
        case 'city':
          return BoundaryLevel.CITY;
        case 'district':
        case 'country':
        case 'street':
        default:
          return BoundaryLevel.DISTRICT;
      }
    }
    return level;
  }
} 