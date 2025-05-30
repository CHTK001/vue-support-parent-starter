/**
 * 测距对象
 * @description 用于地图测量距离功能
 */
import { Map } from 'ol';
import { Draw, Snap } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { LineString, Polygon, Point } from 'ol/geom';
import { Feature, Overlay } from 'ol';
import { getLength, getArea } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { FeatureLike } from 'ol/Feature';
import logger from './LogObject';

// 测量类型
export type MeasureType = 'distance' | 'area';

// 测量样式配置
export interface MeasureStyle {
  // 线样式
  line?: {
    stroke?: {
      color?: string;
      width?: number;
      lineDash?: number[];
    };
  };
  // 面样式
  polygon?: {
    stroke?: {
      color?: string;
      width?: number;
      lineDash?: number[];
    };
    fill?: {
      color?: string;
    };
  };
  // 点样式
  point?: {
    radius?: number;
    stroke?: {
      color?: string;
      width?: number;
    };
    fill?: {
      color?: string;
    };
  };
  // 文本样式
  text?: {
    font?: string;
    fill?: {
      color?: string;
    };
    stroke?: {
      color?: string;
      width?: number;
    };
    offsetY?: number;
    padding?: number[];
  };
}

// 默认样式配置
const DEFAULT_STYLE: MeasureStyle = {
  line: {
    stroke: {
      color: 'rgba(24, 144, 255, 1)',
      width: 3,
      lineDash: [5, 5]
    }
  },
  polygon: {
    stroke: {
      color: 'rgba(24, 144, 255, 1)',
      width: 3,
      lineDash: [5, 5]
    },
    fill: {
      color: 'rgba(24, 144, 255, 0.2)'
    }
  },
  point: {
    radius: 5,
    stroke: {
      color: 'rgba(24, 144, 255, 0.8)',
      width: 2
    },
    fill: {
      color: 'rgba(255, 255, 255, 0.8)'
    }
  },
  text: {
    font: '14px Calibri,sans-serif',
    fill: {
      color: '#333'
    },
    stroke: {
      color: '#fff',
      width: 3
    },
    offsetY: -12,
    padding: [5, 5, 5, 5]
  }
};

/**
 * 测距对象类
 */
export class MeasureObject {
  // 地图实例
  private mapInstance: Map | null = null;
  // 绘制图层源
  private source: VectorSource = new VectorSource();
  // 绘制图层
  private layer: VectorLayer | null = null;
  // 绘制交互
  private draw: Draw | null = null;
  // 捕捉交互
  private snap: Snap | null = null;
  // 监听器
  private measureListener: any = null;
  // 提示元素
  private helpTooltipElement: HTMLElement | null = null;
  // 测量提示元素
  private measureTooltipElement: HTMLElement | null = null;
  // 测量提示数组
  private measureTooltips: Overlay[] = [];
  // 帮助提示数组
  private helpTooltip: Overlay | null = null;
  // 绘制的特征
  private sketch: Feature<LineString | Polygon> | null = null;
  // 当前测量类型
  private measureType: MeasureType = 'distance';
  // 样式配置
  private style: MeasureStyle = DEFAULT_STYLE;
  // 是否启用
  private enabled: boolean = false;
  // 添加一个标志位，用于防抖
  private _redrawScheduled: boolean = false;

  /**
   * 构造函数
   * @param mapInstance 地图实例
   * @param style 样式配置
   */
  constructor(mapInstance: Map | null = null, style?: MeasureStyle) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    if (style) {
      this.setStyle(style);
    }

    // 创建矢量图层
    this.layer = new VectorLayer({
      source: this.source,
      zIndex: 999,
      style: (feature) => {
        return this.createFeatureStyle(feature as Feature<LineString | Polygon | Point>);
      }
    });

    logger.debug('测距对象已创建');
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: Map): void {
    this.mapInstance = mapInstance;
    
    // 如果图层已经创建，添加到地图
    if (this.layer && !this.isLayerAdded()) {
      this.mapInstance.addLayer(this.layer);
    }

    logger.debug('测距对象已设置地图实例');
  }

  /**
   * 设置样式
   * @param style 样式配置
   */
  public setStyle(style: MeasureStyle): void {
    this.style = {
      ...DEFAULT_STYLE,
      ...style,
      line: {
        ...DEFAULT_STYLE.line,
        ...style.line,
        stroke: {
          ...DEFAULT_STYLE.line?.stroke,
          ...style.line?.stroke
        }
      },
      polygon: {
        ...DEFAULT_STYLE.polygon,
        ...style.polygon,
        stroke: {
          ...DEFAULT_STYLE.polygon?.stroke,
          ...style.polygon?.stroke
        },
        fill: {
          ...DEFAULT_STYLE.polygon?.fill,
          ...style.polygon?.fill
        }
      },
      point: {
        ...DEFAULT_STYLE.point,
        ...style.point,
        stroke: {
          ...DEFAULT_STYLE.point?.stroke,
          ...style.point?.stroke
        },
        fill: {
          ...DEFAULT_STYLE.point?.fill,
          ...style.point?.fill
        }
      },
      text: {
        ...DEFAULT_STYLE.text,
        ...style.text,
        fill: {
          ...DEFAULT_STYLE.text?.fill,
          ...style.text?.fill
        },
        stroke: {
          ...DEFAULT_STYLE.text?.stroke,
          ...style.text?.stroke
        }
      }
    };

    // 刷新图层样式
    if (this.layer) {
      this.layer.changed();
    }

    logger.debug('测距对象样式已更新');
  }

  /**
   * 启用测距功能
   * @param type 测量类型
   */
  public enable(type: MeasureType = 'distance'): void {
    if (!this.mapInstance) {
      logger.warn('地图实例未设置，无法启用测距功能');
      return;
    }

    // 如果已经启用，先禁用
    if (this.enabled) {
      this.disable();
    }

    this.measureType = type;

    // 确保图层已添加到地图
    if (!this.isLayerAdded()) {
      this.mapInstance.addLayer(this.layer as VectorLayer);
    }

    // 创建绘制交互
    this.addInteraction();

    this.enabled = true;
    logger.debug(`测距功能已启用，类型: ${type}`);
  }

  /**
   * 禁用测距功能
   */
  public disable(): void {
    if (!this.mapInstance || !this.enabled) {
      return;
    }

    // 移除交互
    this.removeInteraction();

    // 移除帮助提示
    this.removeHelpTooltip();
    
    // 清除所有测距数据
    this.clear();

    this.enabled = false;
    logger.debug('测距功能已禁用，所有测距数据已清除');
  }

  /**
   * 清除测量结果
   */
  public clear(): void {
    // 清空图层
    this.source.clear();

    // 清除所有测量提示
    this.clearMeasureTooltips();

    logger.debug('测距结果已清除');
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    this.disable();

    // 移除图层
    if (this.mapInstance && this.layer) {
      this.mapInstance.removeLayer(this.layer);
    }

    // 清空资源
    this.layer = null;
    this.mapInstance = null;
    this.source = new VectorSource();
    this.enabled = false;

    logger.debug('测距对象已销毁');
  }

  /**
   * 是否已启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取当前测量类型
   */
  public getMeasureType(): MeasureType {
    return this.measureType;
  }

  /**
   * 切换测量类型
   * @param type 测量类型
   */
  public switchType(type: MeasureType): void {
    if (this.measureType === type) {
      return;
    }
    
    // 如果已启用，重新启用新类型
    if (this.enabled) {
      this.disable();
      this.enable(type);
    } else {
      this.measureType = type;
    }

    logger.debug(`测距类型已切换为: ${type}`);
  }

  /**
   * 添加交互
   */
  private addInteraction(): void {
    if (!this.mapInstance) return;

    const type = this.measureType === 'distance' ? 'LineString' : 'Polygon';

    // 创建绘制交互
    this.draw = new Draw({
      source: this.source,
      type: type,
      style: (feature) => {
        return this.createFeatureStyle(feature as Feature<LineString | Polygon | Point>);
      }
    });

    // 添加绘制交互
    this.mapInstance.addInteraction(this.draw);

    // 创建捕捉交互
    this.snap = new Snap({
      source: this.source
    });
    
    // 添加捕捉交互
    this.mapInstance.addInteraction(this.snap);

    // 创建帮助提示
    this.createHelpTooltip();

    // 添加绘制开始事件监听
    this.draw.on('drawstart', this.handleDrawStart.bind(this));
    
    // 添加绘制结束事件监听
    this.draw.on('drawend', this.handleDrawEnd.bind(this));
  }

  /**
   * 移除交互
   */
  private removeInteraction(): void {
    if (!this.mapInstance) return;

    // 移除绘制交互
    if (this.draw) {
      this.mapInstance.removeInteraction(this.draw);
      this.draw = null;
    }

    // 移除捕捉交互
    if (this.snap) {
      this.mapInstance.removeInteraction(this.snap);
      this.snap = null;
    }

    // 移除监听器
    if (this.measureListener) {
      unByKey(this.measureListener);
      this.measureListener = null;
    }
  }

  /**
   * 处理绘制开始事件
   * @param evt 事件对象
   */
  private handleDrawStart(evt: any): void {
    // 获取绘制的要素
    this.sketch = evt.feature as Feature<LineString | Polygon>;

    // 创建测量提示
    this.createMeasureTooltip();

    // 添加几何变化监听器
    this.measureListener = this.sketch.getGeometry().on('change', (e: any) => {
      // 使用requestAnimationFrame优化，减少频繁更新
      window.requestAnimationFrame(() => {
        const geom = e.target;
        let output = '';
        let tooltipCoord = null;

        if (this.measureType === 'distance') {
          const length = getLength(geom);
          output = this.formatLength(length);
          tooltipCoord = (geom as LineString).getLastCoordinate();
          
          // 触发要素重新绘制，使节点距离标签更新
          // 添加防抖，避免频繁触发重绘
          if (this.source && !this._redrawScheduled) {
            this._redrawScheduled = true;
            window.requestAnimationFrame(() => {
              this.source.dispatchEvent('change');
              this._redrawScheduled = false;
            });
          }
        } else {
          const area = getArea(geom);
          output = this.formatArea(area);
          tooltipCoord = (geom as Polygon).getInteriorPoint().getCoordinates();
        }

        if (this.measureTooltipElement) {
          this.measureTooltipElement.innerHTML = output;
        }

        if (this.measureTooltips.length > 0) {
          const tooltip = this.measureTooltips[this.measureTooltips.length - 1];
          tooltip.setPosition(tooltipCoord);
        }
      });
    });
  }

  /**
   * 处理绘制结束事件
   */
  private handleDrawEnd(): void {
    // 更新测量提示样式
    if (this.measureTooltipElement) {
      this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
      
      // 添加删除按钮
      const deleteButton = document.createElement('span');
      deleteButton.className = 'delete-measure-btn';
      deleteButton.innerHTML = '×';
      deleteButton.title = '删除此测量';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        // 如果当前测量提示有对应的要素，则删除
        if (this.source && this.measureTooltips.length > 0) {
          const tooltipToRemove = this.measureTooltips[this.measureTooltips.length - 1];
          const features = this.source.getFeatures();
          if (features.length > 0) {
            // 移除最后添加的要素
            this.source.removeFeature(features[features.length - 1]);
          }
          
          // 移除提示
          if (tooltipToRemove && this.mapInstance) {
            this.mapInstance.removeOverlay(tooltipToRemove);
            const element = tooltipToRemove.getElement();
            if (element && element.parentNode) {
              element.parentNode.removeChild(element);
            }
            
            // 从数组中移除
            const index = this.measureTooltips.indexOf(tooltipToRemove);
            if (index !== -1) {
              this.measureTooltips.splice(index, 1);
            }
          }
        }
      };
      
      this.measureTooltipElement.appendChild(deleteButton);
    }

    // 将最后一个提示固定位置
    if (this.measureTooltips.length > 0) {
      const tooltip = this.measureTooltips[this.measureTooltips.length - 1];
      tooltip.setOffset([0, -7]);
    }

    // 重置交互状态
    this.sketch = null;
    this.measureTooltipElement = null;
    
    // 重新创建测量提示
    this.createMeasureTooltip();
    
    // 移除监听器
    if (this.measureListener) {
      unByKey(this.measureListener);
      this.measureListener = null;
    }
    
    // 刷新图层，使总距离标签更新
    if (this.source) {
      this.source.changed();
    }
  }

  /**
   * 创建测量提示
   */
  private createMeasureTooltip(): void {
    if (!this.mapInstance) return;

    // 创建提示元素
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode?.removeChild(this.measureTooltipElement);
    }
    
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    
    // 创建提示Overlay
    const measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      className: 'measure-tooltip'
    });
    
    this.mapInstance.addOverlay(measureTooltip);
    
    // 保存提示
    this.measureTooltips.push(measureTooltip);
  }

  /**
   * 创建帮助提示
   */
  private createHelpTooltip(): void {
    if (!this.mapInstance) return;

    // 移除已有的帮助提示
    this.removeHelpTooltip();
    
    // 创建帮助提示元素
    this.helpTooltipElement = document.createElement('div');
    this.helpTooltipElement.className = 'ol-tooltip';
    
    // 创建提示Overlay
    this.helpTooltip = new Overlay({
      element: this.helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left',
      className: 'help-tooltip'
    });
    
    this.mapInstance.addOverlay(this.helpTooltip);
    
    // 添加鼠标移动监听器
    this.mapInstance.getViewport().addEventListener('pointermove', this.handlePointerMove.bind(this));
  }

  /**
   * 移除帮助提示
   */
  private removeHelpTooltip(): void {
    if (!this.mapInstance) return;

    // 移除帮助提示元素
    if (this.helpTooltipElement) {
      this.helpTooltipElement.parentNode?.removeChild(this.helpTooltipElement);
      this.helpTooltipElement = null;
    }
    
    // 移除帮助提示Overlay
    if (this.helpTooltip) {
      this.mapInstance.removeOverlay(this.helpTooltip);
      this.helpTooltip = null;
    }
    // 移除鼠标移动监听器
    this.mapInstance.getViewport().removeEventListener('pointermove', this.handlePointerMove.bind(this));
  }

  /**
   * 清除测量提示
   */
  private clearMeasureTooltips(): void {
    if (!this.mapInstance) return;

    // 移除所有测量提示
    this.measureTooltips.forEach(tooltip => {
      const element = tooltip.getElement();
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.mapInstance?.removeOverlay(tooltip);
    });
    
    this.measureTooltips = [];
    this.measureTooltipElement = null;
  }

  /**
   * 处理鼠标移动事件
   * @param event 事件对象
   */
  private handlePointerMove(event: any): void {
    if (!this.mapInstance || !this.helpTooltipElement || !this.helpTooltip) return;

    // 使用requestAnimationFrame提高性能
    window.requestAnimationFrame(() => {
      const pixel = this.mapInstance!.getEventPixel(event);
      const hit = this.mapInstance!.hasFeatureAtPixel(pixel);
      
      // 更新帮助提示内容和位置
      if (this.helpTooltipElement) {
        this.helpTooltipElement.style.display = this.sketch ? '' : 'none';
        
        if (this.sketch) {
          const type = this.measureType === 'distance' ? '单击继续绘制, 双击结束' : '单击绘制多边形, 双击结束';
          this.helpTooltipElement.innerHTML = type;
        }
      }
      
      if (this.helpTooltip) {
        this.helpTooltip.setPosition(this.mapInstance!.getEventCoordinate(event));
      }
      
      // 更新鼠标样式
      this.mapInstance!.getTargetElement().style.cursor = hit ? 'pointer' : 'crosshair';
    });
  }

  /**
   * 格式化长度
   * @param length 长度
   * @returns 格式化后的长度
   */
  private formatLength(length: number): string {
    let output;
    
    if (length > 1000) {
      output = `${(Math.round(length / 10) / 100).toFixed(2)} 公里`;
    } else {
      output = `${Math.round(length * 100) / 100} 米`;
    }
    
    return `总距离: ${output}`;
  }

  /**
   * 格式化面积
   * @param area 面积
   * @returns 格式化后的面积
   */
  private formatArea(area: number): string {
    let output;
    
    if (area > 1000000) {
      output = `${Math.round((area / 1000000) * 100) / 100} km²`;
    } else {
      output = `${Math.round(area * 100) / 100} m²`;
    }
    
    return `总面积: ${output}`;
  }

  /**
   * 检查图层是否已添加到地图
   * @returns 是否已添加
   */
  private isLayerAdded(): boolean {
    if (!this.mapInstance || !this.layer) return false;
    
    const layers = this.mapInstance.getLayers().getArray();
    return layers.includes(this.layer);
  }

  /**
   * 创建要素样式
   * @param feature 要素
   * @returns 样式
   */
  private createFeatureStyle(feature: Feature<LineString | Polygon | Point>): Style | Style[] {
    const styles = [];
    const geometry = feature.getGeometry();
    
    if (!geometry) return new Style();
    
    // 线样式
    if (geometry instanceof LineString) {
      styles.push(
        new Style({
          stroke: new Stroke({
            color: this.style.line?.stroke?.color || 'rgba(24, 144, 255, 1)',
            width: this.style.line?.stroke?.width || 3,
            lineDash: this.style.line?.stroke?.lineDash || [5, 5],
            lineCap: 'round',  // 添加圆角端点，提高视觉效果
            lineJoin: 'round'  // 添加圆角连接，提高视觉效果
          })
        })
      );
      
      // 添加顶点样式
      const coordinates = geometry.getCoordinates();
      
      // 计算总距离
      const totalDistance = getLength(geometry);
      
      // 检查是否已绘制完成
      const isDrawComplete = feature.get('drawComplete');
      
      // 计算每个节点的累计距离，用于显示在每个节点处
      let accumulatedDistance = 0;
      
      for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];
        const isLastPoint = i === coordinates.length - 1;
        const isFirstPoint = i === 0;
        
        // 添加节点样式 - 使用ol-tooltip-measure样式
        styles.push(
          new Style({
            geometry: new Point(coord),
            image: new CircleStyle({
              radius: isFirstPoint || isLastPoint ? 7 : 5, // 首尾节点稍大
              stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0.8)',
                width: 2
              }),
              fill: new Fill({
                color: isFirstPoint ? 'rgba(24, 144, 255, 0.9)' : 
                      isLastPoint ? 'rgba(0, 177, 89, 0.9)' : 'rgba(24, 144, 255, 0.7)'
              })
            }),
            zIndex: 10
          })
        );
        
        // 计算当前节点的累计距离
        if (i > 0) {
          const segment = new LineString([coordinates[i-1], coordinates[i]]);
          const segmentLength = getLength(segment);
          accumulatedDistance += segmentLength;
          
          // 为每个节点添加距离标签（除了起始点）
          if (!isFirstPoint) {
            // 格式化累计距离
            let distanceText = '';
            if (accumulatedDistance > 1000) {
              distanceText = `${(Math.round(accumulatedDistance / 10) / 100).toFixed(2)} 公里`;
            } else {
              distanceText = `${Math.round(accumulatedDistance * 100) / 100} 米`;
            }
            
            // 添加节点距离标签，区分中间节点和终点
            styles.push(
              new Style({
                geometry: new Point(coord),
                text: new Text({
                  text: isLastPoint ? '' : distanceText, // 终点不显示累计距离，只显示总距离
                  font: '12px Arial,sans-serif',
                  fill: new Fill({
                    color: '#ffffff'
                  }),
                  backgroundFill: new Fill({
                    color: 'rgba(24, 144, 255, 0.9)' // 中间节点使用蓝色背景
                  }),
                  padding: [3, 5, 3, 5],
                  offsetY: -18,
                  textAlign: 'center',
                  textBaseline: 'middle'
                }),
                zIndex: 11
              })
            );
          }
        }
        
        // 只在绘制过程中的最后一个点添加总距离标签
        // 绘制完成后，由Overlay显示总距离，避免重复
        if (isLastPoint && !isDrawComplete) {
          // 添加总距离标签 - 使用绿色背景和更大的字体
          const label = this.formatLength(totalDistance);
          
          // 当测量结束后，由Overlay显示总距离，避免重复
          if (this.sketch) {
            styles.push(
              new Style({
                geometry: new Point(coord),
                text: new Text({
                  text: label,
                  font: 'bold 16px Arial,sans-serif', // 增大字体
                  fill: new Fill({
                    color: '#ffffff'
                  }),
                  backgroundFill: new Fill({
                    color: 'rgba(0, 177, 89, 0.9)' // 使用绿色背景
                  }),
                  padding: [6, 10, 6, 10], // 增大内边距
                  stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.2)',
                    width: 3
                  }),
                  offsetY: -30, // 调整位置，避免与节点距离标签重叠
                  textAlign: 'center',
                  textBaseline: 'middle'
                }),
                zIndex: 12 // 确保总距离标签显示在最上层
              })
            );
          }
        }
      }
      
      // 当绘制完成后，标记要素
      if (!isDrawComplete && !this.sketch) {
        feature.set('drawComplete', true);
      }
    } 
    // 面样式
    else if (geometry instanceof Polygon) {
      styles.push(
        new Style({
          stroke: new Stroke({
            color: this.style.polygon?.stroke?.color || 'rgba(24, 144, 255, 1)',
            width: this.style.polygon?.stroke?.width || 3,
            lineDash: this.style.polygon?.stroke?.lineDash || [5, 5]
          }),
          fill: new Fill({
            color: this.style.polygon?.fill?.color || 'rgba(24, 144, 255, 0.2)'
          })
        })
      );
      
      // 添加顶点样式
      const coordinates = geometry.getCoordinates()[0];
      
      for (let i = 0; i < coordinates.length - 1; i++) {
        styles.push(
          new Style({
            geometry: new Point(coordinates[i]),
            image: new CircleStyle({
              radius: this.style.point?.radius || 5,
              stroke: new Stroke({
                color: this.style.point?.stroke?.color || 'rgba(24, 144, 255, 0.8)',
                width: this.style.point?.stroke?.width || 2
              }),
              fill: new Fill({
                color: this.style.point?.fill?.color || 'rgba(255, 255, 255, 0.8)'
              })
            })
          })
        );
      }
    }
    
    return styles;
  }
}

/**
 * 创建测距对象
 * @param mapInstance 地图实例
 * @param style 样式配置
 * @returns 测距对象
 */
export function createMeasureObject(mapInstance?: Map, style?: MeasureStyle): MeasureObject {
  return new MeasureObject(mapInstance || null, style);
}

export default MeasureObject; 