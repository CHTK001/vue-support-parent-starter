/**
 * 地图对象
 * @description 使用Leaflet实现的地图核心功能
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ConfigObject } from './ConfigObject';
import { MapType, DEFAULT_MAP_CONFIG } from '../types/map';
import { MapTile } from '../types';
import logger from './LogObject';
import { CoordinateObject } from './CoordinateObject';

// 地图事件回调类型
export type MapEventCallback = (event: string, payload: any) => void;

export class MapObject {
  private mapInstance: L.Map | null = null;
  private configObject: ConfigObject;
  private baseLayers: Map<string, L.TileLayer> = new Map();
  private currentBaseLayer: L.TileLayer | null = null;
  private coordinateObject: CoordinateObject | null = null;
  private eventCallback: MapEventCallback | null = null;
  private scaleControl: L.Control.Scale | null = null;

  /**
   * 构造函数
   * @param configObject 配置对象
   */
  constructor(configObject: ConfigObject) {
    this.configObject = configObject;
    logger.debug('MapObject已创建');
  }

  /**
   * 初始化地图
   * @param container 地图容器元素
   * @param callback 事件回调函数
   * @returns 是否初始化成功
   */
  public init(container: HTMLElement, callback?: MapEventCallback): boolean {
    try {
      if (!container) {
        logger.error('初始化地图失败：容器元素不存在');
        return false;
      }

      this.eventCallback = callback || null;

            // 获取渲染模式      
      const renderMode = this.configObject.getRenderMode();
      // 创建地图实例，根据渲染模式配置renderer选项     
      this.mapInstance = L.map(container, {
        center: this.configObject.getCenter(),
        zoom: this.configObject.getZoom(),
        dragging: this.configObject.getDragging(),
        scrollWheelZoom: this.configObject.getScrollWheelZoom(),
        preferCanvas: renderMode === 'CANVAS',
        renderer: renderMode === 'CANVAS' ? L.canvas() : L.svg(),
        doubleClickZoom: false,
        zoomControl: false // 禁用默认缩放控件，稍后添加到右上角      
      });
      logger.debug(`地图使用 ${renderMode} 渲染模式创建`);

      // 添加缩放控件到右上角
     // L.control.zoom({ position: 'topright' }).addTo(this.mapInstance);
      
      // 如果配置了比例尺，则添加比例尺控件
      if (this.configObject.getShowScaleLine()) {
        this.scaleControl = L.control.scale({
          imperial: false,
          position: 'bottomleft'
        }).addTo(this.mapInstance);
      }

      // 初始化图层
      this.initBaseLayers();
      
      // 添加默认图层
      this.switchBaseLayer(
        this.configObject.getMapType(),
        this.configObject.getMapTile()
      );

      // 创建坐标对象
      this.coordinateObject = new CoordinateObject(
        this.mapInstance,
        this.configObject.getCoordinateOptions()
      );

      // 绑定地图事件
      this.bindMapEvents();

      logger.info('地图初始化成功');
      return true;
    } catch (error) {
      logger.error('初始化地图失败:', error);
      return false;
    }
  }

  /**
   * 初始化基础图层
   */
  private initBaseLayers(): void {
    if (!this.mapInstance) return;

    // 高德地图图层
    this.baseLayers.set(`${MapType.GAODE}_${MapTile.NORMAL}`, this.createGaodeTileLayer(MapTile.NORMAL));
    this.baseLayers.set(`${MapType.GAODE}_${MapTile.SATELLITE}`, this.createGaodeTileLayer(MapTile.SATELLITE));
    
    // OpenStreetMap图层
    this.baseLayers.set(`${MapType.OSM}_${MapTile.NORMAL}`, this.createOsmTileLayer());
    
    // 百度地图图层
    this.baseLayers.set(`${MapType.BAIDU}_${MapTile.NORMAL}`, this.createBaiduTileLayer(MapTile.NORMAL));
    this.baseLayers.set(`${MapType.BAIDU}_${MapTile.SATELLITE}`, this.createBaiduTileLayer(MapTile.SATELLITE));

    // 谷歌地图图层
    this.baseLayers.set(`${MapType.GOOGLE}_${MapTile.NORMAL}`, this.createGoogleTileLayer(MapTile.NORMAL));
    this.baseLayers.set(`${MapType.GOOGLE}_${MapTile.SATELLITE}`, this.createGoogleTileLayer(MapTile.SATELLITE));
    this.baseLayers.set(`${MapType.GOOGLE}_${MapTile.TERRAIN}`, this.createGoogleTileLayer(MapTile.TERRAIN));

    logger.debug(`已初始化 ${this.baseLayers.size} 个基础图层`);
  }

  /**
   * 创建高德地图图层
   * @param tile 瓦片类型
   * @returns 图层对象
   */
  private createGaodeTileLayer(tile: MapTile): L.TileLayer {
    let url = '';
    
    switch (tile) {
      case MapTile.SATELLITE:
        // 高德卫星图
        url = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';
        break;
      case MapTile.NORMAL:
      default:
        // 高德标准图
        url = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
        break;
    }
    
    return L.tileLayer(url, {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
      attribution: '&copy; <a href="https://amap.com">高德地图</a>'
    });
  }

  /**
   * 创建OpenStreetMap图层
   * @returns 图层对象
   */
  private createOsmTileLayer(): L.TileLayer {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
  }

  /**
   * 创建百度地图图层
   * @param tile 瓦片类型
   * @returns 图层对象
   */
  private createBaiduTileLayer(tile: MapTile): L.TileLayer {
    // 注意：百度地图需要特殊的坐标转换，这里仅作为示例
    // 实际使用时需要添加坐标转换逻辑或使用专门的百度地图Leaflet插件
    return L.tileLayer('https://api.map.baidu.com/tile/?v=3.0&x={x}&y={y}&z={z}&udt=20220114&type=' + (tile === MapTile.SATELLITE ? 'web_sal' : 'webrd03'), {
      maxZoom: 18,
      attribution: '&copy; <a href="https://map.baidu.com">百度地图</a>',
      subdomains: ['0', '1', '2']
    });
  }

  /**
   * 创建谷歌地图图层
   * @param tile 瓦片类型
   * @returns 图层对象
   */
  private createGoogleTileLayer(tile: MapTile): L.TileLayer {
    let url = '';
    
    switch (tile) {
      case MapTile.SATELLITE:
        url = 'http://mt{s}.google.cn/vt/lyrs=s&x={x}&y={y}&z={z}';
        break;
      case MapTile.TERRAIN:
        url = 'http://mt{s}.google.cn/vt/lyrs=p&x={x}&y={y}&z={z}';
        break;
      case MapTile.NORMAL:
      default:
        url = 'http://mt{s}.google.cn/vt/lyrs=m&x={x}&y={y}&z={z}';
        break;
    }
    
    return L.tileLayer(url, {
      maxZoom: 19,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    });
  }

  /**
   * 绑定地图事件
   */
  private bindMapEvents(): void {
    if (!this.mapInstance) return;

    // 绑定移动结束事件
    this.mapInstance.on('moveend', () => {
      if (!this.mapInstance) return;
      
      const center = this.mapInstance.getCenter();
      const zoom = this.mapInstance.getZoom();
      
      // 触发中心点更新事件
      this.triggerEvent('update:center', [center.lat, center.lng]);
      
      // 触发缩放级别更新事件
      this.triggerEvent('update:zoom', zoom);
    });

    // 绑定缩放结束事件
    this.mapInstance.on('zoomend', () => {
      if (!this.mapInstance) return;
      
      const zoom = this.mapInstance.getZoom();
      
      // 触发缩放级别更新事件
      this.triggerEvent('update:zoom', zoom);
    });

    // 绑定点击事件
    this.mapInstance.on('click', (event) => {
      const latlng = event.latlng;
      
      // 触发地图点击事件
      this.triggerEvent('map-click', {
        coordinates: [latlng.lat, latlng.lng],
        originalEvent: event.originalEvent
      });
    });

    // 绑定右键点击事件
    this.mapInstance.on('contextmenu', (event) => {
      const latlng = event.latlng;
      
      // 触发地图右键点击事件
      this.triggerEvent('map-right-click', {
        coordinates: [latlng.lat, latlng.lng],
        originalEvent: event.originalEvent
      });
    });

    this.mapInstance.on('mousemove', (event) => {
      const latlng = event.latlng;
      this.triggerEvent('map-mousemove', {
        coordinates: [latlng.lat, latlng.lng],
        originalEvent: event.originalEvent
      });
    });

    logger.debug('地图事件已绑定');
  }

  /**
   * 触发事件
   * @param eventName 事件名称
   * @param payload 事件数据
   */
  private triggerEvent(eventName: string, payload: any): void {
    if (this.eventCallback) {
      this.eventCallback(eventName, payload);
    }
  }

  /**
   * 切换底图
   * @param mapType 地图类型
   * @param mapTile 瓦片类型
   * @returns 是否切换成功
   */
  public switchBaseLayer(mapType: MapType, mapTile: MapTile): boolean {
    if (!this.mapInstance) return false;

    // 生成图层键
    const layerKey = `${mapType}_${mapTile}`;
    
    // 获取图层
    const layer = this.baseLayers.get(layerKey);
    
    if (!layer) {
      logger.error(`切换底图失败：找不到图层 ${layerKey}`);
      return false;
    }

    // 如果存在当前图层，则先移除
    if (this.currentBaseLayer) {
      this.mapInstance.removeLayer(this.currentBaseLayer);
    }

    // 添加新图层并设置为当前图层
    layer.addTo(this.mapInstance);
    this.currentBaseLayer = layer;
    
    logger.info(`底图已切换为: ${layerKey}`);
    return true;
  }

  /**
   * 获取地图实例
   * @returns Leaflet地图实例
   */
  public getMapInstance(): L.Map | null {
    return this.mapInstance;
  }

  /**
   * 获取当前中心点
   * @returns 中心点坐标 [纬度, 经度]
   */
  public getCenter(): [number, number] {
    if (!this.mapInstance) return this.configObject.getCenter();
    
    const center = this.mapInstance.getCenter();
    return [center.lat, center.lng];
  }

  /**
   * 设置中心点
   * @param lat 纬度
   * @param lng 经度
   * @returns 是否设置成功
   */
  public setCenter(lat: number, lng: number): boolean {
    if (!this.mapInstance) return false;
    
    try {
      this.mapInstance.setView([lat, lng], this.mapInstance.getZoom());
      return true;
    } catch (error) {
      logger.error('设置中心点失败:', error);
      return false;
    }
  }

  /**
   * 获取当前缩放级别
   * @returns 缩放级别
   */
  public getZoom(): number {
    if (!this.mapInstance) return this.configObject.getZoom();
    
    return this.mapInstance.getZoom();
  }

  /**
   * 设置缩放级别
   * @param zoom 缩放级别
   * @returns 是否设置成功
   */
  public setZoom(zoom: number): boolean {
    if (!this.mapInstance) return false;
    
    try {
      this.mapInstance.setZoom(zoom);
      return true;
    } catch (error) {
      logger.error('设置缩放级别失败:', error);
      return false;
    }
  }

  /**
   * 设置地图交互选项
   * @param options 交互选项
   * @returns 是否设置成功
   */
  public setInteractions(options: { dragging?: boolean; scrollWheelZoom?: boolean }): boolean {
    if (!this.mapInstance) return false;
    
    try {
      // 设置拖拽
      if (options.dragging !== undefined) {
        if (options.dragging) {
          this.mapInstance.dragging.enable();
        } else {
          this.mapInstance.dragging.disable();
        }
      }
      
      // 设置滚轮缩放
      if (options.scrollWheelZoom !== undefined) {
        if (options.scrollWheelZoom) {
          this.mapInstance.scrollWheelZoom.enable();
        } else {
          this.mapInstance.scrollWheelZoom.disable();
        }
      }
      
      return true;
    } catch (error) {
      logger.error('设置交互选项失败:', error);
      return false;
    }
  }

  /**
   * 坐标转换：屏幕坐标转地理坐标
   * @param x 屏幕X坐标
   * @param y 屏幕Y坐标
   * @returns 地理坐标 [纬度, 经度]
   */
  public containerPointToLatLng(x: number, y: number): [number, number] | null {
    if (!this.mapInstance) return null;
    
    try {
      const point = this.mapInstance.containerPointToLatLng([x, y]);
      return [point.lat, point.lng];
    } catch (error) {
      logger.error('坐标转换失败:', error);
      return null;
    }
  }

  /**
   * 坐标转换：地理坐标转屏幕坐标
   * @param lat 纬度
   * @param lng 经度
   * @returns 屏幕坐标 [x, y]
   */
  public latLngToContainerPoint(lat: number, lng: number): [number, number] | null {
    if (!this.mapInstance) return null;
    
    try {
      const point = this.mapInstance.latLngToContainerPoint([lat, lng]);
      return [point.x, point.y];
    } catch (error) {
      logger.error('坐标转换失败:', error);
      return null;
    }
  }

  /**
   * 获取地图边界
   * @returns 地图边界 [[南纬, 西经], [北纬, 东经]]
   */
  public getBounds(): [[number, number], [number, number]] | null {
    if (!this.mapInstance) return null;
    
    try {
      const bounds = this.mapInstance.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      
      return [
        [southWest.lat, southWest.lng],
        [northEast.lat, northEast.lng]
      ];
    } catch (error) {
      logger.error('获取地图边界失败:', error);
      return null;
    }
  }

  /**
   * 获取坐标对象
   * @returns 坐标对象
   */
  public getCoordinateObject(): CoordinateObject | null {
    return this.coordinateObject;
  }

  /**
   * 添加地图控件
   * @param controlType 控件类型，如'scale'表示比例尺
   * @param options 控件选项
   * @returns 是否添加成功
   */
  public addControl(controlType: string, options?: any): boolean {
    try {
      if (!this.mapInstance) {
        logger.error('添加控件失败：地图实例不存在');
        return false;
      }

      switch (controlType.toLowerCase()) {
        case 'scale':
          // 添加比例尺控件
          this.scaleControl = L.control.scale({
            imperial: false,
            position: 'bottomleft',
            ...options
          }).addTo(this.mapInstance);
          logger.debug('已添加比例尺控件');
          return true;
        
        case 'zoom':
          // 添加缩放控件
          L.control.zoom({
            position: 'topright',
            ...options
          }).addTo(this.mapInstance);
          logger.debug('已添加缩放控件');
          return true;
        
        case 'attribution':
          // 添加归属控件
          L.control.attribution({
            position: 'bottomright',
            ...options
          }).addTo(this.mapInstance);
          logger.debug('已添加归属控件');
          return true;
        
        default:
          logger.warn(`未知的控件类型: ${controlType}`);
          return false;
      }
    } catch (error) {
      logger.error(`添加控件失败: ${error}`);
      return false;
    }
  }

  /**
   * 销毁地图对象
   */
  public destroy(): void {
    // 销毁坐标对象
    if (this.coordinateObject) {
      this.coordinateObject.destroy();
      this.coordinateObject = null;
    }
    
    // 移除所有图层
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    
    // 清空图层集合
    this.baseLayers.clear();
    this.currentBaseLayer = null;
    
    // 清空事件回调
    this.eventCallback = null;
    
    logger.debug('MapObject已销毁');
  }
} 