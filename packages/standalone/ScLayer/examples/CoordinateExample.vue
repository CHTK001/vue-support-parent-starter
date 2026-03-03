<!-- 
  统一坐标系示例 - 使用EPSG:3857坐标系处理地图点位
-->
<template>
  <div class="coordinate-example">
    <h2>统一使用EPSG:3857坐标系处理地图点位示例</h2>
    
    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <ScLayer 
          ref="mapRef"
          :height="500"
          :map-type="mapType"
          :map-tile="mapTile"
          :center="center"
          :zoom="zoom"
          @map-initialized="onMapInitialized"
          @map-click="onMapClick"
        />
      </div>
      
      <!-- 右侧控制区域 -->
      <div class="control-area">
        <div class="control-section">
          <h3>地图控制</h3>
          <div class="control-row">
            <label>地图类型：</label>
            <select v-model="mapType">
              <option value="GAODE">高德地图</option>
              <option value="OSM">OpenStreetMap</option>
              <option value="TIANDITU">天地图</option>
              <option value="BAIDU">百度地图</option>
            </select>
          </div>
          <div class="control-row">
            <label>图层类型：</label>
            <select v-model="mapTile">
              <option value="normal">标准图层</option>
              <option value="satellite">卫星图层</option>
              <option value="hybrid">混合图层</option>
            </select>
          </div>
        </div>
        
        <div class="control-section">
          <h3>点位操作</h3>
          <div class="control-row">
            <button @click="addRandomMarkers(5)">添加5个随机点</button>
            <button @click="clearAllMarkers">清除所有点</button>
          </div>
          <div class="control-row">
            <button @click="addWgs84Marker">添加WGS84点</button>
            <button @click="addGcj02Marker">添加GCJ02点</button>
          </div>
        </div>
        
        <div class="control-section">
          <h3>当前坐标</h3>
          <div class="coordinate-display">
            <p>WGS84: {{ currentCoordinate.wgs84 }}</p>
            <p>EPSG:3857: {{ currentCoordinate.epsg3857 }}</p>
            <p>地图坐标系: {{ currentCoordinate.mapCoord }}</p>
          </div>
        </div>
        
        <div class="control-section">
          <h3>操作日志</h3>
          <div class="log-area">
            <p v-for="(log, index) in logs" :key="index">{{ log }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import ScLayer from '../index.vue';
import { MapType, MapTile } from '../types/map';
import { CoordType } from '../types/coordinate';
import { GcoordUtils } from '../utils/GcoordUtils';
import type { GeoPoint } from '../types/coordinate';

// 地图配置
const mapRef = ref<InstanceType<typeof ScLayer> | null>(null);
const mapType = ref<MapType>(MapType.GAODE);
const mapTile = ref<MapTile>(MapTile.NORMAL);
const center = ref<[number, number]>([39.9042, 116.4074]); // 北京
const zoom = ref<number>(12);

// 当前坐标
const currentCoordinate = ref({
  wgs84: '[0, 0]',
  epsg3857: '[0, 0]',
  mapCoord: '[0, 0]'
});

// 日志
const logs = ref<string[]>([]);

// 地图初始化完成
const onMapInitialized = () => {
  addLog('地图初始化完成');
  addLog(`当前地图类型：${mapType.value}`);
  addLog(`当前坐标系：EPSG:3857 (内部统一使用)`);
};

// 地图点击事件
const onMapClick = (event: any) => {
  const coords = event.coordinates;
  
  // 显示点击的坐标
  displayCoordinate(coords);
  
  // 添加标记点
  addMarker([coords[0], coords[1]]);
};

// 添加随机标记点
const addRandomMarkers = (count: number) => {
  for (let i = 0; i < count; i++) {
    // 在当前视图范围内随机生成点
    const lat = center.value[0] + (Math.random() - 0.5) * 0.1;
    const lon = center.value[1] + (Math.random() - 0.5) * 0.1;
    
    // 转换为EPSG:3857坐标
    const epsg3857Coord = GcoordUtils.wgs84ToEpsg3857Precise(lat, lon);
    
    // 添加标记点（内部使用EPSG:3857坐标）
    const marker = mapRef.value?.addMarker({
      coordinates: epsg3857Coord,
      label: `随机点 ${i + 1}`,
      iconSize: [32, 32],
      iconUrl: 'https://cdn.example.com/marker.png'
    });
    
    addLog(`添加随机点 ${i + 1}: WGS84 [${lat.toFixed(6)}, ${lon.toFixed(6)}] -> EPSG:3857 [${epsg3857Coord[0].toFixed(2)}, ${epsg3857Coord[1].toFixed(2)}]`);
  }
};

// 清除所有标记点
const clearAllMarkers = () => {
  mapRef.value?.clearMarkers();
  addLog('清除所有标记点');
};

// 添加WGS84坐标系的点
const addWgs84Marker = () => {
  // WGS84坐标（天安门）
  const wgs84Point: GeoPoint = [39.9054, 116.3976];
  
  // 转换为EPSG:3857坐标
  const epsg3857Point = GcoordUtils.wgs84ToEpsg3857(wgs84Point);
  
  // 添加标记点（内部使用EPSG:3857坐标）
  if (Array.isArray(epsg3857Point)) {
    const marker = mapRef.value?.addMarker({
      coordinates: epsg3857Point,
      label: 'WGS84点 (天安门)',
      iconSize: [32, 32],
      iconColor: '#FF0000'
    });
    
    addLog(`添加WGS84点: [${wgs84Point[0].toFixed(6)}, ${wgs84Point[1].toFixed(6)}] -> EPSG:3857 [${epsg3857Point[0].toFixed(2)}, ${epsg3857Point[1].toFixed(2)}]`);
  }
};

// 添加GCJ02坐标系的点
const addGcj02Marker = () => {
  // GCJ02坐标（故宫）
  const gcj02Point: GeoPoint = [39.916, 116.397];
  
  // 转换为EPSG:3857坐标
  const epsg3857Point = GcoordUtils.anyToEpsg3857(gcj02Point, CoordType.GCJ02);
  
  // 添加标记点（内部使用EPSG:3857坐标）
  if (Array.isArray(epsg3857Point)) {
    const marker = mapRef.value?.addMarker({
      coordinates: epsg3857Point,
      label: 'GCJ02点 (故宫)',
      iconSize: [32, 32],
      iconColor: '#00FF00'
    });
    
    addLog(`添加GCJ02点: [${gcj02Point[0].toFixed(6)}, ${gcj02Point[1].toFixed(6)}] -> EPSG:3857 [${epsg3857Point[0].toFixed(2)}, ${epsg3857Point[1].toFixed(2)}]`);
  }
};

// 添加标记点
const addMarker = (coordinates: [number, number]) => {
  const marker = mapRef.value?.addMarker({
    coordinates,
    label: '点击点',
    iconSize: [24, 24]
  });
};

// 显示坐标
const displayCoordinate = (wgs84Coords: [number, number]) => {
  // 转换为EPSG:3857坐标
  const epsg3857Coords = GcoordUtils.wgs84ToEpsg3857Precise(wgs84Coords[0], wgs84Coords[1]);
  
  // 转换为当前地图坐标系
  const mapCoords = GcoordUtils.epsg3857ToMapCoord(epsg3857Coords, mapType.value);
  
  // 更新显示
  currentCoordinate.value = {
    wgs84: `[${wgs84Coords[0].toFixed(6)}, ${wgs84Coords[1].toFixed(6)}]`,
    epsg3857: `[${epsg3857Coords[0].toFixed(2)}, ${epsg3857Coords[1].toFixed(2)}]`,
    mapCoord: `[${Array.isArray(mapCoords) ? 
      `${mapCoords[0].toFixed(6)}, ${mapCoords[1].toFixed(6)}` : 
      `${mapCoords.lng.toFixed(6)}, ${mapCoords.lat.toFixed(6)}`}]`
  };
};

// 添加日志
const addLog = (message: string) => {
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  
  // 最多保留20条日志
  if (logs.value.length > 20) {
    logs.value.pop();
  }
};

onMounted(() => {
  addLog('组件已挂载');
});
</script>

<style scoped>
.coordinate-example {
  padding: 20px;
}

.example-content {
  display: flex;
  gap: 20px;
}

.map-area {
  flex: 1;
  min-width: 600px;
}

.control-area {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-section {
  background: var(--el-bg-color-overlay);
  padding: 15px;
  border-radius: 8px;
}

.control-row {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.coordinate-display {
  background-color: #e6f7ff;
  padding: 10px;
  border-radius: 4px;
}

.log-area {
  height: 200px;
  overflow-y: auto;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

button {
  padding: 5px 10px;
  background-color: #1890ff;
  color: var(--el-text-color-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #40a9ff;
}

select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}
</style> 