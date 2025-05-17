/**
 * 飞线图对象
 * @description 管理地图飞线图显示，使用ol-echarts实现
 * 自动选中并高亮显示最新添加的飞线
 */
import { Map as OlMap } from 'ol';
import { View } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import logger from './LogObject';
import { FlightLineConfig, FlightLineData, FlightLinePoint, FlightCoord, DEFAULT_FLIGHTLINE_CONFIG, type FlightLineStyle } from '../types/flightline';

// 引入图标路径定义
const iconPaths = {
  plane: 'M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
  arrow: 'M30,10 L5,25 L30,40 L40,30 L25,25 L40,20 L30,10 z',
  triangle: 'M16,0 L32,32 L0,32 L16,0 z',
  circle: 'M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z',
  pin: 'M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z M16,5 C21.15,5 25.33,9.18 25.33,14.33 C25.33,19.48 21.15,23.67 16,23.67 C10.85,23.67 6.67,19.48 6.67,14.33 C6.67,9.18 10.85,5 16,5 Z'
};

/**
 * 飞线图类
 */
export class FlightLineObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 飞线图层
  private echartsLayer: any = null;
  // 配置
  private config: FlightLineConfig = {...DEFAULT_FLIGHTLINE_CONFIG};
  // 激活状态
  private active: boolean = false;
  // 飞线数据
  private flightLines: Map<string, FlightLineData> = new Map();
  // 事件监听器
  private eventListeners: EventsKey[] = [];
  // 飞线点数据-地理坐标映射
  private geoCoordMap: Record<string, number[]> = {};
  // Echarts实例
  private echartsInstance: any = null;
  // 是否正在初始化
  private initializing: boolean = false;
  // 当前激活的飞线ID
  private activeFlightLine: string | null = null;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param config 配置参数
   */
  constructor(mapInstance: OlMap | null = null, config?: Partial<FlightLineConfig>) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }

    if (config) {
      this.setConfig(config);
    }

    logger.debug('[FlightLine] 飞线图对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    if (!mapInstance) {
      logger.error('[FlightLine] 无效的地图实例');
      return;
    }

    this.mapInstance = mapInstance;
    logger.debug('[FlightLine] 地图实例已设置');
  }

  /**
   * 初始化 Echarts 图层
   * @private
   */
  private async initEchartsLayer(): Promise<void> {
    try {
      if (!this.mapInstance) {
        logger.error('[FlightLine] 无法初始化图层：地图实例不可用');
        return;
      }

      // 设置正在初始化标志
      this.initializing = true;

      // 检查地图尺寸
      const mapSize = this.mapInstance.getSize();
      if (!mapSize || !mapSize[0] || !mapSize[1]) {
        logger.error('[FlightLine] 地图尺寸无效，无法初始化图层', mapSize);
        // 尝试更新地图尺寸
        this.mapInstance.updateSize();
        // 再次检查尺寸
        const newSize = this.mapInstance.getSize();
        if (!newSize || !newSize[0] || !newSize[1]) {
          logger.error('[FlightLine] 更新后地图尺寸仍然无效，延迟初始化', newSize);
          // 延迟初始化
          this.initializing = false;
          setTimeout(() => {
            this.initEchartsLayer();
          }, 500);
          return;
        }
      }

      logger.debug('[FlightLine] 开始动态导入echarts库');
      try {
      // 动态导入ol-echarts和echarts库
        const olEchartsModule = await import('ol-echarts');
        const echartsModule = await import('echarts');

        this.echartsInstance = echartsModule;
        const EChartsLayer = olEchartsModule.default;
        
        logger.debug('[FlightLine] 已成功导入 echarts 和 ol-echarts', {
          hasECharts: !!this.echartsInstance,
          hasEChartsLayer: !!EChartsLayer
        });

        // 如果已有图层，先移除
        if (this.echartsLayer) {
          try {
            this.echartsLayer.remove();
            logger.debug('[FlightLine] 已移除旧的Echarts图层');
          } catch (e) {
            logger.warn('[FlightLine] 移除旧图层时出错:', e);
          }
          this.echartsLayer = null;
        }

        // 检查DOM是否准备就绪
        if (!this.mapInstance.getTargetElement()) {
          logger.error('[FlightLine] 地图DOM元素不存在，延迟初始化');
          this.initializing = false;
          setTimeout(() => {
            this.initEchartsLayer();
          }, 500);
          return;
        }

        // 参考 sakitam.com 的配置方式
      this.echartsLayer = new EChartsLayer({
          stopEvent: false,          // 允许事件继续传播
          hideOnMoving: this.config.hideOnMoving,
          hideOnZooming: this.config.hideOnZooming,
        forcedPrecomposeRerender: true, // 强制重新渲染
          insertFirst: false,        // 确保在地图的最上层
          polyfillEvents: true,      // 支持事件
          zIndex: 999,               // 设置更高的z-index
          className: 'flight-line-layer', // 添加自定义类名便于样式调整
        });

        logger.debug('[FlightLine] 创建了新的Echarts图层');

        // 将echarts图层添加到地图
      this.echartsLayer.appendTo(this.mapInstance);
        logger.debug('[FlightLine] 已将Echarts图层添加到地图');

        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 初始化飞线配置
        await this.updateEchartsOptions();
        logger.debug('[FlightLine] 已更新Echarts选项');
        
        // 监听地图事件
        //this.setupMapListeners();
        
        // 尝试调整图层z-index
        this.adjustLayerZindex();
        
        // 初始化完成后设置为激活状态
        this.active = true;
        this.initializing = false;
        
        logger.info('[FlightLine] 飞线图层初始化完成，模式：标准渲染');
      } catch (importError) {
        this.initializing = false;
        logger.error('[FlightLine] 导入依赖库失败:', importError);
        throw importError;
      }
    } catch (error) {
      this.initializing = false;
      this.active = false;
      logger.error('[FlightLine] 初始化图层失败:', error);
      throw error;
    }
  }

  /**
   * 调整图层的z-index以确保在地图上方
   * @private
   */
  private adjustLayerZindex(): void {
    if (!this.mapInstance) return;
    
    try {
      const mapElement = this.mapInstance.getTargetElement();
      
      // 查找echarts容器
      const selectors = [
        '.flight-line-layer',
        '.ol-echarts',
        '.ol-echarts-container',
        '.ol-layer:last-child',
        '.ol-layer canvas:last-of-type'
      ];
      
      for (const selector of selectors) {
        const elements = mapElement.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el: Element) => {
            if (el instanceof HTMLElement) {
              el.style.zIndex = '999';
              el.style.position = 'absolute';
              logger.debug(`[FlightLine] 设置元素z-index成功: ${selector}`);
            }
          });
        }
      }
      
      // 如果echartsLayer对象有设置z-index的方法，尝试调用
      if (this.echartsLayer) {
        if (typeof this.echartsLayer.setZIndex === 'function') {
          this.echartsLayer.setZIndex(999);
          logger.debug('[FlightLine] 通过方法设置图层z-index: 999');
        }
      }
    } catch (error) {
      logger.warn('[FlightLine] 调整图层z-index失败:', error);
    }
  }

  /**
   * 获取 Echarts 容器元素
   * @private
   */
  private getEchartsContainer(): HTMLElement | null {
    if (!this.mapInstance) return null;
    
    const mapElement = this.mapInstance.getTargetElement();
    if (!mapElement) return null;

    // 尝试查找容器
    return mapElement.querySelector('.flight-line-layer') || 
           mapElement.querySelector('.ol-echarts') || 
           mapElement.querySelector('.ol-echarts-container');
  }

  /**
   * 设置地图事件监听器
   * @private
   */
  private setupMapListeners(): void {
    if (!this.mapInstance) return;
    
    try {
      // 监听视图变化事件
      const viewChangeKey = this.mapInstance.getView().on('change:resolution', () => {
        if (this.echartsLayer && typeof this.echartsLayer.redraw === 'function') {
          // 如果开启了性能模式且正在缩放，则跳过重绘
          if (this.config.hideOnZooming && this.config.enablePerformanceMode) {
            return;
          }
          
          // 重新渲染
          this.echartsLayer.redraw();
          logger.debug('[FlightLine] 视图分辨率变化，重新渲染图层');
        }
      });
      
      // 监听地图移动开始事件
      const moveStartKey = this.mapInstance.on('movestart', () => {
        if (this.config.hideOnMoving && this.config.enablePerformanceMode) {
          // 在地图移动时隐藏图层提高性能
        if (this.echartsLayer) {
            const container = this.getEchartsContainer();
            if (container) {
              container.style.display = 'none';
            }
          }
          logger.debug('[FlightLine] 地图移动开始，隐藏图层');
        }
      });
        
      // 监听地图移动结束事件
      const moveEndKey = this.mapInstance.on('moveend', () => {
        if (this.config.hideOnMoving && this.config.enablePerformanceMode) {
          // 地图移动结束后显示图层
          if (this.echartsLayer) {
            const container = this.getEchartsContainer();
            if (container) {
              container.style.display = 'block';
          }
            
            // 更新并重绘
            if (typeof this.echartsLayer.redraw === 'function') {
              this.echartsLayer.redraw();
        }
          }
          logger.debug('[FlightLine] 地图移动结束，显示并重绘图层');
        }
        });
        
      // 存储事件监听器，以便后续移除
      this.eventListeners.push(viewChangeKey, moveStartKey, moveEndKey);

      logger.debug('[FlightLine] 已设置地图事件监听器');
    } catch (error) {
      logger.error('[FlightLine] 设置地图事件监听器失败:', error);
    }
  }

  /**
   * 更新 Echarts 选项
   * @private
   */
  private updateEchartsOptions(): void {
    if (!this.echartsLayer || !this.active) {
      logger.warn('[FlightLine] 无法更新Echarts选项：图层未初始化或未激活');
      return;
    }
    
    // 设置初始化标志，防止并发初始化
    this.initializing = true;
    
    try {
      // 准备飞线数据
      const lines = this.convertFlightLineData();
      
      // 准备ECharts所需的完整配置
      const options = {
        animation: true, // 开启动画
        backgroundColor: 'transparent',
        title: {
          show: false  // 隐藏标题
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}'
        },
        // 添加必须的坐标系统配置
        xAxis: {
          show: false,
          type: 'value',
          min: -180,
          max: 180
        },
        yAxis: {
          show: false,
          type: 'value',
          min: -90,
          max: 90
        },
        // 添加网格配置
        grid: {
          show: false,
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          containLabel: true
        },
        series: []
      };
      
      // 如果有飞线数据，添加飞线系列
      if (lines.length > 0) {
        const effectScatterSeries = {
          name: 'effectScatter',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d', // 使用笛卡尔坐标系
          zlevel: this.config.zIndex || 90, // 使用配置中的zIndex
          symbol: 'circle',
          symbolSize: this.config.nodeSymbolSize || 12,
          showEffectOn: 'render',
          rippleEffect: {
            period: this.config.rippleEffect?.period || 2.5,
            scale: this.config.rippleEffect?.scale || 4,
            brushType: this.config.rippleEffect?.brushType || 'stroke'
          },
          silent: true,
          itemStyle: {
            color: this.config.nodeColor || '#1677ff',
            shadowBlur: this.config.shadowBlur || 10,
            shadowColor: this.config.shadowColor || this.config.nodeColor || '#1677ff'
          },
          data: this.getNodeData()
        };
        
        const linesSeries = {
          name: 'lines',
          type: 'lines',
          coordinateSystem: 'cartesian2d', // 使用笛卡尔坐标系
          zlevel: (this.config.zIndex || 90) + 1, // 比节点层级高1
          lineStyle: {
            color: this.config.color || '#1677ff',
            width: this.config.width || 1,
            opacity: this.config.opacity || 0.8,
            curveness: this.config.curveness || 0.2,
            // 添加平滑曲线相关配置
            smooth: this.config.smooth !== undefined ? this.config.smooth : true,
            smoothConstraint: this.config.smoothConstraint !== undefined ? this.config.smoothConstraint : true,
            smoothMonotone: this.config.smoothMonotone
          },
          effect: {
            show: this.config.showEffect,
            period: this.config.effectPeriod || 3,
            trailLength: this.config.effectTrailLength || 0.1,
            symbol: this.getEffectSymbol(this.config.effectSymbol, this.config.effectSymbolPath),
            symbolSize: this.config.effectSymbolSize || 18,
            color: this.config.trailColor || this.config.color || '#1677ff',
            opacity: this.config.trailOpacity || 0.7,
            shadowBlur: this.config.shadowBlur || 10,
            shadowColor: this.config.shadowColor || this.config.color || '#1677ff'
          },
          silent: true,
          data: lines
        };
        
        // 只有在启用节点时添加节点系列
        if (this.config.showNodes !== false) {
          options.series.push(effectScatterSeries);
          
          // 只有在启用节点特效时才添加rippleEffect
          if (this.config.nodeEffect === false) {
            // @ts-ignore: 类型错误但运行时有效
            effectScatterSeries.rippleEffect.scale = 0;
            }
        }
        
        // 添加线条系列
        options.series.push(linesSeries);
      }
      
      // 设置ECharts选项
      this.echartsLayer.setChartOptions(options);

      logger.debug('[FlightLine] Echarts选项已更新');
    } catch (error) {
      logger.error('[FlightLine] 更新Echarts选项失败:', error);
    } finally {
      // 清除初始化标志
      this.initializing = false;
    }
  }

  /**
   * 获取有效的飞线图标
   * 统一处理图标路径获取逻辑
   * @param effectSymbol 图标类型名称
   * @param effectSymbolPath 自定义图标路径
   * @returns 处理后的有效图标路径
   * @private
   */
  private getEffectSymbol(effectSymbol?: string, effectSymbolPath?: string): string {
    // 如果有自定义路径，优先使用
    if (effectSymbolPath) {
      // 确保路径以path://开头
      return effectSymbolPath.startsWith('path://') ? effectSymbolPath : `path://${effectSymbolPath}`;
    }
    
    // 如果有内置图标类型且在预定义图标中存在
    if (effectSymbol && effectSymbol in iconPaths) {
      return `path://${iconPaths[effectSymbol]}`;
    }
    
    // 默认使用飞机图标
    return `path://${iconPaths.plane}`;
  }

  /**
   * 将飞线数据转换为echarts配置选项
   * @returns echarts配置选项
   */
  private convertFlightLineData(): any[] {
    const result: any[] = [];
    
    if (this.flightLines.size === 0) {
      logger.warn('[FlightLine] 飞线数据为空，请先添加飞线数据');
      return result;
    }
    
    logger.debug(`[FlightLine] 开始转换 ${this.flightLines.size} 条飞线数据`);
    
    // 如果没有激活的飞线，返回空数组，不显示任何飞线
    if (!this.activeFlightLine) {
      logger.debug('[FlightLine] 没有激活的飞线，不显示任何飞线');
      return result;
    }
    
    // 获取激活的飞线
    const activeLine = this.flightLines.get(this.activeFlightLine);
    if (!activeLine) {
      logger.warn(`[FlightLine] 获取激活飞线失败, ID: ${this.activeFlightLine}`);
      return result;
      }
      
    // 检查激活的飞线是否是多组坐标
    if (activeLine.isMultiCoords && activeLine.coords && Array.isArray(activeLine.coords)) {
      // 处理多组坐标
      const multiCoords = activeLine.coords as any[];
          
          multiCoords.forEach((coordGroup, index) => {
        if (coordGroup.from && coordGroup.to) {
          const fromName = coordGroup.fromName || activeLine.fromName || `起点${index}`;
          const toName = coordGroup.toName || activeLine.toName || `终点${index}`;
            const fromCoord = coordGroup.from;
            const toCoord = coordGroup.to;
            
          // 确保坐标都是有效的
            if (!this.isValidCoordinate(fromCoord) || !this.isValidCoordinate(toCoord)) {
            logger.warn(`[FlightLine] 无效坐标: [${fromCoord}] => [${toCoord}]`);
            return; // 跳过此条数据
          }
          
          const lineStyle = coordGroup.style || activeLine.style || {};
          const highlight = activeLine.highlight || false;
          
          // 使用经纬度直接用于笛卡尔坐标系
          // 对于cartesian2d坐标系，我们需要调整数据格式
          result.push({
            coords: [
              fromCoord, // [lon, lat]
              toCoord    // [lon, lat]
            ],
            // 添加名称等信息
            fromName,
            toName,
            value: coordGroup.value || activeLine.value || 1,
            // 使用自定义样式
              lineStyle: {
              color: highlight ? '#ff0000' : (lineStyle.color || this.config.color || '#1677ff'),
              width: highlight ? 3 : (lineStyle.width || this.config.width || 1),
              opacity: highlight ? 1 : (lineStyle.opacity || this.config.opacity || 0.8),
              curveness: lineStyle.curveness || this.config.curveness || 0.2,
              type: 'solid' // 固定为solid类型
            },
            // 使用自定义动画效果
            effect: {
              show: this.config.showEffect,
              period: this.config.effectPeriod || 3,
              trailLength: this.config.effectTrailLength || 0.1,
              // 使用单独配置的符号或全局符号
              symbol: this.getEffectSymbol(coordGroup.effectSymbol || activeLine.effectSymbol || this.config.effectSymbol,
                                      coordGroup.effectSymbolPath || activeLine.effectSymbolPath || this.config.effectSymbolPath),
              symbolSize: coordGroup.effectSymbolSize || activeLine.effectSymbolSize || this.config.effectSymbolSize || 18
            }
          });
            }
      });
    } else {
      // 传统单组坐标处理逻辑
      let fromCoord, toCoord;
      
      // 确定起点坐标
      if (activeLine.from) {
        fromCoord = activeLine.from;
      } else if (activeLine.fromName && this.geoCoordMap[activeLine.fromName]) {
        fromCoord = this.geoCoordMap[activeLine.fromName];
      } else if (activeLine.coords && Array.isArray(activeLine.coords) && activeLine.coords.length > 0) {
        fromCoord = activeLine.coords[0];
      }
      
      // 确定终点坐标
      if (activeLine.to) {
        toCoord = activeLine.to;
      } else if (activeLine.toName && this.geoCoordMap[activeLine.toName]) {
        toCoord = this.geoCoordMap[activeLine.toName];
      } else if (activeLine.coords && Array.isArray(activeLine.coords) && activeLine.coords.length > 1) {
        toCoord = activeLine.coords[1];
          }

          // 确保坐标有效
      if (!this.isValidCoordinate(fromCoord) || !this.isValidCoordinate(toCoord)) {
        logger.warn(`[FlightLine] 无效坐标: [${fromCoord}] => [${toCoord}]`);
        return result;
          }

      const lineStyle = activeLine.style || {};
      const highlight = activeLine.highlight || false;
      
      // 对于cartesian2d坐标系，直接使用经纬度
      result.push({
        coords: [
          fromCoord, // [lon, lat]
          toCoord    // [lon, lat]
        ],
        // 添加名称等信息
        fromName: activeLine.fromName,
        toName: activeLine.toName,
        value: activeLine.value || 1,
        // 使用自定义样式
            lineStyle: {
          color: highlight ? '#ff0000' : (lineStyle.color || this.config.color || '#1677ff'),
          width: highlight ? 3 : (lineStyle.width || this.config.width || 1),
          opacity: highlight ? 1 : (lineStyle.opacity || this.config.opacity || 0.8),
          curveness: lineStyle.curveness || this.config.curveness || 0.2,
          type: 'solid' // 固定为solid类型
        },
        // 使用自定义动画效果
        effect: {
          show: this.config.showEffect,
          period: this.config.effectPeriod || 3,
          trailLength: this.config.effectTrailLength || 0.1,
          // 使用单独配置的符号或全局符号
          symbol: this.getEffectSymbol(activeLine.effectSymbol || this.config.effectSymbol,
                                  activeLine.effectSymbolPath || this.config.effectSymbolPath),
          symbolSize: activeLine.effectSymbolSize || this.config.effectSymbolSize || 18
        }
      });
    }
    
    logger.debug(`[FlightLine] 已生成 ${result.length} 条飞线数据`);
    return result;
  }

  /**
   * 获取节点数据
   * @returns 节点数据数组
   * @private
   */
  private getNodeData(): any[] {
    const result: any[] = [];
    
    // 如果没有活动飞线，返回空数组
    if (!this.activeFlightLine) {
      return result;
    }
    
    const activeLine = this.flightLines.get(this.activeFlightLine);
    if (!activeLine) {
      return result;
    }
    
    // 节点名称集合，防止重复添加相同名称的节点
    const nodeNames = new Set<string>();
    
    // 如果是多组坐标的飞线
    if (activeLine.isMultiCoords && activeLine.coords && Array.isArray(activeLine.coords)) {
      // 处理多组坐标
      const multiCoords = activeLine.coords as any[];
      
      multiCoords.forEach((coordGroup, index) => {
        if (coordGroup.from && coordGroup.to) {
          const fromName = coordGroup.fromName || activeLine.fromName || `起点${index}`;
          const toName = coordGroup.toName || activeLine.toName || `终点${index}`;
          
          // 只添加不存在的节点名称
          if (!nodeNames.has(fromName) && this.isValidCoordinate(coordGroup.from)) {
            // 对于cartesian2d坐标系，直接使用经纬度数据
            result.push({
              name: fromName,
              value: coordGroup.from, // [lon, lat]
              symbolSize: this.config.nodeSymbolSize || 12,
              itemStyle: {
                color: this.config.nodeColor || '#1677ff'
              }
            });
            nodeNames.add(fromName);
          }
          
          if (!nodeNames.has(toName) && this.isValidCoordinate(coordGroup.to)) {
            // 对于cartesian2d坐标系，直接使用经纬度数据
            result.push({
              name: toName,
              value: coordGroup.to, // [lon, lat]
              symbolSize: this.config.nodeSymbolSize || 12,
              itemStyle: {
                color: this.config.nodeColor || '#1677ff'
              }
            });
            nodeNames.add(toName);
          }
        }
      });
    } else {
      // 传统单组坐标处理逻辑
      let fromCoord, toCoord;
      
      // 确定起点坐标
      if (activeLine.from) {
        fromCoord = activeLine.from;
      } else if (activeLine.fromName && this.geoCoordMap[activeLine.fromName]) {
        fromCoord = this.geoCoordMap[activeLine.fromName];
      } else if (activeLine.coords && Array.isArray(activeLine.coords) && activeLine.coords.length > 0) {
        fromCoord = activeLine.coords[0];
      }
      
      // 确定终点坐标
      if (activeLine.to) {
        toCoord = activeLine.to;
      } else if (activeLine.toName && this.geoCoordMap[activeLine.toName]) {
        toCoord = this.geoCoordMap[activeLine.toName];
      } else if (activeLine.coords && Array.isArray(activeLine.coords) && activeLine.coords.length > 1) {
        toCoord = activeLine.coords[1];
      }
      
      // 添加起点
      if (this.isValidCoordinate(fromCoord)) {
        // 对于cartesian2d坐标系，直接使用经纬度数据
        result.push({
          name: activeLine.fromName,
          value: fromCoord, // [lon, lat]
          symbolSize: this.config.nodeSymbolSize || 12,
          itemStyle: {
            color: this.config.nodeColor || '#1677ff'
          }
        });
        }
        
      // 添加终点
      if (this.isValidCoordinate(toCoord)) {
        // 对于cartesian2d坐标系，直接使用经纬度数据
        result.push({
          name: activeLine.toName,
          value: toCoord, // [lon, lat]
          symbolSize: this.config.nodeSymbolSize || 12,
          itemStyle: {
            color: this.config.nodeColor || '#1677ff'
      }
    });
      }
    }
    
    logger.debug(`[FlightLine] 已生成 ${result.length} 个节点数据`);
    return result;
    }
    
  /**
   * 检查坐标是否有效
   * @param coord 经纬度坐标
   * @returns 是否有效
   */
  private isValidCoordinate(coord: number[] | null | undefined): boolean {
    if (!coord || !Array.isArray(coord) || coord.length < 2) {
      return false;
    }
    
    // 确保是数值类型
    const lon = Number(coord[0]);
    const lat = Number(coord[1]);
    
    if (isNaN(lon) || isNaN(lat)) {
      return false;
    }
    
    // 简单的经纬度范围检查
    // 经度范围: -180 到 180
    // 纬度范围: -90 到 90
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      logger.warn(`[FlightLine] 坐标超出经纬度合理范围: [${lon}, ${lat}]`);
      return false;
    }
    
    return true;
  }

  /**
   * 获取坐标的像素位置 - 这个方法在新的实现中可能不再需要
   * 保留备用，某些特殊场景可能需要
   * @param coord 经纬度坐标 [经度, 纬度]
   * @returns 像素坐标 [x, y]
   */
  private getPixelCoordinate(coord: number[]): number[] | null {
    if (!this.mapInstance || !coord || coord.length < 2) {
      return null;
    }
    
    try {
      // 将经纬度转换为地图投影坐标
      const projected = fromLonLat([coord[0], coord[1]]);
      // 转换为像素坐标
      const pixel = this.mapInstance.getPixelFromCoordinate(projected);
      
      if (pixel) {
        return pixel;
      }
      
      return null;
    } catch (error) {
      logger.error('[FlightLine] 坐标转换错误:', error);
      return null;
    }
  }

  /**
   * 确保坐标是经纬度格式
   * @param coord 输入坐标
   * @returns 经纬度坐标 [经度, 纬度]
   */
  private ensureGeoCoordinate(coord: number[]): number[] {
    if (!coord || coord.length < 2) {
      return [0, 0];
    }
    
    try {
      // 检查坐标是否在合理的经纬度范围内
      if (Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90) {
        return coord; // 已经是经纬度
      }
      
      // 尝试从投影坐标转换为经纬度
      if (this.mapInstance) {
        const lonLat = toLonLat(coord, this.mapInstance.getView().getProjection());
        return lonLat;
      }
      
      return coord;
    } catch (error) {
      logger.error('[FlightLine] 确保经纬度坐标时发生错误:', error);
      return coord;
    }
  }

  /**
   * 设置配置
   * @param config 配置参数
   */
  public setConfig(config: Partial<FlightLineConfig>): void {
    // 合并配置，但始终确保 useGLMode 为 false
    this.config = {
      ...this.config,
      ...config,
      useGLMode: false // 强制禁用GL渲染模式
    };

    // 确保飞线平滑度相关属性正确设置
    if (config.smooth !== undefined) {
      this.config.smooth = config.smooth;
    }
    if (config.smoothConstraint !== undefined) {
      this.config.smoothConstraint = config.smoothConstraint;
    }
    if (config.smoothMonotone !== undefined) {
      this.config.smoothMonotone = config.smoothMonotone;
    }

    // 确保rippleEffect相关配置正确设置
    if (config.rippleEffect) {
      this.config.rippleEffect = {
        ...this.config.rippleEffect,
        ...config.rippleEffect
      };
    }

    // 确保阴影相关配置正确设置
    if (config.shadowBlur !== undefined) {
      this.config.shadowBlur = config.shadowBlur;
    }
    if (config.shadowColor !== undefined) {
      this.config.shadowColor = config.shadowColor;
    }

    // 如果已激活，则更新echarts选项
    if (this.active && this.echartsLayer) {
      this.updateEchartsOptions();
    }

    logger.debug('[FlightLine] 飞线图配置已更新', this.config);
  }

  /**
   * 添加飞线点地理坐标
   * @param name 点名称
   * @param coordinate 经纬度坐标 [经度, 纬度]
   */
  public addCoordinate(name: string, coordinate: [number, number]): void {
    this.geoCoordMap[name] = coordinate;
    
    // 如果已激活，则更新echarts选项
    if (this.active && this.echartsLayer) {
      this.updateEchartsOptions();
    }
    
    logger.debug(`[FlightLine] 添加飞线点坐标: ${name} = [${coordinate}]`);
  }

  /**
   * 批量添加飞线点地理坐标
   * @param coordinates 点名称和坐标的映射 { 点名称: [经度, 纬度] }
   */
  public addCoordinates(coordinates: Record<string, [number, number]>): void {
    for (const [name, coord] of Object.entries(coordinates)) {
      this.geoCoordMap[name] = coord;
    }
    
    // 如果已激活，则更新echarts选项
    if (this.active && this.echartsLayer) {
      this.updateEchartsOptions();
    }
    
    logger.debug(`[FlightLine] 批量添加飞线点坐标: ${Object.keys(coordinates).length} 个点`);
  }

  /**
   * 添加单个飞线
   * @param flightLine 飞线数据
   * @returns 飞线ID
   */
  public addFlightLine(flightLine: FlightLineData): string {
    // 生成唯一ID
    const id = flightLine.id || `flight-line-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 检查是否为多组坐标的飞线
    const isMultiCoords = flightLine.coords && 
                         Array.isArray(flightLine.coords) && 
                         flightLine.coords.length > 0 && 
                         typeof flightLine.coords[0] === 'object' && 
                         'from' in flightLine.coords[0] && 
                         'to' in flightLine.coords[0];
    
    if (isMultiCoords) {
      logger.debug(`[FlightLine] 添加多组坐标飞线，共 ${flightLine.coords.length} 组坐标`);
      
      // 为多组坐标飞线设置标记
      flightLine.isMultiCoords = true;
      
      // 处理所有坐标组的地理坐标
      const multiCoords = flightLine.coords as any[];
      multiCoords.forEach((coordGroup, index) => {
        if (coordGroup.from && coordGroup.to) {
          // 添加坐标到geoCoordMap
          const fromName = coordGroup.fromName || flightLine.fromName || `起点${index}`;
          const toName = coordGroup.toName || flightLine.toName || `终点${index}`;
          
          if (!this.geoCoordMap[fromName] && coordGroup.from) {
            this.geoCoordMap[fromName] = coordGroup.from;
            logger.debug(`[FlightLine] 为多组坐标飞线起点 ${fromName} 添加地理坐标: [${coordGroup.from}]`);
          }
          
          if (!this.geoCoordMap[toName] && coordGroup.to) {
            this.geoCoordMap[toName] = coordGroup.to;
            logger.debug(`[FlightLine] 为多组坐标飞线终点 ${toName} 添加地理坐标: [${coordGroup.to}]`);
          }
        }
      });
    } else {
      // 处理传统单组坐标飞线
      let coords = flightLine.coords;
      
      // 如果提供了from/to但没有coords，则转换成coords
      if (!coords && flightLine.from && flightLine.to) {
        coords = [flightLine.from, flightLine.to];
      }
      
      // 检查坐标是否已经在地理坐标映射中
      if (!this.geoCoordMap[flightLine.fromName] && coords && Array.isArray(coords) && coords.length >= 1) {
        // 确保coords是number[][]类型
        const firstCoord = coords[0] as number[];
        if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
          this.geoCoordMap[flightLine.fromName] = firstCoord;
          logger.debug(`[FlightLine] 为起点 ${flightLine.fromName} 添加地理坐标: [${firstCoord}]`);
        }
      }
      
      if (!this.geoCoordMap[flightLine.toName] && coords && Array.isArray(coords) && coords.length >= 2) {
        // 确保coords是number[][]类型
        const secondCoord = coords[1] as number[];
        if (Array.isArray(secondCoord) && secondCoord.length >= 2) {
          this.geoCoordMap[flightLine.toName] = secondCoord;
          logger.debug(`[FlightLine] 为终点 ${flightLine.toName} 添加地理坐标: [${secondCoord}]`);
        }
      }
    }
    
    // 为飞线添加ID和createTime
    const flightLineWithId: FlightLineData = {
      ...flightLine,
      id,
      _createTime: flightLine._createTime || Date.now() // 如果没有提供_createTime，则添加当前时间
    };
    
    // 标记飞线默认为不激活状态
    flightLineWithId.isActive = false;
    
    // 保存飞线数据
    this.flightLines.set(id, flightLineWithId);
    
    // 记录添加时间
    logger.debug(`[FlightLine] 添加飞线 ${id}: ${flightLine.fromName} -> ${flightLine.toName}`);
    
    // 如果是第一条飞线，设置为活动飞线
    if (this.flightLines.size === 1) {
      this.activeFlightLine = id;
      flightLineWithId.isActive = true;
      logger.debug(`[FlightLine] 设置第一条飞线 ${id} 为活动飞线`);
    }
    
    // 刷新图层
    this.drawFlightLines();
    
    return id;
  }

  /**
   * 批量添加飞线
   * @param flightLines 飞线数据数组
   * @param keepOrder 是否保持原始顺序，true表示保持原始顺序，false表示使用_createTime排序
   * @param limit 最大显示数量限制，0表示不限制
   * @returns 添加的飞线ID数组
   */
  public addFlightLines(flightLines: FlightLineData[], keepOrder: boolean = false, limit: number = 0): string[] {
    if (!flightLines || !Array.isArray(flightLines) || flightLines.length === 0) {
      logger.warn('[FlightLine] 添加飞线失败：飞线数据数组为空');
      return [];
    }

    logger.debug(`[FlightLine] 开始批量添加 ${flightLines.length} 条飞线数据`);
    
    // 排序飞线数据
    let processedFlightLines = [...flightLines];
    
    // 确保所有飞线都有_createTime
    processedFlightLines = processedFlightLines.map(line => ({
      ...line,
      _createTime: line._createTime || Date.now()
    }));
    
    // 如果不保持原始顺序，按照_createTime降序排序
    if (!keepOrder) {
      processedFlightLines.sort((a, b) => (b._createTime || 0) - (a._createTime || 0));
      logger.debug('[FlightLine] 已按照_createTime降序排序飞线数据');
    }
    
    // 限制显示数量
    if (limit > 0 && processedFlightLines.length > limit) {
      logger.debug(`[FlightLine] 飞线数量超过限制，只显示前 ${limit} 条`);
      processedFlightLines = processedFlightLines.slice(0, limit);
    }
    
    // 批量添加飞线
    const ids: string[] = [];
    processedFlightLines.forEach(line => {
      try {
        const id = this.addFlightLine(line);
        ids.push(id);
      } catch (error) {
        logger.error('[FlightLine] 添加飞线失败:', error);
      }
    });

    logger.debug(`[FlightLine] 成功添加 ${ids.length} 条飞线数据`);
    
    return ids;
  }

  /**
   * 获取所有飞线数据
   * @returns 所有飞线数据的Map集合
   */
  public getAllFlightLines(): Map<string, FlightLineData> {
    // 确保返回的是有效的Map对象
    if (!(this.flightLines instanceof Map)) {
      logger.warn('[FlightLine] 飞线数据不是有效的Map对象，创建新的空Map');
      this.flightLines = new Map<string, FlightLineData>();
    }
    
    // 添加详细日志记录飞线数量和内容
    logger.debug(`[FlightLine] 获取所有飞线数据，共${this.flightLines.size}条`);
    
    // 详细记录所有飞线ID
    const allIds = Array.from(this.flightLines.keys());
    logger.debug(`[FlightLine] 飞线IDs: ${allIds.join(', ')}`);
    
    // 检查飞线数据是否有效
    let validCount = 0;
    this.flightLines.forEach((line, id) => {
      if (line && line.fromName && line.toName) {
        validCount++;
      } else {
        logger.warn(`[FlightLine] 发现无效飞线数据: ${id}`);
      }
    });
    logger.debug(`[FlightLine] 有效飞线数: ${validCount}/${this.flightLines.size}`);
    
    return this.flightLines;
  }

  /**
   * 获取当前激活的飞线ID
   * @returns 当前激活的飞线ID
   */
  public getActiveFlightLine(): string | null {
    return this.activeFlightLine;
  }
  
  /**
   * 设置激活的飞线
   * @param id 飞线ID
   * @returns 是否设置成功
   */
  public setActiveFlightLine(id: string): boolean {
    // 检查飞线是否存在
    if (!this.flightLines.has(id)) {
      logger.warn(`[FlightLine] 飞线 ${id} 不存在，无法设置为激活状态`);
      return false;
    }
    
    // 如果已有高亮飞线，先取消高亮
    if (this.activeFlightLine && this.activeFlightLine !== id) {
      const prevLine = this.flightLines.get(this.activeFlightLine);
      if (prevLine) {
        prevLine.isActive = false;
        prevLine.highlight = false;
        delete prevLine.style; // 恢复默认样式
      }
    }
    
    // 设置新的激活飞线
    this.activeFlightLine = id;
    
    // 获取飞线对象并设置激活状态
    const activeLine = this.flightLines.get(id);
    if (activeLine) {
      activeLine.isActive = true;
      activeLine.highlight = true;
      activeLine.style = {
        width: (this.config.width || 1) * 1.5,
        opacity: 1,
        color: '#1677ff', // 蓝色高亮
        curveness: this.config.curveness
      };
    }
    
    // 如果图层已激活，更新渲染
    if (this.active && this.echartsLayer) {
      this.updateEchartsOptions();
    }
    
    logger.debug(`[FlightLine] 设置飞线 ${id} 为激活状态`);
    return true;
  }
  
  /**
   * 更新单个飞线的样式或状态
   * @param id 飞线ID
   * @param options 更新选项
   */
  public updateFlightLine(id: string, options: {
    highlight?: boolean;
    style?: Partial<FlightLineStyle>;
    custom?: {
      effectSymbol?: string;
      effectSymbolPath?: string;
      effectSymbolSize?: number;
    };
  }): boolean {
    // 检查飞线是否存在
    const flightLine = this.flightLines.get(id);
    if (!flightLine) {
      logger.warn(`飞线 ${id} 不存在，无法更新`);
      return false;
    }
    
    try {
      // 更新数据属性
      if (options.highlight !== undefined) {
        flightLine.highlight = options.highlight;
      }
      
      if (options.style) {
        flightLine.style = {
          ...(flightLine.style || {}),
          ...options.style
        };
      }
      
      // 处理自定义图标设置
      if (options.custom) {
        if (options.custom.effectSymbol !== undefined) {
          flightLine.effectSymbol = options.custom.effectSymbol;
        }
        
        if (options.custom.effectSymbolSize !== undefined) {
          flightLine.effectSymbolSize = options.custom.effectSymbolSize;
        }
        
        // 处理自定义图标路径
        if (options.custom.effectSymbolPath !== undefined) {
          flightLine.effectSymbolPath = options.custom.effectSymbolPath;
        } else if (options.custom.effectSymbol && options.custom.effectSymbol in iconPaths) {
          // 使用getEffectSymbol方法获取标准化路径
          flightLine.effectSymbolPath = this.getEffectSymbol(options.custom.effectSymbol);
        }
      }
      
      // 更新内部数据
      this.flightLines.set(id, flightLine);
      
      // 如果已激活，重新渲染图表
      if (this.active && this.echartsLayer) {
        // 记录更新操作
        if (options.highlight) {
          logger.debug(`[FlightLine] 高亮飞线: ${id}`);
        } else if (options.highlight === false) {
          logger.debug(`[FlightLine] 取消高亮飞线: ${id}`);
        }
        
        if (options.custom) {
          logger.debug(`[FlightLine] 更新飞线图标: ${id}, 图标类型: ${options.custom.effectSymbol || flightLine.effectSymbol || '默认'}`);
        }
        
        // 重新设置图表选项以更新显示
        this.updateEchartsOptions();
      }
      
      return true;
    } catch (error) {
      logger.error(`更新飞线 ${id} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 启用飞线图
   * @param showTestData 是否显示测试数据，默认为false
   */
  public async enable(showTestData: boolean = false): Promise<void> {
    if (this.active) {
      logger.debug('[FlightLine] 飞线图已经处于激活状态');
    
      // 即使已经激活，也尝试更新一次选项，确保显示正常
      if (this.echartsLayer) {
        this.updateEchartsOptions();
    
        // 仅在明确指定要显示测试数据时才添加
        if (showTestData && this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
          logger.debug('[FlightLine] 已激活但无数据，添加测试数据（由用户显式请求）');
          this.updateEchartsOptions();
  }

        // 延迟注册后续处理，确保图层和DOM已经就绪
        this.schedulePostEnableProcessing();
      }
      return;
    }

    if (!this.mapInstance) {
      logger.error('[FlightLine] 地图实例不存在，无法启用飞线图');
      return;
    }

    logger.info('[FlightLine] 开始启用飞线图，使用普通渲染模式');
    
    // 确保禁用GL渲染模式
    this.config.useGLMode = false;
    
    // 确保地图尺寸有效
    try {
      const mapSize = this.mapInstance.getSize();
      if (!mapSize || !mapSize[0] || !mapSize[1]) {
        logger.warn('[FlightLine] 地图尺寸无效，尝试更新地图尺寸');
        this.mapInstance.updateSize();
      }

      // 初始化图层
      await this.initEchartsLayer();

      // 初始化完成后设置为激活状态
      this.active = true;
      
      // 仅在明确指定要显示测试数据时才添加
      if (showTestData && this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
        logger.debug('[FlightLine] 已激活但无数据，添加测试数据（由用户显式请求）');
        this.updateEchartsOptions();
      } else {
        // 启用时不自动显示飞线，初始化为空图层
        logger.debug('[FlightLine] 飞线图启用时不显示任何飞线，等待用户操作');
        // 确保不会显示任何飞线
        this.clearFlightLines();
      }
      
      // 延迟注册后续处理，确保图层和DOM已经就绪
      this.schedulePostEnableProcessing();
      
      logger.info('[FlightLine] 飞线图已启用，渲染模式: 标准');
      return;
    } catch (error) {
      logger.error('[FlightLine] 启用飞线图失败:', error);
      this.active = false;
      throw error;
    }
  }

  /**
   * 分阶段处理启用后的任务，确保稳定性
   * @private
   */
  private schedulePostEnableProcessing(): void {
    // 阶段1：立即触发地图更新尺寸
    try {
      if (this.mapInstance) {
        this.mapInstance.updateSize();
        logger.debug('[FlightLine] 阶段1: 触发地图尺寸更新');
      }
    } catch (error) {
      logger.warn('[FlightLine] 阶段1处理错误:', error);
    }

    // 阶段2：300ms后重新渲染图表
    setTimeout(() => {
      try {
        if (this.echartsLayer) {
          this.updateEchartsOptions();
          if (typeof this.echartsLayer.redraw === 'function') {
            this.echartsLayer.redraw();
            logger.debug('[FlightLine] 阶段2: 重新渲染图表');
          }
        }
      } catch (error) {
        logger.warn('[FlightLine] 图表渲染处理错误:', error);
    }
    }, 300);

    // 阶段3：不再自动设置最佳视角，避免自动渲染所有飞线
    // 只在有激活飞线的情况下考虑设置视角
    setTimeout(() => {
      try {
        if (this.activeFlightLine) {
          logger.debug('[FlightLine] 有激活的飞线，设置相应视角');
          this.setOptimalView(5);
        } else {
          logger.debug('[FlightLine] 没有激活的飞线，跳过设置视角');
        }
      } catch (error) {
        logger.warn('[FlightLine] 视角处理失败:', error);
      }
    }, 600);

    // 阶段4：1000ms后最终刷新
    setTimeout(() => {
      try {
        if (this.echartsLayer && typeof this.echartsLayer.redraw === 'function') {
          // 只在有激活飞线的情况下执行重绘
          if (this.activeFlightLine) {
            this.echartsLayer.redraw();
            logger.debug('[FlightLine] 最终刷新完成');
          } else {
            logger.debug('[FlightLine] 没有激活的飞线，跳过最终刷新');
          }
        }
      } catch (error) {
        logger.warn('[FlightLine] 最终刷新处理出错:', error);
      }
    }, 1000);
  }


  /**
   * 禁用飞线图
   */
  public disable(): void {
    if (!this.active) {
      logger.debug('[FlightLine] 飞线图已经处于禁用状态');
      return;
    }

    if (this.echartsLayer) {
      // 移除图层
      try {
        this.echartsLayer.remove();
        logger.debug('[FlightLine] Echarts图层已从地图移除');
      } catch (error) {
        logger.error('[FlightLine] 移除Echarts图层失败:', error);
      }
    }

    // 移除事件监听
    for (const eventKey of this.eventListeners) {
      try {
      unByKey(eventKey);
      } catch (error) {
        logger.warn('[FlightLine] 移除事件监听失败:', error);
      }
    }
    this.eventListeners = [];

    this.active = false;
    logger.debug('[FlightLine] 飞线图已禁用');
  }

  /**
   * 检查飞线图是否启用
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * 销毁飞线图对象
   */
  public destroy(): void {
    this.disable();
    this.flightLines.clear();
    this.geoCoordMap = {};
    this.mapInstance = null;
    this.echartsInstance = null;
    logger.debug('[FlightLine] 飞线图对象已销毁');
  }

  /**
   * 设置地图到最适合观看飞线的视角
   * 根据所有可见飞线自动计算合适的缩放级别和中心点
   * @param zoomLevel 缩放级别，默认为5
   */
  public setOptimalView(zoomLevel?: number): void {
    logger.debug('[FlightLine] 开始设置最佳视角');
    
    if (!this.mapInstance) {
      logger.warn('[FlightLine] 无法设置最佳视角：地图实例不可用');
      return;
    }

    // 获取地图视图
    const view = this.mapInstance.getView();
    if (!view) {
      logger.warn('[FlightLine] 无法获取地图视图');
      return;
    }

    try {
      // 设置默认缩放级别为5
      const zoom = zoomLevel !== undefined ? zoomLevel : 5;
      
      // 如果没有飞线数据，设置一个默认的中国中心视图
      if (this.flightLines.size === 0) {
        logger.warn('[FlightLine] 没有飞线数据，设置默认中国中心视图');
        const defaultCenter = [105.0, 35.0]; // 中国大致中心位置
        view.setCenter(fromLonLat(defaultCenter));
        view.setZoom(4); // 较小的缩放级别以便看到整个国家
        logger.debug(`[FlightLine] 已设置默认中国中心视图: [${defaultCenter}], 缩放级别: 4`);
        return;
      }
      
      // 计算所有飞线点的边界
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasValidFlightLine = false;

      // 遍历所有飞线，计算边界
      this.flightLines.forEach(line => {
        // 如果有激活的飞线，只考虑激活的飞线
        if (this.activeFlightLine && line.id !== this.activeFlightLine) {
          return;
        }
        
        // 处理多组坐标的飞线
        if (line.isMultiCoords && line.coords && Array.isArray(line.coords) && line.coords.length > 0 &&
            typeof line.coords[0] === 'object' && 'from' in line.coords[0] && 'to' in line.coords[0]) {
          const multiCoords = line.coords as FlightCoord[];
          
          // 处理每组坐标
          multiCoords.forEach(coordGroup => {
            if (!coordGroup.from || !coordGroup.to) return;
            
            const fromCoord = this.ensureGeoCoordinate(coordGroup.from);
            const toCoord = this.ensureGeoCoordinate(coordGroup.to);
            
            if (fromCoord && toCoord) {
              // 更新边界
              minX = Math.min(minX, fromCoord[0], toCoord[0]);
              minY = Math.min(minY, fromCoord[1], toCoord[1]);
              maxX = Math.max(maxX, fromCoord[0], toCoord[0]);
              maxY = Math.max(maxY, fromCoord[1], toCoord[1]);
              hasValidFlightLine = true;
            }
          });
        } 
        // 处理传统的单组坐标飞线
        else if (line.coords && Array.isArray(line.coords) && line.coords.length === 2) {
          // 确保传递的是数组类型
          if (Array.isArray(line.coords[0]) && Array.isArray(line.coords[1])) {
            const fromCoord = this.ensureGeoCoordinate(line.coords[0] as number[]);
            const toCoord = this.ensureGeoCoordinate(line.coords[1] as number[]);

            if (fromCoord && toCoord) {
              // 更新边界
              minX = Math.min(minX, fromCoord[0], toCoord[0]);
              minY = Math.min(minY, fromCoord[1], toCoord[1]);
              maxX = Math.max(maxX, fromCoord[0], toCoord[0]);
              maxY = Math.max(maxY, fromCoord[1], toCoord[1]);
              hasValidFlightLine = true;
            }
          }
        }
      });

      // 如果没有找到可用的飞线，则考虑所有飞线
      if (!hasValidFlightLine) {
        logger.debug('[FlightLine] 没有可用飞线，考虑所有飞线坐标');
        this.flightLines.forEach(line => {
          // 处理多组坐标的飞线
          if (line.isMultiCoords && line.coords && Array.isArray(line.coords) && line.coords.length > 0 &&
              typeof line.coords[0] === 'object' && 'from' in line.coords[0] && 'to' in line.coords[0]) {
            const multiCoords = line.coords as FlightCoord[];
            
            // 处理每组坐标
            multiCoords.forEach(coordGroup => {
              if (!coordGroup.from || !coordGroup.to) return;
              
              const fromCoord = this.ensureGeoCoordinate(coordGroup.from);
              const toCoord = this.ensureGeoCoordinate(coordGroup.to);
              
              if (fromCoord && toCoord) {
                // 更新边界
                minX = Math.min(minX, fromCoord[0], toCoord[0]);
                minY = Math.min(minY, fromCoord[1], toCoord[1]);
                maxX = Math.max(maxX, fromCoord[0], toCoord[0]);
                maxY = Math.max(maxY, fromCoord[1], toCoord[1]);
                hasValidFlightLine = true;
              }
            });
          }
          // 处理传统的单组坐标飞线
          else if (line.coords && Array.isArray(line.coords) && line.coords.length === 2) {
            // 确保传递的是数组类型
            if (Array.isArray(line.coords[0]) && Array.isArray(line.coords[1])) {
              const fromCoord = this.ensureGeoCoordinate(line.coords[0] as number[]);
              const toCoord = this.ensureGeoCoordinate(line.coords[1] as number[]);
              
              if (fromCoord && toCoord) {
                // 更新边界
                minX = Math.min(minX, fromCoord[0], toCoord[0]);
                minY = Math.min(minY, fromCoord[1], toCoord[1]);
                maxX = Math.max(maxX, fromCoord[0], toCoord[0]);
                maxY = Math.max(maxY, fromCoord[1], toCoord[1]);
                hasValidFlightLine = true;
              }
            }
          }
        });
      }

      // 检查是否找到有效边界
      if (!hasValidFlightLine || minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        logger.warn('[FlightLine] 无法计算飞线边界，设置默认中国中心视图');
        // 设置默认的中国中心视图
        const defaultCenter = [105.0, 35.0]; // 中国大致中心位置
        view.setCenter(fromLonLat(defaultCenter));
        view.setZoom(4); // 较小的缩放级别以便看到整个国家
        logger.debug(`[FlightLine] 已设置默认中国中心视图: [${defaultCenter}], 缩放级别: 4`);
        return;
      }

      // 计算中心点和动态缩放级别
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // 计算边界跨度，确保视图不会太窄
      const spanX = Math.max(0.5, Math.abs(maxX - minX));
      const spanY = Math.max(0.5, Math.abs(maxY - minY));
      
      // 根据边界跨度动态调整缩放级别
      let dynamicZoom = zoom;
      if (spanX > 5 || spanY > 5) {
        dynamicZoom = Math.max(3, dynamicZoom - 1); // 较大范围使用较小的缩放级别
      } else if (spanX < 0.5 && spanY < 0.5) {
        dynamicZoom = Math.min(8, dynamicZoom + 1); // 较小范围使用较大的缩放级别
      }
      
      // 设置地图视图 - 使用标准方式设置
      view.setCenter(fromLonLat([centerX, centerY]));
      view.setZoom(dynamicZoom);
      
      logger.debug(`[FlightLine] 已设置最佳视角，中心点: [${centerX.toFixed(2)}, ${centerY.toFixed(2)}], 缩放级别: ${dynamicZoom}, 边界: [${minX.toFixed(2)},${minY.toFixed(2)},${maxX.toFixed(2)},${maxY.toFixed(2)}]`);
    } catch (error) {
      logger.error('[FlightLine] 设置最佳视角失败:', error);
      
      // 发生错误时设置默认中国视图
      try {
        const defaultCenter = [105.0, 35.0]; // 中国大致中心位置
        if (this.mapInstance) {
          this.mapInstance.getView().setCenter(fromLonLat(defaultCenter));
          this.mapInstance.getView().setZoom(4);
          logger.debug('[FlightLine] 错误恢复：已设置默认中国中心视图');
        }
      } catch (fallbackError) {
        logger.error('[FlightLine] 无法设置默认视图:', fallbackError);
      }
    }
  }
  
  /**
   * 设置飞线图在特定城市的最佳视角
   * @param cityName 城市名称，需要事先通过addCoordinate添加坐标
   * @param zoom 缩放级别，默认为8
   */
  public setViewForCity(cityName: string, zoom: number = 8): boolean {
    if (!this.mapInstance) {
      logger.warn('[FlightLine] 地图实例不存在，无法设置城市视角');
      return false;
    }
    
    // 获取城市坐标
    const cityCoord = this.geoCoordMap[cityName];
    if (!cityCoord) {
      logger.warn(`[FlightLine] 未找到城市 ${cityName} 的坐标`);
      return false;
    }
    
    try {
      // 转换为地图投影坐标
      const projCoord = fromLonLat(cityCoord);
      
      // 设置地图视图
      this.mapInstance.getView().animate({
        center: projCoord,
        zoom: zoom,
        duration: 1000
      });
      
      logger.debug(`[FlightLine] 设置城市 ${cityName} 视角 - 坐标: [${cityCoord[0]}, ${cityCoord[1]}], 缩放级别: ${zoom}`);
      return true;
    } catch (error) {
      logger.error(`[FlightLine] 设置城市 ${cityName} 视角时发生错误:`, error);
      return false;
    }
  }

  /**
   * 清空飞线图层
   * 完全清空飞线图层，不显示任何飞线
   */
  public clearFlightLines(): void {
    logger.debug('[FlightLine] 开始清空飞线图层');
    
    // 清除当前激活的飞线
    this.activeFlightLine = null;
    
    // 重置所有飞线状态
    this.flightLines.forEach(line => {
      line.isActive = false;
      line.highlight = false;
      delete line.style;
    });
    
    // 清空图层
    if (this.echartsLayer) {
      this.echartsLayer.clear();
      logger.debug('[FlightLine] 已清空Echarts图层');
    }
    
    logger.debug('[FlightLine] 已完全清空飞线图层');
  }

  /**
   * 显示所有飞线
   */
  public showAllFlightLines(): void {
    // 如果没有激活的飞线，直接清空图层
    if (!this.activeFlightLine) {
      logger.debug('[FlightLine] 没有激活的飞线，直接清空图层');
      this.clearFlightLines();
      return;
    }
    
    // 先清空图层
    if (this.echartsLayer) {
      try {
        // 设置空选项，清空图层
        if (typeof this.echartsLayer.setChartOptions === 'function') {
          this.echartsLayer.setChartOptions({
            animation: false,
            series: []
          });
          
          // 强制重绘
          if (typeof this.echartsLayer.redraw === 'function') {
            this.echartsLayer.redraw();
          }
        }
      } catch (error) {
        logger.error('[FlightLine] 清空图层失败:', error);
      }
    }
    
    // 清除当前激活的飞线
    this.activeFlightLine = null;
    
    // 重置所有飞线状态
    this.flightLines.forEach(line => {
      line.isActive = false;
      line.highlight = false;
      delete line.style;
    });
    
    // 由于activeFlightLine已设为null，convertFlightLineData将返回空数组
    // 不需要再调用updateEchartsOptions，直接保持空图层状态
    logger.debug('[FlightLine] 已清空飞线图层，不显示任何飞线');
  }

  /**
   * 将颜色字符串转换为RGBA数组
   * @param color 颜色字符串
   * @returns RGBA数组 [r, g, b, a]
   */
  private colorToRgba(color: string): number[] {
    // 创建临时元素用于解析颜色
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    
    // 获取计算后的颜色
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    
    // 解析颜色值
    const rgba = computedColor.match(/\d+(\.\d+)?/g)?.map(Number) || [0, 0, 0, 1];
    if (rgba.length === 3) {
      rgba.push(1); // 如果没有alpha值，添加默认值1
    }
    
    return rgba;
  }

  /**
   * 显示指定ID的飞线，隐藏其他飞线
   * @param id 飞线ID
   * @returns 成功返回true，失败返回false
   */
  public showOnlyFlightLine(id: string): boolean {
    logger.debug(`[FlightLine] 显示ID为 ${id} 的飞线，隐藏其他飞线`);
    
    // 先完全清空当前图层
    this.clearFlightLines();
    
    // 确保图层已经清空后再显示新的飞线
    setTimeout(() => {
      try {
        // 设置当前激活的飞线
        this.activeFlightLine = id;
        
        // 获取指定ID的飞线
        const flightLine = this.flightLines.get(id);
        if (!flightLine) {
          logger.warn(`[FlightLine] 未找到ID为 ${id} 的飞线`);
          return; // 不返回值，只退出函数
        }
        
        // 更新该飞线的状态
        flightLine.isActive = true;
        flightLine.highlight = true;
        
        // 设置其他飞线为不活跃状态
        this.flightLines.forEach((line, lineId) => {
          if (lineId !== id) {
            line.isActive = false;
            line.highlight = false;
          }
        });
        
        // 重新绘制飞线图层
        this.drawFlightLines();
        
        logger.debug(`[FlightLine] 成功显示ID为 ${id} 的飞线`);
      } catch (error) {
        logger.error(`[FlightLine] 显示ID为 ${id} 的飞线失败:`, error);
      }
    }, 100); // 延迟100ms确保清空操作完成
    
    return true;
  }

  /**
   * 绘制飞线
   * 根据当前飞线数据绘制飞线图层
   */
  public drawFlightLines(): void {
    logger.debug('[FlightLine] 开始绘制飞线图层');
    
    try {
      if (!this.echartsLayer) {
        logger.error('[FlightLine] 无法绘制飞线图层：echartsLayer不存在');
        return;
      }
      
      // 首先检查是否有激活的飞线
      let hasActiveFlightLine = false;
      if (this.activeFlightLine) {
        const line = this.flightLines.get(this.activeFlightLine);
        if (line) {
          hasActiveFlightLine = true;
        }
      }
      
      // 如果没有激活的飞线，则清空图层
      if (!hasActiveFlightLine && this.activeFlightLine) {
        logger.debug('[FlightLine] 激活的飞线不存在或无效，清空图层');
        this.clearFlightLines();
        return;
      }
      
      // 使用updateEchartsOptions方法更新配置
      this.updateEchartsOptions();
      
      logger.debug('[FlightLine] 已完成飞线图层绘制');
    } catch (error) {
      logger.error('[FlightLine] 绘制飞线图层失败:', error);
    }
  }

  /**
   * 添加测试飞线数据
   * 仅用于开发测试
   */
  private addTestFlightLines(): void {
    logger.debug('[FlightLine] 添加测试飞线数据');
    
    // 清除现有飞线数据
    this.flightLines.clear();
    
    // 中国主要城市坐标
    const cities = {
      '北京': [116.4, 39.9],
      '上海': [121.5, 31.2],
      '广州': [113.3, 23.1],
      '深圳': [114.1, 22.5],
      '杭州': [120.2, 30.3],
      '成都': [104.1, 30.7],
      '武汉': [114.3, 30.6],
      '西安': [108.9, 34.3],
      '南京': [118.8, 32.0],
      '重庆': [106.5, 29.5],
      '长沙': [113.0, 28.2],
      '大连': [121.6, 38.9]
    };
    
    // 添加坐标点
    this.addCoordinates(cities as any);
    logger.debug(`[FlightLine] 添加了${Object.keys(cities).length}个测试城市坐标点`);
    
    // 创建连接所有城市的飞线网络
    const cityNames = Object.keys(cities);
    const beijingIndex = 0; // 确保北京是第一个城市
    const currentTime = Date.now();
    
    // 创建从北京飞往其他城市的飞线
    const testLines = [];
    
    // 创建以北京为中心的放射状网络，飞往所有其他城市
    for (let i = 1; i < cityNames.length; i++) {
      const from = cityNames[beijingIndex]; // 始终是北京
      const to = cityNames[i];
      
      testLines.push({
        fromName: from,
        toName: to,
        coords: [cities[from], cities[to]],
        value: 100,
        _createTime: currentTime - ((cityNames.length - i) * 10000) // 越晚添加的城市_createTime越大
      });
    }
    
    // 添加测试飞线
    const ids = testLines.map(line => {
      const id = this.addFlightLine(line);
      logger.debug(`[FlightLine] 添加测试飞线: ${id} - ${line.fromName} → ${line.toName}`);
      return id;
    });
    
    // 将第一条飞线设置为激活状态（北京到上海的飞线）
    if (ids.length > 0) {
      const firstLineId = ids[0];
      this.setActiveFlightLine(firstLineId);
      
      logger.debug(`[FlightLine] 设置测试飞线: ${firstLineId} 为活动状态`);
    }
    
    logger.debug(`[FlightLine] 共添加了${testLines.length}条测试飞线，默认从北京出发到各个城市`);
  }
} 