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
        <slot name="type-selector" :current-type="currentSearchType" :search-types="searchTypes" :on-change="handleSearchTypeChange"></slot>
      </div>
      
      <div class="search-input-container">
        <input v-if="type === 'input'" 
               v-model="searchText" 
               type="text" 
               :placeholder="currentPlaceholder"
               @input="handleInput" 
               @keyup.enter="handleSearch" 
               :class="{ 'coordinate-input': currentSearchType === 'coordinate' }" />
        
        <select v-else v-model="searchText" @change="handleInput">
          <option value="">请选择</option>
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <button type="button" class="search-button" @click="handleSearch">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 自定义搜索框插槽 -->
    <slot name="search-input" :search-text="searchText" :placeholder="currentPlaceholder" :on-input="handleInput" :on-search="handleSearch"></slot>
    
    <!-- 搜索结果列表 -->
    <transition name="slide-fade">
      <div v-if="showResults && results.length > 0" class="search-results">
        <div v-for="result in results" :key="result.id" class="result-item" @click="handleSelect(result)">
          <div class="result-content">
            <div class="result-title">{{ result.name }}</div>
            <div class="result-address">
              <span class="location-icon"></span>
              {{ result.address }}
            </div>
          </div>
          <div v-if="result.distance" class="result-distance">
            {{ formatDistance(result.distance) }}
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
    <div v-if="selectedMarker" class="navigation-panel">
      <button @click="handleNavigation" class="navigation-button">
        <span class="navigation-icon"></span>
        开始导航
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
  overflow: hidden;
  
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
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px;
    border-bottom: 1px solid rgba($border-color, 0.4);
    cursor: pointer;
    transition: background-color $transition-time;
    
    &:hover {
      background-color: rgba($primary-color, 0.03);
    }
    
    &:active {
      background-color: rgba($primary-color, 0.06);
    }
    
    .result-content {
      flex: 1;
      min-width: 0;
      margin-right: 10px;
    }
    
    .result-title {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    
    .result-distance {
      font-size: 12px;
      color: $primary-color;
      background-color: rgba($primary-color, 0.08);
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
      align-self: center;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    
    .empty-icon {
      display: block;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23dcdfe6' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z M7 9h5v1H7z'/%3E%3C/svg%3E") no-repeat center center;
      background-size: contain;
    }
    
    p {
      margin: 0 0 4px;
      font-size: 14px;
      color: $text-primary;
      font-weight: 500;
    }
    
    small {
      color: $text-muted;
      font-size: 12px;
    }
  }
  
  .navigation-panel {
    padding: 12px;
    display: flex;
    justify-content: center;
    border-top: 1px solid rgba($border-color, 0.6);
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
  transform: translateY(-10px);
  opacity: 0;
}

// 移动端适配
@media screen and (max-width: 768px) {
  .search-box {
    width: calc(100% - 20px);
    max-width: 340px;
  }
}
</style> 