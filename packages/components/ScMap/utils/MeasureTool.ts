import type { Map, LatLng, Polyline, Circle, LayerGroup } from 'leaflet';
import L from 'leaflet';

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
  private tempLine: Polyline | null = null;
  private resultLabel: L.Marker | null = null;

  constructor(map: Map) {
    this.map = map;
    this.measureLayerGroup = L.layerGroup().addTo(map);
    
    // 点击地图时的处理函数
    this.clickHandler = (e: any) => this.handleMapClick(e);
    
    // 鼠标移动时的处理函数
    this.moveHandler = (e: any) => this.handleMouseMove(e);
  }

  // 开始测量
  public start(): void {
    if (this.active) return;
    
    this.active = true;
    this.clear();
    
    // 更改鼠标样式
    this.map.getContainer().style.cursor = 'crosshair';
    
    // 注册事件监听
    this.map.on('click', this.clickHandler);
    this.map.on('mousemove', this.moveHandler);
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
    
    // 完成测量，显示总距离
    if (this.points.length > 1) {
      this.finishMeasurement();
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
  }

  // 地图点击事件处理
  private handleMapClick(e: any): void {
    const clickedPoint = e.latlng;
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
          iconSize: [120, 30],
          iconAnchor: [60, 15]
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
} 