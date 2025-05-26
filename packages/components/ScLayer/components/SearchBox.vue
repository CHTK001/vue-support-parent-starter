<template>
  <div class="search-box" :class="[position, { 'is-select': type === 'select' }]">
    <div class="search-container">
      <!-- 搜索类型选择器 -->
      <div v-if="showTypeSelector" class="search-type-selector">
        <select v-model="currentSearchType" @change="handleSearchTypeChange" class="type-select">
          <option v-for="typeConfig in searchTypes" :key="typeConfig.type" :value="typeConfig.type">
            {{ typeConfig.label }}
          </option>
        </select>
        <!-- 自定义类型选择器插槽 -->
        <slot name="type-selector" :current-type="currentSearchType" :search-types="searchTypes" :on-change="handleSearchTypeChange"></slot>
      </div>
      
      <div class="search-input-wrapper">
        <input v-if="type === 'input'" v-model="searchText" type="text" :placeholder="currentPlaceholder"
          @input="handleInput" class="search-input" :class="{ 'coordinate-input': currentSearchType === 'coordinate' }" />
        <select v-else v-model="searchText" @change="handleInput" class="search-select">
          <option value="">请选择</option>
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <div class="search-icon" @click="handleSearch">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <path fill="currentColor"
              d="M795.904 750.72l124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704z" />
          </svg>
        </div>
        <!-- 坐标输入提示 -->
        <div v-if="currentSearchType === 'coordinate' && searchText.trim()" 
             class="coordinate-hint" 
             :class="{ 'valid': isValidCoordinate }">
          {{ isValidCoordinate ? '✓ 有效坐标' : '请输入有效的经纬度坐标，如：116.404,39.915' }}
        </div>
      </div>
    </div>
    
    <!-- 自定义搜索框插槽 -->
    <slot name="search-input" :search-text="searchText" :placeholder="currentPlaceholder" :on-input="handleInput" :on-search="handleSearch"></slot>
    
    <div v-if="showResults && results.length > 0" class="search-results">
      <div v-for="result in results" :key="result.id" class="search-result-item" @click="handleSelect(result)">
        <div class="result-title">{{ result.name }}</div>
        <div class="result-address">{{ result.address }}</div>
        <div v-if="result.distance" class="result-distance">{{ formatDistance(result.distance) }}</div>
      </div>
      
      <!-- 自定义搜索结果插槽 -->
      <slot name="search-results" :results="results" :on-select="handleSelect"></slot>
    </div>
    
    <!-- 添加暂无数据提示 -->
    <div v-if="showResults && results.length === 0 && searchText.trim()" class="search-results empty-results">
      <div class="no-data">暂无数据</div>
    </div>
    
    <div v-if="selectedMarker" class="navigation-buttons">
      <button @click="handleNavigation" class="nav-button">
        <i class="nav-icon"></i>
        导航
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps, defineEmits, onMounted, computed, watch } from 'vue';
import type { PropType } from 'vue';
import type { SearchBoxConfig, SearchResult, SearchTypeConfig } from '../types/search';
import { SearchType } from '../types/search';
import { DEFAULT_SEARCH_BOX_CONFIG } from '../types/default';
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
const handleSearch = () => {
  handleInput();
};

// 处理结果点击
const handleSelect = (result: SearchResult) => {
  emit('select', result);
  showResults.value = false;
};

// 格式化距离
const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

const handleNavigation = () => {
  if (!selectedMarker.value) return;
  
  // 获取当前选中的标记点作为起点
  const fromMarkerId = selectedMarker.value;
  
  // 获取地图中心点作为终点
  const center = searchObject.getMapCenter();
  if (!center) return;
  
  // 创建终点标记点
  const toMarkerId = searchObject.addSearchMarker({
    location: {
      lng: center[0],
      lat: center[1]
    },
    name: '目的地'
  } as SearchResult);
  
  if (toMarkerId) {
    // 创建导航轨迹
    searchObject.createNavigation(fromMarkerId, toMarkerId);
  }
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
</script>

<style lang="scss" scoped>
.search-box {
  position: absolute;
  z-index: 1000;
  width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  .search-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .search-type-selector {
    width: 80px;
    
    .type-select {
      width: 100%;
      height: 36px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 0 8px;
      font-size: 14px;
      color: #606266;
      outline: none;
      
      &:focus {
        border-color: #409eff;
      }
    }
  }
  
  .search-input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }
  
  .search-input, .search-select {
    width: 100%;
    height: 36px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 0 30px 0 10px;
    font-size: 14px;
    color: #606266;
    outline: none;
    
    &:focus {
      border-color: #409eff;
    }
    
    &.coordinate-input {
      font-family: monospace;
      letter-spacing: 0.5px;
    }
  }
  
  .search-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #909399;
    
    &:hover {
      color: #409eff;
    }
  }
  
  .search-results {
    max-height: 300px;
    overflow-y: auto;
    border-top: 1px solid #ebeef5;
    
    &.empty-results {
      padding: 20px 0;
      text-align: center;
    }
    
    .no-data {
      color: #909399;
      font-size: 14px;
    }
  }
  
  .search-result-item {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #f2f6fc;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    .result-title {
      font-size: 14px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 4px;
    }
    
    .result-address {
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .result-distance {
      font-size: 12px;
      color: #67c23a;
      margin-top: 4px;
    }
  }
  
  .navigation-buttons {
    padding: 10px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #ebeef5;
    
    .nav-button {
      background-color: #409eff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      
      &:hover {
        background-color: #66b1ff;
      }
      
      .nav-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-right: 4px;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==');
        background-size: contain;
      }
    }
  }
}

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

.coordinate-hint {
  position: absolute;
  bottom: -20px;
  left: 0;
  font-size: 12px;
  color: #909399;
  width: 100%;
  text-align: left;
  
  &.valid {
    color: #67c23a;
  }
}
</style> 