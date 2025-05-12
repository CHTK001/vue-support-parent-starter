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
import { FlightLineConfig, FlightLineData, FlightLinePoint, DEFAULT_FLIGHTLINE_CONFIG, type FlightLineStyle } from '../types/flightline';

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
        this.setupMapListeners();
        
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
    if (!this.echartsLayer) {
      logger.warn('[FlightLine] 无法更新选项，图层未初始化');
      return;
    }

    try {
      logger.debug('[FlightLine] 开始更新飞线图选项');
      
      // 收集所有有效的飞线数据
      const convertedData = this.convertFlightLineData();
      logger.debug(`[FlightLine] 转换后的数据数量: ${convertedData.length}`);
      
      // 构建系列数据，参考 sakitam.com 的系列配置
      const series: any[] = [];
      
      // 检查数据是否为空
      if (convertedData.length === 0) {
        logger.warn('[FlightLine] 没有有效的飞线数据可显示');
        // 在图层无数据时，仍然设置一个空的系列，保持图层可见
        series.push({
          type: 'lines',
          coordinateSystem: 'openlayers',
          data: []
        });
      } else {
        logger.debug(`[FlightLine] 转换了 ${convertedData.length} 条飞线数据`);
        
        // 创建飞线基础层
        series.push({
          name: '飞线基础',
          type: 'lines',
          coordinateSystem: 'openlayers',
          zlevel: 1,
          effect: {
            show: true,
            period: this.config.effectPeriod || 6,
            trailLength: 0.7,
            color: '#fff',
            symbolSize: 3
          },
          lineStyle: {
            color: this.config.color || '#a6c84c',
            width: 0,
            curveness: this.config.curveness || 0.2
          },
          data: convertedData
        });
        
        // 创建飞线动画层
        series.push({
          name: '飞线动画',
          type: 'lines',
          coordinateSystem: 'openlayers',
          zlevel: 2,
          symbol: ['none', 'arrow'],
          symbolSize: 10,
          effect: {
            show: this.config.showEffect,
            period: this.config.effectPeriod || 6,
            trailLength: this.config.effectTrailLength || 0.7,
            symbol: this.config.effectSymbol || 'arrow',
            symbolSize: this.config.effectSymbolSize || 12
          },
          lineStyle: {
            color: this.config.color || '#a6c84c',
            width: this.config.width || 1,
            opacity: this.config.opacity || 0.5,
            curveness: this.config.curveness || 0.2
          },
          data: convertedData
        });
        
        // 如果配置了显示节点，则添加节点系列
        if (this.config.showNodes) {
          // 收集节点数据
          const nodeData: any[] = [];
          if (convertedData.length > 0) {
            convertedData.forEach(line => {
              if (line.coords && line.coords.length >= 2) {
                // 添加起点
                if (line.coords[0] && Array.isArray(line.coords[0])) {
                  nodeData.push({
                    name: line.fromName,
                    value: [...line.coords[0], line.value || 10], // 添加值作为第三个坐标
                    itemStyle: {
                      color: this.config.nodeColor || '#ddb926'
                    }
                  });
                }
                
                // 添加终点
                if (line.coords[1] && Array.isArray(line.coords[1])) {
                  nodeData.push({
                    name: line.toName,
                    value: [...line.coords[1], line.value || 10], // 添加值作为第三个坐标
                    itemStyle: {
                      color: this.config.nodeColor || '#ddb926'
                    }
                  });
                }
              }
            });
            
            // 去重节点数据
            const uniqueNodeData = this.deduplicateNodeData(nodeData);
            logger.debug(`[FlightLine] 创建了 ${uniqueNodeData.length} 个节点数据`);
            
            // 添加节点系列
            series.push({
              name: '节点',
              type: 'effectScatter',
              coordinateSystem: 'openlayers',
              zlevel: 2,
              rippleEffect: {
                brushType: 'stroke'
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{b}'
              },
              symbolSize: function(val) {
                return val[2] / 20;
              },
              itemStyle: {
                color: this.config.nodeColor || '#ddb926'
              },
              data: uniqueNodeData
            });
          }
        }
      }
      
      // 构建完整的 echarts 选项
      const options = {
        animation: true,
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            if (params.data && params.data.fromName) {
              return params.data.fromName + ' → ' + params.data.toName;
            }
            return params.name;
          }
        },
        series: series
      };
      
      // 设置选项
      if (this.echartsLayer && typeof this.echartsLayer.setChartOptions === 'function') {
        this.echartsLayer.setChartOptions(options);
        logger.debug('[FlightLine] Echarts选项已设置');
      } else {
        logger.error('[FlightLine] 无法设置选项，echartsLayer不可用或缺少setChartOptions方法');
      }
    } catch (error) {
      logger.error('[FlightLine] 更新Echarts选项时出错:', error);
    }
  }
  
  /**
   * 对节点数据进行去重，避免重复显示
   * @param nodeData 原始节点数据
   * @returns 去重后的节点数据
   */
  private deduplicateNodeData(nodeData: any[]): any[] {
    const uniqueMap = new Map();
    nodeData.forEach(node => {
      const key = `${node.name}|${node.value[0]},${node.value[1]}`;
      uniqueMap.set(key, node);
    });
    return Array.from(uniqueMap.values());
  }

  /**
   * 转换飞线数据为echarts格式
   * @returns echarts格式的飞线数据数组
   */
  private convertFlightLineData(): any[] {
    const result: any[] = [];
    
    if (this.flightLines.size === 0) {
      logger.warn('[FlightLine] 飞线数据为空，请先添加飞线数据');
      return result;
    }
    
    logger.debug(`[FlightLine] 开始转换 ${this.flightLines.size} 条飞线数据`);
    
    // 遍历所有飞线数据
    this.flightLines.forEach((line, id) => {
      // 跳过不可见的飞线 - 修改判断逻辑，只有明确设置visible为true的飞线才显示
      if (line.visible !== true) {
        return;
      }
      
      try {
        // 获取起点和终点坐标
        let fromCoord = this.geoCoordMap[line.fromName];
        let toCoord = this.geoCoordMap[line.toName];

        logger.debug(`[FlightLine] 处理飞线 ${id}: ${line.fromName} -> ${line.toName}, fromCoord=${JSON.stringify(fromCoord)}, toCoord=${JSON.stringify(toCoord)}`);

        // 如果没有从geoCoordMap中找到坐标，尝试使用line.coords
        if ((!fromCoord || !toCoord) && line.coords && line.coords.length === 2) {
          fromCoord = line.coords[0];
          toCoord = line.coords[1];

          logger.debug(`[FlightLine] 从coords获取坐标: fromCoord=${JSON.stringify(fromCoord)}, toCoord=${JSON.stringify(toCoord)}`);

          // 添加坐标到geoCoordMap
          if (fromCoord && line.fromName) this.geoCoordMap[line.fromName] = fromCoord;
          if (toCoord && line.toName) this.geoCoordMap[line.toName] = toCoord;
        }

        // 如果仍然没有找到坐标，尝试使用from和to
        if ((!fromCoord || !toCoord) && line.from && line.to) {
          fromCoord = line.from;
          toCoord = line.to;
          logger.debug(`[FlightLine] 从from/to获取坐标: fromCoord=${JSON.stringify(fromCoord)}, toCoord=${JSON.stringify(toCoord)}`);
        }

        // 确保坐标有效
        if (!fromCoord || !toCoord || !Array.isArray(fromCoord) || !Array.isArray(toCoord) || 
            fromCoord.length < 2 || toCoord.length < 2) {
          logger.warn(`[FlightLine] 飞线坐标无效: ${line.fromName} -> ${line.toName}, fromCoord=${JSON.stringify(fromCoord)}, toCoord=${JSON.stringify(toCoord)}`);
          return;
        }

        // 确保坐标是数值类型
        const fromLon = Number(fromCoord[0]);
        const fromLat = Number(fromCoord[1]);
        const toLon = Number(toCoord[0]);
        const toLat = Number(toCoord[1]);
        
        if (isNaN(fromLon) || isNaN(fromLat) || isNaN(toLon) || isNaN(toLat)) {
          logger.warn(`[FlightLine] 飞线坐标包含非数值: ${fromLon},${fromLat} -> ${toLon},${toLat}`);
          return;
        }

        // 创建符合 sakitam.com 示例格式的数据对象
        const flightLineData = {
          fromName: line.fromName,
          toName: line.toName,
          coords: [[fromLon, fromLat], [toLon, toLat]],
          value: line.value || 10,
          lineStyle: {
            color: line.style?.color || this.config.color,
            width: line.style?.width || this.config.width,
            opacity: line.style?.opacity !== undefined ? line.style.opacity : this.config.opacity,
            curveness: line.style?.curveness !== undefined ? line.style.curveness : this.config.curveness
          },
          emphasis: {
            lineStyle: {
              color: line.highlight ? '#ff0000' : (line.style?.color || this.config.color),
              width: line.highlight ? (line.style?.width || this.config.width) + 1 : line.style?.width || this.config.width,
              opacity: 1
            }
          }
        };

        // 如果设置了自定义的动画符号
        if (line.effectSymbol) {
          flightLineData['effect'] = {
            symbol: line.effectSymbol,
            symbolSize: line.effectSymbolSize || this.config.effectSymbolSize
          };
          
          // 如果是自定义路径
          if (line.effectSymbolPath) {
            flightLineData['effect']['symbol'] = line.effectSymbolPath;
          }
        }

        // 添加到结果数组
        result.push(flightLineData);
        
      } catch (error) {
        logger.error(`[FlightLine] 转换飞线 ${id} 数据失败:`, error);
      }
    });
    
    logger.debug(`[FlightLine] 成功转换 ${result.length} 条飞线数据`);
    return result;
  }

  /**
   * 检查坐标是否在有效范围内
   * @param coord 坐标
   * @returns 是否有效
   */
  private isValidCoordinate(coord: number[]): boolean {
    if (!coord || !Array.isArray(coord) || coord.length < 2) {
      return false;
    }
    
    // 检查坐标是否是有效数字且在合理范围内
    const [x, y] = coord;
    return !isNaN(x) && !isNaN(y) && 
           isFinite(x) && isFinite(y) && 
           Math.abs(x) < 20000000 && Math.abs(y) < 20000000;
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
    
    let coords = flightLine.coords;
    
    // 如果提供了from/to但没有coords，则转换成coords
    if (!coords && flightLine.from && flightLine.to) {
      coords = [flightLine.from, flightLine.to];
    }
    
    // 检查坐标是否已经在地理坐标映射中
    if (!this.geoCoordMap[flightLine.fromName] && coords && coords.length >= 1) {
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
      visible: false, // 默认不可见，只有在用户明确选择时才显示
      _createTime: flightLine._createTime || Date.now() // 添加创建时间
    };
    
    this.flightLines.set(id, finalFlightLine);
    
    logger.debug(`[FlightLine] 添加飞线: ${id} (${flightLine.fromName} -> ${flightLine.toName}), 默认不可见`);
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

    // 生成共享的创建时间，让同批次添加的飞线具有相同的创建时间
    const batchCreateTime = Date.now();
    
    const ids: string[] = [];
    flightLines.forEach(line => {
      // 为每个飞线设置创建时间
      const lineWithTime = {
        ...line,
        _createTime: line._createTime || batchCreateTime
      };
      ids.push(this.addFlightLine(lineWithTime));
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
      this.updateFlightLine(this.activeFlightLine, {
        highlight: false,
        style: undefined
      });
    }
    
    // 设置新的激活飞线
    this.activeFlightLine = id;
    
    // 高亮显示当前激活飞线
    this.updateFlightLine(id, {
      highlight: true,
      style: {
        width: (this.config.width || 1) * 1.5,
        opacity: 1,
        color: '#ff0000', // 红色高亮
        curveness: this.config.curveness
      }
    });
    
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
        
        // 如果飞线为空，添加测试数据
        if (this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
          logger.debug('[FlightLine] 已激活但无数据，添加测试数据');
          this.addTestFlightLines();
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
      
      // 如果没有飞线，可以添加测试数据
      if (this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
        this.addTestFlightLines();
        this.updateEchartsOptions();
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

    // 阶段3：600ms后设置最佳视角
    setTimeout(() => {
      try {
        this.setOptimalView(5);
        logger.debug('[FlightLine] 设置最佳视角完成');
      } catch (error) {
        logger.warn('[FlightLine] 设置最佳视角出错:', error);
      }
    }, 600);

    // 阶段4：1000ms后最终刷新
    setTimeout(() => {
      try {
        if (this.echartsLayer && typeof this.echartsLayer.redraw === 'function') {
          this.echartsLayer.redraw();
          logger.debug('[FlightLine] 最终刷新完成');
        }
      } catch (error) {
        logger.warn('[FlightLine] 最终刷新出错:', error);
      }
    }, 1000);
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
    const createRandomLine = (fromIndex: number, toIndex: number) => {
      const from = cityNames[fromIndex];
      const to = cityNames[toIndex];
      
      return {
        fromName: from,
        toName: to,
        coords: [cities[from], cities[to]],
        value: Math.floor(Math.random() * 1000) + 100,
        visible: false, // 确保测试数据默认不可见
        style: {
          // 使用明显的彩色线条
          color: `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 255) + 50}, 0.8)`,
          width: 2 + Math.random() * 3
        }
      };
    };
    
    const testLines = [];
    
    // 创建以北京为中心的星形网络
    for (let i = 1; i < cityNames.length; i++) {
      testLines.push(createRandomLine(0, i));
    }
    
    // 添加测试飞线
    testLines.forEach(line => {
      const id = this.addFlightLine(line);
      logger.debug(`[FlightLine] 添加测试飞线: ${id} - ${line.fromName} → ${line.toName}`);
    });
    
    // 高亮北京到上海的飞线（但不自动显示）
    const firstLineId = Array.from(this.flightLines.keys())[0];
    if (firstLineId) {
      this.updateFlightLine(firstLineId, {
        highlight: true,
        visible: false, // 保持隐藏状态
        style: {
          width: 4,
          color: '#1890ff',
          opacity: 1
        }
      });
      logger.debug(`[FlightLine] 高亮测试飞线: ${firstLineId}，但保持隐藏状态`);
    }
    
    logger.debug(`[FlightLine] 共添加了${testLines.length}条测试飞线，默认都不可见`);
    
    // 确保配置中启用了动画效果
    this.setConfig({
      showEffect: true,
      effectPeriod: 4,
      effectTrailLength: 0.6,
      effectSymbolSize: 8,
      showNodes: true,
      nodeSymbolSize: 3
    });
    
    logger.debug('[FlightLine] 配置已更新，启用动画效果和节点显示');
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
    if (!this.mapInstance || this.flightLines.size === 0) {
      logger.warn('[FlightLine] 无法设置最佳视角：缺少地图实例或没有飞线数据');
      return;
    }

    try {
      // 设置默认缩放级别为5
      const zoom = zoomLevel !== undefined ? zoomLevel : 5;
      
      // 计算所有飞线点的边界
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      // 遍历所有飞线，计算边界
      this.flightLines.forEach(line => {
        // 跳过不可见的飞线
        if (line.visible === false) {
          return;
        }

        if (line.coords && line.coords.length === 2) {
          const fromCoord = this.ensureGeoCoordinate(line.coords[0]);
          const toCoord = this.ensureGeoCoordinate(line.coords[1]);

          if (fromCoord && toCoord) {
            // 更新边界
            minX = Math.min(minX, fromCoord[0], toCoord[0]);
            minY = Math.min(minY, fromCoord[1], toCoord[1]);
            maxX = Math.max(maxX, fromCoord[0], toCoord[0]);
            maxY = Math.max(maxY, fromCoord[1], toCoord[1]);
          }
        }
      });

      // 检查是否找到有效边界
      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        logger.warn('[FlightLine] 无法计算飞线边界，使用默认中心点');
        
        // 使用第一个飞线的起点作为中心点
        const firstLine = Array.from(this.flightLines.values())[0];
        if (firstLine && firstLine.coords && firstLine.coords.length >= 1) {
          const center = this.ensureGeoCoordinate(firstLine.coords[0]);
          if (center) {
            // 设置地图视图
            const view = this.mapInstance.getView();
            view.setCenter(fromLonLat(center));
            view.setZoom(zoom);
            
            logger.debug(`[FlightLine] 已设置最佳视角到第一个飞线起点，中心点: [${center}], 缩放级别: ${zoom}`);
          }
        }
        return;
      }

      // 计算中心点
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // 设置地图视图 - 使用标准方式设置
      const view = this.mapInstance.getView();
      view.setCenter(fromLonLat([centerX, centerY]));
      view.setZoom(zoom);
      
      logger.debug(`[FlightLine] 已设置最佳视角，中心点: [${centerX}, ${centerY}], 缩放级别: ${zoom}`);
    } catch (error) {
      logger.error('[FlightLine] 设置最佳视角失败:', error);
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