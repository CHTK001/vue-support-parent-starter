<!--
  GcoordObject坐标转换示例
  展示如何使用GcoordObject在不同坐标系统间转换坐标
-->
<template>
  <div class="coord-transform-example">
    <div class="map-container" ref="mapRef"></div>
    
    <div class="control-panel">
      <h3>坐标转换测试</h3>
      
      <div class="input-group">
        <label>经度：</label>
        <input type="text" v-model="lng" placeholder="输入经度" />
      </div>
      
      <div class="input-group">
        <label>纬度：</label>
        <input type="text" v-model="lat" placeholder="输入纬度" />
      </div>
      
      <div class="input-group">
        <label>源坐标系：</label>
        <select v-model="sourceSystem">
          <option value="WGS84">WGS84 (GPS)</option>
          <option value="GCJ02">GCJ02 (高德/腾讯)</option>
          <option value="BD09">BD09 (百度)</option>
        </select>
      </div>
      
      <button @click="addMarker">添加标记点</button>
      <button @click="transformCoord">转换坐标</button>
      
      <div class="result-panel">
        <h4>转换结果：</h4>
        <div v-if="results.wgs84">WGS84: {{ results.wgs84[0].toFixed(6) }}, {{ results.wgs84[1].toFixed(6) }}</div>
        <div v-if="results.gcj02">GCJ02: {{ results.gcj02[0].toFixed(6) }}, {{ results.gcj02[1].toFixed(6) }}</div>
        <div v-if="results.bd09">BD09: {{ results.bd09[0].toFixed(6) }}, {{ results.bd09[1].toFixed(6) }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { MapObject } from '../composables/MapObject';
import { GcoordObject, CoordSystem, Coordinate } from '../composables/GcoordObject';
import { MapType } from '../types/map';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default defineComponent({
  name: 'CoordTransformExample',
  
  setup() {
    const mapRef = ref<HTMLDivElement | null>(null);
    const mapObj = ref<MapObject | null>(null);
    const gcoord = ref<GcoordObject | null>(null);
    
    const lng = ref('116.403847');
    const lat = ref('39.915526');
    const sourceSystem = ref<CoordSystem>(CoordSystem.WGS84);
    
    const results = ref<{
      wgs84?: number[];
      gcj02?: number[];
      bd09?: number[];
    }>({});
    
    const markers = ref<L.Marker[]>([]);
    
    // 初始化地图
    onMounted(() => {
      if (mapRef.value) {
        // 创建地图对象
        mapObj.value = new MapObject({
          mapType: MapType.GAODE,
          center: [39.915526, 116.403847],
          zoom: 12
        });
        
        // 初始化地图
        mapObj.value.init(mapRef.value);
        
        // 获取坐标转换对象
        gcoord.value = mapObj.value.getGcoordObject();
      }
    });
    
    // 清理资源
    onUnmounted(() => {
      if (mapObj.value) {
        mapObj.value.destroy();
      }
      
      // 清除所有标记点
      markers.value.forEach(marker => {
        marker.remove();
      });
    });
    
    // 添加标记点
    const addMarker = () => {
      if (!mapObj.value || !gcoord.value || !lng.value || !lat.value) return;
      
      // 解析输入坐标
      const lngNum = parseFloat(lng.value);
      const latNum = parseFloat(lat.value);
      
      if (isNaN(lngNum) || isNaN(latNum)) {
        alert('请输入有效的经纬度坐标');
        return;
      }
      
      // 转换为地图使用的坐标系
      const targetSystem = gcoord.value.getTargetSystem();
      const transformed = gcoord.value.transform([lngNum, latNum], sourceSystem.value, targetSystem);
      
      // 创建标记点 (Leaflet使用[lat, lng]格式)
      const marker = L.marker([transformed[1], transformed[0]], {
        title: `${sourceSystem.value}坐标: [${lngNum}, ${latNum}]`
      });
      
      // 添加到地图
      marker.addTo(mapObj.value.getMapInstance());
      markers.value.push(marker);
      
      // 弹出信息框
      marker.bindPopup(`
        <b>原始坐标(${sourceSystem.value}):</b><br>
        经度: ${lngNum}<br>
        纬度: ${latNum}<br><br>
        <b>转换后坐标(${targetSystem}):</b><br>
        经度: ${transformed[0].toFixed(6)}<br>
        纬度: ${transformed[1].toFixed(6)}
      `).openPopup();
    };
    
    // 转换坐标
    const transformCoord = () => {
      if (!gcoord.value || !lng.value || !lat.value) return;
      
      // 解析输入坐标
      const lngNum = parseFloat(lng.value);
      const latNum = parseFloat(lat.value);
      
      if (isNaN(lngNum) || isNaN(latNum)) {
        alert('请输入有效的经纬度坐标');
        return;
      }
      
      // 转换为不同坐标系
      const input: [number, number] = [lngNum, latNum];
      
      if (sourceSystem.value === CoordSystem.WGS84) {
        results.value = {
          wgs84: input,
          gcj02: gcoord.value.transform(input, CoordSystem.WGS84, CoordSystem.GCJ02),
          bd09: gcoord.value.transform(input, CoordSystem.WGS84, CoordSystem.BD09)
        };
      } else if (sourceSystem.value === CoordSystem.GCJ02) {
        results.value = {
          wgs84: gcoord.value.transform(input, CoordSystem.GCJ02, CoordSystem.WGS84),
          gcj02: input,
          bd09: gcoord.value.transform(input, CoordSystem.GCJ02, CoordSystem.BD09)
        };
      } else if (sourceSystem.value === CoordSystem.BD09) {
        results.value = {
          wgs84: gcoord.value.transform(input, CoordSystem.BD09, CoordSystem.WGS84),
          gcj02: gcoord.value.transform(input, CoordSystem.BD09, CoordSystem.GCJ02),
          bd09: input
        };
      }
    };
    
    return {
      mapRef,
      lng,
      lat,
      sourceSystem,
      results,
      addMarker,
      transformCoord
    };
  }
});
</script>

<style scoped>
.coord-transform-example {
  display: flex;
  width: 100%;
  height: 600px;
}

.map-container {
  flex: 1;
  height: 100%;
}

.control-panel {
  width: 300px;
  padding: 15px;
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.input-group {
  margin-bottom: 10px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 5px;
}

button {
  width: 100%;
  padding: 8px 12px;
  background-color: #1677ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:hover {
  background-color: #1890ff;
}

.result-panel {
  margin-top: 20px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.result-panel h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.result-panel div {
  margin-bottom: 5px;
}
</style> 