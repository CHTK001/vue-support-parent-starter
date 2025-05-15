/**
 * 标记点对象
 * @description 管理地图上的标记点
 */
import { Map as OlMap } from 'ol';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Text, Fill, Stroke, Circle } from 'ol/style';
import RegularShape from 'ol/style/RegularShape';
import Cluster from 'ol/source/Cluster';
import { fromLonLat } from 'ol/proj';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { Overlay } from 'ol';
import logger from './LogObject';
import { MarkerClusterMode, MarkerOptions, MarkerEventHandler, DataType, MarkerConfig } from '../types';
// 导入IconUtils工具类，用于处理图标样式
import IconUtils, { IconType } from '../utils/IconUtils';

// 标记点模块的日志前缀
const LOG_MODULE = 'Marker';

/**
 * 标记点对象类
 */
export class MarkerObject {
  // 地图实例
  private mapInstance: OlMap | null = null;
  // 标记点图层
  private markerLayer: VectorLayer<VectorSource> | null = null;
  // 标记点聚合图层
  private clusterLayer: VectorLayer<VectorSource> | null = null;
  // 标记点集合
  private markers = new Map<string, Feature>();
  // 标记点配置集合
  private markerOptions = new Map<string, MarkerOptions>();
  // 点击事件监听器
  private clickListener: EventsKey | null = null;
  // 点击回调
  private clickHandler: MarkerEventHandler | null = null;
  // popover叠加层集合
  private markerPopovers = new Map<string, Overlay>();
  // 当前显示的popover
  private currentPopover: string | null = null;
  // 全局标签显示状态
  private labelsVisible: boolean = true;
  // 全局标记点显示状态
  private markersVisible: boolean = true;
  // 标记点聚合模式状态
  private clusterMode: boolean = false;
  // 分组可见性状态（key为分组名称，value为是否可见）
  private groupVisibility = new Map<string, boolean>();
  // 动画相关
  private animationFrameId: number | null = null; // 动画帧ID
  private animationActive: boolean = false; // 动画是否激活
  // 默认标记点样式
  private defaultStyle = {
    scale: 1, // 固定为1，不放大
    anchor: [0.5, 1] as [number, number], // 使用中心点作为锚点
    offset: [0, 0] as [number, number],
    rotation: 0,
    textColor: '#333',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
    textFont: '14px Arial',
    textOffsetY: -20
  };
  // 默认图标URL
  private defaultIconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAqFJREFUWEftljtMFFEUhv8zmrU0DBuMhTQ7M2hQGyGa0BLfdqKtFkb27sZOW5dWrQy7oBa2RK2MIGrsLHw2KlF2BgssDAQuoZTIHLPDghN2HvcOBY1T7j3n/N953LOXsM0fbbM+tgSw+65baCSwfM2eyZqINoBZna4AdBiGcQzMewNhol/w/bcAf5alrooOjDJA+3D9KBM9AOFQogDjCzFfWSw771RAlACCrMm4qRJww4b9IZVqpAI0+rxjJzwt8abx6h9YafORCmCOeONgPp0FAEQTsmidSfJNBFAo/VQzeHesCKEii/ZQ3HkyQM17BnBcBheksB83Aps1dwDAo2gRGpfCOpsRwJ0D0LHZ2QD1LAjrU/j3fM074oM/RgjNS2Hv0QbID884vuFPtzrytBTO/qiAZq3+HaCuFmDf6FooF+pRPrEtyI/O9Pi+/yHCaUoK+2A0gPsVQMs8GIbRuzBYiKpO/Co2q94+EM/GlG6j/+vniXPA1ClL1k+tCqAylTM7cr/jeheeg4T+B+5yfmUXKt0regBr0z0G4GL8PebmjLT2PeTzUgr7hPYQBter6h4H4UWmJdR0YtDVJWHdzwSwdsfr7wHqzQqxCi4sC+dHZoD2av0SEz3MBsB3pHCuJ/mm/hc0q/AKoH4dCAa8HFHfXNGa3zJA26h7jnw81QIgHlwqOvfSfJQqsFYFbwzghBsRlqJJKaxTaeKNc2WAthGvj5jfKAX1jf7FcuG1kq2K0b9t590COHGoALothXVDNa5yBUIrdwJAXHmfS2FrPV60Adqr9QNMNAmgc1OWs8R8crHkfFPNXmsGwkHNqnsehOAxsvExBmTJfqIjnhkguBXhl3LKs2vLeyAugDniBRtSFq3Lupmv22vPQFahOL//AH8B63PcITqKfDEAAAAASUVORK5CYII=';

  // 标记点配置
  private config: MarkerConfig = {
    scaleWithZoom: true, // 默认图标大小受zoom影响
    groupIcon: {}, // 默认空的分组图标集合
    zoomFactor: 0.05, // 缩放系数降低为0.03，减少缩放影响
    minScale: 0.8, // 最小缩放比例调整为0.8
    maxScale: 1.2 // 最大缩放比例调整为1.2，防止图标过大
  };

  /**
   * 构造函数
   * @param mapInstance 地图实例
   */
  constructor(mapInstance: OlMap | null = null) {
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    
    this.log('debug', '标记点对象已创建');
  }

  /**
   * 记录标记点模块日志
   * @param level 日志级别
   * @param message 日志消息
   * @param args 附加参数
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    const prefixedMessage = `[${LOG_MODULE}] ${message}`;
    switch (level) {
      case 'debug':
        logger.debug(prefixedMessage, ...args);
        break;
      case 'info':
        logger.info(prefixedMessage, ...args);
        break;
      case 'warn':
        logger.warn(prefixedMessage, ...args);
        break;
      case 'error':
        logger.error(prefixedMessage, ...args);
        break;
    }
  }

  /**
   * 设置地图实例
   * @param mapInstance 地图实例
   */
  public setMapInstance(mapInstance: OlMap): void {
    this.mapInstance = mapInstance;
    this.initializeLayers();
    this.setupClickListener();
    
    // 设置缩放变化监听
    if (this.config.scaleWithZoom) {
      this.mapInstance.getView().on('change:resolution', () => {
        // 只有在设置了根据zoom缩放且有标记点时才更新
        if (this.config.scaleWithZoom && this.markers.size > 0) {
          // 更新所有标记点的样式
          this.markers.forEach((feature, id) => {
            const options = this.markerOptions.get(id);
            if (options) {
              // 应用新样式，支持Style数组
              feature.setStyle(this.createMarkerStyle(options));
            }
          });
          
          this.log('debug', '缩放级别变化，已更新标记点样式');
        }
      });
    }
    
    this.log('debug', '已设置地图实例');
  }

  /**
   * 初始化图层
   */
  private initializeLayers(): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法初始化图层');
      return;
    }

    // 创建普通标记点图层
    const markerSource = new VectorSource();
    this.markerLayer = new VectorLayer({
      source: markerSource,
      zIndex: 100,
      properties: {
        name: 'marker-layer'
      }
    });

    // 从地图元素上获取聚合配置
    let clusterDistance = 80; // 默认聚合距离改为与默认配置一致的80像素
    const mapElement = this.mapInstance.getTargetElement();
    if (mapElement && mapElement['clusterConfig'] && 
        typeof mapElement['clusterConfig'].maxClusterRadius === 'number') {
      clusterDistance = mapElement['clusterConfig'].maxClusterRadius;
      this.log('debug', `从配置获取聚合距离: ${clusterDistance} 像素`);
    }

    // 创建聚合标记点图层
    const clusterSource = new Cluster({
      distance: clusterDistance,
      source: new VectorSource()
    });
    this.clusterLayer = new VectorLayer({
      source: clusterSource,
      zIndex: 100,
      properties: {
        name: 'cluster-layer'
      },
      style: this.createClusterStyle.bind(this),
      visible: false // 默认隐藏聚合图层
    });

    // 添加图层到地图
    this.mapInstance.addLayer(this.markerLayer);
    this.mapInstance.addLayer(this.clusterLayer);
    
    // 如果聚合模式已启用，启动动画
    if (this.clusterMode) {
      this.startAnimation();
    }
    
    this.log('debug', '标记点图层已初始化，普通图层可见，聚合图层隐藏，聚合距离：' + clusterDistance + '像素');
  }

  /**
   * 设置点击事件监听
   */
  private setupClickListener(): void {
    // 如果地图实例未设置，则无法设置点击监听
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法设置点击监听');
      return;
    }

    // 清除现有的点击监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
      this.log('debug', '已清除旧的点击监听器');
    }
    
    // 添加鼠标移动事件处理，用于在hover到marker上时改变鼠标样式
    this.mapInstance.on('pointermove', (evt) => {
      const hit = this.mapInstance!.hasFeatureAtPixel(evt.pixel, {
        hitTolerance: 30, // 增加点击容差到30像素
        layerFilter: (layer) => {
          // 只对标记点图层生效
          return layer === this.markerLayer || layer === this.clusterLayer;
        }
      });
      // 改变鼠标光标样式
      this.mapInstance!.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
    
    // 添加新的点击监听器
    this.clickListener = this.mapInstance.on('click', (event) => {
      const hit = this.mapInstance!.hasFeatureAtPixel(event.pixel, {
        hitTolerance: 30, // 增加点击容差到30像素
        layerFilter: (layer) => {
          return layer === this.markerLayer || layer === this.clusterLayer;
        }
      });
      // 如果没有点击到要素，直接返回
      if (!hit) {
        return;
      }
      
      // 使用forEachFeatureAtPixel处理点击的具体要素
      let hasHandledClick = false;
      
      this.mapInstance!.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          // 确保只处理marker和cluster图层
          if (layer !== this.markerLayer && layer !== this.clusterLayer) {
            return;
          }
          
          // 处理聚合点
          if (feature.get('features')) {
            const clusterFeatures = feature.get('features');
            if (clusterFeatures.length === 1) {
              // 只有一个点时，当作普通点处理
              this.handleMarkerClick(clusterFeatures[0], event.coordinate);
              hasHandledClick = true;
            } else if (clusterFeatures.length > 1) {
              // 多个点的聚合，只记录点击事件
              this.log('debug', `点击了聚合点，包含 ${clusterFeatures.length} 个标记点`);
              hasHandledClick = true;
            }
          } else {
            // 处理普通点
            this.handleMarkerClick(feature as any, event.coordinate);
            hasHandledClick = true;
          }
          
          // 返回true表示找到了要处理的要素，可以停止遍历
          return true;
        },
        {
          hitTolerance: 30, // 增加点击容差到30像素
          layerFilter: (layer) => {
            // 只对标记点图层生效
            return layer === this.markerLayer || layer === this.clusterLayer;
          }
        }
      );
      
      this.log('debug', `点击事件处理结果: ${hasHandledClick ? '处理了标记点点击' : '未处理任何标记点'}`);
    });
    
    this.log('debug', '标记点点击监听已设置，增加了点击容差和改进的点击处理逻辑');
  }
  
  /**
   * 处理标记点的点击事件
   * @param feature 被点击的要素
   * @param coordinate 点击坐标
   */
  private handleMarkerClick(feature: Feature, coordinate: number[]): void {
    const markerId = feature.get('id');
    if (!markerId || !this.markerOptions.has(markerId)) {
      return;
    }
    
    const options = this.markerOptions.get(markerId)!;
    
    // 只有在全局标签可见状态为true时，才处理popover显示/隐藏
    if (this.labelsVisible && (options.title || options.template) && options.usePopover !== false) {
      // 检查popover是否已经打开
      if (options.isPopoverOpen) {
        // 如果已经打开，则隐藏
        this.hideCurrentPopover();
      } else {
        // 如果未打开，则显示
        this.showMarkerPopover(markerId);
      }
    }
    
    // 如果是可点击的，触发点击回调
    if (options.clickable && this.clickHandler) {
      this.log('debug', `点击了标记点: ${markerId}`);
      this.clickHandler(options.position, options || {} as MarkerOptions);
    }
  }

  /**
   * 创建聚合点样式
   * @param feature 要素
   * @returns 样式
   */
  private createClusterStyle(feature: Feature): Style | Style[] {
    const features = feature.get('features');
    
    if (!features) return new Style();
    
    const size = features.length;
    
    // 单个点使用原始样式
    if (size === 1) {
      const markerId = features[0].get('id');
      if (markerId && this.markerOptions.has(markerId)) {
        return features[0].getStyle() as Style;
      }
      return new Style();
    }
    
    // 获取聚合配置（如果有）
    let color = '#1890ff'; // 默认颜色
    let borderColor = '#ffffff'; // 默认边框颜色
    let showCount = true; // 默认显示数量
    let useWeightAsSize = true; // 根据数量显示大小
    let minClusterSize = 24; // 最小聚合数量
    let maxClusterSize = 60; // 最大聚合点尺寸
    let defaultSize = 40; // 默认聚合点大小
    let enablePulse = true; // 是否启用脉冲效果
    let enableAnimation = true; // 是否启用持续动画
    let pulseDuration = 3000; // 脉冲动画持续时间，3000ms适合观察
    let pulseScale = 1.6; // 减小脉冲缩放比例，从3.0降至1.6
    let pulseColor = color; // 脉冲颜色
    let pulseOpacity = 0.7; // 降低脉冲透明度初始值
    let pulseFrequency = 1; // 每秒扩散次数
    let pulseStartSize = 0.9; // 提高脉冲起始大小比例，使扩散更有节制
    let pulseLayers = 3; // 减少脉冲效果层数，从5降至3
    let pulseDecay = 1.5; // 增大透明度衰减指数使效果更快消失
    let zoomToBoundsOnClick = true; // 默认自动缩放到聚合范围
    let colorRanges: { value: number; color: string }[] = []; // 颜色范围
    
    // 获取工具栏对象，如果存在
    // 从外部获取配置，这里只是查找链接到的工具栏对象
    // 如果工具栏对象存在，获取聚合配置
    const mapElement = this.mapInstance?.getTargetElement();
    if (mapElement) {
      // 尝试获取挂载在地图元素上的工具栏对象
      const toolbarConfig = mapElement['clusterConfig'];
      if (toolbarConfig) {
        color = toolbarConfig.color || color;
        borderColor = toolbarConfig.borderColor || borderColor;
        showCount = toolbarConfig.showCount !== undefined ? toolbarConfig.showCount : showCount;
        useWeightAsSize = toolbarConfig.useWeightAsSize !== undefined ? toolbarConfig.useWeightAsSize : useWeightAsSize;
        minClusterSize = toolbarConfig.minClusterSize || minClusterSize;
        maxClusterSize = toolbarConfig.maxClusterSize || maxClusterSize;
        defaultSize = toolbarConfig.defaultSize || defaultSize;
        enablePulse = toolbarConfig.enablePulse !== undefined ? toolbarConfig.enablePulse : enablePulse;
        enableAnimation = toolbarConfig.enableAnimation !== undefined ? toolbarConfig.enableAnimation : enableAnimation;
        pulseDuration = toolbarConfig.pulseDuration || pulseDuration;
        pulseScale = toolbarConfig.pulseScale || pulseScale;
        pulseColor = toolbarConfig.pulseColor || color;
        pulseOpacity = toolbarConfig.pulseOpacity !== undefined ? toolbarConfig.pulseOpacity : pulseOpacity;
        pulseFrequency = toolbarConfig.pulseFrequency || pulseFrequency;
        pulseStartSize = toolbarConfig.pulseStartSize || pulseStartSize;
        pulseLayers = toolbarConfig.pulseLayers || pulseLayers;
        pulseDecay = toolbarConfig.pulseDecay || pulseDecay;
        zoomToBoundsOnClick = toolbarConfig.zoomToBoundsOnClick !== undefined ? toolbarConfig.zoomToBoundsOnClick : zoomToBoundsOnClick;
        colorRanges = toolbarConfig.colorRanges || [];
      }
    }
    
    // 根据聚合点数量确定颜色
    if (colorRanges && colorRanges.length > 0) {
      // 按value降序排序
      const sortedRanges = [...colorRanges].sort((a, b) => b.value - a.value);
      
      // 找到第一个小于等于当前size的范围
      for (const range of sortedRanges) {
        if (size >= range.value) {
          color = range.color;
          break;
        }
      }
    }
    
    // 计算聚合点大小
    let pointSize = defaultSize;
    if (useWeightAsSize && size > 1) {
      // 根据数量计算大小，限制在最大尺寸范围内
      const sizeScale = Math.min(1, Math.log(size) / Math.log(100)); // 使用对数缩放
      pointSize = minClusterSize + sizeScale * (maxClusterSize - minClusterSize);
    }
    
    // 创建涟漪层样式数组
    const styles: Style[] = [];
    
    // 如果启用涟漪效果，创建多个圆圈样式形成涟漪效果
    if (enablePulse) {
      // 获取当前时间的毫秒数，用于计算动画状态
      const time = Date.now() % pulseDuration;
      const animationProgress = time / pulseDuration; // 0-1之间的值
      
      // 确保层数在有效范围内
      pulseLayers = Math.max(2, Math.min(3, pulseLayers));
      
      // 创建涟漪扩散效果，降低迭代次数，使动画更加微妙
      for (let i = 0; i < pulseLayers; i++) {
        // 计算每个涟漪的相位偏移，形成连续效果
        const phaseOffset = i / pulseLayers;
        let progress = (animationProgress + phaseOffset) % 1;
        
        // 使用缓动函数使动画更加平滑
        const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
        
        // 根据动画进度计算当前大小，确保扩散范围更小
        const startSize = pointSize * pulseStartSize;
        const maxSize = startSize * pulseScale;
        const currentSize = startSize + (maxSize - startSize) * easedProgress;
        
        // 修改透明度曲线，使扩散更加快速消失
        const opacityCurve = Math.pow(Math.sin(progress * Math.PI), pulseDecay);
        const currentOpacity = Math.max(0, pulseOpacity * opacityCurve);
        
        if (currentOpacity > 0.05) { // 提高透明度阈值，减少低透明度的圆圈
          // 创建涟漪圆圈样式
          styles.push(
            new Style({
              image: new RegularShape({
                radius: currentSize / 2,
                radius2: currentSize / 2,
                points: 32, // 适当减少点数
                fill: new Fill({
                  color: this.colorWithOpacity(pulseColor, currentOpacity)
                }),
                stroke: new Stroke({
                  color: this.colorWithOpacity(pulseColor, currentOpacity * 0.9),
                  width: 1.0 // 减小边框宽度
                })
              }),
              zIndex: 99 + i // 涟漪层级低于主圆圈
            })
          );
        }
      }
      
      // 添加呼吸效果（脉动效果），保持更微妙的缩放
      const breathProgress = Math.sin(animationProgress * Math.PI * 2 * pulseFrequency); 
      const breathScale = 1 + Math.abs(breathProgress) * 0.08; // 减小呼吸效果的缩放范围
      
      // 创建呼吸效果的圆圈
      styles.push(
        new Style({
          image: new RegularShape({
            radius: (pointSize * breathScale) / 2,
            radius2: (pointSize * breathScale) / 2,
            points: 24,
            fill: new Fill({
              color: this.colorWithOpacity(color, 0.7)
            }),
            stroke: new Stroke({
              color: this.colorWithOpacity(borderColor, 0.8),
              width: 1.5 + breathProgress * 0.3 // 减小边框宽度变化范围
            })
          }),
          zIndex: 100 // 呼吸效果的层级在主圆圈下方
        })
      );
      
      // 只有在启用持续动画时才请求动画帧
      if (enableAnimation && this.mapInstance) {
        // 请求下一帧重绘，实现动画效果
        window.requestAnimationFrame(() => {
          if (this.mapInstance) this.mapInstance.render();
        });
      }
    }
    
    // 创建主聚合点样式
    styles.push(
      new Style({
        image: new RegularShape({
          radius: pointSize / 2,
          radius2: pointSize / 2,
          points: 24, // 适当减少点数
          fill: new Fill({
            color: this.colorWithOpacity(color, 0.85) // 保持不透明度
          }),
          stroke: new Stroke({
            color: borderColor,
            width: 2 // 减小边框宽度
          })
        }),
        text: showCount ? new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff'
          }),
          font: 'bold 13px Arial',
          offsetY: 1
        }) : undefined,
        zIndex: 101 + size // 主圆圈层级最高
      })
    );
    
    return styles;
  }
  
  /**
   * 添加透明度到颜色值
   * @param color 颜色（十六进制或RGB格式）
   * @param opacity 透明度 (0-1)
   * @returns 带透明度的RGBA颜色字符串
   */
  private colorWithOpacity(color: string, opacity: number): string {
    // 处理十六进制颜色
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 处理rgb颜色
    if (color.startsWith('rgb(')) {
      const rgb = color.slice(4, -1).split(',').map(x => parseInt(x.trim(), 10));
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
    }
    
    // 处理rgba颜色
    if (color.startsWith('rgba(')) {
      // 提取当前rgba值
      const rgba = color.slice(5, -1).split(',');
      // 替换最后的透明度值
      rgba[3] = opacity.toString();
      return `rgba(${rgba.join(',')})`;
    }
    
    // 如果是其他格式，返回带透明度的默认颜色
    return `rgba(24, 144, 255, ${opacity})`;
  }

  /**
   * 设置聚合模式
   * @param enabled 是否启用聚合模式
   */
  public setClusterMode(enabled: boolean): void {
    // 如果模式已经相同，则不进行任何操作
    if (this.clusterMode === enabled) {
      this.log('debug', `聚合模式已经${enabled ? '启用' : '禁用'}，无需切换`);
      return;
    }
    
    // 更新聚合模式状态
    this.clusterMode = enabled;
    
    // 如果图层未初始化，则无法切换模式
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('warn', '标记点图层未初始化，无法切换聚合模式');
      return;
    }

    // 获取聚合图层的源
    const clusterSource = this.clusterLayer.getSource() as Cluster;
    
    // 在启用聚合模式时应用配置的聚合距离
    if (enabled) {
      // 从地图元素获取聚合配置
      let clusterDistance = 80; // 默认值
      const mapElement = this.mapInstance?.getTargetElement();
      if (mapElement && mapElement['clusterConfig'] && 
          typeof mapElement['clusterConfig'].maxClusterRadius === 'number') {
        clusterDistance = mapElement['clusterConfig'].maxClusterRadius;
        this.log('debug', `切换聚合模式时应用配置的聚合距离: ${clusterDistance} 像素`);
      }
      
      // 应用聚合距离
      clusterSource.setDistance(clusterDistance);
      
      // 启动聚合点动画
      this.startAnimation();
    } else {
      // 停止聚合点动画
      this.stopAnimation();
    }
    
    // 获取普通图层的源
    const markerSource = this.markerLayer.getSource() as VectorSource;

    // 处理所有标记点
    this.markerOptions.forEach((options, id) => {
      const feature = this.markers.get(id);
      if (!feature) return;

      // 首先从当前图层移除
      markerSource.removeFeature(feature);
      clusterSource.getSource()!.removeFeature(feature);

      // 根据聚合模式和标记点设置决定添加到哪个图层
      const shouldAddToCluster = (options.clusterMode === MarkerClusterMode.CLUSTER || options.clusterMode === MarkerClusterMode.BOTH);
      const shouldAddToMarker = options.clusterMode === MarkerClusterMode.NONE || options.clusterMode === MarkerClusterMode.BOTH;
      // 添加到相应图层
      if (shouldAddToCluster) {
        // 添加到聚合图层
        clusterSource.getSource()!.addFeature(feature);
        this.log('debug', `标记点 "${id}" 已添加到聚合图层`);
      }
      
      if (shouldAddToMarker) {
        // 添加到普通图层
        markerSource.addFeature(feature);
        this.log('debug', `标记点 "${id}" 已添加到普通图层`);
      }

      // 不再需要修改标记点的聚合模式，让其保持不变
    });

    // 切换图层可见性
    if (enabled) {
      this.markerLayer.setVisible(false);  // 隐藏普通标记点图层
      this.clusterLayer.setVisible(true);  // 显示聚合图层
      this.log('debug', '已隐藏普通标记点图层，显示聚合图层');
    } else {
      this.markerLayer.setVisible(true);   // 显示普通标记点图层
      this.clusterLayer.setVisible(false); // 隐藏聚合图层
      this.log('debug', '已显示普通标记点图层，隐藏聚合图层');
    }

    // 当聚合模式改变时，重新设置点击监听器
    this.setupClickListener();

    this.log('info', `标记点聚合模式已${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 启动聚合点动画循环
   * 即使地图静止不动，也会持续更新动画
   */
  private startAnimation(): void {
    // 如果动画已经在运行，不需要重新启动
    if (this.animationActive) return;
    
    // 确保地图实例存在
    if (!this.mapInstance) {
      this.log('warn', '地图实例不存在，无法启动动画');
      return;
    }
    
    // 检查是否启用了动画设置
    let enableAnimation = true; // 默认启用
    const mapElement = this.mapInstance.getTargetElement();
    if (mapElement && mapElement['clusterConfig']) {
      const config = mapElement['clusterConfig'];
      // 如果明确设置为false，则不启用动画
      if (config.enableAnimation === false) {
        this.log('debug', '配置设置为不启用持续动画，不启动动画循环');
        return;
      }
    }
    
    this.animationActive = true;
    this.log('debug', '启动聚合点动画循环');
    
    // 定义动画帧函数
    const animate = () => {
      // 如果动画不再活跃，停止循环
      if (!this.animationActive) {
        this.log('debug', '动画已停止，退出动画循环');
        return;
      }
      
      // 如果地图实例不存在，停止循环
      if (!this.mapInstance) {
        this.log('warn', '动画循环中发现地图实例不存在，停止动画');
        this.animationActive = false;
        return;
      }
      
      try {
        // 强制地图重绘以更新动画
        this.mapInstance.render();
        
        // 如果聚合图层存在，额外触发其changed事件，确保动画更新
        if (this.clusterLayer && this.clusterLayer.getVisible()) {
          this.clusterLayer.changed();
        }
      } catch (error) {
        this.log('error', '动画渲染过程中发生错误');
      }
      
      // 请求下一帧
      this.animationFrameId = window.requestAnimationFrame(animate);
    };
    
    // 启动动画循环
    this.animationFrameId = window.requestAnimationFrame(animate);
  }
  
  /**
   * 停止聚合点动画循环
   */
  private stopAnimation(): void {
    // 标记动画为非活跃
    this.animationActive = false;
    
    // 取消动画帧请求
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.log('debug', '停止聚合点动画循环');
    }
  }

  /**
   * 获取聚合模式状态
   * @returns 聚合模式是否启用
   */
  public getClusterMode(): boolean {
    return this.clusterMode;
  }

  /**
   * 添加标记点
   * @param options 标记点配置选项
   * @returns 标记点ID
   */
  public addMarker(options: MarkerOptions): string {
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('error', '标记点图层未初始化，无法添加标记点');
      return '';
    }

    // 如果未指定ID，生成随机ID
    const id = options.id || `marker-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    options.id = id;
    
    // 设置默认值
    options.visible = options.visible !== undefined ? options.visible : true;
    options.clickable = options.clickable !== undefined ? options.clickable : true;
    
    // 在聚合模式下，自动设置新添加标记的聚合模式
    if (this.clusterMode && options.clusterMode === undefined) {
      options.clusterMode = MarkerClusterMode.CLUSTER;
      this.log('debug', `标记点 "${id}" 在聚合模式下自动设置为可聚合`);
    } else {
      options.clusterMode = options.clusterMode || MarkerClusterMode.BOTH;
    }
    
    options.usePopover = options.usePopover !== undefined ? options.usePopover : true;
    options.showPopover = options.showPopover !== undefined ? options.showPopover : false;
    options.isPopoverOpen = false; // 初始化时popover为关闭状态
    options.iconType = options.iconType || 'default';
    
    // 确保style中scale为1，anchor为中心点，以便整个图标接收点击事件
    if (options.style) {
      options.style.scale = 1; // 强制设置scale为1
    }
    
    options.style = { ...this.defaultStyle, ...options.style };
    options.dataType = DataType.MARKER;

    // 记录当前缩放级别作为此标记点的基准缩放级别
    if (this.mapInstance && this.config.scaleWithZoom) {
      const currentZoom = this.mapInstance.getView().getZoom() || 10;
      // 将当前缩放级别保存到标记点数据中
      options.data = options.data || {};
      options.data._baseZoom = currentZoom;
      this.log('debug', `标记点 "${id}" 设置基准缩放级别为当前缩放级别: ${currentZoom}`);
    }

    // 处理分组可见性
    if (options.group) {
      // 如果该分组已经在缓存中且状态为不可见，则将该标记点也设置为不可见
      if (this.groupVisibility.has(options.group) && !this.groupVisibility.get(options.group)) {
        options.visible = false;
        this.log('debug', `标记点 "${id}" 所在分组 "${options.group}" 不可见，自动设置为不可见`);
      }
    }
    
    // 检查已存在的标记点
    if (this.markers.has(id)) {
      this.log('warn', `标记点ID "${id}" 已存在，将移除旧的标记点`);
      this.removeMarker(id);
    }
    
    // 转换坐标
    const coordinates = fromLonLat(options.position);
    
    // 创建标记点要素
    const marker = new Feature({
      geometry: new Point(coordinates),
      id: id,
    });
    marker.set('dataType', DataType.MARKER);
    marker.set('createdAt', new Date().toISOString());
    marker.set('data', options);
    // 根据全局标记点显示状态决定是否显示
    if (this.markersVisible) {
      // 设置样式
      const style = this.createMarkerStyle(options);
      marker.setStyle(style);
    } else {
      // 如果全局标记点不可见，则不设置样式
      marker.setStyle(new Style({}));
      options.visible = false;
    }
    
    // 保存标记点和选项
    this.markers.set(id, marker);
    this.markerOptions.set(id, { ...options });
    
    // 根据当前的聚合模式和标记点的聚合模式添加到相应图层
    const shouldAddToCluster =  (options.clusterMode === MarkerClusterMode.CLUSTER || options.clusterMode === MarkerClusterMode.BOTH);
    const shouldAddToMarker =  options.clusterMode === MarkerClusterMode.NONE || options.clusterMode === MarkerClusterMode.BOTH;
    
    if (shouldAddToCluster) {
      // 在聚合模式下，添加到聚合图层
      (this.clusterLayer.getSource() as Cluster).getSource()!.addFeature(marker);
      this.log('debug', `标记点 "${id}" 已添加到聚合图层`);
    }
    
    if (shouldAddToMarker) {
      // 非聚合模式或BOTH模式，添加到普通图层
      (this.markerLayer.getSource() as VectorSource).addFeature(marker);
      this.log('debug', `标记点 "${id}" 已添加到普通图层`);
    }
    
    // 设置可见性
    if (!options.visible || !this.markersVisible) {
      this.hideMarker(id);
    }
    
    // 如果设置了默认显示popover且有标题，且全局标签可见状态为true，且全局标记点可见状态为true，立即显示popover
    if (this.labelsVisible && this.markersVisible && options.showPopover && options.usePopover && (options.title || options.template) && options.visible) {
      this.showMarkerPopover(id);
    }
    
    // 如果没有指定icon但有group，尝试从groupIcon获取图标
    if (!options.icon && options.group && this.config.groupIcon) {
      const groupIcon = this.config.groupIcon[options.group];
      if (groupIcon) {
        options.icon = groupIcon;
        this.log('debug', `从分组 "${options.group}" 获取图标: ${groupIcon}`);
      }
    }
    
    this.log('info', `添加标记点 "${id}" 成功，位置: [${options.position[0]}, ${options.position[1]}]`);
    
    return id;
  }

  /**
   * 创建标记点样式
   * @param options 标记点配置选项
   * @returns 图标样式
   */
  private createMarkerStyle(options: MarkerOptions): Style | Style[] {
    const styleOptions = options.style || this.defaultStyle;
    let iconUrl = this.defaultIconUrl;
    
    // 根据不同的图标类型处理图标
    if (options.icon) {
      switch (options.iconType) {
        case 'url':
          // 直接使用URL
          iconUrl = options.icon;
          break;
        case 'svg':
          // 将SVG字符串转换为Data URL
          iconUrl = 'data:image/svg+xml;base64,' + btoa(options.icon);
          break;
        case 'base64':
          // 已经是Data URL格式，直接使用
          iconUrl = options.icon;
          break;
        case 'default':
        default:
          // 如果提供了icon但类型是default，优先使用提供的icon
          iconUrl = options.icon || this.defaultIconUrl;
          break;
      }
    } else {
      iconUrl = this.defaultIconUrl;
    }
    
    // 检查是否应该根据zoom级别缩放图标
    if (this.config.scaleWithZoom && this.mapInstance) {
      const zoom = this.mapInstance.getView().getZoom() || 0;
      
      // 获取标记点自己的基准缩放级别
      const markerBaseZoom = options.data && options.data._baseZoom ? options.data._baseZoom : undefined;
      
      // 使用独立方法计算缩放因子，传入标记点自己的基准缩放级别
      const limitedFactor = this.calculateScaleFactor(zoom, markerBaseZoom);
      
      // 简化：直接使用计算出的缩放因子作为样式的缩放值
      styleOptions.scale = limitedFactor;
      
      this.log('debug', `应用zoom缩放: zoom=${zoom}, baseZoom=${markerBaseZoom}, factor=${limitedFactor}, scale=${styleOptions.scale}`);
    } else {
      // 不根据zoom缩放，使用默认缩放值
      styleOptions.scale = this.defaultStyle.scale;
    }
    
    // 获取图标锚点 - 保持锚点始终为底部中心点，确保定位准确
    const anchor = [0.5, 1]; // 固定锚点为图标底部中心
    
    // 使用IconUtils创建适合的样式
    if (options.iconType === 'url' && options.icon && (options.icon.startsWith('http') || options.icon.startsWith('https'))) {
      // 对于远程URL类型的图标，使用IconUtils的Photo样式
      const size = [32, 32]; // 默认大小
      
      // 创建Photo样式所需选项
      const photoOptions = {
        kind: options.data?.photoKind || 'circle',
        stroke: options.data?.photoStroke !== undefined ? options.data?.photoStroke : 2,
        strokeColor: options.data?.photoStrokeColor || '#ffffff',
        shadow: options.data?.photoShadow !== false,
        shadowBlur: options.data?.photoShadowBlur || 7,
        shadowColor: options.data?.photoShadowColor || 'rgba(0,0,0,0.5)',
        crop: options.data?.photoCrop !== false,
        background: options.data?.photoBackground
      };
      
      this.log('debug', `使用Photo样式渲染URL图标: ${options.icon}`, { photoOptions });
      
      // 使用IconUtils创建Photo样式
      return IconUtils.createSafeIconStyle(
        options.icon,
        styleOptions.scale || 1,
        size,
        '#1890ff', // 默认回退颜色
        photoOptions
      );
    } else {
      // 对于其他类型的图标，保持原有逻辑
      // 创建标准图标样式
      const iconImage = new Icon({
        src: iconUrl,
        scale: styleOptions.scale,
        anchor: anchor,
        anchorXUnits: 'fraction', // 水平锚点以分数表示（0.5表示中心）
        anchorYUnits: 'fraction', // 修改为fraction，使垂直锚点位置与缩放无关
        offset: [0, 0], // 不使用偏移，确保位置准确
        rotation: styleOptions.rotation || 0
      });
      
      // 创建图标样式
      const iconStyle = new Style({
        image: iconImage,
        zIndex: options.zIndex || 1
      });
      
      return iconStyle;
    }
  }

  /**
   * 更新标记点
   * @param id 标记点ID
   * @param options 标记点配置选项
   * @returns 是否更新成功
   */
  public updateMarker(id: string, options: Partial<MarkerOptions>): boolean {
    if (!this.markers.has(id)) {
      this.log('warn', `标记点 "${id}" 不存在，无法更新`);
      return false;
    }
    
    const marker = this.markers.get(id)!;
    const oldOptions = this.markerOptions.get(id)!;
    
    // 如果更新了分组，需要处理分组可见性
    if (options.group !== undefined && options.group !== oldOptions.group) {
      // 记录旧分组
      const oldGroup = oldOptions.group;
      
      // 更新分组
      oldOptions.group = options.group;
      
      this.log('debug', `标记点 "${id}" 分组从 "${oldGroup || '无'}" 更新为 "${options.group || '无'}"`);
      
      // 如果新分组已经在缓存中且状态为不可见，则强制将该标记点设置为不可见
      if (options.group && this.groupVisibility.has(options.group) && !this.groupVisibility.get(options.group)) {
        options.visible = false;
        this.log('debug', `标记点 "${id}" 新分组 "${options.group}" 不可见，强制设置为不可见`);
      }
    }
    
    // 确保style中scale为1，anchor为中心点
    if (options.style) {
      options.style.scale = 1; // 强制设置scale为1
    }
    
    const newOptions = { ...oldOptions, ...options };
    
    // 如果位置变化，更新位置
    if (options.position) {
      const coordinates = fromLonLat(options.position);
      const geometry = marker.getGeometry();
      if (geometry instanceof Point) {
        geometry.setCoordinates(coordinates);
      }
      
      // 如果启用了缩放功能，更新基准缩放级别为当前级别
      if (this.config.scaleWithZoom && this.mapInstance) {
        const currentZoom = this.mapInstance.getView().getZoom()  || 10;
        // 更新基准缩放级别
        newOptions.data = newOptions.data || {};
        newOptions.data._baseZoom = currentZoom;
        this.log('debug', `标记点 "${id}" 位置更新，重置基准缩放级别为当前缩放级别: ${currentZoom}`);
      }
      
      this.log('debug', `标记点 "${id}" 位置已更新为 [${options.position[0]}, ${options.position[1]}]`);
    }
    
    // 聚合模式变化，需要从一个图层移到另一个图层
    if (options.clusterMode !== undefined && options.clusterMode !== oldOptions.clusterMode) {
      // 获取图层源
      const markerSource = this.markerLayer!.getSource() as VectorSource;
      const clusterSource = this.clusterLayer!.getSource() as Cluster;
      
      // 从所有图层移除
      markerSource.removeFeature(marker);
      clusterSource.getSource()!.removeFeature(marker);
      
      // 根据新的聚合模式添加到相应图层
      const shouldAddToCluster =  (options.clusterMode === MarkerClusterMode.CLUSTER || options.clusterMode === MarkerClusterMode.BOTH);
      const shouldAddToMarker =  options.clusterMode === MarkerClusterMode.NONE || options.clusterMode === MarkerClusterMode.BOTH;
      options.dataType = DataType.MARKER;
      if (shouldAddToCluster) {
        clusterSource.getSource()!.addFeature(marker);
        this.log('debug', `标记点 "${id}" 已添加到聚合图层`);
      }
      
      if (shouldAddToMarker) {
        markerSource.addFeature(marker);
        this.log('debug', `标记点 "${id}" 已添加到普通图层`);
      }
    }
    
    // 更新样式
    marker.setStyle(this.createMarkerStyle(newOptions));
    
    // 更新保存的配置
    this.markerOptions.set(id, newOptions);
    
    // 处理可见性
    if (options.visible !== undefined) {
      if (options.visible) {
        marker.setStyle(this.createMarkerStyle(newOptions));
      } else {
        marker.setStyle(new Style({})); // 隐藏标记点
      }
    }
    
    // 处理popover显示状态，只有在全局标签可见状态为true时才显示
    if (options.showPopover !== undefined) {
      if (this.labelsVisible && options.showPopover && newOptions.usePopover && (newOptions.title || newOptions.template) && newOptions.visible) {
        // 显示popover
        this.showMarkerPopover(id);
      } else if (!options.showPopover && this.currentPopover === id) {
        // 隐藏popover
        this.hideCurrentPopover();
      }
    }
    
    this.log('info', `标记点 "${id}" 已更新`);
    return true;
  }

  /**
   * 获取标记点
   * @param id 标记点ID
   * @returns 标记点配置选项，不存在则返回null
   */
  public getMarker(id: string): MarkerOptions | null {
    if (!this.markerOptions.has(id)) {
      this.log('warn', `标记点 "${id}" 不存在`);
      return null;
    }
    
    return { ...this.markerOptions.get(id)! };
  }

  /**
   * 获取所有标记点
   * @returns 所有标记点配置
   */
  public getAllMarkers(): MarkerOptions[] {
    return Array.from(this.markerOptions.values()).map(option => Object.assign({}, option));
  }

  /**
   * 隐藏标记点
   * @param id 标记点ID
   * @returns 是否操作成功
   */
  public hideMarker(id: string): boolean {
    if (!this.markers.has(id)) {
      this.log('warn', `标记点 "${id}" 不存在，无法隐藏`);
      return false;
    }
    
    const marker = this.markers.get(id)!;
    marker.setStyle(new Style({})); // 设置为undefined会隐藏标记点
    
    // 更新配置中的可见性
    const options = this.markerOptions.get(id)!;
    options.visible = false;
    this.markerOptions.set(id, options);
    
    // 如果当前显示的popover属于此标记点，则隐藏
    if (this.currentPopover === id) {
      this.hideCurrentPopover();
    }
    
    this.log('debug', `标记点 "${id}" 已隐藏`);
    return true;
  }

  /**
   * 显示标记点
   * @param id 标记点ID
   * @returns 是否操作成功
   */
  public showMarker(id: string): boolean {
    if (!this.markers.has(id)) {
      this.log('warn', `标记点 "${id}" 不存在，无法显示`);
      return false;
    }
    
    // 如果全局标记点不可见，则不执行显示操作
    if (!this.markersVisible) {
      this.log('debug', `全局标记点不可见状态，不执行显示标记点 "${id}" 操作`);
      return false;
    }
    
    const marker = this.markers.get(id)!;
    const options = this.markerOptions.get(id)!;
    
    // 恢复样式
    marker.setStyle(this.createMarkerStyle(options));
    
    // 更新配置中的可见性
    options.visible = true;
    this.markerOptions.set(id, options);
    
    // 如果标记点设置了默认显示popover，且全局标签可见状态为true，则显示popover
    if (this.labelsVisible && options.showPopover && options.usePopover && options.title) {
      this.showMarkerPopover(id);
    }
    
    this.log('debug', `标记点 "${id}" 已显示`);
    return true;
  }

  /**
   * 删除标记点
   * @param id 标记点ID
   * @returns 是否删除成功
   */
  public removeMarker(id: string): boolean {
    if (!this.markers.has(id)) {
      this.log('warn', `标记点 "${id}" 不存在，无法删除`);
      return false;
    }
    
    const marker = this.markers.get(id)!;
    const options = this.markerOptions.get(id)!;
    
    // 从图层中移除
    if (this.markerLayer) {
      (this.markerLayer.getSource() as VectorSource).removeFeature(marker);
    }
    
    if (this.clusterLayer) {
      (this.clusterLayer.getSource() as Cluster).getSource()!.removeFeature(marker);
    }
    
    // 如果有popover，移除它
    if (this.currentPopover === id) {
      this.hideCurrentPopover();
    }
    
    // 从集合中移除
    this.markers.delete(id);
    this.markerOptions.delete(id);
    
    this.log('info', `标记点 "${id}" 已被删除`);
    return true;
  }

  /**
   * 清除所有标记点
   */
  public clearMarkers(): void {
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('warn', '标记点图层未初始化，无法清除标记点');
      return;
    }
    
    (this.markerLayer.getSource() as VectorSource).clear();
    (this.clusterLayer.getSource() as Cluster).getSource()!.clear();
    
    this.markers.clear();
    this.markerOptions.clear();
    
    // 清除所有popover
    this.hideAllPopovers();
    this.markerPopovers.clear();
    this.currentPopover = null;
    
    // 清除分组缓存
    this.groupVisibility.clear();
    
    this.log('info', '所有标记点和分组已清除');
  }

  /**
   * 设置标记点点击回调
   * @param handler 点击处理函数
   */
  public setClickHandler(handler: MarkerEventHandler | null): void {
    this.clickHandler = handler;
    
    if (handler) {
      this.log('debug', '已设置标记点点击回调');
    } else {
      this.log('debug', '已移除标记点点击回调');
    }
  }

  /**
   * 获取标记点数量
   * @returns 标记点数量
   */
  public getMarkerCount(): number {
    return this.markers.size;
  }

  /**
   * 显示所有标记点
   * @returns 成功显示的标记点数量
   */
  public showAllMarkers(): number {
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('warn', '标记点图层未初始化，无法显示所有标记点');
      return 0;
    }
    
    // 设置全局标记点可见状态为true
    this.markersVisible = true;
    
    let count = 0;
    // 先隐藏当前显示的popover
    this.hideCurrentPopover();
    
    // 依次显示所有标记点
    this.markers.forEach((marker, id) => {
      const options = this.markerOptions.get(id)!;
      
      // 恢复样式
      marker.setStyle(this.createMarkerStyle(options));
      
      // 更新配置中的可见性
      options.visible = true;
      this.markerOptions.set(id, options);
      
      count++;
    });
    
    // 在所有标记点显示后，检查并显示需要默认显示popover的第一个标记点的popover
    if (this.labelsVisible) {
      this.markers.forEach((marker, id) => {
        const options = this.markerOptions.get(id)!;
        if (options.showPopover && options.usePopover && options.title) {
          // 只显示第一个找到的需要显示popover的标记点
          if (this.currentPopover === null) {
            this.showMarkerPopover(id);
          }
        }
      });
    }
    
    this.log('info', `已显示所有标记点，共 ${count} 个标记点`);
    return count;
  }
  
  /**
   * 隐藏所有标记点
   * @returns 成功隐藏的标记点数量
   */
  public hideAllMarkers(): number {
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('warn', '标记点图层未初始化，无法隐藏所有标记点');
      return 0;
    }
    
    // 设置全局标记点可见状态为false
    this.markersVisible = false;
    
    let count = 0;
    
    // 隐藏当前显示的popover
    this.hideCurrentPopover();
    
    this.markers.forEach((marker, id) => {
      marker.setStyle(new Style({})); // 设置为undefined会隐藏标记点
      
      // 更新配置中的可见性
      const options = this.markerOptions.get(id)!;
      options.visible = false;
      this.markerOptions.set(id, options);
      
      count++;
    });
    
    this.log('info', `已隐藏所有标记点，共 ${count} 个标记点`);
    return count;
  }
  
  /**
   * 显示所有标记点的标签（使用popover代替）
   * @returns 成功显示标签的标记点数量
   */
  public showAllLabels(): number {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法显示所有标签');
      return 0;
    }
    
    // 设置全局标签可见状态为true
    this.labelsVisible = true;
    
    let count = 0;
    this.markers.forEach((marker, id) => {
      const options = this.markerOptions.get(id)!;
      
      // 处理可见且有标题或模板的标记点
      if (options.visible && (options.title || options.template) && options.usePopover !== false) {
        // 显示标记点的popover
        this.showMarkerPopover(id);
        
        // 更新标记点配置，将showPopover和isPopoverOpen设为true
        options.showPopover = true;
        options.isPopoverOpen = true;
        this.markerOptions.set(id, options);
        
        count++;
      }
    });
    
    this.log('info', `已显示所有标记点标签（通过popover），共影响 ${count} 个标记点`);
    return count;
  }
  
  /**
   * 隐藏所有标记点的标签（即隐藏所有popover）
   * @returns 成功隐藏标签的标记点数量
   */
  public hideAllLabels(): number {
    // 设置全局标签可见状态为false
    this.labelsVisible = false;
    
    // 直接复用hideAllPopovers方法
    return this.hideAllPopovers();
  }

  /**
   * 销毁对象
   */
  public destroy(): void {
    // 停止动画循环
    this.stopAnimation();
    
    if (this.mapInstance) {
      // 移除图层
      if (this.markerLayer) {
        this.mapInstance.removeLayer(this.markerLayer);
      }
      
      if (this.clusterLayer) {
        this.mapInstance.removeLayer(this.clusterLayer);
      }
      
      // 移除点击监听
      if (this.clickListener) {
        unByKey(this.clickListener);
        this.clickListener = null;
      }
      
      // 清理所有popover
      this.markerPopovers.forEach(popover => {
        this.mapInstance!.removeOverlay(popover);
      });
    }
    
    // 清除数据
    this.markers.clear();
    this.markerOptions.clear();
    this.markerPopovers.clear();
    this.currentPopover = null;
    this.clickHandler = null;
    this.mapInstance = null;
    this.markerLayer = null;
    this.clusterLayer = null;
    
    this.log('debug', '标记点对象已销毁');
  }

  /**
   * 创建标记点的Popover
   * @param markerId 标记点ID
   * @param title 标记点标题
   * @param position 位置坐标
   * @returns Overlay对象
   */
  private createMarkerPopover(markerId: string, title: string, position: number[]): Overlay {
    // 获取标记点配置
    const markerOption = this.markerOptions.get(markerId);
    if (!markerOption) {
      this.log('warn', `创建popover失败：标记点 "${markerId}" 不存在`);
      return new Overlay({}); // 返回空的Overlay，避免报错
    }
    
    // 创建popover容器元素
    const popoverElement = document.createElement('div');
    popoverElement.className = 'marker-popover';
    
    // 判断是否有模板，有则使用模板，没有则直接显示标题
    if (markerOption.template) {
      // 使用模板作为popover内容
      popoverElement.innerHTML = markerOption.template;
      
      // 为模板内的样式和交互添加类名标识
      popoverElement.classList.add('marker-popover-with-template');
    } else {
      // 没有模板，使用标题
      popoverElement.innerHTML = `<div class="marker-popover-content">${title}</div>`;
    }
    // 创建Overlay对象
    const popover = new Overlay({
      element: popoverElement,
      positioning: 'bottom-center', // 将定位改为bottom-center，使popover在标记点正上方
      offset: [0, -25], // 调整偏移量，使popover紧贴标记点
      position: position,
      stopEvent: true
    });
    
    // 添加到地图
    if (this.mapInstance) {
      this.mapInstance.addOverlay(popover);
    }
    
    return popover;
  }
  
  /**
   * 显示标记点的Popover
   * @param markerId 标记点ID
   */
  private showMarkerPopover(markerId: string): void {
    // 如果当前已有显示的popover，先隐藏它
    this.hideCurrentPopover();
    
    // 获取标记点配置
    const markerOption = this.markerOptions.get(markerId);
    if (!markerOption) return;
    
    // 检查是否有标题或模板，至少需要一个才能显示popover
    if (!markerOption.title && !markerOption.template) {
      this.log('debug', `标记点 "${markerId}" 没有标题和模板，无法显示popover`);
      return;
    }
    
    // 如果明确设置了不使用popover，则不显示
    if (markerOption.usePopover === false) {
      this.log('debug', `标记点 "${markerId}" 设置了usePopover=false，不显示popover`);
      return;
    }
    
    // 获取标记点要素
    const marker = this.markers.get(markerId);
    if (!marker) return;
    
    // 获取几何中心点
    const geometry = marker.getGeometry();
    if (!(geometry instanceof Point)) return;
    
    const coordinates = geometry.getCoordinates();
    
    // 检查是否已有此标记点的popover
    let popover = this.markerPopovers.get(markerId);
    if (!popover) {
      // 创建新的popover
      popover = this.createMarkerPopover(markerId, markerOption.title || '', coordinates);
      this.markerPopovers.set(markerId, popover);
    } else {
      // 更新位置
      popover.setPosition(coordinates);
    }
    
    // 记录当前显示的popover
    this.currentPopover = markerId;
    
    // 更新标记点的isPopoverOpen状态
    markerOption.isPopoverOpen = true;
    this.markerOptions.set(markerId, markerOption);
    
    this.log('debug', `显示标记点 "${markerId}" 的popover ${markerOption.template ? '(使用模板)' : ''}`);
  }
  
  /**
   * 隐藏当前显示的Popover
   */
  private hideCurrentPopover(): void {
    if (!this.currentPopover) return;
    
    const popover = this.markerPopovers.get(this.currentPopover);
    if (popover) {
      popover.setPosition(undefined); // 设置位置为undefined即隐藏
    }
    
    // 更新标记点的isPopoverOpen状态
    const markerOption = this.markerOptions.get(this.currentPopover);
    if (markerOption) {
      markerOption.isPopoverOpen = false;
      this.markerOptions.set(this.currentPopover, markerOption);
    }
    
    this.currentPopover = null;
  }

  /**
   * 隐藏所有Popover
   * @returns 成功隐藏的popover数量
   */
  public hideAllPopovers(): number {
    if (!this.mapInstance) {
      this.log('warn', '地图实例未设置，无法隐藏所有popover');
      return 0;
    }
    
    // 隐藏当前显示的popover
    this.hideCurrentPopover();
    
    // 更新所有标记点的showPopover和isPopoverOpen设置为false
    let count = 0;
    this.markerOptions.forEach((options, id) => {
      if (options.showPopover || options.isPopoverOpen) {
        options.showPopover = false;
        options.isPopoverOpen = false;
        this.markerOptions.set(id, options);
        count++;
      }
    });
    
    this.log('info', `已隐藏所有popover，共修改 ${count} 个标记点的设置`);
    return count;
  }

  /**
   * 获取当前显示的popover
   * @returns 当前显示的popover的ID
   */
  public getCurrentPopover(): string | null {
    return this.currentPopover;
  }

  /**
   * 获取全局标签可见状态
   * @returns 全局标签可见状态
   */
  public isLabelsVisible(): boolean {
    return this.labelsVisible;
  }

  /**
   * 获取全局标记点可见状态
   * @returns 全局标记点可见状态
   */
  public isMarkersVisible(): boolean {
    return this.markersVisible;
  }

  /**
   * 设置聚合距离
   * @param distance 聚合距离（单位：像素）
   * @returns 是否设置成功
   */
  public setClusterDistance(distance: number): boolean {
    if (!this.clusterLayer) {
      this.log('warn', '聚合图层未初始化，无法设置聚合距离');
      return false;
    }
    
    if (typeof distance !== 'number' || distance < 0) {
      this.log('warn', '聚合距离必须是正数');
      return false;
    }
    
    const clusterSource = this.clusterLayer.getSource() as Cluster;
    clusterSource.setDistance(distance);
    
    this.log('info', `聚合距离已设置为 ${distance} 像素`);
    return true;
  }

  /**
   * 添加聚合点击处理，在点击聚合点时缩放到适合的范围
   * @param handler 处理函数
   */
  public setClusterClickHandler(handler?: (clusterFeatures: Feature[], coordinate: number[]) => void): void {
    // 确保地图实例存在
    if (!this.mapInstance) {
      this.log('warn', '地图实例不存在，无法设置聚合点击处理');
      return;
    }

    // 移除之前添加的点击监听器
    if (this.clickListener) {
      unByKey(this.clickListener);
      this.clickListener = null;
    }

    // 添加新的点击监听器
    this.clickListener = this.mapInstance.on('click', (event) => {
      const hit = this.mapInstance!.hasFeatureAtPixel(event.pixel, {
        hitTolerance: 10, // 增加点击容差到30像素
        layerFilter: (layer) => {
          return layer === this.markerLayer || layer === this.clusterLayer;
        }
      });
      
      // 如果没有点击到要素，直接返回
      if (!hit) return;
      
      let hasHandledClick = false;
      
      this.mapInstance!.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          // 确保只处理marker和cluster图层
          if (layer !== this.markerLayer && layer !== this.clusterLayer) {
            return;
          }
          
          // 处理聚合点
          if (feature.get('features')) {
            const clusterFeatures = feature.get('features');
            if (clusterFeatures.length === 1) {
              // 只有一个点时，当作普通点处理
              this.handleMarkerClick(clusterFeatures[0], event.coordinate);
              hasHandledClick = true;
            } else if (clusterFeatures.length > 1) {
              // 多个点的聚合
              this.log('debug', `点击了聚合点，包含 ${clusterFeatures.length} 个标记点`);
              hasHandledClick = true;
              
              // 检查是否配置了自动缩放到聚合范围
              let shouldZoom = false;
              
              // 获取聚合配置
              const mapElement = this.mapInstance?.getTargetElement();
              if (mapElement) {
                const toolbarConfig = mapElement['clusterConfig'];
                if (toolbarConfig) {
                  shouldZoom = toolbarConfig.zoomToBoundsOnClick === true;
                }
              }
              
              // 如果提供了自定义处理函数，则调用
              if (handler) {
                handler(clusterFeatures, event.coordinate);
                return true; // 停止遍历
              }
              
              // 根据配置决定是否缩放
              if (shouldZoom) {
                this.zoomToClusterExtent(clusterFeatures);
              }
            }
          } else {
            // 处理普通点
            this.handleMarkerClick(feature as any, event.coordinate);
            hasHandledClick = true;
          }
          
          // 返回true表示找到了要处理的要素，可以停止遍历
          return true;
        },
        {
          hitTolerance: 10, // 增加点击容差到30像素
          layerFilter: (layer) => {
            // 只对标记点图层生效
            return layer === this.markerLayer || layer === this.clusterLayer;
          }
        }
      );
      
      this.log('debug', `点击事件处理结果: ${hasHandledClick ? '处理了标记点点击' : '未处理任何标记点'}`);
    });
    
    this.log('debug', '已设置聚合点击处理');
  }

  /**
   * 缩放到聚合点包含的所有标记点的范围
   * @param features 要素数组
   */
  private zoomToClusterExtent(features: Feature[]): void {
    if (!this.mapInstance || features.length === 0) return;
    
    try {
      // 创建一个空的范围
      let extent = null;
      
      // 计算所有标记点的范围
      features.forEach(feature => {
        const geometry = feature.getGeometry();
        if (!geometry) return;
        
        // 获取几何对象的范围
        const featureExtent = geometry.getExtent();
        
        // 合并范围
        if (!extent) {
          extent = featureExtent;
        } else {
          extent = [ 
            Math.min(extent[0], featureExtent[0]),
            Math.min(extent[1], featureExtent[1]),
            Math.max(extent[2], featureExtent[2]),
            Math.max(extent[3], featureExtent[3])
          ];
        }
      });
      
      if (!extent) return;
      
      // 添加一点缓冲以确保所有点都在视图中
      const buffer = 50; // 像素
      const viewResolution = this.mapInstance.getView().getResolution() || 1;
      const bufferInCoords = buffer * viewResolution;
      
      extent = [
        extent[0] - bufferInCoords,
        extent[1] - bufferInCoords,
        extent[2] + bufferInCoords,
        extent[3] + bufferInCoords
      ];
      
      // 缓慢缩放到范围
      this.mapInstance.getView().fit(extent, {
        duration: 400,
        padding: [50, 50, 50, 50], // 增加边距让视图更舒适
        maxZoom: 19 // 设置最大缩放级别以避免缩放过度
      });
      
      this.log('info', `已缩放到聚合点的范围: ${JSON.stringify(extent)}`);
    } catch (error) {
      this.log('error', '缩放到聚合范围时出错:', error);
    }
  }

  /**
   * 检查点击位置是否有标记点
   * @param pixel 点击位置的像素坐标
   * @returns 如果有标记点则返回标记点信息，否则返回null
   */
  public checkMarkerClick(pixel: number[]): MarkerOptions | null {
    if (!this.mapInstance) return null;
    
    // 检查点击位置是否有特征
    const feature = this.mapInstance.forEachFeatureAtPixel(
      pixel,
      (feature) => feature,
      {
        hitTolerance: 10, // 增加点击容差到30像素
        layerFilter: (layer) => {
          // 只检查标记点图层
          return layer === this.markerLayer;
        }
      }
    );
    
    // 如果找到了特征，并且是标记点
    if (feature) {
      const id = feature.getId() as string;
      // 确保是标记点
      if (id && this.markers.has(id) && this.markerOptions.has(id)) {
        return this.markerOptions.get(id) || null;
      }
    }
    
    return null;
  }

  /**
   * 获取指定分组的所有标记点
   * @param group 分组名称
   * @returns 该分组下的所有标记点配置
   */
  public getMarkersByGroup(group: string): MarkerOptions[] {
    if (!group) {
      this.log('warn', '分组名称为空，无法获取分组标记点');
      return [];
    }

    const result: MarkerOptions[] = [];
    this.markerOptions.forEach((option) => {
      if (option.group === group) {
        result.push({ ...option });
      }
    });

    this.log('debug', `获取分组 "${group}" 的标记点，共 ${result.length} 个`);
    return result;
  }

  /**
   * 显示指定分组的所有标记点
   * @param group 分组名称
   * @returns 显示的标记点数量
   */
  public showMarkerGroup(group: string): number {
    if (!group) {
      this.log('warn', '分组名称为空，无法显示分组标记点');
      return 0;
    }

    let count = 0;
    this.markerOptions.forEach((option, id) => {
      if (option.group === group) {
        if (this.showMarker(id)) {
          count++;
        }
      }
    });

    // 更新分组可见性状态
    this.groupVisibility.set(group, true);
    this.log('info', `显示分组 "${group}" 的标记点，共 ${count} 个`);
    return count;
  }

  /**
   * 隐藏指定分组的所有标记点
   * @param group 分组名称
   * @returns 隐藏的标记点数量
   */
  public hideMarkerGroup(group: string): number {
    if (!group) {
      this.log('warn', '分组名称为空，无法隐藏分组标记点');
      return 0;
    }

    let count = 0;
    this.markerOptions.forEach((option, id) => {
      if (option.group === group) {
        if (this.hideMarker(id)) {
          count++;
        }
      }
    });

    // 更新分组可见性状态
    this.groupVisibility.set(group, false);
    this.log('info', `隐藏分组 "${group}" 的标记点，共 ${count} 个`);
    return count;
  }

  /**
   * 获取所有标记点分组
   * @returns 所有分组及其可见性状态
   */
  public getGroups(): { name: string, visible: boolean }[] {
    const groups = new Map<string, boolean>();

    // 遍历所有标记点，收集分组信息
    this.markerOptions.forEach((option) => {
      if (option.group) {
        // 优先使用缓存的分组可见性状态
        if (this.groupVisibility.has(option.group)) {
          groups.set(option.group, this.groupVisibility.get(option.group)!);
        } else {
          // 否则使用该分组中第一个标记点的可见性作为分组可见性
          groups.set(option.group, option.visible || false);
        }
      }
    });

    // 转换为数组格式
    const result = Array.from(groups.entries()).map(([name, visible]) => ({
      name,
      visible
    }));

    this.log('debug', `获取所有标记点分组，共 ${result.length} 个分组`);
    return result;
  }

  /**
   * 设置标记点分组
   * @param id 标记点ID
   * @param group 分组名称
   * @returns 是否设置成功
   */
  public setMarkerGroup(id: string, group: string | null): boolean {
    // 获取标记点
    const marker = this.markers.get(id);
    const options = this.markerOptions.get(id);
    
    if (!marker || !options) {
      this.log('warn', `标记点 "${id}" 不存在，无法设置分组`);
      return false;
    }
    
    // 更新配置
    const oldGroup = options.group;
    options.group = group || undefined;
    
    // 更新Feature中的数据
    marker.set('data', { ...options });
    
    this.log('info', `标记点 "${id}" 分组从 "${oldGroup || '无'}" 更新为 "${group || '无'}"`);
    return true;
  }

  /**
   * 检查分组是否可见
   * @param group 分组名称
   * @returns 分组可见性状态
   */
  public isGroupVisible(group: string): boolean {
    if (!group) {
      this.log('warn', '分组名称为空，无法检查分组可见性');
      return false;
    }
    
    // 优先使用缓存的分组可见性状态
    if (this.groupVisibility.has(group)) {
      return this.groupVisibility.get(group)!;
    }
    
    // 如果缓存中没有，则检查该分组下的标记点可见性
    let hasVisibleMarker = false;
    let hasMarker = false;
    
    this.markerOptions.forEach((option) => {
      if (option.group === group) {
        hasMarker = true;
        if (option.visible) {
          hasVisibleMarker = true;
        }
      }
    });
    
    // 如果该分组没有标记点，则返回false
    if (!hasMarker) {
      return false;
    }
    
    // 更新缓存
    this.groupVisibility.set(group, hasVisibleMarker);
    
    return hasVisibleMarker;
  }

  /**
   * 设置标记点全局配置
   * @param config 标记点配置
   */
  public setConfig(config: MarkerConfig): void {
    // 保存旧配置的缩放设置
    const oldScaleWithZoom = this.config.scaleWithZoom;
    
    // 更新配置
    this.config = { ...this.config, ...config };
    this.log('debug', '标记点全局配置已更新', this.config);
    
    // 如果地图实例存在且配置更新了
    if (this.mapInstance) {
      // 如果scaleWithZoom设置变化且启用了缩放，添加监听器
      if (oldScaleWithZoom !== this.config.scaleWithZoom && this.config.scaleWithZoom) {
        // 设置缩放变化监听
        this.mapInstance.getView().on('change:resolution', () => {
          // 只有在设置了根据zoom缩放且有标记点时才更新
          if (this.config.scaleWithZoom && this.markers.size > 0) {
            // 更新所有标记点的样式
            this.markers.forEach((feature, id) => {
              const options = this.markerOptions.get(id);
              if (options) {
                // 应用新样式，支持Style数组
                feature.setStyle(this.createMarkerStyle(options));
              }
            });
            
            this.log('debug', '缩放级别变化，已更新标记点样式');
          }
        });
      }
      
      // 遍历所有标记点，更新样式
      this.markers.forEach((feature, id) => {
        const options = this.markerOptions.get(id);
        if (options) {
          // 更新样式，支持Style数组
          feature.setStyle(this.createMarkerStyle(options));
        }
      });
      this.log('debug', '已重新应用标记点样式');
    }
  }

  /**
   * 获取标记点全局配置
   * @returns 标记点配置
   */
  public getConfig(): MarkerConfig {
    return { ...this.config };
  }

  /**
   * 设置图标缩放参数
   * @param params 缩放参数
   */
  public setScaleParams(params: {
    baseZoom?: number;
    zoomFactor?: number;
    minScale?: number;
    maxScale?: number;
    scaleWithZoom?: boolean;
  }): void {
    const update: Partial<MarkerConfig> = {};
    
    if (params.minScale !== undefined) update.minScale = params.minScale;
    if (params.maxScale !== undefined) update.maxScale = params.maxScale;
    if (params.scaleWithZoom !== undefined) update.scaleWithZoom = params.scaleWithZoom;
    
    // 使用setConfig方法应用更新
    this.setConfig(update);
    
    this.log('info', '已更新图标缩放参数:', update);
  }

  /**
   * 获取图标缩放参数
   * @returns 当前缩放参数
   */
  public getScaleParams(): {
    zoomFactor: number;
    minScale: number;
    maxScale: number;
    scaleWithZoom: boolean;
  } {
    return {
      zoomFactor: this.config.zoomFactor || 0.05,
      minScale: this.config.minScale || 0.8, 
      maxScale: this.config.maxScale || 1.2,
      scaleWithZoom: this.config.scaleWithZoom || false
    };
  }

  /**
   * 计算缩放因子
   * @param currentZoom 当前缩放级别
   * @param markerBaseZoom 标记点的基准缩放级别
   * @returns 缩放因子
   */
  private calculateScaleFactor(currentZoom: number, markerBaseZoom?: number): number {
    const zoomFactor = this.config.zoomFactor || 0.05;
    const minScale = this.config.minScale || 0.8;
    const maxScale = this.config.maxScale || 1.2;
    
    // 计算当前zoom与基准zoom的差值
    // 注意：这里与之前的逻辑相反，现在是currentZoom - baseZoom
    // 这样当currentZoom增大时，zoomChange为正，图标变大
    // 当currentZoom减小时，zoomChange为负，图标变小
    const zoomChange = currentZoom - markerBaseZoom;
    
    // 直接将zoom变化值乘以缩放系数获得缩放比例
    // zoomChange为正值，表示地图放大，图标放大
    // zoomChange为负值，表示地图缩小，图标缩小
    const scaleFactor = 1 + (zoomChange * zoomFactor);
    
    // 限制在配置的最小和最大缩放范围内
    return Math.max(minScale, Math.min(maxScale, scaleFactor));
  }

  /**
   * 设置聚合配置
   * @param config 聚合配置对象
   */
  public setClusterConfig(config: any): void {
    if (!this.mapInstance) {
      this.log('warn', '地图实例不存在，无法设置聚合配置');
      return;
    }
    
    // 获取地图DOM元素
    const mapElement = this.mapInstance.getTargetElement();
    if (!mapElement) {
      this.log('warn', '地图DOM元素不存在，无法设置聚合配置');
      return;
    }
    
    // 保存聚合配置到地图元素上
    mapElement['clusterConfig'] = config;
    
    // 如果已经设置了聚合距离，更新聚合距离
    if (this.clusterLayer && config.maxClusterRadius) {
      const clusterSource = this.clusterLayer.getSource() as Cluster;
      clusterSource.setDistance(config.maxClusterRadius);
      this.log('debug', `更新聚合距离为 ${config.maxClusterRadius} 像素`);
    }
    
    // 如果当前处于聚合模式，根据enableAnimation设置决定是否重启动画
    if (this.clusterMode && this.clusterLayer && this.clusterLayer.getVisible()) {
      // 先停止当前动画
      this.stopAnimation();
      
      // 如果启用了动画，则重新启动
      if (config.enableAnimation !== false) {
        this.startAnimation();
        this.log('debug', '已重启动画以应用新的聚合配置');
      } else {
        this.log('debug', '聚合配置设置为不启用持续动画，不重启动画');
      }
    }
    
    this.log('info', '已设置聚合配置');
  }
}

/**
 * 创建标记点对象的工厂函数
 */
export function createMarkerObject(mapInstance?: OlMap): MarkerObject {
  logger.debug('[Marker] 通过工厂函数创建标记点对象');
  return new MarkerObject(mapInstance || null);
}

export default MarkerObject; 