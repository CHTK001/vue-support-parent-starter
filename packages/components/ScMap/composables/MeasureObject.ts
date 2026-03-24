/**
 * 测距对象（基于Leaflet的高级实现）
 */
import { info } from '@repo/utils';
import type { Map, LatLng, Polyline, Circle, LayerGroup } from 'leaflet';
import L from 'leaflet';

export type MeasureType = 'distance';
// 定义事件类型
export type MeasureEventType = 'measure-end';

// 定义事件监听器类型
export type MeasureEventListener = () => void;

export interface MeasureStyle {
      color?: string;
  weight?: number;
  dashArray?: string;
  showUnit?: boolean;
}

const DEFAULT_STYLE: MeasureStyle = {
  color: '#ff4757',
  weight: 3,
  dashArray: '5,5',
  showUnit: true
};

export class MeasureObject {
  private mapInstance: Map | null = null;
  private enabled: boolean = false;
  private style: MeasureStyle = DEFAULT_STYLE;
  
  // 测量相关变量
  private measureLayerGroup: LayerGroup | null = null;
  private points: LatLng[] = [];
  private polyline: Polyline | null = null;
  private markers: Circle[] = [];
  private totalDistance: number = 0;
  private clickHandler: (e: any) => void;
  private moveHandler: (e: any) => void;
  private dblclickHandler: (e: any) => void;
  private tempLine: Polyline | null = null;
  private resultLabel: L.Marker | null = null;
  private firstClick: boolean = true;

  // 事件监听器存储
  private eventListeners: { [key in MeasureEventType]: MeasureEventListener[] } = {
    'measure-end': []
  };

  constructor(mapInstance: Map | null = null, style?: MeasureStyle) {
    // 初始化事件处理函数
    this.clickHandler = (e: any) => this.handleMapClick(e);
    this.moveHandler = (e: any) => this.handleMouseMove(e);
    this.dblclickHandler = (e: any) => this.handleMapDblClick(e);
    
    if (mapInstance) {
      this.setMapInstance(mapInstance);
    }
    if (style) {
      this.setStyle(style);
    }
  }

  public setMapInstance(mapInstance: Map) {
    this.mapInstance = mapInstance;
    if (this.measureLayerGroup && this.mapInstance) {
      // 如果已存在图层组，先移除
      this.measureLayerGroup.remove();
    }
    this.measureLayerGroup = L.layerGroup().addTo(mapInstance);
    
    if (this.enabled) {
      this.enable();
    }
  }

  public setStyle(style: MeasureStyle) {
    this.style = { ...DEFAULT_STYLE, ...style };
  }

  public enable() {
    if (!this.mapInstance) return;

    this.enabled = true;
    this.clear();
    this.firstClick = true;
    
    // 更改鼠标样式
    this.mapInstance.getContainer().style.cursor = 'crosshair';
    
    // 禁用地图的双击缩放
    this.mapInstance.doubleClickZoom.disable();
    
    // 注册事件监听
    // 使用setTimeout确保不会在当前事件循环中意外触发click事件
    setTimeout(() => {
      if (this.enabled && this.mapInstance) {
        this.mapInstance.on('click', this.clickHandler);
        this.mapInstance.on('mousemove', this.moveHandler);
        this.mapInstance.on('dblclick', this.dblclickHandler);
      }
    }, 50);
  }

  public disable() {
    if (!this.mapInstance || !this.enabled) return;
    
    this.enabled = false;

    // 恢复默认鼠标样式
    this.mapInstance.getContainer().style.cursor = '';
    
    // 恢复地图的双击缩放
    this.mapInstance.doubleClickZoom.enable();

    // 移除事件监听
    this.mapInstance.off('click', this.clickHandler);
    this.mapInstance.off('mousemove', this.moveHandler);
    this.mapInstance.off('dblclick', this.dblclickHandler);
    
    // 在清空之前触发测量结束事件
    if (this.points.length > 1) {
      this.fireEvent('measure-end');
    }
    
    // 彻底清除所有测量数据和图层
    this.clear();

    // 确保图层被完全移除
    if (this.measureLayerGroup) {
      this.measureLayerGroup.clearLayers();
      this.mapInstance.removeLayer(this.measureLayerGroup);
      this.measureLayerGroup = L.layerGroup().addTo(this.mapInstance);
  }
  }

  public clear() {
    this.points = [];
    this.totalDistance = 0;
    
    // 确保图层组存在并清空其中所有图层
    if (this.measureLayerGroup) {
      // 先移除所有已知的特定元素
      if (this.polyline) {
        this.measureLayerGroup.removeLayer(this.polyline);
      }
      
      if (this.tempLine) {
        this.measureLayerGroup.removeLayer(this.tempLine);
  }

      if (this.resultLabel) {
        this.measureLayerGroup.removeLayer(this.resultLabel);
      }
      
      this.markers.forEach(marker => {
        if (marker && this.measureLayerGroup) {
          this.measureLayerGroup.removeLayer(marker);
        }
      });
      
      // 最后清空整个图层组
      this.measureLayerGroup.clearLayers();
    }

    // 重置所有引用
    this.polyline = null;
    this.markers = [];
    this.tempLine = null;
    this.resultLabel = null;
    this.firstClick = true;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 地图点击事件处理
  private handleMapClick(e: any): void {
    // 忽略双击事件触发的点击，避免在双击时添加点
    if ((e.originalEvent && e.originalEvent._stopped) || (e._stopped)) {
      return;
    }
    
    // 确保是有效的用户点击事件
    if (!this.mapInstance || !e.latlng || !e.originalEvent || !this.measureLayerGroup) {
      return;
  }

    // 获取点击位置
    const clickedPoint = e.latlng;
    
    // 添加点到测量点集合
    this.points.push(clickedPoint);
    
    // 添加点标记
    const marker = L.circle(clickedPoint, {
      radius: 5,
      color: this.style.color,
      fillColor: this.style.color,
      fillOpacity: 1
    }).addTo(this.measureLayerGroup);
    
    if (marker instanceof L.Circle) {
      this.markers.push(marker);
    }
    
    // 如果是第一个点，仅添加标记
    if (this.points.length === 1) {
      return;
    }
    
    // 计算新增的距离
    const lastPoint = this.points[this.points.length - 2];
    const segmentDistance = this.calculateDistance(lastPoint, clickedPoint);
    this.totalDistance += segmentDistance;

    // 更新或创建折线
    if (this.polyline) {
      this.polyline.addLatLng(clickedPoint);
    } else {
      this.polyline = L.polyline(this.points, {
        color: this.style.color,
        weight: this.style.weight,
        opacity: 0.8
      }).addTo(this.measureLayerGroup);
    }
    
    // 显示此段距离的标签
    this.addDistanceLabel(lastPoint, clickedPoint, segmentDistance);
  }

  // 地图双击事件处理
  private handleMapDblClick(e: any): void {
    info('测距触发双击');
    if (!this.mapInstance || !this.measureLayerGroup) return;

    // 阻止地图的默认双击缩放行为
    if (e.originalEvent) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      e.originalEvent.stopImmediatePropagation();
    }
    
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    L.DomEvent.stop(e);
    
    // 确保事件被标记为已处理
    e._stopped = true;
    
    // 如果已有点，就完成测距
    if (this.points.length > 0) {
      // 添加最后一个点（如果和双击位置不同且不是第一个点）
      const clickedPoint = e.latlng;
      
      if (this.points.length > 0) {
        const lastPoint = this.points[this.points.length - 1];
        
        // 如果最后一个点和双击位置不是同一个点，且距离足够远
        if (this.calculateDistance(lastPoint, clickedPoint) > 2) {
          // 手动添加点，但避免触发常规的click处理
          this.points.push(clickedPoint);
      
          // 添加点标记
          const marker = L.circle(clickedPoint, {
            radius: 5,
            color: this.style.color,
            fillColor: this.style.color,
            fillOpacity: 1
          }).addTo(this.measureLayerGroup);
          
          if (marker instanceof L.Circle) {
            this.markers.push(marker);
          }
          
          // 计算新增的距离
          const segmentDistance = this.calculateDistance(lastPoint, clickedPoint);
          this.totalDistance += segmentDistance;
          
          // 更新折线
          if (this.polyline) {
            this.polyline.addLatLng(clickedPoint);
    }

          // 显示此段距离的标签
          this.addDistanceLabel(lastPoint, clickedPoint, segmentDistance);
        }
    }

      // 停止测距并显示结果
      this.finishMeasurement();
      this.enabled = false;
    
      // 恢复默认鼠标样式
      this.mapInstance.getContainer().style.cursor = '';
      
      // 暂时禁用双击缩放
      this.mapInstance.doubleClickZoom.disable();
      
      // 移除事件监听
      this.mapInstance.off('click', this.clickHandler);
      this.mapInstance.off('mousemove', this.moveHandler);
      this.mapInstance.off('dblclick', this.dblclickHandler);
    
      // 延迟恢复双击缩放，确保不会触发地图缩放
      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.doubleClickZoom.enable();
        }
      }, 1000);
    
      // 触发测量结束事件
      this.fireEvent('measure-end');
  }
  }

  // 鼠标移动事件处理
  private handleMouseMove(e: any): void {
    if (!this.mapInstance || !this.measureLayerGroup || this.points.length === 0) return;
    
    const lastPoint = this.points[this.points.length - 1];
    const currentPoint = e.latlng;
    
    // 更新或创建临时线
    if (this.tempLine) {
      this.tempLine.setLatLngs([lastPoint, currentPoint]);
    } else {
      this.tempLine = L.polyline([lastPoint, currentPoint], {
        color: this.style.color,
        weight: this.style.weight,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(this.measureLayerGroup);
  }
  }

  // 完成测量
  private finishMeasurement(): void {
    if (!this.mapInstance || !this.measureLayerGroup) return;

    // 检查地图是否正在执行缩放动画，如果是则延迟完成测量
    if ((this.mapInstance as any)._animatingZoom) {
      setTimeout(() => {
        // 再次检查地图是否仍在缩放
        if (this.mapInstance && (this.mapInstance as any)._animatingZoom) {
          // 如果仍在缩放，再次延迟
          setTimeout(() => this.finishMeasurement(), 400);
        } else {
          this.finishMeasurement();
        }
      }, 400);
      return;
    }
    
    // 移除临时线
    if (this.tempLine) {
      this.measureLayerGroup.removeLayer(this.tempLine);
      this.tempLine = null;
    }
    
    // 添加总距离标签
    if (this.points.length > 1) {
      const lastPoint = this.points[this.points.length - 1];
      const formattedDistance = this.formatDistance(this.totalDistance);

      // 清除之前的节点累计距离标签，避免与总距离标签重叠
      this.measureLayerGroup.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const markerPos = layer.getLatLng();
          // 如果是添加在最后一个点上的节点标签，则移除它
          if (markerPos.equals(lastPoint) && layer.options && 
              layer.options.icon && layer.options.icon.options && 
              layer.options.icon.options.className === 'measure-node-label') {
            this.measureLayerGroup.removeLayer(layer);
          }
        }
      });
      
      // 使用更大的尺寸，确保文本完全显示
      this.resultLabel = L.marker(lastPoint, {
        icon: L.divIcon({
          className: 'measure-total-label',
          iconSize: [200, 40],  // 增大宽度确保长文本显示
          iconAnchor: [100, -20], // 调整位置，让总距离标签显示在点的上方
          html: `<div class="total-distance-label" data-distance="${formattedDistance}">总距离: ${formattedDistance}</div>`
        })
      }).addTo(this.measureLayerGroup);
    }
  }

  // 添加距离标签
  private addDistanceLabel(point1: LatLng, point2: LatLng, distance: number): void {
    if (!this.mapInstance || !this.measureLayerGroup) return;
    
    // 检查地图是否正在执行缩放动画，如果是则延迟添加标签
    if ((this.mapInstance as any)._animatingZoom) {
      setTimeout(() => {
        // 再次检查地图是否仍在缩放
        if (this.mapInstance && (this.mapInstance as any)._animatingZoom) {
          // 如果仍在缩放，再次延迟
          setTimeout(() => this.addDistanceLabel(point1, point2, distance), 400);
    } else {
          this.addDistanceLabel(point1, point2, distance);
        }
      }, 400);
      return;
  }

    // 计算标签位置（两点之间的中点）
    const midPoint = L.latLng(
      (point1.lat + point2.lat) / 2,
      (point1.lng + point2.lng) / 2
    );
    
    // 计算角度以确定标签位置偏移
    const angle = Math.atan2(point2.lat - point1.lat, point2.lng - point1.lng) * 180 / Math.PI;
    const adjustedAngle = (angle + 360) % 360; // 转为0-360度
    
    // 格式化距离
    const formattedDistance = this.formatDistance(distance);
    
    // 创建线段标签
    L.marker(midPoint, {
      icon: L.divIcon({
        className: 'measure-segment-label',
        html: `<div class="segment-distance" style="transform: rotate(${adjustedAngle}deg) translateY(-50%);">${formattedDistance}</div>`,
        iconSize: [100, 30],
        iconAnchor: [50, 15]
          })
    }).addTo(this.measureLayerGroup);
      
    // 为每个点添加距离标签（从起点累计）
    // 但避免在双击完成测量时为最后一个点添加累计距离标签（因为会显示总距离标签）
    if (this.points.length > 2) {
      // 检查当前点是否是通过双击测量完成时添加的最后一个点
      const isLastPointFromDblClick = !this.enabled && point2.equals(this.points[this.points.length - 1]);
      
      // 如果不是最后一次双击添加的点，则添加累计距离标签
      if (!isLastPointFromDblClick) {
        // 计算从起点到此点的累计距离
        let cumulativeDistance = 0;
        for (let i = 1; i < this.points.length; i++) {
          cumulativeDistance += this.calculateDistance(this.points[i-1], this.points[i]);
          if (this.points[i].equals(point2)) break;
        }
        
        // 格式化累计距离
        const formattedCumulativeDistance = this.formatDistance(cumulativeDistance);
        
        // 创建节点标签，添加动画效果和更好的样式
        L.marker(point2, {
          icon: L.divIcon({
            className: 'measure-node-label',
            html: `<div class="node-distance">${formattedCumulativeDistance}</div>`,
            iconSize: [100, 30],
            iconAnchor: [50, -5], // 调整位置使其显示在点的上方
              })
        }).addTo(this.measureLayerGroup);
      }
    }
  }

  // 计算两点间的距离（米）
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    return point1.distanceTo(point2);
  }

  // 格式化距离显示
  private formatDistance(distance: number): string {
    if (!this.style.showUnit) {
      return Math.round(distance).toString();
    }
    
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} 公里`;
            } else {
      return `${Math.round(distance)} 米`;
    }
            }
            
  // 添加事件监听器
  public on(event: MeasureEventType, listener: MeasureEventListener): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  // 移除事件监听器
  public off(event: MeasureEventType, listener: MeasureEventListener): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        item => item !== listener
      );
    }
  }

  // 触发事件
  private fireEvent(event: MeasureEventType): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener());
    }
  }
  
  public destroy() {
    this.disable();
    if (this.measureLayerGroup && this.mapInstance) {
      this.measureLayerGroup.remove();
      this.measureLayerGroup = null;
  }
    this.mapInstance = null;
  }
}

export function createMeasureObject(mapInstance?: Map, style?: MeasureStyle): MeasureObject {
  return new MeasureObject(mapInstance, style);
}