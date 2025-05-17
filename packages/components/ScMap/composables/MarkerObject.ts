/**
 * 标记点对象
 * @description 管理地图标记点的添加、更新、删除等操作
 */
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import logger from './LogObject';
import type { MarkerOptions, MarkerConfig } from '../types/marker';

export class MarkerObject {
  private mapInstance: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private markerLayer: L.LayerGroup;
  private clickListener: ((event: L.LeafletMouseEvent) => void) | null = null;
  
  // 标记配置
  private config: MarkerConfig = {
    scaleWithZoom: true,
    groupIcon: {},
    baseZoom: 10,
    zoomFactor: 0.03,
    minScale: 0.8,
    maxScale: 1.2
  };

  /**
   * 构造函数
   * @param mapInstance Leaflet地图实例
   * @param config 标记配置
   */
  constructor(mapInstance: L.Map, config?: MarkerConfig) {
    this.mapInstance = mapInstance;
    
    // 创建标记图层
    this.markerLayer = L.layerGroup().addTo(this.mapInstance);
    
    // 合并配置
    if (config) {
      this.config = {
        ...this.config,
        ...config
      };
    }
    
    // 绑定地图缩放事件以更新标记大小
    if (this.config.scaleWithZoom) {
      this.mapInstance.on('zoomend', () => this.updateMarkersScale());
    }
    
    logger.debug('MarkerObject已初始化');
  }

  /**
   * 设置标记配置
   * @param config 标记配置
   */
  public setConfig(config: MarkerConfig): void {
    const oldScaleWithZoom = this.config.scaleWithZoom;
    
    // 合并配置
    this.config = {
      ...this.config,
      ...config
    };
    
    // 处理缩放监听
    if (!oldScaleWithZoom && this.config.scaleWithZoom) {
      // 添加监听
      this.mapInstance.on('zoomend', () => this.updateMarkersScale());
    } else if (oldScaleWithZoom && !this.config.scaleWithZoom) {
      // 移除监听
      this.mapInstance.off('zoomend');
    }
    
    // 立即应用新配置
    if (this.config.scaleWithZoom) {
      this.updateMarkersScale();
    }
    
    logger.debug('标记配置已更新', this.config);
  }

  /**
   * 更新标记的缩放比例
   */
  private updateMarkersScale(): void {
    if (!this.config.scaleWithZoom) return;
    
    const currentZoom = this.mapInstance.getZoom();
    const baseZoom = this.config.baseZoom || 10;
    const zoomFactor = this.config.zoomFactor || 0.03;
    const minScale = this.config.minScale || 0.8;
    const maxScale = this.config.maxScale || 1.2;
    
    // 根据当前缩放级别计算比例
    const zoomDiff = currentZoom - baseZoom;
    let scale = 1 + (zoomDiff * zoomFactor);
    
    // 限制比例范围
    scale = Math.max(minScale, Math.min(maxScale, scale));
    
    // 应用到所有标记
    this.markers.forEach((marker, id) => {
      const icon = marker.getIcon();
      if (icon instanceof L.DivIcon) {
        // 尝试获取原始大小
        const element = marker.getElement();
        if (element) {
          const iconElement = element.querySelector('.leaflet-marker-custom-icon');
          if (iconElement) {
            (iconElement as HTMLElement).style.transform = `scale(${scale})`;
          }
        }
      }
    });
    
    logger.debug(`标记缩放比例已更新: ${scale.toFixed(2)}`);
  }

  /**
   * 创建标记点
   * @param options 标记选项
   * @returns 标记ID
   */
  public addMarker(options: MarkerOptions): string {
    const id = options.id || uuidv4();
    
    try {
      // 创建LatLng对象
      const latlng = L.latLng(options.position[0], options.position[1]);
      
      // 创建图标
      let icon: L.Icon | L.DivIcon;
      if (options.iconUrl) {
        // 使用自定义图片图标
        icon = L.icon({
          iconUrl: options.iconUrl,
          iconSize: options.iconSize || [32, 32],
          iconAnchor: options.iconAnchor || [16, 32],
          popupAnchor: options.popupAnchor || [0, -32],
          className: 'custom-marker-icon'
        });
      } else if (options.iconHtml) {
        // 使用HTML内容作为图标
        icon = L.divIcon({
          html: options.iconHtml,
          className: options.className || 'leaflet-marker-custom-icon',
          iconSize: options.iconSize || [32, 32],
          iconAnchor: options.iconAnchor || [16, 32]
        });
      } else if (options.groupType && this.config.groupIcon[options.groupType]) {
        // 使用分组图标
        const groupIcon = this.config.groupIcon[options.groupType];
        if (typeof groupIcon === 'string') {
          // 分组图标为URL
          icon = L.icon({
            iconUrl: groupIcon,
            iconSize: options.iconSize || [32, 32],
            iconAnchor: options.iconAnchor || [16, 32],
            popupAnchor: options.popupAnchor || [0, -32],
            className: 'group-marker-icon'
          });
        } else {
          // 分组图标为对象
          icon = L.icon({
            iconUrl: groupIcon.url,
            iconSize: groupIcon.size || options.iconSize || [32, 32],
            iconAnchor: groupIcon.anchor || options.iconAnchor || [16, 32],
            popupAnchor: groupIcon.popupAnchor || options.popupAnchor || [0, -32],
            className: 'group-marker-icon'
          });
        }
      } else {
        // 使用默认图标
        icon = L.divIcon({
          html: `<div class="default-marker" style="background-color:${options.color || '#1890ff'}"></div>`,
          className: 'leaflet-marker-default-icon',
          iconSize: options.iconSize || [24, 24],
          iconAnchor: options.iconAnchor || [12, 12]
        });
      }
      
      // 创建标记点
      const marker = L.marker(latlng, {
        icon: icon,
        draggable: options.draggable || false,
        title: options.title || '',
        alt: options.alt || '',
        opacity: options.opacity !== undefined ? options.opacity : 1,
        zIndexOffset: options.zIndex || 0,
        riseOnHover: options.riseOnHover || false
      });
      
      // 存储数据
      marker.options.id = id;
      marker.options.data = options.data || {};
      
      // 绑定点击事件
      marker.on('click', (e) => {
        this.handleMarkerClick(id, e);
      });
      
      // 绑定拖拽事件
      if (options.draggable) {
        marker.on('dragend', (e) => {
          this.handleMarkerDragEnd(id, e);
        });
      }
      
      // 添加到图层
      marker.addTo(this.markerLayer);
      
      // 存储标记引用
      this.markers.set(id, marker);
      
      logger.debug(`添加标记点: ${id}`, options.position);
      return id;
    } catch (error) {
      logger.error(`添加标记点失败:`, error);
      return '';
    }
  }

  /**
   * 处理标记点点击事件
   * @param id 标记ID
   * @param event 点击事件
   */
  private handleMarkerClick(id: string, event: L.LeafletMouseEvent): void {
    const marker = this.markers.get(id);
    if (!marker) return;
    
    // 触发回调
    if (this.clickListener) {
      this.clickListener(event);
    }
    
    logger.debug(`标记点点击: ${id}`);
  }

  /**
   * 处理标记点拖拽结束事件
   * @param id 标记ID
   * @param event 拖拽事件
   */
  private handleMarkerDragEnd(id: string, event: L.DragEndEvent): void {
    const marker = this.markers.get(id);
    if (!marker) return;
    
    const latlng = marker.getLatLng();
    logger.debug(`标记点拖拽结束: ${id}`, [latlng.lat, latlng.lng]);
  }

  /**
   * 设置标记点点击监听器
   * @param listener 监听函数
   */
  public setClickListener(listener: (event: L.LeafletMouseEvent) => void): void {
    this.clickListener = listener;
  }

  /**
   * 更新标记点
   * @param id 标记ID
   * @param options 标记选项
   * @returns 是否更新成功
   */
  public updateMarker(id: string, options: Partial<MarkerOptions>): boolean {
    const marker = this.markers.get(id);
    if (!marker) {
      logger.warn(`更新标记点失败: ${id} 不存在`);
      return false;
    }
    
    try {
      // 更新位置
      if (options.position) {
        marker.setLatLng(L.latLng(options.position[0], options.position[1]));
      }
      
      // 更新图标
      if (options.iconUrl || options.iconHtml || (options.groupType && this.config.groupIcon[options.groupType])) {
        let icon: L.Icon | L.DivIcon;
        
        if (options.iconUrl) {
          // 使用自定义图片图标
          icon = L.icon({
            iconUrl: options.iconUrl,
            iconSize: options.iconSize || [32, 32],
            iconAnchor: options.iconAnchor || [16, 32],
            popupAnchor: options.popupAnchor || [0, -32],
            className: 'custom-marker-icon'
          });
        } else if (options.iconHtml) {
          // 使用HTML内容作为图标
          icon = L.divIcon({
            html: options.iconHtml,
            className: options.className || 'leaflet-marker-custom-icon',
            iconSize: options.iconSize || [32, 32],
            iconAnchor: options.iconAnchor || [16, 32]
          });
        } else if (options.groupType && this.config.groupIcon[options.groupType]) {
          // 使用分组图标
          const groupIcon = this.config.groupIcon[options.groupType];
          if (typeof groupIcon === 'string') {
            // 分组图标为URL
            icon = L.icon({
              iconUrl: groupIcon,
              iconSize: options.iconSize || [32, 32],
              iconAnchor: options.iconAnchor || [16, 32],
              popupAnchor: options.popupAnchor || [0, -32],
              className: 'group-marker-icon'
            });
          } else {
            // 分组图标为对象
            icon = L.icon({
              iconUrl: groupIcon.url,
              iconSize: groupIcon.size || options.iconSize || [32, 32],
              iconAnchor: groupIcon.anchor || options.iconAnchor || [16, 32],
              popupAnchor: groupIcon.popupAnchor || options.popupAnchor || [0, -32],
              className: 'group-marker-icon'
            });
          }
        }
        
        marker.setIcon(icon);
      }
      
      // 更新标题
      if (options.title) {
        marker.options.title = options.title;
        const el = marker.getElement();
        if (el) {
          el.setAttribute('title', options.title);
        }
      }
      
      // 更新不透明度
      if (options.opacity !== undefined) {
        marker.setOpacity(options.opacity);
      }
      
      // 更新z-index
      if (options.zIndex !== undefined) {
        marker.setZIndexOffset(options.zIndex);
      }
      
      // 更新可拖拽性
      if (options.draggable !== undefined) {
        if (options.draggable) {
          marker.dragging?.enable();
        } else {
          marker.dragging?.disable();
        }
      }
      
      // 更新数据
      if (options.data) {
        marker.options.data = {
          ...marker.options.data,
          ...options.data
        };
      }
      
      logger.debug(`更新标记点: ${id}`);
      return true;
    } catch (error) {
      logger.error(`更新标记点失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 移除标记点
   * @param id 标记ID
   * @returns 是否移除成功
   */
  public removeMarker(id: string): boolean {
    const marker = this.markers.get(id);
    if (!marker) {
      logger.warn(`移除标记点失败: ${id} 不存在`);
      return false;
    }
    
    try {
      // 从图层移除
      this.markerLayer.removeLayer(marker);
      // 从集合移除
      this.markers.delete(id);
      
      logger.debug(`移除标记点: ${id}`);
      return true;
    } catch (error) {
      logger.error(`移除标记点失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 获取标记点
   * @param id 标记ID
   * @returns 标记对象
   */
  public getMarker(id: string): L.Marker | null {
    return this.markers.get(id) || null;
  }

  /**
   * 获取所有标记点
   * @returns 标记点集合
   */
  public getAllMarkers(): Map<string, L.Marker> {
    return this.markers;
  }

  /**
   * 清除所有标记点
   */
  public clearAll(): void {
    // 清空图层
    this.markerLayer.clearLayers();
    // 清空集合
    this.markers.clear();
    
    logger.debug('清除所有标记点');
  }

  /**
   * 显示所有标记点
   */
  public showAll(): void {
    if (!this.mapInstance.hasLayer(this.markerLayer)) {
      this.markerLayer.addTo(this.mapInstance);
    }
    
    logger.debug('显示所有标记点');
  }

  /**
   * 隐藏所有标记点
   */
  public hideAll(): void {
    if (this.mapInstance.hasLayer(this.markerLayer)) {
      this.markerLayer.removeFrom(this.mapInstance);
    }
    
    logger.debug('隐藏所有标记点');
  }

  /**
   * 获取标记点数量
   * @returns 标记点数量
   */
  public getCount(): number {
    return this.markers.size;
  }

  /**
   * 销毁对象，清理资源
   */
  public destroy(): void {
    // 清除事件监听
    this.mapInstance.off('zoomend');
    
    // 清空标记点
    this.clearAll();
    
    // 从地图移除图层
    if (this.mapInstance.hasLayer(this.markerLayer)) {
      this.mapInstance.removeLayer(this.markerLayer);
    }
    
    // 清空监听器
    this.clickListener = null;
    
    logger.debug('MarkerObject已销毁');
  }
} 