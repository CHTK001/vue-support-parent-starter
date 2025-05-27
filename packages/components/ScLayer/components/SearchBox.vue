<template>
  <div class="search-box" :class="[position, { 'is-select': type === 'select' }]">
    <div class="search-container">
      <div v-if="showTypeSelector" class="search-type-selector">
        <div class="custom-select">
          <select v-model="currentSearchType" @change="handleSearchTypeChange">
          <option v-for="typeConfig in searchTypes" :key="typeConfig.type" :value="typeConfig.type">
            {{ typeConfig.label }}
          </option>
        </select>
          <div class="select-arrow"></div>
        </div>
        <slot name="type-selector" :current-type="currentSearchType" :search-types="searchTypes"
          :on-change="handleSearchTypeChange"></slot>
      </div>
      
      <div class="search-input-container">
        <input v-if="type === 'input'" v-model="searchText" type="text" :placeholder="currentPlaceholder"
          @input="handleInput" @keyup.enter="handleSearch"
          :class="{ 'coordinate-input': currentSearchType === 'coordinate' }" />

        <select v-else v-model="searchText" @change="handleInput">
          <option value="">请选择</option>
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <button type="button" class="search-button" @click="handleSearch">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor"
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 自定义搜索框插槽 -->
    <slot name="search-input" :search-text="searchText" :placeholder="currentPlaceholder" :on-input="handleInput"
      :on-search="handleSearch"></slot>
    
    <!-- 搜索结果列表 -->
    <transition name="slide-fade">
    <div v-if="showResults && results.length > 0" class="search-results">
        <div v-for="result in results" :key="result.id" class="result-item"
          :class="{ 'selected': selectedMarker === result.id }" @click="handleSelect(result)">
          <div class="result-content" @click="handleSelect(result)">
        <div class="result-title">{{ result.name }}</div>
            <div class="result-address">
              <span class="location-icon"></span>
              {{ result.address }}
            </div>
          </div>
          <div class="result-actions">
            <div v-if="result.distance" class="result-distance">
              {{ formatDistance(result.distance) }}
            </div>
            <div class="action-buttons">
              <button class="action-btn start-btn" :class="{ 'active': startPointId === result.id }"
                @click.stop="setAsStartPoint(result)" title="从这里出发">
                <span class="start-icon"></span>
                从这出发
              </button>
              <button class="action-btn end-btn" :class="{ 'active': endPointId === result.id }"
                @click.stop="setAsEndPoint(result)" title="到这里去">
                <span class="end-icon"></span>
                到这去
              </button>
            </div>
          </div>
      </div>
      
      <!-- 自定义搜索结果插槽 -->
      <slot name="search-results" :results="results" :on-select="handleSelect"></slot>
    </div>
    </transition>

    <!-- 添加暂无数据提示 -->
    <transition name="slide-fade">
      <div v-if="showResults && results.length === 0 && searchText.trim()" class="search-results empty-results">
        <div class="empty-state">
          <span class="empty-icon"></span>
          <p>未找到结果</p>
          <small>请尝试其他关键词或搜索方式</small>
        </div>
      </div>
    </transition>

    <!-- 导航按钮 -->
    <div v-if="startPointId && endPointId" class="navigation-panel">
      <div class="route-endpoints">
        <div class="endpoint start-point">
          <span class="endpoint-icon start-icon"></span>
          <span class="endpoint-text">起点：{{ getMarkerTitle(startPointMarkerId) }}</span>
        </div>
        <div class="endpoint-divider"></div>
        <div class="endpoint end-point">
          <span class="endpoint-icon end-icon"></span>
          <span class="endpoint-text">终点：{{ getMarkerTitle(endPointMarkerId) }}</span>
        </div>
      </div>
      
      <div class="transport-type-selector">
        <div v-for="type in transportTypes" :key="type.value" class="transport-type-option"
          :class="{ 'active': currentTransportType === type.value }" @click="selectTransportType(type.value)"
          :title="type.label">
          <span :class="['transport-icon', type.value + '-icon']"></span>
          <span class="transport-label">{{ type.label }}</span>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <button @click="createRouteNavigation" class="navigation-button">
          <span class="navigation-icon"></span>
          开始导航
        </button>
        <button @click="clearRoutePoints" class="clear-button">
          清除
        </button>
      </div>
    </div>

    <!-- 导航路线详情面板 -->
    <transition name="slide-fade">
      <div v-if="showRouteDetails && routeDetails.length > 0" 
           class="route-details" 
           :class="[getRouteDetailsPanelPosition(), {'is-dragging': isDragging, 'is-closing': isClosing}]"
           ref="routeDetailsPanel"
           @touchstart="handleTouchStart"
           @touchmove="handleTouchMove"
           @touchend="handleTouchEnd">
        <!-- 下拉提示条 -->
        <div class="drag-handle">
          <div class="drag-handle-line"></div>
          <div class="drag-hint">下拉关闭</div>
        </div>

        <div class="route-summary">
          <div class="route-info">
            <span class="route-distance">{{ formatDistance(routeTotalDistance) }}</span>
            <span class="route-duration">{{ formatDuration(routeTotalDuration) }}</span>
          </div>
          <div class="route-actions">
            <button @click="closeRouteDetails" class="close-button" title="关闭导航详情">
              <span class="close-icon">×</span>
            </button>
          </div>
        </div>

        <!-- 多条路线选择 -->
        <div class="route-options" v-if="alternativeRoutes.length > 0">
          <div class="route-option-title">备选路线</div>
          <div class="route-options-list">
            <div v-for="(route, index) in alternativeRoutes" :key="index" class="route-option"
              :class="{ 'active': currentRouteIndex === index }" @click="selectRoute(index)">
              <div class="route-option-info">
                <div class="route-option-name">路线 {{ index + 1 }}</div>
                <div class="route-option-stats">
                  <span class="route-option-distance">{{ formatDistance(route.distance) }}</span>
                  <span class="route-option-duration">{{ formatDuration(route.duration) }}</span>
                </div>
              </div>
              <div class="route-option-traffic" :class="getTrafficClass(route.traffic)">
                {{ getTrafficText(route.traffic) }}
              </div>
            </div>
          </div>
        </div>

        <transition name="slide-down">
          <div v-if="showRouteDetailsList" class="route-steps">
            <div v-for="(step, index) in routeDetails" :key="index" class="route-step">
              <div class="step-icon-container">
                <div class="step-icon" :class="getStepIconClass(step)"></div>
                <div v-if="index < routeDetails.length - 1" class="step-line"></div>
              </div>
              <div class="step-content">
                <div class="step-instruction">{{ step.instruction }}</div>
                <div class="step-info">
                  <span v-if="step.roadName" class="road-name">{{ step.roadName }}</span>
                  <span class="step-distance">{{ formatDistance(step.distance) }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps, defineEmits, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { SearchBoxConfig, SearchResult, SearchTypeConfig } from '../types/search';
import { SearchType } from '../types/search';
import { DEFAULT_END_ICON, DEFAULT_SEARCH_BOX_CONFIG, DEFAULT_START_ICON } from '../types/default';
import { ConfigObject } from '../composables/ConfigObject';
import { SearchObject } from '../composables/SearchObject';
import { SearchHandlerFactory } from '../interfaces/SearchHandler';
import { ElMessage } from 'element-plus';

// Props 定义
const props = defineProps({
  placeholder: {
    type: String,
    default: '请输入搜索关键词'
  },
  debounceTime: {
    type: Number,
    default: 300
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value: string) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
  },
  searchBoxConfig: {
    type: Object as PropType<SearchBoxConfig>,
    default: () => ({...DEFAULT_SEARCH_BOX_CONFIG})
  },
  type: {
    type: String,
    default: 'input',
    validator: (value: string) => ['input', 'select'].includes(value)
  },
  options: {
    type: Array as PropType<{ value: string; label: string }[]>,
    default: () => []
  },
});

let searchObject: SearchObject = null;

// Emits 定义
const emit = defineEmits<{
  (e: 'search', results: SearchResult[]): void;
  (e: 'select', result: SearchResult): void;
  (e: 'type-change', type: SearchType): void;
}>();

// 响应式状态
const searchText = ref('');
const results = ref<SearchResult[]>([]);
const showResults = ref(false);
let configObject = null;
let searchTimer: number | null = null;
const selectedMarker = ref<string | null>(null);

// 搜索类型相关
const currentSearchType = ref<SearchType>(props.searchBoxConfig.defaultSearchType || SearchType.KEYWORD);
const showTypeSelector = computed(() => props.searchBoxConfig.showTypeSelector !== false);
const searchTypes = computed(() => props.searchBoxConfig.searchTypes || []);

// 根据当前搜索类型获取占位符
const currentPlaceholder = computed(() => {
  const typeConfig = searchTypes.value.find(config => config.type === currentSearchType.value);
  return typeConfig?.placeholder || props.placeholder;
});

// 验证坐标是否有效
const isValidCoordinate = computed(() => {
  if (currentSearchType.value !== SearchType.COORDINATE || !searchText.value.trim()) {
    return false;
  }
  
  // 使用搜索处理器验证输入
  const handler = SearchHandlerFactory.getHandler(currentSearchType.value);
  if (handler && handler.validateInput) {
    return handler.validateInput(searchText.value);
  }
  
  // 如果没有处理器，使用默认验证逻辑
  try {
    // 尝试解析坐标字符串，支持多种格式
    const coordStr = searchText.value.trim().replace(/，/g, ',').replace(/\s+/g, ',');
    const coords = coordStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    
    if (coords.length >= 2) {
      const lng = coords[0];
      const lat = coords[1];
      
      // 验证坐标是否在有效范围内
      return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }
  } catch (error) {
    return false;
  }
  
  return false;
});

// 监听搜索类型变化
watch(currentSearchType, (newType) => {
  if (searchObject) {
    searchObject.setSearchType(newType);
    emit('type-change', newType);
    // 清空搜索结果
    results.value = [];
    showResults.value = false;
  }
});

// 组件挂载时检查初始化状态
onMounted(() => {
  console.log('SearchBox 组件已挂载，检查搜索对象状态');
  if (!searchObject) {
    console.warn('搜索对象尚未初始化，请确保在使用搜索功能前调用 setSearchObject 方法');
  } else {
    console.log('搜索对象已就绪');
    // 设置初始搜索类型
    searchObject.setSearchType(currentSearchType.value);
  }
});

// 处理搜索类型变更
const handleSearchTypeChange = (event) => {
  const newType = event.target ? event.target.value : event;
  currentSearchType.value = newType;
  // 清空搜索框
  searchText.value = '';
  // 清空搜索结果，不触发搜索
  results.value = [];
  showResults.value = false;
  
  // 如果导航路线详情面板已打开，则关闭
  if (showRouteDetails.value) {
    closeRouteDetails();
  }
};

// 处理输入
const handleInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = window.setTimeout(async () => {
    if (searchText.value.trim()) {
      try {
        // 检查 searchObject 是否已初始化
        if (!searchObject) {
          console.error('搜索对象未初始化，请确保在使用搜索功能前调用 setSearchObject 方法');
          ElMessage.error('搜索功能未准备好，请稍后再试');
          return;
        }
        
        // 使用搜索处理器验证输入
        const handler = SearchHandlerFactory.getHandler(currentSearchType.value);
        if (handler && handler.validateInput && !handler.validateInput(searchText.value)) {
          ElMessage.warning('请输入有效的搜索内容');
          return;
        }
        
        // 如果导航路线详情面板已打开，则关闭
        if (showRouteDetails.value) {
          closeRouteDetails();
        }
        
        console.log(`开始搜索: ${searchText.value}, 类型: ${currentSearchType.value}`);
        const searchResults = await searchObject.search(searchText.value, props.searchBoxConfig as any, currentSearchType.value);
        console.log('搜索结果:', searchResults);
        results.value = searchResults;
        showResults.value = true; // 无论结果是否为空，都显示结果区域
        emit('search', searchResults);
      } catch (error) {
        console.error('搜索失败:', error);
        ElMessage.error('搜索失败: ' + (error.message || '未知错误'));
        results.value = [];
        showResults.value = true; // 搜索失败时也显示空结果
      }
    } else {
      results.value = [];
      showResults.value = false;
    }
  }, props.debounceTime);
};

// 处理搜索按钮点击
const handleSearch = async () => {
  if (!searchText.value.trim()) return;
  
  try {
    if (searchObject) {
      // 如果导航路线详情面板已打开，则关闭
      if (showRouteDetails.value) {
        closeRouteDetails();
      }
      
      // 开始搜索
      await searchObject.search(searchText.value, props.searchBoxConfig, currentSearchType.value);
    }
  } catch (error) {
    console.error('搜索失败:', error);
  }
};

// 添加起点和终点相关的响应式状态
const startPointId = ref<string | null>(null);
const endPointId = ref<string | null>(null);
const startPointMarkerId = ref<string | null>(null);
const endPointMarkerId = ref<string | null>(null);

// 设置起点
const setAsStartPoint = (result: SearchResult) => {
  // 如果已经是起点，则取消选择
  if (startPointId.value === result.id) {
    // 移除起点标记
    if (startPointMarkerId.value && searchObject) {
      searchObject.removeMarker(startPointMarkerId.value);
      startPointMarkerId.value = null;
    }
    startPointId.value = null;
    return;
  }
  
  // 设置为新的起点
  startPointId.value = result.id;
  
  if (searchObject) {
    // 移除旧的起点标记（如果存在）
    if (startPointMarkerId.value) {
      searchObject.removeMarker(startPointMarkerId.value);
    }
    
    // 添加新的起点标记
    const markerId = searchObject.addMarker({
      ...result,
      position: result.location,
      icon: {
        url: DEFAULT_START_ICON,
        className: 'start-point-marker',
        label: {
          text: '起点',
          className: 'start-point-label'
        }
      },
      zIndex: 1000
    });
    
    startPointMarkerId.value = markerId;
  }
};

// 设置终点
const setAsEndPoint = (result: SearchResult) => {
  // 如果已经是终点，则取消选择
  if (endPointId.value === result.id) {
    // 移除终点标记
    if (endPointMarkerId.value && searchObject) {
      searchObject.removeMarker(endPointMarkerId.value);
      endPointMarkerId.value = null;
    }
    endPointId.value = null;
    return;
  }
  
  // 设置为新的终点
  endPointId.value = result.id;
  
  if (searchObject) {
    // 移除旧的终点标记（如果存在）
    if (endPointMarkerId.value) {
      searchObject.removeMarker(endPointMarkerId.value);
    }
    
    // 添加新的终点标记
    const markerId = searchObject.addMarker({
      ...result,
      position: result.location,
      icon: {
        url: DEFAULT_END_ICON,
        className: 'end-point-marker',
        label: {
          text: '终点',
          className: 'end-point-label'
        }
      },
      zIndex: 1000
    });
    
    endPointMarkerId.value = markerId;
  }
};

// 导航相关
const transportTypes = [
  { value: 'driving', label: '驾车' },
  { value: 'walking', label: '步行' },
  { value: 'bicycling', label: '骑行' },
  { value: 'ebike', label: '电动车' }
];
const currentTransportType = ref('driving');

// 选择交通工具类型
const selectTransportType = (type: string) => {
  currentTransportType.value = type;
};

// 路线详情相关
const showRouteDetails = ref(false);
const showRouteDetailsList = ref(true); // 控制详情列表的显示/隐藏
const routeDetails = ref<any[]>([]);
const routeTotalDistance = ref(0);
const routeTotalDuration = ref(0);

// 下拉关闭相关
const routeDetailsPanel = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isClosing = ref(false);
const touchStartY = ref(0);
const touchCurrentY = ref(0);
const dragThreshold = 100; // 下拉多少像素触发关闭

// 多条路线选择相关
const alternativeRoutes = ref<any[]>([]); // 备选路线列表
const currentRouteIndex = ref(0); // 当前选中的路线索引

// 修改 selectRoute 方法，使用更通用的方式处理路线切换
const selectRoute = (index: number) => {
  if (index === currentRouteIndex.value || !alternativeRoutes.value[index]) {
    return;
  }
  
  currentRouteIndex.value = index;
  const selectedRoute = alternativeRoutes.value[index];
  
  // 更新路线详情
  routeTotalDistance.value = selectedRoute.distance || 0;
  routeTotalDuration.value = selectedRoute.duration || 0;
  
  // 更新路线步骤
  if (selectedRoute.steps && selectedRoute.steps.length > 0) {
    updateRouteDetails(selectedRoute.steps);
  }
  
  // 通知 SearchObject 切换路线（如果有相应方法）
  try {
    if (searchObject) {
      // 尝试使用通用方法调用，避免直接依赖特定方法名
      const navigationResponse = searchObject.getNavigationInfo();
      if (navigationResponse && navigationResponse.route && navigationResponse.route.paths && 
          navigationResponse.route.paths.length > index) {
        // 重新创建导航，使用相同的起终点但选择不同的路线
        searchObject.createNavigation(
          startPointMarkerId.value, 
          endPointMarkerId.value, 
          currentTransportType.value
        ).catch(err => console.error('切换路线失败:', err));
        
        // 由于无法直接选择路线，我们只能重新创建导航，然后在UI上显示不同路线的详情
        console.log(`已切换到路线 ${index + 1}`);
      }
    }
  } catch (error) {
    console.error('切换路线时发生错误:', error);
  }
};

// 获取交通状况类名
const getTrafficClass = (traffic: number | string): string => {
  if (typeof traffic === 'undefined' || traffic === null) {
    return 'traffic-unknown';
  }
  
  const trafficValue = typeof traffic === 'string' ? parseInt(traffic, 10) : traffic;
  
  if (trafficValue < 1.2) return 'traffic-smooth';
  if (trafficValue < 1.5) return 'traffic-normal';
  if (trafficValue < 2) return 'traffic-slow';
  return 'traffic-congested';
};

// 获取交通状况文本
const getTrafficText = (traffic: number | string): string => {
  if (typeof traffic === 'undefined' || traffic === null) {
    return '未知';
  }
  
  const trafficValue = typeof traffic === 'string' ? parseInt(traffic, 10) : traffic;
  
  if (trafficValue < 1.2) return '畅通';
  if (trafficValue < 1.5) return '正常';
  if (trafficValue < 2) return '缓行';
  return '拥堵';
};

// 更新路线详情
const updateRouteDetails = (steps: any[]) => {
  routeDetails.value = [];
  
  // 添加起点
  routeDetails.value.push({
    action: 'start',
    instruction: '起点',
    distance: 0,
    duration: 0,
    roadName: ''
  });
  
  // 添加各个步骤
  steps.forEach((step: any, index: number) => {
    // 解析指令中的行动
    const action = parseStepAction(step.instruction || '');
    
    // 处理不同API返回格式的兼容
    const distance = step.distance || step.step_distance || 0;
    const duration = step.duration || (step.cost?.duration || 0);
    const roadName = step.road_name || step.road || '';
    
    routeDetails.value.push({
      action,
      instruction: step.instruction || `步骤 ${index + 1}`,
      distance,
      duration,
      roadName
    });
  });
  
  // 添加终点
  routeDetails.value.push({
    action: 'end',
    instruction: '终点',
    distance: 0,
    duration: 0,
    roadName: ''
  });
};

// 关闭路线详情
const closeRouteDetails = () => {
  console.log('关闭路线详情面板');
  
  // 重置面板样式
  if (routeDetailsPanel.value) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      routeDetailsPanel.value.style.setProperty('--drag-y', '0px');
      routeDetailsPanel.value.style.transform = 'translateX(-50%)';
    } else {
      routeDetailsPanel.value.style.transform = '';
    }
  }
  
  // 重置状态
  showRouteDetails.value = false;
  showRouteDetailsList.value = true; // 重置为默认展开状态
  routeDetails.value = [];
  isDragging.value = false;
  isClosing.value = false;
  
  console.log('路线详情面板已关闭');
};

// 获取步骤图标类名
const getStepIconClass = (step: any) => {
  if (step.action === 'start') return 'icon-start';
  if (step.action === 'end') return 'icon-end';
  
  switch (step.action) {
    case 'straight': return 'icon-straight';
    case 'left': return 'icon-left';
    case 'right': return 'icon-right';
    case 'slight-left': return 'icon-slight-left';
    case 'slight-right': return 'icon-slight-right';
    case 'uturn': return 'icon-uturn';
    default: return 'icon-straight';
  }
};

// 格式化距离显示
const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance}米`;
  } else {
  return `${(distance / 1000).toFixed(1)}公里`;
  }
};

// 格式化时间显示
const formatDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration}秒`;
  } else if (duration < 3600) {
    return `${Math.floor(duration / 60)}分钟`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
  }
};

// 在 script setup 部分添加一个辅助函数
const checkRouteDetailsVisibility = () => {
  console.log('路线详情面板可见性状态:', {
    showRouteDetails: showRouteDetails.value,
    hasRouteDetails: routeDetails.value.length > 0,
    position: props.position,
    panelPosition: getRouteDetailsPanelPosition()
  });
};

// 创建导航路线并显示详情
const createRouteNavigation = async () => {
  console.log('开始创建导航路线');
  
  if (!startPointId.value || !endPointId.value) {
    ElMessage.warning('请先设置起点和终点');
    return;
  }
  
  try {
    // 调用导航方法
    await searchObject.createNavigation(startPointMarkerId.value, endPointMarkerId.value, currentTransportType.value);
    console.log('导航路线创建成功，准备获取导航信息');
    
    // 获取导航路线信息
    const navigationResponse = searchObject.getNavigationInfo();
    console.log('获取到导航信息:', navigationResponse);
    
    // 重置路线选择状态
    alternativeRoutes.value = [];
    currentRouteIndex.value = 0;
    
    if (navigationResponse && navigationResponse.route && navigationResponse.route.paths && navigationResponse.route.paths.length > 0) {
      // 处理主路线
      const mainPath = navigationResponse.route.paths[0];
      routeTotalDistance.value = mainPath.distance || 0;
      routeTotalDuration.value = mainPath.duration || 0;
      
      // 处理路线步骤
      const steps = mainPath.steps || [];
      updateRouteDetails(steps);
      
      // 处理备选路线
      if (navigationResponse.route.paths.length > 1) {
        // 添加主路线到备选路线列表
        alternativeRoutes.value.push({
          distance: mainPath.distance || 0,
          duration: mainPath.duration || 0,
          traffic: mainPath.traffic_condition || 1,
          steps: mainPath.steps || [],
          isMain: true
        });
        
        // 添加其他备选路线
        for (let i = 1; i < navigationResponse.route.paths.length; i++) {
          const path = navigationResponse.route.paths[i];
          alternativeRoutes.value.push({
            distance: path.distance || 0,
            duration: path.duration || 0,
            traffic: path.traffic_condition || 1,
            steps: path.steps || [],
            isMain: false
          });
        }
      }
      
      console.log('路线详情准备完成，共', routeDetails.value.length, '个步骤');
      // 显示路线详情
      showRouteDetails.value = true;
      console.log('设置 showRouteDetails =', showRouteDetails.value);
    } else {
      // 如果没有路线详情，尝试使用默认值显示简单的路线信息
      routeTotalDistance.value = 0;
      routeTotalDuration.value = 0;
      
      routeDetails.value = [
        {
          action: 'start',
          instruction: '起点',
          distance: 0,
          duration: 0,
          roadName: ''
        },
        {
          action: 'straight',
          instruction: '沿道路直行',
          distance: 0,
          duration: 0,
          roadName: '未知道路'
        },
        {
          action: 'end',
          instruction: '终点',
          distance: 0,
          duration: 0,
          roadName: ''
        }
      ];
      
      // 显示路线详情
      showRouteDetails.value = true;
    }
    
    ElMessage.success('导航路线已生成');
    // 检查路线详情面板可见性
    setTimeout(checkRouteDetailsVisibility, 100);
  } catch (error) {
    console.error('创建导航路线失败:', error);
    ElMessage.error('创建导航路线失败');
  }
};

// 解析步骤指令中的行动
const parseStepAction = (instruction: string): string => {
  if (!instruction) return 'straight';
  
  const leftTurns = ['左转', '向左转', '左前方转弯', '左后方转弯'];
  const rightTurns = ['右转', '向右转', '右前方转弯', '右后方转弯'];
  const slightLeftTurns = ['稍向左转', '左前方行驶'];
  const slightRightTurns = ['稍向右转', '右前方行驶'];
  const uTurns = ['掉头', 'U形转弯', '调头'];
  
  for (const term of leftTurns) {
    if (instruction.includes(term)) return 'left';
  }
  
  for (const term of rightTurns) {
    if (instruction.includes(term)) return 'right';
  }
  
  for (const term of slightLeftTurns) {
    if (instruction.includes(term)) return 'slight-left';
  }
  
  for (const term of slightRightTurns) {
    if (instruction.includes(term)) return 'slight-right';
  }
  
  for (const term of uTurns) {
    if (instruction.includes(term)) return 'uturn';
  }
  
  return 'straight';
};

// 清除路线点
const clearRoutePoints = () => {
  if (searchObject) {
    // 清除起点标记
    if (startPointMarkerId.value) {
      searchObject.removeMarker(startPointMarkerId.value);
      startPointMarkerId.value = null;
    }
    
    // 清除终点标记
    if (endPointMarkerId.value) {
      searchObject.removeMarker(endPointMarkerId.value);
      endPointMarkerId.value = null;
    }
    
    // 清除导航路线
    searchObject.clearNavigation();
  }
  
  // 重置状态
  startPointId.value = null;
  endPointId.value = null;
};

// 修改 handleSelect 方法，避免与起点终点按钮冲突
const handleSelect = (result) => {
  // 调用 searchObject 的 selectResult 方法
  if (searchObject) {
    searchObject.selectResult(result);
    
    // 记录当前选中的标记
    selectedMarker.value = result.id;
  }
  
  // 触发 select 事件
  emit('select', result);
};

// 在组件销毁时清理资源
onBeforeUnmount(() => {
  clearRoutePoints();
  
  // 关闭路线详情
  showRouteDetails.value = false;
  routeDetails.value = [];
  routeTotalDistance.value = 0;
  routeTotalDuration.value = 0;
});

// 获取路线详情面板的位置类名
const getRouteDetailsPanelPosition = () => {
  // 根据搜索框的位置决定路线详情面板的位置
  switch (props.position) {
    case 'top-left':
      return 'panel-right';
    case 'top-right':
      return 'panel-left';
    case 'bottom-left':
      return 'panel-top-right';
    case 'bottom-right':
      return 'panel-top-left';
    default:
      return 'panel-left';
  }
};

// 修改 getMarkerTitle 方法
const getMarkerTitle = (markerId: string | null): string => {
  if (!markerId || !searchObject) {
    return '未设置';
  }
  
  // 从搜索结果中查找对应的标记信息
  const result = results.value.find(r => {
    if (r.id === startPointId.value && markerId === startPointMarkerId.value) {
      return true;
    }
    if (r.id === endPointId.value && markerId === endPointMarkerId.value) {
      return true;
    }
    return false;
  });
  
  return result?.name || '未知位置';
};

defineExpose({
  setConfigObject: (_configObject: ConfigObject) => {
    configObject = _configObject;
  },
  setSearchObject: (_searchObject: SearchObject) => {
    searchObject = _searchObject;
    console.log('搜索对象已初始化', searchObject);
    
    // 设置初始搜索类型
    if (searchObject) {
      searchObject.setSearchType(currentSearchType.value);
    }
  },
  isSearchReady: () => {
    return !!searchObject;
  },
  setSearchType: (type: SearchType) => {
    currentSearchType.value = type;
  },
  getCurrentSearchType: () => currentSearchType.value,
  clearResults: () => {
    results.value = [];
    showResults.value = false;
  }
})

// 处理触摸开始
const handleTouchStart = (event: TouchEvent) => {
  touchStartY.value = event.touches[0].clientY;
  touchCurrentY.value = touchStartY.value;
  isDragging.value = false;
  isClosing.value = false;
};

// 处理触摸移动
const handleTouchMove = (event: TouchEvent) => {
  touchCurrentY.value = event.touches[0].clientY;
  const deltaY = touchCurrentY.value - touchStartY.value;
  
  // 只处理向下拖动
  if (deltaY > 0) {
    isDragging.value = true;
    
    // 应用变换，但有阻尼效果
    if (routeDetailsPanel.value) {
      const transform = Math.min(deltaY * 0.5, 200);
      
      // 检查是否为移动设备（根据CSS媒体查询的结果）
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      
      if (isMobile) {
        // 在移动设备上，我们使用CSS变量来控制拖动
        routeDetailsPanel.value.style.setProperty('--drag-y', `${transform}px`);
        routeDetailsPanel.value.style.transform = `translateX(-50%) translateY(${transform}px)`;
      } else {
        // 在桌面设备上，我们直接使用transform
        routeDetailsPanel.value.style.transform = `translateY(${transform}px)`;
      }
      
      // 如果拖动超过阈值，显示关闭提示
      if (deltaY > dragThreshold) {
        isClosing.value = true;
      } else {
        isClosing.value = false;
      }
    }
    
    // 阻止默认行为（页面滚动）
    event.preventDefault();
  }
};

// 处理触摸结束
const handleTouchEnd = () => {
  const deltaY = touchCurrentY.value - touchStartY.value;
  
  if (deltaY > dragThreshold) {
    // 如果拖动超过阈值，关闭面板
    closeRouteDetails();
  } else if (routeDetailsPanel.value) {
    // 否则恢复原位
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
      routeDetailsPanel.value.style.setProperty('--drag-y', '0px');
      routeDetailsPanel.value.style.transform = 'translateX(-50%)';
    } else {
      routeDetailsPanel.value.style.transform = '';
    }
  }
  
  isDragging.value = false;
  isClosing.value = false;
};
</script>

<style lang="scss" scoped>
// 变量定义
$primary-color: #3370ff;
$primary-hover: #4c80ff;
$primary-active: #1e58e4;
$border-color: #dcdfe6;
$border-hover: #c0c4cc;
$text-primary: #333333;
$text-secondary: #666666;
$text-muted: #909399;
$success-color: #52c41a;
$error-color: #f5222d;
$border-radius: 4px;
$box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
$transition-time: 0.2s;

.search-box {
  position: absolute;
  z-index: 1000;
  width: 340px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  background-color: #fff;
  
  .search-container {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid rgba($border-color, 0.6);
  }
  
  .search-type-selector {
    margin-right: 8px;
    width: 85px;
    
    .custom-select {
      position: relative;
      height: 36px;
      
      select {
        appearance: none;
        width: 100%;
        height: 100%;
        padding: 0 26px 0 10px;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        background-color: #fff;
      font-size: 14px;
        color: $text-primary;
        cursor: pointer;
        transition: all $transition-time;
        
        &:hover {
          border-color: $border-hover;
        }
      
      &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
        }
      }
      
      .select-arrow {
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid $text-secondary;
        pointer-events: none;
      }
    }
  }
  
  .search-input-container {
    position: relative;
    flex: 1;
    height: 36px;
  
    input, select {
    width: 100%;
      height: 100%;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      padding: 0 40px 0 12px;
    font-size: 14px;
      color: $text-primary;
      transition: all $transition-time;
      
      &::placeholder {
        color: $text-muted;
      }
      
      &:hover {
        border-color: $border-hover;
      }
    
    &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
      }
      
      &.coordinate-input {
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
      }
    }
    
    .search-button {
    position: absolute;
      top: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border: none;
      background: none;
    cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $text-secondary;
      border-radius: 0 $border-radius $border-radius 0;
      transition: all $transition-time;
    
    &:hover {
        color: $primary-color;
        background-color: rgba($primary-color, 0.05);
      }
      
      &:active {
        color: $primary-active;
      }
    }
  }
  
  .search-results {
    max-height: 300px;
    overflow-y: auto;
    background-color: #fff;
    
    &::-webkit-scrollbar {
      width: 5px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
    
    &.empty-results {
      padding: 30px 0;
    }
  }
  
  .result-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    border-bottom: 1px solid rgba($border-color, 0.4);
    transition: background-color $transition-time;
    
    &:hover {
      background-color: rgba($primary-color, 0.03);
    }
    
    .result-content {
    cursor: pointer;
      flex: 1;
      min-width: 0;
      margin-bottom: 8px;
    
    &:hover {
        .result-title {
          color: $primary-color;
        }
      }
    }
    
    .result-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.2s;
    }
    
    .result-address {
      font-size: 12px;
      color: $text-secondary;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      .location-icon {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-right: 4px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666666' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
        opacity: 0.7;
      }
    }
    
    .result-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .result-distance {
      font-size: 12px;
      color: $primary-color;
      background-color: rgba($primary-color, 0.08);
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
      margin-right: 8px;
    }
    
    .action-buttons {
      display: flex;
      gap: 6px;
    }
    
    .action-btn {
    display: flex;
      align-items: center;
    justify-content: center;
      padding: 3px 8px;
      border-radius: 3px;
      border: 1px solid rgba($border-color, 0.8);
      background-color: #fff;
      font-size: 12px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
      
      &.active {
        background-color: $primary-color;
        border-color: $primary-color;
      color: white;
      }
      
      .start-icon, .end-icon {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-right: 3px;
      }
      
      .start-icon {
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231aad19' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
      }
      
      .end-icon {
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff525d' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
      }
    }
  }
  
  .navigation-panel {
    padding: 12px;
    display: block;
    justify-content: space-between;
    border-top: 1px solid rgba($border-color, 0.6);
    
    .route-endpoints {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 8px;
      background-color: #f8f8f8;
      border-radius: $border-radius;
      
      .endpoint {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        
        .endpoint-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        .start-icon {
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231aad19' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat center center;
          background-size: contain;
        }
        
        .end-icon {
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ff525d' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E") no-repeat center center;
          background-size: contain;
        }
        
        .endpoint-text {
          font-size: 13px;
          color: $text-primary;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .endpoint-divider {
        width: 1px;
        height: 20px;
        background-color: $border-color;
        margin: 0 10px;
        flex-shrink: 0;
      }
    }
    
    .transport-type-selector {
      display: flex;
      gap: 8px;
      padding: 8px 0;
      justify-content: space-between;
      border-bottom: 1px solid rgba($border-color, 0.4);
      margin-bottom: 10px;
      
      .transport-type-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 4px;
        border-radius: 6px;
        background-color: #fff;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        
        &:hover {
          background-color: rgba($primary-color, 0.05);
        }
        
        &.active {
          background-color: rgba($primary-color, 0.1);
          
          .transport-icon {
            transform: scale(1.1);
          }
          
          .transport-label {
            color: $primary-color;
            font-weight: 500;
          }
        }
        
        .transport-icon {
          display: block;
          width: 24px;
          height: 24px;
          margin-bottom: 4px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          transition: transform 0.2s;
          
          &.driving-icon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'/%3E%3C/svg%3E");
          }
          
          &.walking-icon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234CAF50'%3E%3Cpath d='M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7'/%3E%3C/svg%3E");
          }
          
          &.bicycling-icon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF9800'%3E%3Cpath d='M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z'/%3E%3C/svg%3E");
          }
          
          &.ebike-icon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239C27B0'%3E%3Cpath d='M19 7h-.82l-1.7-4.68C16.19 1.53 15.44 1 14.6 1H12v2h2.6l1.46 4h-4.81l-.36-1H12V4H7v2h1.75l1.82 5H9.9c-.44-2.23-2.31-3.88-4.65-3.99C2.45 6.87 0 9.2 0 12c0 2.8 2.2 5 5 5 2.46 0 4.45-1.69 4.9-4h4.2c.44 2.23 2.31 3.88 4.65 3.99 2.8.13 5.25-2.19 5.25-5C24 9.2 21.8 7 19 7zM7.82 13c-.4 1.17-1.49 2-2.82 2-1.68 0-3-1.32-3-3s1.32-3 3-3c1.33 0 2.42.83 2.82 2H5v2h2.82zm6.28-2h-1.4l-.73-2H15c-.44.58-.76 1.25-.9 2zm4.9 4c-1.68 0-3-1.32-3-3 0-.93.41-1.73 1.05-2.28l.96 2.64 1.88-.68-.97-2.67c.03 0 .06-.01.09-.01 1.68 0 3 1.32 3 3s-1.33 3-3.01 3z'/%3E%3C/svg%3E");
          }
        }
        
        .transport-label {
          font-size: 12px;
          color: $text-secondary;
          transition: all 0.2s;
        }
      }
    }
    
    .navigation-buttons {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    
    .navigation-button {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $primary-color;
      color: white;
      border: none;
      border-radius: $border-radius;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: all $transition-time;
      flex: 1;
      margin-right: 8px;
      
      &:hover {
        background-color: $primary-hover;
      }
      
      &:active {
        background-color: $primary-active;
        transform: translateY(1px);
      }
      
      .navigation-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-right: 6px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z'/%3E%3C/svg%3E") no-repeat center center;
        background-size: contain;
      }
    }
    
    .clear-button {
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      background-color: white;
      color: $text-secondary;
      cursor: pointer;
      transition: all $transition-time;
      
      &:hover {
        border-color: $error-color;
        color: $error-color;
      }
      
      &:active {
        background-color: rgba($error-color, 0.05);
      }
    }
  }
  
  // 路线详情样式
  .route-details {
    border: 1px solid rgba($border-color, 0.6);
    flex-direction: column;
    background-color: #fff;
    position: absolute;
    top: 0;
    right: 100%;
    margin-right: 10px;
    width: 300px;
    border-radius: $border-radius;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    height: 100%;
    transition: transform 0.3s ease;
    
    // 拖动状态
    &.is-dragging {
      transition: none;
    }
    
    // 关闭状态
    &.is-closing {
      .drag-hint {
        opacity: 1;
        transform: translateY(0);
      }
      
      .drag-handle-line {
        background-color: $primary-color;
      }
    }
    
    // 下拉手柄
    .drag-handle {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0 4px;
      
      .drag-handle-line {
        width: 40px;
        height: 4px;
        background-color: $border-color;
        border-radius: 2px;
        transition: background-color 0.3s ease;
      }
      
      .drag-hint {
        font-size: 12px;
        color: $primary-color;
        margin-top: 4px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
      }
    }
    
    // 根据搜索框位置调整路线详情面板位置
    &.panel-left {
      right: 100%;
      left: auto;
      margin-right: 10px;
    }
    
    &.panel-right {
      left: 100%;
      right: auto;
      margin-left: 10px;
    }
    
    &.panel-top-left {
      right: 0;
      bottom: 100%;
      top: auto;
      margin-bottom: 10px;
      margin-right: 0;
    }
    
    &.panel-top-right {
      left: 0;
      bottom: 100%;
      top: auto;
      margin-bottom: 10px;
      margin-left: 0;
    }
    
    // 调试信息样式
    .debug-info {
      padding: 8px;
      background-color: #f8f8f8;
      border-bottom: 1px dashed #ccc;
      font-size: 12px;
      color: #666;
      
      .debug-title {
        font-weight: bold;
        margin-bottom: 4px;
        color: #333;
      }
      
      .debug-item {
        display: flex;
        margin-bottom: 2px;
        
        .debug-label {
          width: 80px;
          font-weight: 500;
        }
        
        .debug-value {
          flex: 1;
        }
      }
    }
    
    // 路线选择样式
    .route-options {
      padding: 10px 15px;
      border-bottom: 1px solid rgba($border-color, 0.6);
      
      .route-option-title {
        font-size: 14px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 8px;
      }
      
      .route-options-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .route-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid rgba($border-color, 0.6);
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            border-color: $primary-color;
            background-color: rgba($primary-color, 0.03);
          }
          
          &.active {
            border-color: $primary-color;
            background-color: rgba($primary-color, 0.08);
            
            .route-option-name {
              color: $primary-color;
              font-weight: 500;
            }
          }
          
          .route-option-info {
            flex: 1;
            min-width: 0;
            
            .route-option-name {
              font-size: 14px;
              color: $text-primary;
              margin-bottom: 4px;
            }
            
            .route-option-stats {
              display: flex;
              gap: 8px;
              font-size: 12px;
              color: $text-secondary;
              
              .route-option-distance {
                color: $text-secondary;
              }
              
              .route-option-duration {
                color: $text-secondary;
              }
            }
          }
          
          .route-option-traffic {
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 12px;
            font-weight: 500;
            
            &.traffic-smooth {
              background-color: rgba(#52c41a, 0.1);
              color: #52c41a;
            }
            
            &.traffic-normal {
              background-color: rgba(#1890ff, 0.1);
              color: #1890ff;
            }
            
            &.traffic-slow {
              background-color: rgba(#faad14, 0.1);
              color: #faad14;
            }
            
            &.traffic-congested {
              background-color: rgba(#f5222d, 0.1);
              color: #f5222d;
            }
            
            &.traffic-unknown {
              background-color: rgba($text-secondary, 0.1);
              color: $text-secondary;
            }
          }
        }
      }
    }
    
    .route-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      background-color: #f5f5f5;
      border-top-left-radius: $border-radius;
      border-top-right-radius: $border-radius;
      
      .route-info {
        display: flex;
        justify-content: space-between;
        
        .route-distance {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .route-duration {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }
      }
      
      .route-actions {
        display: flex;
        align-items: center;
        
        .toggle-details-button {
          border: none;
          background: none;
          color: $primary-color;
          font-size: 13px;
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          margin-right: 8px;
          
          .arrow-icon {
            display: inline-block;
            width: 0;
            height: 0;
            margin-left: 4px;
            
            &.down {
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 4px solid $primary-color;
            }
            
            &.up {
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-bottom: 4px solid $primary-color;
            }
          }
        }
        
        .close-button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background-color: #f0f0f0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          
          &:hover {
            background-color: #e0e0e0;
          }
          
          .close-icon {
            font-size: 16px;
            line-height: 1;
          }
        }
      }
    }
    
    .route-steps {
      overflow-y: auto;
      padding: 0 0 10px;
      
      &::-webkit-scrollbar {
        width: 5px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb:hover {
        background: #aaa;
      }
      
      .route-step {
        display: flex;
        padding: 10px 15px;
        position: relative;
        
        &:hover {
          background-color: #f9f9f9;
        }
        
        .step-icon-container {
          width: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 12px;
          
          .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #fff;
            border: 1px solid #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            background-position: center;
            background-repeat: no-repeat;
            background-size: 14px;
            
            &.icon-start {
              background-color: #1aad19;
              border-color: #1aad19;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E");
            }
            
            &.icon-end {
              background-color: #ff525d;
              border-color: #ff525d;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E");
            }
            
            &.icon-straight {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z'/%3E%3C/svg%3E");
            }
            
            &.icon-left {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z'/%3E%3C/svg%3E");
            }
            
            &.icon-right {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'/%3E%3C/svg%3E");
            }
            
            &.icon-slight-left {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M14.12 15.88L9.24 11l4.88-4.88L13 5l-6 6 6 6z'/%3E%3C/svg%3E");
              transform: rotate(-45deg);
            }
            
            &.icon-slight-right {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M9.88 15.88L14.76 11l-4.88-4.88L11 5l6 6-6 6z'/%3E%3C/svg%3E");
              transform: rotate(45deg);
            }
            
            &.icon-uturn {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233370FF'%3E%3Cpath d='M7 18v-6c0-3.31 2.69-6 6-6s6 2.69 6 6v7h2v-7c0-4.42-3.58-8-8-8s-8 3.58-8 8v6H3l4 4 4-4H7z'/%3E%3C/svg%3E");
            }
          }
          
          .step-line {
            position: absolute;
            width: 2px;
            background-color: #e8e8e8;
            top: 24px;
            bottom: 0;
            left: 12px;
            z-index: 1;
          }
        }
        
        .step-content {
          flex: 1;
          
          .step-instruction {
            font-size: 14px;
            color: #333;
            line-height: 1.4;
            margin-bottom: 4px;
          }
          
          .step-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #999;
            
            .road-name {
              color: #666;
              margin-right: 8px;
              font-weight: 500;
            }
            
            .step-distance {
              color: #999;
            }
          }
        }
      }
    }
  }
}

// 位置相关样式
.search-box.top-left {
  top: 10px;
  left: 10px;
}

.search-box.top-right {
  top: 10px;
  right: 10px;
}

.search-box.bottom-left {
  bottom: 10px;
  left: 10px;
}

.search-box.bottom-right {
  bottom: 10px;
  right: 10px;
}

// 动画效果
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

// 添加动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

// 移动端适配
@media screen and (max-width: 768px) {
  .search-box {
    width: calc(100% - 20px);
    max-width: 340px;
    
    .action-buttons {
      .action-btn {
        padding: 3px 6px;
        font-size: 11px;
        
        .start-icon, .end-icon {
          width: 10px;
          height: 10px;
          margin-right: 2px;
        }
      }
    }
    
    .navigation-panel {
      .route-endpoints {
        .endpoint-text {
          font-size: 12px;
        }
      }
      
      .transport-type-selector {
        .transport-type-option {
          padding: 6px 2px;
          
          .transport-icon {
            width: 20px;
            height: 20px;
          }
          
          .transport-label {
            font-size: 11px;
          }
        }
      }
    }
  }
  
  .route-details {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: auto;
    bottom: 10px;
    margin: 0;
    width: calc(100% - 20px);
    max-width: 400px;
    border: 1px solid rgba($border-color, 0.6);
    max-height: 60vh;
    overflow-y: auto;
    
    &.is-dragging {
      overflow-y: hidden;
    }
    
    .drag-handle {
      padding: 12px 0 8px;
      
      .drag-handle-line {
        width: 60px;
        height: 5px;
      }
      
      .drag-hint {
        font-size: 13px;
        margin-top: 6px;
      }
    }
    
    &.panel-left,
    &.panel-right,
    &.panel-top-left,
    &.panel-top-right {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
      top: auto;
      bottom: 10px;
      margin: 0;
      
      &.is-dragging {
        transform: translateX(-50%) translateY(var(--drag-y, 0));
      }
    }
    
    .route-options {
      .route-option {
        padding: 6px 10px;
        
        .route-option-info {
          .route-option-name {
            font-size: 13px;
          }
          
          .route-option-stats {
            font-size: 11px;
          }
        }
        
        .route-option-traffic {
          font-size: 11px;
          padding: 1px 4px;
        }
      }
    }
    
    .route-steps {
      .route-step {
        padding: 8px 12px;
        
        .step-icon {
          width: 20px;
          height: 20px;
        }
        
        .step-content {
          .step-instruction {
            font-size: 13px;
          }
          
          .step-info {
            font-size: 11px;
          }
        }
      }
    }
  }
}
</style> 