/**
 * 坐标面板组件
 * @description 显示地图上的坐标信息
 */
<template>
  <div class="coordinate-panel" :class="[positionClass, { active }]">
    <div class="coordinate-inner">
      <span class="coordinate-label">经度:</span>
      <span class="coordinate-value">{{ formatCoordinate(coordinateInfo.lng || 0) }}</span>
      <span class="coordinate-label">纬度:</span>
      <span class="coordinate-value">{{ formatCoordinate(coordinateInfo.lat || 0) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CoordinateInfo, CoordinatePosition } from '../composables/CoordinateObject';

const props = withDefaults(defineProps<{
  active: boolean;
  coordinateInfo: CoordinateInfo;
  showProjected?: boolean;
}>(), {
  active: false,
  showProjected: true
});

// 计算位置类
const positionClass = computed(() => {
  const position = props.coordinateInfo.position || 'bottom-right';
  return `position-${position}`;
});

// 格式化坐标值
const formatCoordinate = (value: number): string => {
  if (value === undefined) {
    return '未知';
  }
  const decimals = props.coordinateInfo.decimals || 6;
  return value.toFixed(decimals);
};
</script>

<style scoped>
.coordinate-panel {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-family: monospace;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-width: 300px;
  pointer-events: none;
  display: none;
}

.coordinate-panel.active {
  display: block;
}

.coordinate-inner {
  display: grid;
  grid-template-columns: auto auto;
  gap: 4px 8px;
  align-items: center;
}

.coordinate-label {
  color: #666;
  font-weight: 500;
}

.coordinate-value {
  font-weight: bold;
}

/* 位置样式 */
.position-top-left {
  top: 10px;
  left: 10px;
}

.position-top-right {
  top: 10px;
  right: 10px;
}

.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.position-bottom-right {
  bottom: 10px;
  right: 10px;
}
</style> 

<script lang="ts">
export default {
  name: 'CoordinatePanel'
};
</script> 