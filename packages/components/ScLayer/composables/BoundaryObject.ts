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
import { BoundaryData, BoundaryItem, BoundaryLevel, BoundaryOptions, BoundaryCoordinate } from '../types/boundary';
import { DEFAULT_BOUNDARY_OPTIONS } from '../types/default';
import logger from './LogObject';
import { fetchGaodeBoundary } from '../api/district';
import { fetchGaodeDistrictTree } from '../api/district';
import GeoJSON from 'ol/format/GeoJSON';

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
          ? `rgba(${this.hexToRgb(this.options.fillColor || '#1677ff')}, ${this.options.fillOpacity || 0.2})`
          : 'transparent'
      })
    };

    // 创建文本样式
    const textStyle = showLabel && this.options.showLabel ? new Text({
      text: name,
      font: `${this.options.labelOptions?.fontWeight || 'normal'} ${this.options.labelOptions?.fontSize || 12}px ${this.options.labelOptions?.fontFamily || 'sans-serif'}`,
      fill: new Fill({
        color: this.options.labelOptions?.fontColor || '#333'
      }),
      backgroundFill: this.options.labelOptions?.backgroundColor ? new Fill({
        color: `rgba(${this.hexToRgb(this.options.labelOptions.backgroundColor)}, ${this.options.labelOptions.backgroundOpacity || 0.8})`
      }) : undefined,
      padding: this.options.labelOptions?.padding || [5, 5, 5, 5],
      offsetX: this.options.labelOptions?.offset?.[0] || 0,
      offsetY: this.options.labelOptions?.offset?.[1] || 0,
      textAlign: this.options.labelOptions?.textAlign || 'center',
      textBaseline: this.options.labelOptions?.textBaseline || 'middle',
      rotation: this.options.labelOptions?.rotation || 0,
      scale: this.options.labelOptions?.scale || 1,
      overflow: true
    }) : undefined;

    // 创建悬停样式
    const hoverStyle = this.options.hoverStyle ? new Style({
      stroke: new Stroke({
        color: this.options.hoverStyle.strokeColor || '#1890ff',
        width: this.options.hoverStyle.strokeWidth || 3,
        lineDash: this.options.strokeStyle === 'dashed' ? [5, 5] : 
                  this.options.strokeStyle === 'dotted' ? [1, 3] : 
                  this.options.strokeDashArray || undefined,
        lineCap: this.options.strokeLineCap || 'round',
        lineJoin: this.options.strokeLineJoin || 'round'
      }),
      fill: new Fill({
        color: `rgba(${this.hexToRgb(this.options.hoverStyle.fillColor || '#1890ff')}, ${this.options.hoverStyle.fillOpacity || 0.3})`
      })
    }) : undefined;

    // 创建选中样式
    const selectedStyle = this.options.selectedStyle ? new Style({
      stroke: new Stroke({
        color: this.options.selectedStyle.strokeColor || '#f5222d',
        width: this.options.selectedStyle.strokeWidth || 3,
        lineDash: this.options.strokeStyle === 'dashed' ? [5, 5] : 
                  this.options.strokeStyle === 'dotted' ? [1, 3] : 
                  this.options.strokeDashArray || undefined,
        lineCap: this.options.strokeLineCap || 'round',
        lineJoin: this.options.strokeLineJoin || 'round'
      }),
      fill: new Fill({
        color: `rgba(${this.hexToRgb(this.options.selectedStyle.fillColor || '#f5222d')}, ${this.options.selectedStyle.fillOpacity || 0.3})`
      })
    }) : undefined;

    // 返回样式数组
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
  
  /**
   * 通过行政区划代码添加边界
   * @param adcode 行政区划代码
   */
  public async addBoundaryByAdcode(adcode: string): Promise<void> {
    // 检查是否已经添加过该边界
    if (this.selectedBoundaries.has(adcode)) {
      logger.debug(`边界已存在: ${adcode}`);
      return;
    }

    try {
      // 调用fetchGaodeBoundary获取边界数据
      const boundaryResponseData = await fetchGaodeBoundary({
        key: this.options.mapKey?.[this.options.provider || 'GAODE'] || '', // 从options获取key和provider
        url: this.options.boundaryUrl, // 从options获取boundaryUrl
        adcode: adcode // 传递adcode
      });

      if (boundaryResponseData && boundaryResponseData.polyline) {
        // 如果获取到数据且包含polyline，则进行转换和添加

        debugger
        // 获取原始数据投影和目标地图投影
        const dataProjection = this.options.projection || 'EPSG:4326'; // 高德API返回的经纬度是WGS84，对应EPSG:4326
        const featureProjection = 'EPSG:3857'; // 目标投影从options获取，默认EPSG:3857

        // 解析高德 polyline 并转换为 OpenLayers Features
        const features = this.parseGaodePolylineToFeatures(boundaryResponseData.polyline, dataProjection, featureProjection);

        if (features && features.length > 0) {
           // 为每个feature设置属性和样式，并添加到源
           features.forEach(feature => {
             // 添加原始区划属性
             feature.setProperties({
               code: boundaryResponseData.adcode,
               name: boundaryResponseData.name,
               level: boundaryResponseData.level,
               // 可能需要其他属性，如中心点等
             });

             // 设置样式
             // 这里简化处理，所有feature使用同样的样式，如果需要区分外环内环或多部分样式，需要调整 parseGaodePolylineToFeatures 返回的结构或在此处根据属性判断
             feature.setStyle(this.createBoundaryStyle(boundaryResponseData.name, true)); // 默认显示标签

             // 添加到源
             this.boundarySource.addFeature(feature);
             logger.debug(`成功添加边界 feature: ${boundaryResponseData.name}(${boundaryResponseData.adcode})`);
           });

           // 将区划数据添加到选中集合 (这里只保存一份原始数据，feature已添加到source)
           const boundaryData: BoundaryData = {
              code: boundaryResponseData.adcode,
              name: boundaryResponseData.name,
              level: boundaryResponseData.level,
              // coordinates属性现在可能不再直接使用，或者需要从features重新提取
              coordinates: [] // 暂时置空，或者根据需要从features提取
           };
           this.selectedBoundaries.set(adcode, boundaryData);

        } else {
          logger.warn(`解析高德 polyline 未生成有效 features: ${adcode}`);
        }

      } else {
        logger.warn(`未获取到区划边界数据或缺少polyline: ${adcode}`);
      }

    } catch (error) {
      logger.error(`通过adcode添加边界失败: ${adcode}`, error);
    }
  }
  
  /**
   * 解析高德 polyline 字符串为 OpenLayers Feature[]
   * @param polyline 高德API返回的 polyline 字符串
   * @param dataProjection 原始数据投影 (如 'EPSG:4326')
   * @param featureProjection 目标特征投影 (如 'EPSG:3857')
   * @returns OpenLayers Feature 数组
   */
  private parseGaodePolylineToFeatures(polyline: string, dataProjection: string, featureProjection: string): Feature[] {
    const multiPolygonCoordinates: number[][][][] = [];

    // 按 '|' 分隔不同的多边形部分
    const parts = polyline.split('|');

    parts.forEach(part => {
      const polygonCoordinates: number[][][] = [];

      // 按 ';' 分隔多边形的环 (外环和内环)
      const rings = part.split(';');

      rings.forEach(ringStr => {
        const ringCoordinates: number[][] = [];

        // 按 ',' 分隔经纬度点
        const points = ringStr.split(',');

        points.forEach(pointStr => {
          const [lng, lat] = pointStr.split(',').map(parseFloat);
          if (!isNaN(lng) && !isNaN(lat)) {
            ringCoordinates.push([lng, lat]); // GeoJSON 格式是 [longitude, latitude]
          }
        });

        if (ringCoordinates.length > 0) {
          polygonCoordinates.push(ringCoordinates);
        }
      });

      if (polygonCoordinates.length > 0) {
         multiPolygonCoordinates.push(polygonCoordinates);
      }
    });

    // 构建 GeoJSON 对象
    const geoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: multiPolygonCoordinates // GeoJSON MultiPolygon 格式是 [polygon1, polygon2, ...]
          },
          properties: {} // 可以添加属性
        }
      ]
    };

    try {
      // 使用 OpenLayers GeoJSON 解析并转换投影
      const geoJsonFormat = new GeoJSON({
        dataProjection: dataProjection, // 原始数据投影
        featureProjection: featureProjection // 目标投影
      });

      return geoJsonFormat.readFeatures(geoJson);
    } catch (error) {
      logger.error('解析 GeoJSON 数据失败:', error);
      return [];
    }
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

  // 格式化区划节点数据，使其符合el-tree的要求
  private formatDistrictNode(d: any) {
    return {
      adcode: d.adcode,
      name: d.name,
      level: d.level,
      children: d.districts ? d.districts.map(this.formatDistrictNode) : [] // 递归格式化子节点
    };
  }
} 