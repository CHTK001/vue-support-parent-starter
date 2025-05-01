import type { Map as LeafletMap, LatLng, LayerGroup, Marker as LeafletMarker, MarkerOptions, Icon, DivIcon } from 'leaflet';
import L from 'leaflet';
import { DEFAULT_MARKER_ICON, createMarkerIconHtml } from '../types/marker';
import { info, warn, error } from '@repo/utils';
import { h, render, createApp } from 'vue';
import MarkerDetailsPopup from '../components/MarkerDetailsPopup.vue';

// 定义标记大小常量
export const MARKER_SIZE = 32; // 标记大小（像素）

// 定义事件类型
export type MarkerEventType = 'marker-add' | 'marker-remove' | 'marker-click';

// 定义事件监听器类型
export type MarkerEventListener = (marker?: LeafletMarker, event?: any) => void;

//经纬度
export type MarkerLatLng = {
  lat: number;
  lng: number;
};
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
  markerClickable?: boolean;     // 是否可点击（默认true）
  markerClickFunction?: (marker: LeafletMarker, event?: any) => void; // 点击事件处理函数
  markerTemplate?: string;       // 自定义HTML模板，用于标记详情弹窗
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
  latlng: LatLng | [number, number]; // 支持纯经纬度数组
  options?: Partial<CustomMarkerOptions>;
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
  private addLog: Function;
  private currentIcon: Icon | DivIcon;
  private eventListeners: Map<MarkerEventType, Set<MarkerEventListener>> = new Map();
  // 全局标签显示状态
  private labelsVisible: boolean = true;

  constructor(map: LeafletMap, addLog: Function) {
    this.map = map;
    this.addLog = addLog;
    
    // 只创建并保留markerLayerGroup图层
    try {
      // 创建单个图层组
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
    
    // 添加地图缩放事件监听，确保在缩放时关闭所有popup
    this.map.on('zoomstart', () => {
      try {
        // 关闭地图上所有popup
        this.map.closePopup();
        
        // 清理所有markers上的popup
        this.getMarkers().forEach(marker => {
          if (marker.getPopup()) {
            marker.closePopup();
            marker.unbindPopup();
          }
        });
        
        this.addLog('标记工具.zoomstart - 已清理所有弹窗');
      } catch (e) {
        error('缩放时清理弹窗失败:', e);
      }
    });
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
    this.addLog('标记工具.activate - 开始激活标记工具');
    if (!this.active) {
      this.active = true;
      this.map.on('click', this.clickHandler);
      this.addLog('标记工具.activate - 已绑定点击事件处理器');
      // 改变鼠标样式
      L.DomUtil.addClass(this.map.getContainer(), 'marker-cursor');
      this.addLog('标记工具.activate - 已更改鼠标样式');
    } else {
      this.addLog('标记工具.activate - 标记工具已处于激活状态');
    }
  }

  /**
   * 停用标记工具
   */
  deactivate(): void {
    this.addLog('标记工具.deactivate - 开始停用标记工具');
    if (this.active) {
      this.active = false;
      this.map.off('click', this.clickHandler);
      this.addLog('标记工具.deactivate - 已解除点击事件绑定');
      // 恢复鼠标样式
      L.DomUtil.removeClass(this.map.getContainer(), 'marker-cursor');
      this.addLog('标记工具.deactivate - 已恢复默认鼠标样式');
    } else {
      this.addLog('标记工具.deactivate - 标记工具已处于停用状态');
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
    this.addLog('标记工具.addMarker - 开始添加标记点', {latlng, options});
    try {
      // 确保markerLayerGroup已初始化
      if (!this.markerLayerGroup) {
        this.markerLayerGroup = L.layerGroup().addTo(this.map);
        this.addLog('标记工具.addMarker - 初始化标记图层组');
      }
      
      // 检查地图是否正在缩放，如果是则关闭所有弹窗
      if (this.map._animatingZoom) {
        this.map.closePopup();
      }
      
      const defaultOptions: CustomMarkerOptions = {
        icon: this.currentIcon || this.defaultIcon,
        markerId: `marker-${Date.now()}`,
        autoPanOnFocus: true, // 自动平移到标记
        markerClickable: true, // 默认可点击
      };
      
      // 合并选项
      const mergedOptions: CustomMarkerOptions = { ...defaultOptions, ...options };
      this.addLog('标记工具.addMarker - 合并选项', mergedOptions);
      
      // 根据全局标签显示状态调整单个标记的标签显示状态
      // 如果全局标签状态为隐藏，则无论如何都不显示标签
      if (!this.labelsVisible) {
        mergedOptions.markerShowLabel = false;
      }
      
      // 转换为Leaflet MarkerOptions
      const leafletOptions: MarkerOptions = {
        // 使用默认的markerPane
        pane: 'markerPane',
        // 转换icon为Leaflet参数
        icon: mergedOptions.icon,
        // 转换autoPanOnFocus为Leaflet参数
        autoPan: mergedOptions.autoPanOnFocus,
        // 如果有设置不透明度
        opacity: mergedOptions.markerOpacity,
        // 转换z-index偏移量
        zIndexOffset: mergedOptions.markerZIndexOffset || 0,
        // 转换可拖拽属性
        draggable: mergedOptions.markerDraggable,
        // 其他Leaflet支持的原生属性
        title: mergedOptions.markerLabel,
        alt: mergedOptions.markerLabel,
        riseOnHover: true, // 鼠标悬停时提升层级
        riseOffset: 250, // 提升的层级偏移量
        interactive: mergedOptions.markerClickable !== false, // 确保可点击标记的interactive属性为true
        bubblingMouseEvents: false // 防止鼠标事件冒泡
      };
      
      // 创建标记
      const marker = L.marker(latlng, leafletOptions);
      this.addLog('标记工具.addMarker - 标记实例已创建');
      
      // 存储自定义数据
      marker.options = { ...leafletOptions, ...mergedOptions };
      
      // 添加到图层
      marker.addTo(this.markerLayerGroup);
      this.addLog('标记工具.addMarker - 标记已添加到图层组');
      
      // 设置可点击标记的光标样式
      if (mergedOptions.markerClickable !== false) {
        setTimeout(() => {
          try {
            const element = marker.getElement();
            if (element) {
              // 添加可点击的光标样式
              element.style.cursor = 'pointer';
              // 添加调试类，便于检查
              element.classList.add('clickable-marker');
            }
          } catch (e) {
            error('设置标记光标样式失败:', e);
          }
        }, 0);

        // 调试信息，确认点击事件绑定
        this.addLog('标记工具.addMarker - 绑定点击事件到标记', {
          markerId: mergedOptions.markerId,
          hasCustomClickFn: typeof mergedOptions.markerClickFunction === 'function'
        });
        
        // 确保点击事件绑定正确
        marker.on('click', (e) => {
          this.addLog('标记工具.markerClick - 标记点击事件触发', {
            markerId: mergedOptions.markerId,
            latlng: e.latlng
          });
          
          // 阻止事件冒泡到地图
          L.DomEvent.stopPropagation(e);
          
          // 如果提供了自定义点击函数，则调用它
          if (typeof mergedOptions.markerClickFunction === 'function') {
            this.addLog('标记工具.markerClick - 调用自定义点击处理函数');
            mergedOptions.markerClickFunction(marker, e);
          } else {
            // 默认行为：显示标记详情
            this.showMarkerDetails(marker);
          }
          
          // 触发标记点击事件
          this.emit('marker-click', marker, e);
        });
      }
      
      // 添加到标记组
      if (mergedOptions.markerId) {
        this.markers.set(mergedOptions.markerId, marker);
        this.addLog('标记工具.addMarker - 标记已添加到内部管理集合', {markerId: mergedOptions.markerId});
      
        // 如果指定了分组，添加到对应分组
        if (mergedOptions.markerGroup) {
          this.addMarkerToGroup(mergedOptions.markerId, mergedOptions.markerGroup);
          this.addLog('标记工具.addMarker - 标记已添加到分组', {group: mergedOptions.markerGroup});
        }
      }
      
      // 如果指定了标签，添加标签
      if (mergedOptions.markerLabel && mergedOptions.markerShowLabel && this.labelsVisible) {
        this.addLabelToMarker(marker, mergedOptions.markerLabel, mergedOptions.markerColor);
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
      
      // 处理数组形式的经纬度
      let latlng: LatLng;
      if (Array.isArray(data.latlng)) {
        latlng = L.latLng(data.latlng[0], data.latlng[1]);
      } else {
        latlng = data.latlng;
      }
      
      return this.addMarker(latlng, options);
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
      // 从图层中移除标记
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
      // 检查是否已经在图层中
      const isInLayer = this.markerLayerGroup.hasLayer(marker);
      
      if (!isInLayer) {
        // 添加到图层
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
      // 获取标记元素并设置透明度为0
      const element = marker.getElement();
      if (element) {
        element.style.opacity = '0';
      }
      // 设置marker选项中的可见性标志
      const options = marker.options as CustomMarkerOptions;
      if (options) {
        options.markerVisible = false;
      }
      // 关闭任何已打开的工具提示
      if (marker.getTooltip()) {
        marker.closeTooltip();
      }
    });
  }

  /**
   * 显示所有标记
   */
  showAllMarkers(): void {
    this.markers.forEach((marker) => {
      // 获取标记元素并恢复透明度
      const element = marker.getElement();
      if (element) {
        element.style.opacity = '1';
      }
      // 设置marker选项中的可见性标志
      const options = marker.options as CustomMarkerOptions;
      if (options) {
        options.markerVisible = true;
        // 如果设置了标签且全局标签可见，则显示标签
        if (this.labelsVisible && options.markerShowLabel && options.markerLabel) {
          this.addLabelToMarker(marker, options.markerLabel, options.markerColor);
        }
      }
    });
  }

  /**
   * 隐藏所有标记点标签
   */
  hideAllLabels(): void {
    try {
      // 更新全局标签显示状态
      this.labelsVisible = false;
      
      this.markers.forEach((marker) => {
        // 关闭已有的tooltip
        if (marker.getTooltip()) {
          marker.closeTooltip();
          // 解绑tooltip
          marker.unbindTooltip();
        }
        
        // 更新marker标记显示状态
        const options = marker.options as CustomMarkerOptions;
        if (options) {
          // 注意：我们不修改单个标记的 markerShowLabel 属性，
          // 这样在恢复标签时可以保持原来的设置
          // 因为全局标签状态的优先级更高
        }
      });
      
      this.addLog('标记工具.hideAllLabels - 已隐藏所有标记点标签');
      info('隐藏了所有标记点标签');
    } catch (e) {
      error('隐藏所有标记点标签失败:', e);
    }
  }

  /**
   * 显示所有标记点标签
   */
  showAllLabels(): void {
    try {
      // 更新全局标签显示状态
      this.labelsVisible = true;
      
      this.markers.forEach((marker) => {
        const options = marker.options as CustomMarkerOptions;
        if (options) {
          // 只有标记设置为显示标签的才显示
          if (options.markerShowLabel && options.markerLabel) {
            this.addLabelToMarker(marker, options.markerLabel, options.markerColor);
          }
        }
      });
      
      this.addLog('标记工具.showAllLabels - 已显示所有标记点标签');
      info('显示了所有标记点标签');
    } catch (e) {
      error('显示所有标记点标签失败:', e);
    }
  }

  /**
   * 获取当前标签显示状态
   * @returns 标签是否可见
   */
  getLabelsVisible(): boolean {
    return this.labelsVisible;
  }

  /**
   * 设置标签显示状态
   * @param visible 是否显示标签
   */
  setLabelsVisible(visible: boolean): void {
    if (visible === this.labelsVisible) {
      return; // 状态未变，不做处理
    }
    
    if (visible) {
      this.showAllLabels();
    } else {
      this.hideAllLabels();
    }
  }

  /**
   * 显示标记详情
   * @param marker 标记对象
   */
  private showMarkerDetails(marker: LeafletMarker): void {
    try {
      const options = marker.options as CustomMarkerOptions;
      const latlng = marker.getLatLng();
      
      // 记录调试信息
      this.addLog('标记工具.showMarkerDetails - 开始显示标记详情', {
        markerId: options.markerId,
        position: [latlng.lat, latlng.lng]
      });
      
      // 关闭地图上所有弹窗，避免多个弹窗引起冲突
      this.map.closePopup();
      
      // 创建自定义弹窗容器
      const customPopupId = `marker-popup-${options.markerId || Date.now()}`;
      let customPopupContainer = document.getElementById(customPopupId);
      
      // 如果容器不存在，创建一个新的
      if (!customPopupContainer) {
        customPopupContainer = document.createElement('div');
        customPopupContainer.id = customPopupId;
        customPopupContainer.className = 'sc-map-custom-popup';
        document.body.appendChild(customPopupContainer);
      }
      
      // 计算弹窗在屏幕上的位置
      const point = this.map.latLngToContainerPoint(latlng);
      const mapContainer = this.map.getContainer();
      const mapRect = mapContainer.getBoundingClientRect();
      
      // 设置弹窗样式和位置
      Object.assign(customPopupContainer.style, {
        position: 'absolute',
        zIndex: '1000',
        left: `${mapRect.left + point.x}px`,
        top: `${mapRect.top + point.y - 120}px`, // 上移120px显示在marker上方
        boxShadow: '0 3px 14px rgba(0,0,0,0.4)',
        background: 'white',
        borderRadius: '4px',
        padding: '10px',
        maxWidth: '300px',
        minWidth: '200px',
        maxHeight: '300px',
        overflowY: 'auto',
        transform: 'translate(-50%, -100%)', // 居中并显示在标记上方
        animation: 'popup-fade-in 0.2s ease-out'
      });
      
      // 清空现有内容
      customPopupContainer.innerHTML = '';
      
      // 关闭按钮
      const closeButton = document.createElement('div');
      closeButton.className = 'custom-popup-close-button';
      closeButton.innerHTML = '×';
      Object.assign(closeButton.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        padding: '5px 10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#555'
      });
      closeButton.addEventListener('click', () => {
        this.closeCustomPopup(customPopupId);
      });
      customPopupContainer.appendChild(closeButton);
      
      // 创建Vue应用实例
      const app = createApp(MarkerDetailsPopup, {
        title: options.markerLabel,
        lat: latlng.lat,
        lng: latlng.lng,
        customData: options.markerCustomData
      });
      
      // 渲染应用到容器
      app.mount(customPopupContainer);
      
      // 保存应用实例引用，以便后续销毁
      (customPopupContainer as any).__vueApp = app;
      
      // 为弹窗添加关闭外部点击事件
      setTimeout(() => {
        const closeOutsideClickHandler = (e: MouseEvent) => {
          if (!customPopupContainer?.contains(e.target as Node) && 
              e.target !== marker.getElement()) {
            this.closeCustomPopup(customPopupId);
            document.removeEventListener('click', closeOutsideClickHandler);
          }
        };
        document.addEventListener('click', closeOutsideClickHandler);
      }, 100);
      
      // 为地图添加缩放事件处理，关闭自定义弹窗
      const zoomStartHandler = () => {
        this.closeCustomPopup(customPopupId);
        this.map.off('zoomstart', zoomStartHandler);
      };
      this.map.on('zoomstart', zoomStartHandler);
      
      // 为地图添加移动事件处理，更新自定义弹窗位置
      const moveHandler = () => {
        if (customPopupContainer) {
          const newPoint = this.map.latLngToContainerPoint(latlng);
          const mapRect = mapContainer.getBoundingClientRect();
          
          Object.assign(customPopupContainer.style, {
            left: `${mapRect.left + newPoint.x}px`,
            top: `${mapRect.top + newPoint.y - 120}px`
          });
        }
      };
      this.map.on('move', moveHandler);
      
      // 弹窗关闭时需要清理的事件处理器
      (customPopupContainer as any).__mapEventHandlers = {
        zoomStart: zoomStartHandler,
        move: moveHandler
      };
      
      this.addLog('标记工具.showMarkerDetails - 自定义标记详情弹窗已显示', {
        markerId: options.markerId,
        popupId: customPopupId
      });
    } catch (e) {
      error('显示标记详情失败:', e);
      this.addLog('标记工具.showMarkerDetails - 显示详情失败', e);
    }
  }

  /**
   * 关闭自定义弹窗
   * @param popupId 弹窗ID
   */
  private closeCustomPopup(popupId: string): void {
    try {
      const popupContainer = document.getElementById(popupId);
      if (popupContainer) {
        // 销毁Vue应用实例
        const app = (popupContainer as any).__vueApp;
        if (app) {
          app.unmount();
        }
        
        // 移除地图事件监听
        const eventHandlers = (popupContainer as any).__mapEventHandlers;
        if (eventHandlers) {
          if (eventHandlers.zoomStart) {
            this.map.off('zoomstart', eventHandlers.zoomStart);
          }
          if (eventHandlers.move) {
            this.map.off('move', eventHandlers.move);
          }
        }
        
        // 从DOM中移除弹窗容器
        popupContainer.remove();
        
        this.addLog('标记工具.closeCustomPopup - 自定义弹窗已关闭', { popupId });
      }
    } catch (e) {
      error('关闭自定义弹窗失败:', e);
    }
  }

  /**
   * 销毁标记工具
   */
  destroy(): void {
    try {
      // 关闭所有弹窗
      this.map.closePopup();
      
      // 关闭所有自定义弹窗
      document.querySelectorAll('.sc-map-custom-popup').forEach(element => {
        const popupId = element.id;
        if (popupId) {
          this.closeCustomPopup(popupId);
        }
      });
      
      // 清除所有标记
      this.clearMarkers();
      
      // 移除图层
      this.map.removeLayer(this.markerLayerGroup);
      
      // 移除事件监听
      if (this.active) {
        this.map.off('click', this.clickHandler);
      }
      
      // 清空事件监听集合
      this.eventListeners.clear();
      
      // 移除缩放事件监听
      this.map.off('zoomstart');
      
      // 清空标记集合引用
      this.markers.clear();
      this.markerGroups.clear();
      
      this.addLog('标记工具.destroy - 标记工具销毁完成');
    } catch (e) {
      error('销毁标记工具失败:', e);
      this.addLog('标记工具.destroy - 销毁失败', e);
    }
  }

  /**
   * 更新标记的可点击状态
   * @param marker 标记对象或标记ID
   * @param clickable 是否可点击
   * @returns 是否更新成功
   */
  updateMarkerClickable(idOrMarker: string | LeafletMarker, clickable: boolean): boolean {
    try {
      let marker: LeafletMarker | undefined;
      
      if (typeof idOrMarker === 'string') {
        marker = this.markers.get(idOrMarker);
      } else {
        marker = idOrMarker;
      }
      
      if (!marker) {
        warn('找不到指定的标记');
        return false;
      }
      
      // 获取标记选项
      const options = marker.options as CustomMarkerOptions;
      if (!options) {
        warn('标记没有有效的选项');
        return false;
      }
      
      // 更新选项
      options.markerClickable = clickable;
      
      // 从图层中移除
      this.markerLayerGroup.removeLayer(marker);
      
      // 创建新的标记来替换
      const newMarker = L.marker(marker.getLatLng(), {
        ...marker.options,
        interactive: clickable // 设置是否可交互
      });
      
      // 复制属性
      newMarker.options = {...options};
      
      // 添加到图层
      newMarker.addTo(this.markerLayerGroup);
      
      // 设置光标样式
      if (clickable) {
        setTimeout(() => {
          try {
            const element = newMarker.getElement();
            if (element) {
              element.style.cursor = 'pointer';
              element.classList.add('clickable-marker');
            }
          } catch (e) {
            error('设置标记光标样式失败:', e);
          }
        }, 0);
        
        // 添加点击事件
        newMarker.on('click', (e) => {
          // 阻止事件冒泡
          L.DomEvent.stopPropagation(e);
          
          // 如果提供了自定义点击函数，则调用它
          if (typeof options.markerClickFunction === 'function') {
            options.markerClickFunction(newMarker, e);
          } else {
            // 默认行为：显示标记详情
            this.showMarkerDetails(newMarker);
          }
          
          // 触发标记点击事件
          this.emit('marker-click', newMarker, e);
        });
      }
      
      // 更新标记集合
      if (options.markerId) {
        this.markers.set(options.markerId, newMarker);
      }
      
      // 如果有标签，重新添加
      if (options.markerLabel && options.markerShowLabel && this.labelsVisible) {
        this.addLabelToMarker(newMarker, options.markerLabel, options.markerColor);
      }
      
      this.addLog('标记工具.updateMarkerClickable - 标记可点击状态已更新', {
        markerId: options.markerId,
        clickable: clickable
      });
      
      return true;
    } catch (e) {
      error('更新标记可点击状态失败:', e);
      this.addLog('标记工具.updateMarkerClickable - 更新标记可点击状态失败', e);
      return false;
    }
  }
} 