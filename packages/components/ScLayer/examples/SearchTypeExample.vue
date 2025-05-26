<template>
  <div class="search-type-example">
    <h2>搜索类型示例</h2>
    <div class="map-container">
      <div id="map" ref="mapRef" class="map"></div>
      
      <!-- 使用 ScLayer 组件 -->
      <ScLayer
        ref="scLayerRef"
        :api-urls="apiUrls"
        :map-key="mapKey"
        :map-type="mapType"
        :search-box-config="searchBoxConfig"
        :boundary-options="boundaryOptions"
        @ready="handleMapReady"
      />
    </div>
    
    <div class="control-panel">
      <h3>搜索类型控制</h3>
      <div class="control-row">
        <button @click="setSearchType(SearchType.KEYWORD)">关键词搜索</button>
        <button @click="setSearchType(SearchType.NEARBY)">附近搜索</button>
        <button @click="setSearchType(SearchType.DISTRICT)">行政区搜索</button>
      </div>
      
      <h3>自定义搜索类型</h3>
      <div class="control-row">
        <button @click="addCustomSearchType">添加自定义搜索类型</button>
        <button @click="removeCustomSearchType">移除自定义搜索类型</button>
      </div>
      
      <h3>当前搜索类型: {{ currentSearchType }}</h3>
      <div class="search-results">
        <h4>搜索结果 ({{ searchResults.length }})</h4>
        <ul>
          <li v-for="result in searchResults" :key="result.id">
            {{ result.name }} - {{ result.address }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import ScLayer from '../index.vue';
import { MapType } from '../types/map';
import { SearchType, SearchResult, SearchBoxConfig } from '../types/search';
import { ApiUrls } from '../types/api';
import { BoundaryOptions } from '../types/boundary';
import { DEFAULT_SEARCH_BOX_CONFIG } from '../types/default';

// 地图配置
const mapType = ref<MapType>(MapType.GAODE);
const mapKey = reactive({
  [MapType.GAODE]: 'your-amap-key',
  [MapType.BAIDU]: 'your-baidu-key',
  [MapType.TENCENT]: 'your-tencent-key'
});

// API URLs
const apiUrls: ApiUrls = reactive({
  search: 'https://restapi.amap.com/v3/place/text',
  detail: 'https://restapi.amap.com/v3/place/detail',
  navigation: 'https://restapi.amap.com/v3/direction/driving',
  boundary: 'https://restapi.amap.com/v3/config/district',
  district: 'https://restapi.amap.com/v3/config/district'
});

// 搜索框配置
const searchBoxConfig = reactive<SearchBoxConfig>({
  ...DEFAULT_SEARCH_BOX_CONFIG,
  showTypeSelector: true,
  defaultSearchType: SearchType.KEYWORD,
  searchTypes: [
    {
      type: SearchType.KEYWORD,
      label: '关键词',
      placeholder: '请输入搜索关键词'
    },
    {
      type: SearchType.NEARBY,
      label: '附近',
      placeholder: '请输入附近搜索关键词'
    },
    {
      type: SearchType.DISTRICT,
      label: '行政区',
      placeholder: '请输入行政区名称'
    }
  ],
  // 自定义搜索处理函数
  customSearchHandler: async (type, keyword, options) => {
    console.log(`自定义搜索处理: 类型=${type}, 关键词=${keyword}`);
    
    // 如果是自定义搜索类型，返回模拟数据
    if (type === SearchType.CUSTOM) {
      return [
        {
          id: 'custom-1',
          name: `自定义结果: ${keyword}`,
          address: '自定义地址示例',
          location: { lng: 116.397428, lat: 39.90923 },
          type: 'custom'
        }
      ] as SearchResult[];
    }
    
    // 其他类型返回空结果，让默认处理器处理
    return null;
  }
});

// 边界选择器配置
const boundaryOptions = reactive<BoundaryOptions>({
  position: 'top-left',
  apiUrls: apiUrls
});

// 组件引用
const mapRef = ref<HTMLElement | null>(null);
const scLayerRef = ref(null);

// 状态
const currentSearchType = ref<SearchType>(SearchType.KEYWORD);
const searchResults = ref<SearchResult[]>([]);

// 地图就绪事件处理
const handleMapReady = () => {
  console.log('地图已就绪');
  
  // 获取搜索框组件
  const searchBox = scLayerRef.value?.getSearchBox();
  
  // 设置搜索结果监听
  searchBox?.onSearch((results) => {
    console.log('搜索结果:', results);
    searchResults.value = results;
  });
  
  // 设置搜索类型变化监听
  searchBox?.on('type-change', (type) => {
    console.log('搜索类型变化:', type);
    currentSearchType.value = type;
  });
};

// 设置搜索类型
const setSearchType = (type: SearchType) => {
  const searchBox = scLayerRef.value?.getSearchBox();
  if (searchBox) {
    searchBox.setSearchType(type);
    currentSearchType.value = type;
  }
};

// 添加自定义搜索类型
const addCustomSearchType = () => {
  // 检查是否已存在自定义类型
  if (searchBoxConfig.searchTypes.find(t => t.type === SearchType.CUSTOM)) {
    console.log('自定义搜索类型已存在');
    return;
  }
  
  // 添加自定义搜索类型
  searchBoxConfig.searchTypes.push({
    type: SearchType.CUSTOM,
    label: '自定义',
    placeholder: '请输入自定义搜索内容'
  });
  
  console.log('已添加自定义搜索类型');
};

// 移除自定义搜索类型
const removeCustomSearchType = () => {
  const index = searchBoxConfig.searchTypes.findIndex(t => t.type === SearchType.CUSTOM);
  if (index >= 0) {
    searchBoxConfig.searchTypes.splice(index, 1);
    console.log('已移除自定义搜索类型');
    
    // 如果当前选中的是自定义类型，切换回关键词搜索
    if (currentSearchType.value === SearchType.CUSTOM) {
      setSearchType(SearchType.KEYWORD);
    }
  }
};

// 组件挂载时初始化
onMounted(() => {
  console.log('组件已挂载');
});
</script>

<style scoped>
.search-type-example {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.map-container {
  position: relative;
  height: 60%;
  min-height: 400px;
}

.map {
  width: 100%;
  height: 100%;
}

.control-panel {
  padding: 16px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  flex: 1;
  overflow-y: auto;
}

h2, h3, h4 {
  margin-top: 0;
  margin-bottom: 16px;
}

.control-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #40a9ff;
}

.search-results {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

ul {
  padding-left: 20px;
  margin: 0;
}

li {
  margin-bottom: 8px;
}
</style> 