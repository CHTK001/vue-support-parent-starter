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
            @map-initialized="onMapInit"
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
              <div class="control-row buttons-row">
                <button @click="addColoredMarkers">添加图标类型示例</button>
                <button @click="addClusterMarkers">添加聚合标记</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleAllMarkers">{{ allMarkersVisible ? '隐藏所有标记点' : '显示所有标记点' }}</button>
                <button @click="toggleAllLabels">{{ allLabelsVisible ? '隐藏所有标签' : '显示所有标签' }}</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addPopoverMarker">添加默认显示Popover标记</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addTemplateMarker">添加带模板的标记点</button>
                <button @click="addNoTemplateMarker">添加无模板的标记点</button>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">标记点列表</div>
            <div class="marker-stats">
              <span>总数: {{ markers.length }}</span>
              <span>可见: {{ visibleMarkerCount }}</span>
            </div>
            <div class="marker-list">
              <div v-if="markers.length === 0" class="no-markers">
                暂无标记点
              </div>
              <div v-for="marker in markers.slice(0, 5)" :key="marker.id" class="marker-item">
                <div class="marker-header">
                  <span class="marker-id">ID: {{ marker.id.slice(-8) }}</span>
                  <span :class="['marker-status', marker.visible ? 'visible' : 'hidden']">
                    {{ marker.visible ? '可见' : '隐藏' }}
                  </span>
                </div>
                <div class="marker-position">位置: [{{ marker.position[0].toFixed(4) }}, {{ marker.position[1].toFixed(4) }}]</div>
                <div class="marker-title" v-if="marker.title">标题: {{ marker.title }}</div>
                <div class="marker-actions">
                  <button @click="toggleMarkerVisibility(marker)">
                    {{ marker.visible ? '隐藏' : '显示' }}
                  </button>
                  <button @click="toggleMarkerPopover(marker)">
                    {{ marker.showPopover ? '隐藏Popover' : '显示Popover' }}
                  </button>
                  <button @click="moveMarker(marker)">移动</button>
                  <button @click="removeMarker(marker)">删除</button>
                </div>
              </div>
              <div v-if="markers.length > 5" class="more-markers">
                还有 {{ markers.length - 5 }} 个标记点未显示...
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
import { MapType, MapTile, MarkerClusterMode } from '@repo/components/ScLayer/types';
import { DEFAULT_MAP_CONFIG } from '@repo/components/ScLayer/types/map';
import type { MarkerOptions } from '@repo/components/ScLayer/composables/MarkerObject';

// 地图实例引用
const layerRef = ref(null);

// 图层类型选择（UI展示用）
const tileType = ref('normal');

// 地图配置
const config = reactive({
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: DEFAULT_MAP_CONFIG,
  mapKey: {},
  center: [39.92, 116.40] as [number, number],
  zoom: 12,
  height: 700,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true
});

// 标记点数据
const markers = ref<MarkerOptions[]>([]);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);

// 计算可见标记点数量
const visibleMarkerCount = computed(() => {
  return markers.value.filter(marker => marker.visible).length;
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
  
  // 添加一个中心标记点
  addCenterMarker();
}

// 地图点击事件
function onMapClick(evt) {
  const coordinates = evt.coordinates;
  addLog('点击', `地图坐标: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 标记点击事件
function onMarkerClick(evt) {
  const data = evt.data;
  const markerId = data.id;
  addLog('点击', `标记点: ${data.title || '未命名'} [ID: ${markerId.slice(-8)}]`);
}

// 添加中心标记点
function addCenterMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  const markerId = layerRef.value.addMarker({
    id: 'center-marker',
    position: [centerLon, centerLat],
    title: '中心点',
    clickable: true,
    usePopover: true,
    data: { type: 'center', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是地图中心点</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加中心标记点');
}

// 添加随机标记点
function addRandomMarkers(count) {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 可用的图标类型
  const iconTypes = ['url', 'svg', 'base64', 'default'];
  // 一些预定义的随机URL图标
  const iconUrls = [
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
  ];
  // 随机颜色
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa541c'];
  
  for (let i = 0; i < count; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    
    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;
    
    const id = `marker-${Date.now()}-${i}`;
    const usePopover = Math.random() > 0.5; // 随机决定是否使用popover
    
    // 随机选择一个图标类型
    const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];
    // 随机选择一个颜色
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // 准备图标
    let icon;
    // 创建SVG图标
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="6" fill="white"/></svg>`;
    
    // 根据不同图标类型准备图标内容
    switch (iconType) {
      case 'svg':
        // 直接传递SVG字符串
        icon = iconSvg;
        break;
      case 'url':
        // 使用URL图标
        icon = iconUrls[Math.floor(Math.random() * iconUrls.length)];
        break;
      case 'base64':
        // 使用base64编码的图标
        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 默认图标
        icon = iconSvg;
        break;
    }
    
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `标记 ${i + 1} (${iconType})`,
      icon: icon,
      iconType: iconType,
      clickable: true,
      usePopover: usePopover,
      data: { type: 'random', index: i }
    });
  }
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已添加 ${count} 个随机标记点 (不同图标类型)`);
}

// 添加彩色标记点
function addColoredMarkers() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 定义四个方向和颜色
  const directions = [
    { name: '东', offset: [0.05, 0], color: '#1890ff', usePopover: true, iconType: 'svg' },
    { name: '南', offset: [0, -0.05], color: '#52c41a', usePopover: false, iconType: 'url' },
    { name: '西', offset: [-0.05, 0], color: '#faad14', usePopover: true, iconType: 'base64' },
    { name: '北', offset: [0, 0.05], color: '#722ed1', usePopover: false, iconType: 'default' }
  ];
  
  directions.forEach((dir, index) => {
    const id = `direction-${dir.name}-marker`;
    const lon = centerLon + dir.offset[0];
    const lat = centerLat + dir.offset[1];
    
    // 创建SVG图标
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${dir.color}"/><circle cx="12" cy="12" r="6" fill="white"/></svg>`;
    
    // 根据不同图标类型准备图标内容
    let icon;
    switch (dir.iconType) {
      case 'svg':
        // 直接传递SVG字符串
        icon = iconSvg;
        break;
      case 'url':
        // 使用URL图标
        icon = 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-' + (index + 1) + '.png';
        break;
      case 'base64':
        // 使用base64编码的图标
        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 默认使用SVG作为内容
        icon = iconSvg;
        break;
    }
    
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `${dir.name}方向 (${dir.iconType})`,
      icon: icon,
      iconType: dir.iconType,
      clickable: true,
      usePopover: dir.usePopover,
      data: { type: 'direction', name: dir.name },
      style: {
        scale: 1,
        textColor: dir.color
      }
    });
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加四个方向彩色标记点 (不同图标类型)');
}

// 添加聚合标记点
function addClusterMarkers() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 添加10个聚合标记点
  for (let i = 0; i < 10; i++) {
    // 随机生成坐标 (较近的范围以便聚合)
    const offsetLon = (Math.random() - 0.5) * 0.02;
    const offsetLat = (Math.random() - 0.5) * 0.02;
    
    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;
    
    // 随机生成ID
    const id = `cluster-${Date.now()}-${i}`;
    
    // 添加标记点
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `聚合点 ${i + 1}`,
      clickable: true,
      clusterMode: MarkerClusterMode.CLUSTER,
      data: { type: 'cluster', index: i }
    });
  }
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加10个聚合标记点');
}

// 清除所有标记
function clearAllMarkers() {
  if (!layerRef.value) return;
  
  layerRef.value.clearMarkers();
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已清除所有标记点');
}

// 切换所有标记点的可见性
function toggleAllMarkers() {
  if (!layerRef.value) return;
  
  if (allMarkersVisible.value) {
    // 如果当前标记点可见，则隐藏所有
    layerRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
    addLog('操作', '已隐藏所有标记点');
  } else {
    // 如果当前标记点隐藏，则显示所有
    layerRef.value.showAllMarkers();
    allMarkersVisible.value = true;
    addLog('操作', '已显示所有标记点');
  }
  
  // 更新标记点列表
  updateMarkerList();
}

// 切换所有标记点标签的可见性
function toggleAllLabels() {
  if (!layerRef.value) return;
  
  if (allLabelsVisible.value) {
    // 如果当前标签可见，则隐藏所有
    layerRef.value.hideAllLabels();
    allLabelsVisible.value = false;
    addLog('操作', '已隐藏所有标记点标签');
  } else {
    // 如果当前标签隐藏，则显示所有
    layerRef.value.showAllLabels();
    allLabelsVisible.value = true;
    addLog('操作', '已显示所有标记点标签');
  }
}

// 切换标记点可见性
function toggleMarkerVisibility(marker: MarkerOptions) {
  if (!layerRef.value) return;
  
  if (marker.visible) {
    layerRef.value.hideMarker(marker.id);
    addLog('操作', `已隐藏标记点: ${marker.id.slice(-8)}`);
  } else {
    layerRef.value.showMarker(marker.id);
    addLog('操作', `已显示标记点: ${marker.id.slice(-8)}`);
  }
  
  // 更新标记点列表
  updateMarkerList();
}

// 切换标记点Popover显示状态
function toggleMarkerPopover(marker: MarkerOptions) {
  if (!layerRef.value) return;
  
  const showPopover = !marker.showPopover;
  layerRef.value.updateMarker(marker.id, {
    showPopover: showPopover
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已${showPopover ? '显示' : '隐藏'}标记点 ${marker.id.slice(-8)} 的Popover`);
}

// 移动标记点
function moveMarker(marker: MarkerOptions) {
  if (!layerRef.value) return;
  
  // 随机移动一点距离
  const lon = marker.position[0] + (Math.random() - 0.5) * 0.01;
  const lat = marker.position[1] + (Math.random() - 0.5) * 0.01;
  
  layerRef.value.updateMarker(marker.id, {
    position: [lon, lat]
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已移动标记点: ${marker.id.slice(-8)}`);
}

// 删除标记点
function removeMarker(marker: MarkerOptions) {
  if (!layerRef.value) return;
  
  layerRef.value.removeMarker(marker.id);
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已删除标记点: ${marker.id.slice(-8)}`);
}

// 更新标记点列表
function updateMarkerList() {
  if (!layerRef.value) return;
  
  const allMarkers = layerRef.value.getAllMarkers() || [];
  markers.value = allMarkers;
  
  // 更新全局标记点可见状态
  allMarkersVisible.value = allMarkers.filter(m => m.visible).length > 0;
}

// 处理地图类型变更
function handleMapTypeChange() {
  if (!layerRef.value) return;
  
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);
  addLog('操作', `切换地图类型为: ${config.mapType}`);
}

// 处理图层类型变更
function handleLayerTypeChange() {
  if (!layerRef.value) return;
  
  // 转换图层类型
  config.mapTile = tileType.value === 'normal' ? MapTile.NORMAL : (MapTile.NORMAL + 1) as MapTile;
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);
  addLog('操作', `切换图层类型为: ${tileType.value}`);
}

// 处理缩放级别变更
function handleZoomChange() {
  if (!layerRef.value) return;
  
  // 设置缩放
  layerRef.value.getMapObject().setZoom(config.zoom);
  addLog('操作', `设置缩放级别为: ${config.zoom}`);
}

// 处理交互控制变更
function handleInteractionChange() {
  if (!layerRef.value) return;
  
  // 设置交互控制
  layerRef.value.getMapObject().setInteractions({
    dragging: config.dragging,
    scrollWheelZoom: config.scrollWheelZoom
  });
  
  addLog('操作', `更新交互控制: 拖动=${config.dragging}, 滚轮缩放=${config.scrollWheelZoom}`);
}

// 添加默认显示Popover标记
function addPopoverMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  const markerId = layerRef.value.addMarker({
    id: 'pop-marker',
    position: [centerLon, centerLat],
    title: 'Popover标记',
    clickable: true,
    usePopover: true,
    showPopover: true,
    data: { type: 'pop', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是默认显示Popover的标记</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加默认显示Popover的标记');
}

// 添加带模板的标记点
function addTemplateMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 向右侧偏移位置
  const lon = centerLon + 0.005;
  const lat = centerLat;
  
  const markerId = layerRef.value.addMarker({
    id: 'template-marker',
    position: [lon, lat],
    title: '带模板标记',
    clickable: true,
    usePopover: false,
    data: { type: 'template', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是带模板的标记</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加带模板的标记点，点击时不会显示popover');
}

// 添加无模板的标记点
function addNoTemplateMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 向左侧偏移位置
  const lon = centerLon - 0.005;
  const lat = centerLat;
  
  const markerId = layerRef.value.addMarker({
    id: 'no-template-marker',
    position: [lon, lat],
    title: '无模板标记',
    clickable: true,
    usePopover: true,
    data: { type: 'no-template', importance: 'high' },
    style: {
      scale: 1.2,
      textColor: '#00a',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加无模板的标记点，将在点击时显示popover');
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
  height: 700px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.config-area {
  width: 380px;
  flex-shrink: 0;
}

.config-section {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  padding: 16px;
  height: 700px;
  overflow-y: auto;
}

.config-item {
  margin-bottom: 16px;
}

.config-item .label {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e8e8e8;
  color: #333;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.control-row > span {
  width: 100px;
  flex-shrink: 0;
}

.control-row .value {
  margin-left: 8px;
  width: 30px;
  text-align: right;
}

.buttons-row {
  display: flex;
  gap: 8px;
}

button {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

button:hover {
  border-color: #1890ff;
  color: #1890ff;
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
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.log-time {
  color: #888;
  margin-right: 8px;
}

.log-type {
  font-weight: bold;
  color: #1890ff;
  margin-right: 8px;
}

.no-logs {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.marker-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.marker-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.no-markers {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.marker-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.marker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.marker-id {
  font-weight: bold;
  font-size: 12px;
}

.marker-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

.marker-status.visible {
  background-color: #e6f7ff;
  color: #1890ff;
}

.marker-status.hidden {
  background-color: #fff1f0;
  color: #f5222d;
}

.marker-position {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
}

.marker-title {
  font-size: 13px;
  margin: 4px 0;
}

.marker-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.more-markers {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}
</style> 