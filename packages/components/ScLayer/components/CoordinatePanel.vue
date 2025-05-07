/**
 * 坐标面板组件
 * 显示当前鼠标位置的坐标信息
 */
<template>
  <div class="coordinate-panel" :class="{ 
    'active': active,
    'top-left': coordinateInfo.position === 'top-left',
    'top-right': coordinateInfo.position === 'top-right',
    'bottom-left': coordinateInfo.position === 'bottom-left',
    'bottom-right': coordinateInfo.position === 'bottom-right' || !coordinateInfo.position
  }">
    <div class="panel-content">
      <div class="coordinate-group">
        <div class="coordinate-label">经度:</div>
        <div class="coordinate-value" :title="`${formatCoordinate(coordinateInfo.longitude, coordinateInfo.decimals)}°E`">
          {{ formatCoordinate(currentCoords.longitude, displayDecimals) }}°E
        </div>
      </div>
      <div class="coordinate-group">
        <div class="coordinate-label">纬度:</div>
        <div class="coordinate-value" :title="`${formatCoordinate(coordinateInfo.latitude, coordinateInfo.decimals)}°N`">
          {{ formatCoordinate(currentCoords.latitude, displayDecimals) }}°N
        </div>
      </div>
      <template v-if="showProjected">
        <div class="coordinate-group">
          <div class="coordinate-label">X:</div>
          <div class="coordinate-value" :title="`${formatCoordinate(coordinateInfo.projectedX, coordinateInfo.decimals)}`">
            {{ formatCoordinate(currentCoords.projectedX, displayDecimals) }}
          </div>
        </div>
        <div class="coordinate-group">
          <div class="coordinate-label">Y:</div>
          <div class="coordinate-value" :title="`${formatCoordinate(coordinateInfo.projectedY, coordinateInfo.decimals)}`">
            {{ formatCoordinate(currentCoords.projectedY, displayDecimals) }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { CoordinateInfo } from '../composables/CoordinateObject';

const props = defineProps({
  /**
   * 是否激活
   */
  active: {
    type: Boolean,
    default: false
  },
  /**
   * 坐标信息
   */
  coordinateInfo: {
    type: Object as () => CoordinateInfo,
    required: true,
    default: () => ({
      longitude: 0,
      latitude: 0,
      projectedX: 0,
      projectedY: 0,
      projection: 'EPSG:3857',
      decimals: 12,
      position: 'bottom-right'
    })
  },
  /**
   * 是否显示投影坐标
   */
  showProjected: {
    type: Boolean,
    default: false
  }
});

// 使用响应式引用保存当前坐标，不直接使用props，避免父组件不更新的问题
const currentCoords = ref<CoordinateInfo>({
  longitude: props.coordinateInfo.longitude || 0,
  latitude: props.coordinateInfo.latitude || 0,
  projectedX: props.coordinateInfo.projectedX || 0,
  projectedY: props.coordinateInfo.projectedY || 0,
  projection: props.coordinateInfo.projection || 'EPSG:3857',
  decimals: props.coordinateInfo.decimals || 6,
  position: props.coordinateInfo.position || 'bottom-right'
});

// 显示的小数位数，为了确保完整显示，可以在界面上显示较少的小数位
const displayDecimals = computed(() => {
  return Math.min(6, currentCoords.value.decimals || 6);
});

// 保留close事件，用于外部控制关闭
defineEmits(['close']);

/**
 * 格式化坐标，保留指定小数位
 */
const formatCoordinate = (value: number, digits: number = 6): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.000000';
  }
  return value.toFixed(digits);
};

// 监听props中坐标信息的变化
watch(() => props.coordinateInfo, (newValue) => {
  if (newValue) {
    // 更新当前显示的坐标
    currentCoords.value = {
      longitude: newValue.longitude || 0,
      latitude: newValue.latitude || 0,
      projectedX: newValue.projectedX || 0,
      projectedY: newValue.projectedY || 0,
      projection: newValue.projection || 'EPSG:3857',
      decimals: newValue.decimals || 6,
      position: newValue.position || 'bottom-right'
    };
  }
}, { 
  deep: true,  // 深度监听对象内部属性变化
  immediate: true  // 立即执行一次
});

// 组件挂载时初始化
onMounted(() => {
  // 初始化当前坐标
  currentCoords.value = { ...props.coordinateInfo };
});
</script>

<style lang="scss" scoped>
.coordinate-panel {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  pointer-events: auto !important;
  z-index: 2500 !important;
  border: 1px solid rgba(220, 220, 220, 0.8);
  overflow: hidden;
  transition: all 0.25s ease;
  opacity: 0;
  transform: translateY(10px);
  visibility: hidden;
  min-width: 180px;
  max-width: 240px;
  width: auto;
  padding: 8px 10px;
  
  &.active {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }

  // 左上角
  &.top-left {
    top: 15px;
    left: 15px;
  }
  
  // 右上角
  &.top-right {
    top: 15px;
    right: 15px;
  }
  
  // 左下角
  &.bottom-left {
    bottom: 15px;
    left: 15px;
  }
  
  // 右下角（默认）
  &.bottom-right {
    bottom: 15px;
    right: 15px;
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .coordinate-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      
      .coordinate-label {
        font-size: 10px;
        color: #666;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        min-width: 40px;
      }
      
      .coordinate-value {
        color: #1976D2;
        font-size: 10px;
        font-family: 'Roboto Mono', 'Courier New', monospace;
        font-weight: 500;
        background-color: rgba(240, 245, 250, 0.9);
        padding: 3px 4px;
        border-radius: 4px;
        border: 1px solid rgba(25, 118, 210, 0.1);
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        cursor: default;
        flex: 1;
        margin-left: 5px;
      }
    }
  }
}
</style>