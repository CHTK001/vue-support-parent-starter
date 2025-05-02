<template>
  <div class="sc-map-shape-popup" v-if="visible" :style="popupStyle">
    <div class="sc-map-shape-popup-close" @click="handleClose">×</div>

    <!-- 标题区域插槽 -->
    <slot name="shape-header" :data="shapeOptions">
      <div class="sc-map-shape-popup-title">{{ shapeTitle }}</div>
    </slot>

    <!-- 自定义内容插槽 -->
    <slot name="shape" :data="shapeOptions" :type="shapeType">
      <!-- 默认内容 -->
      <div class="sc-map-shape-popup-content">
        <!-- 形状类型信息 -->
        <div class="sc-map-shape-popup-type">{{ shapeTypeText }}</div>
        
        <!-- 形状坐标信息 -->
        <div class="sc-map-shape-popup-coords">
          <template v-if="shapeType === 'circle'">
            <div class="coord-item">
              <span class="coord-label">中心点:</span>
              <span class="coord-value">
                {{ formatCenter(shapeCenter) }}
              </span>
            </div>
            <div class="coord-item">
              <span class="coord-label">半径:</span>
              <span class="coord-value">{{ formatRadius(shapeRadius) }}</span>
            </div>
          </template>
          
          <template v-else-if="shapeType === 'rectangle'">
            <div class="coord-item">
              <span class="coord-label">西南角:</span>
              <span class="coord-value">
                {{ formatCoord(shapeBounds?.[0]) }}
              </span>
            </div>
            <div class="coord-item">
              <span class="coord-label">东北角:</span>
              <span class="coord-value">
                {{ formatCoord(shapeBounds?.[1]) }}
              </span>
            </div>
          </template>
          
          <template v-else-if="shapeType === 'polygon' || shapeType === 'polyline'">
            <div class="coord-item">
              <span class="coord-label">点数量:</span>
              <span class="coord-value">{{ shapePoints?.length || 0 }}</span>
            </div>
            <div v-if="shapePoints && shapePoints.length > 0" class="points-list">
              <details>
                <summary>查看所有点</summary>
                <div v-for="(point, index) in shapePoints" :key="index" class="point-item">
                  <span class="point-index">{{ index + 1 }}:</span>
                  <span class="point-coords">{{ formatCoord(point) }}</span>
                </div>
              </details>
            </div>
          </template>
        </div>
      </div>
    </slot>

    <!-- 添加指向shape的小三角形 -->
    <div class="sc-map-shape-popup-arrow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { ShapeType } from '../plugin/Shape';
import type { Map as LeafletMap } from 'leaflet';

// 定义props
const props = defineProps({
  // 形状自定义数据
  shapeData: {
    type: Object,
    default: () => ({})
  },
  // 形状类型
  shapeType: {
    type: String,
    default: ''
  },
  // 形状选项
  shapeOptions: {
    type: Object,
    default: null
  },
  // 形状ID
  shapeId: {
    type: String,
    default: ''
  },
  // 形状中心点或位置
  center: {
    type: Array,
    default: () => []
  },
  // 可见性
  visible: {
    type: Boolean,
    default: false
  },
  // 地图实例
  map: {
    type: Object as () => LeafletMap | null,
    default: null
  }
});

// 定义事件
const emit = defineEmits(['close', 'update:visible']);

// 形状数据
const shapeCenter = ref<[number, number] | null>(null);
const shapeRadius = ref<number | null>(null);
const shapeBounds = ref<[[number, number], [number, number]] | null>(null);
const shapePoints = ref<[number, number][] | null>(null);

// 计算形状标题
const shapeTitle = computed(() => {
  if (props.shapeData?.title) return props.shapeData.title;
  if (props.shapeOptions?.title) return props.shapeOptions.title;
  
  return `${shapeTypeText.value}详情`;
});

// 计算形状类型文字
const shapeTypeText = computed(() => {
  switch (props.shapeType) {
    case ShapeType.CIRCLE:
      return '圆形';
    case ShapeType.RECTANGLE:
      return '矩形';
    case ShapeType.POLYGON:
      return '多边形';
    case ShapeType.POLYLINE:
      return '折线';
    default:
      return '形状';
  }
});

// 更新形状数据
const updateShapeData = () => {
  if (!props.shapeData) return;
  
  try {
    // 根据形状类型提取不同数据
    switch (props.shapeType) {
      case ShapeType.CIRCLE:
        shapeCenter.value = props.shapeData.center || props.center;
        shapeRadius.value = props.shapeData.radius || 0;
        break;
        
      case ShapeType.RECTANGLE:
        shapeBounds.value = props.shapeData.bounds;
        break;
        
      case ShapeType.POLYGON:
      case ShapeType.POLYLINE:
        shapePoints.value = props.shapeData.points || [];
        break;
    }
  } catch (e) {
    console.error('从shape获取数据失败:', e);
  }
};

// 监听shapeData变化
watch(() => props.shapeData, (newData) => {
  if (newData) {
    updateShapeData();
  }
}, { immediate: true });

// 监听visible变化，确保在显示时获取最新数据
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.shapeData) {
    updateShapeData();
  }
});

// 组件挂载时确保数据已更新
onMounted(() => {
  if (props.visible && props.shapeData) {
    updateShapeData();
  }
});

// 计算弹框位置
const popupPosition = computed(() => {
  if (!props.map || !props.center || !props.center.length) {
    return { top: 0, left: 0 };
  }
  
  try {
    debugger
    // 将地理坐标转换为像素坐标
    const point = props.map.latLngToContainerPoint({
      lat: props.center[0] as number,
      lng: props.center[1] as number
    });
    
    // 获取容器的位置
    const container = props.map.getContainer();
    const rect = container.getBoundingClientRect();
    
    // 计算绝对位置
    const left = rect.left + point.x;
    const top = rect.top + point.y;
    
    return {
      left,
      top: top - 10 // 向上偏移一点，让箭头指向中心点
    };
  } catch (e) {
    console.error('计算形状弹框位置失败:', e);
    return { top: 0, left: 0 };
  }
});

// 计算popup样式
const popupStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: popupPosition.value.left + 'px',
    top: popupPosition.value.top + 'px',
    transform: 'translate(-50%, -95%)', // 调整垂直偏移，使弹框更贴近形状
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
        // 更新数据并强制更新组件
        updateShapeData();
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

// 格式化坐标值
const formatCoord = (coord: [number, number] | undefined): string => {
  if (!coord || coord.length < 2) return '-';
  return `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`;
};

// 格式化中心点
const formatCenter = (center: [number, number] | null): string => {
  if (!center || center.length < 2) return '-';
  return `${center[0].toFixed(6)}, ${center[1].toFixed(6)}`;
};

// 格式化半径，转换为公里或米
const formatRadius = (radius: number | null): string => {
  if (radius === null) return '-';
  
  if (radius >= 1000) {
    return `${(radius / 1000).toFixed(2)} 公里`;
  }
  return `${Math.round(radius)} 米`;
};
</script>

<style scoped>
.sc-map-shape-popup {
  padding: 12px;
  min-width: 200px;
  max-width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.sc-map-shape-popup-close {
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

.sc-map-shape-popup-close:hover {
  background-color: #f0f0f0;
  color: #666;
}

.sc-map-shape-popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  padding-right: 20px; /* 为关闭按钮留出空间 */
}

.sc-map-shape-popup-content {
  margin-bottom: 10px;
}

.sc-map-shape-popup-type {
  font-size: 14px;
  background-color: #f3f3f3;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 10px;
  display: inline-block;
  color: #666;
  font-weight: 500;
}

.sc-map-shape-popup-coords {
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

.points-list {
  margin-top: 6px;
  font-size: 12px;
}

.points-list summary {
  cursor: pointer;
  color: #2196f3;
  font-weight: 500;
  margin-bottom: 6px;
}

.point-item {
  padding: 2px 0;
  display: flex;
  border-bottom: 1px dotted #eee;
}

.point-index {
  width: 24px;
  color: #888;
}

.point-coords {
  font-family: monospace;
}

/* 添加小三角形样式 */
.sc-map-shape-popup-arrow {
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