/**
 * 飞线图对象
 * @description 管理地图飞线图显示，使用ol-echarts实现
 */
import { Map as OlMap } from 'ol';
import { View } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import logger from './LogObject';
import { FlightLineConfig, FlightLineData, FlightLinePoint, DEFAULT_FLIGHTLINE_CONFIG } from '../types/flightline';

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
   * 初始化Echarts图层
   * @private
   */
  private async initEchartsLayer(): Promise<void> {
    try {
      if (!this.mapInstance) {
        logger.error('[FlightLine] 无法初始化图层：地图实例不可用');
        return;
      }

      // 动态导入ol-echarts和echarts库
      const { default: EChartsLayer } = await import('ol-echarts');
      const echarts = await import('echarts');

      // 保存全局echarts实例供后续使用
      this.echartsInstance = echarts;

      // 尝试不同的配置方式，以兼容不同版本的ol-echarts
      try {
        // 新版本配置方式
        this.echartsLayer = new EChartsLayer({
          stopEvent: false, // 允许事件继续传播
          hideOnMoving: false, // 移动时不隐藏
          hideOnZooming: false, // 缩放时不隐藏
          forcedPrecomposeRerender: true, // 强制重新渲染
          insertFirst: false, // 确保在地图的最上层
          polyfillEvents: true, // 支持事件
          source: 'ol', // 使用OpenLayers作为源
          useMap: true, // 使用地图实例
          debug: process.env.NODE_ENV === 'development', // 开发环境启用调试
        });
      } catch (error) {
        logger.warn('[FlightLine] 使用新配置方式创建图层失败，尝试兼容方式:', error);
        
        // 尝试旧版本配置方式
        this.echartsLayer = new EChartsLayer({
          stopEvent: false,
          hideOnMoving: false,
          hideOnZooming: false,
          forcedPrecomposeRerender: true
        });
      }

      // 将图层添加到地图
      this.echartsLayer.appendTo(this.mapInstance);
      logger.debug('[FlightLine] Echarts图层已添加到地图');

      // 设置初始选项
      this.updateEchartsOptions();

      // 添加视图改变事件监听
      const viewChangeKey = this.mapInstance.getView().on('change:resolution', () => {
        if (this.echartsLayer) {
          // 使用兼容方式重新渲染
          try {
            // 方法1: 使用可能的其他方法名
            if (typeof this.echartsLayer.redraw === 'function') {
              this.echartsLayer.redraw();
            }
            // 方法2: 重新设置图表选项，强制刷新
            else {
              const currentOptions = this.echartsLayer.getChartOptions();
              if (currentOptions) {
                this.echartsLayer.setChartOptions(currentOptions);
              } else {
                this.updateEchartsOptions();
              }
            }
          } catch (err) {
            logger.warn('[FlightLine] 地图视图变化时重新渲染图表失败:', err);
            // 如果有错误，尝试更新选项
            this.updateEchartsOptions();
          }
        }
      });

      this.eventListeners.push(viewChangeKey);

      logger.debug('[FlightLine] Echarts图层已初始化');
    } catch (error) {
      logger.error('[FlightLine] 初始化Echarts图层失败:', error);
    }
  }

  /**
   * 更新Echarts选项
   * @private
   */
  private updateEchartsOptions(): void {
    if (!this.echartsLayer) {
      logger.error('[FlightLine] Echarts图层未初始化');
      return;
    }

    try {
      // 准备系列数据
      const series: any[] = [];
      
      // 转换数据为echarts格式
      const convertedData = this.convertFlightLineData();
      
      // 如果没有数据，则不更新
      if (convertedData.length === 0) {
        logger.debug('[FlightLine] 没有可显示的飞线数据');
        return;
      }
      
      // 确定使用的颜色数组
      const colorArray = Array.isArray(this.config.color) 
        ? this.config.color 
        : [this.config.color];

      // 创建普通飞线系列
      series.push({
        type: 'lines',
        coordinateSystem: 'openlayers', // 使用openlayers坐标系
        zlevel: 1,
        effect: {
          show: false,
        },
        lineStyle: {
          color: this.config.color,
          width: this.config.width,
          opacity: this.config.opacity,
          curveness: this.config.curveness,
        },
        data: convertedData,
      });

      // 如果配置了显示动画效果，则添加动画效果图层
      if (this.config.showEffect) {
        series.push({
          type: 'lines',
          coordinateSystem: 'openlayers', // 使用openlayers坐标系
          zlevel: 2,
          effect: {
            show: true,
            period: this.config.effectPeriod,
            trailLength: this.config.effectTrailLength,
            symbol: this.config.effectSymbol,
            symbolSize: this.config.effectSymbolSize,
          },
          lineStyle: {
            color: this.config.color,
            width: this.config.width,
            opacity: this.config.opacity,
            curveness: this.config.curveness,
          },
          data: convertedData,
        });
      }

      // 如果配置了显示节点，则添加节点图层
      if (this.config.showNodes) {
        // 提取所有节点
        const pointData: any[] = [];
        
        // 使用已转换的飞线数据提取节点
        const pointsMap = new Map<string, number[]>();
        
        // 收集所有节点
        convertedData.forEach(data => {
          if (data.fromName && data.coords && data.coords[0]) {
            pointsMap.set(data.fromName, data.coords[0]);
          }
          if (data.toName && data.coords && data.coords[1]) {
            pointsMap.set(data.toName, data.coords[1]);
          }
        });
        
        // 转换为数组
        pointsMap.forEach((coord, name) => {
          pointData.push({
            name,
            value: coord,
          });
        });
        
        // 添加节点图层
        if (pointData.length > 0) {
          series.push({
            type: 'scatter',
            coordinateSystem: 'openlayers', // 使用openlayers坐标系
            zlevel: 3,
            symbolSize: this.config.nodeSymbolSize,
            itemStyle: {
              color: colorArray[0],
            },
            data: pointData,
          });
          
          // 添加节点标签层
          series.push({
            type: 'scatter',
            coordinateSystem: 'openlayers', // 使用openlayers坐标系
            zlevel: 4,
            symbolSize: 0, // 不显示符号
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              color: '#333',
              backgroundColor: 'rgba(255,255,255,0.7)',
              padding: [3, 5],
              borderRadius: 3,
            },
            data: pointData,
          });
        }
      }

      // 设置echarts选项
      const option = {
        animation: true,
        tooltip: {
          show: true,
          trigger: 'item',
          formatter: (params: any) => {
            if (params.seriesType === 'scatter') {
              return params.name;
            }
            if (params.seriesType === 'lines') {
              return `${params.data.fromName} → ${params.data.toName}`;
            }
            return '';
          },
        },
        series,
      };

      // 更新echarts选项
      this.echartsLayer.setChartOptions(option);
      
      // 尝试重新渲染图表 - 兼容不同版本的ol-echarts
      try {
        if (typeof this.echartsLayer.redraw === 'function') {
          this.echartsLayer.redraw();
        }
      } catch (renderError) {
        logger.warn('[FlightLine] 尝试重新渲染图表失败，但不影响正常使用:', renderError);
      }

      logger.debug('[FlightLine] Echarts选项已更新');
    } catch (error) {
      logger.error('[FlightLine] 更新Echarts选项失败:', error);
    }
  }

  /**
   * 转换飞线数据为echarts格式
   * @private
   */
  private convertFlightLineData(): any[] {
    const result: any[] = [];
    
    // 记录坐标转换结果
    logger.debug(`[FlightLine] 开始转换飞线数据，共${this.flightLines.size}条`);
    
    this.flightLines.forEach((line, id) => {
      // 跳过不可见的飞线
      if (line.visible === false) {
        return;
      }
      
      // 确保有坐标数据
      if (line.coords && line.coords.length === 2) {
        // 确保坐标是经纬度格式
        const fromCoord = this.ensureGeoCoordinate(line.coords[0]);
        const toCoord = this.ensureGeoCoordinate(line.coords[1]);
        
        if (!fromCoord || !toCoord) {
          logger.warn(`[FlightLine] 无效的坐标 ${line.fromName} -> ${line.toName}`);
          return;
        }
        
        // 将经纬度转换为投影坐标（EPSG:3857）
        const projectedFromCoord = fromLonLat(fromCoord);
        const projectedToCoord = fromLonLat(toCoord);
        
        // 基本数据
        const lineData: any = {
          fromName: line.fromName,
          toName: line.toName,
          coords: [projectedFromCoord, projectedToCoord], // 使用投影后的坐标
          value: line.value || 1,
        };
        
        // 如果是高亮状态，添加特殊样式
        if (line.highlight) {
          lineData.lineStyle = {
            width: line.style?.width || 3,
            color: line.style?.color || '#ff0000',
            opacity: line.style?.opacity || 1,
            curveness: this.config.curveness || 0.2,
          };
        }
        // 如果有自定义样式，也添加进去
        else if (line.style) {
          lineData.lineStyle = {
            width: line.style.width,
            color: line.style.color,
            opacity: line.style.opacity,
            curveness: this.config.curveness || 0.2,
          };
        }
        
        result.push(lineData);
        
        // 添加详细日志
        logger.debug(`[FlightLine] 转换飞线: ${id}, ${line.fromName}[${fromCoord}] -> ${line.toName}[${toCoord}]`);
        logger.debug(`[FlightLine] 投影后坐标: [${projectedFromCoord}] -> [${projectedToCoord}]`);
      }
    });
    
    // 日志记录
    if (result.length === 0) {
      logger.debug('[FlightLine] 没有有效的飞线数据');
    } else {
      logger.debug(`[FlightLine] 转换了 ${result.length} 条飞线数据`);
    }
    
    return result;
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
    this.config = {
      ...this.config,
      ...config
    };

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
   * 添加飞线
   * @param flightLine 飞线数据
   * @returns 飞线ID
   */
  public addFlightLine(flightLine: FlightLineData): string {
    // 生成唯一ID
    const id = flightLine.id || `flightline-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 确保坐标是经纬度格式
    let coords = flightLine.coords;
    if (coords && coords.length >= 2) {
      // 确保坐标是经纬度格式
      const fromCoord = this.ensureGeoCoordinate(coords[0]);
      const toCoord = this.ensureGeoCoordinate(coords[1]);
      
      coords = [fromCoord, toCoord];
      
      // 添加调试信息
      logger.debug(`[FlightLine] 飞线坐标: ${flightLine.fromName}[${fromCoord}] -> ${flightLine.toName}[${toCoord}]`);
    }
    
    // 检查起点和终点名称是否存在于地理坐标映射中
    if (!this.geoCoordMap[flightLine.fromName] && coords && coords.length >= 2) {
      this.geoCoordMap[flightLine.fromName] = coords[0];
      logger.debug(`[FlightLine] 为起点 ${flightLine.fromName} 添加地理坐标: [${coords[0]}]`);
    }
    
    if (!this.geoCoordMap[flightLine.toName] && coords && coords.length >= 2) {
      this.geoCoordMap[flightLine.toName] = coords[1];
      logger.debug(`[FlightLine] 为终点 ${flightLine.toName} 添加地理坐标: [${coords[1]}]`);
    }
    
    // 保存飞线数据，确保使用更新后的坐标
    const finalFlightLine = {
      ...flightLine,
      id,
      coords: coords || flightLine.coords, // 使用转换后的坐标或原始坐标
      visible: flightLine.visible !== false // 默认可见
    };
    
    this.flightLines.set(id, finalFlightLine);
    
    // 如果已激活，则更新echarts选项
    if (this.active && this.echartsLayer) {
      this.updateEchartsOptions();
    }
    
    logger.debug(`[FlightLine] 添加飞线: ${id} (${flightLine.fromName} -> ${flightLine.toName})`);
    return id;
  }

  /**
   * 批量添加飞线
   * @param flightLines 飞线数据数组
   * @param setOptimalView 是否自动设置最佳视角，默认为false
   * @param zoomLevel 指定的缩放级别，不指定则自动计算
   * @returns 飞线ID数组
   */
  public addFlightLines(flightLines: FlightLineData[], setOptimalView: boolean = false, zoomLevel?: number): string[] {
    if (!flightLines || flightLines.length === 0) {
      return [];
    }

    const ids: string[] = [];
    flightLines.forEach(line => {
      ids.push(this.addFlightLine(line));
    });

    logger.debug(`[FlightLine] 批量添加了 ${flightLines.length} 条飞线`);
    
    // 如果需要设置最佳视角
    if (setOptimalView && ids.length > 0) {
      // 延迟设置，确保地图和图层都已准备好
      setTimeout(() => {
        this.setOptimalView(zoomLevel);
      }, 300);
    }
    
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
    
    // 添加日志记录飞线数量
    logger.debug(`[FlightLine] 获取所有飞线数据，共${this.flightLines.size}条`);
    
    return this.flightLines;
  }
  
  /**
   * 更新单个飞线的样式或状态
   * @param id 飞线ID
   * @param options 更新选项
   */
  public updateFlightLine(id: string, options: {
    highlight?: boolean;
    visible?: boolean;
    style?: Partial<FlightLineStyle>;
  }): boolean {
    // 检查飞线是否存在
    const flightLine = this.flightLines.get(id);
    if (!flightLine) {
      logger.warn(`飞线 ${id} 不存在，无法更新`);
      return false;
    }
    
    try {
      // 更新数据属性
      if (options.visible !== undefined) {
        flightLine.visible = options.visible;
      }
      
      if (options.highlight !== undefined) {
        flightLine.highlight = options.highlight;
      }
      
      if (options.style) {
        flightLine.style = {
          ...(flightLine.style || {}),
          ...options.style
        };
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
        
        if (options.visible === false) {
          logger.debug(`[FlightLine] 隐藏飞线: ${id}`);
        } else if (options.visible === true) {
          logger.debug(`[FlightLine] 显示飞线: ${id}`);
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
   * 启用飞线图
   */
  public async enable(): Promise<void> {
    if (this.active) {
      logger.debug('[FlightLine] 飞线图已经处于激活状态');
      
      // 即使已经激活，也尝试更新一次选项，确保显示正常
      if (this.echartsLayer) {
        this.updateEchartsOptions();
      }
      return;
    }

    if (!this.mapInstance) {
      logger.error('[FlightLine] 地图实例不存在，无法启用飞线图');
      return;
    }

    logger.info('[FlightLine] 开始启用飞线图');
    
    try {
      // 记录当前飞线数量和坐标点
      const flightLineCount = this.flightLines.size;
      const coordPointCount = Object.keys(this.geoCoordMap).length;
      
      logger.debug(`[FlightLine] 当前飞线数量: ${flightLineCount}, 坐标点数量: ${coordPointCount}`);
      
      // 打印所有飞线的坐标信息用于调试
      if (flightLineCount > 0) {
        logger.debug('[FlightLine] 飞线数据详情:');
        this.flightLines.forEach((line, id) => {
          logger.debug(`- 飞线 ${id}: ${line.fromName} -> ${line.toName}, 坐标: ${JSON.stringify(line.coords)}, 可见性: ${line.visible !== false}`);
        });
      }
      
      // 初始化Echarts图层
      if (!this.echartsLayer) {
        logger.debug('[FlightLine] 初始化Echarts图层');
        await this.initEchartsLayer();
      } else {
        // 如果图层已存在但被移除，重新添加到地图
        try {
          if (this.mapInstance) {
            this.echartsLayer.appendTo(this.mapInstance);
            logger.debug('[FlightLine] 重新添加Echarts图层到地图');
          }
        } catch (appendError) {
          logger.warn('[FlightLine] 重新添加图层发生错误，尝试重新初始化:', appendError);
          await this.initEchartsLayer();
        }
      }

      // 更新飞线图选项
      this.updateEchartsOptions();

      this.active = true;
      logger.info('[FlightLine] 飞线图已成功启用');
      
      // 如果没有飞线数据，尝试添加一些测试数据
      if (flightLineCount === 0) {
        logger.debug('[FlightLine] 没有飞线数据，考虑添加示例数据以便测试');
        
        // 启用自动添加测试数据的逻辑
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[FlightLine] 开发环境 - 添加测试飞线数据');
          this.addTestFlightLines();
        }
      }
      
      // 触发地图重新渲染以确保图层正确显示
      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.updateSize();
          logger.debug('[FlightLine] 触发地图重新渲染');
          
          // 触发一次重新渲染
          try {
            this.updateEchartsOptions();
            if (typeof this.echartsLayer.redraw === 'function') {
              this.echartsLayer.redraw();
              logger.debug('[FlightLine] 完成额外的图表重新渲染');
            }
          } catch (err) {
            logger.warn('[FlightLine] 额外的图表重新渲染失败:', err);
          }
        }
      }, 100);
    } catch (error) {
      logger.error('[FlightLine] 启用飞线图时发生错误:', error);
      throw error; // 重新抛出错误以便调用者处理
    }
  }
  
  /**
   * 添加测试飞线数据
   * 仅用于开发测试
   */
  private addTestFlightLines(): void {
    logger.debug('[FlightLine] 添加测试飞线数据');
    
    // 中国主要城市坐标
    const cities = {
      '北京': [116.4, 39.9],
      '上海': [121.5, 31.2],
      '广州': [113.3, 23.1],
      '深圳': [114.1, 22.5],
      '杭州': [120.2, 30.3]
    };
    
    // 添加坐标点
    this.addCoordinates(cities);
    
    // 添加飞线
    this.addFlightLine({
      fromName: '北京',
      toName: '上海',
      coords: [cities['北京'], cities['上海']],
      value: 100
    });
    
    this.addFlightLine({
      fromName: '广州',
      toName: '深圳',
      coords: [cities['广州'], cities['深圳']],
      value: 80
    });
    
    this.addFlightLine({
      fromName: '北京',
      toName: '杭州',
      coords: [cities['北京'], cities['杭州']],
      value: 70
    });
    
    logger.debug('[FlightLine] 测试飞线已添加');
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
   * @param zoomLevel 可选指定的缩放级别，不指定则自动计算
   */
  public setOptimalView(zoomLevel?: number): void {
    if (!this.mapInstance) {
      logger.warn('[FlightLine] 地图实例不存在，无法设置最佳视角');
      return;
    }
    
    try {
      // 获取所有可见飞线
      const visibleLines: FlightLineData[] = [];
      this.flightLines.forEach(line => {
        if (line.visible !== false && line.coords && line.coords.length === 2) {
          visibleLines.push(line);
        }
      });
      
      if (visibleLines.length === 0) {
        logger.debug('[FlightLine] 没有可见飞线，无法计算最佳视角');
        return;
      }
      
      // 计算所有点的最大最小经纬度范围
      let minLon = 180;
      let maxLon = -180;
      let minLat = 90;
      let maxLat = -90;
      
      visibleLines.forEach(line => {
        const fromCoord = line.coords[0];
        const toCoord = line.coords[1];
        
        minLon = Math.min(minLon, fromCoord[0], toCoord[0]);
        maxLon = Math.max(maxLon, fromCoord[0], toCoord[0]);
        minLat = Math.min(minLat, fromCoord[1], toCoord[1]);
        maxLat = Math.max(maxLat, fromCoord[1], toCoord[1]);
      });
      
      // 添加边距以确保所有飞线都可见
      const padding = 1; // 1度
      minLon -= padding;
      maxLon += padding;
      minLat -= padding;
      maxLat += padding;
      
      // 计算中心点
      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;
      
      // 转换为地图投影坐标
      const centerCoord = fromLonLat([centerLon, centerLat]);
      
      // 使用提供的缩放级别或自动计算合适的缩放级别
      let zoom = zoomLevel;
      if (zoom === undefined) {
        // 判断是否为中国区域
        const isChinaRegion = 
          centerLon >= 70 && centerLon <= 140 && 
          centerLat >= 15 && centerLat <= 55;
          
        if (isChinaRegion) {
          // 中国区域的飞线图，缩放级别5最合适
          zoom = 5;
          logger.debug('[FlightLine] 检测到中国区域飞线图，使用最佳缩放级别5');
        } else {
          // 其他区域根据经纬度范围计算合适的缩放级别
          const lonRange = maxLon - minLon;
          const latRange = maxLat - minLat;
          const range = Math.max(lonRange, latRange);
          
          // 根据范围大小设置缩放级别
          if (range > 50) zoom = 4;       // 全球/洲际范围
          else if (range > 20) zoom = 5;  // 国家范围
          else if (range > 10) zoom = 6;  // 大省范围
          else if (range > 5) zoom = 7;   // 省级范围
          else if (range > 2) zoom = 8;   // 城市群范围
          else if (range > 1) zoom = 9;   // 城市范围
          else if (range > 0.5) zoom = 10; // 城区范围
          else zoom = 11;                 // 小范围
          
          logger.debug(`[FlightLine] 根据飞线范围(${range}度)自动设置缩放级别: ${zoom}`);
        }
      }
      
      // 设置地图视图
      this.mapInstance.getView().animate({
        center: centerCoord,
        zoom: zoom,
        duration: 800 // 动画时长缩短为800ms，感觉更流畅
      });
      
      logger.debug(`[FlightLine] 设置最佳视角 - 中心点: [${centerLon.toFixed(2)}, ${centerLat.toFixed(2)}], 缩放级别: ${zoom}`);
    } catch (error) {
      logger.error('[FlightLine] 设置最佳视角时发生错误:', error);
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
} 