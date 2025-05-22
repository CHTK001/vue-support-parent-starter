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
import { fetchGaodeBoundary } from '../api/district';
import { fetchGaodeDistrictTree } from '../api/district';
import GeoJSON from 'ol/format/GeoJSON';
import { MapType } from '../types/map';
import { CoordSystem, getCoordSystemByMapType, convertCoordSystemToProjection, wgs84ToGcj02, gcj02ToWgs84 } from '../utils/coordUtils';
import { MapObject } from './MapObject';
import { GeoPoint } from './GcoordObject';
import { indexedDBProxy } from '@repo/utils';
import { BoundaryConverterFactory } from '../interfaces/converters';

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
      // 获取当前地图服务商
      const provider = this.options.provider || 'gaode';
      
      // 获取区划数据
      const data = await this.fetchBoundaryData(adcode, options);
      if (!data) {
        return false;
      }

      // 使用转换器将数据转换为高德格式
      const converter = BoundaryConverterFactory.getConverter(provider);
      const convertedData = converter.convertToGaode(data, options);

      // 使用转换后的数据创建区划
      return this.createBoundary(convertedData, options);
    } catch (error) {
      console.error('添加区划失败:', error);
      return false;
    }
  }
  
  /**
   * 解析高德 polyline 字符串为 OpenLayers Feature[]
   * @param polyline 高德API返回的 polyline 字符串
   * @param dataProjection 原始数据投影 (如 'EPSG:4326')
   * @param featureProjection 目标特征投影 (如 'EPSG:3857')
   * @returns OpenLayers Feature 数组
   */
  private parseGaodePolylineToFeatures(polyline: string, projection: CoordSystem): Feature[] {
    if (!polyline) {
      logger.warn('无效的polyline字符串');
      return [];
    }
    const gcoordObject = this.mapObject.getGcoordObject();

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
            // 高德坐标(GCJ02)转换为Web墨卡托(EPSG:3857)
            const coord = gcoordObject.convertFromMapCoord({
              lat: lat,
              lng: lng
            }, projection)
            const mercatorCoord = fromLonLat([coord.lng, coord.lat], 'EPSG:3857');
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
    return features;
  }
  
  /**
   * 加载行政区划树数据
   * @returns 行政区划树数据Promise
   */
  public async loadDistrictTree(): Promise<any[]> {
    try {
      let districts;
      if (this.options.districtUrl) {
        // 如果配置了districtUrl，从URL获取数据
        districts = await fetchGaodeDistrictTree({
          key: this.options.mapKey?.[this.options.provider || 'GAODE'] || '',
          url: this.options.districtUrl,
          keywords: '',
          subdistrict: 2,
          extensions: 'base'
        });
      } else {
        // 如果districtUrl为空，使用本地JSON数据
        // 动态导入本地JSON，避免打包所有区划数据
        const gaodeDistrictData = (await import('../data/districts.json')).default;
        districts = gaodeDistrictData;
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
        this.clickListener = this.map.on('click', (event) => {
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
   * 获取区划数据
   * @param adcode 行政区划代码
   * @param options 区划配置选项
   * @returns 区划数据
   */
  private async fetchBoundaryData(adcode: string, options: BoundaryOptions): Promise<any> {
    // 检查是否已经添加过该边界
    if (this.selectedBoundaries.has(adcode)) {
      logger.debug(`边界已存在: ${adcode}`);
      return null;
    }

    try {
      // 1. 先查缓存
      const cacheKey = `boundary-${adcode}`;
      const db = indexedDBProxy();
      let boundaryResponseData = await db.getItem(cacheKey) as any;
      
      if (!boundaryResponseData) {
        // 2. 缓存没有，请求接口
        boundaryResponseData = await fetchGaodeBoundary({
          key: this.options.mapKey?.[this.options.provider || 'GAODE'] || '',
          url: this.options.boundaryUrl,
          adcode: adcode
        });
        
        // 3. 写入缓存
        if (boundaryResponseData) {
          await db.setItem(cacheKey, boundaryResponseData);
        }
      }

      return boundaryResponseData;
    } catch (error) {
      logger.error(`获取区划数据失败: ${adcode}`, error);
      return null;
    }
  }

  /**
   * 创建区划
   * @param data 区划数据
   * @param options 区划配置选项
   * @returns 是否创建成功
   */
  private createBoundary(data: any, options: BoundaryOptions): boolean {
    if (!data || !data.polyline) {
      logger.warn(`未获取到区划边界数据或缺少polyline`);
      return false;
    }

    try {
      // 解析 polyline 并转换为 OpenLayers Features
      const features = this.parseGaodePolylineToFeatures(data.polyline, options.projection);

      if (features && features.length > 0) {
        // 为每个feature设置属性和样式，并添加到源
        features.forEach((feature, index) => {
          // 设置属性
          feature.setProperties({
            code: data.adcode,
            name: data.name,
            level: data.level,
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
          level: data.level,
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
} 