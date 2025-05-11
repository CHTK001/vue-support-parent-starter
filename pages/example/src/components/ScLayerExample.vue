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
            :show-scale-line="config.showScaleLine"
            @map-initialized="onMapInit"
            @map-click="onMapClick"
            @marker-click="onMarkerClick"
            @toolbar-state-change="onToolbarStateChange"
            @marker-create="onMarkerCreate"
            @marker-update="onMarkerUpdate"
            @marker-delete="onMarkerDelete"
            @shape-create="onShapeCreate"
            @shape-update="onShapeUpdate"
            @shape-delete="onShapeDelete">
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
                  <option value="hybrid">混合图层</option>
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
                <span>比例尺:</span>
                <input type="checkbox" v-model="config.showScaleLine" @change="handleScaleLineChange">
              </div>
              <div class="control-row">
                <span>缩放级别:</span>
                <input type="range" v-model.number="config.zoom" min="3" max="18" @change="handleZoomChange">
                <span class="value">{{ config.zoom }}</span>
              </div>
              <div class="control-row">
                <span>快速切换:</span>
              </div>
              <div class="control-row buttons-row">
                <button 
                  @click="switchToLayer(MapType.GAODE, MapTile.NORMAL)" 
                  :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile.NORMAL }">
                  高德标准
                </button>
                <button 
                  @click="switchToLayer(MapType.GAODE, MapTile.SATELLITE)" 
                  :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile.SATELLITE }">
                  高德卫星
                </button>
              </div>
              <div class="control-row buttons-row">
                <button 
                  @click="switchToLayer(MapType.OSM, MapTile.NORMAL)" 
                  :class="{ 'active-button': config.mapType === MapType.OSM && config.mapTile === MapTile.NORMAL }">
                  OSM地图
                </button>
                <button 
                  @click="switchToLayer(MapType.TIANDI, MapTile.NORMAL)" 
                  :class="{ 'active-button': config.mapType === MapType.TIANDI && config.mapTile === MapTile.NORMAL }">
                  天地图
                </button>
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
            <div class="label">图形操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addSquareShape">添加正方形</button>
                <button @click="addCircleShape">添加圆形</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addRectangleShape">添加矩形</button>
                <button @click="addPolygonShape">添加多边形</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addLineShape">添加线段</button>
                <button @click="addPointShape">添加点</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addCustomShapeExample">添加复合图形示例</button>
                <button @click="clearAllShapes">清除所有图形</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleShapeVisible">{{ allShapesVisible ? '隐藏所有图形' : '显示所有图形' }}</button>
                <button @click="modifyRandomShape">修改随机图形</button>
              </div>
            </div>
          </div>

          <!-- 添加轨迹操作部分 -->
          <div class="config-item">
            <div class="label">轨迹操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="addSampleTrack">添加示例轨迹</button>
                <button @click="addMultipleTrack">添加多条轨迹</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addCircularTrack">添加环形轨迹</button>
                <button @click="addZigzagTrack">添加Z字型轨迹</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="playTrack">播放轨迹</button>
                <button @click="stopTrack">停止轨迹</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="clearAllTracks">清除所有轨迹</button>
                <button @click="toggleTrackVisible">{{ allTracksVisible ? '隐藏所有轨迹' : '显示所有轨迹' }}</button>
              </div>
            </div>
          </div>

          <!-- 添加热力图操作部分 -->
          <div class="config-item">
            <div class="label">热力图操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <button @click="enableHeatmap">启用热力图</button>
                <button @click="disableHeatmap">禁用热力图</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addRandomHeatmapPoints(20)">添加随机热力点</button>
                <button @click="addClusteredHeatmapPoints">添加聚类热力点</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addWeightedHeatmapPoints">添加权重热力点</button>
                <button @click="clearHeatmap">清除热力图</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="configureHeatmap">配置热力图样式</button>
                <button @click="togglePointsVisible">{{ pointsVisible ? '隐藏数据点' : '显示数据点' }}</button>
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
                  <span class="marker-id">ID: {{ safeSlice(marker.id) }}</span>
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
            <div class="label">图形列表</div>
            <div class="shape-stats">
              <span>总数: {{ shapes.length }}</span>
              <span>可见: {{ allShapesVisible ? shapes.length : 0 }}</span>
            </div>
            <div class="shape-list">
              <div v-if="shapes.length === 0" class="no-shapes">
                暂无图形
              </div>
              <div v-for="shape in shapes.slice(0, 5)" :key="shape.id" class="shape-item">
                <div class="shape-header">
                  <span class="shape-id">ID: {{ safeSlice(shape.id) }}</span>
                  <span class="shape-type">类型: {{ getShapeTypeName(shape.type) }}</span>
                </div>
                <div class="shape-data" v-if="shape.data">
                  <template v-if="typeof shape.data === 'object'">
                    <div v-for="(value, key) in shape.data" :key="key" class="shape-data-item">
                      {{ key }}: {{ value }}
                    </div>
                  </template>
                  <template v-else>
                    数据: {{ shape.data }}
                  </template>
                </div>
              </div>
              <div v-if="shapes.length > 5" class="more-shapes">
                还有 {{ shapes.length - 5 }} 个图形未显示...
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
import { ref, reactive, computed, onMounted, type Ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ScLayer from '@repo/components/ScLayer/index.vue';
import { 
  LogLevel, 
  MapType, 
  MapTile, 
  MarkerObject,
  Shape,
  TrackObject,
  MarkerClusterMode,
  DEFAULT_MAP_CONFIG
} from '@repo/components/ScLayer';
import type { ShapeOption, Track, TrackPlayer } from '@repo/components/ScLayer';
import type { HeatmapPoint, HeatmapConfig } from '@repo/components/ScLayer/types/heatmap';

// 地图实例引用
const layerRef = ref(null);

// 热力图相关
const heatmapPoints = ref<Array<HeatmapPoint>>([]);
const pointsVisible = ref(false);

// 创建一个Shape枚举常量
const ShapeType = {
  POINT: 'Point',
  LINE: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  SQUARE: 'Square'
};

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
  showToolbar: true,
  showScaleLine: true // 默认显示比例尺
});

// 标记点数据
const markers = ref<any[]>([]);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);

// 图形数据
const shapes = ref<ShapeOption[]>([]);
const allShapesVisible = ref(true);

// 轨迹相关状态
const tracks = ref<{ id: string; name: string; points: any[]; visible: boolean }[]>([]);
const allTracksVisible = ref(true);
const hasTrack = ref(false);

// 计算可见标记点数量
const visibleMarkerCount = computed(() => {
  return markers.value.filter(marker => marker.visible).length;
});

// 事件日志
const logs = reactive([]);

// 安全地获取ID的后8位字符
function safeSlice(id: any): string {
  if (!id) return '无ID';
  return typeof id === 'string' ? id.slice(-8) : String(id);
}

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
  
  // 更新图形列表
  updateShapeList();
  
  // 更新图层类型显示
  updateLayerTypeDisplay();
}

// 地图点击事件
function onMapClick(evt) {
  const coordinates = evt.coordinates;
  addLog('点击', `地图坐标: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 标记点击事件
function onMarkerClick(evt) {
  const data = evt.data;
  const markerId = data?.id;
  addLog('点击', `标记点: ${data.title || '未命名'} [ID: ${safeSlice(markerId)}]`);
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
function toggleMarkerVisibility(marker: any) {
  if (!layerRef.value) return;
  
  if (marker.visible) {
    layerRef.value.hideMarker(marker.id);
    addLog('操作', `已隐藏标记点: ${safeSlice(marker.id)}`);
  } else {
    layerRef.value.showMarker(marker.id);
    addLog('操作', `已显示标记点: ${safeSlice(marker.id)}`);
  }
  
  // 更新标记点列表
  updateMarkerList();
}

// 切换标记点Popover显示状态
function toggleMarkerPopover(marker: any) {
  if (!layerRef.value) return;
  
  const showPopover = !marker.showPopover;
  layerRef.value.updateMarker(marker.id, {
    showPopover: showPopover
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已${showPopover ? '显示' : '隐藏'}标记点 ${safeSlice(marker.id)} 的Popover`);
}

// 移动标记点
function moveMarker(marker: any) {
  if (!layerRef.value) return;
  
  // 随机移动一点距离
  const lon = marker.position[0] + (Math.random() - 0.5) * 0.01;
  const lat = marker.position[1] + (Math.random() - 0.5) * 0.01;
  
  layerRef.value.updateMarker(marker.id, {
    position: [lon, lat]
  });
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已移动标记点: ${safeSlice(marker.id)}`);
}

// 删除标记点
function removeMarker(marker: any) {
  if (!layerRef.value) return;
  
  layerRef.value.removeMarker(marker.id);
  
  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已删除标记点: ${safeSlice(marker.id)}`);
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
  
  // 更新图层类型显示
  updateLayerTypeDisplay();
  
  addLog('操作', `切换地图类型为: ${config.mapType}`);
}

// 处理图层类型变更
function handleLayerTypeChange() {
  if (!layerRef.value) return;
  
  // 转换图层类型
  switch (tileType.value) {
    case 'normal':
      config.mapTile = MapTile.NORMAL;
      break;
    case 'satellite':
      config.mapTile = MapTile.SATELLITE;
      break;
    case 'hybrid':
      config.mapTile = MapTile.HYBRID;
      break;
    default:
      config.mapTile = MapTile.NORMAL;
  }
  
  // 切换地图图层
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);
  
  addLog('操作', `切换图层类型为: ${getMapTileName(config.mapTile)}`);
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
  
  addLog('用户交互', `地图交互状态变更: 拖动=${config.dragging}, 滚轮缩放=${config.scrollWheelZoom}`);
  
  layerRef.value.setInteractions({
    dragging: config.dragging,
    scrollWheelZoom: config.scrollWheelZoom
  });
}

// 处理比例尺显示变化
function handleScaleLineChange() {
  if (!layerRef.value) return;
  
  addLog('比例尺', `比例尺显示状态: ${config.showScaleLine ? '显示' : '隐藏'}`);
  
  // 注意：由于使用props传递，配置变更会自动更新，不需要额外调用方法
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

// 添加正方形图形
function addSquareShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 创建一个正方形，边长为500米
  const id = layerRef.value.addSquare(
    [centerLon, centerLat], 
    500, 
    {
      id: `square-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 165, 0, 0.3)' },
        stroke: { color: 'orange', width: 3 }
      },
      data: { type: 'square', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('操作', `已添加正方形图形，ID: ${id}`);
}

// 添加圆形图形
function addCircleShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 向右上角偏移位置
  const lon = centerLon + 0.01;
  const lat = centerLat + 0.01;
  
  // 创建一个圆，半径为300米
  const id = layerRef.value.addCircle(
    [lon, lat], 
    300, 
    {
      id: `circle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.3)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'circle', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('操作', `已添加圆形图形，ID: ${id}`);
}

// 添加矩形图形
function addRectangleShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 向左下角偏移
  const minLon = centerLon - 0.02;
  const minLat = centerLat - 0.02;
  const maxLon = centerLon - 0.005;
  const maxLat = centerLat - 0.005;
  
  // 创建一个矩形
  const id = layerRef.value.addRectangle(
    [minLon, minLat], 
    [maxLon, maxLat], 
    {
      id: `rectangle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.3)' },
        stroke: { color: '#52c41a', width: 2, lineDash: [5, 5] }
      },
      data: { type: 'rectangle', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('操作', `已添加矩形图形，ID: ${id}`);
}

// 添加多边形图形
function addPolygonShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 构建三角形的三个顶点
  const coordinates = [
    [centerLon + 0.02, centerLat],
    [centerLon + 0.01, centerLat + 0.015],
    [centerLon + 0.03, centerLat + 0.015],
  ];
  
  // 创建一个多边形（三角形）
  const id = layerRef.value.addPolygon(
    coordinates, 
    {
      id: `polygon-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.3)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'polygon', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('操作', `已添加多边形图形（三角形），ID: ${id}`);
}

// 添加线段图形
function addLineShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 创建一条线的坐标
  const coordinates = [
    [centerLon - 0.02, centerLat + 0.02],
    [centerLon, centerLat + 0.03],
    [centerLon + 0.02, centerLat + 0.02]
  ];
  
  // 创建一条线
  const id = layerRef.value.addLine(
    coordinates, 
    {
      id: `line-${Date.now()}`,
      style: {
        stroke: { color: '#722ed1', width: 4, lineDash: [10, 5] }
      },
      data: { type: 'line', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('操作', `已添加线段图形，ID: ${id}`);
}

// 添加点图形
function addPointShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 向上方偏移位置
  const lon = centerLon;
  const lat = centerLat + 0.02;
  
  // 创建一个点
  const id = layerRef.value.addPoint(
    [lon, lat], 
    {
      id: `point-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 8, // 点的半径
        zIndex: 10 // 置于其他图形之上
      },
      data: { type: 'point', createdAt: new Date().toISOString() }
    }
  );
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', `已添加点图形，ID: ${id}`);
}

// 添加复合图形示例
function addCustomShapeExample() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 创建一个正方形作为基础
  const squareId = layerRef.value.addSquare(
    [centerLon, centerLat], 
    600, 
    {
      id: `complex-base-${Date.now()}`,
      style: {
        fill: { color: 'rgba(230, 230, 230, 0.5)' },
        stroke: { color: '#333333', width: 2 }
      },
      data: { type: 'complex-base', part: 'base' }
    }
  );
  
  // 在四个角添加圆形
  const radius = 100;
  const offset = 300 * 0.7; // 正方形的一半乘以0.7，使圆在角落位置
  
  // 右上角圆形
  layerRef.value.addCircle(
    [centerLon + offset/111000, centerLat + offset/111000], 
    radius, 
    {
      id: `complex-circle-ne-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.6)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'complex-part', part: 'northeast' }
    }
  );
  
  // 左上角圆形
  layerRef.value.addCircle(
    [centerLon - offset/111000, centerLat + offset/111000], 
    radius, 
    {
      id: `complex-circle-nw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.6)' },
        stroke: { color: '#52c41a', width: 2 }
      },
      data: { type: 'complex-part', part: 'northwest' }
    }
  );
  
  // 左下角圆形
  layerRef.value.addCircle(
    [centerLon - offset/111000, centerLat - offset/111000], 
    radius, 
    {
      id: `complex-circle-sw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(250, 173, 20, 0.6)' },
        stroke: { color: '#faad14', width: 2 }
      },
      data: { type: 'complex-part', part: 'southwest' }
    }
  );
  
  // 右下角圆形
  layerRef.value.addCircle(
    [centerLon + offset/111000, centerLat - offset/111000], 
    radius, 
    {
      id: `complex-circle-se-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.6)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'complex-part', part: 'southeast' }
    }
  );
  
  // 添加中心点
  layerRef.value.addPoint(
    [centerLon, centerLat], 
    {
      id: `complex-center-${Date.now()}`,
      style: {
        fill: { color: 'rgba(0, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 10
      },
      data: { type: 'complex-part', part: 'center' }
    }
  );
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', '已添加复合图形示例');
}

// 清除所有图形
function clearAllShapes() {
  if (!layerRef.value) return;
  
  layerRef.value.clearAllShapes();
  addLog('操作', '已清除所有图形');
}

// 切换所有图形的可见性
function toggleShapeVisible() {
  if (!layerRef.value || !layerRef.value.getShapeObject) return;
  
  const shapeObj = layerRef.value.getShapeObject();
  if (!shapeObj) return;
  
  if (allShapesVisible.value) {
    // 隐藏所有图形
    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: false });
      }
    });
    allShapesVisible.value = false;
    addLog('操作', '已隐藏所有图形');
  } else {
    // 显示所有图形
    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: true });
      }
    });
    allShapesVisible.value = true;
    addLog('操作', '已显示所有图形');
  }
  
  // 更新图形列表
  updateShapeList();
}

// 随机修改一个图形的样式
function modifyRandomShape() {
  if (!layerRef.value || shapes.value.length === 0) return;
  
  // 随机选择一个图形
  const randomIndex = Math.floor(Math.random() * shapes.value.length);
  const shape = shapes.value[randomIndex];
  
  if (!shape || !shape.id) {
    addLog('操作', '没有可修改的图形');
    return;
  }
  
  // 生成随机颜色
  const randomColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  
  // 修改图形样式
  layerRef.value.updateShape(shape.id, {
    style: {
      fill: { color: randomColor },
      stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 5) + 1 }
    }
  });
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', `已随机修改图形样式，ID: ${safeSlice(shape.id)}`);
}

// 更新图形列表
function updateShapeList() {
  if (!layerRef.value || !layerRef.value.getAllShapes) return;
  
  const allShapes = layerRef.value.getAllShapeDatas() || [];
  shapes.value = allShapes;
  // 检查图形可见性状态
  allShapesVisible.value = allShapes.length > 0 && allShapes.every(s => s.visible !== false);
}

// 获取图形类型名称
function getShapeTypeName(type: string): string {
  const typeNames = {
    [ShapeType.POINT]: '点',
    [ShapeType.LINE]: '线',
    [ShapeType.POLYGON]: '多边形',
    [ShapeType.CIRCLE]: '圆形',
    [ShapeType.RECTANGLE]: '矩形',
    [ShapeType.SQUARE]: '正方形'
  };
  
  return typeNames[type] || '未知类型';
}

// 切换图形可见性
function toggleShapeVisibility(shape: any) {
  if (!layerRef.value) return;
  
  const newVisible = shape.visible === false; // 如果当前是隐藏的，则显示
  
  layerRef.value.updateShape(shape.id, {
    visible: newVisible
  });
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', `已${newVisible ? '显示' : '隐藏'}图形: ${safeSlice(shape.id)}`);
}

// 修改图形样式
function changeShapeStyle(shape: any) {
  if (!layerRef.value) return;
  
  // 根据图形类型生成不同的随机样式
  let style: any = {};
  
  // 随机颜色
  const randomFillColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  
  // 基础样式
  style = {
    fill: { color: randomFillColor },
    stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 4) + 1 }
  };
  
  // 对于点类型，增加半径属性
  if (shape.type === ShapeType.POINT) {
    style.radius = Math.floor(Math.random() * 10) + 5;
  }
  
  // 应用样式变更
  layerRef.value.updateShape(shape.id, { style });
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', `已修改图形样式: ${safeSlice(shape.id)}`);
}

// 删除图形
function removeShape(shape: any) {
  if (!layerRef.value) return;
  
  layerRef.value.removeShape(shape.id);
  
  // 更新图形列表
  updateShapeList();
  addLog('操作', `已删除图形: ${safeSlice(shape.id)}`);
}


// 更新显示的图层类型（根据配置中的实际值）
function updateLayerTypeDisplay() {
  // 根据 config.mapTile 设置 tileType 显示值
  switch (config.mapTile) {
    case MapTile.NORMAL:
      tileType.value = 'normal';
      break;
    case MapTile.SATELLITE:
      tileType.value = 'satellite';
      break;
    case MapTile.HYBRID:
      tileType.value = 'hybrid';
      break;
    default:
      tileType.value = 'normal';
  }
}

// 处理工具栏状态变更
function onToolbarStateChange(state) {
  const { toolId, active, toolType, data } = state;
  
  // 记录工具栏状态变化
  addLog('工具栏', `工具ID: ${toolId}, 激活状态: ${active}, 类型: ${toolType}`);
  
  // 检测图层面板关闭事件
  if (toolId === 'layer-switch' && !active) {
    addLog('图层', '图层选择面板已关闭');
    // 确保UI更新为最新的图层类型
    updateLayerTypeDisplay();
  }
  
  // 检测图层变更事件
  if (toolId === 'layer-change' && data) {
    addLog('图层', `图层已变更为: ${data.mapType} - ${data.mapTile}`);
    // 更新本地配置
    config.mapType = data.mapType;
    config.mapTile = data.mapTile;
    // 更新UI显示
    updateLayerTypeDisplay();
  }
}

// 切换到指定地图类型和图层类型
function switchToLayer(mapType: MapType, mapTile: MapTile) {
  if (!layerRef.value) return;
  
  // 更新本地配置
  config.mapType = mapType;
  config.mapTile = mapTile;
  
  // 切换地图图层
  layerRef.value.changeMapLayer(mapType, mapTile);
  
  // 更新UI显示
  updateLayerTypeDisplay();
  
  addLog('操作', `切换地图: ${mapType} - ${getMapTileName(mapTile)}`);
}

// 获取图层类型名称
function getMapTileName(mapTile: MapTile): string {
  switch (mapTile) {
    case MapTile.NORMAL:
      return '标准图层';
    case MapTile.SATELLITE:
      return '卫星图层';
    case MapTile.HYBRID:
      return '混合图层';
    default:
      return '未知图层';
  }
}

// 添加标记创建事件处理函数
function onMarkerCreate(evt) {
  const { id, options } = evt;
  const title = options.title || '未命名标记';
  addLog('创建', `标记点已创建: ${title} [ID: ${safeSlice(id)}]`);
  
  // 更新标记点列表
  updateMarkerList();
}

// 添加标记更新事件处理函数
function onMarkerUpdate(evt) {
  const { id, options } = evt;
  const position = options.position ? `[${options.position[0].toFixed(4)}, ${options.position[1].toFixed(4)}]` : '位置未变';
  addLog('更新', `标记点已更新: [ID: ${safeSlice(id)}] ${position}`);
  
  // 更新标记点列表
  updateMarkerList();
}

// 添加标记删除事件处理函数
function onMarkerDelete(evt) {
  const { id } = evt;
  addLog('删除', `标记点已删除: [ID: ${safeSlice(id)}]`);
  
  // 更新标记点列表
  updateMarkerList();
}

// 添加图形创建事件处理函数
function onShapeCreate(evt) {
  const { id, options } = evt;
  const type = getShapeTypeName(options.type);
  addLog('创建', `图形已创建: ${type} [ID: ${safeSlice(id)}]`);
  
  // 更新图形列表
  updateShapeList();
}

// 添加图形更新事件处理函数
function onShapeUpdate(evt) {
  const { id, options } = evt;
  addLog('更新', `图形已更新: [ID: ${safeSlice(id)}]`);
  
  // 更新图形列表
  updateShapeList();
}

// 添加图形删除事件处理函数
function onShapeDelete(evt) {
  const { id } = evt;
  addLog('删除', `图形已删除: [ID: ${safeSlice(id)}]`);
  
  // 更新图形列表
  updateShapeList();
}

// 添加示例轨迹
const addSampleTrack = () => {
  try {
    // 创建示例轨迹数据
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    
    // 生成一条简单的轨迹，沿着当前视图中心向东前进
    for (let i = 0; i < 20; i++) {
      const offset = i * 0.005; // 每步骤移动的距离
      points.push({
        lat: center[0], 
        lng: center[1] + offset,
        time: now + i * 60, // 每分钟一个点
        dir: 90,  // 向东
        title: `轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '45 km/h' },
          { key: '方向', value: '90°' }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'sample-track-' + Math.floor(Math.random() * 1000),
      name: '示例轨迹',
      points: points,
      color: '#FF5252',
      visible: true
    };
    
    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加示例轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加示例轨迹失败: ${e}`);
  }
};

// 添加多条轨迹
const addMultipleTrack = () => {
  try {
    const center = config.center;
    const tracksToAdd = [];
    
    // 生成四条不同方向的轨迹
    const directions = ['north', 'east', 'south', 'west'];
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107'];
    
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];
      const points = generateDirectionalTrack(center, direction, 0.05, 10);
      
      tracksToAdd.push({
        id: `track-${direction}-${Math.floor(Math.random() * 1000)}`,
        name: `${getDirectionName(direction)}向轨迹`,
        points: points,
        color: colors[i],
        visible: true
      });
    }
    
    // 添加所有轨迹
    if (layerRef.value) {
      let addedCount = 0;
      tracksToAdd.forEach(track => {
        try {
          layerRef.value.addTrack(track);
          tracks.value.push(track);
          addedCount++;
        } catch (e) {
          addLog('error', `添加轨迹 ${track.name} 失败: ${e}`);
        }
      });
      
      if (addedCount > 0) {
        hasTrack.value = true;
        addLog('info', `已添加 ${addedCount} 条轨迹`);
      } else {
        addLog('warn', '未能添加任何轨迹');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加多条轨迹失败: ${e}`);
  }
};

// 添加环形轨迹
const addCircularTrack = () => {
  try {
    // 创建圆形轨迹数据
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const radius = 0.02; // 半径
    const totalPoints = 36; // 点数量
    
    // 生成一个圆形轨迹
    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const lat = center[0] + Math.sin(angle) * radius;
      const lng = center[1] + Math.cos(angle) * radius;
      
      // 计算方向角度（切线方向）
      const direction = (angle * (180 / Math.PI) + 90) % 360;
      
      points.push({
        lat,
        lng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `环形轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '30 km/h' },
          { key: '方向', value: `${Math.round(direction)}°` }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'circular-track-' + Math.floor(Math.random() * 1000),
      name: '环形轨迹',
      points: points,
      color: '#9C27B0', // 紫色
      visible: true
    };
    
    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加环形轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加环形轨迹失败: ${e}`);
  }
};

// 添加Z字型轨迹
const addZigzagTrack = () => {
  try {
    // 生成Z字形轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
  
    // Z字形的五个关键点
    const keyPoints = [
      { lat: center[0] - 0.02, lng: center[1] - 0.02 }, // 左上
      { lat: center[0] - 0.02, lng: center[1] + 0.02 }, // 右上
      { lat: center[0], lng: center[1] - 0.01 }, // 中间
      { lat: center[0] + 0.02, lng: center[1] - 0.02 }, // 左下
      { lat: center[0] + 0.02, lng: center[1] + 0.02 }, // 右下
    ];
    
    // 为每个关键点之间插入中间点
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 5; // 每段插入5个点
      
      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;
        
        // 计算方向（使用简单的角度计算）
        const direction = Math.atan2(end.lat - start.lat, end.lng - start.lng) * (180 / Math.PI);
        
        points.push({
          lat,
          lng,
          time: now + (i * steps + j) * 60, // 每分钟一个点
          dir: direction,
          title: `Z字形轨迹点 ${points.length + 1}`,
          info: [
            { key: '时间', value: new Date((now + (i * steps + j) * 60) * 1000).toLocaleTimeString() },
            { key: '速度', value: '40 km/h' },
            { key: '方向', value: `${Math.round(direction)}°` }
          ]
        });
      }
    }
    
    // 创建轨迹对象
    const track = {
      id: 'zigzag-track-' + Math.floor(Math.random() * 1000),
      name: 'Z字形轨迹',
      points: points,
      color: '#E74C3C', // 红色
      visible: true
    };
    
    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加Z字形轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加Z字形轨迹失败: ${e}`);
  }
};

// 播放轨迹
const playTrack = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有可播放的轨迹');
      return;
    }
    
    if (layerRef.value) {
      // 尝试播放第一条轨迹
      const track = tracks.value[0];
      
      const success = layerRef.value.playTrack(track.id, {
        // 设置播放参数
        loop: false,
        speed: 30,
        withCamera: false,
        speedFactor: 1.0,
        showNodes: false,
        showNodeAnchors: true,
        showNodeNames: false,
        showPointNames: true,
        showSpeed: true,
        showNodeSpeed: true
      });
      
      if (success) {
        // 尝试激活轨迹播放器工具
        if (layerRef.value) {
          layerRef.value.activateTool('track-player');
          addLog('info', `正在播放轨迹: ${track.name}，速度: 30 km/h，播放因子: 1.0x`);
        } else {
          addLog('warn', '无法获取工具栏对象，轨迹播放但可能没有显示播放器UI');
        }
      } else {
        addLog('error', `播放轨迹失败: ${track.name}`);
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `播放轨迹失败: ${e}`);
  }
};

// 停止轨迹播放
const stopTrack = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有正在播放的轨迹');
      return;
    }
    
    if (layerRef.value) {
      // 尝试停止所有轨迹播放
      let stopped = false;
      tracks.value.forEach(track => {
        try {
          const success = layerRef.value.stopTrack(track.id);
          if (success) stopped = true;
        } catch (e) {
          // 忽略单个轨迹停止失败
          console.error(`停止轨迹 ${track.name} 失败:`, e);
        }
      });
      
      if (stopped) {
        // 尝试停用轨迹播放器工具
        if (layerRef.value) {
          layerRef.value.deactivateTool('track-player');
        }
        
        addLog('info', '已停止轨迹播放');
      } else {
        addLog('warn', '没有正在播放的轨迹');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `停止轨迹播放失败: ${e}`);
  }
};

// 清除所有轨迹
const clearAllTracks = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有轨迹可清除');
      return;
    }
    
    if (layerRef.value) {
      // 停止所有轨迹播放
      tracks.value.forEach(track => {
        try {
          layerRef.value.stopTrack(track.id);
        } catch (e) {
          // 忽略停止失败
        }
      });
      
      // 清除所有轨迹
      const success = layerRef.value.clearAllTracks();
      
      if (success) {
        tracks.value = [];
        hasTrack.value = false;
        
        // 停用轨迹播放器工具
        if (layerRef.value) {
          layerRef.value.deactivateTool('track-player');
        }
        
        addLog('info', '已清除所有轨迹');
      } else {
        addLog('error', '清除轨迹失败');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `清除所有轨迹失败: ${e}`);
  }
};

// 切换所有轨迹的可见性
const toggleTrackVisible = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有轨迹可操作');
      return;
    }
    
    if (layerRef.value) {
      if (allTracksVisible.value) {
        // 隐藏所有轨迹
        layerRef.value.hideAllTracks();
        allTracksVisible.value = false;
        addLog('info', '已隐藏所有轨迹');
      } else {
        // 显示所有轨迹
        layerRef.value.showAllTracks();
        allTracksVisible.value = true;
        addLog('info', '已显示所有轨迹');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `切换轨迹可见性失败: ${e}`);
  }
};

// 生成定向轨迹
const generateDirectionalTrack = (center: [number, number], direction: string, distance: number, points: number) => {
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  const result = [];
  
  // 每点之间的距离
  const step = distance / (points - 1);
  
  // 方向转换为度数
  let dirDegrees = 0;
  let latMultiplier = 0;
  let lngMultiplier = 0;
  
  switch (direction) {
    case 'north':
      dirDegrees = 0;
      latMultiplier = 1;
      lngMultiplier = 0;
      break;
    case 'east':
      dirDegrees = 90;
      latMultiplier = 0;
      lngMultiplier = 1;
      break;
    case 'south':
      dirDegrees = 180;
      latMultiplier = -1;
      lngMultiplier = 0;
      break;
    case 'west':
      dirDegrees = 270;
      latMultiplier = 0;
      lngMultiplier = -1;
      break;
  }
  
  // 生成轨迹点
  for (let i = 0; i < points; i++) {
    const lat = center[0] + latMultiplier * i * step;
    const lng = center[1] + lngMultiplier * i * step;
    
    result.push({
      lat,
      lng,
      time: now + i * interval,
      dir: dirDegrees,
      title: `${getDirectionName(direction)}向轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date((now + i * interval) * 1000).toLocaleTimeString() },
        { key: '速度', value: '45 km/h' },
        { key: '方向', value: `${dirDegrees}°` }
      ]
    });
  }
  
  return result;
};

// 获取方向名称
const getDirectionName = (direction: string) => {
  switch (direction) {
    case 'north': return '北';
    case 'east': return '东';
    case 'south': return '南';
    case 'west': return '西';
    default: return direction;
  }
};

/**
 * 启用热力图
 */
const enableHeatmap = () => {
  if (!layerRef.value) return;
  const result = layerRef.value.enableHeatmap();
  if (result) {
    addLog('热力图', '启用热力图');
  }
};

/**
 * 禁用热力图
 */
const disableHeatmap = () => {
  if (!layerRef.value) return;
  const result = layerRef.value.disableHeatmap();
  if (result) {
    addLog('热力图', '禁用热力图');
  }
};

/**
 * 添加随机热力点
 * @param count 热力点数量
 */
const addRandomHeatmapPoints = (count) => {
  if (!layerRef.value) return;
  
  // 先启用热力图
  layerRef.value.enableHeatmap();
  
  // 获取地图中心点
  const center = config.center;
  const points = [];
  
  // 生成随机热力点
  for (let i = 0; i < count; i++) {
    // 生成随机经纬度偏移
    const latOffset = Math.random() * 0.1 - 0.05;
    const lngOffset = Math.random() * 0.1 - 0.05;
    
    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: 0.4 + Math.random() * 0.6, // 0.4 - 1.0之间的随机权重
      name: `热力点 ${i+1}`,
      properties: {
        value: Math.floor(Math.random() * 100),
        type: '随机点'
      }
    };
    
    points.push(point);
  }
  
  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];
  
  addLog('热力图', `添加了${count}个随机热力点`);
};

/**
 * 添加聚类热力点
 */
const addClusteredHeatmapPoints = () => {
  if (!layerRef.value) return;
  
  // 先启用热力图
  layerRef.value.enableHeatmap();
  
  // 获取地图中心点
  const center = config.center;
  const clusters = 5; // 聚类数量
  const pointsPerCluster = 10; // 每个聚类的点数
  const points = [];
  
  // 生成聚类热力点
  for (let c = 0; c < clusters; c++) {
    // 聚类中心点
    const clusterCenterLat = center[0] + (Math.random() * 0.2 - 0.1);
    const clusterCenterLng = center[1] + (Math.random() * 0.2 - 0.1);
    
    for (let i = 0; i < pointsPerCluster; i++) {
      // 在聚类中心周围生成点
      const latOffset = Math.random() * 0.02 - 0.01;
      const lngOffset = Math.random() * 0.02 - 0.01;
      
      const point = {
        longitude: clusterCenterLng + lngOffset,
        latitude: clusterCenterLat + latOffset,
        weight: 0.6 + Math.random() * 0.4, // 0.6 - 1.0之间的随机权重
        name: `聚类 ${c+1} 热力点 ${i+1}`,
        properties: {
          cluster: c + 1,
          value: Math.floor(Math.random() * 100),
          type: '聚类点'
        }
      };
      
      points.push(point);
    }
  }
  
  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];
  
  addLog('热力图', `添加了${clusters}个聚类，共${clusters * pointsPerCluster}个热力点`);
};

/**
 * 添加权重热力点
 */
const addWeightedHeatmapPoints = () => {
  if (!layerRef.value) return;
  
  // 先启用热力图
  layerRef.value.enableHeatmap();
  
  // 获取地图中心点
  const center = config.center;
  const points = [];
  
  // 创建一个权重递增的线性分布
  for (let i = 0; i < 10; i++) {
    const weight = 0.1 + (i * 0.1); // 权重从0.1递增到1.0
    const latOffset = -0.05 + (i * 0.01);
    const lngOffset = 0;
    
    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: weight,
      name: `权重${weight.toFixed(1)}的点`,
      properties: {
        value: Math.round(weight * 100),
        type: '权重点'
      }
    };
    
    points.push(point);
  }
  
  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];
  
  addLog('热力图', '添加了10个权重递增的热力点');
};

/**
 * 清除热力图
 */
const clearHeatmap = () => {
  if (!layerRef.value) return;
  
  const result = layerRef.value.clearHeatmap();
  if (result) {
    heatmapPoints.value = [];
    addLog('热力图', '清除热力图点');
  }
};

/**
 * 配置热力图样式
 */
const configureHeatmap = () => {
  if (!layerRef.value) return;
  
  // 设置热力图配置
  const heatmapConfig = {
    radius: 20,                // 热力点半径
    blur: 15,                  // 模糊大小
    opacity: 0.8,              // 不透明度
    gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'], // 渐变色
    showPoints: pointsVisible.value,  // 显示数据点
    pointRadius: 4,            // 点半径
    pointColor: 'rgba(0, 0, 255, 0.7)' // 点颜色
  };
  
  const result = layerRef.value.configureHeatmap(heatmapConfig);
  if (result) {
    addLog('热力图', '更新热力图配置');
  }
};

/**
 * 切换是否显示数据点
 */
const togglePointsVisible = () => {
  if (!layerRef.value) return;
  
  pointsVisible.value = !pointsVisible.value;
  
  // 更新热力图配置，切换数据点显示
  layerRef.value.configureHeatmap({
    showPoints: pointsVisible.value
  });
  
  addLog('热力图', pointsVisible.value ? '显示数据点' : '隐藏数据点');
};
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

.active-button {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.active-button:hover {
  background-color: #40a9ff;
  color: white;
  border-color: #40a9ff;
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

.shape-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.shape-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.no-shapes {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.shape-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.shape-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.shape-id {
  font-weight: bold;
  font-size: 12px;
}

.shape-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: #e6f7ff;
  color: #1890ff;
}

.shape-data {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
}

.shape-data-item {
  margin: 2px 0;
}

.shape-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.more-shapes {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}
</style> 