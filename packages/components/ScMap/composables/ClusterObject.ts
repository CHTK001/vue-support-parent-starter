/**
 * 聚合对象
 * @description 管理地图标记点聚合的显示和配置
 */
import L from 'leaflet';
import 'leaflet.markercluster';
import logger from './LogObject';
import { AggregationOptions } from '../types/cluster';

/**
 * 默认聚合配置
 */
const DEFAULT_CLUSTER_CONFIG: AggregationOptions = {
  maxClusterRadius: 80,
  radiusUnit: 'pixel',
  color: '#1677ff',
  borderColor: '#ffffff',
  showCount: true,
  zoomToBoundsOnClick: true,
  useWeightAsSize: true,
  enablePulse: true,
  enableAnimation: true,
  pulseFrequency: 1,
  colorRanges: [
    { value: 10, color: '#5470c6' },
    { value: 50, color: '#91cc75' },
    { value: 100, color: '#fac858' },
    { value: 200, color: '#ee6666' }
  ]
};

/**
 * 聚合对象类
 */
export class ClusterObject {
  private mapInstance: L.Map | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private config: AggregationOptions = DEFAULT_CLUSTER_CONFIG;
  private enabled: boolean = false;
  private clickHandlers: Array<(marker: L.Marker, id: string) => void> = [];
  private clusterClickHandlers: Array<(markers: L.Marker[], center: L.LatLng) => void> = [];
  
  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 聚合配置
   */
  constructor(mapInstance: L.Map | null = null, config?: Partial<AggregationOptions>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (config) {
      this.setConfig(config);
    }
    
    logger.debug('ClusterObject已初始化');
  }
  
  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: L.Map): void {
    this.mapInstance = mapInstance;
    
    // 创建聚合组
    this.createClusterGroup();
    
    logger.debug('聚合对象已设置地图实例');
  }
  
  /**
   * 设置聚合配置
   * @param config 聚合配置
   */
  public setConfig(config: Partial<AggregationOptions>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // 如果已经创建了聚合组，则需要重新创建
    if (this.clusterGroup && this.mapInstance) {
      // 保存当前的标记
      const currentMarkers = Array.from(this.markers.values());
      
      // 从地图移除当前聚合组
      this.mapInstance.removeLayer(this.clusterGroup);
      
      // 创建新的聚合组
      this.createClusterGroup();
      
      // 将原有标记添加到新聚合组
      currentMarkers.forEach(marker => {
        this.clusterGroup?.addLayer(marker);
      });
      
      // 如果启用了聚合，将新聚合组添加到地图
      if (this.enabled) {
        this.clusterGroup.addTo(this.mapInstance);
      }
    }
    
    logger.debug('聚合配置已更新', this.config);
  }
  
  /**
   * 创建聚合组
   * @private
   */
  private createClusterGroup(): void {
    // 创建自定义图标生成函数
    const iconCreateFunction = (cluster: L.MarkerCluster): L.DivIcon => {
      const childCount = cluster.getChildCount();
      let size = 40; // 默认大小
      
      if (this.config.useWeightAsSize) {
        // 根据数量调整大小
        size = Math.min(60, Math.max(40, 40 + Math.log10(childCount) * 10));
      }
      
      // 获取聚合点颜色
      const color = this.getColorForSize(childCount);
      
      // 创建聚合点样式
      const divStyle = `
        width: ${size}px;
        height: ${size}px;
        line-height: ${size}px;
        text-align: center;
        background-color: ${color};
        color: white;
        border: 2px solid ${this.config.borderColor};
        border-radius: 50%;
        font-weight: bold;
      `;
      
      // 如果启用脉冲效果，添加动画样式
      let animationStyle = '';
      if (this.config.enablePulse) {
        const pulseSize = size * 1.3;
        
        animationStyle = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.3; }
            100% { transform: scale(1); opacity: 1; }
          }
          .cluster-pulse::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${pulseSize}px;
            height: ${pulseSize}px;
            margin-top: -${pulseSize / 2}px;
            margin-left: -${pulseSize / 2}px;
            background-color: ${color};
            border-radius: 50%;
            z-index: -1;
            opacity: 0.6;
            animation: pulse 1.5s infinite ease-in-out;
          }
        `;
      }
      
      const html = this.config.showCount 
        ? `<div style="${divStyle}" class="${this.config.enablePulse ? 'cluster-pulse' : ''}">${childCount}</div>` 
        : `<div style="${divStyle}" class="${this.config.enablePulse ? 'cluster-pulse' : ''}"></div>`;
      
      const styleTag = this.config.enablePulse ? `<style>${animationStyle}</style>` : '';
      
      return L.divIcon({ 
        html: styleTag + html,
        className: 'custom-cluster-icon',
        iconSize: L.point(size, size)
      });
    };
    
    // 创建聚合组实例
    this.clusterGroup = L.markerClusterGroup({
      maxClusterRadius: this.config.maxClusterRadius,
      zoomToBoundsOnClick: this.config.zoomToBoundsOnClick,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: this.config.enableAnimation,
      iconCreateFunction
    });
    
    // 绑定聚合点点击事件
    this.clusterGroup.on('clusterclick', (e: any) => {
      const cluster = e.layer as L.MarkerCluster;
      const markers = cluster.getAllChildMarkers();
      const center = cluster.getLatLng();
      
      // 触发所有聚合点点击处理函数
      this.clusterClickHandlers.forEach(handler => {
        handler(markers, center);
      });
    });
    
    logger.debug('聚合组已创建');
  }
  
  /**
   * 根据数量获取颜色
   * @param count 数量
   * @returns 颜色值
   * @private
   */
  private getColorForSize(count: number): string {
    // 如果没有设置颜色范围，返回默认颜色
    if (!this.config.colorRanges || this.config.colorRanges.length === 0) {
      return this.config.color;
    }
    
    // 按照数值从大到小排序
    const sortedRanges = [...this.config.colorRanges].sort((a, b) => b.value - a.value);
    
    // 获取第一个小于等于count的范围
    for (const range of sortedRanges) {
      if (count >= range.value) {
        return range.color;
      }
    }
    
    // 如果所有范围都大于count，返回默认颜色
    return this.config.color;
  }
  
  /**
   * 添加标记点击事件处理函数
   * @param handler 处理函数
   */
  public addMarkerClickHandler(handler: (marker: L.Marker, id: string) => void): void {
    this.clickHandlers.push(handler);
    logger.debug('已添加标记点击事件处理函数');
  }
  
  /**
   * 添加聚合点点击事件处理函数
   * @param handler 处理函数
   */
  public addClusterClickHandler(handler: (markers: L.Marker[], center: L.LatLng) => void): void {
    this.clusterClickHandlers.push(handler);
    logger.debug('已添加聚合点点击事件处理函数');
  }
  
  /**
   * 添加标记
   * @param id 标记ID
   * @param marker 标记实例
   */
  public addMarker(id: string, marker: L.Marker): void {
    if (!this.clusterGroup) return;
    
    // 保存标记引用
    this.markers.set(id, marker);
    
    // 添加到聚合组
    this.clusterGroup.addLayer(marker);
    
    // 绑定点击事件
    marker.on('click', () => {
      // 触发所有点击处理函数
      this.clickHandlers.forEach(handler => {
        handler(marker, id);
      });
    });
    
    logger.debug(`已添加标记到聚合组: ${id}`);
  }
  
  /**
   * 添加多个标记
   * @param markers 标记对象：{id: 标记ID, marker: 标记实例}
   */
  public addMarkers(markers: Array<{ id: string, marker: L.Marker }>): void {
    if (!this.clusterGroup) return;
    
    // 将所有标记添加到聚合组
    const markerList: L.Marker[] = [];
    
    markers.forEach(({ id, marker }) => {
      // 保存标记引用
      this.markers.set(id, marker);
      
      // 添加到标记列表
      markerList.push(marker);
      
      // 绑定点击事件
      marker.on('click', () => {
        // 触发所有点击处理函数
        this.clickHandlers.forEach(handler => {
          handler(marker, id);
        });
      });
    });
    
    // 批量添加标记
    this.clusterGroup.addLayers(markerList);
    
    logger.debug(`已批量添加标记到聚合组: ${markers.length}个`);
  }
  
  /**
   * 移除标记
   * @param id 标记ID
   */
  public removeMarker(id: string): void {
    if (!this.clusterGroup) return;
    
    // 获取标记
    const marker = this.markers.get(id);
    if (!marker) {
      logger.warn(`移除标记失败: 找不到ID为${id}的标记`);
      return;
    }
    
    // 从聚合组移除
    this.clusterGroup.removeLayer(marker);
    
    // 从列表移除
    this.markers.delete(id);
    
    logger.debug(`已从聚合组移除标记: ${id}`);
  }
  
  /**
   * 清空所有标记
   */
  public clearMarkers(): void {
    if (!this.clusterGroup) return;
    
    // 清空聚合组
    this.clusterGroup.clearLayers();
    
    // 清空标记列表
    this.markers.clear();
    
    logger.debug('已清空所有标记');
  }
  
  /**
   * 获取标记数量
   * @returns 标记数量
   */
  public getMarkerCount(): number {
    return this.markers.size;
  }
  
  /**
   * 获取聚合组中的所有标记
   * @returns 标记实例列表
   */
  public getAllMarkers(): L.Marker[] {
    return Array.from(this.markers.values());
  }
  
  /**
   * 启用聚合功能
   */
  public enable(): void {
    if (this.enabled) return;
    
    // 如果有地图实例和聚合组，将聚合组添加到地图
    if (this.mapInstance && this.clusterGroup) {
      this.mapInstance.addLayer(this.clusterGroup);
      this.enabled = true;
      logger.debug('聚合功能已启用');
    } else {
      logger.error('启用聚合功能失败: 地图实例或聚合组未初始化');
    }
  }
  
  /**
   * 禁用聚合功能
   */
  public disable(): void {
    if (!this.enabled) return;
    
    // 如果有地图实例和聚合组，从地图移除聚合组
    if (this.mapInstance && this.clusterGroup) {
      this.mapInstance.removeLayer(this.clusterGroup);
      this.enabled = false;
      logger.debug('聚合功能已禁用');
    } else {
      logger.error('禁用聚合功能失败: 地图实例或聚合组未初始化');
    }
  }
  
  /**
   * 刷新聚合
   * 当标记位置或其他属性发生变化时调用
   */
  public refreshClusters(): void {
    if (!this.clusterGroup) return;
    
    this.clusterGroup.refreshClusters();
    logger.debug('聚合已刷新');
  }
  
  /**
   * 获取聚合功能是否启用
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * 销毁聚合对象
   */
  public destroy(): void {
    // 如果有地图实例和聚合组，从地图移除聚合组
    if (this.mapInstance && this.clusterGroup) {
      this.mapInstance.removeLayer(this.clusterGroup);
    }
    
    // 清空标记列表
    this.markers.clear();
    
    // 清空事件处理函数
    this.clickHandlers = [];
    this.clusterClickHandlers = [];
    
    // 置空引用
    this.clusterGroup = null;
    this.mapInstance = null;
    this.enabled = false;
    
    logger.debug('聚合对象已销毁');
  }
}
