/**
 * leaflet-charts5.ts
 * 
 * 自定义实现的Leaflet Echarts 5集成插件
 * 专门为Echarts 5设计的Leaflet扩展，解决坐标系统与飞线图问题
 */

import { info, warn, error } from "@repo/utils";
import L from 'leaflet';
// 使用正确的导入方式
import * as echarts from 'echarts';
import type { Map as LeafletMap } from 'leaflet';
import type { ECharts, EChartsCoreOption } from 'echarts';

/**
 * Leaflet坐标系统实现
 * 完全按照ECharts官方坐标系统规范实现
 */
class LeafletCoordSys {
  dimensions = ['lng', 'lat'];
  private _mapOffset = [0, 0];
  private _api: any;
  model: any;
  map: any;
  
  // 静态属性
  static dimensions = ['lng', 'lat'];
  static type = 'leaflet';
  
  constructor(map: any, api: any) {
    this.map = map;
    this._api = api;
  }
  
  /**
   * 将经纬度坐标转换为像素坐标
   */
  dataToPoint(coords: [number, number]): [number, number] {
    const point = this.map.latLngToContainerPoint({
      lat: coords[1],
      lng: coords[0]
    });
    return [point.x, point.y];
  }
  
  /**
   * 将像素坐标转换为经纬度
   */
  pointToData(pt: [number, number]): [number, number] {
    const latLng = this.map.containerPointToLatLng(pt);
    return [latLng.lng, latLng.lat];
  }
  
  /**
   * 获取视图矩形范围
   */
  getViewRect(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const size = this.map.getSize();
    return {
      x: 0,
      y: 0,
      width: size.x,
      height: size.y
    };
  }
  
  /**
   * 判断点是否在视图内
   */
  containPoint(pt: [number, number]): boolean {
    const viewRect = this.getViewRect();
    return pt[0] >= viewRect.x &&
           pt[0] <= viewRect.x + viewRect.width &&
           pt[1] >= viewRect.y &&
           pt[1] <= viewRect.y + viewRect.height;
  }
  
  /**
   * 获取地图实例
   */
  getMap() {
    return this.map;
  }
  
  /**
   * 创建坐标系实例
   */
  static create = function(ecModel: any, api: any) {
    let coordSys: LeafletCoordSys[] = [];
    let leafletMap: any = null;
    
    // 尝试通过多种方式找到地图实例，按可靠性从高到低排序
    
    // 1. 优先从全局window对象查找，这通常是最新的引用
    try {
      const win = window as any;
      if (win.__leafletMap) {
        leafletMap = win.__leafletMap;
        console.info('从window对象获取到地图实例');
      }
    } catch (e) {
      console.warn('从全局window获取Leaflet地图实例失败:', e);
    }
    
    // 2. 如果未找到，从模型中查找
    if (!leafletMap) {
      ecModel.eachComponent('leaflet', function(leafletModel: any) {
        if (leafletModel.__leafletInstance) {
          leafletMap = leafletModel.__leafletInstance;
          console.info('从模型中获取到地图实例');
          return;
        }
      });
    }
    
    // 3. 如果仍未找到，从视图根元素获取
    if (!leafletMap) {
      try {
        const painter = api.getZr().painter;
        const viewportRoot = painter.getViewportRoot && painter.getViewportRoot();
        
        if (viewportRoot && viewportRoot.__leafletMap) {
          leafletMap = viewportRoot.__leafletMap;
          console.info('从视图根元素获取到地图实例');
        }
      } catch (e) {
        console.warn('从ZRender视图获取Leaflet地图实例失败:', e);
      }
    }
    
    // 4. 从DOM中找地图实例
    if (!leafletMap) {
      try {
        const container = api.getDom();
        if (container && container.__leafletMap) {
          leafletMap = container.__leafletMap;
          console.info('从DOM元素获取到地图实例');
        } else if (container && container.parentElement && container.parentElement.__leafletMap) {
          leafletMap = container.parentElement.__leafletMap;
          console.info('从父DOM元素获取到地图实例');
        } else {
          // 遍历DOM树查找
          let element = container;
          while (element && !leafletMap) {
            if (element.__leafletMap) {
              leafletMap = element.__leafletMap;
              console.info('从DOM树中获取到地图实例');
              break;
            }
            element = element.parentElement;
          }
        }
      } catch (e) {
        console.warn('从DOM中获取Leaflet地图实例失败:', e);
      }
    }
    
    // 仍然未找到地图实例，打印错误并退出
    if (!leafletMap) {
      console.error('找不到Leaflet地图实例，请确保正确初始化，将返回空坐标系');
      return coordSys;
    }
    
    // 创建默认的leaflet组件选项
    const defaultLeafletOption = {
      roam: true,
      id: 'default-leaflet-' + Date.now()
    };
    
    // 确保有leaflet组件，没有则创建
    let hasLeafletComponent = false;
    ecModel.eachComponent('leaflet', function() {
      hasLeafletComponent = true;
    });
    
    if (!hasLeafletComponent) {
      // 在模型中添加leaflet组件
      if (!ecModel.option.leaflet) {
        ecModel.option.leaflet = defaultLeafletOption;
      }
      console.info('已添加默认leaflet组件');
    }
    
    // 创建坐标系实例
    ecModel.eachComponent('leaflet', function(leafletModel: any) {
      // 将找到的地图实例附加到模型
      leafletModel.__leafletInstance = leafletMap;
      
      // 创建坐标系实例
      const coordSysInstance = new LeafletCoordSys(leafletMap, api);
      
      // 设置模型
      coordSysInstance.model = leafletModel;
      coordSys.push(coordSysInstance);
      
      // 设置引用
      leafletModel.coordinateSystem = coordSysInstance;
      
      console.info('已创建leaflet坐标系实例');
    });
    
    // 为每个系列设置坐标系统
    ecModel.eachSeries(function(seriesModel: any) {
      if (seriesModel.get('coordinateSystem') === 'leaflet') {
        // 检查是否有坐标系
        if (coordSys.length > 0) {
          seriesModel.coordinateSystem = coordSys[0];
          console.info('已为系列设置坐标系统:', seriesModel.name || seriesModel.id);
        } else {
          console.warn('未找到leaflet坐标系实例，请检查初始化');
        }
      }
    });
    
    return coordSys;
  }
}

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
  private _coordsys: any = null;
  private _unbindEvents: (() => void) | null = null;
  private _initializationPromise: Promise<void> | null = null;
  private _initRetries: number = 0;
  private _maxRetries: number = 3;
  private _isEChartsInitialized: boolean = false;

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
    
    // 立即将地图实例保存在全局变量，确保坐标系可以找到它
    (window as any).__leafletMap = this._leaflet_map;
    (window as any).__leafletMapLastUpdated = Date.now();
    
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
    
    // 确保容器具有正确的尺寸
    const mapSize = map.getSize();
    if (mapSize && mapSize.x > 0 && mapSize.y > 0) {
      // 显式设置尺寸，确保容器有明确的像素尺寸
      this._container.style.width = mapSize.x + 'px';
      this._container.style.height = mapSize.y + 'px';
      this._echartsContainer.style.width = mapSize.x + 'px';
      this._echartsContainer.style.height = mapSize.y + 'px';
    }
    
    // 设置地图引用 - 在容器上设置地图实例引用，确保坐标系能找到它
    this._prepareDomForECharts();
    
    // 立即注册坐标系统，确保后续可以找到
    this._registerCoordinateSystem();
    
    // 更新容器尺寸以匹配地图
    this._updateContainerSize();
    
    // 在地图准备好后进行初始化
    map.whenReady(() => {
      // 再次设置地图引用，以防之前的设置失效
      this._prepareDomForECharts();
      
      // 再次注册坐标系统，确保它被正确注册
      this._registerCoordinateSystem();
      
      // 延迟初始化ECharts实例，确保容器已经正确渲染
      setTimeout(() => {
        // 再次更新容器尺寸
        this._updateContainerSize();
        // 初始化图表
        this.initECharts();
      }, 200);
    });
    
    // 绑定事件
    this._bindEvents();
    
    // 确保容器具有正确的尺寸
    map.on('resize', this._updateContainerSize, this);
    
    return this;
  }

  /**
   * 准备DOM，供ECharts使用
   */
  private _prepareDomForECharts(): void {
    try {
      // 添加地图实例引用到DOM
      interface LeafletMapRoot extends HTMLDivElement {
        __leafletMap?: LeafletMap;
      }
      
      // 将地图实例绑定到容器和画布元素
      (this._echartsContainer as LeafletMapRoot).__leafletMap = this._leaflet_map;
      (this._container as LeafletMapRoot).__leafletMap = this._leaflet_map;
      
      // 如果有父元素，也绑定
      if (this._container.parentElement) {
        (this._container.parentElement as LeafletMapRoot).__leafletMap = this._leaflet_map;
      }
      
      // 跟踪日志
      console.info('已将地图实例绑定到DOM元素和全局变量');
    } catch (e) {
      console.error('准备DOM失败:', e);
    }
  }

  /**
   * 更新容器尺寸以匹配地图
   */
  private _updateContainerSize(): void {
    if (!this._leaflet_map || !this._container || !this._echartsContainer) return;
    
    try {
      const mapSize = this._leaflet_map.getSize();
      if (mapSize && mapSize.x > 0 && mapSize.y > 0) {
        // 更新容器尺寸
        this._container.style.width = mapSize.x + 'px';
        this._container.style.height = mapSize.y + 'px';
        this._echartsContainer.style.width = mapSize.x + 'px';
        this._echartsContainer.style.height = mapSize.y + 'px';
        
        // 如果已经有ECharts实例，调整其尺寸
        if (this._ec) {
          this._ec.resize({
            width: mapSize.x,
            height: mapSize.y
          });
        }
      }
    } catch (e) {
      console.warn('更新容器尺寸失败:', e);
    }
  }

  /**
   * 注册Leaflet坐标系统
   */
  public _registerCoordinateSystem(): void {
    if (this._registered) return;
    
    try {
      // 确保 echarts 模块已正确导入
      if (!echarts) {
        console.error('找不到echarts实例，请确保正确导入echarts');
        return;
      }
      
      // 使用类型断言访问registerCoordinateSystem方法
      const echartsAny = echarts as any;
      
      // 注册坐标系统
      if (typeof echartsAny.registerCoordinateSystem === 'function') {
        echartsAny.registerCoordinateSystem('leaflet', LeafletCoordSys);
        console.info('成功注册Leaflet坐标系统');
        
        // 设置已注册标志
        this._registered = true;
      } else {
        console.error('echarts.registerCoordinateSystem 方法不存在');
        return;
      }
      
      // 为容器绑定地图实例，这样LeafletCoordSys.create能找到地图
      this._prepareDomForECharts();
      
    } catch (e) {
      console.error('注册Leaflet坐标系统失败:', e);
    }
  }

  /**
   * 从地图中移除
   */
  onRemove(map: LeafletMap): this {
    // 解除事件绑定
    this._unbindEvents?.();
    
    // 移除地图尺寸变化事件监听
    map.off('resize', this._updateContainerSize, this);
    
    // 移除窗口调整事件监听器
    window.removeEventListener('resize', () => {
      if (this._ec) this._ec.resize();
    });
    
    // 销毁ECharts实例
    if (this._ec) {
      try {
        this._ec.dispose();
      } catch (e) {
        console.warn('销毁ECharts实例失败:', e);
      }
      this._ec = null;
    }
    
    // 移除容器
    if (this._container && this._container.parentNode) {
      try {
        this._container.parentNode.removeChild(this._container);
      } catch (e) {
        console.warn('移除ECharts容器失败:', e);
      }
    }
    
    // 清理引用
    this._echartsContainer = null as any;
    this._coordsys = null;
    
    console.info('Leaflet ECharts Layer已移除');
    return this;
  }

  /**
   * 初始化ECharts实例
   */
  private initECharts(): void {
    try {
      if (!this._echartsContainer) {
        console.error('ECharts容器不存在');
        return;
      }

      // 检查容器尺寸
      const width = this._echartsContainer.clientWidth;
      const height = this._echartsContainer.clientHeight;
      
      if (width === 0 || height === 0) {
        // 容器尺寸为0，说明可能DOM还未完全渲染或样式问题
        if (this._initRetries < this._maxRetries) {
          this._initRetries++;
          console.warn(`ECharts容器尺寸为0，延迟重试初始化 #${this._initRetries}...`);
          // 延迟重试
          setTimeout(() => {
            this.initECharts();
          }, 200);
          return;
        } else {
          // 强制设置尺寸前检查容器可见性
          if (this._echartsContainer.offsetParent === null) {
            console.warn('ECharts容器不可见，检查DOM结构或样式');
          }
          
          // 获取地图尺寸
          const mapSize = this._leaflet_map.getSize();
          
          if (!mapSize || mapSize.x === 0 || mapSize.y === 0) {
            console.warn('地图尺寸异常，将使用固定尺寸');
            // 使用固定尺寸
            this._echartsContainer.style.width = '800px';
            this._echartsContainer.style.height = '600px';
          } else {
            // 强制设置尺寸
            console.warn(`ECharts容器尺寸异常，强制设置尺寸为: ${mapSize.x} x ${mapSize.y}`);
            this._echartsContainer.style.width = mapSize.x + 'px';
            this._echartsContainer.style.height = mapSize.y + 'px';
          }
          
          // 等待DOM更新
          setTimeout(() => {
            // 再次检查尺寸
            const newWidth = this._echartsContainer.clientWidth;
            const newHeight = this._echartsContainer.clientHeight;
            
            if (newWidth === 0 || newHeight === 0) {
              console.warn('仍然无法获取ECharts容器尺寸，使用父容器尺寸');
              
              // 尝试使用父容器尺寸
              if (this._container && this._container.clientWidth > 0 && this._container.clientHeight > 0) {
                this._echartsContainer.style.width = this._container.clientWidth + 'px';
                this._echartsContainer.style.height = this._container.clientHeight + 'px';
              } else {
                // 使用更保守的方式
                this._echartsContainer.style.position = 'absolute';
                this._echartsContainer.style.top = '0';
                this._echartsContainer.style.left = '0';
                this._echartsContainer.style.right = '0';
                this._echartsContainer.style.bottom = '0';
              }
            }
            
            // 继续初始化
            this.finishInitECharts();
          }, 100);
          return;
        }
      }
      
      // 如果尺寸正常，直接完成初始化
      this.finishInitECharts();
    } catch (e) {
      console.error('初始化ECharts实例失败:', e);
    }
  }
  
  /**
   * 完成ECharts实例初始化
   */
  private finishInitECharts(): void {
    try {
      // 如果已经有实例，先销毁
      if (this._ec) {
        this._ec.dispose();
      }
      
      // 确保已注册坐标系统
      this._registerCoordinateSystem();
      
      // 获取当前容器尺寸或使用地图尺寸作为备选
      const width = this._echartsContainer.clientWidth || this._leaflet_map.getSize().x || 800;
      const height = this._echartsContainer.clientHeight || this._leaflet_map.getSize().y || 600;
      
      // 在容器上设置地图引用
      this._prepareDomForECharts();
      
      // 确保echarts模块已正确导入
      if (!echarts || typeof (echarts as any).init !== 'function') {
        console.error('echarts模块未正确导入或初始化函数不可用');
        return;
      }
      
      // 创建新实例
      this._ec = (echarts as any).init(this._echartsContainer, null, {
        width: width,
        height: height,
        renderer: 'canvas'
      });
      
      // 设置基本配置，包括leaflet组件
      // 必须先设置一个有效的leaflet配置，以确保坐标系统能正确初始化
      this._ec.setOption({
        // leaflet组件配置
        leaflet: { 
          roam: true,
          // 确保有一个唯一标识
          id: 'leaflet-map-' + Date.now(),
        },
        // 添加一个空的lines系列，确保坐标系能正确初始化
        series: [{
          type: 'lines',
          coordinateSystem: 'leaflet',
          data: []
        }]
      }, true); // 使用notMerge=true避免配置混合
      
      // 添加窗口调整事件监听
      window.addEventListener('resize', () => {
        if (this._ec) {
          try {
            this._updateContainerSize();
            this._ec.resize();
          } catch (e) {
            console.warn('窗口调整时ECharts调整失败:', e);
          }
        }
      });
      
      // 设置已初始化标记
      this._isEChartsInitialized = true;
      
      console.info('ECharts实例已创建, 容器尺寸:', width, 'x', height);
    } catch (e) {
      console.error('ECharts初始化失败:', e);
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
          // 确保容器尺寸与地图一致
          this._updateContainerSize();
          
          // 更新图表
          this._ec.resize({
            width: this._echartsContainer.clientWidth || this._leaflet_map.getSize().x,
            height: this._echartsContainer.clientHeight || this._leaflet_map.getSize().y
          });
          
          // 触发坐标系调整
          this._ec.dispatchAction({
            type: 'leafletRoam'
          });
        } catch (e) {
          console.warn('处理地图变更事件失败:', e);
        }
      }
    };
    
    // 添加视图尺寸变化处理
    const handleViewportResize = () => {
      if (this._ec) {
        try {
          // 延迟更新，确保DOM已更新
          setTimeout(() => {
            this._updateContainerSize();
            
            if (this._ec) {
              this._ec.resize();
            }
          }, 0);
        } catch (e) {
          console.warn('处理视图调整事件失败:', e);
        }
      }
    };
    
    // 绑定地图事件
    this._leaflet_map.on('move', handleMapChange);
    this._leaflet_map.on('moveend', handleMapChange);
    this._leaflet_map.on('zoom', handleMapChange);
    this._leaflet_map.on('zoomend', handleMapChange);
    this._leaflet_map.on('resize', handleMapChange);
    
    // 绑定窗口事件
    window.addEventListener('resize', handleViewportResize);
    
    // 保存解绑函数
    this._unbindEvents = () => {
      if (this._leaflet_map) {
        this._leaflet_map.off('move', handleMapChange);
        this._leaflet_map.off('moveend', handleMapChange);
        this._leaflet_map.off('zoom', handleMapChange);
        this._leaflet_map.off('zoomend', handleMapChange);
        this._leaflet_map.off('resize', handleMapChange);
      }
      
      window.removeEventListener('resize', handleViewportResize);
    };
  }

  /**
   * 设置ECharts配置
   */
  setOption(option: EChartsCoreOption, notMerge: boolean = false): void {
    try {
      // 保存原始配置
      this._echartsOption = option;
      
      if (!this._ec) {
        console.warn('ECharts实例不存在，无法设置选项');
        return;
      }
      
      // 处理选项 - 使用leaflet坐标系
      const processedOption: any = { ...option };
      
      // 添加leaflet组件
      if (!processedOption.leaflet) {
        processedOption.leaflet = {
          roam: true
        };
      }
      
      // 删除xAxis和yAxis，与leaflet坐标系冲突
      if (processedOption.xAxis) {
        delete processedOption.xAxis;
      }
      
      if (processedOption.yAxis) {
        delete processedOption.yAxis;
      }
      
      if (processedOption.series) {
        const series = Array.isArray(processedOption.series) 
          ? processedOption.series 
          : [processedOption.series];
          
        for (let i = 0; i < series.length; i++) {
          if (series[i]) {
            // 将坐标系统改为leaflet
            series[i].coordinateSystem = 'leaflet';
          }
        }
      }
      
      // 设置选项
      this._ec.setOption(processedOption, notMerge);
      console.info('ECharts选项设置成功');
    } catch (e) {
      console.error('设置ECharts选项失败:', e, option);
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
        // 更新容器尺寸
        this._updateContainerSize();
        
        // 确保容器有正确的尺寸
        const width = this._echartsContainer.clientWidth || this._leaflet_map.getSize().x;
        const height = this._echartsContainer.clientHeight || this._leaflet_map.getSize().y;
        
        // 确保全局地图实例引用存在
        (window as any).__leafletMap = this._leaflet_map;
        (window as any).__leafletMapLastUpdated = Date.now();
        
        // 确保DOM元素上有地图引用
        this._prepareDomForECharts();
        
        // 确保坐标系统已注册
        this._registerCoordinateSystem();
        
        // 尝试检查是否有坐标系实例
        let hasLeafletComponent = false;
        try {
          const option = this._ec.getOption() as any;
          hasLeafletComponent = option && option.leaflet;
        } catch (e) {
          console.warn('检查leaflet组件失败:', e);
        }
        
        // 如果没有坐标系，先添加一个基本的leaflet配置
        if (!hasLeafletComponent) {
          console.info('未检测到leaflet组件，尝试添加基本配置');
          this._ec.setOption({
            leaflet: {
              roam: true,
              id: 'leaflet-base-' + Date.now()
            }
          }, {
            replaceMerge: ['leaflet']
          } as any);
        }
        
        // 调整图表尺寸
        this._ec.resize({
          width: width,
          height: height
        });
        
        // 确保每个系列都使用leaflet坐标系
        if (this._echartsOption) {
          // 确保每个系列都使用正确的坐标系统
          if (this._echartsOption.series) {
            const series = Array.isArray(this._echartsOption.series) 
              ? this._echartsOption.series 
              : [this._echartsOption.series];
              
            // 将所有系列的坐标系统设置为leaflet
            series.forEach(s => {
              if (s && typeof s === 'object') {
                s.coordinateSystem = 'leaflet';
              }
            });
          }
          
          // 确保有leaflet组件
          const updatedOption = { ...this._echartsOption };
          
          // 添加leaflet组件
          if (!updatedOption.leaflet) {
            updatedOption.leaflet = {
              roam: true,
              id: 'leaflet-update-' + Date.now()
            };
          }
          
          // 删除xAxis和yAxis，与leaflet坐标系冲突
          if (updatedOption.xAxis) {
            delete updatedOption.xAxis;
          }
          
          if (updatedOption.yAxis) {
            delete updatedOption.yAxis;
          }
          
          // 重新应用选项
          this._ec.setOption(updatedOption, {
            replaceMerge: ['series', 'leaflet']
          } as any);
        }
      } catch (e) {
        console.warn('更新图表失败:', e);
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
        console.warn('清空图表失败:', e);
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
        console.warn('重绘图表失败:', e);
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