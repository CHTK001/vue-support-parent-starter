<template>
  <div class="search-box" :class="[position, { 'is-select': type === 'select' }]">
    <div class="search-input-wrapper">
      <input v-if="type === 'input'" v-model="searchText" type="text" :placeholder="placeholder"
        @input="handleInput" class="search-input" />
      <select v-else v-model="searchText" @change="handleInput" class="search-select">
        <option value="">请选择</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div class="search-icon">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path fill="currentColor"
            d="M795.904 750.72l124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704z" />
        </svg>
        </div>
    </div>
    <div v-if="showResults && results.length > 0" class="search-results">
      <div v-for="result in results" :key="result.id" class="search-result-item" @click="handleSelect(result)">
        <div class="result-title">{{ result.name }}</div>
        <div class="result-address">{{ result.address }}</div>
      </div>
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
import { ref, defineExpose, defineProps , defineEmits} from 'vue';
import type { PropType } from 'vue';
import type { SearchBoxConfig, SearchResult } from '../types/search';
import { DEFAULT_SEARCH_BOX_CONFIG } from '../types/default';
import { ConfigObject } from '../composables/ConfigObject';
import { SearchObject } from '../composables/SearchObject';
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
}>();

// 响应式状态
const searchText = ref('');
const results = ref<SearchResult[]>([]);
const showResults = ref(false);
let configObject = null;
let searchTimer: number | null = null;
const selectedMarker = ref<string | null>(null);

// 处理输入
const handleInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = window.setTimeout(async () => {
    if (searchText.value.trim()) {
      try {
        const searchResults = await searchObject.searchLocationsearchLocation(searchText.value, {}, props.searchBoxConfig, configObject);
        results.value = searchResults;
        showResults.value = true;
        emit('search', searchResults);
      } catch (error) {
        console.error('搜索失败:', error);
        results.value = [];
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
}

.current-point {
  height: 36px;
  line-height: 36px;
  padding-top: 8px;
}

.search-box:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input,
.search-select {
  width: 100%;
  height: 36px;
  padding: 8px 32px 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: #f8f8f8;
  transition: all 0.3s ease;
}

.search-input:focus,
.search-select:focus {
  outline: none;
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 20px;
  color: #999;
  pointer-events: none;
  display: flex;
  transition: color 0.3s ease;
}

.search-input:focus + .search-icon {
  color: #1890ff;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
  border-radius: 0 0 8px 8px;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.result-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: #999;
}

/* 位置样式 */
.top-left {
  top: 20px;
  left: 20px;
}

.top-right {
  top: 20px;
  right: 20px;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}

/* 滚动条美化 */
.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-track {
  background: #f5f5f5;
}

/* 选择框特殊样式 */
.search-box.is-select .search-input-wrapper {
  padding: 0;
}

.search-box.is-select .search-select {
  border: none;
  background: transparent;
  padding-right: 32px;
}

.search-box.is-select .search-select:focus {
  box-shadow: none;
}

.navigation-buttons {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #1890ff;
  border-radius: 4px;
  background: #fff;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-button:hover {
  background: #1890ff;
  color: #fff;
}

.nav-icon {
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzE4OTBmZiIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjxwYXRoIGZpbGw9IiMxODkwZmYiIGQ9Ik0xMiA2djZoNnYtNnoiLz48L3N2Zz4=');
  background-size: contain;
  background-repeat: no-repeat;
}

.nav-button:hover .nav-icon {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMiA2djZoNnYtNnoiLz48L3N2Zz4=');
}
</style> 