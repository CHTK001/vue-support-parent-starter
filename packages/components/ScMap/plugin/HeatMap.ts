import type { Map as LeafletMap, LayerGroup, LatLng } from 'leaflet';
import L from 'leaflet';
import { info, warn, error } from "@repo/utils";
import type { HeatMapOptions } from '../types';

// 检查leaflet.heat插件是否已经加载
const checkHeatPlugin = (): boolean => {
  if (!(L as any).heatLayer) {
    warn('未找到热力图插件，热力图功能将不可用');
    return false;
  }
  return true;
};

// 动态加载leaflet.heat插件
const loadHeatPlugin = async (): Promise<boolean> => {
  if ((L as any).heatLayer) {
    return true;
  }
  
  try {
    await import('leaflet.heat');
    return true;
  } catch (e) {
    console.error('Failed to load leaflet.heat', e);
    warn('热力图功能将不可用: 请安装 leaflet.heat 依赖');
    return false;
  }
};

// 热力图事件类型
export type HeatMapEventType = 'heatmap-enabled' | 'heatmap-disabled' | 'heatmap-data-updated';

// 热力图事件监听器类型
export type HeatMapEventListener = (event?: any) => void;

// 热力点数据接口
export interface HeatPoint {
  lat: number;
  lng: number;
  value: number;
}

export class HeatMap {
  private map: LeafletMap;
  private heatLayer: any = null;
  private enabled: boolean = false;
  private options: HeatMapOptions;
  private data: HeatPoint[] = [];
  private eventListeners: Map<HeatMapEventType, Set<HeatMapEventListener>> = new Map();

  constructor(map: LeafletMap, options: HeatMapOptions = {}) {
    this.map = map;
    
    // 默认选项
    const defaultOptions = {
      radius: 25,          // 热力点半径
      blur: 15,            // 模糊度
      maxOpacity: 0.8,     // 最大不透明度
      minOpacity: 0.1,     // 最小不透明度
      gradient: {          // 颜色渐变
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      },
      scaleRadius: false,  // 是否随地图缩放改变半径
      useLocalExtrema: false, // 是否使用局部极值
      latField: 'lat',     // 纬度字段
      lngField: 'lng',     // 经度字段
      valueField: 'value'  // 权重字段
    };
    
    // 合并选项
    this.options = { ...defaultOptions, ...options };
    
    // 初始化事件监听器Map
    ['heatmap-enabled', 'heatmap-disabled', 'heatmap-data-updated'].forEach(eventType => {
      this.eventListeners.set(eventType as HeatMapEventType, new Set());
    });
    
    // 检查插件可用性
    if (!checkHeatPlugin()) {
      info('正在动态加载热力图插件');
      loadHeatPlugin().then(success => {
        if (success) {
          info('热力图插件加载成功');
          this.initHeatLayer();
        }
      });
    } else {
      this.initHeatLayer();
    }
  }
  
  /**
   * 初始化热力图层
   */
  private initHeatLayer(): void {
    if (!checkHeatPlugin()) return;
    
    try {
      // 配置热力图层
      this.heatLayer = (L as any).heatLayer([], {
        radius: this.options.radius,
        blur: this.options.blur,
        maxOpacity: this.options.maxOpacity,
        minOpacity: this.options.minOpacity,
        gradient: this.options.gradient,
        scaleRadius: this.options.scaleRadius,
        useLocalExtrema: this.options.useLocalExtrema
      });
      
      info('热力图层初始化成功');
    } catch (e) {
      error('初始化热力图层失败:', e);
    }
  }
  
  /**
   * 启用热力图
   */
  enable(): boolean {
    if (this.enabled) return true;
    
    if (!this.heatLayer) {
      if (!checkHeatPlugin()) {
        warn('热力图插件未加载，无法启用热力图');
        return false;
      }
      this.initHeatLayer();
    }
    
    try {
      // 添加热力图层到地图
      this.heatLayer.addTo(this.map);
      this.enabled = true;
      
      // 延迟设置数据，确保地图完全准备好
      setTimeout(() => {
        // 如果有数据，立即更新显示
        if (this.data.length > 0) {
          const points = this.data.map(point => [
            point.lat,
            point.lng,
            point.value
          ]);
          
          this.heatLayer.setLatLngs(points);
        }
      }, 100);
      
      this.emit('heatmap-enabled');
      info('热力图已启用');
      return true;
    } catch (e) {
      error('启用热力图失败:', e);
      return false;
    }
  }
  
  /**
   * 禁用热力图
   */
  disable(): boolean {
    if (!this.enabled || !this.heatLayer) return false;
    
    try {
      // 从地图移除热力图层
      this.map.removeLayer(this.heatLayer);
      this.enabled = false;
      
      this.emit('heatmap-disabled');
      info('热力图已禁用');
      return true;
    } catch (e) {
      error('禁用热力图失败:', e);
      return false;
    }
  }
  
  /**
   * 切换热力图状态
   */
  toggle(): boolean {
    return this.enabled ? this.disable() : this.enable();
  }
  
  /**
   * 获取热力图启用状态
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * 设置热力图数据
   * @param data 热力点数据数组
   */
  setData(data: HeatPoint[]): boolean {
    // 保存原始数据，无论热力图层是否已初始化
    this.data = data;
    
    if (!this.heatLayer) {
      // 如果热力图层未初始化，等待初始化后再设置数据
      warn('热力图层未准备好，数据已保存但未应用');
      return false;
    }
    
    if (!this.enabled) {
      // 如果热力图未启用，不要尝试设置数据
      info('热力图未启用，数据已保存但未应用');
      return true;
    }
    
    try {
      // 确保地图已经初始化且不在动画中
      if (this.map && !this.map._animatingZoom) {
        // 转换数据格式为leaflet.heat要求的格式
        const points = data.map(point => [
          point.lat,
          point.lng,
          point.value
        ]);
        
        // 更新热力图数据
        this.heatLayer.setLatLngs(points);
        
        this.emit('heatmap-data-updated', { count: data.length });
        return true;
      } else {
        // 如果地图正在动画中，等待动画结束后再设置数据
        setTimeout(() => this.setData(data), 500);
        return true;
      }
    } catch (e) {
      error('设置热力图数据失败:', e);
      return false;
    }
  }
  
  /**
   * 添加单个热力点
   * @param point 热力点数据
   */
  addPoint(point: HeatPoint): boolean {
    if (!this.heatLayer) {
      if (!checkHeatPlugin()) {
        warn('热力图插件未加载，无法添加点');
        return false;
      }
      this.initHeatLayer();
    }
    
    try {
      // 添加点到热力图
      this.heatLayer.addLatLng([point.lat, point.lng, point.value]);
      
      // 更新内部数据
      this.data.push(point);
      
      return true;
    } catch (e) {
      error('添加热力点失败:', e);
      return false;
    }
  }
  
  /**
   * 获取热力图数据
   */
  getData(): HeatPoint[] {
    return [...this.data];
  }
  
  /**
   * 清空热力图数据
   */
  clearData(): boolean {
    if (!this.heatLayer) return false;
    
    try {
      this.setData([]);
      return true;
    } catch (e) {
      error('清空热力图数据失败:', e);
      return false;
    }
  }
  
  /**
   * 更新热力图选项
   * @param options 热力图选项
   */
  updateOptions(options: Partial<HeatMapOptions>): boolean {
    this.options = { ...this.options, ...options };
    
    if (!this.heatLayer) return false;
    
    const wasEnabled = this.enabled;
    
    try {
      // 重新创建热力图层以应用新选项
      if (wasEnabled) {
        this.disable();
      }
      
      this.initHeatLayer();
      
      // 重新设置数据
      if (this.data.length > 0) {
        this.setData(this.data);
      }
      
      // 如果之前是启用状态，继续启用
      if (wasEnabled) {
        this.enable();
      }
      
      return true;
    } catch (e) {
      error('更新热力图选项失败:', e);
      return false;
    }
  }
  
  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  on(event: HeatMapEventType, listener: HeatMapEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener);
  }
  
  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  off(event: HeatMapEventType, listener: HeatMapEventListener): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.delete(listener);
    }
  }
  
  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: HeatMapEventType, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach(listener => {
        listener(data);
      });
    }
  }
  
  /**
   * 销毁热力图
   */
  destroy(): void {
    if (this.enabled) {
      this.disable();
    }
    
    this.eventListeners.clear();
    this.data = [];
    this.heatLayer = null;
  }

  /**
   * 从标记点生成热力数据
   */
  generateFromMarkers(markerLayerGroup: LayerGroup, weightField: string = 'markerWeight'): boolean {
    if (!this.heatLayer) return false;
    
    try {
      const heatPoints: HeatPoint[] = [];
      
      // 遍历所有可见的标记点
      markerLayerGroup.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const marker = layer as L.Marker;
          const options = marker.options as any;
          const position = marker.getLatLng();
          
          // 获取权重，如果没有则默认为1
          const weight = options[weightField] || options.markerCustomData?.[weightField] || 1;
          
          heatPoints.push({
            lat: position.lat,
            lng: position.lng,
            value: weight
          });
        }
      });
      
      // 更新热力图数据
      this.setData(heatPoints);
      info(`从标记点生成热力图，共${heatPoints.length}个点`);
      return true;
    } catch (e) {
      error('从标记点生成热力图失败:', e);
      return false;
    }
  }
} 