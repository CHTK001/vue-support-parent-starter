<template>
  <div class="sc-map-marker-popup">
    <!-- 标题 -->
    <div v-if="title" class="sc-map-marker-popup-title">{{ title }}</div>

    <!-- 坐标信息 -->
    <div class="sc-map-marker-popup-coords">
      <div class="coord-item">
        <span class="coord-label">纬度:</span> 
        <span class="coord-value">{{ formatCoord(lat) }}</span>
      </div>
      <div class="coord-item">
        <span class="coord-label">经度:</span> 
        <span class="coord-value">{{ formatCoord(lng) }}</span>
      </div>
    </div>

    <!-- 自定义数据 -->
    <div v-if="customData" class="sc-map-marker-popup-data">
      <template v-if="isObject(customData)">
        <div 
          v-for="(value, key) in filteredCustomData" 
          :key="key" 
          class="sc-map-marker-popup-item"
        >
          <span class="key">{{ formatKey(key) }}:</span>
          <span class="value">{{ formatValue(value) }}</span>
        </div>
      </template>
      <div v-else class="sc-map-marker-popup-text">{{ customData }}</div>
    </div>

    <!-- 自定义内容插槽 -->
    <slot name="custom-content"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 定义props
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  customData: {
    type: [Object, String, Number, Boolean, Array],
    default: null
  }
});

// 判断是否为对象类型
const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// 格式化坐标值，保持6位小数
const formatCoord = (value: number): string => {
  return value.toFixed(6);
};

// 格式化键名，将驼峰命名转换为空格分隔的标题形式
const formatKey = (key: string): string => {
  if (!key) return '';
  
  // 将驼峰命名转换为空格分隔
  const formatted = key
    .replace(/([A-Z])/g, ' $1') // 在大写字母前添加空格
    .replace(/^./, (str) => str.toUpperCase()); // 首字母大写
  
  return formatted;
};

// 格式化值，处理不同类型的数据
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[...]'; // 数组简化显示
  }
  
  if (isObject(value)) {
    return '{...}'; // 对象简化显示
  }
  
  // 数字和字符串直接返回
  return String(value);
};

// 过滤掉自定义数据中的函数和Symbol类型
const filteredCustomData = computed(() => {
  if (!isObject(props.customData)) {
    return null;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(props.customData as Record<string, any>)) {
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      result[key] = value;
    }
  }
  return result;
});
</script>

<style scoped>
.sc-map-marker-popup {
  padding: 12px;
  min-width: 200px;
  max-width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.sc-map-marker-popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.sc-map-marker-popup-coords {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #555;
}

.coord-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.coord-item:last-child {
  margin-bottom: 0;
}

.coord-label {
  font-weight: 500;
  color: #666;
}

.coord-value {
  font-family: monospace;
  color: #333;
}

.sc-map-marker-popup-data {
  margin-top: 12px;
  background-color: #fff;
  border-radius: 4px;
}

.sc-map-marker-popup-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #eee;
}

.sc-map-marker-popup-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.sc-map-marker-popup-item .key {
  font-weight: 500;
  margin-right: 10px;
  color: #444;
  flex-shrink: 0;
  max-width: 40%;
}

.sc-map-marker-popup-item .value {
  color: #666;
  text-align: right;
  word-break: break-word;
}

.sc-map-marker-popup-text {
  font-size: 13px;
  color: #666;
  background-color: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
}
</style> 