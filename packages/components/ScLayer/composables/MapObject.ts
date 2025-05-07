/**
 * 地图对象类
 * 处理地图的初始化、底图切换等核心功能
 */
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import DragPan from 'ol/interaction/DragPan';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import { defaults as defaultInteractions } from 'ol/interaction';

import { MapTile } from '../types';
import { MapType } from '../types/map';
import { ConfigObject } from './ConfigObject';
import logger from './LogObject';
import type { CoordinateInfo } from './CoordinateObject';

export interface MapEmitter {
  'map-click': (event: any) => void;
  'marker-click': (event: any) => void;
  'update:center': (center: [number, number]) => void;
  'update:zoom': (zoom: number) => void;
}

export class MapObject {
  // 地图实例
  private mapInstance: Map | null = null;
  // 主图层（底图）
  private mainLayer: TileLayer<any> | null = null;
  // 矢量图层
  private vectorLayer: VectorLayer<any> | null = null;
  // 矢量数据源
  private vectorSource: VectorSource = new VectorSource();
  // 自定义鼠标移动事件监听器
  private customPointerMoveListener: (event: any, coordinate: CoordinateInfo) => void = () => { };
  // 标记点信息
  private markerInfo: { coordinates: number[] | null; data: any | null } = {
    coordinates: null,
    data: null
  };
// 当前坐标信息
  private coordinate: CoordinateInfo = {
    longitude: 0,
    latitude: 0,
    projectedX: 0,
    projectedY: 0,
    projection: 'EPSG:3857',
    decimals: 6,
    position: 'bottom-right'
  };
  // 鼠标移动事件监听器
  private pointerMoveListener: any = null;
  // 交互控制
  private dragPan: DragPan | null = null;
  private mouseWheelZoom: MouseWheelZoom | null = null;

  // 使用ConfigObject管理配置
  private configObject: ConfigObject;

  /**
   * 构造函数
   * @param configObject 配置对象
   */
  constructor(configObject: ConfigObject) {
    this.configObject = configObject;
    this.pointerMoveListener = (event: any) => { 
    this.registerPointerMoveEvent(event);
    this.customPointerMoveListener(event, this.coordinate);
  };
    logger.debug('MapObject实例已创建，配置类型:', configObject.getMapType());
  }

  // 设置鼠标移动事件监听器
  public setPointerMoveListener(listener: (event: any, coordinate: CoordinateInfo) => void): void {
    this.customPointerMoveListener = listener;
  }
  /**
   * 初始化地图
   * @param target 地图容器DOM元素
   * @param emitter 事件发射器函数
   * @returns 是否初始化成功
   */
  public init(
    target: HTMLElement, 
    emitter: any
  ): boolean {
    if (!target) return false;

    logger.info('开始初始化地图，容器尺寸：', target.clientWidth, target.clientHeight);
    logger.debug('地图配置:', this.configObject.getConfig());
    
    try {
      // 创建矢量图层
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource
      });

      const center = this.configObject.getCenter();
      logger.debug('原始中心点:', center);
      
      // 获取底图投影
      const mapType = this.configObject.getMapType();
      const mapTile = this.configObject.getMapTile();
      const mapConfig = this.configObject.getMapConfig();
      const tileType = mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
      const urlConfig = mapConfig[mapType]?.[tileType];
      const projection = urlConfig?.projection || 'EPSG:3857';
      
      // 创建视图，考虑投影
      const view = this.createMapView(center, this.configObject.getZoom(), projection);

      // 创建主图层（底图）
      this.mainLayer = this.createBaseLayer();
      logger.debug('创建底图图层:', this.mainLayer);
      
      // 创建地图实例，禁用默认交互和控件
      this.mapInstance = new Map({
        target: target,
        layers: [this.mainLayer, this.vectorLayer],
        view: view,
        interactions: defaultInteractions({
          dragPan: false,
          mouseWheelZoom: false
        }),
        controls: [], // 禁用所有默认控件，包括缩放按钮
      });
      
      this.mapInstance.on('pointermove', this.pointerMoveListener);
      // 检查地图实例是否正确创建
      if (!this.mapInstance) {
        logger.error('地图实例创建失败');
        return false;
      }

      // 检查主图层是否正确添加到地图中
      if (this.mapInstance.getLayers().getLength() < 1) {
        logger.warn('地图图层可能未正确添加');
      } else {
        logger.info(`地图共有 ${this.mapInstance.getLayers().getLength()} 个图层`);
      }

      // 初始化交互控制
      this.initInteractions();

      // 配置地图交互
      this.configureMapInteractions(
        this.configObject.isDraggingEnabled(), 
        this.configObject.isScrollWheelZoomEnabled()
      );

      // 绑定地图点击事件
      this.bindClickEvents(
        // 地图点击事件处理
        (coordinates) => {
          emitter('map-click', { coordinates });
        },
        // 标记点击事件处理
        (coordinates, data) => {
          emitter('marker-click', { coordinates, data });
        }
      );

      // 绑定视图变更事件
      this.bindViewChangeEvents(
        // 中心点变更事件处理
        (center) => {
          emitter('update:center', center);
          // 更新配置对象中的中心点
          this.configObject.setCenter(center);
        },
        // 缩放级别变更事件处理
        (zoom) => {
          emitter('update:zoom', zoom);
          // 更新配置对象中的缩放级别
          this.configObject.setZoom(zoom);
        }
      );
      
      // 强制多次触发地图重绘，确保图层正确渲染
      this.triggerMapResize();
      
      return true;
    } catch (error) {
      logger.error('地图初始化失败:', error);
      return false;
    }
  }

  /**
   * 触发地图尺寸更新，确保图层正确渲染
   */
  public triggerMapResize(): void {
    if (!this.mapInstance) return;
    
    // 强制预加载瓦片
    if (this.mainLayer && this.mainLayer.getSource()) {
      this.mainLayer.getSource().refresh();
    }
    
    // 立即更新一次
    this.mapInstance.updateSize();
    
    // 延迟100ms后再更新一次
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.updateSize();
        // 强制重绘地图
        this.mapInstance.renderSync();
        logger.info('地图尺寸更新(100ms)');
      }
    }, 100);
    
    // 延迟300ms后再更新一次
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.updateSize();
        // 强制重绘地图
        this.mapInstance.renderSync();
        logger.info('地图尺寸更新(300ms)');
      }
    }, 300);
    
    // 延迟800ms后再更新一次，确保在各种环境下都能正确显示
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.updateSize();
        // 强制重绘地图
        this.mapInstance.renderSync();
        logger.info('地图尺寸更新(800ms)');
        
        // 检查地图状态
        this.checkMapStatus();
      }
    }, 800);
  }

  /**
   * 检查地图状态，输出诊断信息
   */
  private checkMapStatus(): void {
    if (!this.mapInstance) return;
    
    const size = this.mapInstance.getSize();
    const target = this.mapInstance.getTarget();
    const layers = this.mapInstance.getLayers().getArray();
    
    logger.debug('地图状态检查:', {
      size: size,
      layerCount: layers.length,
      targetElement: typeof target === 'string' ? target : '已设置DOM元素',
      viewCenter: this.mapInstance.getView().getCenter(),
      viewZoom: this.mapInstance.getView().getZoom()
    });
    
    // 检查各图层的状态
    layers.forEach((layer, index) => {
      if (layer instanceof TileLayer) {
        const source = layer.getSource();
        logger.debug(`图层 ${index}: ${source.constructor.name}`);
      }
    });
  }

  /**
   * 初始化交互控制
   */
  private initInteractions(): void {
    if (!this.mapInstance) return;

    logger.debug('初始化地图交互控件');
    // 创建拖动交互
    this.dragPan = new DragPan();
    this.mapInstance.addInteraction(this.dragPan);

    // 创建滚轮缩放交互
    this.mouseWheelZoom = new MouseWheelZoom();
    this.mapInstance.addInteraction(this.mouseWheelZoom);
  }

  /**
   * 创建底图图层
   * @returns 地图图层
   */
  private createBaseLayer(): TileLayer<any> {
    const mapType = this.configObject.getMapType();
    const mapTile = this.configObject.getMapTile();
    const mapConfig = this.configObject.getMapConfig();
    
    const tileType = mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查配置是否存在
    if (!mapConfig[mapType] || !mapConfig[mapType][tileType]) {
      // 默认使用OSM
      logger.warn(`找不到地图配置 ${mapType}/${tileType}，使用OSM作为默认地图`);
      return new TileLayer({
        source: new OSM(),
        zIndex: 0, // 确保底图的z-index为0
        visible: true, // 显式设置为可见
        opacity: 1.0 // 确保不透明
      });
    }
    
    const apiKey = this.configObject.getMapKey(mapType);
    const urlConfig = mapConfig[mapType][tileType];
    
    // 处理API密钥
    let url = urlConfig.url;
    if (url.includes('{key}') && apiKey) {
      url = url.replace('{key}', apiKey);
    } else if (url.includes('{key}') && !apiKey) {
      logger.warn(`地图需要API密钥，但未提供 ${mapType} 的密钥`);
    }
    
    // 获取投影信息
    const projection = urlConfig.projection || 'EPSG:3857'; // 默认使用Web墨卡托投影
    
    logger.debug(`创建图层 ${mapType}/${tileType}，URL: ${url}，投影: ${projection}`);
    
    // 创建XYZ图层，确保设置正确的z-index
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: url,
        attributions: [urlConfig.attribution],
        projection: projection
      }),
      zIndex: 0, // 确保底图的z-index为0
      visible: true, // 显式设置为可见
      opacity: 1.0, // 确保不透明
      properties: {
        name: `${mapType}-${tileType}` // 添加名称以便于调试
      }
    });
    
    return tileLayer;
  }

  /**
   * 配置地图交互选项
   * @param dragging 是否允许拖动
   * @param scrollWheelZoom 是否允许滚轮缩放
   */
  private configureMapInteractions(dragging: boolean, scrollWheelZoom: boolean): void {
    if (!this.mapInstance || !this.dragPan || !this.mouseWheelZoom) return;
    
    logger.debug(`配置地图交互：拖动=${dragging}, 滚轮缩放=${scrollWheelZoom}`);
    // 配置拖动功能
    this.dragPan.setActive(dragging);

    // 配置滚轮缩放
    this.mouseWheelZoom.setActive(scrollWheelZoom);
  }

  /**
   * 设置地图中心点
   * @param lat 纬度
   * @param lon 经度
   * @param animate 是否使用动画
   */
  public setCenter(lat: number, lon: number, animate: boolean = true): void {
    if (!this.mapInstance) return;
    
    logger.debug(`设置地图中心点: [${lat}, ${lon}], 动画=${animate}`);
    // 更新配置对象
    this.configObject.setCenter([lat, lon]);
    
    if (animate) {
      this.mapInstance.getView().animate({
        center: fromLonLat([lon, lat]),
        duration: 500
      });
    } else {
      this.mapInstance.getView().setCenter(fromLonLat([lon, lat]));
    }
  }

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   * @param animate 是否使用动画
   */
  public setZoom(zoom: number, animate: boolean = true): void {
    if (!this.mapInstance) return;
    
    logger.debug(`设置地图缩放级别: ${zoom}, 动画=${animate}`);
    // 更新配置对象
    this.configObject.setZoom(zoom);
    
    if (animate) {
      this.mapInstance.getView().animate({
        zoom: zoom,
        duration: 500
      });
    } else {
      this.mapInstance.getView().setZoom(zoom);
    }
  }

  /**
   * 切换地图底图
   * @param mapType 地图类型
   * @param mapTile 图层类型
   * @returns 是否切换成功
   */
  public switchBaseLayer(mapType: MapType, mapTile: MapTile): boolean {
    if (!this.mapInstance || !this.mainLayer) return false;
    
    logger.info(`切换地图底图: 类型=${mapType}, 图层=${mapTile}`);
    // 更新配置对象
    this.configObject.setMapType(mapType);
    this.configObject.setMapTile(mapTile);
    
    const mapConfig = this.configObject.getMapConfig();
    const tileType = mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查地图配置是否存在
    if (mapConfig[mapType] && mapConfig[mapType][tileType]) {
      // 获取当前图层列表
      const layers = this.mapInstance.getLayers();
      const layersArray = layers.getArray();
      
      // 记录当前图层状态
      logger.debug('当前图层状态:', layersArray.map((layer, index) => {
        return {
          index,
          type: layer instanceof VectorLayer ? 'Vector' : 'Tile',
          visible: layer.getVisible()
        };
      }));
      
      // 移除当前底图
      this.mapInstance.removeLayer(this.mainLayer);
      
      // 创建新底图
      this.mainLayer = this.createBaseLayer();
      
      // 添加新底图并确保它位于底部
      this.mapInstance.getLayers().insertAt(0, this.mainLayer);
      
      // 触发地图更新
      this.triggerMapResize();
      
      logger.info('地图底图切换成功');
      return true;
    }
    
    logger.warn(`无法切换底图，配置不存在: ${mapType}/${tileType}`);
    return false;
  }

  /**
   * 获取地图中心点
   * @returns 地图中心点 [纬度, 经度]
   */
  public getCenter(): [number, number] | null {
    if (!this.mapInstance) return null;
    
    const center = this.mapInstance.getView().getCenter();
    if (!center) return null;
    
    const [lon, lat] = toLonLat(center);
    return [lat, lon];
  }

  /**
   * 获取地图缩放级别
   * @returns 地图缩放级别
   */
  public getZoom(): number | null {
    if (!this.mapInstance) return null;
    
    return this.mapInstance.getView().getZoom() || null;
  }

  /**
   * 绑定地图点击事件
   * @param clickHandler 地图点击事件处理函数
   * @param markerClickHandler 标记点击事件处理函数
   */
  private bindClickEvents(
    clickHandler: (coordinates: number[]) => void,
    markerClickHandler: (coordinates: number[], data: any) => void
  ): void {
    if (!this.mapInstance) return;
    
    logger.debug('绑定地图点击事件');
    this.mapInstance.on('click', (event) => {
      const coordinates = toLonLat(event.coordinate);
      
      // 检查是否点击了标记点
      const feature = this.mapInstance?.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );
      
      if (feature) {
        // 如果点击了标记点，触发标记点点击事件
        const data = feature.get('data');
        logger.debug('点击了标记点:', coordinates, data);
        markerClickHandler(coordinates, data);
      } else {
        // 否则触发地图点击事件
        logger.debug('点击了地图:', coordinates);
        clickHandler(coordinates);
      }
    });
  }

  /**
   * 绑定视图变更事件
   * @param centerChangeHandler 中心点变更事件处理函数
   * @param zoomChangeHandler 缩放级别变更事件处理函数
   */
  private bindViewChangeEvents(
    centerChangeHandler: (center: [number, number]) => void,
    zoomChangeHandler: (zoom: number) => void
  ): void {
    if (!this.mapInstance) return;
    
    logger.debug('绑定地图视图变更事件');
    // 监听中心点变更
    this.mapInstance.getView().on('change:center', () => {
      const center = this.getCenter();
      if (center) {
        logger.debug('地图中心点已变更:', center);
        centerChangeHandler(center);
      }
    });
    
    // 监听缩放级别变更
    this.mapInstance.getView().on('change:resolution', () => {
      const zoom = this.getZoom();
      if (zoom !== null) {
        logger.debug('地图缩放级别已变更:', zoom);
        zoomChangeHandler(zoom);
      }
    });
  }

  /**
   * 设置交互选项
   * @param interactions 交互选项
   */
  public setInteractions(interactions: { dragging?: boolean; scrollWheelZoom?: boolean }): void {
    if (!this.mapInstance || !this.dragPan || !this.mouseWheelZoom) return;
    
    logger.debug('更新地图交互设置:', interactions);
    if (typeof interactions.dragging === 'boolean') {
      this.dragPan.setActive(interactions.dragging);
    }
    
    if (typeof interactions.scrollWheelZoom === 'boolean') {
      this.mouseWheelZoom.setActive(interactions.scrollWheelZoom);
    }
  }

  /**
   * 获取地图实例
   * @returns 地图实例
   */
  public getMapInstance(): Map | null {
    return this.mapInstance;
  }

  /**
   * 获取配置对象
   * @returns 配置对象
   */
  public getConfigObject(): ConfigObject {
    return this.configObject;
  }
 /**
   * 处理鼠标移动事件
   * @param event 鼠标移动事件
   */
  private registerPointerMoveEvent(event: any): void {
    
    try {
      // 获取鼠标位置的地图坐标
      const pixel = event.pixel;
      const coord = this.mapInstance.getCoordinateFromPixel(pixel);
      
      if (!coord || coord.length < 2) return;
      
      // 获取当前地图投影
      const mapProjection = this.mapInstance.getView().getProjection().getCode();
      
      // 保存原始投影坐标
      this.coordinate.projectedX = coord[0];
      this.coordinate.projectedY = coord[1];
      this.coordinate.projection = mapProjection;
      
      // 转换为WGS84坐标 (经纬度)
      const wgs84Coord = toLonLat(coord, mapProjection);
      this.coordinate.longitude = wgs84Coord[0];
      this.coordinate.latitude = wgs84Coord[1];
      
      this.coordinate.decimals = 8;
    } catch (error) {
      logger.error('处理坐标失败:', error);
    }
  }

  /**
   * 销毁地图对象
   */
  public destroy(): void {
    logger.info('销毁地图对象');
    if (this.mapInstance) {
      this.mapInstance.un('pointermove', this.pointerMoveListener);
      this.mapInstance.dispose();
      this.mapInstance = null;
    }
    
    this.mainLayer = null;
    this.vectorLayer = null;
    this.dragPan = null;
    this.mouseWheelZoom = null;
  }

  /**
   * 创建地图视图
   * @param center 中心点 [纬度, 经度]
   * @param zoom 缩放级别
   * @param projection 投影
   * @returns 地图视图
   */
  private createMapView(center: [number, number], zoom: number, projection: string): View {
    logger.debug(`创建地图视图: 中心点=${center}, 缩放级别=${zoom}, 投影=${projection}`);
    
    // 根据投影处理坐标转换
    let projectedCenter;
    if (projection === 'EPSG:4326') {
      // 如果是WGS84坐标系，直接使用[经度, 纬度]
      projectedCenter = [center[1], center[0]];
      logger.debug('使用WGS84投影，坐标:', projectedCenter);
    } else {
      // 默认使用Web墨卡托投影
      projectedCenter = fromLonLat([center[1], center[0]]);
      logger.debug('使用Web墨卡托投影，转换后坐标:', projectedCenter);
    }
    
    return new View({
      center: projectedCenter,
      zoom: zoom,
      projection: projection
    });
  }
}
