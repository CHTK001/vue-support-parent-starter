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
  
  // 添加状态跟踪变量
  private markersVisible: boolean = true; // 标记点是否可见
  private labelsVisible: boolean = true;  // 标签是否可见
  
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
      // 检查地图实例是否存在
      if (!this.mapInstance) {
        logger.error('添加标记点失败: 地图实例不存在');
        return '';
      }

      // 检查位置信息是否有效
      if (!options.position || options.position.length < 2 || 
          isNaN(options.position[0]) || isNaN(options.position[1])) {
        logger.error(`添加标记点失败: 无效的位置信息`, options.position);
        return '';
      }
      
      logger.debug(`正在添加标记点，ID: ${id}, 位置:`, options.position);
      
      // 创建LatLng对象 - 注意：Leaflet使用[lat, lng]顺序，而大多数GIS使用[lng, lat]
      // 判断坐标格式，如果是[lng, lat]格式，需要转换为[lat, lng]
      let lat = options.position[0];
      let lng = options.position[1];
      
      // 判断是否需要交换坐标 - 经度范围通常为-180到180，纬度范围通常为-90到90
      if (Math.abs(options.position[0]) > 90 && Math.abs(options.position[1]) <= 90) {
        // 可能是[lng, lat]格式，需要交换
        lat = options.position[1];
        lng = options.position[0];
        logger.debug(`检测到坐标顺序为[lng, lat]，已自动转换为[lat, lng]: [${lat}, ${lng}]`);
      }
      
      const latlng = L.latLng(lat, lng);
      
      // 创建图标
      let icon: L.Icon | L.DivIcon;
      if (options.icon?.iconUrl) {
        // 使用自定义图片图标
        icon = L.icon({
          iconUrl: options.icon.iconUrl,
          iconSize: options.icon.iconSize || [32, 32],
          iconAnchor: options.icon.iconAnchor || [16, 32],
          popupAnchor: options.icon.popupAnchor || [0, -32],
          className: options.icon.className || 'custom-marker-icon'
        });
      } else if (options.icon?.html) {
        // 使用HTML内容作为图标
        icon = L.divIcon({
          html: options.icon.html,
          className: options.icon.className || 'leaflet-marker-custom-icon',
          iconSize: options.icon.iconSize || [32, 32],
          iconAnchor: options.icon.iconAnchor || [16, 16]
        });
      } else if (options.group && this.config.groupIcon && this.config.groupIcon[options.group]) {
        // 使用分组图标
        const groupIcon = this.config.groupIcon[options.group];
        if (typeof groupIcon === 'string') {
          // 分组图标为URL字符串 (兼容旧版本写法)
          icon = L.icon({
            iconUrl: groupIcon,
            iconSize: options.icon?.iconSize || [32, 32],
            iconAnchor: options.icon?.iconAnchor || [16, 32],
            popupAnchor: options.icon?.popupAnchor || [0, -32],
            className: 'group-marker-icon'
          });
        } else {
          // 分组图标为对象
          icon = L.icon({
            iconUrl: groupIcon.iconUrl || '',
            iconSize: groupIcon.iconSize || options.icon?.iconSize || [32, 32],
            iconAnchor: groupIcon.iconAnchor || options.icon?.iconAnchor || [16, 32],
            popupAnchor: groupIcon.popupAnchor || options.icon?.popupAnchor || [0, -32],
            className: groupIcon.className || 'group-marker-icon'
          });
        }
      } else {
        // 使用默认图标 - 更明显的默认标记
        icon = L.divIcon({
          html: `<div class="default-marker" style="background-color:${options.icon?.backgroundColor || '#ff4500'}; width:100%; height:100%; border-radius:50%; border:2px solid white; box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
          className: 'leaflet-marker-default-icon',
          iconSize: options.icon?.iconSize || [24, 24],
          iconAnchor: options.icon?.iconAnchor || [12, 12]
        });
      }
      
      // 创建标记点
      const marker = L.marker(latlng, {
        icon: icon,
        draggable: options.draggable || false,
        title: options.title || '',
        opacity: options.visible === false ? 0 : 1,
        zIndexOffset: options.zIndexOffset || 0,
        riseOnHover: options.riseOnHover || false
      });
      
      // 存储数据
      marker.options.id = id;
      marker.options.data = options.data || {};
      
      // 绑定点击事件
      marker.on('click', (e) => {
        this.handleMarkerClick(id, e);
      });
      
      // 如果可拖拽，绑定拖拽结束事件
      if (options.draggable) {
        marker.on('dragend', (e) => {
          this.handleMarkerDragEnd(id, e);
        });
      }
      
      // 如果有标题且showLabel为true且标签当前可见，显示永久提示
      if (options.title && (options.showLabel || false) && this.labelsVisible) {
        marker.bindTooltip(options.title, {
          permanent: options.labelOptions?.permanent || true,
          direction: options.labelOptions?.direction || 'top',
          offset: options.labelOptions?.offset ? L.point(options.labelOptions.offset[0], options.labelOptions.offset[1]) : undefined,
          opacity: options.labelOptions?.opacity || 0.9,
          className: options.labelOptions?.className || ''
        });
      }
      
      // 如果有弹窗内容，绑定弹窗
      if (options.popupContent) {
        marker.bindPopup(options.popupContent);
      }
      
      // 确保markerLayer存在
      if (!this.markerLayer) {
        this.markerLayer = L.layerGroup().addTo(this.mapInstance);
        logger.debug('为标记点创建新的图层组');
      }
      
      // 添加到图层
      this.markerLayer.addLayer(marker);
      
      // 添加到集合
      this.markers.set(id, marker);
      
      // 设置初始可见性 - 根据当前全局标记可见性设置和指定的options.visible
      // 如果options.visible是明确设置的false，或者当前全局设置为隐藏，则隐藏标记点
      const shouldBeVisible = options.visible !== false && this.markersVisible;
      marker.options.visible = shouldBeVisible;
      marker.setOpacity(shouldBeVisible ? 1 : 0);

      // 如果标签不应该显示，则关闭tooltip
      if (marker.getTooltip() && !this.labelsVisible) {
        marker.closeTooltip();
      }
      
      logger.debug(`成功添加标记点: ${id}`, options.position);

      // 立即刷新标记缩放比例
      if (this.config.scaleWithZoom) {
        this.updateMarkersScale();
      }
      
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
   * @param id 标记点ID
   * @param options 标记点选项
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
        // 判断坐标格式，如果是[lng, lat]格式，需要转换为[lat, lng]
        let lat = options.position[0];
        let lng = options.position[1];
        
        // 判断是否需要交换坐标
        if (Math.abs(options.position[0]) > 90 && Math.abs(options.position[1]) <= 90) {
          // 可能是[lng, lat]格式，需要交换
          lat = options.position[1];
          lng = options.position[0];
          logger.debug(`updateMarker: 检测到坐标顺序为[lng, lat]，已自动转换为[lat, lng]: [${lat}, ${lng}]`);
        }
        
        const latlng = L.latLng(lat, lng);
        marker.setLatLng(latlng);
      }
      
      // 更新标题
      if (options.title !== undefined) {
        marker.options.title = options.title;
        
        // 如果有提示框，更新提示框内容
        if (marker.getTooltip()) {
          marker.setTooltipContent(options.title);
        }
      }
      
      // 更新图标
      if (options.icon?.iconUrl || options.icon?.html || (options.group && this.config.groupIcon[options.group])) {
        let icon: L.Icon | L.DivIcon;
        
        if (options.icon?.iconUrl) {
          // 使用自定义图片图标
          icon = L.icon({
            iconUrl: options.icon.iconUrl,
            iconSize: options.icon.iconSize,
            iconAnchor: options.icon.iconAnchor,
            popupAnchor: options.icon.popupAnchor,
            className: options.icon.className || 'custom-marker-icon'
          });
        } else if (options.icon?.html) {
          // 使用HTML内容作为图标
          icon = L.divIcon({
            html: options.icon.html,
            className: options.icon.className || 'leaflet-marker-custom-icon',
            iconSize: options.icon.iconSize,
            iconAnchor: options.icon.iconAnchor
          });
        } else if (options.group && this.config.groupIcon[options.group]) {
          // 使用分组图标
          const groupIcon = this.config.groupIcon[options.group];
          if (typeof groupIcon === 'string') {
            // 分组图标为URL字符串 (兼容旧版本写法)
            icon = L.icon({
              iconUrl: groupIcon,
              iconSize: options.icon?.iconSize || [32, 32],
              iconAnchor: options.icon?.iconAnchor || [16, 32],
              popupAnchor: options.icon?.popupAnchor || [0, -32],
              className: 'group-marker-icon'
            });
          } else {
            // 分组图标为对象
            icon = L.icon({
              iconUrl: groupIcon.iconUrl || '',
              iconSize: groupIcon.iconSize || options.icon?.iconSize || [32, 32],
              iconAnchor: groupIcon.iconAnchor || options.icon?.iconAnchor || [16, 32],
              popupAnchor: groupIcon.popupAnchor || options.icon?.popupAnchor || [0, -32],
              className: groupIcon.className || 'group-marker-icon'
            });
          }
        }
        
        // 设置图标
        marker.setIcon(icon!);
      }
      
      // 更新显示状态
      if (options.visible !== undefined) {
        marker.options.visible = options.visible;
        marker.setOpacity(options.visible ? 1 : 0);
      }
      
      // 更新Z轴偏移
      if (options.zIndexOffset !== undefined) {
        marker.setZIndexOffset(options.zIndexOffset);
      }
      
      // 更新弹窗内容
      if (options.popupContent !== undefined) {
        if (marker.getPopup()) {
          marker.setPopupContent(options.popupContent);
        } else {
          marker.bindPopup(options.popupContent);
        }
      }
      
      // 更新提示框选项
      if (options.showLabel !== undefined) {
        if (options.showLabel && options.title && !marker.getTooltip()) {
          // 添加提示框
          marker.bindTooltip(options.title, {
            permanent: options.labelOptions?.permanent || true,
            direction: options.labelOptions?.direction || 'top',
            offset: options.labelOptions?.offset ? L.point(options.labelOptions.offset[0], options.labelOptions.offset[1]) : undefined,
            opacity: options.labelOptions?.opacity || 0.9,
            className: options.labelOptions?.className || ''
          });
        } else if (!options.showLabel && marker.getTooltip()) {
          // 移除提示框
          marker.unbindTooltip();
        }
      }
      
      // 更新自定义数据
      if (options.data !== undefined) {
        marker.options.data = {
          ...marker.options.data,
          ...options.data
        };
      }
      
      // 更新可拖拽状态
      if (options.draggable !== undefined && marker.dragging) {
        if (options.draggable) {
          marker.dragging.enable();
        } else {
          marker.dragging.disable();
        }
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

  /**
   * 获取标记点数量
   * @returns 标记点数量
   */
  public getMarkerCount(): number {
    return this.markers.size;
  }

  /**
   * 隐藏所有标记点
   * @returns 隐藏的标记点数量
   */
  public hideAllMarkers(): number {
    let count = 0;
    this.markers.forEach((marker) => {
      if (marker.options.visible !== false) {
        marker.setOpacity(0);
        marker.options.visible = false;
        count++;
      }
    });
    // 更新标记点可见性状态
    this.markersVisible = false;
    logger.debug(`已隐藏 ${count} 个标记点，全局标记点可见性设为false`);
    return count;
  }

  /**
   * 显示所有标记点
   * @returns 显示的标记点数量
   */
  public showAllMarkers(): number {
    let count = 0;
    this.markers.forEach((marker) => {
      if (marker.options.visible === false) {
        marker.setOpacity(1);
        marker.options.visible = true;
        count++;
      }
    });
    // 更新标记点可见性状态
    this.markersVisible = true;
    logger.debug(`已显示 ${count} 个标记点，全局标记点可见性设为true`);
    return count;
  }

  /**
   * 获取当前的弹出框
   * @returns 当前的弹出框对象
   */
  public getCurrentPopover(): any {
    // 在实际实现中，这里应该返回当前显示的弹出框
    let currentPopover = null;
    this.markers.forEach((marker) => {
      if (marker.isPopupOpen()) {
        currentPopover = marker.getPopup();
      }
    });
    return currentPopover;
  }

  /**
   * 隐藏所有标签
   * @returns 隐藏的标签数量
   */
  public hideAllLabels(): number {
    // 更新标签可见性状态
    this.labelsVisible = false;
    logger.debug(`全局标签可见性设为false`);
    
    // 调用hideAllPopovers作为实现
    return this.hideAllPopovers();
  }

  /**
   * 显示所有标签
   * @returns 显示的标签数量
   */
  public showAllLabels(): number {
    // 更新标签可见性状态
    this.labelsVisible = true;
    logger.debug(`全局标签可见性设为true`);
    
    let count = 0;
    this.markers.forEach((marker) => {
      // 只处理可见的标记点
      if (marker.options.visible !== false) {
        // 判断标记点是否有标题，如果有标题则显示标签
        if (marker.options.title) {
          // 如果已有tooltip但处于关闭状态，则重新打开
          if (marker.getTooltip()) {
            marker.openTooltip();
            count++;
          } 
          // 如果没有tooltip，创建一个新的
          else {
            marker.bindTooltip(marker.options.title, {
              permanent: true,
              direction: 'top',
              className: marker.options.labelOptions?.className || ''
            }).openTooltip();
            count++;
          }
        }
      }
    });
    logger.debug(`已显示 ${count} 个标记点标签`);
    return count;
  }

  /**
   * 隐藏所有弹出框
   * @returns 隐藏的弹出框数量
   */
  public hideAllPopovers(): number {
    let count = 0;
    this.markers.forEach((marker) => {
      // 检查popup
      if (marker.getPopup() && marker.isPopupOpen()) {
        marker.closePopup();
        count++;
      }
      
      // 检查tooltip - 先确认tooltip存在，再检查其状态
      const tooltip = marker.getTooltip();
      if (tooltip) {
        // 安全地关闭tooltip
        marker.closeTooltip();
        count++;
      }
    });
    logger.debug(`已隐藏 ${count} 个弹出框和提示`);
    return count;
  }

  /**
   * 检查标记点点击
   * @param pixel 像素坐标
   * @returns 点击的标记点ID
   */
  public checkMarkerClick(pixel: number[]): { id: string } | null {
    // 将像素坐标转换为地图坐标
    const point = this.mapInstance.containerPointToLatLng(L.point(pixel[0], pixel[1]));
    
    // 设置点击检测的容差值（像素）
    const tolerance = 10; // 像素
    const toleranceInMeters = tolerance * this.mapInstance.getZoom() / 10;
    
    let closestMarker: L.Marker | null = null;
    let closestDistance = Infinity;
    let closestId: string | null = null;
    
    // 遍历所有标记点，查找最近的
    this.markers.forEach((marker, id) => {
      if (marker.options.visible !== false) {
        const markerLatLng = marker.getLatLng();
        const distance = point.distanceTo(markerLatLng);
        
        if (distance < toleranceInMeters && distance < closestDistance) {
          closestMarker = marker;
          closestDistance = distance;
          closestId = id;
        }
      }
    });
    
    return closestId ? { id: closestId } : null;
  }

  /**
   * 设置聚合距离
   * @param distance 聚合距离（像素）
   */
  public setClusterDistance(distance: number): void {
    // 在实际实现中，这里应该设置聚合距离
    // 这里只是一个模拟实现
    logger.debug(`设置聚合距离为 ${distance} 像素`);
  }

  /**
   * 设置聚合模式
   * @param enabled 是否启用聚合
   */
  public setClusterMode(enabled: boolean): void {
    // 在实际实现中，这里应该启用或禁用聚合模式
    // 这里只是一个模拟实现
    logger.debug(`${enabled ? '启用' : '禁用'}聚合模式`);
  }

  /**
   * 获取聚合模式状态
   * @returns 是否启用聚合
   */
  public getClusterMode(): boolean {
    // 在实际实现中，这里应该返回聚合模式的状态
    // 这里只是一个模拟实现
    return false;
  }

  /**
   * 设置聚合点击处理器
   * @param handler 点击处理函数
   */
  public setClusterClickHandler(handler?: (features: any[], coordinate: number[]) => void): void {
    // 在实际实现中，这里应该设置聚合点击的处理函数
    // 这里只是一个模拟实现
    logger.debug('设置聚合点击处理器');
  }
} 