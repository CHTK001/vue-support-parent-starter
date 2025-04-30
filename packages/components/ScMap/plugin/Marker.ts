import type { Map as LeafletMap, LatLng, LayerGroup, Marker as LeafletMarker, MarkerOptions, Icon, DivIcon } from 'leaflet';
import L from 'leaflet';
import { DEFAULT_MARKER_ICON, createMarkerIconHtml } from '../types/marker';
import { info, warn, error } from '@repo/utils';
import { h, render } from 'vue';
import MarkerDetailsPopup from '../components/MarkerDetailsPopup.vue';

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
  latlng: LatLng;
  options?: CustomMarkerOptions;
  data?: any; // 自定义数据
}

export class Marker {
  private map: LeafletMap;
  private active: boolean = false;
  private markerLayerGroup: LayerGroup;
  private clickableLayerGroup: LayerGroup; // 可点击的图层
  private nonClickableLayerGroup: LayerGroup; // 不可点击的图层
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
    
    // 确保LayerGroup正确创建并添加到地图
    try {
      // 创建两个图层组：
      // 1. 不可点击图层组 - 放在底部
      this.nonClickableLayerGroup = L.layerGroup();
      this.nonClickableLayerGroup.addTo(map);
      
      // 2. 可点击图层组 - 放在顶部
      this.clickableLayerGroup = L.layerGroup();
      this.clickableLayerGroup.addTo(map);
      
      // 保留主图层组引用，用于兼容现有代码
      this.markerLayerGroup = L.layerGroup();
      this.markerLayerGroup.addTo(map);
      
      // 设置图层的z-index
      this.setLayerZIndex();
    } catch (e) {
      error('初始化标记图层失败:', e);
      // 创建一个空的LayerGroup作为后备
      this.markerLayerGroup = L.layerGroup();
      this.clickableLayerGroup = L.layerGroup();
      this.nonClickableLayerGroup = L.layerGroup();
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
   * 设置图层的z-index
   * 确保可点击图层在上方，不可点击图层在下方
   */
  private setLayerZIndex(): void {
    try {
      if (!this.map || !this.clickableLayerGroup || !this.nonClickableLayerGroup) {
        this.addLog('标记工具.setLayerZIndex - 地图或图层未初始化');
        return;
      }

      // 确保在地图加载完成后执行
      setTimeout(() => {
        try {
          // 1. 确保将clickableLayerGroup放在较高的z-index
          // 在Leaflet中，通常无法直接设置LayerGroup的z-index
          // 相反，我们通过将图层添加到不同的pane来控制顺序
          
          // 清除原有图层
          this.map.removeLayer(this.clickableLayerGroup);
          this.map.removeLayer(this.nonClickableLayerGroup);
          
          // 创建自定义pane用于可点击标记
          if (!this.map.getPane('clickableMarkerPane')) {
            this.map.createPane('clickableMarkerPane');
            const clickablePane = this.map.getPane('clickableMarkerPane');
            if (clickablePane) {
              // 设置高于普通标记层的z-index (markerPane通常为600)
              clickablePane.style.zIndex = '650';
              // 确保鼠标事件不被阻止
              clickablePane.style.pointerEvents = 'auto';
              this.addLog('标记工具.setLayerZIndex - 创建可点击标记层 z-index:650');
            }
          }
          
          // 创建自定义pane用于不可点击标记
          if (!this.map.getPane('nonClickableMarkerPane')) {
            this.map.createPane('nonClickableMarkerPane');
            const nonClickablePane = this.map.getPane('nonClickableMarkerPane');
            if (nonClickablePane) {
              // 设置为覆盖物层级 (overlayPane通常为400)
              nonClickablePane.style.zIndex = '400';
              // 禁用鼠标事件，确保不响应点击
              nonClickablePane.style.pointerEvents = 'none';
              this.addLog('标记工具.setLayerZIndex - 创建不可点击标记层 z-index:400');
            }
          }
          
          // 获取已有标记
          const existingMarkers = Array.from(this.markers.values());
          
          // 创建新的图层组，使用自定义pane
          this.clickableLayerGroup = L.layerGroup();
          this.nonClickableLayerGroup = L.layerGroup();
          
          // 重新添加标记到合适的图层
          for (const marker of existingMarkers) {
            const options = marker.options as CustomMarkerOptions;
            
            // 从地图移除旧标记
            this.map.removeLayer(marker);
            
            // 设置pane属性到正确的pane
            // 这一步关键是要创建新的标记实例
            const newMarker = L.marker(marker.getLatLng(), {
              ...marker.options,
              pane: options.markerClickable !== false ? 'clickableMarkerPane' : 'nonClickableMarkerPane',
              interactive: options.markerClickable !== false,
              bubblingMouseEvents: false
            });
            
            // 保存自定义选项
            newMarker.options = {...options};
            
            // 添加到相应图层
            if (options.markerClickable !== false) {
              // 重新绑定点击事件
              newMarker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                
                if (typeof options.markerClickFunction === 'function') {
                  options.markerClickFunction(newMarker, e);
                } else {
                  this.showMarkerDetails(newMarker);
                }
                
                this.emit('marker-click', newMarker, e);
              });
              
              newMarker.addTo(this.clickableLayerGroup);
              
              // 设置光标样式
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
            } else {
              newMarker.addTo(this.nonClickableLayerGroup);
            }
            
            // 更新标记引用
            if (options.markerId) {
              this.markers.set(options.markerId, newMarker);
            }
            
            // 如果有标签，重新添加
            if (options.markerLabel && options.markerShowLabel && this.labelsVisible) {
              this.addLabelToMarker(newMarker, options.markerLabel, options.markerColor);
            }
          }
          
          // 将图层添加到地图
          this.clickableLayerGroup.addTo(this.map);
          this.nonClickableLayerGroup.addTo(this.map);
          
          // 更新markerLayerGroup以保持兼容性
          this.markerLayerGroup = L.layerGroup();
          for (const marker of this.markers.values()) {
            marker.addTo(this.markerLayerGroup);
          }
          this.markerLayerGroup.addTo(this.map);
          
          this.addLog('标记工具.setLayerZIndex - 图层z-index设置完成');
        } catch (e) {
          error('重置图层z-index失败:', e);
          this.addLog('标记工具.setLayerZIndex - 重置图层z-index失败', e);
        }
      }, 100); // 延迟执行确保地图已经完成初始化
    } catch (e) {
      error('设置图层z-index失败:', e);
      this.addLog('标记工具.setLayerZIndex - 设置图层z-index失败', e);
    }
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
        this.clickableLayerGroup = L.layerGroup().addTo(this.map);
        this.nonClickableLayerGroup = L.layerGroup().addTo(this.map);
        this.setLayerZIndex();
        this.addLog('标记工具.addMarker - 初始化标记图层组');
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
        // 确保可点击标记使用markerPane，不可点击标记使用overlayPane
        pane: mergedOptions.markerClickable !== false ? 'clickableMarkerPane' : 'nonClickableMarkerPane',
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
      
      // 根据是否可点击，添加到不同的图层
      if (mergedOptions.markerClickable !== false) {
        // 添加到可点击图层
        marker.addTo(this.clickableLayerGroup);
        this.addLog('标记工具.addMarker - 标记已添加到可点击图层组');
        
        // 设置可点击的标记的光标样式
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
            this.addLog('标记工具.markerClick - 调用默认的标记详情显示');
            this.showMarkerDetails(marker);
          }
          
          // 触发标记点击事件
          this.emit('marker-click', marker, e);
        });
      } else {
        // 添加到不可点击图层
        marker.addTo(this.nonClickableLayerGroup);
        this.addLog('标记工具.addMarker - 标记已添加到不可点击图层组');
      }
      
      // 同时添加到主图层组，以保持兼容性
      marker.addTo(this.markerLayerGroup);
      this.addLog('标记工具.addMarker - 标记已添加到主图层组');
      
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
      this.clickableLayerGroup.removeLayer(marker);
      this.nonClickableLayerGroup.removeLayer(marker);
      
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
      this.clickableLayerGroup.removeLayer(marker);
      this.nonClickableLayerGroup.removeLayer(marker);
    });
  }

  /**
   * 显示指定分组的标记
   * @param groupName 分组名称
   */
  showGroup(groupName: string): void {
    const markers = this.getMarkersByGroup(groupName);
    markers.forEach(marker => {
      // 检查是否已经在任一图层中
      const isInAnyLayer = this.markerLayerGroup.hasLayer(marker) || 
                          this.clickableLayerGroup.hasLayer(marker) ||
                          this.nonClickableLayerGroup.hasLayer(marker);
      
      if (!isInAnyLayer) {
        // 根据标记的可点击状态决定添加到哪个图层
        const options = marker.options as CustomMarkerOptions;
        if (options && options.markerClickable !== false) {
          marker.addTo(this.clickableLayerGroup);
        } else {
          marker.addTo(this.nonClickableLayerGroup);
        }
        
        // 同时添加到主图层组，以保持兼容性
        marker.addTo(this.markerLayerGroup);
      }
    });
  }

  /**
   * 移除所有标记
   */
  clearMarkers(): void {
    this.markerLayerGroup.clearLayers();
    this.clickableLayerGroup.clearLayers();
    this.nonClickableLayerGroup.clearLayers();
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
      const isVisible = this.markerLayerGroup.hasLayer(marker) || 
                        this.clickableLayerGroup.hasLayer(marker) ||
                        this.nonClickableLayerGroup.hasLayer(marker);
      
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
      this.clickableLayerGroup.removeLayer(marker);
      this.nonClickableLayerGroup.removeLayer(marker);
    });
  }

  /**
   * 显示所有标记
   */
  showAllMarkers(): void {
    this.markers.forEach((marker) => {
      // 检查是否已经在任一图层中
      const isInAnyLayer = this.markerLayerGroup.hasLayer(marker) || 
                           this.clickableLayerGroup.hasLayer(marker) ||
                           this.nonClickableLayerGroup.hasLayer(marker);
      
      if (!isInAnyLayer) {
        // 根据标记的可点击状态决定添加到哪个图层
        const options = marker.options as CustomMarkerOptions;
        if (options && options.markerClickable !== false) {
          marker.addTo(this.clickableLayerGroup);
        } else {
          marker.addTo(this.nonClickableLayerGroup);
        }
        
        // 同时添加到主图层组，以保持兼容性
        marker.addTo(this.markerLayerGroup);
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
   * 销毁工具，清理资源
   */
  destroy(): void {
    this.deactivate();
    this.clearMarkers();
    this.map.removeLayer(this.markerLayerGroup);
    this.map.removeLayer(this.clickableLayerGroup);
    this.map.removeLayer(this.nonClickableLayerGroup);
    this.eventListeners.clear();
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
        hasExistingPopup: !!marker.getPopup()
      });
      
      // 先关闭现有弹窗
      if (marker.getPopup()) {
        marker.closePopup();
        // 强制解除绑定
        marker.unbindPopup();
        this.addLog('标记工具.showMarkerDetails - 已关闭并解绑现有弹窗');
      }
      
      // 创建容器元素
      const container = document.createElement('div');
      container.className = 'sc-map-marker-details-container';
      
      if (options.markerTemplate) {
        // 使用自定义模板
        container.innerHTML = options.markerTemplate;
        
        // 替换模板中的变量
        // 支持 {{变量名}} 格式的模板语法
        const templateVars = {
          title: options.markerLabel || '',
          lat: latlng.lat,
          lng: latlng.lng,
          ...options.markerCustomData
        };
        
        // 替换所有匹配的变量
        const templateContent = container.innerHTML;
        container.innerHTML = templateContent.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const trimmedKey = key.trim();
          return templateVars[trimmedKey] !== undefined ? String(templateVars[trimmedKey]) : match;
        });
      } else {
        // 使用默认的Vue组件
        const vnode = h(MarkerDetailsPopup, {
          title: options.markerLabel,
          lat: latlng.lat,
          lng: latlng.lng,
          customData: options.markerCustomData
        });
        
        // 渲染组件到容器
        render(vnode, container);
      }
      
      // 计算弹窗的偏移量，使其往上移动
      // offset[0]是X轴偏移，offset[1]是Y轴偏移，负值表示向上
      const popupOffset = L.point(0, -20); // Y轴向上偏移20像素，原来是-40
      
      // 创建一次性弹窗（不重复使用）
      const popup = L.popup({
        className: 'sc-map-marker-details-popup',
        autoPan: true,
        closeButton: true,
        offset: popupOffset,
        maxWidth: 300,
        minWidth: 200,
        maxHeight: 300, // 限制最大高度
        autoPanPadding: [50, 50], // 自动平移时的边距
        autoClose: true,
        closeOnClick: false // 防止点击弹窗时关闭
      });
      
      // 设置弹窗内容和位置
      popup.setContent(container);
      popup.setLatLng(latlng);
      
      // 添加关闭事件监听
      popup.on('remove', () => {
        this.addLog('标记工具.showMarkerDetails - 弹窗移除事件触发');
      });
      
      // 关闭时自动解除引用
      popup.on('close', () => {
        this.addLog('标记工具.showMarkerDetails - 弹窗关闭事件触发');
        // 确保标记上没有绑定的弹窗
        if (marker.getPopup()) {
          marker.unbindPopup();
        }
      });
      
      // 直接打开弹窗而不绑定到标记
      popup.openOn(this.map);
      
      this.addLog('标记工具.showMarkerDetails - 标记详情弹窗已显示', {
        markerId: options.markerId,
        position: [latlng.lat, latlng.lng],
        offset: popupOffset
      });
    } catch (e) {
      error('显示标记详情失败:', e);
      this.addLog('标记工具.showMarkerDetails - 显示详情失败', e);
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
      
      // 从所有图层中移除
      this.clickableLayerGroup.removeLayer(marker);
      this.nonClickableLayerGroup.removeLayer(marker);
      
      // 重新创建并添加到正确的图层
      if (clickable) {
        // 设置到markerPane
        this.map.removeLayer(marker);
        
        // 创建新的标记来替换
        const newMarker = L.marker(marker.getLatLng(), {
          ...marker.options,
          pane: 'markerPane'
        });
        
        // 复制属性和事件
        newMarker.options = {...options};
        
        // 添加到可点击图层
        newMarker.addTo(this.clickableLayerGroup);
        
        // 设置光标样式
        setTimeout(() => {
          try {
            const element = newMarker.getElement();
            if (element) {
              element.style.cursor = 'pointer';
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
        
        // 更新标记集合
        if (options.markerId) {
          this.markers.set(options.markerId, newMarker);
        }
        
        // 同时添加到主图层组，以保持兼容性
        newMarker.addTo(this.markerLayerGroup);
        
        // 如果有标签，重新添加
        if (options.markerLabel && options.markerShowLabel && this.labelsVisible) {
          this.addLabelToMarker(newMarker, options.markerLabel, options.markerColor);
        }
        
        this.addLog('标记工具.updateMarkerClickable - 标记已设置为可点击', {markerId: options.markerId});
        return true;
      } else {
        // 设置到overlayPane
        this.map.removeLayer(marker);
        
        // 创建新的标记来替换
        const newMarker = L.marker(marker.getLatLng(), {
          ...marker.options,
          pane: 'overlayPane'
        });
        
        // 复制属性
        newMarker.options = {...options};
        
        // 添加到不可点击图层
        newMarker.addTo(this.nonClickableLayerGroup);
        
        // 更新标记集合
        if (options.markerId) {
          this.markers.set(options.markerId, newMarker);
        }
        
        // 同时添加到主图层组，以保持兼容性
        newMarker.addTo(this.markerLayerGroup);
        
        // 如果有标签，重新添加
        if (options.markerLabel && options.markerShowLabel && this.labelsVisible) {
          this.addLabelToMarker(newMarker, options.markerLabel, options.markerColor);
        }
        
        this.addLog('标记工具.updateMarkerClickable - 标记已设置为不可点击', {markerId: options.markerId});
        return true;
      }
    } catch (e) {
      error('更新标记可点击状态失败:', e);
      this.addLog('标记工具.updateMarkerClickable - 更新标记可点击状态失败', e);
      return false;
    }
  }
} 