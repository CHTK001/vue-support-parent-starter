/**
 * 网格对象
 * @description 管理地图上的网格，包括GeoHash和蜂窝网格
 */
import { Map as OlMap } from 'ol';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Stroke, Fill, Text } from 'ol/style';
import { Polygon } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { DataType } from '../types';
import logger from './LogObject';

// 网格类型枚举
export enum GridType {
  GEOHASH = 'geohash',
  HEXAGON = 'hexagon'
}

// 网格配置接口
export interface GridConfig {
  geohash: {
    precision: number;       // GeoHash精度(1-12)
    strokeColor: string;     // 边框颜色
    strokeWidth: number;     // 边框宽度
    fillColor: string;       // 填充颜色
    showLabels: boolean;     // 是否显示标签
    labelColor: string;      // 标签颜色
  };
  hexagon: {
    radius: number;          // 蜂窝网格半径(米)
    strokeColor: string;     // 边框颜色
    strokeWidth: number;     // 边框宽度
    fillColor: string;       // 填充颜色
    showLabels: boolean;     // 是否显示标签
    labelColor: string;      // 标签颜色
  };
}

// 默认网格配置
const DEFAULT_GRID_CONFIG: GridConfig = {
  geohash: {
    precision: 6,
    strokeColor: 'rgba(0, 60, 136, 0.8)',
    strokeWidth: 1,
    fillColor: 'rgba(0, 60, 136, 0.2)',
    showLabels: true,
    labelColor: '#003c88'
  },
  hexagon: {
    radius: 1000,  // 1公里半径
    strokeColor: 'rgba(255, 99, 71, 0.8)',
    strokeWidth: 1,
    fillColor: 'rgba(255, 99, 71, 0.2)',
    showLabels: true,
    labelColor: '#ff6347'
  }
};

// 网格模块的日志前缀
const LOG_MODULE = 'Grid';

/**
 * 网格对象类
 */
export class GridObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 网格图层
  private gridLayer: VectorLayer<VectorSource> | null = null;
  // 网格配置
  private config: GridConfig = DEFAULT_GRID_CONFIG;
  // 当前活动的网格类型
  private activeGridTypes: Set<GridType> = new Set();
  // 地图移动结束监听器
  private moveEndListener: EventsKey | null = null;
  // 当前视图的GeoHash网格特征
  private geohashFeatures: Feature[] = [];
  // 当前视图的蜂窝网格特征
  private hexagonFeatures: Feature[] = [];

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<GridConfig>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    this.log('debug', '网格对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    
    // 初始化网格图层
    this.initLayer();
    
    this.log('debug', '地图实例已设置');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: Partial<GridConfig>): void {
    this.config = {
      geohash: {
        ...DEFAULT_GRID_CONFIG.geohash,
        ...(config.geohash || {})
      },
      hexagon: {
        ...DEFAULT_GRID_CONFIG.hexagon,
        ...(config.hexagon || {})
      }
    };
    
    // 如果有活动的网格，重新绘制
    this.refresh();
    
    this.log('debug', '网格配置已更新');
  }

  /**
   * 初始化网格图层
   */
  private initLayer(): void {
    if (!this.mapInstance) {
      this.log('warn', '初始化网格图层失败: 地图实例不存在');
      return;
    }
    
    // 创建网格图层
    this.gridLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 15,  // 在大多数要素下方，但在底图上方
      properties: {
        title: '网格图层',
        type: 'grid'
      }
    });
    
    // 添加图层到地图
    this.mapInstance.addLayer(this.gridLayer);
    
    // 添加地图移动结束事件监听
    this.setupMoveEndListener();
    
    this.log('debug', '网格图层已初始化');
  }

  /**
   * 设置地图移动结束事件监听，以便在地图视图变化时更新网格
   */
  private setupMoveEndListener(): void {
    if (!this.mapInstance) return;
    
    // 移除现有的监听器
    this.removeMoveEndListener();
    
    // 添加新的监听器
    this.moveEndListener = this.mapInstance.on('moveend', () => {
      // 只有在有活动网格类型时才更新网格
      if (this.activeGridTypes.size > 0) {
        this.refresh();
      }
    });
    
    this.log('debug', '地图移动结束事件监听器已设置');
  }

  /**
   * 移除地图移动结束事件监听器
   */
  private removeMoveEndListener(): void {
    if (this.moveEndListener) {
      unByKey(this.moveEndListener);
      this.moveEndListener = null;
    }
  }

  /**
   * 启用指定类型的网格
   * @param gridType 网格类型
   */
  public enable(gridType: GridType): void {
    if (!this.mapInstance || !this.gridLayer) {
      this.log('warn', `启用${gridType}网格失败: 地图或网格图层未初始化`);
      return;
    }
    
    // 如果网格类型已启用，不需要重复操作
    if (this.activeGridTypes.has(gridType)) {
      this.log('debug', `${gridType}网格已经处于启用状态`);
      return;
    }
    
    // 将网格类型添加到活动集合
    this.activeGridTypes.add(gridType);
    
    // 生成并绘制相应类型的网格
    if (gridType === GridType.GEOHASH) {
      this.renderGeohashGrid();
    } else if (gridType === GridType.HEXAGON) {
      this.renderHexagonGrid();
    }
    
    this.log('info', `${gridType}网格已启用`);
  }

  /**
   * 禁用指定类型的网格
   * @param gridType 网格类型
   */
  public disable(gridType: GridType): void {
    if (!this.gridLayer) {
      this.log('warn', `禁用${gridType}网格失败: 网格图层未初始化`);
      return;
    }
    
    // 如果网格类型未启用，不需要操作
    if (!this.activeGridTypes.has(gridType)) {
      this.log('debug', `${gridType}网格已经处于禁用状态`);
      return;
    }
    
    // 从活动集合中移除网格类型
    this.activeGridTypes.delete(gridType);
    
    // 清除相应类型的网格
    if (gridType === GridType.GEOHASH) {
      this.clearGeohashGrid();
    } else if (gridType === GridType.HEXAGON) {
      this.clearHexagonGrid();
    }
    
    this.log('info', `${gridType}网格已禁用`);
  }

  /**
   * 清除GeoHash网格
   */
  private clearGeohashGrid(): void {
    if (!this.gridLayer || !this.gridLayer.getSource()) return;
    
    // 移除所有GeoHash网格特征
    this.geohashFeatures.forEach(feature => {
      this.gridLayer?.getSource()?.removeFeature(feature);
    });
    
    // 清空特征数组
    this.geohashFeatures = [];
  }

  /**
   * 清除蜂窝网格
   */
  private clearHexagonGrid(): void {
    if (!this.gridLayer || !this.gridLayer.getSource()) return;
    
    // 移除所有蜂窝网格特征
    this.hexagonFeatures.forEach(feature => {
      this.gridLayer?.getSource()?.removeFeature(feature);
    });
    
    // 清空特征数组
    this.hexagonFeatures = [];
  }

  /**
   * 刷新网格显示
   */
  public refresh(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    // 刷新启用的网格类型
    if (this.activeGridTypes.has(GridType.GEOHASH)) {
      this.clearGeohashGrid();
      this.renderGeohashGrid();
    }
    
    if (this.activeGridTypes.has(GridType.HEXAGON)) {
      this.clearHexagonGrid();
      this.renderHexagonGrid();
    }
  }

  /**
   * 渲染GeoHash网格
   */
  private renderGeohashGrid(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    // 获取当前地图视图
    const view = this.mapInstance.getView();
    const zoom = view.getZoom() || 0;
    const extent = view.calculateExtent(this.mapInstance.getSize() || [0, 0]);
    
    // 转换为经纬度坐标
    const bottomLeft = toLonLat([extent[0], extent[1]]);
    const topRight = toLonLat([extent[2], extent[3]]);
    
    // 计算视图中心
    const center = view.getCenter();
    if (!center) return;
    const centerLonLat = toLonLat(center);
    
    // 确定合适的GeoHash精度（根据地图缩放级别）
    let precision = this.config.geohash.precision;
    
    // 根据缩放级别动态调整精度
    if (zoom < 5) precision = 2;
    else if (zoom < 7) precision = 3;
    else if (zoom < 9) precision = 4;
    else if (zoom < 11) precision = 5;
    else if (zoom < 13) precision = 6;
    else if (zoom < 15) precision = 7;
    else precision = 8;
    
    // 记录当前精度，用于后续判断是否需要重新渲染
    const currentPrecision = precision;
    
    this.log('debug', `缩放级别: ${zoom}, 设置GeoHash精度: ${precision}`);
    
    // 生成视图范围内的GeoHash网格（包括周围额外的两个单元格）
    const geohashes = this.generateGeohashGrid(bottomLeft, topRight, precision, centerLonLat);
    
    // 创建网格特征并添加到图层
    const source = this.gridLayer.getSource();
    if (!source) return;
    
    const strokeColor = this.config.geohash.strokeColor;
    const strokeWidth = this.config.geohash.strokeWidth;
    const fillColor = this.config.geohash.fillColor;
    const showLabels = this.config.geohash.showLabels;
    const labelColor = this.config.geohash.labelColor;
    
    geohashes.forEach(geohash => {
      const { hash, bounds } = geohash;
      const bottomLeftLL = [bounds.minLng, bounds.minLat];
      const topLeftLL = [bounds.minLng, bounds.maxLat];
      const topRightLL = [bounds.maxLng, bounds.maxLat];
      const bottomRightLL = [bounds.maxLng, bounds.minLat];
      
      // 转换为OpenLayers坐标
      const coordinates = [
        fromLonLat(bottomLeftLL),
        fromLonLat(topLeftLL),
        fromLonLat(topRightLL),
        fromLonLat(bottomRightLL),
        fromLonLat(bottomLeftLL) // 闭合多边形
      ];
      
      // 创建多边形特征
      const feature = new Feature({
        geometry: new Polygon([coordinates]),
        hash,
        type: GridType.GEOHASH,
        dataType: DataType.GRID,
        precision: currentPrecision // 记录该网格的精度
      });
      
      // 设置样式
      const style = new Style({
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth
        }),
        fill: new Fill({
          color: fillColor
        })
      });
      
      // 如果需要显示标签
      if (showLabels) {
        style.setText(new Text({
          text: hash,
          fill: new Fill({
            color: labelColor
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          }),
          font: `${Math.max(10, 14 - (8 - precision))}px sans-serif`, // 根据精度动态调整字体大小
          overflow: true
        }));
      }
      
      feature.setStyle(style);
      
      // 添加到图层
      source.addFeature(feature);
      
      // 保存特征引用
      this.geohashFeatures.push(feature);
    });
    
    this.log('debug', `已渲染${this.geohashFeatures.length}个GeoHash网格单元（精度${precision}）`);
  }

  /**
   * 生成GeoHash网格
   * @param bottomLeft 左下角坐标 [lng, lat]
   * @param topRight 右上角坐标 [lng, lat]
   * @param precision GeoHash精度
   * @param center 地图中心点坐标 [lng, lat]，用于计算额外的网格单元
   * @returns GeoHash网格单元数组
   */
  private generateGeohashGrid(
    bottomLeft: number[], 
    topRight: number[], 
    precision: number,
    center: number[] = [(bottomLeft[0] + topRight[0])/2, (bottomLeft[1] + topRight[1])/2]
  ): Array<{hash: string, bounds: {minLat: number, maxLat: number, minLng: number, maxLng: number}}> {
    // 计算GeoHash基础信息
    const gridInfo = this.getGeoHashGridInfo(precision);
    
    // 扩展视图范围（添加额外2个网格单元的边距）
    const extendedMinLng = bottomLeft[0] - 2 * gridInfo.lngWidth;
    const extendedMinLat = bottomLeft[1] - 2 * gridInfo.latHeight;
    const extendedMaxLng = topRight[0] + 2 * gridInfo.lngWidth;
    const extendedMaxLat = topRight[1] + 2 * gridInfo.latHeight;
    
    // 计算中心点的基础GeoHash
    const centerHash = this.encodeGeoHash(center[1], center[0], precision);
    
    // 计算中心点GeoHash的边界
    const centerBounds = this.decodeGeoHashBounds(centerHash);
    
    // 计算需要在各个方向上生成的网格数量
    const lngGrids = Math.ceil((extendedMaxLng - extendedMinLng) / gridInfo.lngWidth);
    const latGrids = Math.ceil((extendedMaxLat - extendedMinLat) / gridInfo.latHeight);
    
    // 计算起始网格的左下角坐标
    const startLng = centerBounds.minLng - Math.floor(lngGrids / 2) * gridInfo.lngWidth;
    const startLat = centerBounds.minLat - Math.floor(latGrids / 2) * gridInfo.latHeight;
    
    const result = [];
    
    // 根据计算出的网格数生成GeoHash网格
    for (let y = 0; y < latGrids; y++) {
      for (let x = 0; x < lngGrids; x++) {
        const cellMinLng = startLng + x * gridInfo.lngWidth;
        const cellMaxLng = startLng + (x + 1) * gridInfo.lngWidth;
        const cellMinLat = startLat + y * gridInfo.latHeight;
        const cellMaxLat = startLat + (y + 1) * gridInfo.latHeight;
        
        // 计算当前网格中心点
        const cellCenterLat = (cellMinLat + cellMaxLat) / 2;
        const cellCenterLng = (cellMinLng + cellMaxLng) / 2;
        
        // 编码GeoHash
        const hash = this.encodeGeoHash(cellCenterLat, cellCenterLng, precision);
        
        // 获取精确的GeoHash边界
        const bounds = this.decodeGeoHashBounds(hash);
        
        result.push({
          hash,
          bounds
        });
      }
    }
    
    this.log('debug', `生成了${result.length}个GeoHash网格单元（精度${precision}）`);
    
    return result;
  }
  
  /**
   * 计算特定精度GeoHash的网格信息
   * @param precision GeoHash精度
   * @returns GeoHash网格信息
   */
  private getGeoHashGridInfo(precision: number): {latHeight: number, lngWidth: number} {
    // GeoHash精度与经纬度范围对应关系
    const precisionInfo: Record<number, {lat: number, lng: number}> = {
      1: { lat: 23, lng: 23 },
      2: { lat: 2.8, lng: 5.6 },
      3: { lat: 0.7, lng: 0.7 },
      4: { lat: 0.087, lng: 0.175 },
      5: { lat: 0.022, lng: 0.022 },
      6: { lat: 0.0027, lng: 0.0055 },
      7: { lat: 0.00068, lng: 0.00068 },
      8: { lat: 0.000085, lng: 0.00017 }
    };
    
    // 使用默认值，如果精度超出范围
    const info = precisionInfo[precision] || { lat: 0.00068, lng: 0.00068 };
    
    return {
      latHeight: info.lat,
      lngWidth: info.lng
    };
  }
  
  /**
   * GeoHash编码
   * @param lat 纬度
   * @param lng 经度
   * @param precision 精度
   * @returns GeoHash编码
   */
  private encodeGeoHash(lat: number, lng: number, precision: number): string {
    // GeoHash的base32字符集
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    
    // 纬度和经度的范围
    let latRange = { min: -90, max: 90 };
    let lngRange = { min: -180, max: 180 };
    
    let geohash = '';
    let bit = 0;
    let ch = 0;
    
    while (geohash.length < precision) {
      if (bit % 2 === 0) {
        // 处理经度
        const mid = (lngRange.min + lngRange.max) / 2;
        if (lng >= mid) {
          ch = (ch << 1) + 1;
          lngRange.min = mid;
        } else {
          ch = ch << 1;
          lngRange.max = mid;
        }
      } else {
        // 处理纬度
        const mid = (latRange.min + latRange.max) / 2;
        if (lat >= mid) {
          ch = (ch << 1) + 1;
          latRange.min = mid;
        } else {
          ch = ch << 1;
          latRange.max = mid;
        }
      }
      
      bit++;
      
      // 每5位二进制数生成一个字符
      if (bit === 5) {
        geohash += BASE32.charAt(ch);
        bit = 0;
        ch = 0;
      }
    }
    
    return geohash;
  }
  
  /**
   * 解码GeoHash获取边界
   * @param geohash GeoHash编码
   * @returns 边界信息
   */
  private decodeGeoHashBounds(geohash: string): {minLat: number, maxLat: number, minLng: number, maxLng: number} {
    // GeoHash的base32字符集
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    
    // 纬度和经度的范围
    let latRange = { min: -90, max: 90 };
    let lngRange = { min: -180, max: 180 };
    
    let isEven = true;
    
    // 解码GeoHash
    for (let i = 0; i < geohash.length; i++) {
      const c = geohash.charAt(i).toLowerCase();
      const cd = BASE32.indexOf(c);
      
      for (let j = 4; j >= 0; j--) {
        const mask = 1 << j;
        
        if (isEven) {
          // 处理经度
          if ((cd & mask) !== 0) {
            lngRange.min = (lngRange.min + lngRange.max) / 2;
          } else {
            lngRange.max = (lngRange.min + lngRange.max) / 2;
          }
        } else {
          // 处理纬度
          if ((cd & mask) !== 0) {
            latRange.min = (latRange.min + latRange.max) / 2;
          } else {
            latRange.max = (latRange.min + latRange.max) / 2;
          }
        }
        
        isEven = !isEven;
      }
    }
    
    // 返回边界信息
    return {
      minLat: latRange.min,
      maxLat: latRange.max,
      minLng: lngRange.min,
      maxLng: lngRange.max
    };
  }

  /**
   * 渲染蜂窝网格
   */
  private renderHexagonGrid(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    // 获取当前地图视图范围
    const extent = this.mapInstance.getView().calculateExtent(this.mapInstance.getSize() || [0, 0]);
    
    // 转换为经纬度坐标
    const bottomLeft = toLonLat([extent[0], extent[1]]);
    const topRight = toLonLat([extent[2], extent[3]]);
    
    // 确定合适的蜂窝网格半径（根据地图缩放级别）
    const zoom = this.mapInstance.getView().getZoom() || 0;
    let radius = this.config.hexagon.radius;
    
    // 根据缩放级别动态调整半径
    if (zoom < 5) radius = 50000; // 50公里
    else if (zoom < 8) radius = 10000; // 10公里
    else if (zoom < 12) radius = 2000; // 2公里
    else radius = 500; // 500米
    
    // 生成视图范围内的蜂窝网格
    const hexagons = this.generateHexagonGrid(bottomLeft, topRight, radius);
    
    // 创建网格特征并添加到图层
    const source = this.gridLayer.getSource();
    if (!source) return;
    
    const strokeColor = this.config.hexagon.strokeColor;
    const strokeWidth = this.config.hexagon.strokeWidth;
    const fillColor = this.config.hexagon.fillColor;
    const showLabels = this.config.hexagon.showLabels;
    const labelColor = this.config.hexagon.labelColor;
    
    hexagons.forEach(hexagon => {
      const { id, coordinates } = hexagon;
      
      // 转换为OpenLayers坐标
      const olCoordinates = coordinates.map(coord => fromLonLat(coord));
      // 闭合多边形
      olCoordinates.push(olCoordinates[0]);
      
      // 创建多边形特征
      const feature = new Feature({
        geometry: new Polygon([olCoordinates]),
        id,
        type: GridType.HEXAGON,
        dataType: DataType.GRID
      });
      
      // 设置样式
      const style = new Style({
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth
        }),
        fill: new Fill({
          color: fillColor
        })
      });
      
      // 如果需要显示标签
      if (showLabels) {
        style.setText(new Text({
          text: id,
          fill: new Fill({
            color: labelColor
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          }),
          font: '10px sans-serif',
          overflow: true
        }));
      }
      
      feature.setStyle(style);
      
      // 添加到图层
      source.addFeature(feature);
      
      // 保存特征引用
      this.hexagonFeatures.push(feature);
    });
    
    this.log('debug', `已渲染${this.hexagonFeatures.length}个蜂窝网格单元`);
  }

  /**
   * 生成蜂窝网格
   * @param bottomLeft 左下角坐标 [lng, lat]
   * @param topRight 右上角坐标 [lng, lat]
   * @param radius 蜂窝半径（米）
   * @returns 蜂窝网格单元数组
   */
  private generateHexagonGrid(bottomLeft: number[], topRight: number[], radius: number): Array<{id: string, coordinates: number[][]}> {
    // 这里简化实现，实际情况下需要使用更复杂的算法
    // 在此示例中，我们生成一个简单的六边形网格作为示例
    
    const minLng = bottomLeft[0];
    const minLat = bottomLeft[1];
    const maxLng = topRight[0];
    const maxLat = topRight[1];
    
    const result = [];
    
    // 网格数量
    const gridCountX = 8;
    const gridCountY = 8;
    
    // 网格大小
    const cellWidth = (maxLng - minLng) / gridCountX;
    const cellHeight = (maxLat - minLat) / gridCountY;
    
    // 六边形参数
    const hexWidth = cellWidth * 0.9;
    const hexHeight = cellHeight * 0.9;
    
    // 生成六边形网格
    for (let y = 0; y < gridCountY; y++) {
      for (let x = 0; x < gridCountX; x++) {
        // 计算六边形中心
        const centerX = minLng + (x + 0.5) * cellWidth;
        const centerY = minLat + (y + 0.5) * cellHeight;
        
        // 计算六边形的顶点（六个顶点）
        const vertices = [];
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i;
          const vertexX = centerX + Math.sin(angle) * hexWidth / 2;
          const vertexY = centerY + Math.cos(angle) * hexHeight / 2;
          vertices.push([vertexX, vertexY]);
        }
        
        // 生成网格单元ID
        const id = `H_${x}_${y}`;
        
        result.push({
          id,
          coordinates: vertices
        });
      }
    }
    
    return result;
  }

  /**
   * 获取指定类型网格的状态
   * @param gridType 网格类型
   * @returns 是否启用
   */
  public isEnabled(gridType: GridType): boolean {
    return this.activeGridTypes.has(gridType);
  }

  /**
   * 获取当前活动的网格类型
   * @returns 活动的网格类型集合
   */
  public getActiveGridTypes(): Set<GridType> {
    return new Set(this.activeGridTypes);
  }

  /**
   * 获取网格配置
   * @returns 网格配置
   */
  public getConfig(): GridConfig {
    return { ...this.config };
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    // 移除事件监听器
    this.removeMoveEndListener();
    
    // 清除所有网格
    this.clearGeohashGrid();
    this.clearHexagonGrid();
    
    // 删除网格图层
    if (this.mapInstance && this.gridLayer) {
      this.mapInstance.removeLayer(this.gridLayer);
      this.gridLayer = null;
    }
    
    // 清除活动网格类型
    this.activeGridTypes.clear();
    
    this.log('debug', '网格对象已销毁');
  }

  /**
   * 输出日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[${LOG_MODULE}] ${message}`, data);
  }
} 