import type { Map as LeafletMap, LatLng, LayerGroup, Marker as LeafletMarker, MarkerOptions, Icon, DivIcon } from 'leaflet';
import L from 'leaflet';
import { DEFAULT_MARKER_ICON, createMarkerIconHtml } from '../types/marker';
import { info, warn, error } from '@repo/utils';

// 定义标记大小常量
export const MARKER_SIZE = 32; // 标记大小（像素）

// 定义事件类型
export type MarkerEventType = 'marker-add' | 'marker-remove' | 'marker-click';

// 定义事件监听器类型
export type MarkerEventListener = (marker?: LeafletMarker, event?: any) => void;

// 自定义标记选项接口，扩展Leaflet的MarkerOptions
export interface CustomMarkerOptions {
  markerId?: string;             // 标记唯一标识
  autoPanOnFocus?: boolean;      // 自动平移到标记
  markerGroup?: string;          // 标记分组
  markerLabel?: string;          // 标记标签
  markerColor?: string;          // 标记颜色
  markerIsHighlight?: boolean;   // 是否高亮显示
  markerIsSelected?: boolean;    // 是否选中
  markerShowLabel?: boolean;     // 是否显示标签
  markerCustomData?: any;        // 自定义数据
  icon?: Icon | DivIcon;         // 保留原生Leaflet的icon属性
  markerClickable?: boolean;     // 是否可点击
  markerDraggable?: boolean;     // 是否可拖拽
  markerClusterable?: boolean;   // 是否可聚合（默认true）
  markerVisible?: boolean;       // 是否可见
  markerZIndexOffset?: number;   // z-index偏移量
  markerOpacity?: number;        // 不透明度
  markerTooltipOptions?: any;    // 提示框选项
  markerPopupOptions?: any;      // 弹出框选项
  markerLayerOptions?: any;      // 图层选项
  markerWeight?: number;         // 权重参数，可用于聚合计算
}

// 定义标记数据接口
export interface MarkerData {
  id: string;
  latlng: LatLng;
  options?: CustomMarkerOptions;
  data?: any; // 自定义数据
}

export class Marker {
  private map: LeafletMap;
  private active: boolean = false;
  private markerLayerGroup: LayerGroup;
  private markers: Map<string, LeafletMarker> = new Map();
  private markerGroups: Map<string, Set<string>> = new Map();
  private clickHandler: (e: any) => void;
  private defaultIcon: Icon | DivIcon;
  private currentIcon: Icon | DivIcon;
  private eventListeners: Map<MarkerEventType, Set<MarkerEventListener>> = new Map();

  constructor(map: LeafletMap) {
    this.map = map;
    
    // 确保LayerGroup正确创建并添加到地图
    try {
      this.markerLayerGroup = L.layerGroup();
      this.markerLayerGroup.addTo(map);
    } catch (e) {
      error('初始化标记图层失败:', e);
      // 创建一个空的LayerGroup作为后备
      this.markerLayerGroup = L.layerGroup();
    }
    
    this.defaultIcon = L.divIcon({
      html: createMarkerIconHtml(DEFAULT_MARKER_ICON),
      iconSize: [MARKER_SIZE, MARKER_SIZE],
      iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE],
      className: 'sc-map-marker'
    });
    this.currentIcon = this.defaultIcon;

    // 初始化点击处理函数
    this.clickHandler = (e: any) => {
      if (this.active) {
        this.addMarker(e.latlng, {
          markerId: `marker-${Date.now()}`
        });
      }
    };
  }

  /**
   * 设置当前标记图标
   * @param icon 图标对象
   */
  setIcon(icon: Icon | DivIcon): void {
    this.currentIcon = icon;
  }

  /**
   * 重置为默认图标
   */
  resetIcon(): void {
    this.currentIcon = this.defaultIcon;
  }

  /**
   * 激活标记工具
   */
  activate(): void {
    if (!this.active) {
      this.active = true;
      this.map.on('click', this.clickHandler);
      // 改变鼠标样式
      L.DomUtil.addClass(this.map.getContainer(), 'marker-cursor');
    }
  }

  /**
   * 停用标记工具
   */
  deactivate(): void {
    if (this.active) {
      this.active = false;
      this.map.off('click', this.clickHandler);
      // 恢复鼠标样式
      L.DomUtil.removeClass(this.map.getContainer(), 'marker-cursor');
    }
  }

  /**
   * 切换标记工具激活状态
   */
  toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * 添加标记
   * @param latlng 经纬度
   * @param options 标记选项
   * @returns Marker实例
   */
  addMarker(latlng: LatLng, options: CustomMarkerOptions = {}): LeafletMarker {
    try {
      // 确保markerLayerGroup已初始化
      if (!this.markerLayerGroup) {
        this.markerLayerGroup = L.layerGroup().addTo(this.map);
      }
      
      const defaultOptions: CustomMarkerOptions = {
        icon: this.currentIcon || this.defaultIcon,
        markerId: `marker-${Date.now()}`,
        autoPanOnFocus: true, // 自动平移到标记
        markerClickable: true, // 默认可点击
      };
      
      // 合并选项
      const mergedOptions: CustomMarkerOptions = { ...defaultOptions, ...options };
      
      // 转换为Leaflet MarkerOptions
      const leafletOptions: MarkerOptions = {
        // 转换icon为Leaflet参数
        pane: 'markerPane',
        // 转换icon为Leaflet参数
        icon: mergedOptions.icon,
        // 转换autoPanOnFocus为Leaflet参数
        autoPan: mergedOptions.autoPanOnFocus,
        // 如果有设置不透明度
        opacity: mergedOptions.markerOpacity,
        // 转换z-index偏移量
        zIndexOffset: mergedOptions.markerZIndexOffset,
        // 转换可拖拽属性
        draggable: mergedOptions.markerDraggable,
        // 其他Leaflet支持的原生属性
        title: mergedOptions.markerLabel,
        alt: mergedOptions.markerLabel,
        riseOnHover: true, // 鼠标悬停时提升层级
        riseOffset: 250, // 提升的层级偏移量
      };
      
      // 创建标记
      const marker = L.marker(latlng, leafletOptions);
      
      // 存储自定义数据
      marker.options = { ...leafletOptions, ...mergedOptions };
      
      // 添加到地图
      marker.addTo(this.markerLayerGroup);
      
      // 添加到标记组
      if (mergedOptions.markerId) {
        this.markers.set(mergedOptions.markerId, marker);
      
        // 如果指定了分组，添加到对应分组
        if (mergedOptions.markerGroup) {
          this.addMarkerToGroup(mergedOptions.markerId, mergedOptions.markerGroup);
        }
      }
      
      // 如果指定了标签，添加标签
      if (mergedOptions.markerLabel && mergedOptions.markerShowLabel) {
        this.addLabelToMarker(marker, mergedOptions.markerLabel, mergedOptions.markerColor);
      }
      
      // 仅当markerClickable为true或未设置时添加点击事件
      if (mergedOptions.markerClickable !== false) {
        marker.on('click', (e) => {
          // 阻止事件冒泡
          L.DomEvent.stopPropagation(e);
          
          // 触发标记点击事件
          this.emit('marker-click', marker, e);
        });
      }
      
      // 触发标记添加事件
      this.emit('marker-add', marker);
      
      return marker;
    } catch (e) {
      error('添加标记失败:', e);
      throw e;
    }
  }

  /**
   * 添加标记到分组
   * @param markerId 标记ID
   * @param groupName 分组名称
   */
  private addMarkerToGroup(markerId: string, groupName: string): void {
    if (!this.markerGroups.has(groupName)) {
      this.markerGroups.set(groupName, new Set<string>());
    }
    
    this.markerGroups.get(groupName)?.add(markerId);
  }

  /**
   * 从分组中移除标记
   * @param markerId 标记ID
   * @param groupName 分组名称（可选，不提供则从所有分组中移除）
   */
  private removeMarkerFromGroup(markerId: string, groupName?: string): void {
    if (groupName) {
      // 从指定分组中移除
      const group = this.markerGroups.get(groupName);
      if (group) {
        group.delete(markerId);
        
        // 如果分组为空，删除分组
        if (group.size === 0) {
          this.markerGroups.delete(groupName);
        }
      }
    } else {
      // 从所有分组中移除
      this.markerGroups.forEach((group, name) => {
        group.delete(markerId);
        
        // 如果分组为空，删除分组
        if (group.size === 0) {
          this.markerGroups.delete(name);
        }
      });
    }
  }

  /**
   * 为标记添加标签
   * @param marker 标记对象
   * @param label 标签文本
   * @param color 标签颜色（可选）
   */
  private addLabelToMarker(marker: LeafletMarker, label: string, color?: string): void {
    try {
      const labelColor = color || '#333';
      
      // 检查marker是否有效并已添加到地图
      if (!marker || !marker.getLatLng) {
        warn('无效的标记对象，无法添加标签');
        return;
      }
      
      // 使用更安全的方式添加tooltip
      setTimeout(() => {
        try {
          if (!marker._map) {
            warn('标记未添加到地图，无法添加标签');
            return;
          }
          
          marker.bindTooltip(label, {
            permanent: true,
            direction: 'top',
            className: 'sc-map-marker-label',
            offset: [0, -MARKER_SIZE/2 - 5]
          });
          
          // 安全获取并设置tooltip样式
          const tooltip = marker.getTooltip();
          if (tooltip) {
            const element = tooltip.getElement();
            if (element && element instanceof HTMLElement) {
              element.style.color = labelColor;
            }
          }
        } catch (e) {
          error('设置标记标签样式失败:', e);
        }
      }, 0); // 使用setTimeout确保DOM已准备好
    } catch (e) {
      error('添加标记标签失败:', e);
    }
  }

  /**
   * 添加多个标记
   * @param markersData 标记数据数组
   * @returns 创建的标记对象数组
   */
  addMarkers(markersData: MarkerData[]): LeafletMarker[] {
    return markersData.map(data => {
      const options: CustomMarkerOptions = { ...(data.options || {}), markerId: data.id };
      if (data.data) {
        options.markerCustomData = data.data;
      }
      return this.addMarker(data.latlng, options);
    });
  }

  /**
   * 移除标记
   * @param idOrMarker 标记ID或标记对象
   * @returns 是否成功移除
   */
  removeMarker(idOrMarker: string | LeafletMarker): boolean {
    let marker: LeafletMarker | undefined;
    let id: string | undefined;

    if (typeof idOrMarker === 'string') {
      id = idOrMarker;
      marker = this.markers.get(id);
    } else {
      marker = idOrMarker;
      // 查找标记ID
      for (const [key, value] of this.markers.entries()) {
        if (value === marker) {
          id = key;
          break;
        }
      }
    }

    if (marker && id) {
      // 从地图上移除标记
      this.markerLayerGroup.removeLayer(marker);
      
      // 从标记集合中移除
      this.markers.delete(id);
      
      // 从所有分组中移除
      this.removeMarkerFromGroup(id);
      
      // 触发移除事件
      this.emit('marker-remove', marker);
      return true;
    }

    return false;
  }

  /**
   * 获取分组中的所有标记
   * @param groupName 分组名称
   * @returns 标记对象数组
   */
  getMarkersByGroup(groupName: string): LeafletMarker[] {
    const markerIds = this.markerGroups.get(groupName);
    if (!markerIds) return [];
    
    const groupMarkers: LeafletMarker[] = [];
    markerIds.forEach(id => {
      const marker = this.markers.get(id);
      if (marker) {
        groupMarkers.push(marker);
      }
    });
    
    return groupMarkers;
  }

  /**
   * 获取所有分组名称
   * @returns 分组名称数组
   */
  getGroupNames(): string[] {
    return Array.from(this.markerGroups.keys());
  }

  /**
   * 隐藏指定分组的标记
   * @param groupName 分组名称
   */
  hideGroup(groupName: string): void {
    const markers = this.getMarkersByGroup(groupName);
    markers.forEach(marker => {
      this.markerLayerGroup.removeLayer(marker);
    });
  }

  /**
   * 显示指定分组的标记
   * @param groupName 分组名称
   */
  showGroup(groupName: string): void {
    const markers = this.getMarkersByGroup(groupName);
    markers.forEach(marker => {
      if (!this.markerLayerGroup.hasLayer(marker)) {
        marker.addTo(this.markerLayerGroup);
      }
    });
  }

  /**
   * 移除所有标记
   */
  clearMarkers(): void {
    this.markerLayerGroup.clearLayers();
    this.markers.clear();
    this.markerGroups.clear();
  }

  /**
   * 获取所有标记
   * @returns 标记对象数组
   */
  getMarkers(): LeafletMarker[] {
    return Array.from(this.markers.values());
  }

  /**
   * 获取指定ID的标记
   * @param id 标记ID
   * @returns 标记对象
   */
  getMarkerById(id: string): LeafletMarker | undefined {
    return this.markers.get(id);
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  on(event: MarkerEventType, listener: MarkerEventListener): void {
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
  off(event: MarkerEventType, listener: MarkerEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param marker 标记对象
   * @param data 附加数据
   */
  private emit(event: MarkerEventType, marker?: LeafletMarker, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(marker, data));
    }
  }

  /**
   * 获取指定矩形区域内的可见标记
   * @param bounds 矩形区域边界 [[lat1, lng1], [lat2, lng2]]
   * @returns 区域内的标记数组
   */
  getMarkersInBounds(bounds: [[number, number], [number, number]]): LeafletMarker[] {
    // 创建Leaflet边界对象
    const latLngBounds = L.latLngBounds(
      L.latLng(bounds[0][0], bounds[0][1]),
      L.latLng(bounds[1][0], bounds[1][1])
    );
    
    // 筛选在边界内的标记
    const markersInBounds: LeafletMarker[] = [];
    this.markers.forEach(marker => {
      // 检查标记是否在图层上（即是否可见）
      const isVisible = this.markerLayerGroup.hasLayer(marker);
      
      // 检查标记是否在指定区域内
      const isInBounds = latLngBounds.contains(marker.getLatLng());
      
      // 如果标记可见且在区域内，则添加到结果数组
      if (isVisible && isInBounds) {
        markersInBounds.push(marker);
      }
    });
    
    return markersInBounds;
  }

  /**
   * 隐藏所有标记
   */
  hideAllMarkers(): void {
    this.markers.forEach((marker) => {
      this.markerLayerGroup.removeLayer(marker);
    });
  }

  /**
   * 显示所有标记
   */
  showAllMarkers(): void {
    this.markers.forEach((marker) => {
      if (!this.markerLayerGroup.hasLayer(marker)) {
        marker.addTo(this.markerLayerGroup);
      }
    });
  }

  /**
   * 销毁工具，清理资源
   */
  destroy(): void {
    this.deactivate();
    this.clearMarkers();
    this.map.removeLayer(this.markerLayerGroup);
    this.eventListeners.clear();
  }
} 