/**
 * leaflet-charts5.ts
 * 
 * 自定义实现的Leaflet Echarts 5集成插件
 * 专门为Echarts 5设计的Leaflet扩展，解决坐标系统与飞线图问题
 */

import { info, warn, error } from "@repo/utils";
import L from 'leaflet';
import * as echarts from 'echarts/core';
import type { Map as LeafletMap } from 'leaflet';
import type { ECharts, EChartsCoreOption } from 'echarts/core';

/**
 * Leaflet坐标系统实现
 */
class LeafletCoordSys {
  static create: (ecModel: any) => LeafletCoordSys[];
  private map: LeafletMap;
  private _mapOffset: [number, number];
  readonly dimensions: string[];

  constructor(map: LeafletMap) {
    this.map = map;
    this._mapOffset = [0, 0];
    this.dimensions = ['lng', 'lat'];
  }

  /**
   * 设置地图偏移
   */
  setMapOffset(mapOffset: [number, number]): void {
    this._mapOffset = mapOffset;
  }

  /**
   * 数据点到屏幕坐标的转换
   * @param data [经度, 纬度]
   */
  dataToPoint(data: [number, number]): [number, number] {
    try {
      // data为[lon, lat]，而Leaflet需要[lat, lon]
      const mapPoint = this.map.latLngToContainerPoint([data[1], data[0]]);
      return [
        mapPoint.x - this._mapOffset[0], 
        mapPoint.y - this._mapOffset[1]
      ];
    } catch (e) {
      error('数据点转换错误:', e);
      return [0, 0];
    }
  }

  /**
   * 屏幕坐标到数据点的转换
   * @param point 屏幕坐标 [x, y]
   */
  pointToData(point: [number, number]): [number, number] {
    try {
      const x = point[0] + this._mapOffset[0];
      const y = point[1] + this._mapOffset[1];
      const latLng = this.map.containerPointToLatLng([x, y]);
      // 返回[lon, lat]
      return [latLng.lng, latLng.lat];
    } catch (e) {
      error('屏幕坐标转换错误:', e);
      return [0, 0];
    }
  }

  /**
   * 获取视图范围
   */
  getBoundingRect(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    try {
      const bounds = this.map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const swPixel = this.map.latLngToContainerPoint([sw.lat, sw.lng]);
      const nePixel = this.map.latLngToContainerPoint([ne.lat, ne.lng]);
      
      return {
        x: swPixel.x - this._mapOffset[0],
        y: nePixel.y - this._mapOffset[1],
        width: nePixel.x - swPixel.x,
        height: swPixel.y - nePixel.y
      };
    } catch (e) {
      error('获取视图范围错误:', e);
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  /**
   * 转换为可视区域坐标
   */
  getRoamTransform() {
    return {
      transform: `translate(${this._mapOffset[0]}px, ${this._mapOffset[1]}px)`
    };
  }

  /**
   * 处理地图缩放变更
   */
  handleMapChange() {
    if (this._mapOffset[0] !== 0 || this._mapOffset[1] !== 0) {
      this._mapOffset = [0, 0];
      return true;
    }
    return false;
  }
}

// 工厂创建方法
LeafletCoordSys.create = function(ecModel) {
  let coordSys: LeafletCoordSys[] = [];
  
  // 遍历地图组件，为每个组件创建对应的坐标系实例
  ecModel.eachComponent('leaflet', function(leafletModel: any) {
    const mapRoot = leafletModel.getZr().painter.getViewportRoot();
    const leafletMap = mapRoot.__leafletMap;
    
    if (!leafletMap) {
      throw new Error('未找到地图实例');
    }
    
    const coordSysInstance = new LeafletCoordSys(leafletMap);
    coordSys.push(coordSysInstance);
    leafletModel.coordinateSystem = coordSysInstance;
  });
  
  // 为使用leaflet坐标系的系列设置坐标系
  ecModel.eachSeries(function(seriesModel: any) {
    if (seriesModel.get('coordinateSystem') === 'leaflet') {
      seriesModel.coordinateSystem = coordSys[0];
    }
  });
  
  return coordSys;
};

/**
 * Leaflet Echarts Layer
 * 继承自L.Layer的ECharts图层
 */
export class LeafletEChartsLayer extends L.Layer {
  private _container: HTMLElement;
  private _echartsContainer: HTMLElement;
  private _ec: ECharts | null = null;
  private _echartsOption: EChartsCoreOption | null = null;
  private _registered: boolean = false;
  private _leaflet_map: LeafletMap;
  private _coordsys: LeafletCoordSys | null = null;
  private _unbindEvents: (() => void) | null = null;
  private _initializationPromise: Promise<void> | null = null;
  private _initRetries: number = 0;
  private _maxRetries: number = 3;

  constructor(map: LeafletMap, options: any = {}) {
    super(options);
    this._leaflet_map = map;
    this._registered = false;
    this._coordsys = null;
  }

  /**
   * 添加到地图
   */
  onAdd(map: LeafletMap): this {
    this._leaflet_map = map;
    
    // 创建容器
    this._container = L.DomUtil.create('div', 'leaflet-echarts-container');
    this._container.style.position = 'absolute';
    this._container.style.pointerEvents = 'none';
    this._container.style.zIndex = '400';
    this._container.style.top = '0';
    this._container.style.left = '0';
    this._container.style.width = '100%';
    this._container.style.height = '100%';
    
    // 添加到地图中
    map.getPanes().overlayPane.appendChild(this._container);
    
    // 创建ECharts容器
    this._echartsContainer = L.DomUtil.create('div', 'leaflet-echarts-canvas', this._container);
    this._echartsContainer.style.width = '100%';
    this._echartsContainer.style.height = '100%';
    
    // 延迟初始化ECharts实例，确保容器已经正确渲染
    setTimeout(() => {
      this.initECharts();
    }, 100);
    
    // 绑定事件
    this._bindEvents();
    
    // 注册坐标系
    this._registerCoordinateSystem();
    
    return this;
  }

  /**
   * 从地图中移除
   */
  onRemove(map: LeafletMap): this {
    this._unbindEvents?.();
    
    // 销毁ECharts实例
    if (this._ec) {
      this._ec.dispose();
      this._ec = null;
    }
    
    // 移除容器
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    
    // 清理引用
    this._echartsContainer = null as any;
    this._coordsys = null;
    
    info('Leaflet ECharts Layer已移除');
    return this;
  }

  /**
   * 初始化ECharts实例
   */
  private initECharts(): void {
    try {
      if (!this._echartsContainer) {
        error('ECharts容器不存在');
        return;
      }

      // 检查容器尺寸
      const width = this._echartsContainer.clientWidth;
      const height = this._echartsContainer.clientHeight;
      
      if (width === 0 || height === 0) {
        // 容器尺寸为0，说明可能DOM还未完全渲染或样式问题
        if (this._initRetries < this._maxRetries) {
          this._initRetries++;
          warn(`ECharts容器尺寸为0，延迟重试初始化 #${this._initRetries}...`);
          // 延迟重试
          setTimeout(() => {
            this.initECharts();
          }, 200);
          return;
        } else {
          // 强制设置尺寸
          warn('ECharts容器尺寸异常，强制设置尺寸');
          this._echartsContainer.style.width = this._leaflet_map.getSize().x + 'px';
          this._echartsContainer.style.height = this._leaflet_map.getSize().y + 'px';
        }
      }
      
      // 如果已经有实例，先销毁
      if (this._ec) {
        this._ec.dispose();
      }
      
      // 创建新实例
      this._ec = echarts.init(this._echartsContainer, undefined, {
        width: this._echartsContainer.clientWidth || this._leaflet_map.getSize().x,
        height: this._echartsContainer.clientHeight || this._leaflet_map.getSize().y
      });
      
      info('ECharts实例创建成功', this._ec);
      
      // 设置初始配置
      if (this._echartsOption) {
        this.setOption(this._echartsOption);
      }
    } catch (e) {
      error('初始化ECharts实例失败:', e);
    }
  }

  /**
   * 注册Leaflet坐标系统
   */
  private _registerCoordinateSystem(): void {
    if (this._registered) {
      return;
    }
    
    try {
      // 注册坐标系统
      echarts.registerCoordinateSystem('leaflet', LeafletCoordSys as any);
      
      // 简化方法，不使用registerComponent和registerAction
      // 在setOption时确保每个系列都使用leaflet坐标系
      
      this._registered = true;
      
      // 保存全局引用供其他组件使用
      (window as any).LeafletCoordSys = LeafletCoordSys;
      
      info('Leaflet坐标系统注册成功');
    } catch (e) {
      error('注册Leaflet坐标系统失败:', e);
    }
  }

  /**
   * 绑定地图事件
   */
  private _bindEvents(): void {
    if (!this._leaflet_map) return;
    
    // 地图事件处理函数
    const handleMapChange = () => {
      if (this._ec) {
        try {
          this._ec.resize({
            width: this._echartsContainer.clientWidth || this._leaflet_map.getSize().x,
            height: this._echartsContainer.clientHeight || this._leaflet_map.getSize().y
          });
          this._ec.dispatchAction({
            type: 'leafletRoam'
          });
        } catch (e) {
          warn('处理地图变更事件失败:', e);
        }
      }
    };
    
    // 绑定地图事件
    this._leaflet_map.on('move', handleMapChange);
    this._leaflet_map.on('moveend', handleMapChange);
    this._leaflet_map.on('zoom', handleMapChange);
    this._leaflet_map.on('zoomend', handleMapChange);
    this._leaflet_map.on('resize', handleMapChange);
    
    // 保存解绑函数
    this._unbindEvents = () => {
      if (this._leaflet_map) {
        this._leaflet_map.off('move', handleMapChange);
        this._leaflet_map.off('moveend', handleMapChange);
        this._leaflet_map.off('zoom', handleMapChange);
        this._leaflet_map.off('zoomend', handleMapChange);
        this._leaflet_map.off('resize', handleMapChange);
      }
    };
  }

  /**
   * 设置ECharts配置
   */
  setOption(option: EChartsCoreOption, notMerge: boolean = false): void {
    try {
      this._echartsOption = option;
      
      if (!this._ec) {
        warn('ECharts实例不存在，无法设置选项');
        return;
      }
      
      // 确保地图组件存在
      if (!option.leaflet && !Array.isArray(option.series)) {
        option = {
          ...option,
          leaflet: {}
        };
      }
      
      // 确保所有系列使用正确的坐标系统
      if (Array.isArray(option.series)) {
        option.series = option.series.map(series => ({
          ...series,
          coordinateSystem: 'leaflet'
        }));
      }
      
      // 设置选项
      this._ec.setOption(option, notMerge);
      info('ECharts选项设置成功');
    } catch (e) {
      error('设置ECharts选项失败:', e);
    }
  }

  /**
   * 获取ECharts实例
   */
  getECharts(): ECharts | null {
    return this._ec;
  }

  /**
   * 获取ECharts容器
   */
  getEChartsContainer(): HTMLElement | null {
    return this._echartsContainer || null;
  }
  
  /**
   * 手动更新图表
   */
  update(): void {
    if (this._ec) {
      try {
        // 确保容器有正确的尺寸
        const width = this._echartsContainer.clientWidth || this._leaflet_map.getSize().x;
        const height = this._echartsContainer.clientHeight || this._leaflet_map.getSize().y;
        
        this._ec.resize({
          width: width,
          height: height
        });
        this._ec.dispatchAction({
          type: 'leafletRoam'
        });
      } catch (e) {
        warn('更新图表失败:', e);
      }
    }
  }

  /**
   * 清空图表
   */
  clear(): void {
    if (this._ec) {
      try {
        this._ec.clear();
      } catch (e) {
        warn('清空图表失败:', e);
      }
    }
  }

  /**
   * 重绘图表
   */
  redraw(): void {
    if (this._ec) {
      try {
        // 先确保容器尺寸正确
        const width = this._echartsContainer.clientWidth || this._leaflet_map.getSize().x;
        const height = this._echartsContainer.clientHeight || this._leaflet_map.getSize().y;
        
        this._ec.resize({
          width: width,
          height: height
        });
        
        if (this._echartsOption) {
          this.setOption(this._echartsOption, true);
        }
      } catch (e) {
        warn('重绘图表失败:', e);
      }
    }
  }
}

// 将图层添加到Leaflet命名空间
L.LeafletEChartsLayer = LeafletEChartsLayer;
L.leafletEChartsLayer = function(map: LeafletMap, options?: any) {
  return new LeafletEChartsLayer(map, options);
};

export default LeafletEChartsLayer; 