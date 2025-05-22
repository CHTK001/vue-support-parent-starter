<template>
  <div class="search-box" :class="{ 'search-box--active': isActive }" :data-position="position">
    <div class="search-input-wrapper">
      <input
        type="text"
        v-model="keyword"
        class="search-input"
        :placeholder="placeholder"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
      />
      <button class="search-button" @click="handleSearch">
        <i class="search-icon"></i>
      </button>
    </div>
    
    <!-- 搜索结果列表 -->
    <div v-if="showResults" class="search-results">
      <div
        v-for="result in results"
        :key="result.id"
        class="search-result-item"
        @click="handleResultClick(result)"
      >
        <div class="result-name">{{ result.name }}</div>
        <div class="result-address">{{ result.address }}</div>
        <div v-if="result.distance" class="result-distance">
          {{ formatDistance(result.distance) }}
        </div>
      </div>
      <div v-if="results.length === 0" class="no-results">
        未找到相关结果
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps , defineEmits} from 'vue';
import type { PropType } from 'vue';
import type { SearchBoxConfig, SearchResult } from '../types/search';
import { searchLocation } from '../api/search';
import { DEFAULT_SEARCH_BOX_CONFIG } from '../types/default';
import { ConfigObject } from '../composables/ConfigObject';

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
});

// Emits 定义
const emit = defineEmits<{
  (e: 'search', results: SearchResult[]): void;
  (e: 'select', result: SearchResult): void;
}>();

// 响应式状态
const keyword = ref('');
const results = ref<SearchResult[]>([]);
const isActive = ref(false);
const showResults = ref(false);
let configObject = null;
let searchTimer: number | null = null;

// 处理输入
const handleInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = window.setTimeout(async () => {
    if (keyword.value.trim()) {
      try {
        const searchResults = await searchLocation(keyword.value, {}, props.searchBoxConfig, configObject);
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
const handleResultClick = (result: SearchResult) => {
  emit('select', result);
  showResults.value = false;
};

// 处理输入框焦点
const handleFocus = () => {
  isActive.value = true;
  if (results.value.length > 0) {
    showResults.value = true;
  }
};

// 处理输入框失焦
const handleBlur = () => {
  isActive.value = false;
  // 延迟隐藏结果列表，以便能够点击结果
  setTimeout(() => {
    showResults.value = false;
  }, 200);
};

// 格式化距离
const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

defineExpose({
  setConfigObject: (_configObject: ConfigObject) => {
    configObject = _configObject;
  }
})
</script>

<style lang="scss" scoped>
// 定义变量
$primary-color: #1890ff;
$border-color: #d9d9d9;
$text-color: #333333;
$hover-bg-color: rgba($primary-color, 0.1);
$box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
$transition-duration: 0.3s;

.search-box {
  width: 100%;
  max-width: 400px;
  margin: 10px;
  position: absolute;
  z-index: 4000;
  
  &[data-position="top-left"] {
    top: 0;
    left: 0;
  }
  
  &[data-position="top-right"] {
    top: 0;
    right: 0;
  }
  
  &[data-position="bottom-left"] {
    bottom: 0;
    left: 0;
  }
  
  &[data-position="bottom-right"] {
    bottom: 0;
    right: 0;
  }
  
  &--active {
    .search-input {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
    }
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  box-shadow: $box-shadow;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid $border-color;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: all $transition-duration;
  
  &:focus {
    border-color: $primary-color;
  }
}

.search-button {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: $hover-bg-color;
  }
}

.search-icon {
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: $box-shadow;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result-item {
  padding: 12px;
  cursor: pointer;
  transition: background-color $transition-duration;
  
  &:hover {
    background-color: $hover-bg-color;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid $border-color;
  }
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-color;
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.result-distance {
  font-size: 12px;
  color: $primary-color;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style> 