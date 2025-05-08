/**
 * 标记点对象
 * @description 管理地图上的标记点
 */
import { Map as OlMap } from 'ol';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';
import Cluster from 'ol/source/Cluster';
import { fromLonLat } from 'ol/proj';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { Overlay } from 'ol';
import logger from './LogObject';
import { MarkerClusterMode, MarkerOptions, MarkerEventHandler } from '../types/marker';

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

    // 创建聚合标记点图层
    const clusterSource = new Cluster({
      distance: 40,
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
    
    this.log('debug', '标记点图层已初始化，普通图层可见，聚合图层隐藏');
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
  private createClusterStyle(feature: Feature): Style {
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
    let minClusterSize = 2; // 最小聚合数量
    let maxClusterSize = 60; // 最大聚合点尺寸
    let defaultSize = 40; // 默认聚合点大小
    let enablePulse = true; // 是否启用脉冲效果
    let pulseDuration = 1500; // 脉冲动画持续时间
    let pulseScale = 1.5; // 脉冲缩放比例
    let pulseColor = color; // 脉冲颜色
    let pulseOpacity = 0.6; // 脉冲透明度
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
        pulseDuration = toolbarConfig.pulseDuration || pulseDuration;
        pulseScale = toolbarConfig.pulseScale || pulseScale;
        pulseColor = toolbarConfig.pulseColor || color;
        pulseOpacity = toolbarConfig.pulseOpacity !== undefined ? toolbarConfig.pulseOpacity : pulseOpacity;
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
    if (useWeightAsSize && size > minClusterSize) {
      // 根据数量计算大小，限制在最大尺寸范围内
      const sizeScale = Math.min(1, Math.log(size) / Math.log(100)); // 使用对数缩放，更合理
      pointSize = minClusterSize + sizeScale * (maxClusterSize - minClusterSize);
    }
    
    // 创建SVG图标
    const svgSize = pointSize;
    const circleRadius = svgSize / 2;
    const borderWidth = 2;
    
    // 创建SVG
    const svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="${color}" fill-opacity="0.8"/>
      <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius - borderWidth/2}" stroke="${borderColor}" stroke-width="${borderWidth}" fill="none"/>
    </svg>`;
    
    // 将SVG转为base64
    const iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
    
    // 创建图标样式
    return new Style({
      image: new Icon({
        src: iconUrl,
        scale: 1,
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction'
      }),
      text: showCount ? new Text({
        text: size.toString(),
        fill: new Fill({
          color: '#fff'
        }),
        font: 'bold 12px Arial',
        offsetY: 1
      }) : undefined,
      zIndex: 100 + size // 数量越多的聚合点层级越高
    });
  }

  /**
   * 设置聚合模式
   * @param enabled 是否启用聚合模式
   */
  public setClusterMode(enabled: boolean): void {
    // 如果状态没有变化，则不需要操作
    if (this.clusterMode === enabled) {
      return;
    }
    
    this.clusterMode = enabled;

    // 如果没有图层，无法执行聚合操作
    if (!this.markerLayer || !this.clusterLayer) {
      this.log('warn', `没有标记点图层，无法${enabled ? '启用' : '禁用'}聚合模式`);
      return;
    }

    // 获取聚合图层的源
    const clusterSource = this.clusterLayer.getSource() as Cluster;
    // 获取普通图层的源
    const markerSource = this.markerLayer.getSource() as VectorSource;

    // 设置聚合距离 (如果需要从外部传入配置，可以添加参数)
    if (enabled) {
      clusterSource.setDistance(40);
    }

    // 处理所有标记点
    this.markerOptions.forEach((options, id) => {
      const feature = this.markers.get(id);
      if (!feature) return;

      // 首先从当前图层移除
      markerSource.removeFeature(feature);
      clusterSource.getSource()!.removeFeature(feature);

      // 根据聚合模式和标记点设置决定添加到哪个图层
      const shouldAddToCluster = enabled && (options.clusterMode === MarkerClusterMode.CLUSTER || options.clusterMode === MarkerClusterMode.BOTH);
      const shouldAddToMarker = !enabled || options.clusterMode === MarkerClusterMode.NONE || options.clusterMode === MarkerClusterMode.BOTH;
      
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
    
    this.log('info', `添加标记点 "${id}" 成功，位置: [${options.position[0]}, ${options.position[1]}]`);
    
    return id;
  }

  /**
   * 创建标记点样式
   * @param options 标记点配置选项
   * @returns 样式
   */
  private createMarkerStyle(options: MarkerOptions): Style {
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
    
    // 检查是否需要添加脉冲效果
    if (options.pulse && options.pulse.enabled) {
      // 从全局配置获取脉冲默认值
      let pulseScale = options.pulse.scale || 1.5;
      let pulseDuration = options.pulse.duration || 1500;
      let pulseColor = options.pulse.color || '#1677ff';
      let pulseOpacity = options.pulse.opacity !== undefined ? options.pulse.opacity : 0.6;
    
      // 尝试获取更多的配置（如工具栏配置）
      const mapElement = this.mapInstance?.getTargetElement();
      if (mapElement) {
        const pulseConfig = mapElement['clusterConfig'];
        if (pulseConfig) {
          pulseScale = pulseConfig.pulseScale || pulseScale;
          pulseDuration = pulseConfig.pulseDuration || pulseDuration;
          pulseColor = pulseConfig.pulseColor || pulseColor;
          pulseOpacity = pulseConfig.pulseOpacity !== undefined ? pulseConfig.pulseOpacity : pulseOpacity;
        }
      }
      
      // 创建带有脉冲/涟漪效果的SVG
      // 先创建临时图标以获取大小信息
      const tempIcon = new Icon({
        src: iconUrl,
        scale: 1
      });
      
      // 获取图像大小信息（如果有）
      const imageSize = tempIcon.getSize();
      const iconWidth = imageSize ? imageSize[0] : 24;
      const iconHeight = imageSize ? imageSize[1] : 24;
      const size = Math.max(iconWidth, iconHeight);
      const svgWidth = size * pulseScale;
      const svgHeight = size * pulseScale;
      
      // 创建带有动画的SVG
      const pulseId = `pulse-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const svg = `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <radialGradient id="${pulseId}-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="${pulseColor}" stop-opacity="${pulseOpacity}" />
            <stop offset="100%" stop-color="${pulseColor}" stop-opacity="0" />
          </radialGradient>
        </defs>
        
        <circle cx="${svgWidth/2}" cy="${svgHeight/2}" r="${svgWidth/2}" fill="url(#${pulseId}-gradient)" opacity="${pulseOpacity}">
          <animate attributeName="r" values="${svgWidth/4};${svgWidth/2}" dur="${pulseDuration}ms" begin="0s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="${pulseOpacity};0" dur="${pulseDuration}ms" begin="0s" repeatCount="indefinite" />
        </circle>
        
        <image x="${(svgWidth - iconWidth) / 2}" y="${(svgHeight - iconHeight) / 2}" width="${iconWidth}" height="${iconHeight}" href="${iconUrl}" />
      </svg>`;
      
      // 将SVG转为base64
      iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
    }
    
    // 创建标准图标样式
    const iconImage = new Icon({
      src: iconUrl,
      scale: 1,
      anchor: styleOptions.anchor || [0.5, 1],  // 修改默认锚点为图标底部中心[0.5, 1]
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      offset: styleOptions.offset || [0, 0],
      rotation: styleOptions.rotation || 0
    });
    
    // 创建样式对象
    const style = new Style({
      image: iconImage,
      // 使用hitDetectionRenderer扩大点击区域
      hitDetectionRenderer: function(pixelCoordinates, state) {
        const x = pixelCoordinates[0][0];
        const y = pixelCoordinates[0][1];
        
        // 获取图标尺寸
        const imageSize = iconImage.getSize();
        // 如果无法获取图标大小，使用默认值
        const iconWidth = imageSize ? imageSize[0] : 30;
        const iconHeight = imageSize ? imageSize[1] : 30;
        
        // 创建点击区域
        const context = state.context;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // 简单处理：点击区域只比图标大3像素
        const padding = 2;
        
        // 使用圆形作为点击区域
        context.beginPath();
        
        // 计算圆心位置（与图标中心一致）
        const centerX = x;
        const centerY = y - iconHeight / 2; // 调整垂直位置到图标中心
        
        // 半径取图标宽高中的较大值，再加上padding
        const radius = Math.max(iconWidth, iconHeight) / 2 + padding;
        
        // 绘制圆形
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(255, 0, 0, 1)'; // 纯红色用于点击检测
        context.fill();
      },
      zIndex: options.zIndex || 1
    });
    
    return style;
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
    
    this.log('info', '所有标记点已清除');
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
      offset: [0, 0], // 调整偏移量，使popover紧贴标记点
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
   * 获取当前显示的popover ID
   * @returns 当前显示的popover ID，如果没有则返回null
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
        hitTolerance: 30, // 增加点击容差到30像素
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
              
              // 如果提供了自定义处理函数，则调用
              if (handler) {
                handler(clusterFeatures, event.coordinate);
                return true; // 停止遍历
              }
              
              // 缩放到聚合点包含的所有标记点的范围
              this.zoomToClusterExtent(clusterFeatures);
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
      extent = [
        extent[0] - buffer,
        extent[1] - buffer,
        extent[2] + buffer,
        extent[3] + buffer
      ];
      
      // 缓慢缩放到范围
      this.mapInstance.getView().fit(extent, {
        duration: 400,
        padding: [20, 20, 20, 20]
      });
      
      this.log('info', `已缩放到聚合点的范围: ${JSON.stringify(extent)}`);
    } catch (error) {
      this.log('error', '缩放到聚合范围时出错:', error);
    }
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