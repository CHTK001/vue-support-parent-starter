import type { Map, LatLng, Polyline, Circle, LayerGroup } from 'leaflet';
import L from 'leaflet';

// 定义事件类型
export type MeasureEventType = 'measure-end';

// 定义事件监听器类型
export type MeasureEventListener = () => void;

export class Measure {
  private map: Map;
  private active: boolean = false;
  private measureLayerGroup: LayerGroup;
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
  
  constructor(map: Map) {
    this.map = map;
    this.measureLayerGroup = L.layerGroup().addTo(map);
    
    // 点击地图时的处理函数
    this.clickHandler = (e: any) => this.handleMapClick(e);
    
    // 鼠标移动时的处理函数
    this.moveHandler = (e: any) => this.handleMouseMove(e);
    
    // 双击地图时的处理函数
    this.dblclickHandler = (e: any) => this.handleMapDblClick(e);
  }

  // 开始测量
  public start(): void {
    if (this.active) return;
    
    this.active = true;
    this.clear();
    this.firstClick = true;
    
    // 更改鼠标样式
    this.map.getContainer().style.cursor = 'crosshair';
    
    // 禁用地图的双击缩放
    this.map.doubleClickZoom.disable();
    
    // 注册事件监听
    // 使用setTimeout确保不会在当前事件循环中意外触发click事件
    setTimeout(() => {
      if (this.active) {
        this.map.on('click', this.clickHandler);
        this.map.on('mousemove', this.moveHandler);
        this.map.on('dblclick', this.dblclickHandler);
      }
    }, 50);
  }

  // 停止测量
  public stop(): void {
    if (!this.active) return;
    
    this.active = false;
    
    // 恢复默认鼠标样式
    this.map.getContainer().style.cursor = '';
    
    // 恢复地图的双击缩放
    this.map.doubleClickZoom.enable();
    
    // 移除事件监听
    this.map.off('click', this.clickHandler);
    this.map.off('mousemove', this.moveHandler);
    this.map.off('dblclick', this.dblclickHandler);
    
    // 完成测量，显示总距离
    if (this.points.length > 1) {
      this.finishMeasurement();
    } else {
      // 如果点数不足，清空测距数据
      this.clear();
    }
  }

  // 清除测量结果
  public clear(): void {
    this.points = [];
    this.totalDistance = 0;
    this.measureLayerGroup.clearLayers();
    this.polyline = null;
    this.markers = [];
    this.tempLine = null;
    this.resultLabel = null;
    this.firstClick = true;
  }

  // 地图点击事件处理
  private handleMapClick(e: any): void {
    // 忽略双击事件触发的点击，避免在双击时添加点
    if ((e.originalEvent && e.originalEvent._stopped) || (e._stopped)) {
      return;
    }
    
    // 确保是有效的用户点击事件
    if (!e.latlng || !e.originalEvent) {
      return;
    }
    
    // 获取点击位置
    const clickedPoint = e.latlng;
    
    // 添加点到测量点集合
    this.points.push(clickedPoint);
    
    // 添加点标记
    const marker = L.circle(clickedPoint, {
      radius: 5,
      color: '#ff4757',
      fillColor: '#ff4757',
      fillOpacity: 1
    }).addTo(this.measureLayerGroup);
    
    this.markers.push(marker);
    
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
        color: '#ff4757',
        weight: 3,
        opacity: 0.8
      }).addTo(this.measureLayerGroup);
    }
    
    // 显示此段距离的标签
    this.addDistanceLabel(lastPoint, clickedPoint, segmentDistance);
  }
  
  // 地图双击事件处理
  private handleMapDblClick(e: any): void {
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
            color: '#ff4757',
            fillColor: '#ff4757',
            fillOpacity: 1
          }).addTo(this.measureLayerGroup);
          
          this.markers.push(marker);
          
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
      this.active = false;
      
      // 恢复默认鼠标样式
      this.map.getContainer().style.cursor = '';
      
      // 暂时禁用双击缩放
      this.map.doubleClickZoom.disable();
      
      // 移除事件监听
      this.map.off('click', this.clickHandler);
      this.map.off('mousemove', this.moveHandler);
      this.map.off('dblclick', this.dblclickHandler);
      
      // 延迟恢复双击缩放，确保不会触发地图缩放
      setTimeout(() => {
        if (this.map) {
          this.map.doubleClickZoom.enable();
        }
      }, 1000);
      
      // 触发测量结束事件
      this.fireEvent('measure-end');
    }
  }

  // 鼠标移动事件处理
  private handleMouseMove(e: any): void {
    // 仅当已有点时才显示临时线
    if (this.points.length === 0) return;
    
    const lastPoint = this.points[this.points.length - 1];
    const currentPoint = e.latlng;
    
    // 更新或创建临时线
    if (this.tempLine) {
      this.tempLine.setLatLngs([lastPoint, currentPoint]);
    } else {
      this.tempLine = L.polyline([lastPoint, currentPoint], {
        color: '#ff4757',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(this.measureLayerGroup);
    }
  }

  // 完成测量
  private finishMeasurement(): void {
    // 检查地图是否正在执行缩放动画，如果是则延迟完成测量
    if (this.map._animatingZoom) {
      setTimeout(() => {
        // 再次检查地图是否仍在缩放
        if (this.map._animatingZoom) {
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
          html: `<div class="total-distance-label" data-distance="${formattedDistance}"></div>`
        })
      }).addTo(this.measureLayerGroup);
    }
  }

  // 添加距离标签
  private addDistanceLabel(point1: LatLng, point2: LatLng, distance: number): void {
    // 检查地图是否正在执行缩放动画，如果是则延迟添加标签
    if (this.map._animatingZoom) {
      setTimeout(() => {
        // 再次检查地图是否仍在缩放
        if (this.map._animatingZoom) {
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
      const isLastPointFromDblClick = !this.active && point2.equals(this.points[this.points.length - 1]);
      
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
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} 公里`;
    } else {
      return `${Math.round(distance)} 米`;
    }
  }

  // 是否处于激活状态
  public isActive(): boolean {
    return this.active;
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
} 