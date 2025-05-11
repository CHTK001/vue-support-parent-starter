/**
 * 蜂窝网格对象
 * @description 管理地图上的蜂窝网格
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

// 网格模块的日志前缀
const LOG_MODULE = 'HexagonGrid';

// 蜂窝网格配置接口
export interface HexagonGridConfig {
  radius: number;          // 蜂窝网格半径(米)
  strokeColor: string;     // 边框颜色
  strokeWidth: number;     // 边框宽度
  fillColor: string;       // 填充颜色
  showLabels: boolean;     // 是否显示标签
  labelColor: string;      // 标签颜色
  zIndex?: number;         // 图层渲染的Z索引，默认按加载顺序叠加
  opacity?: number;        // 透明度，默认为1
}

// 默认网格配置
const DEFAULT_HEXAGON_CONFIG: HexagonGridConfig = {
  radius: 1000,  // 1公里半径
  strokeColor: 'rgba(255, 99, 71, 0.8)',
  strokeWidth: 1,
  fillColor: 'rgba(255, 99, 71, 0.2)',
  showLabels: true,
  labelColor: '#ff6347',
  zIndex: 1,
  opacity: 1
};

/**
 * 蜂窝网格对象类
 */
export class HexagonGridObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 网格图层
  private gridLayer: VectorLayer<VectorSource> | null = null;
  // 网格配置
  private config: HexagonGridConfig = DEFAULT_HEXAGON_CONFIG;
  // 是否可见
  private visible: boolean = false;
  // 地图移动结束监听器
  private moveEndListener: EventsKey | null = null;
  // 上次渲染的视口范围
  private lastViewExtent: number[] | null = null;
  // 当前视图的蜂窝网格特征
  private hexagonFeatures: Feature[] = [];

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<HexagonGridConfig>) {
    if (mapInstance) {
      this.log('info', '构造函数中设置地图实例...');
      this.setMapInstance(mapInstance);
    } else {
      this.log('warn', '构造函数中未提供地图实例！');
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    this.log('debug', '蜂窝网格对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.log('info', '设置地图实例...');
    
    // 检查地图实例是否有效
    if (!mapInstance) {
      this.log('error', '提供的地图实例无效！');
      return;
    }
    
    this.mapInstance = mapInstance;
    
    // 获取地图大小，确保地图已经正确初始化
    const mapSize = mapInstance.getSize();
    if (!mapSize || mapSize[0] === 0 || mapSize[1] === 0) {
      this.log('warn', '地图尚未完全渲染，大小:', mapSize);
    } else {
      this.log('debug', '地图尺寸正常:', mapSize);
    }
    
    // 尝试获取地图视图
    const view = mapInstance.getView();
    if (!view) {
      this.log('error', '地图视图不可用！');
      return;
    }
    
    this.log('info', '地图中心点:', view.getCenter());
    this.log('info', '地图缩放级别:', view.getZoom());
    
    // 初始化网格图层
    this.initLayer();
    
    this.log('debug', '地图实例已设置');
  }

  /**
   * 设置网格配置
   * @param config 网格配置
   */
  public setConfig(config: Partial<HexagonGridConfig>): void {
    this.config = {
      ...DEFAULT_HEXAGON_CONFIG,
      ...config
    };
    
    // 如果是可见状态，重新绘制
    if (this.visible) {
      this.refresh();
    }
    
    this.log('debug', '网格配置已更新');
  }

  /**
   * 初始化网格图层
   * @private
   */
  private initLayer(): void {
    if (!this.mapInstance) {
      this.log('error', '无法初始化图层：地图实例不可用');
      return;
    }
    
    try {
      // 创建矢量图层
      this.gridLayer = new VectorLayer<VectorSource>({
        source: new VectorSource(),
        zIndex: this.config.zIndex,
        opacity: this.config.opacity,
        visible: false // 默认不可见，等待启用
      });
      
      // 添加图层到地图
      this.mapInstance.addLayer(this.gridLayer);
      
      // 设置移动结束监听器
      this.setupMoveEndListener();
      
      this.log('info', '网格图层初始化完成');
    } catch (error) {
      this.log('error', '初始化网格图层失败:', error);
    }
  }

  /**
   * 设置地图移动结束监听器
   * @private
   */
  private setupMoveEndListener(): void {
    if (!this.mapInstance) return;
    
    // 移除可能存在的旧监听器
    this.removeMoveEndListener();
    
    // 添加新的监听器
    this.moveEndListener = this.mapInstance.on('moveend', () => {
      if (this.visible) {
        this.updateHexagonGrid();
      }
    });
    
    this.log('debug', '已设置地图移动结束监听器');
  }

  /**
   * 移除地图移动结束监听器
   * @private
   */
  private removeMoveEndListener(): void {
    if (this.moveEndListener) {
      unByKey(this.moveEndListener);
      this.moveEndListener = null;
      this.log('debug', '已移除地图移动结束监听器');
    }
  }

  /**
   * 更新蜂窝网格
   * @private
   */
  private updateHexagonGrid(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    // 获取当前视图范围
    const extent = this.mapInstance.getView().calculateExtent(this.mapInstance.getSize() || [0, 0]);
    
    // 如果视图范围与上次相同，不需要更新
    if (this.lastViewExtent && 
        this.lastViewExtent[0] === extent[0] &&
        this.lastViewExtent[1] === extent[1] &&
        this.lastViewExtent[2] === extent[2] &&
        this.lastViewExtent[3] === extent[3]) {
      return;
    }
    
    // 更新上次视图范围
    this.lastViewExtent = [...extent];
    
    // 清除当前特征
    this.hexagonFeatures = [];
    const source = this.gridLayer.getSource();
    source.clear();
    
    // 转换为经纬度坐标
    const bottomLeft = toLonLat([extent[0], extent[1]]);
    const topRight = toLonLat([extent[2], extent[3]]);
    
    // 确定合适的蜂窝网格半径（根据地图缩放级别）
    const zoom = this.mapInstance.getView().getZoom() || 0;
    let radius = this.config.radius;
    
    // 根据缩放级别动态调整半径
    if (zoom < 5) radius = 50000; // 50公里
    else if (zoom < 8) radius = 10000; // 10公里
    else if (zoom < 12) radius = 2000; // 2公里
    else radius = 500; // 500米
    
    // 生成蜂窝网格
    const hexagons = this.generateHexagonGrid(bottomLeft, topRight, radius);
    
    // 渲染蜂窝网格
    for (const hexagon of hexagons) {
      this.renderHexagon(hexagon, source);
    }
    
    this.log('debug', `已更新蜂窝网格，共${hexagons.length}个单元格`);
  }

  /**
   * 渲染单个蜂窝
   * @param hexagon 蜂窝数据
   * @param source 矢量源
   */
  private renderHexagon(hexagon: {id: string, coordinates: number[][]}, source: VectorSource): void {
    // 创建多边形特征
    const feature = new Feature({
      geometry: new Polygon([hexagon.coordinates.map(coord => fromLonLat(coord))]),
      id: hexagon.id,
      type: 'hexagon',
      dataType: DataType.GRID
    });
    
    // 设置样式
    feature.setStyle(new Style({
      fill: new Fill({
        color: this.config.fillColor
      }),
      stroke: new Stroke({
        color: this.config.strokeColor,
        width: this.config.strokeWidth
      }),
      // 如果需要显示标签
      text: this.config.showLabels ? new Text({
        text: hexagon.id.substring(0, 8),
        fill: new Fill({
          color: this.config.labelColor
        }),
        stroke: new Stroke({
          color: 'rgba(255,255,255,0.8)',
          width: 3
        }),
        font: '12px Calibri,sans-serif'
      }) : undefined
    }));
    
    // 添加到源
    source.addFeature(feature);
    
    // 保存特征引用
    this.hexagonFeatures.push(feature);
  }

  /**
   * 生成蜂窝网格
   * @param bottomLeft 左下角坐标 [lng, lat]
   * @param topRight 右上角坐标 [lng, lat]
   * @param radius 半径（米）
   * @returns 蜂窝网格数组
   */
  private generateHexagonGrid(bottomLeft: number[], topRight: number[], radius: number): Array<{id: string, coordinates: number[][]}> {
    const hexagons: Array<{id: string, coordinates: number[][]}> = [];
    
    // 计算六边形的高度和宽度（经纬度近似值）
    // 地球周长约40075km，360度对应这个距离
    const metersPerDegree = 40075000 / 360;
    
    // 六边形高度（从顶点到对面顶点的垂直距离）
    const hexHeight = radius * 2;
    // 六边形宽度（从边到对面边的水平距离）
    const hexWidth = radius * Math.sqrt(3);
    
    // 转换为经纬度单位
    const latHeight = hexHeight / (metersPerDegree * Math.cos(bottomLeft[1] * Math.PI / 180));
    const lngWidth = hexWidth / metersPerDegree;
    
    // 计算网格范围
    const minLat = bottomLeft[1];
    const maxLat = topRight[1];
    const minLng = bottomLeft[0];
    const maxLng = topRight[0];
    
    // 计算起始点（偏移以对齐网格）
    const startLat = minLat - (minLat % (latHeight * 0.75));
    const startLng = minLng - (minLng % lngWidth);
    
    // 行和列的数量
    const numRows = Math.ceil((maxLat - startLat) / (latHeight * 0.75)) + 1;
    const numCols = Math.ceil((maxLng - startLng) / lngWidth) + 1;
    
    // 生成六边形网格
    for (let row = 0; row < numRows; row++) {
      const rowOffset = row % 2 === 0 ? 0 : lngWidth / 2;
      
      for (let col = 0; col < numCols; col++) {
        // 计算中心点
        const centerLat = startLat + row * latHeight * 0.75;
        const centerLng = startLng + col * lngWidth + rowOffset;
        
        // 生成六边形ID（使用中心点坐标）
        const id = `hex_${centerLat.toFixed(6)}_${centerLng.toFixed(6)}`;
        
        // 生成六边形顶点坐标
        const coordinates = this.generateHexagonVertices(centerLat, centerLng, latHeight / 2, lngWidth / 2);
        
        // 添加到结果
        hexagons.push({id, coordinates});
      }
    }
    
    return hexagons;
  }

  /**
   * 生成六边形顶点坐标
   * @param centerLat 中心纬度
   * @param centerLng 中心经度
   * @param latRadius 纬度半径
   * @param lngRadius 经度半径
   * @returns 顶点坐标数组
   */
  private generateHexagonVertices(centerLat: number, centerLng: number, latRadius: number, lngRadius: number): number[][] {
    const vertices: number[][] = [];
    
    // 六边形的六个顶点
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const lng = centerLng + lngRadius * Math.cos(angle);
      const lat = centerLat + latRadius * Math.sin(angle);
      vertices.push([lng, lat]);
    }
    
    // 闭合多边形
    vertices.push(vertices[0]);
    
    return vertices;
  }

  /**
   * 启用网格
   */
  public enable(): void {
    if (this.visible) return;
    
    if (this.gridLayer) {
      this.gridLayer.setVisible(true);
    }
    
    this.visible = true;
    
    // 更新网格
    this.updateHexagonGrid();
    
    this.log('info', '蜂窝网格已启用');
  }

  /**
   * 禁用网格
   */
  public disable(): void {
    if (!this.visible) return;
    
    if (this.gridLayer) {
      this.gridLayer.setVisible(false);
    }
    
    this.visible = false;
    
    this.log('info', '蜂窝网格已禁用');
  }

  /**
   * 刷新网格
   */
  public refresh(): void {
    if (!this.visible) return;
    
    // 清除上次视图范围记录，强制更新
    this.lastViewExtent = null;
    
    // 更新网格
    this.updateHexagonGrid();
    
    this.log('info', '蜂窝网格已刷新');
  }

  /**
   * 获取是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.visible;
  }

  /**
   * 获取配置
   * @returns 网格配置
   */
  public getConfig(): HexagonGridConfig {
    return this.config;
  }

  /**
   * 设置半径
   * @param radius 半径值（米）
   */
  public setRadius(radius: number): void {
    if (radius <= 0) {
      this.log('warn', '无效的蜂窝网格半径，必须大于0');
      return;
    }
    
    this.config.radius = radius;
    
    // 如果是可见状态，刷新网格
    if (this.visible) {
      this.refresh();
    }
    
    this.log('info', `蜂窝网格半径已更新为: ${radius}米`);
  }

  /**
   * 设置透明度
   * @param opacity 透明度值
   */
  public setOpacity(opacity: number): void {
    this.config.opacity = opacity;
    
    // 应用到图层
    if (this.gridLayer) {
      this.gridLayer.setOpacity(opacity);
    }
    
    this.log('info', `蜂窝网格透明度已更新为: ${opacity}`);
  }

  /**
   * 设置Z索引
   * @param zIndex Z索引值
   */
  public setZIndex(zIndex: number): void {
    this.config.zIndex = zIndex;
    
    // 应用到图层
    if (this.gridLayer) {
      this.gridLayer.setZIndex(zIndex);
    }
    
    this.log('info', `蜂窝网格Z索引已更新为: ${zIndex}`);
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.log('info', '销毁蜂窝网格对象...');
    
    // 移除事件监听器
    this.removeMoveEndListener();
    
    // 从地图上移除图层
    if (this.mapInstance && this.gridLayer) {
      this.mapInstance.removeLayer(this.gridLayer);
    }
    
    // 清除引用
    this.gridLayer = null;
    this.mapInstance = null;
    this.moveEndListener = null;
    this.hexagonFeatures = [];
    
    this.log('info', '蜂窝网格对象已销毁');
  }

  /**
   * 日志记录
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (data) {
      logger[level](`[${LOG_MODULE}] ${message}`, data);
    } else {
      logger[level](`[${LOG_MODULE}] ${message}`);
    }
  }
} 