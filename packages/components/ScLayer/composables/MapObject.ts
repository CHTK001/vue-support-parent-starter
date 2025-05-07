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

import { MapTile, MapType } from '../types';
import { ConfigObject } from './ConfigObject';

export class MapObject {
  // 地图实例
  private mapInstance: Map | null = null;
  // 主图层（底图）
  private mainLayer: TileLayer<any> | null = null;
  // 矢量图层
  private vectorLayer: VectorLayer<any> | null = null;
  // 矢量数据源
  private vectorSource: VectorSource = new VectorSource();
  // 标记点信息
  private markerInfo: { coordinates: number[] | null; data: any | null } = {
    coordinates: null,
    data: null
  };

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

    // 创建矢量图层
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    // 创建主图层（底图）
    this.mainLayer = this.createBaseLayer();

    // 创建地图实例，禁用默认交互
    this.mapInstance = new Map({
      target: target,
      layers: [this.mainLayer, this.vectorLayer],
      view: new View({
        center: fromLonLat([this.configObject.getCenter()[1], this.configObject.getCenter()[0]]),
        zoom: this.configObject.getZoom()
      }),
      interactions: defaultInteractions({
        dragPan: false,
        mouseWheelZoom: false
      })
    });

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

    return true;
  }

  /**
   * 初始化交互控制
   */
  private initInteractions(): void {
    if (!this.mapInstance) return;

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
      return new TileLayer({
        source: new OSM()
      });
    }
    
    const apiKey = this.configObject.getMapKey(mapType);
    const urlConfig = mapConfig[mapType][tileType];
    
    // 处理API密钥
    let url = urlConfig.url;
    if (url.includes('{key}') && apiKey) {
      url = url.replace('{key}', apiKey);
    }
    
    return new TileLayer({
      source: new XYZ({
        url: url,
        attributions: [urlConfig.attribution]
      })
    });
  }

  /**
   * 配置地图交互选项
   * @param dragging 是否允许拖动
   * @param scrollWheelZoom 是否允许滚轮缩放
   */
  private configureMapInteractions(dragging: boolean, scrollWheelZoom: boolean): void {
    if (!this.mapInstance || !this.dragPan || !this.mouseWheelZoom) return;
    
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
    
    // 更新配置对象
    this.configObject.setMapType(mapType);
    this.configObject.setMapTile(mapTile);
    
    const mapConfig = this.configObject.getMapConfig();
    const tileType = mapTile === MapTile.NORMAL ? 'normal' : 'satellite';
    
    // 检查地图配置是否存在
    if (mapConfig[mapType] && mapConfig[mapType][tileType]) {
      // 移除当前底图
      this.mapInstance.removeLayer(this.mainLayer);
      
      // 创建新底图
      this.mainLayer = this.createBaseLayer();
      
      // 添加到地图最底层
      this.mapInstance.getLayers().insertAt(0, this.mainLayer);
      
      return true;
    }
    
    return false;
  }

  /**
   * 获取当前地图中心点
   * @returns [纬度, 经度]
   */
  public getCenter(): [number, number] | null {
    if (!this.mapInstance) return null;
    
    const center = this.mapInstance.getView().getCenter();
    if (!center) return null;
    
    const lonLat = toLonLat(center);
    return [lonLat[1], lonLat[0]];
  }

  /**
   * 获取当前缩放级别
   * @returns 缩放级别
   */
  public getZoom(): number | null {
    if (!this.mapInstance) return null;
    
    return this.mapInstance.getView().getZoom() || null;
  }

  /**
   * 绑定点击事件处理器
   * @param clickHandler 点击事件处理函数
   * @param markerClickHandler 标记点击事件处理函数
   */
  public bindClickEvents(
    clickHandler: (coordinates: number[]) => void,
    markerClickHandler: (coordinates: number[], data: any) => void
  ): void {
    if (!this.mapInstance) return;
    
    this.mapInstance.on('click', (evt) => {
      const coordinate = toLonLat(evt.coordinate);
      
      // 检查是否点击了要素
      const feature = this.mapInstance?.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
      
      if (feature) {
        const featureData = feature.get('data') || null;
        
        // 更新标记信息
        this.markerInfo = {
          coordinates: coordinate,
          data: featureData
        };
        
        // 调用标记点击处理函数
        markerClickHandler(coordinate, featureData);
      } else {
        // 调用地图点击处理函数
        clickHandler(coordinate);
      }
    });
  }

  /**
   * 绑定视图变更事件处理器
   * @param centerChangeHandler 中心点变更事件处理函数
   * @param zoomChangeHandler 缩放级别变更事件处理函数
   */
  public bindViewChangeEvents(
    centerChangeHandler: (center: [number, number]) => void,
    zoomChangeHandler: (zoom: number) => void
  ): void {
    if (!this.mapInstance) return;
    
    // 中心点变更事件
    this.mapInstance.getView().on('change:center', () => {
      const center = this.getCenter();
      if (center) {
        centerChangeHandler(center);
      }
    });

    // 缩放级别变更事件
    this.mapInstance.getView().on('change:resolution', () => {
      const zoom = this.getZoom();
      if (zoom !== null) {
        zoomChangeHandler(zoom);
      }
    });
  }

  /**
   * 设置地图交互状态
   * @param interactions 交互配置对象
   */
  public setInteractions(interactions: { dragging?: boolean; scrollWheelZoom?: boolean }): void {
    if (!this.mapInstance || !this.dragPan || !this.mouseWheelZoom) return;
    
    if (interactions.dragging !== undefined) {
      this.dragPan.setActive(interactions.dragging);
    }
    
    if (interactions.scrollWheelZoom !== undefined) {
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
   * 销毁地图实例
   */
  public destroy(): void {
    if (this.mapInstance) {
      this.mapInstance.setTarget(undefined);
      this.mapInstance = null;
      this.mainLayer = null;
      this.vectorLayer = null;
      this.vectorSource.clear();
      this.dragPan = null;
      this.mouseWheelZoom = null;
    }
  }
}
