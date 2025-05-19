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
              <div class="control-row">
                <span>当前分组:</span>
                <select v-model="currentGroup">
                  <option v-for="group in markerGroups" :key="group" :value="group">{{ group }}</option>
                </select>
              </div>
              <div class="control-row buttons-row">
                <button @click="addRandomMarkers(3)">添加随机标记</button>
                <button @click="clearGroupMarkers">清除当前组</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addLabeledMarkers">添加带标签标记</button>
                <button @click="addCustomIconMarkers">添加自定义图标</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleGroupMarkers">{{ isGroupVisible(currentGroup) ? '隐藏当前组' : '显示当前组' }}</button>
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
              <div class="control-row buttons-row">
                <button @click="addSimpleTrack">添加简单轨迹</button>
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
            <div class="label">分组管理</div>
            <div class="controls">
              <div class="control-row">
                <input type="text" v-model="newGroupName" placeholder="新分组名称" class="group-input" />
                <button @click="addGroup" class="add-group-btn">添加</button>
              </div>
              <div class="control-row">
                <div class="group-list">
                  <div v-for="group in markerGroups" :key="group" class="group-item">
                    <span>{{ group }}</span>
                    <button @click="removeGroup(group)" class="remove-group-btn" v-if="group !== '默认组'">&times;</button>
                  </div>
                </div>
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
const markerGroups = ref<string[]>(['默认组', '组A', '组B']);
const currentGroup = ref<string>('默认组');
const newGroupName = ref<string>('');

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
      position: [lat, lon],
      title: `${currentGroup.value} - 标记 ${i + 1}`,
      clickable: true,
      group: currentGroup.value // 添加分组属性
    });
  }
  updateMarkerList();
  addLog('操作', `已添加${count}个随机标记点到分组 ${currentGroup.value}`);
}
function clearAllMarkers() {
  if (!mapRef.value) return;
  
  mapRef.value.clearMarkers();
  
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
  
  // 使用mapRef.value.getMarkers()获取所有标记点
  const markersArray = mapRef.value.getMarkers() || [];
  markers.value = markersArray;
  
  // 检查所有标记点是否可见
  allMarkersVisible.value = markersArray.length > 0 && markersArray.every(m => m.options?.visible !== false);
}
function addSquareShape() {
  if (!mapRef.value) return;
  const center = config.center;
  // 正方形实际上是矩形，需要提供两个点作为坐标
  // 计算正方形的两个对角点坐标（西南角和东北角）
  // 在地图上大约500米的正方形
  const metersToLatLon = 0.0045; // 大约500米对应的经纬度差值
  const sw = [center[0] - metersToLatLon/2, center[1] - metersToLatLon/2];
  const ne = [center[0] + metersToLatLon/2, center[1] + metersToLatLon/2];
  
  mapRef.value.addShape({
    id: `rectangle-${Date.now()}`,
    type: 'Rectangle', // 使用Rectangle而不是Square
    coordinates: [sw, ne], // 提供两个点的坐标
    style: {
      color: 'orange',
      weight: 3,
      opacity: 1,
      fillColor: 'orange',
      fillOpacity: 0.3
    }
  });
  updateShapeList();
  addLog('操作', '已添加正方形图形');
}
function addCircleShape() {
  if (!mapRef.value) return;
  const center = config.center;
  // 创建圆形时需要提供中心点坐标和半径
  mapRef.value.addShape({
    id: `circle-${Date.now()}`,
    type: 'Circle',
    coordinates: [[center[0], center[1]]], // 注意：坐标格式为二维数组 [[lat, lng]]
    radius: 300, // 半径，单位：米
    style: {
      color: '#1890ff', // 边框颜色
      weight: 2, // 边框宽度
      opacity: 1, // 边框透明度
      fillColor: '#1890ff', // 填充颜色
      fillOpacity: 0.3 // 填充透明度
    }
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
    // 隐藏所有图形
    shapes.value.forEach((shape: any) => {
      if (shape.id) {
        mapRef.value.updateShape(shape.id, { 
          style: { 
            ...shape.options?.style,
            hidden: true 
          }
        });
      }
    });
    allShapesVisible.value = false;
    addLog('操作', '已隐藏所有图形');
  } else {
    // 显示所有图形
    shapes.value.forEach((shape: any) => {
      if (shape.id) {
        mapRef.value.updateShape(shape.id, { 
          style: { 
            ...shape.options?.style,
            hidden: false 
          }
        });
      }
    });
    allShapesVisible.value = true;
    addLog('操作', '已显示所有图形');
  }
  // 延迟更新列表，确保状态已更新
  setTimeout(() => {
    updateShapeList();
  }, 100);
}
function updateShapeList() {
  if (!mapRef.value) return;
  
  const shapeObj = mapRef.value.getToolbarObject()?.getShapeObject();
  if (!shapeObj) return;
  
  // getAllShapes返回的是Map对象，需要转换为数组
  const shapesMap = shapeObj.getAllShapes() || new Map();
  
  // 将Map对象转换为数组
  const shapesArray = Array.from(shapesMap.entries()).map(([id, shape]) => ({
    id,
    type: shape.type,
    options: shape.options,
    visible: !shape.options?.style?.hidden
  }));
  
  shapes.value = shapesArray;
  allShapesVisible.value = shapesArray.length > 0 && shapesArray.every(s => s.visible !== false);
}
// 轨迹相关
function addSampleTrack() {
  if (!mapRef.value) return;
  const center = config.center;
  // 使用当前时间往前推1小时的时间作为起始点
  const endTime = Math.floor(Date.now() / 1000); // 当前时间（秒）
  const startTime = endTime - 3600; // 1小时前（秒）
  
  // 创建更详细的轨迹点位数组，距离和时间间隔不一致，以模拟真实轨迹
  const points = [];
  
  // 生成15个轨迹点，确保每段距离和时间间隔不同，以产生不同速度
  const segmentCount = 15;
  
  for (let i = 0; i < segmentCount; i++) {
    // 时间间隔不均匀，用于模拟不同的停留和移动
    const timeProgress = i / (segmentCount - 1); // 0到1之间的进度
    // 非线性时间分布，中间部分走得慢，开始和结束走得快
    const timeOffset = timeProgress < 0.3 ? 
                      timeProgress * 1000 : // 开始阶段快
                      (timeProgress > 0.7 ? 
                       (timeProgress - 0.7) * 1200 + 1800 : // 结束阶段快
                       timeProgress * 600 + 300); // 中间阶段慢
    
    const timestamp = Math.floor(startTime + timeOffset);
    
    // 距离也不均匀，以模拟不同速度的移动
    let latOffset, lngOffset;
    
    if (i < 3) {
      // 开始阶段 - 小幅移动，适合测试慢速图标
      latOffset = 0.002 * (i + 1) * (Math.random() * 0.5 + 0.8);
      lngOffset = 0.003 * (i + 1) * (Math.random() * 0.5 + 0.8);
    } else if (i < 7) {
      // 中间阶段1 - 大幅移动，适合测试中速图标
      latOffset = 0.004 * (i + 1) * (Math.random() * 0.3 + 0.9);
      lngOffset = 0.005 * (i + 1) * (Math.random() * 0.3 + 0.9);
    } else if (i < 12) {
      // 中间阶段2 - 快速移动，适合测试高速图标
      latOffset = 0.006 * (i + 0.8) * (Math.random() * 0.2 + 0.9);
      lngOffset = 0.007 * (i + 0.8) * (Math.random() * 0.2 + 0.9);
    } else {
      // 结束阶段 - 减速移动
      latOffset = 0.004 * (segmentCount - i + 1) * (Math.random() * 0.4 + 0.8);
      lngOffset = 0.004 * (segmentCount - i + 1) * (Math.random() * 0.4 + 0.8);
    }
    
    // 添加一些方向性变化，使轨迹更自然
    const direction = i % 4;
    switch (direction) {
      case 0: // 向东北方向
        points.push({ 
          lat: center[0] + latOffset, 
          lng: center[1] + lngOffset, 
          timestamp,
          // 添加额外属性，便于在轨迹播放时显示
          properties: {
            speed: 20 + Math.random() * 60, // 模拟速度 km/h
            heading: 45 + Math.random() * 10, // 模拟方向
            altitude: 100 + Math.random() * 10, // 模拟高度
            name: i === 0 ? '起点' : (i === segmentCount - 1 ? '终点' : `路径点${i+1}`)
          }
        });
        break;
      case 1: // 向东南方向
        points.push({ 
          lat: center[0] - latOffset, 
          lng: center[1] + lngOffset, 
          timestamp,
          properties: {
            speed: 30 + Math.random() * 70, // 更高速度
            heading: 135 + Math.random() * 10,
            altitude: 100 + Math.random() * 15,
            name: i === 0 ? '起点' : (i === segmentCount - 1 ? '终点' : `路径点${i+1}`)
          }
        });
        break;
      case 2: // 向西南方向
        points.push({ 
          lat: center[0] - latOffset, 
          lng: center[1] - lngOffset, 
          timestamp,
          properties: {
            speed: 40 + Math.random() * 90, // 高速
            heading: 225 + Math.random() * 10,
            altitude: 100 + Math.random() * 20,
            name: i === 0 ? '起点' : (i === segmentCount - 1 ? '终点' : `路径点${i+1}`)
          }
        });
        break;
      case 3: // 向西北方向
        points.push({ 
          lat: center[0] + latOffset, 
          lng: center[1] - lngOffset, 
          timestamp,
          properties: {
            speed: 15 + Math.random() * 40, // 慢速
            heading: 315 + Math.random() * 10,
            altitude: 100 - Math.random() * 15,
            name: i === 0 ? '起点' : (i === segmentCount - 1 ? '终点' : `路径点${i+1}`)
          }
        });
        break;
    }
  }
  
  // 添加轨迹到地图
  const currentTime = new Date();
  const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
  
  mapRef.value.addTrack({ 
    id: `track-${Date.now()}`, 
    name: `示例轨迹 (${formattedTime})`, 
    points,
    options: {
      // 添加更多选项以测试轨迹播放功能
      showNodes: true,
      showNodeNames: true,
      showSpeed: true,
      loop: true,  // 循环播放
      withCamera: false, // 默认不跟随相机
      speedFactor: 2.0 // 加快播放速度
    }
  });
  
  addLog('轨迹', `已添加示例轨迹，包含${points.length}个点位，时间范围：${new Date(startTime*1000).toLocaleTimeString()}-${new Date(endTime*1000).toLocaleTimeString()}`);
}

// 添加一个简单的轨迹示例（使用Canvas绘制，确保所有点位显示）
function addSimpleTrack() {
  if (!mapRef.value) return;
  const center = config.center;
  
  // 当前时间作为结束时间
  const endTime = Math.floor(Date.now() / 1000);
  // 半小时前作为开始时间
  const startTime = endTime - 1800;
  
  // 创建一个简单的轨迹，形成一个闭环
  const points = [];
  
  // 生成8个轨迹点形成一个正方形
  const positions = [
    [0.01, 0.01],    // 右上
    [0.01, -0.01],   // 右下
    [-0.01, -0.01],  // 左下
    [-0.01, 0.01],   // 左上
    [0, 0.015],      // 上中
    [0.015, 0],      // 右中
    [0, -0.015],     // 下中
    [-0.015, 0]      // 左中
  ];
  
  // 均匀分配时间
  const timeStep = Math.floor(1800 / positions.length);
  
  // 创建每个点位
  positions.forEach((pos, index) => {
    const timestamp = startTime + index * timeStep;
    const speed = 20 + index * 5; // 速度逐渐增加
    
    points.push({
      lat: center[0] + pos[0],
      lng: center[1] + pos[1],
      timestamp,
      properties: {
        speed: speed,
        heading: index * 45, // 每个点旋转45度
        altitude: 100,
        name: index === 0 ? '起点' : (index === positions.length - 1 ? '终点' : `点${index+1}`)
      }
    });
  });
  
  // 添加轨迹到地图，使用Canvas渲染
  const currentTime = new Date();
  const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
  
  mapRef.value.addTrack({
    id: `simple-track-${Date.now()}`,
    name: `简单轨迹 (${formattedTime})`,
    points,
    options: {
      showNodes: true,
      showNodeNames: true,
      showSpeed: true,
      loop: true,
      withCamera: true,
      speedFactor: 1.0,
      // Canvas绘制相关选项
      renderAllPoints: true,
      passedLineOptions: {
        color: '#ff5722',
        weight: 6
      },
      notPassedLineOptions: {
        color: '#2196f3',
        weight: 6
      },
      // 轨迹速度分组
      trackSpeedGroup: [
        { speed: 0, icon: '/images/marker-slow.png' },
        { speed: 30, icon: '/images/marker-medium.png' },
        { speed: 60, icon: '/images/marker-fast.png' }
      ]
    }
  });
  
  addLog('轨迹', `已添加简单轨迹，包含${points.length}个点位，使用Canvas绘制以确保所有点位显示`);
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

// 添加带标签的标记点
function addLabeledMarkers() {
  if (!mapRef.value) return;
  const center = config.center;
  
  // 添加三个带有永久标签的标记点
  for (let i = 0; i < 3; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.05;
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const lon = center[1] + offsetLon;
    const lat = center[0] + offsetLat;
    
    mapRef.value.addMarker({
      id: `labeled-marker-${Date.now()}-${i}`,
      position: [lat, lon], // 注意: 坐标格式为[lat, lng]
      title: `${currentGroup.value} - 带标签标记 ${i + 1}`,
      showLabel: true, // 显示永久标签
      labelOptions: {
        permanent: true,
        direction: 'top',
        className: 'custom-marker-label',
        offset: [0, -10],
        opacity: 1.0
      },
      icon: {
        backgroundColor: i === 0 ? '#ff4500' : (i === 1 ? '#1890ff' : '#4caf50'), // 不同颜色
        iconSize: [24, 24]
      },
      clickable: true,
      group: currentGroup.value // 添加分组属性
    });
  }
  
  updateMarkerList();
  addLog('操作', `已添加3个带标签的标记点到分组 ${currentGroup.value}`);
}

// 添加自定义图标的标记点
function addCustomIconMarkers() {
  if (!mapRef.value) return;
  const center = config.center;
  
  // 图标URL数组
  const iconUrls = [
    'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    // 使用FontAwesome SVG作为图标HTML
    null // 使用HTML自定义图标
  ];
  
  for (let i = 0; i < iconUrls.length; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.07;
    const offsetLat = (Math.random() - 0.5) * 0.07;
    const lon = center[1] + offsetLon;
    const lat = center[0] + offsetLat;
    
    let markerOptions: any = {
      id: `icon-marker-${Date.now()}-${i}`,
      position: [lat, lon],
      title: `${currentGroup.value} - 自定义图标 ${i + 1}`,
      clickable: true,
      data: { type: 'custom-icon' },
      group: currentGroup.value // 添加分组属性
    };
    
    if (i < 2) {
      // 使用URL图标
      markerOptions.icon = {
        iconUrl: iconUrls[i],
        iconSize: i === 0 ? [25, 41] : [35, 57],
        iconAnchor: i === 0 ? [12, 41] : [17, 57],
        popupAnchor: [0, -41],
        className: 'custom-icon-marker'
      };
    } else {
      // 使用HTML自定义图标
      markerOptions.icon = {
        html: `<div class="custom-html-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#e74c3c" d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"/>
                </svg>
              </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        className: 'custom-html-marker'
      };
      
      // 添加弹出窗口内容
      markerOptions.popupContent = `
        <div class="marker-popup">
          <b>${currentGroup.value} - 自定义HTML图标</b><br>
          坐标: [${lat.toFixed(4)}, ${lon.toFixed(4)}]
        </div>
      `;
    }
    
    mapRef.value.addMarker(markerOptions);
  }
  
  updateMarkerList();
  addLog('操作', `已添加3个自定义图标标记点到分组 ${currentGroup.value}`);
}

function isGroupVisible(group: string): boolean {
  const groupMarkers = getGroupMarkers(group);
  return groupMarkers.length > 0 && groupMarkers.every(m => m.options?.visible !== false);
}

function toggleGroupMarkers() {
  if (!mapRef.value) return;
  
  const visible = !isGroupVisible(currentGroup.value);
  
  // 获取所有标记点
  const markers = getGroupMarkers(currentGroup.value);
  
  // 更新每个标记点的可见性
  markers.forEach(marker => {
    mapRef.value.updateMarker(marker.id, { visible });
  });
  
  updateMarkerList();
  addLog('操作', `已${visible ? '显示' : '隐藏'}分组 ${currentGroup.value} 的标记点`);
}

function clearGroupMarkers() {
  if (!mapRef.value) return;
  
  // 获取当前分组的所有标记点
  const markers = getGroupMarkers(currentGroup.value);
  
  // 删除每个标记点
  markers.forEach(marker => {
    mapRef.value.removeMarker(marker.id);
  });
  
  updateMarkerList();
  addLog('操作', `已清除分组 ${currentGroup.value} 的标记点，共${markers.length}个`);
}

function addGroup() {
  if (!newGroupName.value.trim()) {
    addLog('分组', '分组名称不能为空');
    return;
  }
  
  if (markerGroups.value.includes(newGroupName.value)) {
    addLog('分组', `分组 ${newGroupName.value} 已存在`);
    return;
  }
  
  markerGroups.value.push(newGroupName.value);
  // 切换到新分组
  currentGroup.value = newGroupName.value;
  newGroupName.value = '';
  
  addLog('分组', `成功添加分组: ${currentGroup.value}`);
}

function removeGroup(group: string) {
  if (group === '默认组') {
    addLog('分组', '不能删除默认组');
    return;
  }
  
  // 获取该分组的所有标记点
  const groupMarkers = getGroupMarkers(group);
  
  // 如果有标记点，提示并移到默认组
  if (groupMarkers.length > 0) {
    groupMarkers.forEach(marker => {
      mapRef.value.updateMarker(marker.id, { group: '默认组' });
    });
    addLog('分组', `已将分组 ${group} 的 ${groupMarkers.length} 个标记点移至默认组`);
  }
  
  // 如果当前选中的是要删除的分组，切换到默认分组
  if (currentGroup.value === group) {
    currentGroup.value = '默认组';
  }
  
  // 从分组列表中删除
  markerGroups.value = markerGroups.value.filter(g => g !== group);
  
  addLog('分组', `成功删除分组: ${group}`);
  updateMarkerList();
}

// 添加获取分组标记点的辅助方法
function getGroupMarkers(group: string): any[] {
  if (!mapRef.value) return [];
  
  // 使用updateMarkerList方法获取所有标记点
  updateMarkerList();
  
  // 过滤出指定分组的标记点
  return markers.value.filter(marker => marker.options?.group === group);
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

/* 自定义标记样式 */
:deep(.custom-marker-label) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #1890ff;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

:deep(.custom-html-icon) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

:deep(.marker-popup) {
  padding: 5px;
  min-width: 150px;
  text-align: center;
}

:deep(.custom-html-marker) {
  background: none;
  border: none;
}

:deep(.custom-icon-marker) {
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3));
}

.group-input {
  flex: 1;
  height: 26px;
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-right: 8px;
}

.add-group-btn {
  width: 60px;
}

.group-list {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.remove-group-btn {
  margin-left: 6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #999;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  border-radius: 50%;
  flex: none;
}

.remove-group-btn:hover {
  color: #ff4d4f;
  background-color: #fff;
}
</style> 