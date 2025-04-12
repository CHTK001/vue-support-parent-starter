<template>
  <div v-if="show" class="mouse-position">
    <div class="position-content">
      <span>{{ formatPosition }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';

interface MousePositionProps {
  show?: boolean;
  position?: [number, number];
  format?: 'dms' | 'decimal' | 'utm'; // 坐标显示格式
  precision?: number; // 小数点位数
}

const props = withDefaults(defineProps<MousePositionProps>(), {
  show: false,
  position: () => [0, 0],
  format: 'decimal',
  precision: 6
});

// 格式化坐标
const formatPosition = computed(() => {
  const [lat, lng] = props.position;

  // 根据格式显示坐标
  if (props.format === 'dms') {
    // DMS (度分秒) 格式
    return `${formatDMS(lat, 'lat')}, ${formatDMS(lng, 'lng')}`;
  } else if (props.format === 'utm') {
    // UTM格式 (简化版)
    return `UTM: ${Math.floor(lat * 111319.9)}N, ${Math.floor(lng * 111319.9)}E`;
  } else {
    // 默认小数格式
    return `${lat.toFixed(props.precision)}, ${lng.toFixed(props.precision)}`;
  }
});

// 将小数度转换为度分秒格式
function formatDMS(value: number, type: 'lat' | 'lng') {
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  const seconds = ((absValue - degrees - minutes / 60) * 3600).toFixed(2);
  const direction = type === 'lat' 
    ? (value >= 0 ? 'N' : 'S') 
    : (value >= 0 ? 'E' : 'W');
  
  return `${degrees}°${minutes}'${seconds}"${direction}`;
}
</script>

<style scoped>
/* 鼠标位置信息样式 */
.mouse-position {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 490;
  pointer-events: none;
}

.position-content {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #333;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}
</style> 