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
          setTimeout(() => {
            this.initEchartsLayer();
          }, 500);
          return;
        }
      }

      // 动态导入ol-echarts和echarts库
      const { default: EChartsLayer } = await import('ol-echarts');
      const echarts = await import('echarts');

      // 保存全局echarts实例供后续使用
      this.echartsInstance = echarts;

      logger.debug('[FlightLine] 开始初始化ECharts图层...');

      // 获取地图DOM容器尺寸
      const mapElement = this.mapInstance.getTargetElement();
      const mapWidth = mapElement.clientWidth;
      const mapHeight = mapElement.clientHeight;
      
      logger.debug(`[FlightLine] 地图容器尺寸: ${mapWidth}x${mapHeight}, 地图大小: ${mapSize ? mapSize[0] + 'x' + mapSize[1] : '未知'}`);
      
      if (mapWidth === 0 || mapHeight === 0) {
        logger.error('[FlightLine] 地图容器尺寸为0，无法初始化图层');
        // 延迟重试
        setTimeout(() => {
          this.initEchartsLayer();
        }, 1000);
        return;
      }

      // 确保地图容器有相对或绝对定位，这对于z-index正常工作是必要的
      if (window.getComputedStyle(mapElement).position === 'static') {
        logger.debug('[FlightLine] 为地图容器添加相对定位以确保z-index工作');
        mapElement.style.position = 'relative';
      }

      // 尝试不同的配置方式，以兼容不同版本的ol-echarts
      try {
        // 新版本配置方式，添加更高的z-index确保在地图上方
        this.echartsLayer = new EChartsLayer({
          stopEvent: false,           // 允许事件继续传播
          hideOnMoving: false,        // 移动时不隐藏
          hideOnZooming: false,       // 缩放时不隐藏
          forcedPrecomposeRerender: true, // 强制重新渲染
          insertFirst: false,         // 确保在地图的最上层
          polyfillEvents: true,       // 支持事件
          source: 'ol',               // 使用OpenLayers作为源
          useMap: true,               // 使用地图实例
          debug: true,                // 开启调试
          coordinateSystem: 'openlayers', // 使用openlayers作为坐标系名称
          zIndex: 999,                // 设置更高的z-index
          zLevel: 10,                 // 设置更高的zLevel
          className: 'flight-line-layer', // 添加自定义类名便于样式调整
          renderOnAddLayer: true      // 添加图层后立即渲染
        });
        
        logger.debug('[FlightLine] 使用新版本配置方式创建图层成功');
        
        // 如果图层对象有DOM元素引用，尝试直接设置z-index
        try {
          setTimeout(() => {
            const ecContainer = mapElement.querySelector('.flight-line-layer') || 
                               mapElement.querySelector('.ol-echarts') || 
                               mapElement.querySelector('.ol-echarts-container');
            
            if (ecContainer && ecContainer instanceof HTMLElement) {
              ecContainer.style.zIndex = '999';
              ecContainer.style.position = 'absolute';
              ecContainer.style.pointerEvents = 'none'; // 允许鼠标事件穿透到地图
              logger.debug('[FlightLine] 成功设置图层容器样式');
            }
          }, 200);
        } catch (styleError) {
          logger.warn('[FlightLine] 设置图层DOM样式失败:', styleError);
        }
      } catch (error) {
        logger.warn('[FlightLine] 使用新配置方式创建图层失败，尝试兼容方式:', error);
        
        // 尝试旧版本配置方式
        this.echartsLayer = new EChartsLayer({
          stopEvent: false,
          hideOnMoving: false,
          hideOnZooming: false,
          forcedPrecomposeRerender: true,
          coordinateSystem: 'openlayers', // 尝试使用openlayers作为坐标系名称
          zIndex: 999,        // 设置z-index
          zLevel: 10          // 设置zLevel
        });
        
        logger.debug('[FlightLine] 使用兼容配置方式创建图层成功');
      }

      // 添加异常处理钩子，防止updateViewSize错误
      try {
        const originalUpdateViewSize = this.echartsLayer.updateViewSize;
        this.echartsLayer.updateViewSize = function() {
          try {
            const size = this._map.getSize();
            // 确保size是有效的数组
            if (!size || !Array.isArray(size) || size.length < 2 || !size[0] || !size[1]) {
              logger.warn('[FlightLine] 获取地图尺寸失败，使用容器尺寸代替');
              const container = this._map.getTargetElement();
              if (container) {
                const width = container.clientWidth || 100;
                const height = container.clientHeight || 100;
                this._ec.resize({
                  width: width,
                  height: height
                });
                return;
              }
              return; // 如果无法获取尺寸，则不更新
            }
            // 调用原始方法
            originalUpdateViewSize.apply(this, arguments);
          } catch (e) {
            logger.error('[FlightLine] updateViewSize方法执行出错:', e);
            // 尝试使用备用方法更新大小
            try {
              if (this._ec) {
                const container = this._map.getTargetElement();
                const width = container.clientWidth || 300;
                const height = container.clientHeight || 200;
                this._ec.resize({
                  width: width,
                  height: height
                });
              }
            } catch (resizeError) {
              logger.error('[FlightLine] 备用resize方法也失败:', resizeError);
            }
          }
        };
      } catch (patchError) {
        logger.warn('[FlightLine] 无法修补updateViewSize方法:', patchError);
      }

      // 将图层添加到地图
      try {
        this.echartsLayer.appendTo(this.mapInstance);
        logger.debug('[FlightLine] Echarts图层已添加到地图');
        
        // 尝试调整图层DOM元素的z-index
        this.adjustLayerZindex();
      } catch (appendError) {
        logger.error('[FlightLine] 添加图层到地图失败:', appendError);
        return;
      }

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
              logger.debug('[FlightLine] 视图变化，调用redraw()重新渲染');
            }
            // 方法2: 重新设置图表选项，强制刷新
            else {
              const currentOptions = this.echartsLayer.getChartOptions();
              if (currentOptions) {
                this.echartsLayer.setChartOptions(currentOptions);
                logger.debug('[FlightLine] 视图变化，重新设置图表选项');
              } else {
                this.updateEchartsOptions();
                logger.debug('[FlightLine] 视图变化，调用updateEchartsOptions()更新选项');
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

      logger.debug('[FlightLine] Echarts图层已初始化成功');
      
      // 延迟触发一次强制刷新
      setTimeout(() => {
        this.updateEchartsOptions();
        logger.debug('[FlightLine] 延迟调用updateEchartsOptions完成');
        
        // 再次尝试调整z-index
        this.adjustLayerZindex();
      }, 500);
    } catch (error) {
      logger.error('[FlightLine] 初始化Echarts图层失败:', error);
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
      
      logger.debug(`[FlightLine] 开始更新Echarts选项，共${convertedData.length}条数据`);
      
      // 确定使用的颜色数组
      const colorArray = Array.isArray(this.config.color) 
        ? this.config.color 
        : [this.config.color];
      
      // 记录边界范围用于调试
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      convertedData.forEach(item => {
        if (item.coords && item.coords.length >= 2) {
          const fromCoord = item.coords[0];
          const toCoord = item.coords[1];
          if (fromCoord && fromCoord.length >= 2) {
            minX = Math.min(minX, fromCoord[0]);
            minY = Math.min(minY, fromCoord[1]);
            maxX = Math.max(maxX, fromCoord[0]);
            maxY = Math.max(maxY, fromCoord[1]);
          }
          if (toCoord && toCoord.length >= 2) {
            minX = Math.min(minX, toCoord[0]);
            minY = Math.min(minY, toCoord[1]);
            maxX = Math.max(maxX, toCoord[0]);
            maxY = Math.max(maxY, toCoord[1]);
          }
        }
      });
      logger.debug(`[FlightLine] 飞线数据边界: [${minX}, ${minY}] - [${maxX}, ${maxY}]`);

      // 创建普通飞线系列
      series.push({
        name: '飞线',
        type: 'lines',
        coordinateSystem: 'openlayers', // 使用openlayers作为坐标系
        zlevel: 2,
        symbol: ['none', 'arrow'],   // 起点没有标记，终点是箭头
        symbolSize: 6,              // 箭头大小
        progressive: 200,           // 渐进式渲染的数据块大小
        progressiveThreshold: 500,  // 启用渐进式渲染的阈值
        animation: true,
        effect: {
          show: false,              // 普通线条不显示动画效果
        },
        lineStyle: {
          color: this.config.color,
          width: this.config.width,
          opacity: this.config.opacity,
          curveness: this.config.curveness,
          cap: 'round',             // 线帽样式为圆形
          join: 'round',            // 连接处为圆角
        },
        data: convertedData,
        silent: false,             // 响应鼠标事件
        tooltip: {
          show: true
        }
      });

      // 如果配置了显示动画效果，则添加动画效果图层
      if (this.config.showEffect) {
        series.push({
          name: '飞线动画',
          type: 'lines',
          coordinateSystem: 'openlayers', // 使用openlayers作为坐标系
          zlevel: 3,                // 高于普通线条
          effect: {
            show: true,
            period: this.config.effectPeriod,
            trailLength: this.config.effectTrailLength,
            symbol: this.config.effectSymbol,
            symbolSize: this.config.effectSymbolSize,
            loop: true,             // 循环动画
            delay: function(idx) {  // 随机延迟，避免所有线同时出现
              return Math.random() * 1000;
            }
          },
          lineStyle: {
            color: this.config.color,
            width: 0,               // 动画线宽为0，只显示动画效果
            opacity: this.config.opacity,
            curveness: this.config.curveness,
            type: 'dotted'          // 点状线条，增强视觉效果
          },
          data: convertedData,
          silent: true              // 不响应鼠标事件
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
            symbolSize: this.config.nodeSymbolSize,
            itemStyle: {
              color: colorArray[0],
              borderColor: '#fff',
              borderWidth: 1
            }
          });
        });
        
        // 添加节点图层
        if (pointData.length > 0) {
          series.push({
            name: '节点',
            type: 'scatter',
            coordinateSystem: 'openlayers', // 使用openlayers作为坐标系
            zlevel: 4,
            symbolSize: this.config.nodeSymbolSize,
            symbol: 'circle',
            itemStyle: {
              color: colorArray[0],
              borderColor: '#fff',
              borderWidth: 1,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 5
            },
            emphasis: {              // 鼠标悬停效果
              itemStyle: {
                color: '#1890ff',
                shadowBlur: 10,
                shadowColor: 'rgba(0, 84, 255, 0.5)'
              },
              scale: 1.5
            },
            data: pointData,
            tooltip: {
              show: true,
              formatter: '{b}'
            }
          });
          
          // 添加节点标签层
          series.push({
            name: '节点标签',
            type: 'scatter',
            coordinateSystem: 'openlayers', // 使用openlayers作为坐标系
            zlevel: 5,
            symbolSize: 0, // 不显示符号
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              color: '#333',
              backgroundColor: 'rgba(255,255,255,0.7)',
              padding: [3, 5],
              borderRadius: 3,
              distance: 10,          // 标签与点的距离
              fontWeight: 'bold'     // 标签文字粗细
            },
            emphasis: {
              label: {
                show: true,
                color: '#1890ff',
                backgroundColor: 'rgba(255,255,255,0.9)'
              }
            },
            data: pointData,
            silent: true           // 不响应鼠标事件
          });
        }
      }

      // 设置echarts选项
      const option = {
        animation: true,
        renderer: 'canvas',        // 使用canvas渲染
        tooltip: {
          show: true,
          trigger: 'item',
          enterable: true,          // 鼠标可进入提示框
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderColor: '#ccc',
          borderWidth: 1,
          padding: [5, 10],
          extraCssText: 'box-shadow: 0 0 10px rgba(0,0,0,0.1);',
          formatter: (params: any) => {
            if (params.seriesType === 'scatter') {
              return `<strong>${params.name}</strong>`;
            }
            if (params.seriesType === 'lines') {
              return `<div style="font-weight:bold">${params.data.fromName} → ${params.data.toName}</div>
                     ${params.data.value ? `<div>值: ${params.data.value}</div>` : ''}`;
            }
            return '';
          },
        },
        grid: {
          show: false               // 不显示网格
        },
        series,
      };

      // 输出详细日志便于调试
      logger.debug('[FlightLine] 即将设置ECharts选项:', JSON.stringify({
        seriesCount: series.length,
        dataCount: convertedData.length,
        firstCoord: convertedData.length > 0 ? 
          JSON.stringify(convertedData[0].coords).substring(0, 100) : '无数据'
      }));

      // 确保图层没有被销毁
      if (!this.echartsLayer) {
        logger.error('[FlightLine] 图层已被销毁，无法设置选项');
        return;
      }

      try {
        // 更新echarts选项
        this.echartsLayer.setChartOptions(option);
        logger.debug('[FlightLine] 已设置ECharts选项');
      } catch (setOptionsError) {
        logger.error('[FlightLine] 设置图表选项失败:', setOptionsError);
        return;
      }
      
      // 尝试重新渲染图表 - 兼容不同版本的ol-echarts
      try {
        if (typeof this.echartsLayer.redraw === 'function') {
          this.echartsLayer.redraw();
          logger.debug('[FlightLine] 成功调用redraw()重新渲染图表');
        }
      } catch (renderError) {
        logger.warn('[FlightLine] 尝试重新渲染图表失败，但不影响正常使用:', renderError);
      }

      // 延迟再次尝试渲染
      setTimeout(() => {
        try {
          if (this.echartsLayer && typeof this.echartsLayer.redraw === 'function') {
            this.echartsLayer.redraw();
            logger.debug('[FlightLine] 延迟重新渲染成功');
          }
        } catch (e) {
          logger.warn('[FlightLine] 延迟重新渲染失败:', e);
        }
      }, 200);

      logger.debug('[FlightLine] Echarts选项更新完成');
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
    
    // 检查是否有数据
    if (this.flightLines.size === 0) {
      logger.warn('[FlightLine] 飞线数据为空，请先添加飞线数据');
      
      // 开发环境下添加测试数据以便于调试
      if (process.env.NODE_ENV === 'development') {
        this.addTestFlightLines();
        logger.debug('[FlightLine] 已添加测试飞线数据');
      }
    }
    
    this.flightLines.forEach((line, id) => {
      // 跳过不可见的飞线
      if (line.visible === false) {
        logger.debug(`[FlightLine] 跳过不可见飞线: ${id}`);
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
        
        // 检查坐标是否在合理范围内
        const isValidCoord = (coord: number[]) => {
          return coord && 
                 coord.length >= 2 && 
                 !isNaN(coord[0]) && 
                 !isNaN(coord[1]) && 
                 Math.abs(coord[0]) <= 180 && 
                 Math.abs(coord[1]) <= 90;
        };
        
        if (!isValidCoord(fromCoord) || !isValidCoord(toCoord)) {
          logger.warn(`[FlightLine] 坐标超出有效范围: ${fromCoord} -> ${toCoord}`);
          return;
        }
        
        // 将经纬度转换为投影坐标（EPSG:3857）
        try {
          const projectedFromCoord = fromLonLat(fromCoord);
          const projectedToCoord = fromLonLat(toCoord);
          
          if (projectedFromCoord.some(isNaN) || projectedToCoord.some(isNaN)) {
            logger.warn(`[FlightLine] 投影坐标包含NaN: ${projectedFromCoord} -> ${projectedToCoord}`);
            return;
          }
          
          logger.debug(`[FlightLine] 飞线坐标转换 - 原始: [${fromCoord}] -> [${toCoord}]`);
          logger.debug(`[FlightLine] 飞线坐标转换 - 投影: [${projectedFromCoord}] -> [${projectedToCoord}]`);
          
          // 构建飞线数据 - 采用简化格式并设置更强的视觉效果
          const lineData: any = {
            name: `${line.fromName} 到 ${line.toName}`,
            fromName: line.fromName,
            toName: line.toName,
            coords: [projectedFromCoord, projectedToCoord], // 使用投影后的坐标
            value: line.value || 1
          };
          
          // 如果是高亮状态或有自定义样式，添加样式
          if (line.highlight || line.style) {
            lineData.lineStyle = {
              width: line.style?.width || (line.highlight ? 3 : this.config.width),
              color: line.style?.color || (line.highlight ? '#1890ff' : this.config.color),
              opacity: line.style?.opacity || (line.highlight ? 1 : this.config.opacity),
              curveness: this.config.curveness || 0.2,
              shadowColor: line.highlight ? 'rgba(0, 84, 255, 0.8)' : undefined,
              shadowBlur: line.highlight ? 8 : undefined
            };
            
            if (line.highlight) {
              logger.debug(`[FlightLine] 飞线${id}设置为高亮: ${JSON.stringify(lineData.lineStyle)}`);
            } else if (line.style) {
              logger.debug(`[FlightLine] 飞线${id}使用自定义样式: ${JSON.stringify(lineData.lineStyle)}`);
            }
          }
          
          result.push(lineData);
          logger.debug(`[FlightLine] 转换飞线成功: ${id}, ${line.fromName} -> ${line.toName}`);
        } catch (error) {
          logger.error(`[FlightLine] 坐标转换失败: ${error}`);
        }
      } else {
        logger.warn(`[FlightLine] 飞线${id}缺少有效坐标数据`);
      }
    });
    
    // 日志记录
    if (result.length === 0) {
      logger.warn('[FlightLine] 没有有效的飞线数据可显示');
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
        
        // 如果飞线为空，添加测试数据
        if (this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
          logger.debug('[FlightLine] 已激活但无数据，添加测试数据');
          this.addTestFlightLines();
          this.updateEchartsOptions();
        }
      }
      return;
    }

    if (!this.mapInstance) {
      logger.error('[FlightLine] 地图实例不存在，无法启用飞线图');
      return;
    }

    logger.info('[FlightLine] 开始启用飞线图');
    
    // 确保地图尺寸有效
    try {
      const mapSize = this.mapInstance.getSize();
      if (!mapSize || !mapSize[0] || !mapSize[1]) {
        logger.warn('[FlightLine] 地图尺寸无效，尝试更新地图尺寸');
        this.mapInstance.updateSize();
        
        // 检查更新后的尺寸
        const newSize = this.mapInstance.getSize();
        if (!newSize || !newSize[0] || !newSize[1]) {
          logger.error('[FlightLine] 更新后地图尺寸仍然无效，飞线图可能无法正确显示', newSize);
        } else {
          logger.debug('[FlightLine] 更新后地图尺寸:', newSize);
        }
      } else {
        logger.debug('[FlightLine] 地图尺寸正常:', mapSize);
      }
    } catch (sizeError) {
      logger.error('[FlightLine] 获取地图尺寸时出错:', sizeError);
    }
    
    // 强制添加一些测试飞线数据（开发环境）
    if (this.flightLines.size === 0 && process.env.NODE_ENV === 'development') {
      logger.debug('[FlightLine] 自动添加测试飞线数据');
      this.addTestFlightLines();
    }
    
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
          // 彻底销毁现有图层
          try {
            if (this.echartsLayer && typeof this.echartsLayer.remove === 'function') {
              this.echartsLayer.remove();
            }
          } catch (removeError) {
            logger.warn('[FlightLine] 移除旧图层失败:', removeError);
          }
          this.echartsLayer = null;
          
          // 重新初始化
          await this.initEchartsLayer();
        }
      }
      
      // 如果图层初始化失败，则返回
      if (!this.echartsLayer) {
        logger.error('[FlightLine] Echarts图层初始化失败，无法启用飞线图');
        return;
      }

      // 更新飞线图选项
      this.updateEchartsOptions();

      this.active = true;
      logger.info('[FlightLine] 飞线图已成功启用');
      
      // 如果没有飞线数据，添加一些测试数据
      if (flightLineCount === 0) {
        logger.debug('[FlightLine] 没有飞线数据，添加示例数据以便测试');
        this.addTestFlightLines();
        // 更新新添加的测试数据
        this.updateEchartsOptions();
      }
      
      // 创建一个调试飞线 - 在地图中心附近
      if (process.env.NODE_ENV === 'development') {
        try {
          const mapView = this.mapInstance.getView();
          const center = mapView.getCenter();
          
          if (center && center.length >= 2) {
            const centerLonLat = toLonLat(center);
            
            // 在中心点周围创建一个正方形的四个点
            const offset = 0.05; // 经纬度偏移量
            const points = [
              [centerLonLat[0] - offset, centerLonLat[1] - offset], // 左下
              [centerLonLat[0] + offset, centerLonLat[1] - offset], // 右下
              [centerLonLat[0] + offset, centerLonLat[1] + offset], // 右上
              [centerLonLat[0] - offset, centerLonLat[1] + offset]  // 左上
            ];
            
            // 添加四个点
            this.addCoordinate('中心点', centerLonLat as [number, number]);
            points.forEach((pt, idx) => {
              this.addCoordinate(`点${idx+1}`, pt as [number, number]);
            });
            
            // 添加从中心到四个点的飞线
            points.forEach((pt, idx) => {
              this.addFlightLine({
                fromName: '中心点',
                toName: `点${idx+1}`,
                coords: [centerLonLat, pt],
                value: 100 + idx * 10,
                style: {
                  color: '#ff0000',
                  width: 3,
                  opacity: 0.8
                }
              });
            });
            
            logger.debug('[FlightLine] 已添加地图中心调试飞线');
          }
        } catch (error) {
          logger.warn('[FlightLine] 添加地图中心调试飞线失败:', error);
        }
      }
      
      // 开始分阶段处理，确保图层稳定显示
      this.schedulePostEnableProcessing();
    } catch (error) {
      logger.error('[FlightLine] 启用飞线图时发生错误:', error);
      throw error; // 重新抛出错误以便调用者处理
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
    
    // 高亮北京到上海的飞线
    const firstLineId = Array.from(this.flightLines.keys())[0];
    if (firstLineId) {
      this.updateFlightLine(firstLineId, {
        highlight: true,
        style: {
          width: 4,
          color: '#1890ff',
          opacity: 1
        }
      });
      logger.debug(`[FlightLine] 高亮测试飞线: ${firstLineId}`);
    }
    
    logger.debug(`[FlightLine] 共添加了${testLines.length}条测试飞线`);
    
    // 确保配置中启用了动画效果
    this.setConfig({
      showEffect: true,
      effectPeriod: 4,
      effectTrailLength: 0.6,
      showNodes: true,
      nodeSymbolSize: 8
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
      
      // 设置地图视图
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