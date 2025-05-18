/**
 * 标记点对象
 * @description 管理地图标记点的添加、更新、删除等操作
 */
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import logger from './LogObject';
import type { MarkerOptions, MarkerConfig, ClusterOptions } from '../types/marker';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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
    logger.warn('聚合功能将不可用: 请安装 leaflet.markercluster 依赖');
    return false;
  }
};

// 检查是否存在 L.MarkerClusterGroup，如果不存在，提供警告函数
const checkClusterPlugin = (): boolean => {
  if (!L.MarkerClusterGroup) {
    console.warn('L.MarkerClusterGroup 未找到。请确保已安装 leaflet.markercluster 库。');
    logger.warn('未找到聚合插件，聚合功能将不可用');
    
    // 尝试检查window对象中是否有L
    // @ts-ignore - 忽略window.L类型错误
    if (typeof window !== 'undefined' && window.L && window.L.MarkerClusterGroup) {
      // 如果window.L中有MarkerClusterGroup但L中没有，尝试修复
      logger.info('在window.L中找到MarkerClusterGroup，尝试修复...');
      try {
        // @ts-ignore
        L.MarkerClusterGroup = window.L.MarkerClusterGroup;
        logger.info('已修复L.MarkerClusterGroup引用');
        return true;
      } catch (e) {
        logger.error('尝试修复L.MarkerClusterGroup引用失败:', e);
      }
    }
    
    return false;
  }
  return true;
};

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

  // 聚合相关属性
  private clusterLayer: any = null; // MarkerClusterGroup 类型
  private clusterEnabled: boolean = false;
  private clusterOptions: ClusterOptions = {
    enabled: false,
    maxClusterRadius: 80,
    showCount: true,
    color: '#1677ff',
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: null,
    animateAddingMarkers: true,
    iconCreateFunction: null
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
    
    // 初始化聚合支持
    this.initClusterSupport();
    
    // 添加对地图缩放开始事件的处理，预防 _latLngToNewLayerPoint 错误
    this.mapInstance.on('zoomstart', this.handleZoomStart.bind(this));
    
    // 添加额外的地图事件监听器来防止缩放过程中的异常
    this.mapInstance.on('zoom', () => {
      // 缩放期间，暂时避免标记操作
      this.mapInstance._mapZooming = true;
    });
    
    this.mapInstance.on('zoomend', () => {
      // 缩放结束后，允许标记操作
      this.mapInstance._mapZooming = false;
      
      // 如果集群层存在但其引用的地图已经不存在，重置聚合状态
      if (this.clusterEnabled && this.clusterLayer && (!this.clusterLayer._map || !this.clusterLayer._map.getBounds)) {
        logger.warn('检测到不一致的集群状态，重置聚合');
        this.clusterEnabled = false;
        this.clusterLayer = null;
      }
    });
    
    logger.debug('MarkerObject已初始化');
  }

  /**
   * 处理地图缩放开始事件，临时关闭所有tooltip防止缩放错误
   */
  private handleZoomStart(): void {
    try {
      // 暂时关闭所有tooltip以防止缩放过程中的_latLngToNewLayerPoint错误
      this.markers.forEach((marker) => {
        try {
          if (marker.getTooltip() && marker.isTooltipOpen()) {
            // 标记该tooltip需要在缩放后重新打开
            marker.options._reopenTooltipAfterZoom = true;
            marker.closeTooltip();
          }
        } catch (error) {
          // 静默处理单个marker错误，继续处理其他marker
        }
      });

      // 缩放结束后重新开启tooltip
      setTimeout(() => {
        this.reopenTooltipsAfterZoom();
      }, 300); // 给缩放动画足够的时间完成
    } catch (error) {
      logger.warn('处理缩放开始事件失败:', error);
    }
  }

  /**
   * 缩放后重新打开之前打开的tooltip
   */
  private reopenTooltipsAfterZoom(): void {
    try {
      // 确保地图实例仍然有效
      if (!this.mapInstance || !this.mapInstance.getBounds) {
        logger.warn('重新打开tooltip失败: 地图实例无效');
        return;
      }
      
      this.markers.forEach((marker) => {
        try {
          if (marker.options._reopenTooltipAfterZoom && 
              marker.getTooltip() && 
              marker.getTooltip() && 
              !marker.isTooltipOpen() &&
              marker.options.visible !== false) {
            marker.openTooltip();
            marker.options._reopenTooltipAfterZoom = false;
          }
        } catch (error) {
          // 静默处理单个marker错误
        }
      });
    } catch (error) {
      logger.warn('重新打开tooltip失败:', error);
    }
  }

  /**
   * 初始化聚合支持
   */
  private async initClusterSupport(): Promise<void> {
    try {
      // 检查是否支持聚合
      const isSupported = await loadClusterPlugin();
      if (!isSupported) {
        logger.warn('聚合功能初始化失败: 未能加载聚合插件');
        return;
      }
      
      // 添加聚合样式
      this.addClusterStyles();
      
      logger.debug('聚合支持已初始化');
    } catch (error) {
      logger.error('初始化聚合支持失败:', error);
    }
  }
  
  /**
   * 添加聚合样式
   */
  private addClusterStyles(): void {
    const styleId = 'sc-map-marker-cluster-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .marker-cluster {
        background-color: rgba(22, 119, 255, 0.6);
      }
      .marker-cluster div {
        background-color: rgba(22, 119, 255, 0.8);
        color: #fff;
        font-weight: bold;
      }
      .marker-cluster-small {
        background-color: rgba(22, 119, 255, 0.6);
      }
      .marker-cluster-small div {
        background-color: rgba(22, 119, 255, 0.8);
      }
      .marker-cluster-medium {
        background-color: rgba(241, 211, 87, 0.6);
      }
      .marker-cluster-medium div {
        background-color: rgba(240, 194, 12, 0.8);
      }
      .marker-cluster-large {
        background-color: rgba(253, 156, 115, 0.6);
      }
      .marker-cluster-large div {
        background-color: rgba(241, 128, 23, 0.8);
      }
      
      /* 聚合点击时效果 */
      .marker-cluster-click {
        animation: pulse 0.5s ease-out;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
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
    
    try {
      // 确保地图实例仍然有效
      if (!this.mapInstance) {
        logger.warn('更新标记缩放失败: 地图实例不存在');
        return;
      }
      
      // 确保地图已经初始化完成并且可以获取缩放级别
      if (!this.mapInstance.getZoom) {
        logger.warn('更新标记缩放失败: 地图实例未完全初始化');
        return;
      }
      
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
        try {
          // 确保标记点仍然有效
          if (!marker || !marker.getIcon) return;
          
          // 检查marker是否有tooltip，如果有且处于打开状态，先关闭以避免缩放错误
          if (marker.getTooltip && marker.getTooltip() && marker.isTooltipOpen()) {
            try {
              marker.closeTooltip();
              // 设置标志，表示需要在处理完后重新打开tooltip
              marker.options._reopen = true;
            } catch (tooltipError) {
              // 忽略关闭tooltip时的错误
            }
          }
          
          const icon = marker.getIcon();
          if (icon instanceof L.DivIcon) {
            // 尝试获取原始大小
            try {
              const element = marker.getElement();
              if (element) {
                const iconElement = element.querySelector('.leaflet-marker-custom-icon');
                if (iconElement) {
                  (iconElement as HTMLElement).style.transform = `scale(${scale})`;
                }
              }
            } catch (elementError) {
              // 获取元素时可能会失败，特别是在地图缩放期间
              // 这里静默忽略错误，避免阻断其他标记点的处理
            }
          }
          
          // 重新打开之前关闭的tooltip
          if (marker.options._reopen && marker.getTooltip && marker.getTooltip()) {
            try {
              // 延迟重新打开tooltip，确保缩放动画已完成
              setTimeout(() => {
                try {
                  if (marker && marker.openTooltip && marker.options.visible !== false) {
                    marker.openTooltip();
                  }
                  marker.options._reopen = false;
                } catch (e) {
                  // 忽略错误
                }
              }, 50);
            } catch (reopenError) {
              // 忽略重新打开tooltip时的错误
            }
          }
        } catch (markerError) {
          logger.warn(`更新标记点 ${id} 缩放时出错:`, markerError);
        }
      });
      
      logger.debug(`标记缩放比例已更新: ${scale.toFixed(2)}`);
    } catch (error) {
      logger.error(`更新标记缩放失败:`, error);
    }
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
          popupAnchor: options.icon.popupAnchor || [0, -40],
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
            popupAnchor: options.icon?.popupAnchor || [0, -40],
            className: 'group-marker-icon'
          });
        } else {
          // 分组图标为对象
          icon = L.icon({
            iconUrl: groupIcon.iconUrl || '',
            iconSize: groupIcon.iconSize || options.icon?.iconSize || [32, 32],
            iconAnchor: groupIcon.iconAnchor || options.icon?.iconAnchor || [16, 32],
            popupAnchor: groupIcon.popupAnchor || options.icon?.popupAnchor || [0, -40],
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
        riseOnHover: options.riseOnHover || false,
        animate: false
      }) as L.Marker & { options: any };
      
      // 存储数据
      marker.options.id = id;
      marker.options.data = options.data || {};
      marker.options.clusterable = options.clusterable !== false; // 添加是否可聚合的标记
      
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
      
      // 存储标题和内容以便点击时在MarkerPanel中显示
      marker.options.title = options.title;
      marker.options.content = options.popupContent;
      // 存储clickContentTemplate到marker.options._clickContentTemplate，因为原始类型不支持该属性
      (marker.options as any)._clickContentTemplate = options.clickContentTemplate;
      
      // 如果有标题且showLabel为true且标签当前可见，显示永久提示
      if (options.title && (options.showLabel || false) && this.labelsVisible) {
        // 保护tooltip创建过程，避免缩放过程中异常
        try {
          marker.bindTooltip(options.title, {
            permanent: options.labelOptions?.permanent || true,
            direction: options.labelOptions?.direction || 'top',
            offset: options.labelOptions?.offset ? L.point(options.labelOptions.offset[0], options.labelOptions.offset[1]) : undefined,
            opacity: options.labelOptions?.opacity || 0.9,
            className: options.labelOptions?.className || '',
            animate: false
          });
        } catch (tooltipError) {
          logger.warn(`绑定标签到标记点失败: ${id}`, tooltipError);
        }
      }
      
      // 如果有弹窗内容，绑定弹窗
      if (options.popupContent) {
        marker.bindPopup(options.popupContent, {
          offset: L.point(0, -marker.options.icon.options.iconSize[1] / 2)
        });
      }
      
      // 确保markerLayer存在
      if (!this.markerLayer) {
        this.markerLayer = L.layerGroup().addTo(this.mapInstance);
        logger.debug('为标记点创建新的图层组');
      }
      
      // 添加到图层
      if (this.clusterEnabled && marker.options.clusterable) {
        // 如果启用了聚合且标记点允许聚合，添加到聚合图层
        this.clusterLayer.addLayer(marker);
      } else {
        // 否则添加到普通图层
        this.markerLayer.addLayer(marker);
      }
      
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
    
    // 获取屏幕坐标和经纬度
    const latlng = marker.getLatLng();
    const pixelPoint = this.mapInstance.latLngToContainerPoint(latlng);
    
    // 构建事件数据，包含自定义属性
    const customEvent = {
      ...event,
      markerId: id,
      marker: marker,
      pixelPosition: {
        x: pixelPoint.x,
        y: pixelPoint.y
      },
      markerData: {
        id,
        position: [latlng.lat, latlng.lng],
        title: marker.options.title,
        content: marker.options.content,
        clickContentTemplate: marker.options._clickContentTemplate,
        data: marker.options.data
      }
    };
    
    // 触发回调
    if (this.clickListener) {
      this.clickListener(customEvent);
    }
    
    logger.debug(`标记点点击: ${id}`, [latlng.lng, latlng.lat]);
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
            popupAnchor: options.icon.popupAnchor || [0, -40],
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
              popupAnchor: options.icon?.popupAnchor || [0, -40],
              className: 'group-marker-icon'
            });
          } else {
            // 分组图标为对象
            icon = L.icon({
              iconUrl: groupIcon.iconUrl || '',
              iconSize: groupIcon.iconSize || options.icon?.iconSize || [32, 32],
              iconAnchor: groupIcon.iconAnchor || options.icon?.iconAnchor || [16, 32],
              popupAnchor: groupIcon.popupAnchor || options.icon?.popupAnchor || [0, -40],
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
          marker.bindPopup(options.popupContent, {
            offset: L.point(0, -10),  // 额外的偏移
            autoPan: true,           // 自动平移地图以显示弹窗
            closeButton: true,       // 显示关闭按钮
            autoClose: true,         // 点击地图其他位置自动关闭
            className: 'marker-popup' // 自定义CSS类名
          });
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
      if (this.clusterEnabled && (marker.options as any).clusterable) {
        // 如果启用了聚合且标记点允许聚合，从聚合图层移除
        this.clusterLayer.removeLayer(marker);
      } else {
        // 否则从普通图层移除
        this.markerLayer.removeLayer(marker);
      }
      
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
    
    // 如果启用了聚合，也清空聚合图层
    if (this.clusterEnabled && this.clusterLayer) {
      this.clusterLayer.clearLayers();
    }
    
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
    
    // 如果启用了聚合，从地图移除聚合图层
    if (this.clusterEnabled && this.clusterLayer && this.mapInstance.hasLayer(this.clusterLayer)) {
      this.mapInstance.removeLayer(this.clusterLayer);
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
   * 显示所有标签
   * @returns 显示的标签数量
   */
  public showAllLabels(): number {
    // 更新标签可见性状态
    this.labelsVisible = true;
    logger.debug(`全局标签可见性设为true`);
    
    let count = 0;
    this.markers.forEach((marker) => {
      try {
        // 检查标记点是否有效
        if (!marker || !marker.getLatLng) {
          return;
        }
        
        // 只处理可见的标记点
        if (marker.options.visible !== false) {
          // 判断标记点是否有标题，如果有标题则显示标签
          if (marker.options.title) {
            // 如果已有tooltip但处于关闭状态，则重新打开
            if (marker.getTooltip()) {
              try {
                // 确保地图实例仍然有效
                if (this.mapInstance && this.mapInstance.hasLayer(marker)) {
                  marker.openTooltip();
                  count++;
                }
              } catch (err) {
                logger.warn(`打开标签失败:`, err);
                // 如果打开失败，尝试重新绑定tooltip
                if (marker.getTooltip()) {
                  marker.unbindTooltip();
                }
                marker.bindTooltip(marker.options.title, {
                  permanent: true,
                  direction: 'top',
                  className: marker.options.labelOptions?.className || ''
                });
              }
            } 
            // 如果没有tooltip，创建一个新的
            else {
              try {
                marker.bindTooltip(marker.options.title, {
                  permanent: true,
                  direction: 'top',
                  className: marker.options.labelOptions?.className || '',
                  offset: [0, -5] // 添加一些偏移，避免与标记点重叠
                });
                
                // 只有当标记点已添加到地图时才打开tooltip
                if (this.mapInstance && this.mapInstance.hasLayer(marker)) {
                  marker.openTooltip();
                }
                count++;
              } catch (err) {
                logger.warn(`绑定标签失败:`, err);
              }
            }
          }
        }
      } catch (error) {
        logger.warn(`处理标记点标签时出错:`, error);
      }
    });
    logger.debug(`已显示 ${count} 个标记点标签`);
    return count;
  }

  /**
   * 隐藏所有标签
   * @returns 隐藏的标签数量
   */
  public hideAllLabels(): number {
    // 更新标签可见性状态
    this.labelsVisible = false;
    logger.debug(`全局标签可见性设为false`);
    
    // 在隐藏所有弹出框之前，先安全地关闭所有tooltip
    let tooltipCount = 0;
    this.markers.forEach((marker) => {
      try {
        if (marker && marker.getTooltip) {
          const tooltip = marker.getTooltip();
          if (tooltip) {
            try {
              marker.closeTooltip();
              tooltipCount++;
            } catch (err) {
              // 如果关闭失败，尝试解绑tooltip
              logger.warn(`关闭标签失败:`, err);
              try {
                marker.unbindTooltip();
                tooltipCount++;
              } catch (unbindErr) {
                logger.warn(`解绑标签失败:`, unbindErr);
              }
            }
          }
        }
      } catch (error) {
        logger.warn(`处理标记点标签时出错:`, error);
      }
    });
    
    logger.debug(`已安全关闭 ${tooltipCount} 个标签`);
    
    // 调用hideAllPopovers来处理弹出框
    const popoverCount = this.hideAllPopovers();
    
    return tooltipCount + popoverCount;
  }

  /**
   * 隐藏所有弹出框
   * @returns 隐藏的弹出框数量
   */
  public hideAllPopovers(): number {
    let count = 0;
    this.markers.forEach((marker) => {
      try {
        // 检查标记点是否有效
        if (!marker) return;
        
        // 检查popup
        try {
          if (marker.getPopup && marker.getPopup() && marker.isPopupOpen()) {
            marker.closePopup();
            count++;
          }
        } catch (popupError) {
          logger.warn(`关闭弹出框时出错:`, popupError);
        }
        
        // 检查tooltip
        try {
          if (marker.getTooltip && marker.getTooltip()) {
            marker.closeTooltip();
            count++;
          }
        } catch (tooltipError) {
          // 如果关闭失败，尝试解绑tooltip
          logger.warn(`关闭提示框时出错:`, tooltipError);
          try {
            if (marker.unbindTooltip) {
              marker.unbindTooltip();
            }
          } catch (unbindError) {
            logger.warn(`解绑提示框时出错:`, unbindError);
          }
        }
      } catch (markerError) {
        logger.warn(`处理标记点弹出框时出错:`, markerError);
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
    this.clusterOptions.maxClusterRadius = distance;
    
    // 如果已经启用了聚合，更新聚合配置
    if (this.clusterEnabled && this.clusterLayer) {
      this.disableCluster();
      this.enableCluster();
    }
    
    logger.debug(`设置聚合距离为 ${distance} 像素`);
  }

  /**
   * 设置聚合模式
   * @param enabled 是否启用聚合
   */
  public setClusterMode(enabled: boolean): void {
    if (enabled === this.clusterEnabled) return;
    
    // 检查地图是否正在缩放动画中
    if (this.mapInstance._animatingZoom) {
      logger.warn('地图正在缩放动画中，延迟切换聚合模式');
      // 延迟切换聚合模式
      setTimeout(() => {
        this.setClusterMode(enabled);
      }, 500);
      return;
    }
    
    if (enabled) {
      // 确保在启用聚合前，地图已经完全渲染并且有边界
      if (!this.mapInstance.getBounds) {
        logger.warn('地图尚未完全初始化，延迟启用聚合');
        setTimeout(() => {
          this.setClusterMode(enabled);
        }, 500);
        return;
      }
      
      this.enableCluster();
      // 在聚合模式下自动隐藏所有标签，避免视觉混乱
      this.hideAllLabels();
    } else {
      this.disableCluster();
      // 可以选择性地在退出聚合模式时恢复标签显示
      // this.showAllLabels();
    }
    
    logger.debug(`${enabled ? '启用' : '禁用'}聚合模式`);
  }

  /**
   * 获取聚合模式状态
   * @returns 是否启用聚合
   */
  public getClusterMode(): boolean {
    return this.clusterEnabled;
  }

  /**
   * 设置聚合点击处理器
   * @param handler 点击处理函数
   */
  public setClusterClickHandler(handler?: (features: any[], coordinate: number[]) => void): void {
    // 保存点击处理函数
    this.clusterOptions.onClusterClick = handler;
    
    if (this.clusterEnabled && this.clusterLayer) {
      // 移除先前的事件处理
      this.clusterLayer.off('clusterclick');
      
      // 如果提供了处理函数，添加新的事件处理
      if (handler) {
        this.clusterLayer.on('clusterclick', (e: any) => {
          const cluster = e.layer;
          const childMarkers = cluster.getAllChildMarkers();
          const features = childMarkers.map((marker: any) => ({
            id: marker.options.id,
            data: marker.options.data
          }));
          const latlng = cluster.getLatLng();
          handler(features, [latlng.lat, latlng.lng]);
        });
      }
    }
    
    logger.debug('设置聚合点击处理器');
  }

  /**
   * 启用聚合功能
   */
  public enableCluster(): void {
    // 检查聚合插件是否可用
    if (!checkClusterPlugin()) {
      logger.error('启用聚合失败: 插件不可用');
      return;
    }
    
    if (this.clusterEnabled) {
      logger.debug('聚合模式已经启用');
      return;
    }
    
    try {
      // 检查地图是否正在缩放动画中
      if (this.mapInstance._animatingZoom) {
        logger.warn('地图正在缩放动画中，延迟启用聚合');
        // 延迟启用聚合
        setTimeout(() => {
          this.enableCluster();
        }, 500);
        return;
      }
      
      // 确保地图已初始化并已添加到 DOM
      if (!this.mapInstance || !this.mapInstance.getContainer()) {
        logger.error('启用聚合失败: 地图实例未完全初始化');
        return;
      }

      // 确保地图已经有边界，防止 MarkerClusterGroup 的 getBounds 错误
      if (!this.mapInstance.getBounds()) {
        logger.warn('地图尚未完全初始化，等待地图设置好视图后再启用聚合');
        
        // 延迟启用聚合功能，等待地图准备就绪
        setTimeout(() => {
          // 再次检查地图是否已准备就绪
          if (this.mapInstance && this.mapInstance.getBounds()) {
            this._doEnableCluster();
          } else {
            logger.error('启用聚合失败: 地图边界在延迟后仍不可用');
          }
        }, 500);
        return;
      }
      
      // 执行聚合启用逻辑
      this._doEnableCluster();
    } catch (error) {
      logger.error('启用聚合模式失败:', error);
    }
  }

  /**
   * 实际执行聚合启用逻辑
   * @private
   */
  private _doEnableCluster(): void {
    try {
      // 创建聚合图层
      this.clusterLayer = L.markerClusterGroup({
        maxClusterRadius: this.clusterOptions.maxClusterRadius,
        iconCreateFunction: this.clusterOptions.iconCreateFunction || undefined,
        spiderfyOnMaxZoom: this.clusterOptions.spiderfyOnMaxZoom,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: this.clusterOptions.zoomToBoundsOnClick,
        disableClusteringAtZoom: this.clusterOptions.disableClusteringAtZoom,
        animateAddingMarkers: this.clusterOptions.animateAddingMarkers
      });
      
      // 将当前所有可聚合的标记点从普通图层移动到聚合图层
      const clusterableMarkers: L.Marker[] = [];
      const nonClusterableMarkers: L.Marker[] = [];
      
      this.markers.forEach((marker, id) => {
        const options = marker.options as any;
        if (options.clusterable !== false) {
          clusterableMarkers.push(marker);
        } else {
          nonClusterableMarkers.push(marker);
        }
      });
      
      // 清空原始图层
      this.markerLayer.clearLayers();
      
      // 添加不可聚合的标记点到普通图层
      nonClusterableMarkers.forEach(marker => {
        this.markerLayer.addLayer(marker);
      });
      
      // 添加可聚合的标记点到聚合图层
      if (clusterableMarkers.length > 0) {
        this.clusterLayer.addLayers(clusterableMarkers);
      }
      
      // 将聚合图层添加到地图
      this.mapInstance.addLayer(this.clusterLayer);
      
      // 添加聚合点击事件处理
      if (this.clusterOptions.onClusterClick) {
        this.clusterLayer.on('clusterclick', (e: any) => {
          const cluster = e.layer;
          const childMarkers = cluster.getAllChildMarkers();
          const features = childMarkers.map((marker: any) => ({
            id: marker.options.id,
            data: marker.options.data
          }));
          const latlng = cluster.getLatLng();
          this.clusterOptions.onClusterClick!(features, [latlng.lat, latlng.lng]);
        });
      }
      
      this.clusterEnabled = true;
      logger.debug('聚合模式已启用');
    } catch (error) {
      logger.error('执行聚合启用逻辑失败:', error);
    }
  }

  /**
   * 禁用聚合功能
   */
  public disableCluster(): void {
    if (!this.clusterEnabled || !this.clusterLayer) {
      return;
    }
    
    try {
      // 确保地图和聚合图层已正确初始化
      if (!this.mapInstance || !this.markerLayer) {
        logger.warn('禁用聚合失败: 地图实例或标记图层不可用');
        // 重置状态，避免卡在错误状态
        this.clusterEnabled = false;
        this.clusterLayer = null;
        return;
      }
      
      // 检查地图是否正在进行缩放动画
      if (this.mapInstance._animatingZoom) {
        logger.warn('地图正在缩放动画中，延迟禁用聚合');
        // 延迟禁用聚合，等待动画完成
        setTimeout(() => {
          this.disableCluster();
        }, 500);
        return;
      }
      
      // 将所有标记点从聚合图层移回普通图层
      const allMarkers: L.Marker[] = [];
      const clusterLayerRef = this.clusterLayer; // 保存引用
      
      try {
        // 在移除前保存所有标记
        clusterLayerRef.eachLayer((layer: any) => {
          allMarkers.push(layer);
        });
      } catch (layerError) {
        logger.warn('获取聚合图层中的标记失败:', layerError);
      }
      
      // 先将标记点状态设为非聚合状态，避免后续事件触发时访问已移除的层
      this.clusterEnabled = false;
      
      // 安全地移除所有事件监听器，避免在层移除后事件回调引用已删除的对象
      try {
        clusterLayerRef.off('clusterclick');
        clusterLayerRef.off('animationend');
        clusterLayerRef.off('spiderfied');
      } catch (evtError) {
        logger.warn('移除聚合图层事件监听器失败:', evtError);
      }
      
      // 从地图中移除聚合图层，确保图层存在于地图中
      setTimeout(() => {
        try {
          if (this.mapInstance && this.mapInstance.hasLayer(clusterLayerRef)) {
            this.mapInstance.removeLayer(clusterLayerRef);
          }
          
          // 将所有标记点添加到普通图层
          allMarkers.forEach(marker => {
            try {
              if (marker && this.markerLayer) {
                this.markerLayer.addLayer(marker);
              }
            } catch (addError) {
              logger.warn(`添加标记点到普通图层失败:`, addError);
            }
          });
          
          this.clusterLayer = null;
          logger.debug('聚合模式已禁用');
        } catch (error) {
          logger.error('禁用聚合模式最终步骤失败:', error);
          this.clusterLayer = null;
        }
      }, 100); // 短暂延迟确保DOM操作完成
    } catch (error) {
      logger.error('禁用聚合模式失败:', error);
      // 即使出现错误，也重置状态
      this.clusterLayer = null;
      this.clusterEnabled = false;
    }
  }

  /**
   * 设置聚合选项
   * @param options 聚合选项
   */
  public setClusterOptions(options: Partial<ClusterOptions>): void {
    const wasEnabled = this.clusterEnabled;
    
    // 更新配置
    this.clusterOptions = { ...this.clusterOptions, ...options };
    
    // 如果已启用聚合，重新应用设置
    if (wasEnabled) {
      this.disableCluster();
      this.enableCluster();
    }
    
    logger.debug('更新聚合选项:', options);
  }

  /**
   * 刷新聚合
   */
  public refreshCluster(): void {
    if (!this.clusterEnabled || !this.clusterLayer) return;
    
    try {
      // 确保地图已初始化并且聚合图层已添加到地图上
      if (!this.mapInstance || !this.mapInstance.hasLayer(this.clusterLayer)) {
        logger.warn('刷新聚合失败: 聚合图层未添加到地图');
        return;
      }
      
      // 检查地图是否有效边界
      if (!this.mapInstance.getBounds()) {
        logger.warn('刷新聚合失败: 地图边界不可用');
        return;
      }
      
      this.clusterLayer.refreshClusters();
      logger.debug('已刷新聚合');
    } catch (error) {
      logger.error('刷新聚合失败:', error);
    }
  }
} 