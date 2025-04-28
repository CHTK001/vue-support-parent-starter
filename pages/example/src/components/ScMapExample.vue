<template>
  <div class="sc-map-example">
    <h2>ScMap 地图组件示例</h2>

    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <div class="map-container">
          <sc-map 
            ref="mapRef"
            height="500px" 
            :center="config.center" 
            :zoom="config.zoom" 
            :map-type="config.mapType"
            :dragging="config.dragging" 
            :scroll-wheel-zoom="config.scrollWheelZoom"
            :api-key="config.apiKey"
            :show-toolbar="config.showToolbar"
            :toolbar-config="toolbarConfig"
            :aggregation-config="aggregationConfig"
          />
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area">
        <h3>配置参数</h3>
        
        <div class="config-section">
          <div class="config-item">
            <div class="label">交互控制</div>
            <div class="controls">
              <div class="control-row">
                <span>可拖动:</span>
                <el-switch v-model="config.dragging" />
                <span class="status-text">{{ config.dragging ? '开启' : '关闭' }}</span>
              </div>
              <div class="control-row">
                <span>滚轮缩放:</span>
                <el-switch v-model="config.scrollWheelZoom" />
                <span class="status-text">{{ config.scrollWheelZoom ? '开启' : '关闭' }}</span>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">工具栏设置</div>
            <div class="controls">
              <div class="control-row">
                <span>显示工具栏:</span>
                <el-switch v-model="config.showToolbar" />
              </div>
              <div class="control-row buttons-row" v-if="config.showToolbar">
                <span>工具栏位置:</span>
                <el-radio-group v-model="toolbarSettings.position" size="small">
                  <el-radio-button label="top-left">左上角</el-radio-button>
                  <el-radio-button label="top-right">右上角</el-radio-button>
                  <el-radio-button label="bottom-left">左下角</el-radio-button>
                  <el-radio-button label="bottom-right">右下角</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>排列方向:</span>
                <el-radio-group v-model="toolbarSettings.direction" size="small">
                  <el-radio-button label="horizontal">横向</el-radio-button>
                  <el-radio-button label="vertical">纵向</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>每行工具数:</span>
                <el-slider 
                  v-model="toolbarSettings.itemsPerLine" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                />
                <span class="value">{{ toolbarSettings.itemsPerLine }}</span>
              </div>
            </div>
          </div>

          <!-- 添加标记点操作区域 -->
          <div class="config-item">
            <div class="label">标记点操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addRandomMarkers(3)">添加随机标记</el-button>
                <el-button size="small" @click="clearAllMarkers">清除所有标记</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMarkerGroup('group1', 'red')">添加红色组</el-button>
                <el-button size="small" @click="addMarkerGroup('group2', 'blue')">添加蓝色组</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleGroupVisibility('group1')">
                  {{ groupVisible.group1 ? '隐藏红色组' : '显示红色组' }}
                </el-button>
                <el-button size="small" @click="toggleGroupVisibility('group2')">
                  {{ groupVisible.group2 ? '隐藏蓝色组' : '显示蓝色组' }}
                </el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleAllMarkers">
                  {{ allMarkersVisible ? '隐藏所有标记' : '显示所有标记' }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 添加轨迹操作区域 -->
          <div class="config-item">
            <div class="label">轨迹操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addSampleTrack">添加示例轨迹</el-button>
                <el-button size="small" @click="clearAllTracks">清除所有轨迹</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMultipleTracks">添加多条轨迹</el-button>
                <el-button size="small" @click="addCircularTrack">添加环形轨迹</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addZigzagTrack">添加Z字形轨迹</el-button>
                <el-button size="small" @click="addRandomTrack">添加随机轨迹</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="preset-section">
          <h4>预设位置</h4>
          <div class="preset-buttons">
            <el-button @click="setPreset('beijing')">北京</el-button>
            <el-button @click="setPreset('shanghai')">上海</el-button>
            <el-button @click="setPreset('guangzhou')">广州</el-button>
            <el-button @click="setPreset('chongqing')">重庆</el-button>
          </div>
        </div>

        <div class="map-info">
          <div class="info-item">
            <span class="info-label">当前中心点:</span>
            <span class="info-value">{{ config.center[0].toFixed(4) }}, {{ config.center[1].toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前缩放:</span>
            <span class="info-value">{{ config.zoom }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">交互状态:</span>
            <span class="info-value">{{ config.dragging ? '可拖动' : '禁止拖动' }}, {{ config.scrollWheelZoom ? '可缩放' : '禁止缩放' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">活动工具:</span>
            <span class="info-value">{{ activeTool || '无' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScMap from '@repo/components/ScMap/index.vue';
import type { ScMapProps } from '@repo/components/ScMap/types';
import MAP_TYPES from '@repo/components/ScMap/types/default';
import * as logUtil from '@repo/utils';
import { computed, reactive, ref, onMounted, watch } from 'vue';
const { info, warn, error } = logUtil;

// 地图类型引用
const mapTypes = ref(MAP_TYPES);
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const activeTool = ref<string>('');
const customToolCount = ref(0);
const allMarkersVisible = ref(true);
const groupVisible = reactive({
  group1: true,
  group2: true
});

// 基本配置
const config = reactive({
  center: [39.92, 116.40] as [number, number], // 默认北京
  zoom: 12,
  height: 600,
  mapType: MAP_TYPES,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: '',
  showToolbar: true,
  aggregationConfig: { enabled: false } // 初始化聚合配置
});

// 工具栏配置
const toolbarSettings = reactive({
  position: 'top-left' as const,
  direction: 'horizontal' as const,
  itemsPerLine: 4,
  size: 36
});

// 合并为toolbarConfig
const toolbarConfig = computed(() => ({
  position: toolbarSettings.position,
  direction: toolbarSettings.direction,
  itemsPerLine: toolbarSettings.itemsPerLine,
  size: toolbarSettings.size
}));

// 聚合设置
const aggregationSettings = reactive({
  enabled: false,
  maxClusterRadius: 50,
  showCount: true,
  color: '#1890ff'
});

// 计算聚合配置
const aggregationConfig = computed(() => {
  if (!aggregationSettings.enabled) {
    return { enabled: false };
  }
  
  return {
    enabled: aggregationSettings.enabled,
    maxClusterRadius: aggregationSettings.maxClusterRadius,
    showCount: aggregationSettings.showCount,
    color: aggregationSettings.color,
    borderColor: '#ffffff',
    useWeightAsSize: true,
    pulseScale: 1.3,
    // 设置聚合点大小缩放比例为原来的1/3
    maxClusterSize: 25, // 最大聚合点大小
    minClusterSize: 15  // 最小聚合点大小
  };
});

// 设置预设位置
const setPreset = (city: string): void => {
  switch(city) {
    case 'beijing':
      config.center = [39.92, 116.40] as [number, number];
      config.zoom = 12;
      break;
    case 'shanghai':
      config.center = [31.23, 121.47] as [number, number];
      config.zoom = 11;
      break;
    case 'guangzhou':
      config.center = [23.13, 113.26] as [number, number];
      config.zoom = 10;
      break;
    case 'chongqing':
      config.center = [29.56, 106.55] as [number, number];
      config.zoom = 9;
      break;
  }
};

// 添加随机标记点
const addRandomMarkers = (count: number = 3) => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.05; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < count; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加标记，并处理可能的错误
      try {
        const marker = map.addMarker({ lat, lng }, {
          markerId: `marker-random-${Date.now()}-${i}`,
          markerLabel: `标记 ${i+1}`,
          markerShowLabel: true,
          markerColor: color,
          markerClickable: true
        });
        
        if (!marker) {
          warn(`标记 ${i+1} 添加失败，可能地图组件尚未完全初始化`);
        }
      } catch (err) {
        error(`添加标记 ${i+1} 失败:`, err);
      }
    }
  } catch (e) {
    error('添加随机标记失败:', e);
  }
};

// 清除所有标记
const clearAllMarkers = () => {
  mapRef.value?.clearMarkers();
  allMarkersVisible.value = true;
};

// 添加标记分组
const addMarkerGroup = (groupName: string, color: string) => {
  if (!mapRef.value) return;
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.04; // 经纬度偏移范围
  const count = 3; // 每组标记数量
  
  // 设置颜色
  const markerColor = color === 'red' ? '#FF5252' : '#448AFF';
  
  for (let i = 0; i < count; i++) {
    // 计算随机位置（当前中心点附近）
    const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
    const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
    
    // 添加标记
    map.addMarker({ lat, lng }, {
      markerId: `${groupName}-${Date.now()}-${i}`,
      markerGroup: groupName,
      markerLabel: `${color} ${i+1}`,
      markerShowLabel: true,
      markerColor: markerColor,
      markerClickable: true
    });
  }
  
  // 更新分组可见状态
  groupVisible[groupName as keyof typeof groupVisible] = true;
};

// 切换分组可见性
const toggleGroupVisibility = (groupName: string) => {
  if (!mapRef.value) return;
  
  if (groupVisible[groupName as keyof typeof groupVisible]) {
    // 隐藏分组
    mapRef.value.hideGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = false;
  } else {
    // 显示分组
    mapRef.value.showGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = true;
  }
};

// 切换所有标记可见性
const toggleAllMarkers = () => {
  if (!mapRef.value) return;
  
  if (allMarkersVisible.value) {
    // 隐藏所有标记
    mapRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
  } else {
    // 显示所有标记
    mapRef.value.showAllMarkers();
    allMarkersVisible.value = true;
  }
};

// 添加轨迹相关的状态和方法
const hasTrack = ref(false);
const isPlaying = ref(false);
const trackPlayerSettings = reactive({
  speed: 2,
  followMarker: true,
  loop: true
});

// 监听聚合设置变化并立即应用
watch(
  [
    () => aggregationSettings.enabled,
    () => aggregationSettings.maxClusterRadius,
    () => aggregationSettings.showCount,
    () => aggregationSettings.color
  ],
  () => {
    // 当任何聚合参数变化时，立即应用更新
    info('聚合参数已更新，正在应用...');
    
    // 短暂延迟确保绑定值已更新
    setTimeout(() => {
      // 尝试调用更新聚合方法
      updateAggregation();
      
      // 如果当前地图上没有足够的点位来展示聚合效果，提示用户添加更多点位
      const map = mapRef.value;
      if (map && aggregationSettings.enabled) {
        const markerCount = document.querySelectorAll('.leaflet-marker-icon').length;
        if (markerCount < 10) {
          info('当前点位数量较少，可能难以观察到聚合效果，建议添加更多点位');
        }
      }
    }, 100);
  }
);

// 监听聚合开关
watch(
  () => aggregationSettings.enabled,
  (newValue) => {
    if (newValue) {
      info('聚合功能已启用');
    } else {
      info('聚合功能已禁用');
    }
  }
);

// 更新聚合设置
const updateAggregation = () => {
  if (!mapRef.value) return;
  
  // 直接从组件实例获取地图实例
  const map = mapRef.value;
  
  try {
    // 尝试获取内部地图实例 - 使用any类型避免TypeScript错误
    const mapInstance = map as any;
    
    // 首先尝试通过prop直接更新配置
    config.aggregationConfig = {
      enabled: aggregationSettings.enabled,
    };
    
    // 然后尝试刷新聚合
    if (mapInstance._map && typeof mapInstance._map.refreshClusters === 'function') {
      // 如果有Leaflet地图实例并且有刷新聚合的方法
      mapInstance._map.refreshClusters();
      info('已刷新聚合');
    } else if (typeof map.$forceUpdate === 'function') {
      // 使用Vue的$forceUpdate方法强制组件更新
      map.$forceUpdate();
      info('已强制更新组件');
    } else {
      // 最后的办法:重绘地图
      info('请尝试调整地图缩放级别来触发聚合效果');
    }
  } catch (e) {
    error('刷新聚合失败:', e);
  }
};

// 添加示例轨迹
const addSampleTrack = () => {
  if (!mapRef.value) return;
  
  // 创建一条真实的交通路线轨迹
  const center = config.center;
  const points = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  
  // 根据当前中心点选择不同的路线
  let routePoints: Array<[number, number]> = [];
  
  // 北京路线 - 近似从北京站到天安门的路线
  if (Math.abs(center[0] - 39.92) < 0.5 && Math.abs(center[1] - 116.40) < 0.5) {
    routePoints = [
      [39.9047, 116.4274], // 北京站
      [39.9051, 116.4225],
      [39.9055, 116.4180],
      [39.9059, 116.4140],
      [39.9063, 116.4102],
      [39.9067, 116.4060],
      [39.9071, 116.4020],
      [39.9075, 116.3980],
      [39.9079, 116.3940],
      [39.9083, 116.3910],
      [39.9087, 116.3880],
      [39.9080, 116.3850],
      [39.9070, 116.3830],
      [39.9060, 116.3810],
      [39.9050, 116.3790],
      [39.9041, 116.3770],
      [39.9033, 116.3750],
      [39.9025, 116.3730],
      [39.9017, 116.3710],
      [39.9008, 116.3690],
      [39.9000, 116.3670],
      [39.9008, 116.3640],
      [39.9016, 116.3610],
      [39.9024, 116.3580],
      [39.9032, 116.3550],
      [39.9040, 116.3520], // 天安门
    ];
  } 
  // 上海路线 - 近似从人民广场到外滩的路线
  else if (Math.abs(center[0] - 31.23) < 0.5 && Math.abs(center[1] - 121.47) < 0.5) {
    routePoints = [
      [31.2304, 121.4737], // 人民广场
      [31.2316, 121.4745],
      [31.2328, 121.4753],
      [31.2340, 121.4761],
      [31.2352, 121.4769],
      [31.2364, 121.4777],
      [31.2376, 121.4785],
      [31.2388, 121.4793],
      [31.2400, 121.4801],
      [31.2412, 121.4809],
      [31.2424, 121.4817],
      [31.2436, 121.4823],
      [31.2448, 121.4829],
      [31.2460, 121.4835],
      [31.2472, 121.4841],
      [31.2484, 121.4847], // 外滩
    ];
  }
  // 广州路线 - 近似从广州火车站到海珠广场的路线
  else if (Math.abs(center[0] - 23.13) < 0.5 && Math.abs(center[1] - 113.26) < 0.5) {
    routePoints = [
      [23.1336, 113.2548], // 广州火车站
      [23.1326, 113.2541],
      [23.1316, 113.2534],
      [23.1306, 113.2527],
      [23.1296, 113.2520],
      [23.1286, 113.2513],
      [23.1276, 113.2507],
      [23.1266, 113.2502],
      [23.1256, 113.2498],
      [23.1246, 113.2493],
      [23.1236, 113.2488],
      [23.1226, 113.2483],
      [23.1216, 113.2478],
      [23.1206, 113.2473],
      [23.1196, 113.2468],
      [23.1186, 113.2463],
      [23.1176, 113.2458],
      [23.1166, 113.2453],
      [23.1156, 113.2448],
      [23.1146, 113.2443], // 海珠广场
    ];
  }
  // 默认使用当前位置创建一条Z字形路线
  else {
    const range = 0.02; // 约2公里的范围
    routePoints = [
      [center[0] - range, center[1] - range], // 起点
      [center[0] - range * 0.8, center[1] - range * 0.8],
      [center[0] - range * 0.6, center[1] - range * 0.6],
      [center[0] - range * 0.4, center[1] - range * 0.4],
      [center[0] - range * 0.2, center[1] - range * 0.2],
      [center[0], center[1]],
      [center[0] + range * 0.2, center[1] + range * 0.2],
      [center[0] + range * 0.4, center[1] + range * 0.4],
      [center[0] + range * 0.6, center[1] + range * 0.6],
      [center[0] + range * 0.8, center[1] + range * 0.8],
      [center[0] + range, center[1] + range], // 终点
    ];
  }
  
  // 获取城市名称
  let cityName = "当前位置";
  if (Math.abs(center[0] - 39.92) < 0.5 && Math.abs(center[1] - 116.40) < 0.5) {
    cityName = "北京";
  } else if (Math.abs(center[0] - 31.23) < 0.5 && Math.abs(center[1] - 121.47) < 0.5) {
    cityName = "上海";
  } else if (Math.abs(center[0] - 23.13) < 0.5 && Math.abs(center[1] - 113.26) < 0.5) {
    cityName = "广州";
  }
  
  // 创建轨迹点数据
  routePoints.forEach((coord, i) => {
    // 计算前后点的方向
    let direction = 0;
    if (i < routePoints.length - 1) {
      const nextPoint = routePoints[i + 1];
      // 计算方向角度 (0-360度)
      direction = Math.atan2(nextPoint[1] - coord[1], nextPoint[0] - coord[0]) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    } else if (i > 0) {
      // 最后一个点使用前一个点的方向
      const prevPoint = routePoints[i - 1];
      direction = Math.atan2(coord[1] - prevPoint[1], coord[0] - prevPoint[0]) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    }
    
    // 添加轨迹点
    points.push({
      lat: coord[0],
      lng: coord[1],
      time: now + i * interval,
      dir: direction,
      title: `${cityName}路线点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: i % 2 === 0 ? '40 km/h' : '35 km/h' },
        { key: '方向', value: `${Math.round(direction)}°` }
      ]
    });
  });
  
  // 添加轨迹
  const trackId = 'traffic-route-' + Date.now();
  const track = {
    id: trackId,
    name: `${cityName}交通路线`,
    points,
    color: '#FF5252',
    visible: true
  };
  
  try {
    // 尝试使用addTrack方法添加轨迹
    if (typeof mapRef.value.addTrack === 'function') {
      mapRef.value.addTrack(track);
      hasTrack.value = true;
      
      // 调整视图以包含轨迹
      try {
        // 先调整到第一个点
        if (points.length > 0) {
          config.center = [points[0].lat, points[0].lng];
        }
      } catch (e) {
        error('调整视图失败:', e);
      }
      
      // 提示用户
      info(`已添加${cityName}交通路线，共${points.length}个点`);
    } else {
      warn('地图组件不支持轨迹功能');
    }
  } catch (e) {
    error('添加轨迹失败:', e);
  }
};

// 清除所有轨迹
const clearAllTracks = () => {
  if (!mapRef.value) return;
  
  try {
    // 移除所有添加过的轨迹
    const trackIds = ['north-track', 'east-track', 'south-track', 'west-track', 
                     'circular-track', 'zigzag-track', 'random-track', 'traffic-route'];
    
    for (const id of trackIds) {
      try {
        if (typeof mapRef.value.removeTrack === 'function') {
          mapRef.value.removeTrack(id);
        }
      } catch (e) {
        // 忽略移除不存在的轨迹的错误
      }
    }
    
    hasTrack.value = false;
    isPlaying.value = false;
    info('已清除所有轨迹');
  } catch (e) {
    error('清除轨迹失败:', e);
  }
};

// 验证轨迹数据是否有效
const validateTrackData = (points: any[]): boolean => {
  // 至少需要2个点
  if (!points || points.length < 2) {
    warn('轨迹数据无效: 至少需要2个点');
    return false;
  }
  
  // 验证每个点的格式
  for (const point of points) {
    if (point.lat === undefined || point.lng === undefined || point.time === undefined) {
      warn('轨迹数据无效: 点缺少必要的属性(lat, lng, time)');
      return false;
    }
    
    // 确保经纬度是数字
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      warn('轨迹数据无效: 经纬度必须是数字类型');
      return false;
    }
    
    // 确保时间戳是数字
    if (typeof point.time !== 'number') {
      warn('轨迹数据无效: 时间戳必须是数字类型');
      return false;
    }
  }
  
  return true;
};

// 添加轨迹到地图
const addTrackToMap = (id: string, name: string, points: any[], color: string) => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  // 验证轨迹数据
  if (!validateTrackData(points)) {
    error(`添加轨迹失败: ${name} - 数据格式不正确`);
    return;
  }
  
  // 创建轨迹对象
  const track = {
    id: id, // 确保ID不变
    name: name,
    points: points,
    color: color,
    visible: true
  };
  
  // 添加到地图
  try {
    const result = mapRef.value.addTrack(track);
    if (result) {
      hasTrack.value = true;
      info(`已添加轨迹: ${name}，包含 ${points.length} 个点`);
    } else {
      warn(`轨迹添加失败: ${name}`);
    }
  } catch (e) {
    error(`添加轨迹失败: ${name}`, e);
  }
};

// 添加多条轨迹
const addMultipleTracks = () => {
  if (!mapRef.value) return;
  
  // 基于当前位置创建多条轨迹
  const center = config.center;
  
  try {
    // 第一条轨迹 - 向北移动 (确保至少两个点)
    const northTrackPoints = generateDirectionalTrack(center, 'north', 0.05, Math.max(3, 12));
    if (validateTrackData(northTrackPoints)) {
      addTrackToMap('north-track', '向北轨迹', northTrackPoints, '#FF5252');
    }
    
    // 第二条轨迹 - 向东移动
    const eastTrackPoints = generateDirectionalTrack(center, 'east', 0.05, Math.max(3, 12));
    if (validateTrackData(eastTrackPoints)) {
      addTrackToMap('east-track', '向东轨迹', eastTrackPoints, '#4CAF50');
    }

    // 第三条轨迹 - 向南移动
    const southTrackPoints = generateDirectionalTrack(center, 'south', 0.05, Math.max(3, 12));
    if (validateTrackData(southTrackPoints)) {
      addTrackToMap('south-track', '向南轨迹', southTrackPoints, '#448AFF');
    }
    
    // 第四条轨迹 - 向西移动
    const westTrackPoints = generateDirectionalTrack(center, 'west', 0.05, Math.max(3, 12));
    if (validateTrackData(westTrackPoints)) {
      addTrackToMap('west-track', '向西轨迹', westTrackPoints, '#FFC107');
    }
    
    // 调整视图以包含所有轨迹
    fitTracksInView();
    
    info('已添加四条方向轨迹');
  } catch (e) {
    error('添加多条轨迹失败:', e);
  }
};

// 添加环形轨迹
const addCircularTrack = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const radius = 0.03; // 约3公里半径
  const points = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  const numPoints = 24; // 24个点围成一个圆
  
  for (let i = 0; i < numPoints; i++) {
    // 计算圆上的点
    const angle = (i / numPoints) * Math.PI * 2;
    const lat = center[0] + radius * Math.sin(angle);
    const lng = center[1] + radius * Math.cos(angle);
    
    // 计算方向 (沿圆切线方向)
    const direction = (angle + Math.PI / 2) * 180 / Math.PI;
    
    // 添加轨迹点
    points.push({
      lat,
      lng,
      time: now + i * interval,
      dir: direction,
      title: `环形轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: '30 km/h' },
        { key: '方向', value: `${Math.round(direction)}°` }
      ]
    });
  }
  
  addTrackToMap('circular-track', '环形轨迹', points, '#9C27B0');
  info('已添加环形轨迹');
};

// 添加Z字形轨迹
const addZigzagTrack = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const distance = 0.05; // 约5公里
  const points = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  
  // 创建Z字形路径的关键点
  const keyPoints = [
    [center[0] - distance, center[1] - distance], // 左上
    [center[0] - distance, center[1] + distance], // 右上
    [center[0], center[1]], // 中心
    [center[0] + distance, center[1] - distance], // 左下
    [center[0] + distance, center[1] + distance], // 右下
  ];
  
  // 为每段路径添加中间点，使路径更平滑
  const fullPath = [];
  for (let i = 0; i < keyPoints.length - 1; i++) {
    const start = keyPoints[i];
    const end = keyPoints[i + 1];
    
    // 添加起点
    fullPath.push(start);
    
    // 添加3个中间点
    for (let j = 1; j < 4; j++) {
      const ratio = j / 4;
      const lat = start[0] + (end[0] - start[0]) * ratio;
      const lng = start[1] + (end[1] - start[1]) * ratio;
      fullPath.push([lat, lng]);
    }
  }
  
  // 添加终点
  fullPath.push(keyPoints[keyPoints.length - 1]);
  
  // 创建轨迹点
  fullPath.forEach((coord, i) => {
    // A到B的方向计算
    let direction = 0;
    if (i < fullPath.length - 1) {
      const nextPoint = fullPath[i + 1];
      direction = Math.atan2(nextPoint[1] - coord[1], nextPoint[0] - coord[0]) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    } else if (i > 0) {
      const prevPoint = fullPath[i - 1];
      direction = Math.atan2(coord[1] - prevPoint[1], coord[0] - prevPoint[0]) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    }
    
    points.push({
      lat: coord[0],
      lng: coord[1],
      time: now + i * interval,
      dir: direction,
      title: `Z字形轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: '35 km/h' },
        { key: '方向', value: `${Math.round(direction)}°` }
      ]
    });
  });
  
  addTrackToMap('zigzag-track', 'Z字形轨迹', points, '#FF9800');
  info('已添加Z字形轨迹');
};

// 添加随机轨迹
const addRandomTrack = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const range = 0.07; // 约7公里范围
  const points = [];
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  const numPoints = 15; // 15个点
  
  // 生成随机路径
  let currentLat = center[0];
  let currentLng = center[1];
  
  for (let i = 0; i < numPoints; i++) {
    // 随机位移，但确保不会超出范围
    const latOffset = Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1);
    const lngOffset = Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1);
    
    // 确保在范围内
    currentLat = Math.max(center[0] - range, Math.min(center[0] + range, currentLat + latOffset));
    currentLng = Math.max(center[1] - range, Math.min(center[1] + range, currentLng + lngOffset));
    
    // 计算方向（如果有前一个点）
    let direction = 0;
    if (i > 0) {
      const prevPoint = points[i - 1];
      direction = Math.atan2(currentLng - prevPoint.lng, currentLat - prevPoint.lat) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    }
    
    // 添加轨迹点
    points.push({
      lat: currentLat,
      lng: currentLng,
      time: now + i * interval,
      dir: direction,
      title: `随机轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: `${Math.floor(20 + Math.random() * 40)} km/h` },
        { key: '方向', value: `${Math.round(direction)}°` }
      ]
    });
  }
  
  addTrackToMap('random-track', '随机轨迹', points, '#607D8B');
  info('已添加随机轨迹');
};

// 生成方向性轨迹
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
      title: `${direction}向轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: '45 km/h' },
        { key: '方向', value: `${dirDegrees}°` }
      ]
    });
  }
  
  return result;
};

// 调整视图以包含所有轨迹
const fitTracksInView = () => {
  if (!mapRef.value) return;
  
  try {
    // 直接调整中心点和缩放级别
    if (config.zoom > 10) {
      config.zoom = 10;
    }
  } catch (e) {
    error('调整视图失败:', e);
  }
};


// 组件挂载时初始化
onMounted(() => {
  // 延迟一点时间确保地图已完全加载
  setTimeout(() => {
    // 默认添加一些点位
    addDefaultMarkers();
  }, 1000);
});

// 添加默认标记点
const addDefaultMarkers = () => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  
  try {
    // 添加一些默认标记点，形成一个方形阵列
    const range = 0.03; // 经纬度范围
    const step = 0.01;  // 间隔
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
    
    let count = 0;
    for (let lat = center[0] - range; lat <= center[0] + range; lat += step) {
      for (let lng = center[1] - range; lng <= center[1] + range; lng += step) {
        const color = colors[count % colors.length];
        const label = `点位${++count}`;
        
        map.addMarker({ lat, lng }, {
          markerId: `default-marker-${count}`,
          markerGroup: 'default-group',
          markerLabel: label,
          markerShowLabel: count % 3 === 0, // 每隔3个点显示标签
          markerColor: color,
          markerClickable: true
        });
      }
    }
    
    info(`默认添加了 ${count} 个点位`);
  } catch (e) {
    error('添加默认标记点失败:', e);
  }
};

</script>

<style scoped>
.sc-map-example {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.example-content {
  display: flex;
  gap: 20px;
  min-height: 550px;
}

.map-area {
  flex: 1;
  min-width: 0;
}

.config-area {
  width: 350px;
  flex-shrink: 0;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.map-container {
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: bold;
  color: #606266;
  display: flex;
  align-items: center;
}

.value-badge {
  margin-left: 8px;
  background-color: #409eff;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-row span {
  width: 70px;
  flex-shrink: 0;
}

.value {
  width: 40px;
  text-align: right;
}

.status-text {
  font-size: 12px;
  color: #606266;
  width: auto !important;
}

.zoom-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.preset-section {
  margin-top: 20px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.custom-url-hint {
  font-size: 12px;
  color: #E6A23C;
  margin-top: 5px;
}

.map-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  margin-bottom: 5px;
}

.info-label {
  font-weight: bold;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #409eff;
}

.buttons-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.buttons-row .el-button {
  flex: 1;
  min-width: 0;
}
</style>
