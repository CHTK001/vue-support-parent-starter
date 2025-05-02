<template>
  <div class="sc-map-marker-popup" v-if="visible" :style="popupStyle">
    <div class="sc-map-marker-popup-close" @click="handleClose">×</div>

    <!-- 标题区域插槽 -->
    <slot name="marker-header" :data="marker.options.markerCustomData">
      <div class="sc-map-marker-popup-title">{{ marker.options.markerCustomData?.label || '标记详情' }}</div>
    </slot>

    <!-- 自定义内容插槽 (保留原有的custom-content插槽) -->
    <slot name="marker" :latlng="marker.getLatLng()" :data="marker.options.markerCustomData"></slot>

    <!-- 添加指向marker的小三角形 -->
    <div class="sc-map-marker-popup-arrow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import type { Marker as LeafletMarker } from 'leaflet';

// 定义props，简化为只接收marker和地图实例
const props = defineProps({
  customData: {
    type: [Object, String, Number, Boolean, Array],
    default: null
  },
  // marker属性
  marker: {
    type: Object as () => LeafletMarker | null,
    default: null
  },
  // visible属性
  visible: {
    type: Boolean,
    default: false
  },
  // 添加地图实例属性
  map: {
    type: Object,
    default: null
  }
});

// 定义事件
const emit = defineEmits(['close', 'update:visible']);

// 本地数据状态
const localTitle = ref('');
const localLat = ref(0);
const localLng = ref(0);
const localCustomData = ref(null);

// 更新地图标记数据
const updateMarkerData = () => {
  if (!props.marker) return;
  
  try {
    // 从marker获取坐标信息
    const position = props.marker.getLatLng();
    localLat.value = position.lat;
    localLng.value = position.lng;

    // 从marker选项中获取标题和自定义数据
    const options = props.marker.options as any;
    if (options) {
      localTitle.value = options.markerLabel || '标记详情';
      localCustomData.value = options.markerCustomData || props.customData || null;
    }
  } catch (e) {
    console.error('从marker获取数据失败:', e);
  }
};

// 监听marker变化
watch(() => props.marker, (newMarker) => {
  if (newMarker) {
    updateMarkerData();
  }
}, { immediate: true });

// 监听visible变化，确保在显示时获取最新数据
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.marker) {
    // 当弹框显示时，更新数据
    updateMarkerData();
  }
});

// 组件挂载时确保数据已更新
onMounted(() => {
  if (props.visible && props.marker) {
    updateMarkerData();
  }
});

// 计算marker位置
const markerPosition = computed(() => {
  if (!props.marker) {
    return { top: 0, left: 0 };
  }
  
  try {
    // 获取标记DOM元素
    const iconElement = props.marker._icon;
    if (!iconElement) {
      console.warn('弹框组件 - 标记元素不存在');
      return { top: 0, left: 0 };
    }
    
    // 获取元素边界矩形
    const rect = iconElement.getBoundingClientRect();
    
    // 计算中心点
    const centerX = rect.left + rect.width / 2;
    
    // 计算顶部位置，确保弹框在标记上方但不会太远
    const topPosition = rect.top - 10; // 标记顶部上方10像素，比之前减少距离
    
    return {
      left: centerX,
      top: topPosition
    };
  } catch (e) {
    console.error('计算标记位置失败:', e);
    return { top: 0, left: 0 };
  }
});

// 计算popup样式
const popupStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: markerPosition.value.left + 'px',
    top: markerPosition.value.top + 'px',
    transform: 'translate(-50%, -95%)', // 调整垂直偏移，使弹框更贴近marker
    zIndex: '1000',
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    borderRadius: '4px'
  };
});

// 监听地图移动事件，更新popup位置
watch(() => props.map, (newMap) => {
  if (newMap && props.visible) {
    // 添加地图移动结束事件监听
    newMap.on('moveend', () => {
      if (props.visible) {
        // 更新标记数据并强制更新组件
        updateMarkerData();
        nextTick();
      }
    });
  }
}, { immediate: true });

// 关闭弹窗
const handleClose = () => {
  emit('close');
  emit('update:visible', false);
};

// 判断是否为对象类型
const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// 格式化坐标值，保持6位小数
const formatCoord = (value: number): string => {
  return value?.toFixed(6) || '0.000000';
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
  if (!isObject(localCustomData.value)) {
    return null;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(localCustomData.value as Record<string, any>)) {
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
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.sc-map-marker-popup-close {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  font-weight: bold;
  border-radius: 50%;
}

.sc-map-marker-popup-close:hover {
  background-color: #f0f0f0;
  color: #666;
}

.sc-map-marker-popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  padding-right: 20px; /* 为关闭按钮留出空间 */
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

/* 添加小三角形样式 */
.sc-map-marker-popup-arrow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
  /* 添加阴影效果，与弹框一致 */
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}
</style> 