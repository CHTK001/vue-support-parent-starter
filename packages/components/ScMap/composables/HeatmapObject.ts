/**
 * 热力图对象
 * @description 管理地图热力图显示
 */
import { Map as OlMap } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Heatmap from 'ol/layer/Heatmap';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import { EventsKey } from 'ol/events';
import logger from './LogObject';
import { HeatmapPoint, HeatmapConfig, DEFAULT_HEATMAP_CONFIG } from '../types/heatmap';

// 热力图数据点接口和配置接口已移至 ../types/heatmap 文件

/**
 * 热力图类
 */
export class HeatmapObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 热力图层
  private heatmapLayer: Heatmap | null = null;
  // 数据点图层
  private pointsLayer: VectorLayer<VectorSource> | null = null;
  // 数据源
  private source: VectorSource | null = null;
  // 配置
  private config: HeatmapConfig = DEFAULT_HEATMAP_CONFIG;
  // 当前数据点
  private points: Map<string, HeatmapPoint> = new Map();
  // 激活状态
  private active: boolean = false;
  // 事件监听器
  private eventListeners: EventsKey[] = [];

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 配置参数
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<HeatmapConfig>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }

    if (config) {
      this.setConfig(config);
    }

    logger.debug('[Heatmap] 热力图对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    if (!mapInstance) {
      logger.error('[Heatmap] 无效的地图实例');
      return;
    }

    this.mapInstance = mapInstance;
    this.initLayers();
    this.setupMapListeners();
    logger.debug('[Heatmap] 地图实例已设置');
  }

  /**
   * 初始化图层
   * @private
   */
  private initLayers(): void {
    if (!this.mapInstance) {
      logger.error('[Heatmap] 无法初始化图层：地图实例不可用');
      return;
    }

    // 创建数据源
    this.source = new VectorSource();

    // 创建热力图层
    this.heatmapLayer = new Heatmap({
      source: this.source,
      blur: this.config.blur,
      radius: this.config.radius,
      opacity: this.config.opacity,
      gradient: this.config.gradient,
      zIndex: this.config.zIndex,
      visible: false
    });

    // 创建点图层
    this.pointsLayer = new VectorLayer({
      source: this.source,
      style: (feature) => {
        return new Style({
          image: new CircleStyle({
            radius: this.config.pointRadius,
            fill: new Fill({
              color: this.config.pointColor
            }),
            stroke: new Stroke({
              color: this.config.pointStrokeColor,
              width: this.config.pointStrokeWidth
            })
          })
        });
      },
      visible: false,
      zIndex: this.config.zIndex + 1
    });

    // 添加图层到地图
    this.mapInstance.addLayer(this.heatmapLayer);
    this.mapInstance.addLayer(this.pointsLayer);

    logger.debug('[Heatmap] 热力图图层已初始化');
  }

  /**
   * 设置地图事件监听器
   * @private
   */
  private setupMapListeners(): void {
    if (!this.mapInstance) return;
    
    try {
      // 监听视图变化事件（缩放）
      const viewChangeKey = this.mapInstance.getView().on('change:resolution', () => {
        if (this.heatmapLayer && this.active) {
          // 如果配置为缩放时隐藏，则隐藏热力图层
          if (this.config.hideOnZooming) {
            this.heatmapLayer.setVisible(false);
            if (this.pointsLayer && this.config.showPoints) {
              this.pointsLayer.setVisible(false);
            }
            logger.debug('[Heatmap] 视图分辨率变化，隐藏热力图');
          }
        }
      });
      
      // 监听地图移动开始事件
      const moveStartKey = this.mapInstance.on('movestart', () => {
        if (this.heatmapLayer && this.active) {
          // 如果配置为移动时隐藏，则隐藏热力图层
          if (this.config.hideOnMoving) {
            this.heatmapLayer.setVisible(false);
            if (this.pointsLayer && this.config.showPoints) {
              this.pointsLayer.setVisible(false);
            }
            logger.debug('[Heatmap] 地图移动开始，隐藏热力图');
          }
        }
      });
      
      // 监听地图移动结束事件
      const moveEndKey = this.mapInstance.on('moveend', () => {
        if (this.heatmapLayer && this.active) {
          // 如果配置为移动时隐藏，则移动结束后显示热力图层
          if (this.config.hideOnMoving) {
            this.heatmapLayer.setVisible(true);
            if (this.pointsLayer && this.config.showPoints) {
              this.pointsLayer.setVisible(true);
            }
            logger.debug('[Heatmap] 地图移动结束，显示热力图');
          }
        }
      });
      
      // 缩放结束事件
      const zoomEndKey = this.mapInstance.on('rendercomplete', () => {
        if (this.heatmapLayer && this.active) {
          // 如果配置为缩放时隐藏，则缩放结束后显示热力图层
          if (this.config.hideOnZooming && !this.heatmapLayer.getVisible()) {
            this.heatmapLayer.setVisible(true);
            if (this.pointsLayer && this.config.showPoints) {
              this.pointsLayer.setVisible(true);
            }
            logger.debug('[Heatmap] 渲染完成，显示热力图');
          }
        }
      });
      
      // 存储事件监听器，以便后续移除
      this.eventListeners.push(viewChangeKey, moveStartKey, moveEndKey, zoomEndKey);
      
      logger.debug('[Heatmap] 已设置地图事件监听器');
    } catch (error) {
      logger.error('[Heatmap] 设置地图事件监听器失败:', error);
    }
  }

  /**
   * 移除地图事件监听器
   * @private
   */
  private removeMapListeners(): void {
    if (this.eventListeners.length > 0) {
      try {
        // 解除所有事件监听
        this.eventListeners.forEach(key => {
          try {
            if (key) {
              Object.getPrototypeOf(key).constructor.unByKey(key);
            }
          } catch (error) {
            logger.error('[Heatmap] 移除事件监听器失败:', error);
          }
        });
        this.eventListeners = [];
        logger.debug('[Heatmap] 已移除所有地图事件监听器');
      } catch (error) {
        logger.error('[Heatmap] 移除事件监听器失败:', error);
      }
    }
  }

  /**
   * 设置配置
   * @param config 配置参数
   */
  public setConfig(config: Partial<HeatmapConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };

    // 更新热力图层设置
    if (this.heatmapLayer) {
      this.heatmapLayer.setBlur(this.config.blur);
      this.heatmapLayer.setRadius(this.config.radius);
      this.heatmapLayer.setOpacity(this.config.opacity);
      this.heatmapLayer.setGradient(this.config.gradient);
      this.heatmapLayer.setZIndex(this.config.zIndex);
    }

    // 更新点图层设置
    if (this.pointsLayer) {
      this.pointsLayer.setZIndex(this.config.zIndex + 1);
      this.pointsLayer.setVisible(this.active && this.config.showPoints);
    }

    logger.debug('[Heatmap] 热力图配置已更新', this.config);
  }

  /**
   * 添加热力点
   * @param point 热力点数据
   * @returns 点ID
   */
  public addPoint(point: HeatmapPoint): string {
    // 生成唯一ID
    const id = point.id || `heatmap-point-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 标准化权重到0-1范围
    const weight = point.weight !== undefined ? 
      Math.max(this.config.minWeight, Math.min(this.config.maxWeight, point.weight)) : 
      1.0;

    // 保存点信息
    this.points.set(id, {
      ...point,
      id,
      weight
    });

    // 创建特征
    const feature = new Feature({
      geometry: new Point(fromLonLat([point.longitude, point.latitude])),
      weight: weight,
      properties: {
        id,
        name: point.name || '',
        ...point.properties
      }
    });

    feature.setId(id);

    // 添加到数据源
    if (this.source) {
      this.source.addFeature(feature);
    }

    logger.debug(`[Heatmap] 添加热力点 ${id} (${point.longitude}, ${point.latitude}, 权重=${weight})`);
    return id;
  }

  /**
   * 批量添加热力点
   * @param points 热力点数据数组
   * @returns 点ID数组
   */
  public addPoints(points: HeatmapPoint[]): string[] {
    if (!points || points.length === 0) {
      return [];
    }

    const ids: string[] = [];
    points.forEach(point => {
      ids.push(this.addPoint(point));
    });

    logger.debug(`[Heatmap] 批量添加了 ${points.length} 个热力点`);
    return ids;
  }

  /**
   * 更新热力点
   * @param id 点ID
   * @param point 热力点数据
   * @returns 是否成功
   */
  public updatePoint(id: string, point: Partial<HeatmapPoint>): boolean {
    // 验证点是否存在
    if (!this.points.has(id)) {
      logger.warn(`[Heatmap] 热力点 ${id} 不存在，无法更新`);
      return false;
    }

    const existingPoint = this.points.get(id)!;
    const updatedPoint = { ...existingPoint, ...point };

    // 标准化权重
    if (point.weight !== undefined) {
      updatedPoint.weight = Math.max(this.config.minWeight, 
        Math.min(this.config.maxWeight, point.weight));
    }

    // 更新集合中的点
    this.points.set(id, updatedPoint);

    // 从源中移除原特征
    if (this.source) {
      const feature = this.source.getFeatureById(id);
      if (feature) {
        this.source.removeFeature(feature);

        // 创建新特征
        const newFeature = new Feature({
          geometry: new Point(fromLonLat([updatedPoint.longitude, updatedPoint.latitude])),
          weight: updatedPoint.weight,
          properties: {
            id,
            name: updatedPoint.name || '',
            ...updatedPoint.properties
          }
        });

        newFeature.setId(id);
        this.source.addFeature(newFeature);
        
        logger.debug(`[Heatmap] 更新热力点 ${id}`);
        return true;
      }
    }

    logger.warn(`[Heatmap] 热力点 ${id} 特征未找到，无法更新`);
    return false;
  }

  /**
   * 删除热力点
   * @param id 点ID
   * @returns 是否成功
   */
  public removePoint(id: string): boolean {
    if (!this.points.has(id)) {
      return false;
    }

    // 从集合中移除
    this.points.delete(id);

    // 从数据源中移除
    if (this.source) {
      const feature = this.source.getFeatureById(id);
      if (feature) {
        this.source.removeFeature(feature);
        logger.debug(`[Heatmap] 删除热力点 ${id}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 清空所有热力点
   */
  public clear(): void {
    this.points.clear();
    if (this.source) {
      this.source.clear();
    }
    logger.debug('[Heatmap] 清空所有热力点');
  }

  /**
   * 获取热力点数量
   * @returns 点数量
   */
  public getPointCount(): number {
    return this.points.size;
  }

  /**
   * 获取所有热力点
   * @returns 热力点数据对象
   */
  public getAllPoints(): Map<string, HeatmapPoint> {
    return new Map(this.points);
  }

  /**
   * 激活热力图
   */
  public enable(): void {
    if (this.active) {
      return;
    }

    if (this.heatmapLayer) {
      this.heatmapLayer.setVisible(true);
    }

    if (this.pointsLayer && this.config.showPoints) {
      this.pointsLayer.setVisible(true);
    }

    this.active = true;
    logger.debug('[Heatmap] 热力图已激活');
  }

  /**
   * 禁用热力图
   */
  public disable(): void {
    if (!this.active) {
      return;
    }

    if (this.heatmapLayer) {
      this.heatmapLayer.setVisible(false);
    }

    if (this.pointsLayer) {
      this.pointsLayer.setVisible(false);
    }

    this.active = false;
    logger.debug('[Heatmap] 热力图已禁用');
  }

  /**
   * 设置是否显示数据点
   * @param show 是否显示
   */
  public setPointsVisible(show: boolean): void {
    this.config.showPoints = show;
    if (this.pointsLayer) {
      this.pointsLayer.setVisible(this.active && show);
    }
    logger.debug(`[Heatmap] ${show ? '显示' : '隐藏'}数据点`);
  }

  /**
   * 获取当前是否激活
   * @returns 是否激活
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * 设置热力图性能模式
   * @param enable 是否启用性能模式（移动和缩放时隐藏热力图）
   */
  public setPerformanceMode(enable: boolean): void {
    this.setConfig({
      hideOnMoving: enable,
      hideOnZooming: enable
    });
    
    logger.debug(`[Heatmap] 性能模式已${enable ? '启用' : '禁用'}`);
  }

  /**
   * 销毁热力图对象
   */
  public destroy(): void {
    // 移除事件监听器
    this.removeMapListeners();

    if (this.mapInstance) {
      if (this.heatmapLayer) {
        this.mapInstance.removeLayer(this.heatmapLayer);
      }
      if (this.pointsLayer) {
        this.mapInstance.removeLayer(this.pointsLayer);
      }
    }

    this.heatmapLayer = null;
    this.pointsLayer = null;
    this.source = null;
    this.points.clear();
    this.active = false;

    logger.debug('[Heatmap] 热力图对象已销毁');
  }
} 