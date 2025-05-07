<template>
  <div class="sc-layer-example">
    <h2>ScLayer 地图组件示例</h2>

    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <div class="map-container">
          <sc-layer ref="layerRef" 
            :height="config.height"
            :map-type="config.mapType" 
            :map-tile="config.mapTile"
            :center="config.center"
            :zoom="config.zoom" 
            :dragging="config.dragging"
            :scroll-wheel-zoom="config.scrollWheelZoom" 
            :map-key="config.mapKey"
            :map="config.map"
            :show-toolbar="config.showToolbar"
            @map-init="onMapInit"
            @map-click="onMapClick"
            @marker-click="onMarkerClick">
          </sc-layer>
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area">
        <div class="config-section">
          <div class="config-item">
            <div class="label">地图配置</div>
            <div class="controls">
              <div class="control-row">
                <span>地图类型:</span>
                <select v-model="config.mapType" @change="handleMapTypeChange">
                  <option :value="MapType.GAODE">高德地图</option>
                  <option :value="MapType.OSM">OpenStreetMap</option>
                  <option :value="MapType.TIANDI">天地图</option>
                </select>
              </div>
              <div class="control-row">
                <span>图层类型:</span>
                <select v-model="tileType" @change="handleLayerTypeChange">
                  <option value="normal">标准图层</option>
                  <option value="satellite">卫星图层</option>
                </select>
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
                <button @click="addRandomMarkers(10)">添加10个随机点</button>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">事件日志</div>
            <div class="log-container">
              <div v-for="(log, index) in logs" :key="index" class="log-item">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-type">{{ log.type }}:</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <div v-if="logs.length === 0" class="no-logs">
                暂无事件记录
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "ScLayerExample"
};
</script>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ScLayer from '@repo/components/ScLayer/index.vue';
import { MapType, MapTile } from '@repo/components/ScLayer/types';

// 地图实例引用
const layerRef = ref(null);

// 图层类型选择（UI展示用）
const tileType = ref('normal');

// 地图配置
const config = reactive({
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: {},
  mapKey: {},
  center: [39.92, 116.40] as [number, number],
  zoom: 12,
  height: 500,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true
});

// 事件日志
const logs = reactive([]);

// 添加日志
function addLog(type, message) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  logs.unshift({
    time: timeStr,
    type: type,
    message: message
  });
  
  // 只保留最近10条日志
  if (logs.length > 10) {
    logs.pop();
  }
}

// 地图初始化完成回调
function onMapInit(mapInstance) {
  addLog('初始化', '地图加载完成');
  console.log('地图实例:', mapInstance);
}

// 地图点击事件
function onMapClick(evt) {
  const coordinates = evt.coordinates;
  addLog('点击', `地图坐标: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 标记点击事件
function onMarkerClick(evt) {
  const coordinates = evt.coordinates;
  const data = evt.data || {};
  addLog('点击', `标记点: ${data.label || '未命名'} [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 添加随机标记点
function addRandomMarkers(count) {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  for (let i = 0; i < count; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    
    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;
    
    layerRef.value.mapObj.addMarker(lon, lat, {
      label: `标记 ${i + 1}`,
      id: `marker-${Date.now()}-${i}`
    });
  }
  
  addLog('操作', `已添加 ${count} 个随机标记点`);
}

// 清除所有标记
function clearAllMarkers() {
  if (!layerRef.value) return;
  
  layerRef.value.mapObj.clearMarkers();
  addLog('操作', '已清除所有标记点');
}

// 处理地图类型变更
function handleMapTypeChange() {
  if (!layerRef.value) return;
  
  layerRef.value.mapObj.switchBaseLayer(config.mapType, config.mapTile);
  addLog('操作', `切换地图类型为: ${config.mapType}`);
}

// 处理图层类型变更
function handleLayerTypeChange() {
  if (!layerRef.value) return;
  
  // 转换图层类型
  config.mapTile = tileType.value === 'normal' ? MapTile.NORMAL : (MapTile.NORMAL + 1) as MapTile;
  layerRef.value.mapObj.switchBaseLayer(config.mapType, config.mapTile);
  addLog('操作', `切换图层类型为: ${tileType.value}`);
}

// 处理缩放级别变更
function handleZoomChange() {
  if (!layerRef.value) return;
  
  layerRef.value.mapObj.setZoom(config.zoom);
  addLog('操作', `设置缩放级别为: ${config.zoom}`);
}

// 处理交互控制变更
function handleInteractionChange() {
  if (!layerRef.value) return;
  
  layerRef.value.mapObj.setInteractions({
    dragging: config.dragging,
    scrollWheelZoom: config.scrollWheelZoom
  });
  
  addLog('操作', `更新交互控制: 拖动=${config.dragging}, 滚轮缩放=${config.scrollWheelZoom}`);
}
</script>

<style scoped>
.sc-layer-example {
  padding: 20px;
}

.example-content {
  display: flex;
  margin-top: 20px;
}

.map-area {
  flex: 1;
  min-width: 0;
  padding-right: 20px;
}

.map-container {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.config-area {
  width: 300px;
  margin-left: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.config-section {
  margin-top: 10px;
}

.config-item {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.config-item .label {
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.controls {
  padding: 5px 0;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.control-row span {
  min-width: 80px;
}

.control-row .value {
  margin-left: 10px;
  min-width: 30px;
  text-align: center;
}

.control-row select, .control-row input[type="range"] {
  flex: 1;
}

.buttons-row {
  justify-content: space-between;
}

.buttons-row button {
  padding: 6px 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.buttons-row button:hover {
  background: #66b1ff;
}

.log-container {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
}

.log-item {
  margin-bottom: 8px;
  font-size: 13px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 5px;
}

.log-time {
  color: #888;
  margin-right: 8px;
}

.log-type {
  color: #409eff;
  font-weight: bold;
  margin-right: 8px;
}

.no-logs {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}
</style> 