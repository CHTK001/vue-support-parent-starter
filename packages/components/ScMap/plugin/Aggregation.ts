import type { Map as LeafletMap, LatLng, Layer, LayerGroup, Marker as LeafletMarker } from 'leaflet';
import L from 'leaflet';
import type { AggregationOptions } from '../types';
import { info, warn, error } from '@repo/utils';
import type { CustomMarkerOptions } from './Marker';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
/**
 * 注意：使用此聚合插件需要安装 leaflet.markercluster 依赖
 * npm install leaflet.markercluster --save
 * 
 * 然后在主应用入口处引入样式文件:
 * import 'leaflet.markercluster/dist/MarkerCluster.css';
 * import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
 * 
 * 并动态导入插件:
 * 
 * try {
 *   await import('leaflet.markercluster');
 * } catch (e) {
 *   console.error('Failed to load leaflet.markercluster', e);
 * }
 */

// 异步导入 leaflet.markercluster 插件
const loadClusterPlugin = async (): Promise<boolean> => {
  if (L.MarkerClusterGroup) {
    return true;
  }
  
  try {
    await import('leaflet.markercluster');
    return true;
  } catch (e) {
    console.error('Failed to load leaflet.markercluster', e);
    warn('聚合功能将不可用: 请安装 leaflet.markercluster 依赖');
    return false;
  }
};

// 检查是否存在 L.MarkerClusterGroup，如果不存在，提供警告函数
const checkClusterPlugin = (): boolean => {
  if (!L.MarkerClusterGroup) {
    console.warn('L.MarkerClusterGroup 未找到。请确保已安装 leaflet.markercluster 库。');
    warn('未找到聚合插件，聚合功能将不可用');
    return false;
  }
  return true;
};

// 事件类型
export type AggregationEventType = 'cluster-add' | 'cluster-remove' | 'cluster-click' | 'cluster-enabled' | 'cluster-disabled';

// 事件监听器类型
export type AggregationEventListener = (event?: any) => void;

export class Aggregation {
  private map: LeafletMap;
  private enabled: boolean = false;
  private clusterLayer: any = null; // MarkerClusterGroup 类型
  private markerLayerGroup: LayerGroup;
  private options: AggregationOptions;
  private originalMarkers: Map<string, LeafletMarker> = new Map();
  private eventListeners: Map<AggregationEventType, Set<AggregationEventListener>> = new Map();
  private markerChangeObserver: MutationObserver | null = null;
  private reclusterTimeout: number | null = null;
  private observingMarkerChanges: boolean = false;

  constructor(map: LeafletMap, markerLayerGroup: LayerGroup, options: AggregationOptions = {}) {
    this.map = map;
    this.markerLayerGroup = markerLayerGroup;
    this.options = {
      enabled: false,
      maxClusterRadius: 120,
      radiusUnit: 'pixel',
      color: '#1677ff',
      borderColor: '#fff',
      useWeightAsSize: true,
      showCount: true,
      minClusterSize: 2,
      maxClusterSize: 60,
      defaultSize: 40,
      zoomToBoundsOnClick: true,
      enablePulse: true,
      pulseDuration: 1500,
      pulseScale: 1.5,
      pulseOpacity: 0.6,
      pulseFrequency: 1, // 每秒1次脉冲
      enableImagePulse: true, // 默认为图片启用脉冲
      autoRecluster: true,
      reclusterDelay: 300,
      colorRanges: [],
      ...options
    };

    // 设置脉冲颜色，如果未指定则使用主颜色
    if (!this.options.pulseColor) {
      this.options.pulseColor = this.options.color;
    }
    
    // 如果配置了colorRanges，预先排序确保按照value升序排列
    if (this.options.colorRanges && this.options.colorRanges.length > 0) {
      this.options.colorRanges.sort((a, b) => a.value - b.value);
      info(`聚合颜色范围已配置并排序: ${JSON.stringify(this.options.colorRanges)}`);
    }

    // 检查是否可以使用聚合功能
    if (!checkClusterPlugin()) {
      warn('聚合功能将不可用: L.MarkerClusterGroup 未找到');
      return;
    }

    try {
      // 创建聚合图层但不立即添加到地图
      this.initClusterLayer();
      info('聚合图层初始化成功');
    } catch (e) {
      error('初始化聚合图层失败:', e);
    }
  }

  /**
   * 初始化聚合图层
   */
  private initClusterLayer(): void {
    if (!checkClusterPlugin()) return;

    try {
      const { 
        maxClusterRadius, radiusUnit, color, borderColor, zoomToBoundsOnClick, 
        iconCreateFunction, enablePulse, pulseDuration, pulseScale, pulseColor, 
        pulseOpacity, clusterImageUrl, enableImagePulse, clusterImageSize,
        pulseFrequency, colorRanges
      } = this.options;

      // 计算实际聚合半径（如果单位是公里，则转换为像素）
      const actualRadius = this.calculateActualRadius(maxClusterRadius, radiusUnit);

      // 如果用户没有提供自定义的图标创建函数，使用默认的
      const defaultIconCreateFunction = (cluster: any) => {
        const count = cluster.getChildCount();
        const size = this.calculateSize(count);
        
        // 确定是否使用图片
        const useImage = !!clusterImageUrl;
        
        // 根据聚合点数量确定使用的颜色
        let clusterColor = color;
        
        // 如果配置了颜色范围，根据聚合点数量选择颜色
        if (colorRanges && colorRanges.length > 0) {
          // 从高到低遍历，找到第一个满足条件的颜色
          for (let i = colorRanges.length - 1; i >= 0; i--) {
            if (count >= colorRanges[i].value) {
              clusterColor = colorRanges[i].color;
              break;
            }
          }
        }
        
        // 根据配置选择使用哪种图标HTML
        let html;
        if (useImage) {
          // 使用图片作为聚合点
          html = this.createImageIconHtml(
            size, 
            count, 
            clusterImageUrl, 
            enableImagePulse && enablePulse,
            clusterColor, // 使用根据数量确定的颜色
            borderColor,
            pulseDuration,
            pulseScale,
            pulseColor,
            pulseOpacity,
            pulseFrequency,
            clusterImageSize
          );
        } else {
          // 使用默认圆形图标
          html = enablePulse 
            ? this.createPulseIconHtml(
                size, 
                count, 
                clusterColor, // 使用根据数量确定的颜色
                borderColor, 
                pulseDuration, 
                pulseScale,
                pulseColor,
                pulseOpacity,
                pulseFrequency
              )
            : this.createStandardIconHtml(size, count, clusterColor, borderColor); // 使用根据数量确定的颜色
        }
        
        return L.divIcon({
          html,
          className: 'marker-cluster' + (enablePulse ? ' pulse-enabled' : ''),
          iconSize: L.point(size, size)
        });
      };

      // 创建聚合图层
      this.clusterLayer = L.markerClusterGroup({
        maxClusterRadius: actualRadius,
        zoomToBoundsOnClick,
        iconCreateFunction: iconCreateFunction || defaultIconCreateFunction,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        animate: true,
        animateAddingMarkers: true,
        disableClusteringAtZoom: null,
        spiderfyDistanceMultiplier: 1.5,
        polygonOptions: {
          fillColor: color,
          color: borderColor,
          weight: 1.5,
          opacity: 0.5,
          fillOpacity: 0.2
        }
      });

      // 监听聚合图层的事件
      this.clusterLayer.on('clusterclick', (e: any) => {
        this.emit('cluster-click', e);
      });

      this.addClusterAnimationStyles();

    } catch (e) {
      error('创建聚合图层失败:', e);
      throw e;
    }
  }

  /**
   * 根据单位计算实际的聚合半径
   * @param radius 半径值
   * @param unit 单位类型
   * @returns 实际的聚合半径（像素）
   */
  private calculateActualRadius(radius: number = 120, unit: string = 'pixel'): number {
    // 如果单位是像素，直接返回
    if (unit !== 'kilometer') {
      return radius;
    }
    
    // 如果单位是公里，需要转换为像素
    // 获取当前地图的缩放级别和中心点
    const zoom = this.map.getZoom();
    const center = this.map.getCenter();
    
    // 创建两个点，一个是中心点，一个是在中心点向东移动radius公里的点
    const point1 = center;
    const point2 = L.latLng(
      center.lat,
      center.lng + (radius / 111.32) // 经度1度约等于111.32公里
    );
    
    // 计算这两个点在当前地图上的像素距离
    const p1 = this.map.latLngToContainerPoint(point1);
    const p2 = this.map.latLngToContainerPoint(point2);
    
    // 计算像素距离
    const pixelDistance = p1.distanceTo(p2);
    
    return Math.max(30, pixelDistance); // 确保最小半径为30像素
  }

  /**
   * 创建标准的图标HTML
   */
  private createStandardIconHtml(size: number, count: number, color: string, borderColor: string): string {
    return `<div style="
      background-color: ${color}; 
      color: white; 
      border: 2px solid ${borderColor}; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-weight: bold;
      font-size: ${size / 2}px;
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%;
      transition: all 0.3s ease;">
      ${this.options.showCount ? count : ''}
    </div>`;
  }

  /**
   * 创建带脉冲扩散效果的图标HTML
   */
  private createPulseIconHtml(
    size: number, 
    count: number, 
    color: string, 
    borderColor: string,
    duration: number = 1500,
    scale: number = 1.5,
    pulseColor: string = color,
    pulseOpacity: number = 0.6,
    frequency: number = 1
  ): string {
    // 计算动画持续时间和延迟，以实现指定频率的连续脉冲
    const animationDuration = duration;
    const animationDelay = (1000 / frequency) - duration;
    const delayStyle = animationDelay > 0 ? `animation-delay: ${animationDelay}ms;` : '';
    
    return `
    <div class="cluster-container" style="position: relative; width: ${size}px; height: ${size}px;">
      <!-- 扩散效果层 -->
      <div class="pulse-ring" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${pulseColor};
        opacity: 0;
        animation: pulse-animation ${animationDuration}ms infinite ease-out;
        ${delayStyle}
      "></div>
      
      <!-- 扩散效果层2（错开时间形成连续波纹） -->
      <div class="pulse-ring" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${pulseColor};
        opacity: 0;
        animation: pulse-animation ${animationDuration}ms infinite ease-out;
        animation-delay: ${animationDuration / 2}ms;
      "></div>
      
      <!-- 主聚合点 -->
      <div class="cluster-icon" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: ${color}; 
        color: white; 
        border: 2px solid ${borderColor}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        font-weight: bold;
        font-size: ${size / 2}px;
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%;
        z-index: 1;
        transition: all 0.3s ease;
      ">
        ${this.options.showCount ? count : ''}
      </div>
    </div>
    `;
  }

  /**
   * 创建带图片的聚合点HTML
   */
  private createImageIconHtml(
    size: number,
    count: number,
    imageUrl: string,
    enablePulse: boolean = true,
    color: string = '#1677ff',
    borderColor: string = '#fff',
    duration: number = 1500,
    scale: number = 1.5,
    pulseColor: string = color,
    pulseOpacity: number = 0.6,
    frequency: number = 1,
    imageSize?: number
  ): string {
    // 计算动画持续时间和延迟，以实现指定频率的连续脉冲
    const animationDuration = duration;
    const animationDelay = (1000 / frequency) - duration;
    const delayStyle = animationDelay > 0 ? `animation-delay: ${animationDelay}ms;` : '';
    
    // 使用指定的图片大小或计算的大小
    const actualImageSize = imageSize || size;
    
    // 计算居中偏移
    const offsetX = (size - actualImageSize) / 2;
    const offsetY = (size - actualImageSize) / 2;
    
    // 构建HTML
    let html = `
    <div class="cluster-container" style="position: relative; width: ${size}px; height: ${size}px;">`;
    
    // 如果启用脉冲，添加脉冲层
    if (enablePulse) {
      html += `
      <!-- 扩散效果层 -->
      <div class="pulse-ring image-pulse" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${actualImageSize}px;
        height: ${actualImageSize}px;
        border-radius: 50%;
        background-color: ${pulseColor};
        opacity: 0;
        animation: pulse-animation ${animationDuration}ms infinite ease-out;
        ${delayStyle}
      "></div>
      
      <!-- 扩散效果层2（错开时间形成连续波纹） -->
      <div class="pulse-ring image-pulse" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${actualImageSize}px;
        height: ${actualImageSize}px;
        border-radius: 50%;
        background-color: ${pulseColor};
        opacity: 0;
        animation: pulse-animation ${animationDuration}ms infinite ease-out;
        animation-delay: ${animationDuration / 2}ms;
      "></div>`;
    }
    
    // 添加图片和计数
    html += `
      <!-- 图片背景 -->
      <div class="cluster-icon-wrapper" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${actualImageSize}px;
        height: ${actualImageSize}px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <img src="${imageUrl}" style="
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          border: 2px solid ${borderColor};
        "/>
        
        ${this.options.showCount ? `
        <!-- 计数显示 -->
        <div class="cluster-count" style="
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: ${color};
          color: white;
          border: 1px solid ${borderColor};
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          padding: 0 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${count}</div>
        ` : ''}
      </div>
    </div>`;
    
    return html;
  }

  /**
   * 添加聚合动画相关的CSS样式
   */
  private addClusterAnimationStyles(): void {
    const styleId = 'sc-map-cluster-animations';
    if (document.getElementById(styleId)) return;

    const { color, pulseScale, pulseColor, pulseOpacity } = this.options;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .leaflet-marker-icon.leaflet-marker-icon-wrapper {
        transition: transform 0.25s ease-out, opacity 0.25s ease-in-out !important;
      }
      
      .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
        background-color: transparent !important;
      }
      
      .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
        transition: all 0.3s ease !important;
      }
      
      .leaflet-cluster-anim .leaflet-marker-icon, .leaflet-cluster-anim .leaflet-marker-shadow {
        transition: transform 0.3s ease-out, opacity 0.3s ease-in !important;
      }
      
      @keyframes pulse-animation {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: ${pulseOpacity};
        }
        100% {
          transform: translate(-50%, -50%) scale(${pulseScale});
          opacity: 0;
        }
      }
      
      .pulse-enabled {
        z-index: 400 !important;
      }
      
      .cluster-container {
        pointer-events: none;
      }
      
      .cluster-icon, .cluster-icon-wrapper {
        pointer-events: auto;
      }
      
      .image-pulse {
        border-radius: 50%;
        background: radial-gradient(circle, ${pulseColor} 30%, transparent 70%);
      }
      
      .cluster-count {
        pointer-events: none;
        font-weight: bold;
      }
      
      /* 扩散动画增强效果 */
      .pulse-ring {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 计算聚合点的大小
   * @param count 聚合中的标记数量
   * @returns 聚合点的大小（像素）
   */
  private calculateSize(count: number): number {
    const { minClusterSize, maxClusterSize, useWeightAsSize, defaultSize } = this.options;
    
    // 使用defaultSize作为基础大小值
    const baseSize = defaultSize || 40;

    // 如果设置不使用权重计算大小或者无标记数量
    if (!useWeightAsSize || count <= 0) {
      return baseSize;
    }

    // 使用默认大小，确保在最小和最大范围内
    return Math.min(
      maxClusterSize || 60,
      Math.max(minClusterSize || 30, baseSize)
    );
  }

  /**
   * 启用聚合功能
   */
  enable(): void {
    if (this.enabled || !checkClusterPlugin()) return;

    try {
      info('启用标记点聚合功能');

      // 记录原始的标记点
      this.saveOriginalMarkers();

      // 从原始图层中移除所有标记点
      this.clearOriginalMarkers();

      // 将标记点添加到聚合图层
      this.addMarkersToCluster();

      // 将聚合图层添加到地图
      this.clusterLayer.addTo(this.map);

      // 如果启用了自动重聚合，开始监听标记点变化
      if (this.options.autoRecluster) {
        this.startObservingMarkerChanges();
      }

      this.enabled = true;
      this.emit('cluster-enabled');
    } catch (e) {
      error('启用聚合功能失败:', e);
    }
  }

  /**
   * 禁用聚合功能
   */
  disable(): void {
    if (!this.enabled || !this.clusterLayer) return;

    try {
      info('禁用标记点聚合功能');

      // 停止监听标记点变化
      this.stopObservingMarkerChanges();

      // 从地图中移除聚合图层
      this.map.removeLayer(this.clusterLayer);

      // 将标记点添加回原始图层
      this.restoreOriginalMarkers();

      this.enabled = false;
      this.emit('cluster-disabled');
    } catch (e) {
      error('禁用聚合功能失败:', e);
    }
  }

  /**
   * 保存原始标记点
   */
  private saveOriginalMarkers(): void {
    this.originalMarkers.clear();
    
    this.markerLayerGroup.eachLayer((layer: Layer) => {
      if (layer instanceof L.Marker) {
        const marker = layer as LeafletMarker;
        const options = marker.options as CustomMarkerOptions;
        
        // 只保存可聚合的标记点
        if (options.markerClusterable !== false && options.markerId) {
          this.originalMarkers.set(options.markerId, marker);
        }
      }
    });
  }

  /**
   * 从原始图层中移除所有可聚合的标记点
   */
  private clearOriginalMarkers(): void {
    this.originalMarkers.forEach((marker) => {
      this.markerLayerGroup.removeLayer(marker);
    });
  }

  /**
   * 将标记点添加到聚合图层
   */
  private addMarkersToCluster(): void {
    const markers: LeafletMarker[] = [];
    
    // 遍历所有原始标记点
    this.originalMarkers.forEach((marker, id) => {
      const options = marker.options as CustomMarkerOptions;
      
      // 只添加可聚合的标记点
      if (options.markerClusterable !== false) {
        markers.push(marker);
      } else {
        // 不可聚合的标记点添加回原始图层
        this.markerLayerGroup.addLayer(marker);
      }
    });
    
    // 批量添加到聚合图层
    this.clusterLayer.addLayers(markers);
  }

  /**
   * 将标记点添加回原始图层
   */
  private restoreOriginalMarkers(): void {
    // 从聚合图层中移除所有标记
    this.clusterLayer.clearLayers();
    
    // 将标记点添加回原始图层
    this.originalMarkers.forEach((marker) => {
      this.markerLayerGroup.addLayer(marker);
    });
  }

  /**
   * 更新聚合选项
   * @param options 聚合选项
   */
  updateOptions(options: Partial<AggregationOptions>): void {
    const previousAutoRecluster = this.options.autoRecluster;
    
    this.options = { ...this.options, ...options };
    
    // 设置脉冲颜色，如果未指定则使用主颜色
    if (options.color && !options.pulseColor) {
      this.options.pulseColor = options.color;
    }
    
    // 如果单位或半径更改了，需要重新计算
    if (options.radiusUnit !== undefined || options.maxClusterRadius !== undefined) {
      info(`聚合半径更新: ${this.options.maxClusterRadius} ${this.options.radiusUnit}`);
    }
    
    // 如果colorRanges有更新，进行排序并记录日志
    if (options.colorRanges !== undefined) {
      if (this.options.colorRanges && this.options.colorRanges.length > 0) {
        this.options.colorRanges.sort((a, b) => a.value - b.value);
      }
      info(`聚合颜色范围已更新并排序: ${JSON.stringify(this.options.colorRanges)}`);
    }
    
    // 如果扩散效果相关选项发生变化，更新样式
    const pulseOptionsChanged = options.enablePulse !== undefined || 
                               options.pulseDuration !== undefined || 
                               options.pulseScale !== undefined ||
                               options.pulseColor !== undefined ||
                               options.pulseOpacity !== undefined ||
                               options.pulseFrequency !== undefined ||
                               options.enableImagePulse !== undefined;
    
    if (pulseOptionsChanged) {
      // 更新扩散效果相关选项
      this.addClusterAnimationStyles(); // 重新添加样式以应用新设置
    }
    
    // 处理自动重聚合设置变更
    if (this.enabled && options.autoRecluster !== undefined) {
      if (options.autoRecluster && !previousAutoRecluster) {
        this.startObservingMarkerChanges();
      } else if (!options.autoRecluster && previousAutoRecluster) {
        this.stopObservingMarkerChanges();
      }
    }
    
    if (this.enabled) {
      // 重新启用以应用新选项
      this.disable();
      this.initClusterLayer();
      this.enable();
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器
   */
  on(event: AggregationEventType, listener: AggregationEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener);
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器
   */
  off(event: AggregationEventType, listener: AggregationEventListener): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.delete(listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: AggregationEventType, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }

  /**
   * 切换聚合功能
   */
  toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * 获取聚合状态
   * @returns 是否启用聚合
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 刷新聚合图层
   */
  refresh(): void {
    if (!this.enabled) return;
    
    this.disable();
    this.enable();
  }

  /**
   * 销毁聚合功能
   */
  destroy(): void {
    if (this.enabled) {
      this.disable();
    }
    
    // 确保停止监听变化
    this.stopObservingMarkerChanges();
    
    this.originalMarkers.clear();
    this.eventListeners.clear();
    this.clusterLayer = null;
  }

  /**
   * 动态添加标记点到聚合图层
   * @param marker 标记点对象
   */
  addMarker(marker: LeafletMarker): void {
    if (!this.enabled || !this.clusterLayer) return;
    
    try {
      const options = marker.options as CustomMarkerOptions;
      
      // 仅处理可聚合的标记点
      if (options.markerClusterable !== false && options.markerId) {
        // 保存到原始标记点集合
        this.originalMarkers.set(options.markerId, marker);
        
        // 从原始图层移除标记点
        this.markerLayerGroup.removeLayer(marker);
        
        // 添加到聚合图层
        this.clusterLayer.addLayer(marker);
        
        this.emit('cluster-add', { marker });
        
        // 如果不是通过观察器触发的添加，则手动触发重聚合
        if (this.options.autoRecluster && !this.observingMarkerChanges) {
          this.scheduleRecluster();
        }
      }
    } catch (e) {
      error('动态添加标记到聚合图层失败:', e);
    }
  }

  /**
   * 动态移除标记点
   * @param markerId 标记点ID
   */
  removeMarker(markerId: string): void {
    if (!this.enabled || !this.clusterLayer) return;
    
    try {
      const marker = this.originalMarkers.get(markerId);
      if (marker) {
        // 从聚合图层移除
        this.clusterLayer.removeLayer(marker);
        
        // 从原始标记点集合中移除
        this.originalMarkers.delete(markerId);
        
        this.emit('cluster-remove', { markerId });
        
        // 如果不是通过观察器触发的移除，则手动触发重聚合
        if (this.options.autoRecluster && !this.observingMarkerChanges) {
          this.scheduleRecluster();
        }
      }
    } catch (e) {
      error('从聚合图层移除标记失败:', e);
    }
  }

  /**
   * 开始监听标记点图层变化
   */
  private startObservingMarkerChanges(): void {
    if (this.markerChangeObserver || !this.markerLayerGroup) return;
    
    try {
      // 标记正在观察变化，避免循环重聚合
      this.observingMarkerChanges = true;
      
      // 使用DOM MutationObserver监听图层子元素变化
      // 这只能监听到渲染到DOM的变化，所以还需要额外的事件监听
      if (typeof MutationObserver !== 'undefined') {
        const layerElement = (this.markerLayerGroup as any)._container;
        if (layerElement) {
          this.markerChangeObserver = new MutationObserver(() => {
            this.scheduleRecluster();
          });
          
          this.markerChangeObserver.observe(layerElement, {
            childList: true,
            subtree: true
          });
          
          info('开始监听标记点DOM变化');
        }
      }
      
      // 监听原始图层的添加/移除事件
      this.markerLayerGroup.on('layeradd', this.handleMarkerLayerChange, this);
      this.markerLayerGroup.on('layerremove', this.handleMarkerLayerChange, this);
      
      info('开始监听标记点图层变化事件');
    } catch (e) {
      error('启动标记点变化监听失败:', e);
      this.observingMarkerChanges = false;
    }
  }

  /**
   * 停止监听标记点图层变化
   */
  private stopObservingMarkerChanges(): void {
    // 停止MutationObserver
    if (this.markerChangeObserver) {
      this.markerChangeObserver.disconnect();
      this.markerChangeObserver = null;
    }
    
    // 停止事件监听
    if (this.markerLayerGroup) {
      this.markerLayerGroup.off('layeradd', this.handleMarkerLayerChange, this);
      this.markerLayerGroup.off('layerremove', this.handleMarkerLayerChange, this);
    }
    
    // 清除可能存在的重聚合定时器
    if (this.reclusterTimeout !== null) {
      window.clearTimeout(this.reclusterTimeout);
      this.reclusterTimeout = null;
    }
    
    this.observingMarkerChanges = false;
    info('停止监听标记点图层变化');
  }

  /**
   * 处理标记点图层变化事件
   */
  private handleMarkerLayerChange(e: any): void {
    if (!this.enabled || !this.options.autoRecluster) return;
    
    const layer = e.layer;
    
    // 检查是否是标记点
    if (layer instanceof L.Marker) {
      const marker = layer as LeafletMarker;
      const options = marker.options as CustomMarkerOptions;
      
      if (e.type === 'layeradd') {
        // 标记点被添加到原始图层
        if (options.markerClusterable !== false && options.markerId) {
          this.addMarker(marker);
        }
      } else if (e.type === 'layerremove') {
        // 标记点从原始图层被移除
        if (options.markerId && this.originalMarkers.has(options.markerId)) {
          this.removeMarker(options.markerId);
        }
      }
      
      this.scheduleRecluster();
    }
  }

  /**
   * 安排一个延迟的重聚合操作，防止频繁更新
   */
  private scheduleRecluster(): void {
    if (!this.enabled || !this.options.autoRecluster) return;
    
    // 清除已有的定时器
    if (this.reclusterTimeout !== null) {
      window.clearTimeout(this.reclusterTimeout);
    }
    
    // 设置新的定时器
    this.reclusterTimeout = window.setTimeout(() => {
      this.reclusterMarkers();
      this.reclusterTimeout = null;
    }, this.options.reclusterDelay || 300);
  }

  /**
   * 执行重聚合操作
   */
  private reclusterMarkers(): void {
    if (!this.enabled || !this.clusterLayer) return;
    
    try {
      info('执行标记点重聚合');
      
      // 强制聚合图层重新处理所有标记
      this.clusterLayer.refreshClusters();
      
      // 发出重聚合完成事件
      this.emit('cluster-enabled', { reclustered: true });
    } catch (e) {
      error('标记点重聚合失败:', e);
    }
  }
} 