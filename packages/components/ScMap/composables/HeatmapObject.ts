/**
 * 热力图对象
 * @description 管理地图热力图显示
 */
import L from 'leaflet';
import 'leaflet.heat';
import logger from './LogObject';
import { HeatmapPoint, HeatmapConfig, DEFAULT_HEATMAP_CONFIG } from '../types/heatmap';

/**
 * 热力图类
 */
export class HeatmapObject {
  // 地图实例
  private mapInstance: L.Map | null = null;
  // 热力图层
  private heatLayer: L.HeatLayer | null = null;
  // 点标记图层组
  private markerLayerGroup: L.LayerGroup | null = null;
  // 配置
  private config: HeatmapConfig = DEFAULT_HEATMAP_CONFIG;
  // 当前数据点
  private points: Map<string, HeatmapPoint> = new Map();
  // 激活状态
  private active: boolean = false;
  // 事件监听器
  private eventListeners: Array<{ target: any, type: string, handler: any }> = [];

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 配置参数
   */
  constructor(mapInstance: L.Map | null = null, config?: Partial<HeatmapConfig>) {
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
  public setMapInstance(mapInstance: L.Map): void {
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

    try {
      // 创建点标记图层组
      this.markerLayerGroup = L.layerGroup();
      
      // 转换热力图数据格式
      const heatData: Array<[number, number, number]> = [];
      
      // 添加已有点到热力图数据
      this.points.forEach((point, id) => {
        heatData.push([
          point.lat,
          point.lng,
          point.weight || 1
        ]);
      });
      
      // 创建热力图层
      this.heatLayer = L.heatLayer(heatData, {
        radius: this.config.radius || 25,
        blur: this.config.blur || 15,
        maxZoom: this.config.maxZoom,
        max: this.config.max || 1.0,
        minOpacity: this.config.minOpacity || 0.05,
        gradient: this.config.gradient || {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      });
      
      // 添加图层到地图
      if (this.active) {
        this.markerLayerGroup.addTo(this.mapInstance);
        this.heatLayer.addTo(this.mapInstance);
      }
      
      logger.debug('[Heatmap] 热力图图层已初始化');
    } catch (error) {
      logger.error('[Heatmap] 初始化热力图层失败:', error);
    }
  }

  /**
   * 设置地图事件监听器
   * @private
   */
  private setupMapListeners(): void {
    if (!this.mapInstance) return;
    
    try {
      // 监听缩放开始事件
      const onZoomStart = () => {
        if (this.heatLayer && this.active && this.config.hideOnZooming) {
          this.mapInstance?.removeLayer(this.heatLayer);
          if (this.markerLayerGroup && this.config.showPoints) {
            this.mapInstance?.removeLayer(this.markerLayerGroup);
          }
          logger.debug('[Heatmap] 缩放开始，隐藏热力图');
        }
      };
      
      // 监听缩放结束事件
      const onZoomEnd = () => {
        if (this.heatLayer && this.active && this.config.hideOnZooming) {
          this.heatLayer.addTo(this.mapInstance!);
          if (this.markerLayerGroup && this.config.showPoints) {
            this.markerLayerGroup.addTo(this.mapInstance!);
          }
          logger.debug('[Heatmap] 缩放结束，显示热力图');
        }
      };
      
      // 监听移动开始事件
      const onMoveStart = () => {
        if (this.heatLayer && this.active && this.config.hideOnMoving) {
          this.mapInstance?.removeLayer(this.heatLayer);
          if (this.markerLayerGroup && this.config.showPoints) {
            this.mapInstance?.removeLayer(this.markerLayerGroup);
          }
          logger.debug('[Heatmap] 移动开始，隐藏热力图');
        }
      };
      
      // 监听移动结束事件
      const onMoveEnd = () => {
        if (this.heatLayer && this.active && this.config.hideOnMoving) {
          this.heatLayer.addTo(this.mapInstance!);
          if (this.markerLayerGroup && this.config.showPoints) {
            this.markerLayerGroup.addTo(this.mapInstance!);
          }
          logger.debug('[Heatmap] 移动结束，显示热力图');
        }
      };
      
      // 添加事件监听
      this.mapInstance.on('zoomstart', onZoomStart);
      this.mapInstance.on('zoomend', onZoomEnd);
      this.mapInstance.on('movestart', onMoveStart);
      this.mapInstance.on('moveend', onMoveEnd);
      
      // 保存事件引用，以便后续移除
      this.eventListeners = [
        { target: this.mapInstance, type: 'zoomstart', handler: onZoomStart },
        { target: this.mapInstance, type: 'zoomend', handler: onZoomEnd },
        { target: this.mapInstance, type: 'movestart', handler: onMoveStart },
        { target: this.mapInstance, type: 'moveend', handler: onMoveEnd }
      ];
      
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
    if (!this.mapInstance) return;
    
    try {
      // 移除所有事件监听器
      this.eventListeners.forEach(listener => {
        listener.target.off(listener.type, listener.handler);
      });
      
      // 清空监听器列表
      this.eventListeners = [];
      
      logger.debug('[Heatmap] 已移除地图事件监听器');
    } catch (error) {
      logger.error('[Heatmap] 移除地图事件监听器失败:', error);
    }
  }

  /**
   * 设置配置
   * @param config 配置参数
   */
  public setConfig(config: Partial<HeatmapConfig>): void {
    // 合并配置
    this.config = { ...this.config, ...config };
    
    // 如果已创建热力图层，则更新配置
    if (this.heatLayer) {
      this.heatLayer.setOptions({
        radius: this.config.radius,
        blur: this.config.blur,
        max: this.config.max,
        maxZoom: this.config.maxZoom,
        minOpacity: this.config.minOpacity,
        gradient: this.config.gradient
      });
    }
    
    logger.debug('[Heatmap] 配置已更新');
  }

  /**
   * 添加热力图点
   * @param point 热力图点
   * @returns 生成的点ID
   */
  public addPoint(point: HeatmapPoint): string {
    if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      logger.error('[Heatmap] 添加热力图点失败：无效的点数据');
      return '';
    }
    
    try {
      // 生成唯一ID
      const id = `heat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // 保存点数据
      this.points.set(id, { ...point });
      
      // 如果热力图层已存在，添加点
      if (this.heatLayer && this.mapInstance) {
        this.heatLayer.addLatLng([
          point.lat,
          point.lng,
          point.weight || 1
        ]);
        
        // 如果显示点标记，添加标记
        if (this.config.showPoints && this.markerLayerGroup) {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: this.config.pointRadius || 4,
            fillColor: this.config.pointColor || '#ff0000',
            color: this.config.pointStrokeColor || '#ffffff',
            weight: this.config.pointStrokeWidth || 1,
            opacity: 0.8,
            fillOpacity: 0.7
          });
          
          // 如果有自定义数据，添加到标记
          if (point.data) {
            marker.bindTooltip(JSON.stringify(point.data));
          }
          
          this.markerLayerGroup.addLayer(marker);
        }
      }
      
      logger.debug(`[Heatmap] 已添加热力图点: ${id}`);
      return id;
    } catch (error) {
      logger.error('[Heatmap] 添加热力图点失败:', error);
      return '';
    }
  }

  /**
   * 批量添加热力图点
   * @param points 热力图点数组
   * @returns 生成的点ID数组
   */
  public addPoints(points: HeatmapPoint[]): string[] {
    if (!Array.isArray(points) || points.length === 0) {
      logger.error('[Heatmap] 批量添加热力图点失败：无效的点数据数组');
      return [];
    }
    
    const ids: string[] = [];
    
    try {
      // 收集所有有效点数据
      const validPoints = points.filter(p => 
        typeof p.lat === 'number' && typeof p.lng === 'number'
      );
      
      // 如果热力图层存在，重新创建热力图层
      if (this.heatLayer && this.mapInstance) {
        // 移除旧图层
        this.mapInstance.removeLayer(this.heatLayer);
        
        // 对于每个点，添加到集合并生成ID
        validPoints.forEach(point => {
          const id = `heat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          this.points.set(id, { ...point });
          ids.push(id);
        });
        
        // 转换所有点为热力图数据格式
        const heatData = Array.from(this.points.values()).map(p => [
          p.lat,
          p.lng,
          p.weight || 1
        ] as [number, number, number]);
        
        // 创建新热力图层
        this.heatLayer = L.heatLayer(heatData, {
          radius: this.config.radius || 25,
          blur: this.config.blur || 15,
          maxZoom: this.config.maxZoom,
          max: this.config.max || 1.0,
          minOpacity: this.config.minOpacity || 0.05,
          gradient: this.config.gradient
        });
        
        // 如果当前激活，添加到地图
        if (this.active) {
          this.heatLayer.addTo(this.mapInstance);
        }
        
        // 更新点标记
        if (this.config.showPoints && this.markerLayerGroup) {
          this.markerLayerGroup.clearLayers();
          
          Array.from(this.points.values()).forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], {
              radius: this.config.pointRadius || 4,
              fillColor: this.config.pointColor || '#ff0000',
              color: this.config.pointStrokeColor || '#ffffff',
              weight: this.config.pointStrokeWidth || 1,
              opacity: 0.8,
              fillOpacity: 0.7
            });
            
            if (point.data) {
              marker.bindTooltip(JSON.stringify(point.data));
            }
            
            this.markerLayerGroup?.addLayer(marker);
          });
          
          if (this.active) {
            this.markerLayerGroup.addTo(this.mapInstance);
          }
        }
      } else {
        // 如果热力图层不存在，只添加点到集合
        validPoints.forEach(point => {
          const id = `heat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          this.points.set(id, { ...point });
          ids.push(id);
        });
      }
      
      logger.debug(`[Heatmap] 已批量添加热力图点: ${ids.length}个`);
      return ids;
    } catch (error) {
      logger.error('[Heatmap] 批量添加热力图点失败:', error);
      return ids;
    }
  }

  /**
   * 更新热力图点
   * @param id 点ID
   * @param point 更新的点数据
   * @returns 是否更新成功
   */
  public updatePoint(id: string, point: Partial<HeatmapPoint>): boolean {
    if (!id || !this.points.has(id)) {
      logger.error(`[Heatmap] 更新热力图点失败：找不到点 ${id}`);
      return false;
    }
    
    try {
      // 获取原点数据
      const oldPoint = this.points.get(id)!;
      
      // 合并更新的数据
      const newPoint = { ...oldPoint, ...point };
      
      // 更新集合中的点数据
      this.points.set(id, newPoint);
      
      // 重新生成热力图层
      if (this.heatLayer && this.mapInstance) {
        // 移除旧图层
        this.mapInstance.removeLayer(this.heatLayer);
        
        // 转换所有点为热力图数据格式
        const heatData = Array.from(this.points.values()).map(p => [
          p.lat,
          p.lng,
          p.weight || 1
        ] as [number, number, number]);
        
        // 创建新热力图层
        this.heatLayer = L.heatLayer(heatData, {
          radius: this.config.radius || 25,
          blur: this.config.blur || 15,
          maxZoom: this.config.maxZoom,
          max: this.config.max || 1.0,
          minOpacity: this.config.minOpacity || 0.05,
          gradient: this.config.gradient
        });
        
        // 如果当前激活，添加到地图
        if (this.active) {
          this.heatLayer.addTo(this.mapInstance);
        }
        
        // 更新点标记
        if (this.config.showPoints && this.markerLayerGroup) {
          this.markerLayerGroup.clearLayers();
          
          Array.from(this.points.values()).forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], {
              radius: this.config.pointRadius || 4,
              fillColor: this.config.pointColor || '#ff0000',
              color: this.config.pointStrokeColor || '#ffffff',
              weight: this.config.pointStrokeWidth || 1,
              opacity: 0.8,
              fillOpacity: 0.7
            });
            
            if (point.data) {
              marker.bindTooltip(JSON.stringify(point.data));
            }
            
            this.markerLayerGroup?.addLayer(marker);
          });
          
          if (this.active) {
            this.markerLayerGroup.addTo(this.mapInstance);
          }
        }
      }
      
      logger.debug(`[Heatmap] 已更新热力图点: ${id}`);
      return true;
    } catch (error) {
      logger.error(`[Heatmap] 更新热力图点失败 ${id}:`, error);
      return false;
    }
  }

  /**
   * 删除热力图点
   * @param id 点ID
   * @returns 是否删除成功
   */
  public removePoint(id: string): boolean {
    if (!id || !this.points.has(id)) {
      logger.error(`[Heatmap] 删除热力图点失败：找不到点 ${id}`);
      return false;
    }
    
    try {
      // 从集合中删除点
      this.points.delete(id);
      
      // 重新生成热力图层
      if (this.heatLayer && this.mapInstance) {
        // 移除旧图层
        this.mapInstance.removeLayer(this.heatLayer);
        
        // 如果没有点，则不创建新图层
        if (this.points.size === 0) {
          this.heatLayer = null;
          return true;
        }
        
        // 转换所有点为热力图数据格式
        const heatData = Array.from(this.points.values()).map(p => [
          p.lat,
          p.lng,
          p.weight || 1
        ] as [number, number, number]);
        
        // 创建新热力图层
        this.heatLayer = L.heatLayer(heatData, {
          radius: this.config.radius || 25,
          blur: this.config.blur || 15,
          maxZoom: this.config.maxZoom,
          max: this.config.max || 1.0,
          minOpacity: this.config.minOpacity || 0.05,
          gradient: this.config.gradient
        });
        
        // 如果当前激活，添加到地图
        if (this.active) {
          this.heatLayer.addTo(this.mapInstance);
        }
        
        // 更新点标记
        if (this.config.showPoints && this.markerLayerGroup) {
          this.markerLayerGroup.clearLayers();
          
          Array.from(this.points.values()).forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], {
              radius: this.config.pointRadius || 4,
              fillColor: this.config.pointColor || '#ff0000',
              color: this.config.pointStrokeColor || '#ffffff',
              weight: this.config.pointStrokeWidth || 1,
              opacity: 0.8,
              fillOpacity: 0.7
            });
            
            if (point.data) {
              marker.bindTooltip(JSON.stringify(point.data));
            }
            
            this.markerLayerGroup?.addLayer(marker);
          });
          
          if (this.active) {
            this.markerLayerGroup.addTo(this.mapInstance);
          }
        }
      }
      
      logger.debug(`[Heatmap] 已删除热力图点: ${id}`);
      return true;
    } catch (error) {
      logger.error(`[Heatmap] 删除热力图点失败 ${id}:`, error);
      return false;
    }
  }

  /**
   * 清空所有热力图点
   */
  public clear(): void {
    try {
      // 清空点集合
      this.points.clear();
      
      // 移除图层
      if (this.heatLayer && this.mapInstance) {
        this.mapInstance.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }
      
      // 清空点标记
      if (this.markerLayerGroup) {
        this.markerLayerGroup.clearLayers();
      }
      
      logger.debug('[Heatmap] 已清空所有热力图点');
    } catch (error) {
      logger.error('[Heatmap] 清空热力图点失败:', error);
    }
  }

  /**
   * 获取热力图点数量
   * @returns 点数量
   */
  public getPointCount(): number {
    return this.points.size;
  }

  /**
   * 获取所有热力图点
   * @returns 点集合
   */
  public getAllPoints(): Map<string, HeatmapPoint> {
    return new Map(this.points);
  }

  /**
   * 启用热力图
   */
  public enable(): void {
    if (this.active) return;
    
    try {
      this.active = true;
      
      // 如果有热力图层且有地图实例，添加到地图
      if (this.heatLayer && this.mapInstance) {
        this.heatLayer.addTo(this.mapInstance);
      } else if (this.mapInstance && this.points.size > 0) {
        // 如果没有热力图层但有点数据，创建热力图层
        const heatData = Array.from(this.points.values()).map(p => [
          p.lat,
          p.lng,
          p.weight || 1
        ] as [number, number, number]);
        
        this.heatLayer = L.heatLayer(heatData, {
          radius: this.config.radius || 25,
          blur: this.config.blur || 15,
          maxZoom: this.config.maxZoom,
          max: this.config.max || 1.0,
          minOpacity: this.config.minOpacity || 0.05,
          gradient: this.config.gradient
        });
        
        this.heatLayer.addTo(this.mapInstance);
      }
      
      // 显示点标记
      if (this.config.showPoints && this.markerLayerGroup && this.mapInstance) {
        this.markerLayerGroup.addTo(this.mapInstance);
      }
      
      logger.debug('[Heatmap] 热力图已启用');
    } catch (error) {
      logger.error('[Heatmap] 启用热力图失败:', error);
      this.active = false;
    }
  }

  /**
   * 禁用热力图
   */
  public disable(): void {
    if (!this.active) return;
    
    try {
      this.active = false;
      
      // 如果有热力图层且有地图实例，从地图移除
      if (this.heatLayer && this.mapInstance) {
        this.mapInstance.removeLayer(this.heatLayer);
      }
      
      // 隐藏点标记
      if (this.markerLayerGroup && this.mapInstance) {
        this.mapInstance.removeLayer(this.markerLayerGroup);
      }
      
      logger.debug('[Heatmap] 热力图已禁用');
    } catch (error) {
      logger.error('[Heatmap] 禁用热力图失败:', error);
    }
  }

  /**
   * 设置点标记是否可见
   * @param show 是否显示
   */
  public setPointsVisible(show: boolean): void {
    this.config.showPoints = show;
    
    try {
      if (this.markerLayerGroup && this.mapInstance) {
        if (show && this.active) {
          this.markerLayerGroup.addTo(this.mapInstance);
        } else {
          this.mapInstance.removeLayer(this.markerLayerGroup);
        }
      }
      
      logger.debug(`[Heatmap] 点标记可见性已设置为: ${show}`);
    } catch (error) {
      logger.error('[Heatmap] 设置点标记可见性失败:', error);
    }
  }

  /**
   * 获取热力图是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * 设置性能模式
   * @param enable 是否启用性能模式
   */
  public setPerformanceMode(enable: boolean): void {
    this.config.hideOnMoving = enable;
    this.config.hideOnZooming = enable;
    
    logger.debug(`[Heatmap] 性能模式已设置为: ${enable}`);
  }

  /**
   * 销毁热力图对象
   */
  public destroy(): void {
    try {
      // 移除事件监听器
      this.removeMapListeners();
      
      // 移除图层
      if (this.heatLayer && this.mapInstance) {
        this.mapInstance.removeLayer(this.heatLayer);
      }
      
      // 移除点标记
      if (this.markerLayerGroup && this.mapInstance) {
        this.mapInstance.removeLayer(this.markerLayerGroup);
      }
      
      // 清空点集合
      this.points.clear();
      
      // 设置为空引用
      this.heatLayer = null;
      this.markerLayerGroup = null;
      this.mapInstance = null;
      
      logger.debug('[Heatmap] 热力图对象已销毁');
    } catch (error) {
      logger.error('[Heatmap] 销毁热力图对象失败:', error);
    }
  }
} 