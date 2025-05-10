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
    buffer: number;          // 额外计算可视范围外的网格数量，默认4
    cacheSize: number;       // 缓存的网格数量，默认1000
    preloadDistance: number; // 预加载距离(视口宽度的百分比)，默认50%
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
    labelColor: '#003c88',
    buffer: 4,
    cacheSize: 1000,
    preloadDistance: 50
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

// 每个精度级别对应的图层ID映射表
const PRECISION_LAYER_MAP: Record<number, string> = {};

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
  // 是否已初始化图层
  private layerInitialized: boolean = false;
  
  // 地图移动开始监听器
  private moveStartListener: EventsKey | null = null;
  // 地图移动中监听器
  private movingListener: EventsKey | null = null;
  
  // 网格缓存
  private geohashCache: Map<string, Feature> = new Map();
  // 缓存命中次数统计
  private cacheHits: number = 0;
  // 缓存未命中次数统计
  private cacheMisses: number = 0;
  // 上次地图移动时间
  private lastMoveTime: number = 0;
  // 是否正在移动地图
  private isMoving: boolean = false;
  // 地图移动过程中需要刷新网格的队列
  private pendingRefresh: boolean = false;
  // 上次渲染的视口范围
  private lastViewExtent: number[] | null = null;
  // 上次使用的精度
  private lastPrecision: number = 0;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 网格配置（可选）
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<GridConfig>) {
    if (mapInstance) {
      this.log('info', '构造函数中设置地图实例...');
      this.setMapInstance(mapInstance);
    } else {
      this.log('warn', '构造函数中未提供地图实例！');
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
    
    // 检查地图是否已初始化
    if (!this.mapInstance.getTargetElement()) {
      this.log('warn', '地图尚未完全初始化，目标元素不存在');
      return;
    }
    
    // 检查地图图层是否可以访问
    const layers = this.mapInstance.getLayers();
    if (!layers) {
      this.log('error', '地图图层集合不可访问！');
      return;
    }
    
    this.log('info', `初始化网格系统，当前地图共有${layers.getLength()}个图层`);
    
    try {
      // 设置已初始化标志
      this.layerInitialized = true;
      
      // 移除所有可能存在的旧网格图层
      this.removeAllPrecisionLayers();
      
      // 添加地图移动事件监听
      this.setupMoveEndListener();
      
      this.log('debug', '网格系统已初始化');
    } catch (error) {
      this.log('error', '初始化网格系统失败', error);
    }
  }

  /**
   * 设置地图移动事件监听器
   */
  private setupMoveEndListener(): void {
    if (!this.mapInstance) return;
    
    // 移除现有的监听器
    this.removeMoveEndListener();
    
    // 添加地图移动开始监听器
    this.moveStartListener = this.mapInstance.on('movestart', () => {
      this.isMoving = true;
      this.lastMoveTime = Date.now();
      this.log('debug', `地图开始移动`);
    });
    
    // 添加地图移动中监听器
    this.movingListener = this.mapInstance.on('pointerdrag', () => {
      this.lastMoveTime = Date.now();
      
      // 如果有活动的网格，并且启用了预加载
      if (this.activeGridTypes.size > 0 && this.config.geohash.preloadDistance > 0) {
        // 标记需要刷新
        this.pendingRefresh = true;
        
        // 防止频繁刷新，使用节流模式，每200ms最多刷新一次
        if (!this.isMoving) {
          this.isMoving = true;
          setTimeout(() => this.handleMovingRefresh(), 200);
        }
      }
    });
    
    // 添加地图移动结束监听器
    this.moveEndListener = this.mapInstance.on('moveend', () => {
      // 标记地图停止移动
      this.isMoving = false;
      const moveEndTime = Date.now();
      const moveDuration = moveEndTime - this.lastMoveTime;
      
      this.log('debug', `地图移动结束，移动持续时间: ${moveDuration}ms`);
      
      // 标记不再需要预加载刷新
      this.pendingRefresh = false;
      
      // 只有在有活动网格类型时才更新网格
      if (this.activeGridTypes.size > 0) {
        // 如果移动时间很短，可能是轻微调整，延迟一下再刷新，避免频繁刷新
        if (moveDuration < 150) {
          setTimeout(() => this.refresh(), 100);
        } else {
          this.refresh();
        }
        
        // 输出缓存统计信息
        if (this.cacheHits > 0 || this.cacheMisses > 0) {
          this.log('debug', `网格缓存统计: 命中=${this.cacheHits}, 未命中=${this.cacheMisses}, 命中率=${Math.round(this.cacheHits / (this.cacheHits + this.cacheMisses) * 100)}%`);
        }
      }
    });
    
    this.log('debug', '地图移动事件监听器已设置');
  }

  /**
   * 处理地图移动中的网格刷新
   */
  private handleMovingRefresh(): void {
    // 如果不再需要刷新，或没有活动网格，则不处理
    if (!this.pendingRefresh || this.activeGridTypes.size === 0) {
      this.isMoving = false;
      return;
    }
    
    // 处理预加载
    if (this.activeGridTypes.has(GridType.GEOHASH)) {
      this.preloadGeohashGrid();
    }
    
    // 重置移动状态
    this.isMoving = false;
    
    // 如果仍然需要刷新，则再次设置计时器
    if (this.pendingRefresh) {
      setTimeout(() => this.handleMovingRefresh(), 200);
    }
  }

  /**
   * 预加载GeoHash网格
   * 在地图移动过程中提前加载即将进入视图的网格
   */
  private preloadGeohashGrid(): void {
    if (!this.mapInstance || !this.gridLayer) return;
    
    const view = this.mapInstance.getView();
    const extent = view.calculateExtent(this.mapInstance.getSize() || [0, 0]);
    
    // 如果视图范围与上次相同，不需要处理
    if (this.lastViewExtent && 
        this.lastViewExtent[0] === extent[0] &&
        this.lastViewExtent[1] === extent[1] &&
        this.lastViewExtent[2] === extent[2] &&
        this.lastViewExtent[3] === extent[3]) {
      return;
    }
    
    // 更新上次视图范围
    this.lastViewExtent = [...extent];
    
    // 获取当前可见的基础瓦片层和网格
    const baseTileLayer = this.getVisibleTileLayer();
    if (!baseTileLayer) return;
    
    // 获取瓦片图层的网格
    const tileGrid = this.getTileGrid(baseTileLayer);
    if (!tileGrid) return;
    
    // 获取当前缩放级别
    const zoom = Math.round(view.getZoom() || 0);
    
    // 如果与上次相同，不需要重新计算
    if (zoom === this.lastPrecision) return;
    
    // 更新上次精度
    this.lastPrecision = zoom;
    
    // 获取当前视图下的瓦片范围
    const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, zoom);
    if (!tileRange) return;
    
    // 根据预加载距离扩展瓦片范围
    const preloadFactor = this.config.geohash.preloadDistance / 100;
    const buffer = this.config.geohash.buffer || 4;
    
    // 计算视图宽度和高度，用于预加载
    const viewWidth = tileRange.maxX - tileRange.minX + 1;
    const viewHeight = tileRange.maxY - tileRange.minY + 1;
    
    // 扩展范围（基于预加载距离）
    const extendX = Math.ceil(viewWidth * preloadFactor);
    const extendY = Math.ceil(viewHeight * preloadFactor);
    
    // 获取移动方向
    const center = view.getCenter();
    const lastCenter = this.mapInstance.get('lastCenter');
    let moveDirectionX = 0;
    let moveDirectionY = 0;
    
    if (center && lastCenter) {
      moveDirectionX = center[0] > lastCenter[0] ? 1 : (center[0] < lastCenter[0] ? -1 : 0);
      moveDirectionY = center[1] > lastCenter[1] ? 1 : (center[1] < lastCenter[1] ? -1 : 0);
    }
    
    // 保存当前中心点
    this.mapInstance.set('lastCenter', center ? [...center] : null);
    
    // 基于移动方向优化预加载范围
    let preloadTileRange;
    
    if (moveDirectionX !== 0 || moveDirectionY !== 0) {
      // 有明确移动方向时，向移动方向适当扩展
      preloadTileRange = {
        minX: tileRange.minX - buffer - (moveDirectionX < 0 ? extendX : 0),
        minY: tileRange.minY - buffer - (moveDirectionY < 0 ? extendY : 0),
        maxX: tileRange.maxX + buffer + (moveDirectionX > 0 ? extendX : 0),
        maxY: tileRange.maxY + buffer + (moveDirectionY > 0 ? extendY : 0)
      };
    } else {
      // 没有明确移动方向时，均匀扩展
      preloadTileRange = {
        minX: tileRange.minX - buffer - Math.floor(extendX/2),
        minY: tileRange.minY - buffer - Math.floor(extendY/2),
        maxX: tileRange.maxX + buffer + Math.ceil(extendX/2),
        maxY: tileRange.maxY + buffer + Math.ceil(extendY/2)
      };
    }
    
    this.log('debug', `预加载瓦片范围: [${preloadTileRange.minX}, ${preloadTileRange.minY}, ${preloadTileRange.maxX}, ${preloadTileRange.maxY}]`);
    
    // 预加载瓦片网格
    const preloadTask = () => {
      try {
        this.renderTileBasedGeohashGrid(tileGrid, preloadTileRange, zoom, true);
      } catch (error) {
        this.log('error', '预加载网格失败', error);
      }
    };
    
    // 在低优先级任务中执行，避免阻塞主线程
    setTimeout(preloadTask, 0);
  }

  /**
   * 移除地图移动事件监听器
   */
  private removeMoveEndListener(): void {
    if (this.moveEndListener) {
      unByKey(this.moveEndListener);
      this.moveEndListener = null;
    }
    
    if (this.moveStartListener) {
      unByKey(this.moveStartListener);
      this.moveStartListener = null;
    }
    
    if (this.movingListener) {
      unByKey(this.movingListener);
      this.movingListener = null;
    }
  }

  /**
   * 启用指定类型的网格
   * @param gridType 网格类型
   */
  public enable(gridType: GridType): void {
    if (!this.mapInstance) {
      this.log('warn', `启用${gridType}网格失败: 地图实例不存在`);
      return;
    }
    
    // 如果网格类型已启用，不需要重复操作
    if (this.activeGridTypes.has(gridType)) {
      this.log('debug', `${gridType}网格已经处于启用状态`);
      return;
    }
    
    this.log('info', `正在启用${gridType}网格...`);
    
    // 将网格类型添加到活动集合
    this.activeGridTypes.add(gridType);
    
    // 生成并绘制相应类型的网格
    if (gridType === GridType.GEOHASH) {
      // 确保删除旧的网格图层，防止重叠问题
      this.removeAllPrecisionLayers();
      // 重新绘制
      this.renderGeohashGrid();
    } else if (gridType === GridType.HEXAGON) {
      this.clearHexagonGrid();
      this.renderHexagonGrid();
    }
    
    this.log('info', `${gridType}网格已启用，当前活动网格类型: ${Array.from(this.activeGridTypes).join(', ')}`);
  }

  /**
   * 禁用指定类型的网格
   * @param gridType 网格类型
   */
  public disable(gridType: GridType): void {
    if (!this.mapInstance) {
      this.log('warn', `禁用${gridType}网格失败: 地图实例不存在`);
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
      // 移除所有精度的网格图层
      this.removeAllPrecisionLayers();
      // 清空缓存和引用
      this.geohashCache.clear();
      this.geohashFeatures = [];
    } else if (gridType === GridType.HEXAGON) {
      this.clearHexagonGrid();
    }
    
    this.log('info', `${gridType}网格已禁用`);
  }

  /**
   * 清除GeoHash网格
   * @param forceCleanAll 是否强制清除所有网格（包括其他图层上的）
   */
  private clearGeohashGrid(forceCleanAll: boolean = true): void {
    if (!this.gridLayer || !this.gridLayer.getSource()) return;
    
    const source = this.gridLayer.getSource();
    
    if (forceCleanAll && this.mapInstance) {
      // 获取所有图层上所有类型为GEOHASH的特征并清除
      this.mapInstance.getLayers().forEach(baseLayer => {
        try {
          // 尝试获取图层的源
          // @ts-ignore 忽略类型检查，因为不同类型的图层可能有不同的接口
          const layerSource = baseLayer.getSource?.();
          if (layerSource && typeof layerSource.getFeatures === 'function') {
            const features = layerSource.getFeatures();
            
            // 筛选出GeoHash类型的特征并移除
            const geohashFeatures = features.filter(feature => 
              feature.get && feature.get('type') === GridType.GEOHASH
            );
            
            if (geohashFeatures.length > 0) {
              geohashFeatures.forEach(feature => {
                try {
                  layerSource.removeFeature(feature);
                } catch (e) {
                  // 忽略移除特征时的错误
                }
              });
              
              // @ts-ignore 忽略类型检查
              this.log('debug', `从图层[${baseLayer.get?.('title') || '未命名'}]清除了${geohashFeatures.length}个GeoHash网格`);
            }
          }
        } catch (error) {
          // 忽略图层处理错误
        }
      });
    }
    
    // 直接从特定图层源中查找和移除GeoHash特征
    const localFeatures = source.getFeatures();
    const geohashFeatures = localFeatures.filter(feature => 
      feature.get('type') === GridType.GEOHASH
    );
    
    // 移除所有GeoHash网格特征
    if (geohashFeatures.length > 0) {
      geohashFeatures.forEach(feature => {
        try {
          source.removeFeature(feature);
        } catch (e) {
          // 忽略移除特征时的错误
        }
      });
      
      this.log('debug', `从主网格图层清除了${geohashFeatures.length}个GeoHash网格单元`);
    }
    
    // 清空特征数组
    this.geohashFeatures = [];
    
    // 强制更新渲染
    if (this.mapInstance) {
      setTimeout(() => {
        this.mapInstance?.render();
        this.log('debug', '强制地图重新渲染');
      }, 0);
    }
  }

  /**
   * 检测并处理网格重叠问题
   * 移除在同一区域的不同精度的网格，保留当前精度的网格
   * @param precision 当前精度
   * @private
   */
  private handleGridOverlap(precision: number): void {
    if (!this.gridLayer || !this.gridLayer.getSource()) return;
    
    const source = this.gridLayer.getSource();
    const allFeatures = source.getFeatures();
    
    // 完全清除所有网格，确保没有残留
    const geohashFeatures = allFeatures.filter(feature => 
      feature.get('type') === GridType.GEOHASH
    );
    
    if (geohashFeatures.length > 0) {
      // 移除所有GeoHash网格特征
      geohashFeatures.forEach(feature => {
        const featurePrecision = feature.get('precision');
        // 如果精度不匹配当前精度，或者没有精度信息，则移除
        if (featurePrecision !== precision) {
          source.removeFeature(feature);
        }
      });
      
      this.log('debug', `处理网格重叠：移除了${geohashFeatures.length}个网格中不匹配当前精度(${precision})的网格`);
    }
    
    // 强制更新地图渲染
    if (this.mapInstance) {
      this.mapInstance.updateSize();
    }
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
    if (!this.mapInstance) return;
    
    this.log('info', '开始刷新网格...');
    
    // 清理所有网格和缓存
    this.removeAllPrecisionLayers();
    this.geohashCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // 清空特征数组
    this.geohashFeatures = [];
    this.hexagonFeatures = [];
    
    // 刷新启用的网格类型
    if (this.activeGridTypes.has(GridType.GEOHASH)) {
      this.renderGeohashGrid();
    }
    
    if (this.activeGridTypes.has(GridType.HEXAGON)) {
      this.renderHexagonGrid();
    }
    
    // 强制重新渲染地图
    this.mapInstance.render();
    
    this.log('info', '网格刷新完成');
  }

  /**
   * 渲染GeoHash网格
   */
  private renderGeohashGrid(): void {
    if (!this.mapInstance) {
      this.log('error', '渲染GeoHash网格失败: 地图实例不存在');
      return;
    }
    
    this.log('info', '开始渲染GeoHash网格（基于瓦片）...');
    
    // 获取当前地图视图
    const view = this.mapInstance.getView();
    const zoom = view.getZoom() || 0;
    const extent = view.calculateExtent(this.mapInstance.getSize() || [0, 0]);
    
    // 打印视图信息
    this.log('debug', `当前视图: 缩放级别=${zoom}, 范围=[${extent.join(', ')}]`);
    
    try {
      // 获取当前可见的基础瓦片层
      const baseTileLayer = this.getVisibleTileLayer();
      if (!baseTileLayer) {
        this.log('warn', '无法获取基础瓦片图层，使用默认网格计算方式');
        this.renderDefaultGeohashGrid();
        return;
      }
      
      // 获取瓦片图层的网格
      const tileGrid = this.getTileGrid(baseTileLayer);
      if (!tileGrid) {
        this.log('warn', '无法获取瓦片网格，使用默认网格计算方式');
        this.renderDefaultGeohashGrid();
        return;
      }
      
      // 获取当前视图下的瓦片范围
      const z = Math.round(zoom);
      const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
      if (!tileRange) {
        this.log('warn', '无法计算当前视图的瓦片范围，使用默认网格计算方式');
        this.renderDefaultGeohashGrid();
        return;
      }
      
      this.log('debug', `当前视图瓦片范围: minX=${tileRange.minX}, minY=${tileRange.minY}, maxX=${tileRange.maxX}, maxY=${tileRange.maxY}, z=${z}`);
      
      // 计算并绘制基于瓦片的GeoHash网格
      this.renderTileBasedGeohashGrid(tileGrid, tileRange, z);
    } catch (error) {
      this.log('error', '基于瓦片的GeoHash网格渲染失败', error);
      // 降级到默认的渲染方式
      this.renderDefaultGeohashGrid();
    }
  }

  /**
   * 获取地图中可见的瓦片图层
   * @returns 瓦片图层，如果没找到则返回null
   */
  private getVisibleTileLayer(): any {
    if (!this.mapInstance) return null;
    
    let tileLayer = null;
    
    // 遍历地图所有图层
    this.mapInstance.getLayers().forEach(layer => {
      // 检查图层是否可见
      if (layer.getVisible()) {
        // 检查是否是瓦片图层 
        // @ts-ignore
        const source = layer.getSource();
        if (source && typeof source.getTileGrid === 'function') {
          // 找到第一个可见的瓦片图层
          if (!tileLayer) {
            tileLayer = layer;
            this.log('debug', '找到可见瓦片图层:', layer.get('title') || '未命名图层');
          }
        }
      }
    });
    
    if (!tileLayer) {
      this.log('debug', '未找到可见瓦片图层');
    }
    
    return tileLayer;
  }

  /**
   * 获取图层的瓦片网格
   * @param layer 瓦片图层
   * @returns 瓦片网格，如果没有则返回null
   */
  private getTileGrid(layer: any): any {
    if (!layer) return null;
    
    try {
      const source = layer.getSource();
      if (source && typeof source.getTileGrid === 'function') {
        const tileGrid = source.getTileGrid();
        if (tileGrid) {
          this.log('debug', '成功获取瓦片网格');
          return tileGrid;
        }
      }
    } catch (error) {
      this.log('error', '获取瓦片网格失败', error);
    }
    
    return null;
  }

  /**
   * 使用默认方式渲染GeoHash网格（原有实现，作为降级方案）
   */
  private renderDefaultGeohashGrid(): void {
    // 获取当前地图视图
    const view = this.mapInstance?.getView();
    if (!view) return;
    
    const zoom = view.getZoom() || 0;
    const extent = view.calculateExtent(this.mapInstance?.getSize() || [0, 0]);
    
    // 转换为经纬度坐标
    const bottomLeft = toLonLat([extent[0], extent[1]]);
    const topRight = toLonLat([extent[2], extent[3]]);
    
    // 计算视图中心
    const center = view.getCenter();
    if (!center) {
      this.log('error', '无法获取地图中心点');
      return;
    }
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
    
    // 更新当前缩放级别
    this.lastPrecision = Math.round(zoom);
    
    this.log('debug', `使用默认渲染方式，缩放级别: ${zoom}, 设置GeoHash精度: ${precision}`);
    
    try {
      // 生成视图范围内的GeoHash网格
      const geohashes = this.generateGeohashGrid(bottomLeft, topRight, precision, centerLonLat);
      this.renderGeohashFeatures(geohashes, precision);
    } catch (error) {
      this.log('error', '默认GeoHash网格渲染失败', error);
    }
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
    
    // 获取buffer配置
    const buffer = this.config.geohash.buffer || 2;
    
    // 扩展视图范围（添加额外buffer个网格单元的边距）
    const extendedMinLng = bottomLeft[0] - buffer * gridInfo.lngWidth;
    const extendedMinLat = bottomLeft[1] - buffer * gridInfo.latHeight;
    const extendedMaxLng = topRight[0] + buffer * gridInfo.lngWidth;
    const extendedMaxLat = topRight[1] + buffer * gridInfo.latHeight;
    
    this.log('debug', `使用buffer=${buffer}扩展视图范围: [${extendedMinLng}, ${extendedMinLat}, ${extendedMaxLng}, ${extendedMaxLat}]`);
    
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

  /**
   * 基于瓦片渲染GeoHash网格
   * @param tileGrid 瓦片网格
   * @param tileRange 瓦片范围
   * @param z 缩放级别
   * @param isPreload 是否为预加载操作
   */
  private renderTileBasedGeohashGrid(tileGrid: any, tileRange: any, z: number, isPreload: boolean = false): void {
    if (!this.mapInstance) return;
    
    // 根据缩放级别确定合适的GeoHash精度
    let precision = this.config.geohash.precision;
    if (z < 5) precision = 2;
    else if (z < 7) precision = 3;
    else if (z < 9) precision = 4;
    else if (z < 11) precision = 5;
    else if (z < 13) precision = 6;
    else if (z < 15) precision = 7;
    else precision = 8;
    
    // 获取或创建该精度专用的图层
    const precisionLayer = this.getOrCreatePrecisionLayer(precision);
    if (!precisionLayer) {
      this.log('error', `无法为精度${precision}创建图层，渲染失败`);
      return;
    }
    
    const source = precisionLayer.getSource();
    if (!source) return;
    
    // 如果不是预加载操作或缩放级别变化，执行彻底清理
    if (!isPreload || this.lastPrecision !== z) {
      if (this.lastPrecision !== z) {
        // 如果缩放级别变化，清空缓存
        this.geohashCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.log('debug', `缩放级别改变（${this.lastPrecision} -> ${z}），清空网格缓存`);
        // 更新缩放级别
        this.lastPrecision = z;
      }
      
      // 如果不是预加载操作，清除当前图层上的内容
      if (!isPreload) {
        source.clear();
        this.log('debug', `清除了精度${precision}图层上的所有特征`);
        this.geohashFeatures = [];
      }
    }
    
    this.log('debug', `基于瓦片渲染GeoHash网格到精度${precision}图层，缩放级别: ${z}, buffer: ${this.config.geohash.buffer || 4}, 预加载: ${isPreload}`);
    
    const features: Feature[] = [];
    const strokeColor = this.config.geohash.strokeColor;
    const strokeWidth = this.config.geohash.strokeWidth;
    const fillColor = this.config.geohash.fillColor;
    const showLabels = this.config.geohash.showLabels;
    const labelColor = this.config.geohash.labelColor;
    const buffer = this.config.geohash.buffer || 4;
    const cacheSize = this.config.geohash.cacheSize || 1000;
    
    // 跟踪当前请求中的网格坐标，用于后续清理
    const currentTileKeys = new Set<string>();
    
    // 统计新创建的特征数
    let newFeaturesCount = 0;
    
    // 遍历瓦片范围内的所有瓦片（包括buffer区域）
    for (let x = tileRange.minX; x <= tileRange.maxX; x++) {
      for (let y = tileRange.minY; y <= tileRange.maxY; y++) {
        // 生成瓦片坐标的唯一键
        const tileKey = `${z}_${x}_${y}`;
        
        // 添加到当前处理的瓦片键集合
        currentTileKeys.add(tileKey);
        
        // 检查缓存中是否已存在该瓦片
        if (this.geohashCache.has(tileKey)) {
          const cachedFeature = this.geohashCache.get(tileKey);
          
          // 验证缓存特征的精度是否与当前精度匹配
          const featurePrecision = cachedFeature?.get('precision');
          if (featurePrecision !== precision) {
            // 如果精度不匹配，则移除缓存
            this.geohashCache.delete(tileKey);
          } else if (cachedFeature && source.hasFeature(cachedFeature)) {
            // 特征已在图层中且精度匹配，记录命中并继续
            this.cacheHits++;
            features.push(cachedFeature);
            continue;
          } else if (cachedFeature) {
            // 特征存在于缓存但不在图层中，且精度匹配，添加到图层
            this.cacheHits++;
            source.addFeature(cachedFeature);
            features.push(cachedFeature);
            continue;
          }
        }
        
        this.cacheMisses++;
        
        try {
          // 获取瓦片的范围
          const tileExtent = tileGrid.getTileCoordExtent([z, x, y]);
          
          // 转换瓦片四个角的坐标到经纬度
          const bottomLeft = toLonLat([tileExtent[0], tileExtent[1]]);
          const topLeft = toLonLat([tileExtent[0], tileExtent[3]]);
          const topRight = toLonLat([tileExtent[2], tileExtent[3]]);
          const bottomRight = toLonLat([tileExtent[2], tileExtent[1]]);
          
          // 计算瓦片中心点
          const centerLng = (bottomLeft[0] + topRight[0]) / 2;
          const centerLat = (bottomLeft[1] + topRight[1]) / 2;
          
          // 使用中心点计算GeoHash编码
          const hash = this.encodeGeoHash(centerLat, centerLng, precision);
          
          // 获取精确的GeoHash边界
          const geohashBounds = this.decodeGeoHashBounds(hash);
          
          // 使用瓦片的实际边界来创建多边形，而不是GeoHash的理论边界
          // 这确保GeoHash网格与底图瓦片完全对齐
          const coordinates = [
            fromLonLat(bottomLeft),
            fromLonLat(topLeft),
            fromLonLat(topRight),
            fromLonLat(bottomRight),
            fromLonLat(bottomLeft) // 闭合多边形
          ];
          
          // 创建多边形特征
          const feature = new Feature({
            geometry: new Polygon([coordinates]),
            hash,
            type: GridType.GEOHASH,
            dataType: DataType.GRID,
            precision,
            zLevel: z,
            tileCoord: [z, x, y],
            tileKey,
            zIndex: isPreload ? 1 : 2 // 预加载的网格层级更低
          });
          
          // 设置样式
          const style = new Style({
            stroke: new Stroke({
              color: strokeColor,
              width: strokeWidth
            }),
            fill: new Fill({
              color: fillColor
            }),
            zIndex: isPreload ? 1 : 2
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
              font: `${Math.max(10, 14 - (8 - precision))}px sans-serif`,
              overflow: true
            }));
          }
          
          feature.setStyle(style);
          
          // 添加到缓存
          this.geohashCache.set(tileKey, feature);
          
          // 添加到图层
          source.addFeature(feature);
          features.push(feature);
          newFeaturesCount++;
        } catch (error) {
          this.log('error', `渲染瓦片(${z},${x},${y})失败:`, error);
        }
      }
    }
    
    // 清理不再可见的网格（仅当不是预加载操作时）
    if (!isPreload && this.geohashFeatures.length > 0) {
      // 移除不在当前视图范围内的网格
      const featuresToRemove = this.geohashFeatures.filter(feature => {
        const tileKey = feature.get('tileKey');
        const featurePrecision = feature.get('precision');
        // 移除不在当前瓦片范围内的网格和精度不匹配的网格
        return (tileKey && !currentTileKeys.has(tileKey)) || featurePrecision !== precision;
      });
      
      if (featuresToRemove.length > 0) {
        featuresToRemove.forEach(feature => {
          source.removeFeature(feature);
        });
        this.log('debug', `清理了${featuresToRemove.length}个不在当前视图范围或精度不匹配的网格`);
      }
    }
    
    // 清理缓存，如果超出最大缓存大小
    if (this.geohashCache.size > cacheSize) {
      this.cleanupCache(cacheSize);
    }
    
    // 如果是预加载操作，不需要保存特征引用
    if (!isPreload) {
      // 保存特征引用
      this.geohashFeatures = features;
      
      // 强制重新渲染地图
      this.mapInstance.render();
    }
    
    // 只有在非预加载模式下或创建了新特征时才记录
    if (!isPreload || newFeaturesCount > 0) {
      this.log('info', `已渲染${features.length}个基于瓦片的GeoHash网格单元（精度${precision}，buffer=${buffer}，预加载=${isPreload}），新创建${newFeaturesCount}个`);
    }
  }

  /**
   * 清理缓存
   * @param targetSize 目标缓存大小
   */
  private cleanupCache(targetSize: number): void {
    if (this.geohashCache.size <= targetSize) return;
    
    this.log('debug', `缓存大小(${this.geohashCache.size})超过限制(${targetSize})，开始清理...`);
    
    // 缓存清理策略：删除超出部分的条目
    const entriesToRemove = this.geohashCache.size - targetSize;
    
    // 获取当前缩放级别下的键和其他缩放级别的键
    const currentZoom = this.lastPrecision;
    const currentKeys: string[] = [];
    const otherKeys: string[] = [];
    
    // 分类缓存键
    this.geohashCache.forEach((value, key) => {
      // 键的格式为 "z_x_y"，第一个数字是缩放级别
      const parts = key.split('_');
      const keyZoom = parseInt(parts[0], 10);
      
      if (keyZoom === currentZoom) {
        currentKeys.push(key);
      } else {
        otherKeys.push(key);
      }
    });
    
    // 先删除其他缩放级别的缓存
    let removed = 0;
    while (removed < entriesToRemove && otherKeys.length > 0) {
      const key = otherKeys.shift();
      if (key) {
        this.geohashCache.delete(key);
        removed++;
      }
    }
    
    // 如果还需要删除更多，从当前缩放级别的缓存中删除
    while (removed < entriesToRemove && currentKeys.length > 0) {
      const key = currentKeys.shift();
      if (key) {
        this.geohashCache.delete(key);
        removed++;
      }
    }
    
    this.log('debug', `缓存清理：移除了${removed}个条目，当前缓存大小: ${this.geohashCache.size}`);
  }

  /**
   * 渲染GeoHash特征
   * @param geohashes GeoHash网格数组
   * @param precision GeoHash精度
   */
  private renderGeohashFeatures(geohashes: Array<{hash: string, bounds: {minLat: number, maxLat: number, minLng: number, maxLng: number}}>, precision: number): void {
    if (!this.mapInstance) return;
    
    // 获取或创建该精度专用的图层
    const precisionLayer = this.getOrCreatePrecisionLayer(precision);
    if (!precisionLayer) {
      this.log('error', `无法为精度${precision}创建图层，渲染失败`);
      return;
    }
    
    const source = precisionLayer.getSource();
    if (!source) return;
    
    // 清除当前图层上的内容
    source.clear();
    
    const strokeColor = this.config.geohash.strokeColor;
    const strokeWidth = this.config.geohash.strokeWidth;
    const fillColor = this.config.geohash.fillColor;
    const showLabels = this.config.geohash.showLabels;
    const labelColor = this.config.geohash.labelColor;
    const buffer = this.config.geohash.buffer || 4;
    
    const features: Feature[] = [];
    
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
        precision,
        zLevel: precision
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
          font: `${Math.max(10, 14 - (8 - precision))}px sans-serif`,
          overflow: true
        }));
      }
      
      feature.setStyle(style);
      source.addFeature(feature);
      features.push(feature);
    });
    
    // 保存特征引用
    this.geohashFeatures = features;
    
    this.log('info', `已渲染${features.length}个基于默认方法的GeoHash网格单元（精度${precision}，buffer=${buffer}）到专用图层`);
  }

  /**
   * 获取或创建特定精度的网格图层
   * @param precision 网格精度
   * @returns 该精度对应的网格图层
   */
  private getOrCreatePrecisionLayer(precision: number): VectorLayer<VectorSource> | null {
    if (!this.mapInstance) {
      this.log('error', `创建精度${precision}图层失败: 地图实例不存在`);
      return null;
    }
    
    // 生成该精度的图层ID
    const layerId = `geohash_grid_p${precision}`;
    
    // 检查是否已存在该精度的图层
    let precisionLayer: VectorLayer<VectorSource> | null = null;
    
    // 遍历所有图层查找
    this.mapInstance.getLayers().forEach(layer => {
      // @ts-ignore
      if (layer.get && layer.get('id') === layerId) {
        // @ts-ignore
        precisionLayer = layer;
      }
    });
    
    // 如果图层不存在，创建新图层
    if (!precisionLayer) {
      this.log('debug', `为精度${precision}创建新的网格图层`);
      
      // 创建新图层
      precisionLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 15 + precision, // 不同精度有不同的z-index，确保不会重叠
        properties: {
          title: `网格图层(精度${precision})`,
          type: 'grid',
          precision: precision,
          id: layerId
        }
      });
      
      // 添加到地图
      this.mapInstance.addLayer(precisionLayer);
      
      // 记录到精度图层映射
      PRECISION_LAYER_MAP[precision] = layerId;
      
      this.log('info', `精度${precision}的网格图层已创建`);
    }
    
    return precisionLayer;
  }
  
  /**
   * 获取特定精度的网格图层
   * @param precision 网格精度
   * @returns 对应的图层，如果不存在则返回null
   */
  private getPrecisionLayer(precision: number): VectorLayer<VectorSource> | null {
    if (!this.mapInstance) return null;
    
    const layerId = `geohash_grid_p${precision}`;
    let precisionLayer: VectorLayer<VectorSource> | null = null;
    
    this.mapInstance.getLayers().forEach(layer => {
      // @ts-ignore
      if (layer.get && layer.get('id') === layerId) {
        // @ts-ignore
        precisionLayer = layer;
      }
    });
    
    return precisionLayer;
  }
  
  /**
   * 删除所有精度的网格图层
   */
  private removeAllPrecisionLayers(): void {
    if (!this.mapInstance) return;
    
    // 遍历所有图层查找并移除网格图层
    const layersToRemove: any[] = [];
    
    this.mapInstance.getLayers().forEach(layer => {
      // @ts-ignore
      const layerType = layer.get && layer.get('type');
      if (layerType === 'grid') {
        layersToRemove.push(layer);
      }
    });
    
    // 移除收集到的图层
    layersToRemove.forEach(layer => {
      this.mapInstance?.removeLayer(layer);
    });
    
    // 清空记录
    for (const key in PRECISION_LAYER_MAP) {
      delete PRECISION_LAYER_MAP[key];
    }
    
    this.log('info', `已移除${layersToRemove.length}个网格图层`);
  }
} 