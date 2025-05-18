<template>
  <div class="sc-map-example">
    <h2>ScMap 地图组件示例</h2>
    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <ScMap ref="mapRef"
          :height="config.height"
          :map-type="config.mapType"
          :map-tile="config.mapTile"
          :center="config.center"
          :zoom="config.zoom"
          :dragging="config.dragging"
          :scroll-wheel-zoom="config.scrollWheelZoom"
          :map-key="config.mapKey"
          :show-toolbar="config.showToolbar"
          :show-scale-line="config.showScaleLine"
          :map="config.map"
          @map-initialized="onMapInit"
          @map-click="onMapClick"
          @marker-click="onMarkerClick"
          @toolbar-state-change="onToolbarStateChange"
          @marker-create="onMarkerCreate"
          @marker-update="onMarkerUpdate"
          @marker-delete="onMarkerDelete"
          @shape-create="onShapeCreate"
          @shape-update="onShapeUpdate"
          @shape-delete="onShapeDelete"
        />
      </div>
      <!-- 右侧配置区域 -->
      <div class="config-area thin-scrollbar">
        <div class="config-section">
          <div class="config-item">
            <div class="label">地图配置</div>
            <div class="controls">
              <div class="control-row">
                <span>地图类型:</span>
                <div class="button-group">
                  <button @click="changeMapType(MapType.GAODE)" :class="{ 'active-button': config.mapType === MapType.GAODE }">高德地图</button>
                  <button @click="changeMapType(MapType.OSM)" :class="{ 'active-button': config.mapType === MapType.OSM }">OpenStreetMap</button>
                  <button @click="changeMapType(MapType.TIANDITU)" :class="{ 'active-button': config.mapType === MapType.TIANDITU }">天地图</button>
                </div>
              </div>
              <div class="control-row">
                <span>图层类型:</span>
                <div class="button-group">
                  <button @click="changeLayerType('normal')" :class="{ 'active-button': tileType === 'normal' }">标准图层</button>
                  <button @click="changeLayerType('satellite')" :class="{ 'active-button': tileType === 'satellite' }">卫星图层</button>
                  <button @click="changeLayerType('hybrid')" :class="{ 'active-button': tileType === 'hybrid' }">混合图层</button>
                </div>
              </div>
              <div class="control-row">
                <span>可拖动:</span>
                <input type="checkbox" v-model="config.dragging" @change="handleInteractionChange">
              </div>
              <div class="control-row">
                <span>滚轮缩放:</span>
                <input type="checkbox" v-model="config.scrollWheelZoom" @change="handleInteractionChange">
              </div>
              <div class="control-row">
                <span>比例尺:</span>
                <input type="checkbox" v-model="config.showScaleLine">
              </div>
              <div class="control-row">
                <span>缩放级别:</span>
                <input type="range" v-model.number="config.zoom" min="3" max="18" @change="handleZoomChange">
                <span class="value">{{ config.zoom }}</span>
              </div>
            </div>
          </div>
          <div class="config-item">
            <div class="label">标记点操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addRandomMarkers(3)">添加随机标记</button>
                <button @click="clearAllMarkers">清除所有标记</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleAllMarkers">{{ allMarkersVisible ? '隐藏所有标记点' : '显示所有标记点' }}</button>
              </div>
            </div>
          </div>
          <div class="config-item">
            <div class="label">图形操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addSquareShape">添加正方形</button>
                <button @click="addCircleShape">添加圆形</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="clearAllShapes">清除所有图形</button>
                <button @click="toggleShapeVisible">{{ allShapesVisible ? '隐藏所有图形' : '显示所有图形' }}</button>
              </div>
            </div>
          </div>
          <div class="config-item">
            <div class="label">轨迹操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addSampleTrack">添加示例轨迹</button>
                <button @click="clearAllTracks">清除所有轨迹</button>
              </div>
            </div>
          </div>
          <div class="config-item">
            <div class="label">飞线操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addSampleFlightLine">添加示例飞线</button>
                <button @click="clearAllFlightLines">清除所有飞线</button>
              </div>
            </div>
          </div>
          <div class="config-item">
            <div class="label">事件日志</div>
            <div class="log-container">
              <div v-for="(log, index) in logs" :key="index" class="log-item thin-scrollbar">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-type">{{ log.type }}:</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <div v-if="logs.length === 0" class="no-logs">暂无事件记录</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScMap from '@repo/components/ScMap/index.vue';
import { ref, reactive, computed, nextTick } from 'vue';
import { MapType, MapTile, DEFAULT_MAP_CONFIG } from '@repo/components/ScMap/types';

const mapRef = ref<any>(null);
const config = reactive({
  height: 600,
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: DEFAULT_MAP_CONFIG,
  center: [39.909186, 116.397411] as [number, number],
  zoom: 10,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true,
  showScaleLine: true,
  mapKey: {}
});
const tileType = ref('normal');
const markers = ref<any[]>([]);
const allMarkersVisible = ref(true);
const shapes = ref<any[]>([]);
const allShapesVisible = ref(true);
const logs = reactive<any[]>([]);

function addLog(type: string, message: string) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  logs.unshift({ time: timeStr, type, message });
  if (logs.length > 10) logs.pop();
}

function onMapInit() {
  addLog('初始化', '地图加载完成');
  updateMarkerList();
  updateShapeList();
}
function onMapClick(evt: any) {
  const coordinates = evt.coordinates || evt.latlng || evt;
  addLog('点击', `地图坐标: [${coordinates[0]?.toFixed?.(4) ?? coordinates.lat?.toFixed?.(4)}, ${coordinates[1]?.toFixed?.(4) ?? coordinates.lng?.toFixed?.(4)}]`);
}
function onMarkerClick(evt: any) {
  const data = evt.data || evt;
  addLog('点击', `标记点: ${data.title || '未命名'} [ID: ${data.id || ''}]`);
}
function onToolbarStateChange(state: any) {
  addLog('工具栏', `工具ID: ${state.toolId}, 激活状态: ${state.active}, 类型: ${state.toolType}`);
}
function onMarkerCreate(evt: any) { updateMarkerList(); addLog('创建', `标记点已创建: ${evt.options?.title || ''}`); }
function onMarkerUpdate(evt: any) { updateMarkerList(); addLog('更新', `标记点已更新: [ID: ${evt.id}]`); }
function onMarkerDelete(evt: any) { updateMarkerList(); addLog('删除', `标记点已删除: [ID: ${evt.id}]`); }
function onShapeCreate(evt: any) { updateShapeList(); addLog('创建', `图形已创建: [ID: ${evt.id}]`); }
function onShapeUpdate(evt: any) { updateShapeList(); addLog('更新', `图形已更新: [ID: ${evt.id}]`); }
function onShapeDelete(evt: any) { updateShapeList(); addLog('删除', `图形已删除: [ID: ${evt.id}]`); }

function changeMapType(type: MapType) {
  config.mapType = type;
  handleMapTypeChange();
}
function changeLayerType(type: string) {
  tileType.value = type;
  handleLayerTypeChange();
}
function handleMapTypeChange() {
  if (!mapRef.value) return;
  mapRef.value.getMapObject()?.switchBaseLayer(config.mapType, config.mapTile);
  addLog('操作', `切换地图类型为: ${config.mapType}`);
}
function handleLayerTypeChange() {
  if (!mapRef.value) return;
  switch (tileType.value) {
    case 'normal': config.mapTile = MapTile.NORMAL; break;
    case 'satellite': config.mapTile = MapTile.SATELLITE; break;
    case 'hybrid': config.mapTile = MapTile.HYBRID; break;
    default: config.mapTile = MapTile.NORMAL;
  }
  mapRef.value.getMapObject()?.switchBaseLayer(config.mapType, config.mapTile);
  addLog('操作', `切换图层类型为: ${tileType.value}`);
}
function handleZoomChange() {
  if (!mapRef.value) return;
  mapRef.value.setZoom(config.zoom);
  addLog('操作', `设置缩放级别为: ${config.zoom}`);
}
function handleInteractionChange() {
  if (!mapRef.value) return;
  mapRef.value.getMapObject()?.setInteractions({ dragging: config.dragging, scrollWheelZoom: config.scrollWheelZoom });
  addLog('交互', `拖动: ${config.dragging}, 滚轮缩放: ${config.scrollWheelZoom}`);
}
function addRandomMarkers(count: number) {
  if (!mapRef.value) return;
  const center = config.center;
  for (let i = 0; i < count; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    const lon = center[1] + offsetLon;
    const lat = center[0] + offsetLat;
    mapRef.value.addMarker({
      id: `marker-${Date.now()}-${i}`,
      position: [lon, lat],
      title: `标记 ${i + 1}`,
      clickable: true
    });
  }
  updateMarkerList();
  addLog('操作', `已添加${count}个随机标记点`);
}
function clearAllMarkers() {
  if (!mapRef.value) return;
  mapRef.value.clearMarkers?.();
  updateMarkerList();
  addLog('操作', '已清除所有标记点');
}
function toggleAllMarkers() {
  if (!mapRef.value) return;
  if (allMarkersVisible.value) {
    mapRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
    addLog('操作', '已隐藏所有标记点');
  } else {
    mapRef.value.showAllMarkers();
    allMarkersVisible.value = true;
    addLog('操作', '已显示所有标记点');
  }
  updateMarkerList();
}
function updateMarkerList() {
  if (!mapRef.value) return;


  const markerObj = mapRef.value.getToolbarObject()?.getMarkerObject();
  if (!markerObj) return;
  
  const markersMap = markerObj.getAllMarkers?.() || new Map();
  // 将Map对象转换为数组
  markers.value = Array.from(markersMap.values());
  allMarkersVisible.value = markers.value.filter((m) => m.options?.visible !== false).length > 0;
}
function addSquareShape() {
  if (!mapRef.value) return;
  const center = config.center;
  mapRef.value.addShape({
    id: `square-${Date.now()}`,
    type: 'Square',
    center: [center[1], center[0]],
    size: 500,
    style: { fill: { color: 'rgba(255, 165, 0, 0.3)' }, stroke: { color: 'orange', width: 3 } }
  });
  updateShapeList();
  addLog('操作', '已添加正方形图形');
}
function addCircleShape() {
  if (!mapRef.value) return;
  const center = config.center;
  mapRef.value.addShape({
    id: `circle-${Date.now()}`,
    type: 'Circle',
    center: [center[1] + 0.01, center[0] + 0.01],
    radius: 300,
    style: { fill: { color: 'rgba(24, 144, 255, 0.3)' }, stroke: { color: '#1890ff', width: 2 } }
  });
  updateShapeList();
  addLog('操作', '已添加圆形图形');
}
function clearAllShapes() {
  if (!mapRef.value) return;
  mapRef.value.clearShapes();
  updateShapeList();
  addLog('操作', '已清除所有图形');
}
function toggleShapeVisible() {
  if (!mapRef.value) return;
  if (allShapesVisible.value) {
    shapes.value.forEach((shape: any) => mapRef.value.updateShape(shape.id, { visible: false }));
    allShapesVisible.value = false;
    addLog('操作', '已隐藏所有图形');
  } else {
    shapes.value.forEach((shape: any) => mapRef.value.updateShape(shape.id, { visible: true }));
    allShapesVisible.value = true;
    addLog('操作', '已显示所有图形');
  }
  updateShapeList();
}
function updateShapeList() {
  if (!mapRef.value) return;
  const all = mapRef.value.getToolbarObject()?.getShapeObject()?.getAllShapes?.() || [];
  shapes.value = all;
  allShapesVisible.value = all.length > 0 && all.every((s: any) => s.visible !== false);
}
// 轨迹相关
function addSampleTrack() {
  if (!mapRef.value) return;
  const center = config.center;
  const now = Math.floor(Date.now() / 1000);
  const points = [];
  for (let i = 0; i < 10; i++) {
    points.push({ lat: center[0], lng: center[1] + i * 0.005, time: now + i * 60 });
  }
  mapRef.value.addTrack({ id: `track-${Date.now()}`, name: '示例轨迹', points });
  addLog('轨迹', '已添加示例轨迹');
}
function clearAllTracks() {
  if (!mapRef.value) return;
  mapRef.value.clearTracks?.();
  addLog('轨迹', '已清除所有轨迹');
}
// 飞线相关
function addSampleFlightLine() {
  if (!mapRef.value) return;
  const center = config.center;
  const from = [center[1], center[0]];
  const to = [center[1] + 0.05, center[0] + 0.05];
  mapRef.value.addFlightLine(from, to, { fromName: '起点', toName: '终点', style: { color: '#a6c84c', width: 2 } });
  addLog('飞线', '已添加示例飞线');
}
function clearAllFlightLines() {
  if (!mapRef.value) return;
  mapRef.value.clearFlightLines?.();
  addLog('飞线', '已清除所有飞线');
}
</script>

<style scoped>
.sc-map-example {
  padding: 20px;
}
.example-content {
  display: flex;
  margin-top: 20px;
}
.map-area {
  flex: 1;
  margin-right: 20px;
}
.config-area {
  width: 320px;
  overflow-y: auto;
  max-height: 700px;
}
.config-section {
  width: 100%;
}
.config-item {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.label {
  padding: 8px 12px;
  font-weight: 600;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}
.controls {
  padding: 12px;
}
.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.control-row span {
  margin-right: 8px;
  min-width: 80px;
}
.control-row .value {
  margin-left: 8px;
  min-width: auto;
  color: #1890ff;
}
.buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  flex: 1;
}
button:hover {
  color: #1890ff;
  border-color: #1890ff;
}
.primary-button {
  background-color: #1890ff;
  color: #fff;
  border-color: #1890ff;
}
.primary-button:hover {
  background-color: #40a9ff;
  color: #fff;
  border-color: #40a9ff;
}
.active-button {
  color: #1890ff;
  border-color: #1890ff;
}
.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}
.log-item {
  font-size: 12px;
  margin-bottom: 4px;
  padding: 4px;
  border-bottom: 1px solid #f0f0f0;
}
.log-time {
  color: #8c8c8c;
  margin-right: 8px;
}
.log-type {
  color: #1890ff;
  font-weight: bold;
  margin-right: 8px;
}
.no-logs {
  color: #999;
  font-style: italic;
}
</style> 