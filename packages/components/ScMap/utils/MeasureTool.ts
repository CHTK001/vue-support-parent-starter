import type { Map, LatLng, Polyline, Circle, LayerGroup } from 'leaflet';
import L from 'leaflet';

// 定义事件类型
export type MeasureToolEventType = 'measure-end';

// 定义事件监听器类型
export type MeasureToolEventListener = () => void;

export class MeasureTool {
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
  private eventListeners: { [key in MeasureToolEventType]: MeasureToolEventListener[] } = {
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
    L.DomEvent.stopPropagation(e);
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
      
      // 移除事件监听
      this.map.off('click', this.clickHandler);
      this.map.off('mousemove', this.moveHandler);
      this.map.off('dblclick', this.dblclickHandler);
      
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
    // 移除临时线
    if (this.tempLine) {
      this.measureLayerGroup.removeLayer(this.tempLine);
      this.tempLine = null;
    }
    
    // 添加总距离标签
    if (this.points.length > 1) {
      const lastPoint = this.points[this.points.length - 1];
      this.resultLabel = L.marker(lastPoint, {
        icon: L.divIcon({
          className: 'measure-total-label',
          html: `<div class="total-distance">总距离: ${this.formatDistance(this.totalDistance)}</div>`,
          iconSize: [140, 40],
          iconAnchor: [70, -20]
        })
      }).addTo(this.measureLayerGroup);
    }
  }

  // 添加距离标签
  private addDistanceLabel(point1: LatLng, point2: LatLng, distance: number): void {
    // 标签位置在两点的中间
    const midPoint = L.latLng(
      (point1.lat + point2.lat) / 2,
      (point1.lng + point2.lng) / 2
    );
    
    // 创建标签
    const label = L.marker(midPoint, {
      icon: L.divIcon({
        className: 'measure-segment-label',
        html: `<div class="segment-distance">${this.formatDistance(distance)}</div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      })
    }).addTo(this.measureLayerGroup);

    // 为起点添加距离累计信息（第一个点除外）
    if (this.points.length > 2) {
      // 计算从起点到当前点的总距离
      let totalToThisPoint = 0;
      for (let i = 1; i < this.points.length; i++) {
        totalToThisPoint += this.calculateDistance(this.points[i-1], this.points[i]);
        if (this.points[i] === point2) break; // 找到当前点后停止
      }
      
      // 为当前节点添加累计距离标签
      const nodeLabel = L.marker(point2, {
        icon: L.divIcon({
          className: 'measure-node-label',
          html: `<div class="node-distance">累计: ${this.formatDistance(totalToThisPoint)}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, -15] // 放在点的上方
        })
      }).addTo(this.measureLayerGroup);
    }
  }

  // 计算两点之间的距离（米）
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    return this.map.distance(point1, point2);
  }

  // 格式化距离显示
  private formatDistance(distance: number): string {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} 公里`;
    } else {
      return `${Math.round(distance)} 米`;
    }
  }

  // 判断测量工具是否激活
  public isActive(): boolean {
    return this.active;
  }

  // 添加事件监听器
  public on(event: MeasureToolEventType, listener: MeasureToolEventListener): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }
  
  // 移除事件监听器
  public off(event: MeasureToolEventType, listener: MeasureToolEventListener): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener);
      if (index !== -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }
  
  // 触发事件
  private fireEvent(event: MeasureToolEventType): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener());
    }
  }
} 