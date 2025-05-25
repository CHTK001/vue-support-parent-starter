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
import { defaults as defaultControls } from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import { ElLoading } from 'element-plus';
import type { Coordinate } from 'ol/coordinate';

import { DataType, MapTile } from '../types';
import { MapType } from '../types/map';
import { ConfigObject } from './ConfigObject';
import logger from './LogObject';
import { CoordinateInfo } from '../types/coordinate'; 
import { GcoordObject } from './GcoordObject';
import { GcoordUtils } from '../utils/GcoordUtils';
import { CoordSystem, GeoPoint } from '../types/coordinate';

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
  // 交互控制
  private dragPan: DragPan | null = null;
  private mouseWheelZoom: MouseWheelZoom | null = null;
  // 比例尺控件
  private scaleLineControl: ScaleLine | null = null;

  // 使用ConfigObject管理配置
  private configObject: ConfigObject;

  // 坐标系统转换对象
  private gcoordObject: GcoordObject;

  /**
   * 构造函数
   * @param configObject 配置对象
   */
  constructor(configObject: ConfigObject) {
    this.configObject = configObject;
    // 初始化坐标系统转换对象，使用配置的地图类型
    this.gcoordObject = new GcoordObject(configObject.getMapType());
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
      
      // 所有地图统一使用EPSG:3857投影
      const projection = 'EPSG:3857';
      
      // 将WGS84中心点转换为EPSG:3857
      const transformedCenter = this.transformCenterToMap(center);
      
      // 创建视图，使用EPSG:3857投影
      const view = this.createMapView(transformedCenter, this.configObject.getZoom(), projection);

      // 创建主图层（底图）
      this.mainLayer = this.createBaseLayer();
      logger.debug('创建底图图层:', this.mainLayer);
      
      // 创建比例尺控件
      this.scaleLineControl = new ScaleLine({
        units: 'metric', // 使用公制单位
        bar: false, // 使用条形比例尺
        steps: 2, // 显示4个刻度
        text: false, // 显示文本
        className: 'ol-scale-line custom-scale-line' // 自定义样式类名
      });
      
      // 创建地图实例，禁用默认交互和控件
      this.mapInstance = new Map({
        target: target,
        layers: [this.mainLayer, this.vectorLayer],
        view: view,
        interactions: defaultInteractions({
          dragPan: false,
          mouseWheelZoom: false
        }),
        controls: defaultControls({
          zoom: false, // 禁用默认缩放控件
          rotate: false, // 禁用默认旋转控件
          attribution: false // 禁用默认归属控件
        }).extend([
          this.scaleLineControl
        ])
      });
      
      logger.info('地图实例创建成功');
      logger.info('当前地图的投影:', this.mapInstance.getView().getProjection().getCode());
      // 根据配置设置比例尺显示状态
      this.toggleScaleLine(this.configObject.isScaleLineVisible());
      
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

      // 添加pointermove事件，使用MousePosition控件处理坐标
      this.mapInstance.on('pointermove', this.handleMouseMove.bind(this));

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
          // 将EPSG:3857坐标转换为WGS84坐标后发送
          const wgs84Coords = this.transformMapCoordsToWGS84(coordinates);
          emitter('map-click', { coordinates: wgs84Coords });
        },
        // 标记点击事件处理
        (coordinates, data) => {
          // 将EPSG:3857坐标转换为WGS84坐标后发送
          const wgs84Coords = this.transformMapCoordsToWGS84(coordinates);
          emitter('marker-click', { coordinates: wgs84Coords, data });
        },
        // 图形点击事件处理
        (coordinates, data) => {
          // 将EPSG:3857坐标转换为WGS84坐标后发送
          const wgs84Coords = this.transformMapCoordsToWGS84(coordinates);
          emitter('shape-click', { coordinates: wgs84Coords, data });
        }
      );

      // 绑定视图变化事件
      this.bindViewChangeEvents(
        // 中心点变化事件处理
        (center) => {
          // 将EPSG:3857坐标转换为WGS84坐标后发送
          const wgs84Center = this.transformMapCenterToWGS84(center);
          emitter('update:center', wgs84Center);
        },
        // 缩放级别变化事件处理
        (zoom) => {
          emitter('update:zoom', zoom);
        }
      );

      return true;
    } catch (error) {
      logger.error('地图初始化失败:', error);
      return false;
    }
  }

  /**
   * 将WGS84中心点转换为EPSG:3857中心点（用于初始化地图）
   */
  private transformCenterToMap(center: [number, number]): [number, number] {
    // 使用OpenLayers自带的fromLonLat方法从WGS84转换到EPSG:3857
    const result = fromLonLat([center[1], center[0]], 'EPSG:3857') as Coordinate;
    return [result[0], result[1]];
  }

  /**
   * 将EPSG:3857坐标转换为WGS84坐标
   */
  private transformMapCoordsToWGS84(coordinates: number[]): number[] {
    if (!coordinates || coordinates.length < 2) return coordinates;
    
    // 使用OpenLayers自带的toLonLat方法从EPSG:3857转换到WGS84
    const lonLat = toLonLat([coordinates[0], coordinates[1]], 'EPSG:3857') as Coordinate;
    return [lonLat[1], lonLat[0]]; // 转换为[lat, lon]格式
  }

  /**
   * 将EPSG:3857中心点转换为WGS84中心点
   */
  private transformMapCenterToWGS84(center: [number, number]): [number, number] {
    // 使用OpenLayers自带的toLonLat方法从EPSG:3857转换到WGS84
    const lonLat = toLonLat(center, 'EPSG:3857') as Coordinate;
    return [lonLat[1], lonLat[0]]; // 转换为[lat, lon]格式
  }

  /**
   * 将WGS84坐标转换为当前地图使用的坐标系统
   */
  public wgs84ToMapCoord(point: GeoPoint): GeoPoint {
    // 先转换为EPSG:3857坐标
    const epsg3857Point = this.gcoordObject.fromWGS84(point);
    // 再转换为地图坐标
    return this.gcoordObject.toMapCoord(epsg3857Point);
  }

  /**
   * 将当前地图使用的坐标系统转换为WGS84坐标
   */
  public mapCoordToWgs84(point: GeoPoint): GeoPoint {
    // 先转换为EPSG:3857坐标
    const epsg3857Point = this.gcoordObject.fromMapCoord(point);
    // 再转换为WGS84坐标
    return this.gcoordObject.toWGS84(epsg3857Point);
  }

  /**
   * 获取坐标系转换对象
   */
  public getGcoordObject(): GcoordObject {
    return this.gcoordObject;
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
    // setTimeout(() => {
      // if (this.mapInstance) {
      //   // this.mapInstance.updateSize();
      //   // 强制重绘地图
      //   this.mapInstance.renderSync();
      //   logger.info('地图尺寸更新(100ms)');
      // }
    // }, 100);
    
    // 延迟300ms后再更新一次
    // setTimeout(() => {
    //   if (this.mapInstance) {
    //     this.mapInstance.updateSize();
    //     // 强制重绘地图
    //     this.mapInstance.renderSync();
    //     logger.info('地图尺寸更新(300ms)');
    //   }
    // }, 300);
    
    // // 延迟800ms后再更新一次，确保在各种环境下都能正确显示
    // setTimeout(() => {
    //   if (this.mapInstance) {
    //     this.mapInstance.updateSize();
    //     // 强制重绘地图
    //     this.mapInstance.renderSync();
    //     logger.info('地图尺寸更新(800ms)');
        
    //     // 检查地图状态
    //     this.checkMapStatus();
    //   }
    // }, 800);
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
    if (!this.mapInstance) {
      logger.warn('地图实例不存在，无法设置中心点');
      return;
    }

    try {
      // 将WGS84坐标转换为EPSG:3857
      const coordinates = fromLonLat([lon, lat], 'EPSG:3857');
      
      const view = this.mapInstance.getView();
      if (animate) {
        view.animate({
          center: coordinates,
          duration: 500
        });
      } else {
        view.setCenter(coordinates);
      }
      logger.debug(`地图中心点已设置为: [${lat}, ${lon}]（WGS84）-> [${coordinates[0]}, ${coordinates[1]}]（EPSG:3857）`);
    } catch (error) {
      logger.error('设置地图中心点失败:', error);
    }
  }

  /**
   * 获取地图中心点
   * @returns 中心点坐标 [lat, lon]，格式为WGS84
   */
  public getCenter(): [number, number] | null {
    if (!this.mapInstance) {
      logger.warn('地图实例不存在，无法获取中心点');
      return null;
    }

    try {
      const view = this.mapInstance.getView();
      const center = view.getCenter();
      
      if (!center) {
        logger.warn('无法获取地图中心点');
        return null;
      }
      
      // 将EPSG:3857坐标转换为WGS84
      const lonLat = toLonLat(center, 'EPSG:3857');
      const result: [number, number] = [lonLat[1], lonLat[0]]; // 转换为[lat, lon]格式
      
      logger.debug(`获取地图中心点: [${center[0]}, ${center[1]}]（EPSG:3857）-> [${result[0]}, ${result[1]}]（WGS84）`);
      return result;
    } catch (error) {
      logger.error('获取地图中心点失败:', error);
      return null;
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
    
    // 更新坐标系统转换对象的地图类型
    this.gcoordObject.setMapType(mapType);
    
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

      // 创建loading实例
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '地图加载中...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 移除当前底图
      this.mapInstance.removeLayer(this.mainLayer);
      
      // 创建新底图
      this.mainLayer = this.createBaseLayer();
      
      // 添加新底图并确保它位于底部
      this.mapInstance.getLayers().insertAt(0, this.mainLayer);
      
      // 监听新图层的加载完成事件
      const source = this.mainLayer.getSource();
      if (source) {
        let loadedTiles = 0;
        const totalTiles = 4; // 初始加载的瓦片数量
        
        const handleTileLoad = () => {
          loadedTiles++;
          if (loadedTiles >= totalTiles) {
            // 移除事件监听器
            source.un('tileloadend', handleTileLoad);
            // 关闭loading
            loadingInstance.close();
            // 触发一次地图更新
            this.triggerMapResize();
          }
        };
        
        // 添加事件监听器
        source.on('tileloadend', handleTileLoad);
        
        // 设置超时保护
        setTimeout(() => {
          source.un('tileloadend', handleTileLoad);
          loadingInstance.close();
          this.triggerMapResize();
        }, 5000); // 5秒超时
      } else {
        // 如果没有source，直接关闭loading
        loadingInstance.close();
        this.triggerMapResize();
      }
      
      logger.info('地图底图切换成功');
      return true;
    }
    
    logger.warn(`无法切换底图，配置不存在: ${mapType}/${tileType}`);
    return false;
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
    markerClickHandler: (coordinates: number[], data: any) => void,
    shapeClickHandler: (coordinates: number[], data: any) => void
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
        if(!data) return;
        if(data.dataType === DataType.MARKER){
          markerClickHandler(coordinates, data);
        }else if(data.dataType === DataType.SHAPE){
          shapeClickHandler(coordinates, data);
        }
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
      // 更新拖动交互状态
      this.dragPan.setActive(interactions.dragging);
      // 更新配置对象中的拖动状态
      this.configObject.updateConfig({ dragging: interactions.dragging });
    }
    
    if (typeof interactions.scrollWheelZoom === 'boolean') {
      // 更新滚轮缩放交互状态
      this.mouseWheelZoom.setActive(interactions.scrollWheelZoom);
      // 更新配置对象中的滚轮缩放状态
      this.configObject.updateConfig({ scrollWheelZoom: interactions.scrollWheelZoom });
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
   * @param event 鼠标事件
   */
  private handleMouseMove(event: any): void {
    if (!this.mapInstance || !event.coordinate) {
      return;
    }

    try {
      // 获取鼠标在地图上的坐标（EPSG:3857）
      const mapCoord = event.coordinate;
      
      // 将EPSG:3857坐标转换为WGS84坐标
      const lonLat = toLonLat(mapCoord, 'EPSG:3857');
      
      // 更新坐标信息
      this.coordinate = {
        ...this.coordinate,
        longitude: lonLat[0],
        latitude: lonLat[1],
        projectedX: mapCoord[0],
        projectedY: mapCoord[1],
        projection: 'EPSG:3857'
      };

      // 调用自定义监听器
      if (this.customPointerMoveListener) {
        this.customPointerMoveListener(event, this.coordinate);
      }
    } catch (error) {
      logger.error('处理鼠标移动事件失败:', error);
    }
  }

  /**
   * 显示或隐藏比例尺
   * @param visible 是否显示
   */
  public toggleScaleLine(visible: boolean): void {
    if (!this.mapInstance || !this.scaleLineControl) {
      return;
    }
    
    if (visible) {
      // 确保比例尺已添加到地图
      this.mapInstance.removeControl(this.scaleLineControl); // 先移除以防重复添加
      this.mapInstance.addControl(this.scaleLineControl);
      logger.debug('比例尺已显示');
    } else {
      // 移除比例尺
      this.mapInstance.removeControl(this.scaleLineControl);
      logger.debug('比例尺已隐藏');
    }
    
    // 更新配置对象
    this.configObject.setScaleLineVisible(visible);
  }
  
  /**
   * 获取比例尺显示状态
   * @returns 是否显示比例尺
   */
  public isScaleLineVisible(): boolean {
    return this.configObject.isScaleLineVisible();
  }

  /**
   * 销毁地图实例
   */
  public destroy(): void {
    if (!this.mapInstance) return;

    // 清除交互控制
    this.mapInstance.getInteractions().clear();
    
    // 清除控件，确保比例尺控件被正确移除
    if (this.scaleLineControl) {
      try {
        this.mapInstance.removeControl(this.scaleLineControl);
      } catch (e) {
        logger.warn('移除比例尺控件失败:', e);
      }
    }
    this.mapInstance.getControls().clear();
    this.scaleLineControl = null;
    
    // 清除图层
    this.mapInstance.getLayers().clear();
    this.mainLayer = null;
    this.vectorLayer = null;
    
    // 清除监听器
    this.mapInstance.getTargetElement().removeEventListener('pointermove', this.handleMouseMove.bind(this));
    this.customPointerMoveListener = () => {};
    
    // 清除地图实例
    this.mapInstance.dispose();
    this.mapInstance = null;

    // 清除标记信息
    this.markerInfo = {
      coordinates: null,
      data: null
    };
    
    // 销毁坐标系统转换对象
    if (this.gcoordObject) {
      this.gcoordObject.destroy();
    }
    
    logger.info('地图实例已销毁');
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

  /**
   * 创建瓦片图层
   * @param mapType 地图类型
   * @param mapTile 图层类型
   * @param mapConfig 地图配置(可选)，如果未提供则使用configObject中的配置
   * @returns 瓦片图层
   */
  public createTileLayer(mapType: MapType, mapTile: MapTile, mapConfig?: any): TileLayer<any> {
    // 使用传入的mapConfig或从configObject中获取
    const config = mapConfig || this.configObject.getMapConfig();
    
    // 根据不同的图层类型选择对应的配置
    let tileType = 'normal';
    switch (mapTile) {
      case MapTile.SATELLITE:
        tileType = 'satellite';
        break;
      case MapTile.HYBRID:
        tileType = 'hybrid';
        break;
      case MapTile.AERIAL:
        tileType = 'aerial';
        break;
      case MapTile.ROAD:
        tileType = 'road';
        break;
      case MapTile.NORMAL:
      default:
        tileType = 'normal';
        break;
    }
    
    // 检查配置是否存在
    if (!config[mapType] || !config[mapType][tileType]) {
      // 默认使用OSM
      logger.warn(`找不到地图配置 ${mapType}/${tileType}，使用OSM作为默认地图`);
      return new TileLayer({
        source: new OSM(),
        zIndex: 0, // 确保底图的z-index为0
        visible: true, // 显式设置为可见
        opacity: 1.0 // 确保不透明
      });
    }
    
    // 获取API密钥，优先使用configObject中的
    const apiKey = this.configObject.getMapKey(mapType);
    const urlConfig = config[mapType][tileType];
    
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
   * 创建底图图层
   * @returns 地图图层
   */
  private createBaseLayer(): TileLayer<any> {
    const mapType = this.configObject.getMapType();
    const mapTile = this.configObject.getMapTile();
    
    // 调用createTileLayer方法创建图层
    return this.createTileLayer(mapType, mapTile);
  }
}
