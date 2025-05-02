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
            :heat-map-config="config.heatMapConfig"
            @marker-detail-view="onMarkerDetailView"
          >
            <!-- 自定义标记点弹窗模板 -->
            <template #marker="{ latlng, data }">
              <div  class="simple-popup">
                <div class="simple-popup-content">
                  <div class="simple-data-row">
                    <span class="simple-label">位置:</span>
                    <span class="simple-value">{{ latlng.lat.toFixed(4) }}, {{ latlng.lng.toFixed(4) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </sc-map>
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area thin-scrollbar">
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
                <el-button size="small" @click="addMarkersWithAutoLabel">添加自动显示标签</el-button>
                <el-button size="small" @click="addMarkersWithCustomClick">添加自定义点击</el-button>
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
                <el-button size="small" @click="toggleAllLabels">
                  {{ allLabelsVisible ? '隐藏所有标签' : '显示所有标签' }}
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
              <div class="control-row buttons-row">
                <el-button size="small" type="primary" @click="addSampleMigration">添加迁徙图示例</el-button>
              </div>
            </div>
          </div>

          <!-- 添加热力图操作区域 -->
          <div class="config-item">
            <div class="label">热力图操作</div>
            <div class="controls">
              <div class="control-row">
                <span>启用热力图:</span>
                <el-switch v-model="config.heatMapConfig.enabled" @change="toggleHeatMap" />
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="generateRandomHeatMap" :disabled="!config.heatMapConfig.enabled">
                  生成随机热力图
                </el-button>
                <el-button size="small" @click="generateHeatMapFromMarkers" :disabled="!config.heatMapConfig.enabled">
                  从标记点生成
                </el-button>
              </div>
              <div class="control-row">
                <span>热力点半径:</span>
                <el-slider 
                  v-model="config.heatMapConfig.options.radius" 
                  :min="10" 
                  :max="50" 
                  :step="1"
                  @change="updateHeatMapOptions"
                />
                <span class="value">{{ config.heatMapConfig.options.radius }}</span>
              </div>
              <div class="control-row">
                <span>模糊度:</span>
                <el-slider 
                  v-model="config.heatMapConfig.options.blur" 
                  :min="5" 
                  :max="30" 
                  :step="1"
                  @change="updateHeatMapOptions"
                />
                <span class="value">{{ config.heatMapConfig.options.blur }}</span>
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
import { ElMessage } from 'element-plus';
// 导入Leaflet库（实际使用时可能需要安装leaflet包）
// import L from 'leaflet';

const { info, warn, error } = logUtil;

// 创建自己的日志工具包装函数，解决参数问题
const log = {
  info: (message: string) => info(message),
  warn: (message: string) => warn(message),
  error: (message: string) => error(message)
};

// 地图类型引用
const mapTypes = ref(MAP_TYPES);
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const activeTool = ref<string>('');
const customToolCount = ref(0);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);
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
  aggregationConfig: { enabled: false }, // 初始化聚合配置
  heatMapConfig: { // 添加热力图配置
    enabled: false,
    options: {
      radius: 25,
      blur: 15,
      maxOpacity: 0.8,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }
  }
});

// 工具栏配置
const toolbarSettings = reactive({
  position: 'top-left' as const,
  direction: 'horizontal' as const,
  itemsPerLine: 8,
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
    log.warn('地图实例未初始化');
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
          log.warn(`标记 ${i+1} 添加失败，可能地图组件尚未完全初始化`);
        }
      } catch (err) {
        log.error(`添加标记 ${i+1} 失败: ${err}`);
      }
    }
  } catch (e) {
    log.error(`添加随机标记失败: ${e}`);
  }
};

// 清除所有标记
const clearAllMarkers = () => {
  if (!mapRef.value) return;
  
  // 使用removeAllMarkers代替clearMarkers
  mapRef.value.removeAllMarkers();
  allMarkersVisible.value = true;
  info('所有标记已清除');
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
      markerId: `marker-${groupName}-${Date.now()}-${i}`,
      markerGroup: groupName,
      markerLabel: `${color}组 ${i+1}`,
      markerColor,
      markerClickable: true
    });
  }
  
  // 更新分组可见性
  groupVisible[groupName] = true;
  log.info(`已添加${color}色标记组 (${count}个标记)`);
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
  
  try {
    if (allMarkersVisible.value) {
      // 隐藏所有标记
      mapRef.value.hideAllMarkers();
      allMarkersVisible.value = false;
    } else {
      // 显示所有标记
      mapRef.value.showAllMarkers();
      allMarkersVisible.value = true;
    }
    log.info(`标记点已${allMarkersVisible.value ? '显示' : '隐藏'}`);
  } catch (e) {
    log.error(`切换所有标记可见性失败: ${e}`);
  }
};

// 切换所有标签可见性
const toggleAllLabels = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    if (allLabelsVisible.value) {
      // 隐藏标签逻辑 - 直接使用mapRef.value的属性来处理
      const map = mapRef.value;
      map.getMap()?.closeTooltip();
      document.querySelectorAll('.leaflet-tooltip').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      allLabelsVisible.value = false;
      log.info('标记点标签已隐藏');
    } else {
      // 显示标签逻辑 - 刷新地图以重新渲染标签
      setTimeout(() => {
        document.querySelectorAll('.leaflet-tooltip').forEach(el => {
          (el as HTMLElement).style.display = '';
        });
        allLabelsVisible.value = true;
        log.info('标记点标签已显示');
      }, 50);
    }
  } catch (e) {
    log.error(`切换所有标签可见性失败: ${e}`);
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
      id: 'sample-track',
      name: '示例轨迹',
      points: points,
      color: '#FF5252',
      visible: true
    };
    
    // 直接添加轨迹
    mapRef.value.addTrack(track);
    hasTrack.value = true;
    info(`已添加示例轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '示例轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加示例轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 清除所有轨迹
const clearAllTracks = () => {
  try {
    // 直接停止轨迹播放器，更简洁的实现
    mapRef.value.stopTrackPlayer();
    
    hasTrack.value = false;
    log.info('所有轨迹已清除');
    
    // 提示用户
    ElMessage({
      message: '轨迹数据已清除',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`清除轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '清除轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
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
    // 直接添加轨迹
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    info(`已添加轨迹: ${name}，包含 ${points.length} 个点`);
  } catch (e) {
    error(`添加轨迹失败: ${name}`, e);
  }
};

// 添加多条轨迹
const addMultipleTracks = () => {
  try {
    // 生成多条轨迹
    const center = config.center;
    const tracks = [];
    
    // 生成四条不同方向的轨迹
    const directions = ['north', 'east', 'south', 'west'];
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107'];
    
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];
      const points = generateDirectionalTrack(center, direction, 0.05, 10);
      
      tracks.push({
        id: `track-${direction}`,
        name: `${direction}向轨迹`,
        points: points,
        color: colors[i],
        visible: true
      });
    }
    
    // 添加所有轨迹
    let addedCount = 0;
    tracks.forEach(track => {
      try {
        mapRef.value.addTrack(track);
        addedCount++;
      } catch (e) {
        log.error(`添加轨迹 ${track.name} 失败: ${e}`);
      }
    });
    
    if (addedCount > 0) {
      hasTrack.value = true;
      
      // 调整视图以包含所有轨迹
      fitTracksInView();
      
      log.info(`已添加 ${addedCount} 条轨迹`);
      
      // 提示用户
      ElMessage({
        message: `已添加 ${addedCount} 条轨迹`,
        type: 'success',
        duration: 3000
      });
    } else {
      log.warn('未能添加任何轨迹');
      
      // 提示用户
      ElMessage({
        message: '添加轨迹失败，请检查控制台日志',
        type: 'warning',
        duration: 3000
      });
    }
  } catch (e) {
    log.error(`添加多条轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加多条轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加环形轨迹
const addCircularTrack = () => {
  try {
    // 生成环形轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const radius = 0.02; // 大约2公里的半径
    const steps = 36; // 36个点，每10度一个点
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i * 10) * (Math.PI / 180); // 转换为弧度
      const lat = center[0] + radius * Math.sin(angle);
      const lng = center[1] + radius * Math.cos(angle);
      const direction = (i * 10 + 90) % 360; // 切线方向
      
      points.push({
        lat,
        lng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `环形轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '30 km/h' },
          { key: '方向', value: `${direction}°` }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'circular-track',
      name: '环形轨迹',
      points: points,
      color: '#8E44AD', // 紫色
      visible: true
    };
    
    // 添加轨迹
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加环形轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '环形轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加环形轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加环形轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加Z字形轨迹
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
      id: 'zigzag-track',
      name: 'Z字形轨迹',
      points: points,
      color: '#E74C3C', // 红色
      visible: true
    };
    
    // 添加轨迹并启动播放
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加Z字形轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: 'Z字形轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加Z字形轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加Z字形轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加随机轨迹
const addRandomTrack = () => {
  try {
    // 生成随机轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const pointsCount = 20 + Math.floor(Math.random() * 10); // 20-30个点
    
    // 初始点
    let currentLat = center[0] + (Math.random() * 0.02 - 0.01);
    let currentLng = center[1] + (Math.random() * 0.02 - 0.01);
    
    for (let i = 0; i < pointsCount; i++) {
      // 随机漫步
      const latChange = (Math.random() * 0.004 - 0.002);
      const lngChange = (Math.random() * 0.004 - 0.002);
      
      currentLat += latChange;
      currentLng += lngChange;
      
      // 计算移动方向
      const direction = Math.atan2(latChange, lngChange) * (180 / Math.PI);
      
      // 随机速度 (30-60 km/h)
      const speed = 30 + Math.floor(Math.random() * 30);
      
      points.push({
        lat: currentLat,
        lng: currentLng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `随机轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: `${speed} km/h` },
          { key: '方向', value: `${Math.round(direction)}°` }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'random-track',
      name: '随机轨迹',
      points: points,
      color: '#3498DB', // 蓝色
      visible: true
    };
    
    // 添加轨迹并启动播放
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加随机轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '随机轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加随机轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加随机轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
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

// 热力图相关方法
// 切换热力图状态
const toggleHeatMap = (enabled: boolean) => {
  if (!mapRef.value) return;
  
  try {
    // 使用toggleHeatMap方法切换热力图
    mapRef.value.toggleHeatMap(enabled);
    log.info(`热力图已${enabled ? '启用' : '禁用'}`);
  } catch (e) {
    log.error(`切换热力图状态失败: ${e}`);
  }
};

// 更新热力图选项
const updateHeatMapOptions = () => {
  if (!mapRef.value || !config.heatMapConfig.enabled) {
    return;
  }
  
  try {
    const options = {
      radius: config.heatMapConfig.options.radius,
      blur: config.heatMapConfig.options.blur,
      maxOpacity: config.heatMapConfig.options.maxOpacity,
      gradient: config.heatMapConfig.options.gradient
    };
    
    mapRef.value.updateHeatMapOptions(options);
    log.info('热力图选项已更新');
  } catch (e) {
    log.error(`更新热力图选项失败: ${e}`);
  }
};

// 从标记点生成热力图
const generateHeatMapFromMarkers = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    // 确保启用热力图
    if (!config.heatMapConfig.enabled) {
      config.heatMapConfig.enabled = true;
      // 使用toggleHeatMap代替enableHeatMap
      mapRef.value.toggleHeatMap(true);
    }
    
    // 生成随机点位置
    const center = config.center;
    const range = 0.01; // 范围更小，集中在标记点附近
    const pointsCount = 50; // 生成少量随机点
    
    // 生成随机点位置
    const heatPoints = [];
    for (let i = 0; i < pointsCount; i++) {
      // 随机位置，越靠近中心点密度越大
      const latOffset = (Math.random() - 0.5) * range * 2;
      const lngOffset = (Math.random() - 0.5) * range * 2;
      
      heatPoints.push({
        lat: center[0] + latOffset,
        lng: center[1] + lngOffset,
        value: 0.3 + Math.random() * 0.7
      });
    }
    
    // 设置热力图数据
    mapRef.value.setHeatMapData(heatPoints);
    log.info('已从标记点附近生成热力图');
  } catch (e) {
    log.error(`从标记点生成热力图失败: ${e}`);
  }
};

// 生成随机热力图数据
const generateRandomHeatMap = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    // 确保启用热力图
    if (!config.heatMapConfig.enabled) {
      config.heatMapConfig.enabled = true;
      // 使用toggleHeatMap代替enableHeatMap
      mapRef.value.toggleHeatMap(true);
    }
    
    const center = config.center;
    const range = 0.05; // 约5公里的范围
    const pointsCount = 100; // 生成100个随机点
    
    // 生成随机点位置
    const heatPoints = [];
    for (let i = 0; i < pointsCount; i++) {
      // 随机位置，越靠近中心点密度越大
      const latOffset = (Math.random() - 0.5) * range * 2;
      const lngOffset = (Math.random() - 0.5) * range * 2;
      
      // 距离中心点的距离影响权重
      const distanceRatio = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset) / range;
      // 权重随机，但距离中心点越近权重越大的可能性越高
      const weight = Math.random() * (1 - distanceRatio * 0.7);
      
      heatPoints.push({
        lat: center[0] + latOffset,
        lng: center[1] + lngOffset,
        value: weight
      });
    }
    
    // 添加几个固定的高权重热点
    heatPoints.push({
      lat: center[0],
      lng: center[1],
      value: 1.0 // 中心点最高权重
    });
    
    heatPoints.push({
      lat: center[0] + range * 0.3,
      lng: center[1] + range * 0.3,
      value: 0.8
    });
    
    heatPoints.push({
      lat: center[0] - range * 0.4,
      lng: center[1] + range * 0.2,
      value: 0.7
    });
    
    // 设置热力图数据
    mapRef.value.setHeatMapData(heatPoints);
    log.info(`已生成随机热力图数据: ${heatPoints.length}个点`);
  } catch (e) {
    log.error(`生成随机热力图失败: ${e}`);
  }
};

// 添加带有自动显示标签的标记点
const addMarkersWithAutoLabel = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.03; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < 3; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加带有自动显示标签的标记点
      map.addMarker({ lat, lng }, {
        markerId: `marker-auto-label-${Date.now()}-${i}`,
        markerGroup: 'auto-label-group',
        markerLabel: `自动标签 ${i+1}`,
        markerColor: color,
        markerClickable: true,
        markerShowLabel: true // 设置自动显示标签
      });
    }
    
    log.info('已添加带有自动显示标签的标记点');
  } catch (e) {
    log.error(`添加带有自动显示标签的标记点失败: ${e}`);
  }
};

// 添加一个带有自定义点击函数的标记组
const addMarkersWithCustomClick = () => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.03; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < 3; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加一些自定义数据
      const customData = {
        id: `data-${i}`,
        importance: Math.floor(Math.random() * 5) + 1,
        category: ['重要', '普通', '低优先级'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toLocaleString()
      };
      
      // 添加带有自定义点击函数的标记
      map.addMarker({ lat, lng }, {
        markerId: `marker-custom-click-${Date.now()}-${i}`,
        markerGroup: 'custom-click-group',
        markerLabel: `自定义点击 ${i+1}`,
        markerColor: color,
        markerClickable: true,
        markerCustomData: customData,
        markerClickFunction: (marker, event) => {
          // 创建自定义的点击处理逻辑
          ElMessage({
            message: `点击了标记 - ${customData.category}级别 (重要性:${customData.importance})`,
            type: customData.importance > 3 ? 'warning' : 'success',
            showClose: true,
            duration: 3000
          });
          
          // 可以执行更多自定义逻辑或调用其他函数
          console.log('标记点击事件:', marker, event, customData);
        }
      });
    }
    
    info('已添加带有自定义点击函数的标记点');
  } catch (e) {
    error('添加带有自定义点击函数的标记点失败:', e);
  }
};

// 处理查看更多标记详情事件
const onMarkerDetailView = (data: any) => {
  console.log('查看标记详情:', data);
  const markerData = data.data;
  
  if (markerData && markerData.type) {
    switch (markerData.type) {
      case 'attraction':
        ElMessage.success(`查看景点: ${markerData.name}`);
        break;
      case 'restaurant':
        ElMessage.success(`查看餐厅: ${markerData.name}`);
        break;
      case 'hotel':
        ElMessage.success(`查看酒店: ${markerData.name}`);
        break;
      default:
        ElMessage.info(`查看详情: ${data.id}`);
    }
  } else {
    ElMessage.info(`查看标记详情: ${data.id}`);
  }
};

// 在地图初始化后添加ScMap组件的引用
onMounted(() => {
  if (mapRef.value) {
    log.info('地图组件已初始化');
  }
});

// 导出到模板的函数
const mapTools = {
  addSampleTrack,
  clearAllTracks,
  addMultipleTracks,
  addCircularTrack,
  addZigzagTrack,
  addRandomTrack,
  // ... 其他地图操作函数
};

// 添加迁徙图示例数据
const addSampleMigration = () => {
  try {
    // 创建迁徙图示例数据
    const center = config.center;
    const migrationData = [
      {
        from: [center[1], center[0]] as [number, number],
        to: [center[1] + 0.1, center[0]] as [number, number],
        labels: {
          from: '北京',
          to: '天津'
        },
        color: '#FF5252',
        weight: 3
      },
      {
        from: [center[1], center[0]] as [number, number],
        to: [center[1] + 0.08, center[0] - 0.08] as [number, number],
        labels: {
          from: '北京',
          to: '保定'
        },
        color: '#448AFF',
        weight: 2
      },
      {
        from: [center[1], center[0]] as [number, number],
        to: [center[1] - 0.1, center[0] - 0.05] as [number, number],
        labels: {
          from: '北京',
          to: '石家庄'
        },
        color: '#66BB6A',
        weight: 4
      },
      {
        from: [center[1] - 0.1, center[0] - 0.05] as [number, number],
        to: [center[1] - 0.15, center[0] - 0.12] as [number, number],
        labels: {
          from: '石家庄',
          to: '邯郸'
        },
        color: '#FFC107',
        weight: 2
      }
    ];
    
    // 设置迁徙图数据
    mapRef.value.setMigrationData(migrationData, true);
    
    // 提示用户
    ElMessage({
      message: '迁徙图示例数据已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加迁徙图示例数据失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加迁徙图示例数据失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 基于当前中心点计算偏移位置
const offsetCenter = (latOffset: number, lngOffset: number): [number, number] => {
  const [lat, lng] = config.center;
  return [lat + latOffset, lng + lngOffset];
};

</script>

<style scoped>
.sc-map-example {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.example-content {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
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
  overflow-y: auto;
  max-height: calc(100vh - 100px);
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
