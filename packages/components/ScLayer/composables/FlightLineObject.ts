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

      // 创建echarts图层
      this.echartsLayer = new EChartsLayer({
        stopEvent: false, // 允许事件继续传播
        hideOnMoving: false, // 移动时不隐藏
        hideOnZooming: false, // 缩放时不隐藏
        forcedPrecomposeRerender: true, // 强制重新渲染
        insertFirst: false, // 确保在地图的最上层
        polyfillEvents: true, // 支持事件
      });

      // 将图层添加到地图
      this.echartsLayer.appendTo(this.mapInstance);

      // 设置初始选项
      this.updateEchartsOptions();

      // 添加视图改变事件监听
      const viewChangeKey = this.mapInstance.getView().on('change:resolution', () => {
        if (this.echartsLayer) {
          this.echartsLayer.renderECharts();
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

      // 创建普通飞线系列 - 不使用geo坐标系
      series.push({
        type: 'lines',
        coordinateSystem: 'none', // 不使用任何内置坐标系
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
          coordinateSystem: 'none',
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
        // 提取所有节点的像素位置
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
            coordinateSystem: 'none',
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
            coordinateSystem: 'none',
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
    
    this.flightLines.forEach((line, id) => {
      // 跳过不可见的飞线
      if (line.visible === false) {
        return;
      }
      
      // 确保有坐标数据
      if (line.coords && line.coords.length === 2) {
        // 将OpenLayers坐标转换为平面坐标，用于echarts
        const fromCoord = this.getPixelCoordinate(line.coords[0]);
        const toCoord = this.getPixelCoordinate(line.coords[1]);
        
        if (!fromCoord || !toCoord) {
          logger.warn(`[FlightLine] 无法转换坐标 ${line.fromName} -> ${line.toName}`);
          return;
        }
        
        // 基本数据
        const lineData: any = {
          fromName: line.fromName,
          toName: line.toName,
          coords: [fromCoord, toCoord], // 使用像素坐标
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
   * 获取坐标的像素位置
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
    
    // 检查起点和终点名称是否存在于地理坐标映射中
    if (!this.geoCoordMap[flightLine.fromName]) {
      logger.warn(`[FlightLine] 起点 ${flightLine.fromName} 未定义地理坐标`);
      // 如果提供了坐标，则自动添加
      if (flightLine.coords && flightLine.coords.length >= 2) {
        this.geoCoordMap[flightLine.fromName] = flightLine.coords[0];
      }
    }
    
    if (!this.geoCoordMap[flightLine.toName]) {
      logger.warn(`[FlightLine] 终点 ${flightLine.toName} 未定义地理坐标`);
      // 如果提供了坐标，则自动添加
      if (flightLine.coords && flightLine.coords.length >= 2) {
        this.geoCoordMap[flightLine.toName] = flightLine.coords[1];
      }
    }
    
    // 保存飞线数据
    this.flightLines.set(id, {
      ...flightLine,
      id
    });
    
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
   * @returns 飞线ID数组
   */
  public addFlightLines(flightLines: FlightLineData[]): string[] {
    if (!flightLines || flightLines.length === 0) {
      return [];
    }

    const ids: string[] = [];
    flightLines.forEach(line => {
      ids.push(this.addFlightLine(line));
    });

    logger.debug(`[FlightLine] 批量添加了 ${flightLines.length} 条飞线`);
    return ids;
  }

  /**
   * 获取所有飞线数据
   * @returns 所有飞线数据的Map集合
   */
  public getAllFlightLines(): Map<string, FlightLineData> {
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
      return;
    }

    if (!this.mapInstance) {
      logger.error('[FlightLine] 地图实例不存在，无法启用飞线图');
      return;
    }

    logger.info('[FlightLine] 开始启用飞线图');
    
    try {
      // 初始化Echarts图层
      if (!this.echartsLayer) {
        logger.debug('[FlightLine] 初始化Echarts图层');
        await this.initEchartsLayer();
      }

      // 更新飞线图选项
      this.updateEchartsOptions();

      this.active = true;
      logger.info('[FlightLine] 飞线图已成功启用');
      
      // 记录当前飞线数量
      const flylineCount = this.flightLines.size;
      logger.debug(`[FlightLine] 当前飞线数量: ${flylineCount}`);
      
      // 如果没有飞线数据，添加一些示例数据以便测试
      if (flylineCount === 0) {
        logger.debug('[FlightLine] 没有飞线数据，考虑添加示例数据以便测试');
      }
    } catch (error) {
      logger.error('[FlightLine] 启用飞线图时发生错误:', error);
    }
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
      } catch (error) {
        logger.error('[FlightLine] 移除Echarts图层失败:', error);
      }
    }

    // 移除事件监听
    for (const eventKey of this.eventListeners) {
      unByKey(eventKey);
    }
    this.eventListeners = [];

    this.echartsLayer = null;
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
} 